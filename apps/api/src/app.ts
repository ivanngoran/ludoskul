import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { randomUUID } from 'node:crypto';
import { config, assertProdConfig, cspDirectives, rateLimits } from './config.js';
import { healthRoutes } from './routes/health.js';
import { exerciseRoutes } from './routes/exercises.js';
import { sessionRoutes } from './routes/sessions.js';
import { configRoutes } from './routes/schemas.js';
import { emailOtpRoutes } from './routes/auth-email.js';
import { passwordRoutes } from './routes/auth-password.js';
import { oauthRoutes } from './routes/auth-oauth.js';
import { phoneRoutes } from './routes/auth-phone.js';
import { guestRoutes } from './routes/auth-guest.js';
import { identityRoutes } from './routes/auth-identities.js';
import { deviceRoutes } from './routes/auth-devices.js';
import { familyRoutes } from './routes/auth-family.js';
import { profileRoutes } from './routes/auth-profile.js';
import { mergeRoutes } from './routes/auth-merge.js';

export async function buildApp(): Promise<FastifyInstance> {
    // Fail-fast prod (10-§2, 19-§2) : CORS/JWT requis avant tout plugin.
    assertProdConfig();
    // Logs JSON sans PII (10-§2) : jamais email/téléphone/code/OTP/mot de passe.
    const app = Fastify({
        logger: {
            level: 'info',
            serializers: {
                req(req) {
                    return { id: req.id, method: req.method, url: req.url };
                },
            },
        },
        requestIdHeader: 'x-request-id',
        genReqId: () => randomUUID(),
    });
    // Erreurs au format opposable {error:{code,message}} FR (08-§2, backend.instructions).
    // Placé AVANT les register : les contextes encapsulés héritent du handler
    // parent au moment de leur création (sinon le handler par défaut sérialise
    // l'erreur brute, ex 429 avec statusCode/error exposés).
    // Codes opposables 08-§7 : tout code Fastify interne (FST_*) est remappé vers
    // VALIDATION_ERROR FR ; seuls les codes opposables passent tels quels.
    const OPPOSABLE_CODES = new Set([
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'TOKEN_EXPIRED',
        'EMAIL_TAKEN',
        'PSEUDO_TAKEN',
        'INVALID_CREDENTIALS',
        'WEAK_PASSWORD',
        'INVALID_OTP',
        'OTP_EXPIRED',
        'OTP_TOO_MANY_ATTEMPTS',
        'RESEND_TOO_SOON',
        'PHONE_INVALID',
        'PARENTAL_CONSENT_REQUIRED',
        'BLOCK_IN_PROGRESS',
        'LAST_AUTH_METHOD',
        'ALREADY_LINKED',
        'EMAIL_CONFLICT',
        'ANSWER_REJECTED',
        'KEYBOARD_NOT_ALLOWED',
        'RATE_LIMITED',
        'NOT_FOUND',
        'CONFLICT',
        'FORBIDDEN',
        'INTERNAL',
    ]);
    app.setErrorHandler((err: FastifyError, req, reply) => {
        const status = err.statusCode ?? 500;
        if (status >= 500) {
            // 10-§2 : détail serveur loggé, client reçoit un FR générique (jamais err.message brut).
            req.log.error({ err, requestId: req.id, status }, 'erreur interne API');
            return reply.status(status).send({
                error: { code: 'INTERNAL', message: 'Une erreur interne est survenue, réessaie plus tard.' },
            });
        }
        // Validation Fastify (schémas OpenAPI) + body JSON invalide → VALIDATION_ERROR FR.
        if (err.code === 'FST_ERR_VALIDATION' || err.code === 'FST_ERR_CTP_INVALID_JSON_BODY' || err.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
            return reply.status(400).send({
                error: { code: 'VALIDATION_ERROR', message: 'Requête invalide' },
            });
        }
        // Tout autre code Fastify interne (FST_*) : jamais exposé tel quel (08-§7 FR).
        if (err.code?.startsWith('FST_')) {
            return reply.status(status).send({
                error: { code: 'VALIDATION_ERROR', message: 'Requête invalide' },
            });
        }
        const code = err.code && OPPOSABLE_CODES.has(err.code) ? err.code : 'VALIDATION_ERROR';
        const message =
            err.code && OPPOSABLE_CODES.has(err.code) && typeof err.message === 'string' && err.message.length > 0
                ? err.message
                : 'Requête invalide';
        return reply.status(status).send({ error: { code, message } });
    });
    // 404 route inconnue au même format opposable (08-§2) : setErrorHandler ne couvre pas le 404 par défaut.
    app.setNotFoundHandler((_req, reply) => {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ressource inconnue' } });
    });
    // CORS = origine front seule (10-§2). Refuse origine inconnue.
    await app.register(cors, { origin: config.corsOrigins });
    // Helmet CSP stricte opposable 10-§2 + HSTS + nosniff.
    await app.register(helmet, {
        contentSecurityPolicy: { directives: cspDirectives() },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        noSniff: true,
    });
    await app.register(rateLimit, {
        max: Number(process.env.RATE_LIMIT_MAX ?? rateLimits.globalMax),
        timeWindow: rateLimits.globalWindow,
        // Tests/CI : RATE_LIMIT_DISABLED=1 désactive le global (sondes/staging).
        // NODE_ENV=test seul ne suffit plus (staging fragile, revue BE-EPIC-01 #7).
        allowList: () => process.env.RATE_LIMIT_DISABLED === '1' || (process.env.NODE_ENV === 'test' && !process.env.RATE_LIMIT_MAX),
        // 429 au format opposable {error:{code,message}} FR (08-§2, backend.instructions).
        errorResponseBuilder: (_req, context) => {
            const err = new Error(`Trop de requêtes, réessaie dans ${context.after}.`) as FastifyError;
            err.statusCode = 429;
            err.code = 'RATE_LIMITED';
            return err;
        },
    });
    await app.register(cookie);
    // Traçabilité sans PII : expose l'id requête en réponse (corrélé aux logs JSON).
    app.addHook('onSend', async (req, reply) => {
        reply.header('x-request-id', req.id);
    });
    await app.register(swagger, {
        openapi: { info: { title: 'Ludoskul API', version: '0.1.0' }, paths: {} },
    });
    await app.register(swaggerUi, { routePrefix: '/api/docs' });
    await app.register(healthRoutes);
    await app.register(exerciseRoutes);
    await app.register(sessionRoutes);
    await app.register(configRoutes);
    await app.register(emailOtpRoutes);
    await app.register(passwordRoutes);
    await app.register(oauthRoutes);
    await app.register(phoneRoutes);
    await app.register(guestRoutes);
    await app.register(identityRoutes);
    await app.register(deviceRoutes);
    await app.register(familyRoutes);
    await app.register(profileRoutes);
    await app.register(mergeRoutes);
    return app;
}
