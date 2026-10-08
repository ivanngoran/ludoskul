import type { FastifyInstance, FastifyReply } from 'fastify';
import { emailCodeSchema, emailVerifySchema, magicQuerySchema } from '@ludoskul/shared';
import { getPrisma } from '../modules/auth/db.js';
import { errorBody, normalizeEmail } from '../modules/auth/crypto.js';
import { consumeMagicToken, sendEmailCode, sendFailure, verifyEmailCode } from '../modules/auth/otp.js';
import { issueSession } from '../modules/auth/session.js';
import {
    createUserWithEmailIdentity,
    findUserByEmail,
    linkEmailIdentity,
    pseudoFromEmail,
} from '../modules/auth/users.js';

/**
 * BE-2.1 Email OTP code + verify + lien magique (08b-§4).
 * - POST email/code : toujours 200 générique (anti-énumération).
 * - POST email/verify : 5 essais max, fusion si emailLower vérifié existant.
 * - GET email/magic : one-shot, même TTL.
 */

async function signInWithEmail(reply: FastifyReply, email: string, pseudo?: string) {
    const existing = await findUserByEmail(email);
    const userId = existing
        ? ((await linkEmailIdentity(existing.id, email)), existing.id)
        : (await createUserWithEmailIdentity(email, pseudo ?? pseudoFromEmail(email))).id;
    const prisma = getPrisma();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id);
    return {
        created: !existing,
        payload: {
            user: { id: user.id, pseudo: user.pseudo, level: user.level, xp: user.xp },
            accessToken,
            refreshExpiresAt,
        },
    };
}

export async function emailOtpRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/auth/email/code', async (req, reply) => {
        const parsed = emailCodeSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Email invalide'));
        }
        const email = normalizeEmail(parsed.data.email);
        const result = await sendEmailCode(email, parsed.data.purpose);
        if ('status' in result) return sendFailure(reply, result);
        const body: { sent: boolean; expiresIn: number; resendIn: number; debug?: unknown } = {
            sent: true,
            expiresIn: result.expiresIn,
            resendIn: result.resendIn,
        };
        if (result.debug) body.debug = result.debug;
        return body;
    });

    app.post('/api/auth/email/verify', async (req, reply) => {
        const parsed = emailVerifySchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Code ou email invalide'));
        }
        const email = normalizeEmail(parsed.data.email);
        const checked = await verifyEmailCode(email, parsed.data.code);
        if ('status' in checked) return sendFailure(reply, checked);
        const { created, payload } = await signInWithEmail(reply, email, parsed.data.pseudo);
        return reply.status(created ? 201 : 200).send(payload);
    });

    app.get('/api/auth/email/magic', async (req, reply) => {
        const parsed = magicQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Lien invalide'));
        }
        const consumed = await consumeMagicToken(parsed.data.token);
        if ('status' in consumed) return sendFailure(reply, consumed);
        const { payload } = await signInWithEmail(reply, consumed.email);
        return payload;
    });
}
