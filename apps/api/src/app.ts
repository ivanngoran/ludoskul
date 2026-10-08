import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
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
