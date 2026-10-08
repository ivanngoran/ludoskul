import type { FastifyInstance } from 'fastify';
import { oauthLinkSchema, oauthProviderSchema } from '@ludoskul/shared';
import { z } from 'zod';
import { getPrisma } from '../modules/auth/db.js';
import { errorBody, normalizeEmail } from '../modules/auth/crypto.js';
import { sendFailure, failure } from '../modules/auth/otp.js';
import { issueSession, requireUserId } from '../modules/auth/session.js';
import { findUserByEmail } from '../modules/auth/users.js';
import {
    consumeOAuthState,
    createOAuthIntent,
    exchangeCode,
    findOrCreateOAuthUser,
    type OAuthProvider,
} from '../modules/oauth/provider.js';

/**
 * BE-2.3 OAuth Google + Apple URL/callback/link (08b-§4).
 * - GET url : PKCE S256 + state/nonce 10 min.
 * - GET callback : échange + vérif, email_verified exigé, fusion si email vérifié.
 * - POST link (******) : ALREADY_LINKED / EMAIL_CONFLICT + suggestedAction.
 */

const callbackQuerySchema = z.object({ code: z.string().min(1), state: z.string().min(1) });

export async function oauthRoutes(app: FastifyInstance): Promise<void> {
    app.get('/api/auth/oauth/:provider/url', async (req, reply) => {
        const parsed = oauthProviderSchema.safeParse((req.params as { provider: string }).provider);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Provider inconnu'));
        }
        const { url, state } = await createOAuthIntent(parsed.data);
        return { url, state };
    });

    app.get('/api/auth/oauth/:provider/callback', async (req, reply) => {
        const providerParsed = oauthProviderSchema.safeParse((req.params as { provider: string }).provider);
        const queryParsed = callbackQuerySchema.safeParse(req.query);
        if (!providerParsed.success || !queryParsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Callback OAuth invalide'));
        }
        const provider: OAuthProvider = providerParsed.data;
        const { code, state } = queryParsed.data;
        const intent = await consumeOAuthState(provider, state);
        if (!intent) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Session OAuth expirée. Recommence.'));
        }
        const profile = await exchangeCode(provider, code, intent.verifier);
        if (!profile) {
            return sendFailure(reply, failure(502, 'PROVIDER_ERROR', 'Échec de vérification. Réessaie.'));
        }
        if (!profile.emailVerified) {
            return reply.status(422).send(errorBody('EMAIL_INVALID', 'Email non vérifié chez le provider'));
        }
        const { userId, created } = await findOrCreateOAuthUser(provider, profile);
        const prisma = getPrisma();
        const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const { accessToken, refreshExpiresAt } = await issueSession(reply, user.id);
        return reply.status(created ? 201 : 200).send({
            user: { id: user.id, pseudo: user.pseudo, level: user.level, xp: user.xp },
            accessToken,
            refreshExpiresAt,
        });
    });

    app.post('/api/auth/oauth/:provider/link', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const providerParsed = oauthProviderSchema.safeParse((req.params as { provider: string }).provider);
        const bodyParsed = oauthLinkSchema.safeParse(req.body);
        if (!providerParsed.success || !bodyParsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Liaison OAuth invalide'));
        }
        const provider: OAuthProvider = providerParsed.data;
        const prisma = getPrisma();
        const profile = await exchangeCode(provider, bodyParsed.data.code, 'link');
        if (!profile) {
            return sendFailure(reply, failure(502, 'PROVIDER_ERROR', 'Échec de vérification. Réessaie.'));
        }
        if (!profile.emailVerified) {
            return reply.status(422).send(errorBody('EMAIL_INVALID', 'Email non vérifié chez le provider'));
        }
        const already = await prisma.identity.findUnique({
            where: { provider_providerSub: { provider, providerSub: profile.sub } },
            select: { userId: true },
        });
        if (already) {
            if (already.userId === userId) {
                return reply.status(409).send(errorBody('ALREADY_LINKED', 'Ce compte est déjà lié'));
            }
            const otherEmail = normalizeEmail(profile.email);
            const mine = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
            if (mine?.email && normalizeEmail(mine.email) === otherEmail) {
                return reply
                    .status(409)
                    .send(errorBody('EMAIL_CONFLICT', 'Un autre compte utilise cet email vérifié', { suggestedAction: 'merge_accounts' }));
            }
            return reply
                .status(409)
                .send(errorBody('EMAIL_CONFLICT', 'Ce compte appartient à un autre utilisateur', { suggestedAction: 'use_other_account' }));
        }
        const emailOwner = await findUserByEmail(normalizeEmail(profile.email));
        if (emailOwner && emailOwner.id !== userId) {
            return reply
                .status(409)
                .send(errorBody('EMAIL_CONFLICT', 'Cet email est déjà utilisé', { suggestedAction: 'use_other_account' }));
        }
        await prisma.identity.create({
            data: {
                userId,
                provider,
                providerSub: profile.sub,
                emailLower: profile.isRelay ? null : normalizeEmail(profile.email),
                emailVerifiedAt: new Date(),
            },
        });
        return { linked: true, provider };
    });
}
