import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
    // BE-1.2 : /health 200 <50ms, sans dépendance DB/Redis.
    app.get('/health', async () => ({ ok: true, at: new Date().toISOString() }));
    // BE-1.2 : /ready DB/Redis. Sans client branché en MVP socle → unconfigured.
    // BE-EPIC-5/7 brancheront les vrais checks (Postgres + Redis) sans changer le contrat.
    app.get('/ready', async () => ({ ok: true, db: 'unconfigured', redis: 'unconfigured' }));
}
