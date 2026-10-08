import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
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
    app.setErrorHandler((err: FastifyError, req, reply) => {
        const status = err.statusCode ?? 500;
        if (status >= 500) {
            // 10-§2 : détail serveur loggé, client reçoit un FR générique (jamais err.message brut).
            req.log.error({ err, requestId: req.id, status }, 'erreur interne API');
            return reply.status(status).send({
                error: { code: 'INTERNAL', message: 'Une erreur interne est survenue, réessaie plus tard.' },
            });
        }
        // Validation Fastify (schémas OpenAPI) → code opposable VALIDATION_ERROR FR.
        if (err.code === 'FST_ERR_VALIDATION') {
            return reply.status(status).send({
                error: { code: 'VALIDATION_ERROR', message: 'Requête invalide' },
            });
        }
        const code = err.code ?? 'INTERNAL';
        const message = typeof err.message === 'string' && err.message.length > 0 ? err.message : 'Requête invalide';
        return reply.status(status).send({ error: { code, message } });
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
        max: rateLimits.globalMax,
        timeWindow: rateLimits.globalWindow,
        // 429 au format opposable {error:{code,message}} FR (08-§2, backend.instructions).
        errorResponseBuilder: (_req, context) => {
            const err = new Error(`Trop de requêtes, réessaie dans ${context.after}.`) as FastifyError;
            err.statusCode = 429;
            err.code = 'RATE_LIMITED';
            return err;
        },
    });
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
    return app;
}
