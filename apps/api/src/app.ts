import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { EXERCISES } from '@ludoskul/shared';
import { healthRoutes } from './routes/health.js';
import { exerciseRoutes } from './routes/exercises.js';
import { sessionRoutes } from './routes/sessions.js';

export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({ logger: { level: 'info' } });
    await app.register(cors, { origin: (process.env.CORS_ORIGIN ?? '').split(',').filter(Boolean) || true });
    await app.register(helmet, { contentSecurityPolicy: false });
    await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
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
    app.setErrorHandler((err, _req, reply) => {
        const status = err.statusCode ?? 500;
        reply.status(status).send({ error: { code: err.code ?? 'INTERNAL', message: err.message } });
    });
    return app;
}
