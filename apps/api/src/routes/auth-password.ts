import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { loginSchema, passwordForgotSchema, passwordResetSchema, registerSchema } from '@ludoskul/shared';
import { getPrisma } from '../modules/auth/db.js';
import { errorBody, normalizeEmail } from '../modules/auth/crypto.js';
import { sendEmailCode, sendFailure, verifyEmailCode } from '../modules/auth/otp.js';
import { issueSession } from '../modules/auth/session.js';
import {
    createUserWithEmailIdentity,
    ensureUniquePseudo,
    findUserByEmail,
    linkEmailIdentity,
} from '../modules/auth/users.js';

/**
 * BE-2.2 Email password register/login + reset (08-§2, 08b-§4, 10-§2).
 * - bcrypt 12, jamais loggé ; INVALID_CREDENTIALS générique (anti-énumération).
 * - Reset via OTP email BE-2.1 (TTL 15 min) ; invalide l'ancien password.
 * - Partage l'Identity email avec BE-2.1.
 */

const BCRYPT_ROUNDS = 12;

function weakPassword(password: string): boolean {
    return password.length < 8 || !/[0-9]/.test(password);
}

export async function passwordRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/auth/register', async (req, reply) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Inscription invalide'));
        }
        const email = normalizeEmail(parsed.data.email);
        if (weakPassword(parsed.data.password)) {
            return reply.status(400).send(errorBody('WEAK_PASSWORD', 'Mot de passe : 8 caractères minimum + 1 chiffre'));
        }
        const prisma = getPrisma();
        if (await findUserByEmail(email)) {
            return reply.status(409).send(errorBody('EMAIL_TAKEN', 'Cet email est déjà utilisé'));
        }
        const pseudoTaken =
            (await prisma.user.findUnique({ where: { pseudo: parsed.data.pseudo }, select: { id: true } })) ??
            (await prisma.deletedPseudo.findUnique({ where: { pseudo: parsed.data.pseudo }, select: { id: true } }));
        if (pseudoTaken) {
            return reply.status(409).send(errorBody('PSEUDO_TAKEN', 'Ce pseudo est déjà pris'));
        }
        const pseudo = await ensureUniquePseudo(parsed.data.pseudo);
        const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
        const { id } = await createUserWithEmailIdentity(email, pseudo, passwordHash);
        const user = await prisma.user.findUniqueOrThrow({ where: { id } });
        const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id);
        return reply.status(201).send({
            user: { id: user.id, pseudo: user.pseudo, level: user.level, xp: user.xp },
            accessToken,
            refreshExpiresAt,
        });
    });

    app.post('/api/auth/login', async (req, reply) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Identifiants invalides'));
        }
        const prisma = getPrisma();
        const login = parsed.data.emailOrPseudo.trim();
        const byEmail = login.includes('@') ? await findUserByEmail(normalizeEmail(login)) : null;
        const user = byEmail
            ? await prisma.user.findUnique({ where: { id: byEmail.id } })
            : await prisma.user.findUnique({ where: { pseudo: login } });
        const hash = user?.passwordHash ?? null;
        const valid = hash ? await bcrypt.compare(parsed.data.password, hash) : false;
        if (!user || !valid) {
            await bcrypt.compare(parsed.data.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinva1');
            return reply.status(401).send(errorBody('INVALID_CREDENTIALS', 'Email/pseudo ou mot de passe incorrect'));
        }
        await linkEmailIdentity(user.id, user.email ?? normalizeEmail(`${user.pseudo}@local`)).catch(() => undefined);
        const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id);
        return {
            user: { id: user.id, pseudo: user.pseudo, level: user.level, xp: user.xp },
            accessToken,
            refreshExpiresAt,
        };
    });

    app.post('/api/auth/password/forgot', async (req, reply) => {
        const parsed = passwordForgotSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Email invalide'));
        }
        const email = normalizeEmail(parsed.data.email);
        const result = await sendEmailCode(email, 'reset_password');
        if ('status' in result) return sendFailure(reply, result);
        const body: { sent: boolean; expiresIn: number; resendIn: number; debug?: unknown } = {
            sent: true,
            expiresIn: result.expiresIn,
            resendIn: result.resendIn,
        };
        if (result.debug) body.debug = result.debug;
        return body;
    });

    app.post('/api/auth/password/reset', async (req, reply) => {
        const parsed = passwordResetSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Réinitialisation invalide'));
        }
        if (weakPassword(parsed.data.newPassword)) {
            return reply.status(400).send(errorBody('WEAK_PASSWORD', 'Mot de passe : 8 caractères minimum + 1 chiffre'));
        }
        const email = normalizeEmail(parsed.data.email);
        const checked = await verifyEmailCode(email, parsed.data.code);
        if ('status' in checked) return sendFailure(reply, checked);
        const prisma = getPrisma();
        const existing = await findUserByEmail(email);
        if (!existing) {
            return reply.status(200).send({ reset: true });
        }
        const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);
        await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
        await prisma.authRefresh.updateMany({ where: { userId: existing.id, revokedAt: null }, data: { revokedAt: new Date() } });
        return { reset: true };
    });
}
