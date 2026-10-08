import type { FastifyInstance } from 'fastify';
import { phoneCodeSchema, phoneVerifySchema } from '@ludoskul/shared';
import { getPrisma } from '../modules/auth/db.js';
import { encryptTarget, errorBody } from '../modules/auth/crypto.js';
import { sendFailure } from '../modules/auth/otp.js';
import { issueSession } from '../modules/auth/session.js';
import { authSchemas } from './auth-schemas.js';
import { ensureUniquePseudo } from '../modules/auth/users.js';
import { normalizePhone, phoneHash, sendPhoneCode, verifyPhoneCode } from '../modules/phone/otp-phone.js';

/**
 * BE-2.4 Téléphone/WhatsApp OTP + fallback SMS (08b-§4).
 * - POST phone/code : normalise E.164, WhatsApp d'abord puis SMS même code.
 * - POST phone/verify : lie/crée User + Identity phone + tokens.
 */

export async function phoneRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/auth/phone/code', { schema: authSchemas.phoneCode }, async (req, reply) => {
        const parsed = phoneCodeSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('PHONE_INVALID', 'Numéro invalide. Vérifie le format international.'));
        }
        const e164 = normalizePhone(parsed.data.phone);
        if (!e164) {
            return reply.status(400).send(errorBody('PHONE_INVALID', 'Numéro invalide. Vérifie le format international.'));
        }
        const result = await sendPhoneCode(e164, parsed.data.channel);
        if ('status' in result) return sendFailure(reply, result);
        const body: { sent: boolean; channel: string; expiresIn: number; resendIn: number; debug?: unknown } = {
            sent: result.sent,
            channel: result.channel,
            expiresIn: result.expiresIn,
            resendIn: result.resendIn,
        };
        if (result.debug) body.debug = result.debug;
        return body;
    });

    app.post('/api/auth/phone/verify', { schema: authSchemas.phoneVerify }, async (req, reply) => {
        const parsed = phoneVerifySchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('PHONE_INVALID', 'Numéro ou code invalide.'));
        }
        const e164 = normalizePhone(parsed.data.phone);
        if (!e164) {
            return reply.status(400).send(errorBody('PHONE_INVALID', 'Numéro invalide. Vérifie le format international.'));
        }
        const checked = await verifyPhoneCode(e164, parsed.data.code);
        if ('status' in checked) return sendFailure(reply, checked);
        const prisma = getPrisma();
        const hash = phoneHash(e164);
        const existing = await prisma.identity.findUnique({ where: { phoneHash: hash }, select: { userId: true } });
        let userId: string;
        let created = false;
        if (existing) {
            userId = existing.userId;
            await prisma.identity.updateMany({ where: { userId, phoneHash: hash }, data: { lastUsedAt: new Date() } });
        } else {
            const pseudo = await ensureUniquePseudo(parsed.data.pseudo ?? `Tel_${e164.slice(-4)}`);
            const user = await prisma.user.create({ data: { pseudo }, select: { id: true } });
            userId = user.id;
            created = true;
            await prisma.identity.create({
                data: {
                    userId,
                    provider: 'phone',
                    providerSub: `phone:${hash.slice(0, 24)}`,
                    phoneHash: hash,
                    phoneE164Encrypted: encryptTarget(e164),
                    phoneVerifiedAt: new Date(),
                },
            });
        }
        const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id);
        return reply.status(created ? 201 : 200).send({
            user: { id: user.id, pseudo: user.pseudo, level: user.level, xp: user.xp },
            accessToken,
            refreshExpiresAt,
        });
    });
}
