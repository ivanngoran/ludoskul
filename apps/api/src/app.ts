import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { randomUUID } from 'node:crypto';
import { EXERCISES } from '@ludoskul/shared';
import { config, cspDirectives, rateLimits } from './config.js';
import { healthRoutes } from './routes/health.js';
import { exerciseRoutes } from './routes/exercises.js';
import { sessionRoutes } from './routes/sessions.js';

export async function buildApp(): Promise<FastifyInstance> {
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
    // CORS = origine front seule (10-§2). Refuse origine inconnue.
    await app.register(cors, { origin: config.corsOrigins });
    // Helmet CSP stricte opposable 10-§2 + HSTS + nosniff.
    await app.register(helmet, {
        contentSecurityPolicy: { directives: cspDirectives() },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        noSniff: true,
    });
    await app.register(rateLimit, { max: rateLimits.globalMax, timeWindow: rateLimits.globalWindow });
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
    app.get('/api/config/flags', async () => ({
        pilote6: true,
        providers: { google: true, apple: true, email: true, phone: true, guest: true },
        tts: true,
        ranking: true,
        maintenance: false,
    }));
    void EXERCISES;
    app.setErrorHandler((err: FastifyError, _req, reply) => {
        const status = err.statusCode ?? 500;
        const code = err.code ?? 'INTERNAL';
        reply.status(status).send({ error: { code, message: err.message } });
    });
    return app;
}
