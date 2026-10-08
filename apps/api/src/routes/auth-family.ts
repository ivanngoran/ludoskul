import type { FastifyInstance } from 'fastify';
import { familyChildSchema, familyJoinQuerySchema, patchChildSchema } from '@ludoskul/shared';
import { z } from 'zod';
import { getPrisma } from '../modules/auth/db.js';
import {
    FAMILY_TOKEN_TTL_MS,
    REFRESH_TTL_MS,
    errorBody,
    randomToken,
    refreshTokenHash,
    sha256Hex,
    signAccessToken,
} from '../modules/auth/crypto.js';
import { REFRESH_COOKIE, refreshCookieOptions, requireUserId } from '../modules/auth/session.js';
import { ensureUniquePseudo } from '../modules/auth/users.js';

/**
 * BE-2.8 Famille + consentement + rankingPublic (08b-§2, 10-§2).
 * - POST family/children (****** parent vérifié) : crée User isChild + consentement.
 * - GET family/children : progression par enfant (arcade + training).
 * - POST family/invite : code/QR court 10 min one-shot (table OtpChallenge).
 * - GET family/join?token : connexion enfant sur appareil partagé.
 * - PATCH family/children/:id {rankingPublic} (parent seul, explicite).
 * - Règles FR 15 ans : jamais email/tél enfant ; rankingPublic=false défaut.
 */

export async function familyRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/family/children', async (req, reply) => {
        const parentId = await requireUserId(req, reply);
        if (!parentId) return;
        const parsed = familyChildSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Pseudo ou année de naissance invalide'));
        }
        const prisma = getPrisma();
        const parent = await prisma.user.findUnique({ where: { id: parentId }, select: { guest: true } });
        if (!parent || parent.guest) {
            return reply.status(403).send(errorBody('PARENTAL_CONSENT_REQUIRED', 'Un compte parent vérifié est requis pour créer un profil enfant'));
        }
        const pseudo = await ensureUniquePseudo(parsed.data.pseudo);
        const child = await prisma.user.create({
            data: {
                pseudo,
                birthYear: parsed.data.birthYear,
                isChild: true,
                parentId,
                rankingPublic: false,
            },
            select: { id: true, pseudo: true, birthYear: true, rankingPublic: true },
        });
        await prisma.family.create({ data: { parentUserId: parentId, childUserId: child.id, consentText: 'v1' } });
        return reply.status(201).send({ child });
    });

    app.get('/api/family/children', async (req, reply) => {
        const parentId = await requireUserId(req, reply);
        if (!parentId) return;
        const prisma = getPrisma();
        const children = await prisma.user.findMany({ where: { parentId }, select: { id: true, pseudo: true, birthYear: true, xp: true, level: true, rankingPublic: true } });
        const progress = await prisma.progress.findMany({ where: { userId: { in: children.map((c) => c.id) } } });
        return {
            children: children.map((c) => ({
                ...c,
                progress: progress.filter((p) => p.userId === c.id),
            })),
        };
    });

    app.post('/api/family/invite', async (req, reply) => {
        const parentId = await requireUserId(req, reply);
        if (!parentId) return;
        const parsed = z.object({ childId: z.string().min(1) }).safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Enfant requis'));
        }
        const prisma = getPrisma();
        const link = await prisma.family.findUnique({ where: { childUserId: parsed.data.childId } });
        if (!link || link.parentUserId !== parentId) {
            return reply.status(403).send(errorBody('FORBIDDEN', 'Cet enfant ne fait pas partie de ta famille'));
        }
        const token = randomToken(32);
        const now = Date.now();
        await prisma.otpChallenge.create({
            data: {
                purpose: 'family_join',
                channel: 'family',
                targetHash: sha256Hex(`family:${parsed.data.childId}`),
                targetEncrypted: `child:${parsed.data.childId}`,
                codeHash: 'family-join',
                tokenHash: sha256Hex(`family:${token}`),
                expiresAt: new Date(now + FAMILY_TOKEN_TTL_MS),
                resendAvailableAt: new Date(now),
            },
        });
        return { token, expiresIn: 600 };
    });

    app.get('/api/family/join', async (req, reply) => {
        const parsed = familyJoinQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Code famille invalide'));
        }
        const prisma = getPrisma();
        const challenge = await prisma.otpChallenge.findFirst({ where: { tokenHash: sha256Hex(`family:${parsed.data.token}`) } });
        if (!challenge || challenge.consumedAt) {
            return reply.status(422).send(errorBody('INVALID_OTP', 'Code famille invalide ou déjà utilisé. Demande un nouveau code au parent.'));
        }
        if (challenge.expiresAt.getTime() <= Date.now()) {
            return reply.status(422).send(errorBody('OTP_EXPIRED', 'Code famille expiré. Demande un nouveau code au parent.'));
        }
        const childId = (challenge.targetEncrypted ?? '').startsWith('child:') ? (challenge.targetEncrypted as string).slice('child:'.length) : null;
        if (!childId) {
            return reply.status(422).send(errorBody('INVALID_OTP', 'Code famille invalide ou déjà utilisé.'));
        }
        await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
        const child = await prisma.user.findUnique({ where: { id: childId } });
        if (!child) {
            return reply.status(404).send(errorBody('NOT_FOUND', 'Profil enfant introuvable'));
        }
        const accessToken = await signAccessToken(child.id);
        const refresh = randomToken();
        const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
        const device = await prisma.device.create({ data: { userId: child.id, label: 'appareil partagé' } });
        await prisma.authRefresh.create({
            data: { userId: child.id, deviceId: device.id, tokenHash: refreshTokenHash(refresh), expiresAt: refreshExpiresAt },
        });
        reply.setCookie(REFRESH_COOKIE, refresh, refreshCookieOptions());
        return { user: { id: child.id, pseudo: child.pseudo, isChild: true }, accessToken, refreshExpiresAt: refreshExpiresAt.toISOString() };
    });

    app.patch('/api/family/children/:id', async (req, reply) => {
        const parentId = await requireUserId(req, reply);
        if (!parentId) return;
        const parsed = patchChildSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Valeur rankingPublic requise'));
        }
        const prisma = getPrisma();
        const link = await prisma.family.findUnique({ where: { childUserId: (req.params as { id: string }).id } });
        if (!link || link.parentUserId !== parentId) {
            return reply.status(403).send(errorBody('FORBIDDEN', 'Cet enfant ne fait pas partie de ta famille'));
        }
        const child = await prisma.user.update({ where: { id: link.childUserId }, data: { rankingPublic: parsed.data.rankingPublic } });
        return { child: { id: child.id, pseudo: child.pseudo, rankingPublic: child.rankingPublic } };
    });
}
