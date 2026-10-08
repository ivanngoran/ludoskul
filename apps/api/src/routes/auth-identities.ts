import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../modules/auth/db.js';
import { errorBody } from '../modules/auth/crypto.js';
import { requireUserId } from '../modules/auth/session.js';
import { authSchemas } from './auth-schemas.js';

/**
 * BE-2.6 Identities link/unlink + garde dernier moyen (08b-§4).
 * - GET identities : liste providers liés (+lastUsedAt audit).
 * - DELETE identities/:provider : refuse LAST_AUTH_METHOD si dernier actif.
 */

const providerParamSchema = z.enum(['google', 'apple', 'email', 'phone']);

export async function identityRoutes(app: FastifyInstance): Promise<void> {
    app.get('/api/auth/identities', { schema: authSchemas.identities }, async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const prisma = getPrisma();
        const identities = await prisma.identity.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
        return {
            identities: identities.map((i) => ({
                provider: i.provider,
                emailLower: i.emailLower,
                phoneMasked: i.phoneHash ? '••••' : null,
                emailVerifiedAt: i.emailVerifiedAt,
                phoneVerifiedAt: i.phoneVerifiedAt,
                lastUsedAt: i.lastUsedAt,
                createdAt: i.createdAt,
            })),
        };
    });

    app.delete('/api/auth/identities/:provider', { schema: authSchemas.unlinkIdentity }, async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const parsed = providerParamSchema.safeParse((req.params as { provider: string }).provider);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Provider inconnu'));
        }
        const prisma = getPrisma();
        const identities = await prisma.identity.findMany({ where: { userId } });
        const target = identities.filter((i) => i.provider === parsed.data);
        if (target.length === 0) {
            return reply.status(404).send(errorBody('NOT_FOUND', 'Ce moyen de connexion n’est pas lié'));
        }
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
        const hasPassword = !!user?.passwordHash;
        const remaining = identities.length - target.length + (hasPassword ? 1 : 0);
        if (remaining <= 0) {
            return reply
                .status(409)
                .send(errorBody('LAST_AUTH_METHOD', 'Impossible : c’est ton dernier moyen de connexion. Ajoute-en un autre d’abord.'));
        }
        await prisma.identity.deleteMany({ where: { userId, provider: parsed.data } });
        if (parsed.data === 'email') {
            await prisma.user.update({ where: { id: userId }, data: { email: null } });
        }
        return reply.status(204).send();
    });
}
