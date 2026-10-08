import type { FastifyInstance } from 'fastify';
import { guestSchema, guestUpgradeSchema, type upgradeProofSchema } from '@ludoskul/shared';
import { z } from 'zod';
import { getPrisma } from '../modules/auth/db.js';
import { encryptTarget, errorBody, normalizeEmail } from '../modules/auth/crypto.js';
import { issueSession, requireUserId } from '../modules/auth/session.js';
import { verifyEmailCode, type OtpFailure } from '../modules/auth/otp.js';
import { normalizePhone, phoneHash, verifyPhoneCode } from '../modules/phone/otp-phone.js';
import { exchangeCode } from '../modules/oauth/provider.js';
import { ensureUniquePseudo, findUserByEmail } from '../modules/auth/users.js';

type UpgradeProof = z.infer<typeof upgradeProofSchema>;
type UpgradeIdentity =
    | { provider: 'email'; providerSub: string; emailLower: string }
    | { provider: 'phone'; providerSub: string; phoneHashValue: string; phoneEncrypted: string }
    | { provider: 'google' | 'apple'; providerSub: string; emailLower: string | null };

async function resolveUpgradeProof(
    proof: UpgradeProof,
): Promise<{ targetUserId: string | null; identityData: UpgradeIdentity } | OtpFailure | { status: number; code: string; message: string }> {
    const prisma = getPrisma();
    if (proof.type === 'email') {
        const email = normalizeEmail(proof.email);
        const checked = await verifyEmailCode(email, proof.code);
        if ('status' in checked) return checked;
        const owner = await findUserByEmail(email);
        return { targetUserId: owner?.id ?? null, identityData: { provider: 'email', providerSub: `email:${email}`, emailLower: email } };
    }
    if (proof.type === 'phone') {
        const e164 = normalizePhone(proof.phone);
        if (!e164) return { status: 400, code: 'PHONE_INVALID', message: 'Numéro invalide.' };
        const checked = await verifyPhoneCode(e164, proof.code);
        if ('status' in checked) return checked;
        const hash = phoneHash(e164);
        const owner = await prisma.identity.findUnique({ where: { phoneHash: hash }, select: { userId: true } });
        return {
            targetUserId: owner?.userId ?? null,
            identityData: { provider: 'phone', providerSub: `phone:${hash.slice(0, 24)}`, phoneHashValue: hash, phoneEncrypted: encryptTarget(e164) },
        };
    }
    const profile = await exchangeCode(proof.provider, proof.code, 'upgrade');
    if (!profile || !profile.emailVerified) {
        return { status: 422, code: 'PROVIDER_ERROR', message: 'Preuve OAuth invalide. Réessaie.' };
    }
    const owner = await prisma.identity.findUnique({
        where: { provider_providerSub: { provider: proof.provider, providerSub: profile.sub } },
        select: { userId: true },
    });
    return {
        targetUserId: owner?.userId ?? null,
        identityData: {
            provider: proof.provider,
            providerSub: profile.sub,
            emailLower: profile.isRelay ? null : normalizeEmail(profile.email),
        },
    };
}

/**
 * BE-2.5 Invité + upgrade sans perte (08b-§4).
 * - POST guest : User guest=true + Device léger + tokens (guestToken = refresh).
 * - POST guest/upgrade (****** guest + preuve provider) : merge transactionnel
 *   (xp/sessions/answers/progress/badges réassignés, guest=false, Identity liée).
 *   Idempotent : 2e upgrade → 200 même user.
 */

export async function guestRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/auth/guest', async (req, reply) => {
        const parsed = guestSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Pseudo invalide (3-16, lettres/chiffres/_/-)'));
        }
        const prisma = getPrisma();
        const pseudo = await ensureUniquePseudo(parsed.data.pseudo);
        const user = await prisma.user.create({ data: { pseudo, guest: true }, select: { id: true, pseudo: true } });
        const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id, 'invité');
        return reply.status(201).send({
            user: { id: user.id, pseudo: user.pseudo, guest: true },
            accessToken,
            refreshExpiresAt,
        });
    });

    app.post('/api/auth/guest/upgrade', async (req, reply) => {
        const guestId = await requireUserId(req, reply);
        if (!guestId) return;
        const parsed = guestUpgradeSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Preuve de compte requise'));
        }
        const prisma = getPrisma();
        const guest = await prisma.user.findUnique({ where: { id: guestId } });
        if (!guest) {
            return reply.status(401).send(errorBody('UNAUTHORIZED', 'Session invité introuvable'));
        }
        if (!guest.guest) {
            const { accessToken, refreshExpiresAt } = await issueSession(reply, guest.id, 'appareil');
            return { upgraded: true, already: true, user: { id: guest.id, pseudo: guest.pseudo }, accessToken, refreshExpiresAt };
        }
        const proof = parsed.data.proof;
        const resolved = await resolveUpgradeProof(proof);
        if ('status' in resolved) {
            const { sendFailure } = await import('../modules/auth/otp.js');
            return sendFailure(reply, resolved);
        }
        const { targetUserId, identityData } = resolved;

        if (targetUserId && targetUserId !== guestId) {
            await mergeGuestIntoUser(guestId, targetUserId, identityData);
            const user = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });
            const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id);
            return { upgraded: true, user: { id: user.id, pseudo: user.pseudo }, accessToken, refreshExpiresAt };
        }
        await prisma.$transaction(async (tx) => {
            await tx.user.update({ where: { id: guestId }, data: { guest: false } });
            if (identityData.provider === 'email') {
                await tx.user.update({ where: { id: guestId }, data: { email: identityData.emailLower } });
                await tx.identity.create({
                    data: {
                        userId: guestId,
                        provider: 'email',
                        providerSub: identityData.providerSub,
                        emailLower: identityData.emailLower,
                        emailVerifiedAt: new Date(),
                    },
                });
            } else if (identityData.provider === 'phone') {
                await tx.identity.create({
                    data: {
                        userId: guestId,
                        provider: 'phone',
                        providerSub: identityData.providerSub,
                        phoneHash: identityData.phoneHashValue,
                        phoneE164Encrypted: identityData.phoneEncrypted,
                        phoneVerifiedAt: new Date(),
                    },
                });
            } else {
                await tx.identity.create({
                    data: {
                        userId: guestId,
                        provider: identityData.provider,
                        providerSub: identityData.providerSub,
                        emailLower: identityData.emailLower,
                        emailVerifiedAt: new Date(),
                    },
                });
            }
        });
        const user = await prisma.user.findUniqueOrThrow({ where: { id: guestId } });
        const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id);
        return { upgraded: true, user: { id: user.id, pseudo: user.pseudo }, accessToken, refreshExpiresAt };
    });
}

/** Merge guest → cible : réassigne tout en transaction, supprime le guest. */
export async function mergeGuestIntoUser(guestId: string, targetId: string, identityData: UpgradeIdentity | null): Promise<void> {
    const prisma = getPrisma();
    await prisma.$transaction(async (tx) => {
        const guest = await tx.user.findUniqueOrThrow({ where: { id: guestId } });
        await tx.session.updateMany({ where: { userId: guestId }, data: { userId: targetId } });
        await tx.ranking.updateMany({ where: { userId: guestId }, data: { userId: targetId } });
        await tx.progress.updateMany({ where: { userId: guestId }, data: { userId: targetId } });
        await tx.userBadge.updateMany({ where: { userId: guestId }, data: { userId: targetId } });
        await tx.device.updateMany({ where: { userId: guestId }, data: { userId: targetId } });
        await tx.authRefresh.updateMany({ where: { userId: guestId }, data: { userId: targetId } });
        await tx.family.updateMany({ where: { parentUserId: guestId }, data: { parentUserId: targetId } });
        await tx.user.update({ where: { id: targetId }, data: { xp: { increment: guest.xp } } });
        if (identityData?.provider === 'email') {
            const clash = await tx.identity.findUnique({ where: { emailLower: identityData.emailLower } });
            if (!clash) {
                await tx.identity.create({
                    data: {
                        userId: targetId,
                        provider: 'email',
                        providerSub: identityData.providerSub,
                        emailLower: identityData.emailLower,
                        emailVerifiedAt: new Date(),
                    },
                });
                await tx.user.update({ where: { id: targetId }, data: { email: identityData.emailLower } });
            }
        } else if (identityData?.provider === 'phone') {
            const clash = await tx.identity.findUnique({ where: { phoneHash: identityData.phoneHashValue } });
            if (!clash) {
                await tx.identity.create({
                    data: {
                        userId: targetId,
                        provider: 'phone',
                        providerSub: identityData.providerSub,
                        phoneHash: identityData.phoneHashValue,
                        phoneE164Encrypted: identityData.phoneEncrypted,
                        phoneVerifiedAt: new Date(),
                    },
                });
            }
        } else if (identityData) {
            const clash = await tx.identity.findUnique({
                where: { provider_providerSub: { provider: identityData.provider, providerSub: identityData.providerSub } },
            });
            if (!clash) {
                await tx.identity.create({
                    data: {
                        userId: targetId,
                        provider: identityData.provider,
                        providerSub: identityData.providerSub,
                        emailLower: identityData.emailLower,
                        emailVerifiedAt: new Date(),
                    },
                });
            }
        }
        await tx.user.delete({ where: { id: guestId } });
    });
}
