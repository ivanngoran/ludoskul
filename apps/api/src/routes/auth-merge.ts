import type { FastifyInstance } from 'fastify';
import { mergeConfirmSchema } from '@ludoskul/shared';
import { getPrisma } from '../modules/auth/db.js';
import { errorBody, normalizeEmail } from '../modules/auth/crypto.js';
import { verifyEmailCode } from '../modules/auth/otp.js';
import { exchangeCode } from '../modules/oauth/provider.js';
import { requireUserId } from '../modules/auth/session.js';
import { mergeGuestIntoUser } from './auth-guest.js';

/**
 * BE-2.10 Fusion confirmée + suppression enfant (patch 16-P1, 08b-§4).
 * - POST auth/merge/confirm : fusion transactionnelle si email/phone vérifié
 *   identique des 2 côtés (garde le User le plus ancien, réassigne tout,
 *   supprime la source). Preuve fraîche <10 min (OTP consommé à l'instant ou
 *   OAuth code mock). Idempotent : 2e confirm → 200 already.
 * - DELETE family/children/:id : parent seul, cascade enfant + réserve pseudo 30j.
 */

export async function mergeRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/auth/merge/confirm', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const parsed = mergeConfirmSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Demande de fusion invalide'));
        }
        const prisma = getPrisma();
        const targetEmail = normalizeEmail(parsed.data.targetEmail);
        const me = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

        const proof = parsed.data.proof;
        const proofOk =
            proof.type === 'otp'
                ? !('status' in (await verifyEmailCode(targetEmail, proof.code)))
                : await (async () => {
                      const profile = await exchangeCode(proof.provider, proof.code, 'merge');
                      return !!profile?.emailVerified && normalizeEmail(profile.email) === targetEmail;
                  })();
        if (!proofOk) {
            return reply.status(422).send(errorBody('INVALID_OTP', 'Preuve expirée ou invalide. Recommence la vérification.'));
        }

        const targetIdentity = await prisma.identity.findUnique({ where: { emailLower: targetEmail }, select: { userId: true } });
        if (!targetIdentity) {
            return reply.status(409).send(errorBody('EMAIL_CONFLICT', 'Aucun compte vérifié avec cet email', { suggestedAction: 'use_other_account' }));
        }
        // La preuve fraîche (<10 min, OTP consommé à l'instant ou OAuth vérifié sur
        // targetEmail) EST la vérification côté demandeur : il contrôle targetEmail
        // maintenant. La source le possède vérifié (emailLower). Jamais auto.
        if (targetIdentity.userId === userId) {
            return { merged: true, already: true, user: { id: userId, pseudo: me.pseudo } };
        }
        const source = await prisma.user.findUniqueOrThrow({ where: { id: targetIdentity.userId } });
        const target = me.createdAt <= source.createdAt ? me : source;
        const other = target.id === me.id ? source : me;
        await mergeGuestIntoUser(other.id, target.id, null);
        const kept = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
        return { merged: true, user: { id: kept.id, pseudo: kept.pseudo } };
    });

    app.delete('/api/family/children/:id', async (req, reply) => {
        const parentId = await requireUserId(req, reply);
        if (!parentId) return;
        const prisma = getPrisma();
        const link = await prisma.family.findUnique({ where: { childUserId: (req.params as { id: string }).id } });
        if (!link || link.parentUserId !== parentId) {
            return reply.status(403).send(errorBody('FORBIDDEN', 'Cet enfant ne fait pas partie de ta famille'));
        }
        const child = await prisma.user.findUniqueOrThrow({ where: { id: link.childUserId } });
        await prisma.deletedPseudo.create({
            data: { pseudo: child.pseudo, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        });
        await prisma.user.delete({ where: { id: child.id } });
        return reply.status(204).send();
    });
}
