import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
    app.get('/health', async () => ({ ok: true, at: new Date().toISOString() }));
    app.get('/ready', async () => ({ ok: true, db: 'unconfigured', redis: 'unconfigured' }));
}
