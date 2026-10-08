import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { deleteMeSchema, patchMeSchema } from '@ludoskul/shared';
import { getPrisma } from '../modules/auth/db.js';
import { errorBody } from '../modules/auth/crypto.js';
import { verifyEmailCode } from '../modules/auth/otp.js';
import { exchangeCode } from '../modules/oauth/provider.js';
import { requireUserId } from '../modules/auth/session.js';

/**
 * BE-2.9 Profil lecture/MAJ/suppression (08-§2, 08b-§5, 10-§3).
 * - GET me : profil + guest/rankingPublic/providers/devices/isChild.
 * - PATCH me : pseudo/avatar/country/theme/accessibility (+validation).
 * - DELETE me : vérification 2nd facteur (password|OTP|OAuth) + cascade +
 *   DeletedPseudo 30j + libération email/phone immédiate.
 */

export async function profileRoutes(app: FastifyInstance): Promise<void> {
    app.get('/api/auth/me', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const prisma = getPrisma();
        const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const identities = await prisma.identity.findMany({ where: { userId }, select: { provider: true } });
        const deviceCount = await prisma.device.count({ where: { userId, revokedAt: null } });
        return {
            id: user.id,
            email: user.email,
            pseudo: user.pseudo,
            avatarId: user.avatarId,
            country: user.country,
            xp: user.xp,
            level: user.level,
            theme: user.theme,
            accessibility: user.accessibility,
            guest: user.guest,
            rankingPublic: user.rankingPublic,
            isChild: user.isChild,
            providers: [...new Set(identities.map((i) => i.provider))],
            devices: deviceCount,
        };
    });

    app.patch('/api/auth/me', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const parsed = patchMeSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Mise à jour invalide'));
        }
        const prisma = getPrisma();
        if (parsed.data.pseudo) {
            const clash =
                (await prisma.user.findFirst({ where: { pseudo: parsed.data.pseudo, id: { not: userId } }, select: { id: true } })) ??
                (await prisma.deletedPseudo.findUnique({ where: { pseudo: parsed.data.pseudo }, select: { id: true } }));
            if (clash) {
                return reply.status(409).send(errorBody('PSEUDO_TAKEN', 'Ce pseudo est déjà pris'));
            }
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                pseudo: parsed.data.pseudo,
                avatarId: parsed.data.avatarId,
                country: parsed.data.country,
                theme: parsed.data.theme,
                accessibility: (parsed.data.accessibility ?? undefined) as Prisma.InputJsonValue | undefined,
            },
        });
        return { id: user.id, pseudo: user.pseudo, avatarId: user.avatarId, country: user.country, theme: user.theme, accessibility: user.accessibility };
    });

    app.delete('/api/auth/me', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const parsed = deleteMeSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Vérification requise pour supprimer ton compte'));
        }
        const prisma = getPrisma();
        const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
        let verified = false;
        if (parsed.data.password && user.passwordHash) {
            verified = await bcrypt.compare(parsed.data.password, user.passwordHash);
        } else if (parsed.data.otp) {
            const { normalizeEmail } = await import('../modules/auth/crypto.js');
            const checked = await verifyEmailCode(normalizeEmail(parsed.data.otp.email), parsed.data.otp.code);
            verified = !('status' in checked);
        } else if (parsed.data.oauth) {
            const profile = await exchangeCode(parsed.data.oauth.provider, parsed.data.oauth.code, 'delete');
            verified = !!profile?.emailVerified;
        }
        if (!verified) {
            return reply.status(403).send(errorBody('FORBIDDEN', 'Vérification échouée. Suppression annulée.'));
        }
        await prisma.deletedPseudo.create({
            data: { pseudo: user.pseudo, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        });
        await prisma.user.delete({ where: { id: userId } });
        reply.clearCookie('refreshToken', { path: '/api/auth' });
        return reply.status(204).send();
    });
}
