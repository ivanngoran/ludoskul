import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { openApiSchemas } from './schemas.js';

function readiness(): { ok: boolean; db: string; redis: string } {
    const db = config.databaseUrl ? 'configured' : 'unconfigured';
    const redis = config.redisUrl ? 'configured' : 'unconfigured';
    return { ok: config.databaseUrl.length > 0, db, redis };
}

export async function healthRoutes(app: FastifyInstance): Promise<void> {
    // BE-1.2 : /health 200 <50ms, sans dépendance DB/Redis, hors rate-limit (sondes Railway/Render + k6).
    app.get('/health', { config: { rateLimit: false }, schema: openApiSchemas.health }, async () => ({ ok: true, at: new Date().toISOString() }));
    // BE-1.2 : /ready DB/Redis, hors rate-limit. 503 tant que la DB n'est pas branchée (BE-EPIC-5/7 brancheront les vrais checks sans changer le contrat).
    app.get('/ready', { config: { rateLimit: false }, schema: openApiSchemas.ready }, async (_req, reply) => {
        const state = readiness();
        if (!state.ok) return reply.status(503).send(state);
        return state;
    });
}
