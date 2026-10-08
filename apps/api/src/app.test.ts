import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('BE-1.2 Fastify app + santé + config (10-§2)', () => {
    it('GET /health 200 <50ms', async () => {
        const app = await buildApp();
        // Chauffe JIT/routes : la 1re injection inclut le coût de démarrage.
        await app.inject({ method: 'GET', url: '/health' });
        const start = Date.now();
        const res = await app.inject({ method: 'GET', url: '/health' });
        const elapsed = Date.now() - start;
        expect(res.statusCode).toBe(200);
        expect(elapsed).toBeLessThan(50);
        expect(res.json()).toMatchObject({ ok: true });
        await app.close();
    });

    it('GET /ready contrat DB/Redis', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/ready' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({ ok: true });
        await app.close();
    });

    it('CORS refuse origine inconnue', async () => {
        const app = await buildApp();
        const res = await app.inject({
            method: 'GET',
            url: '/health',
            headers: { origin: 'https://evil.example' },
        });
        expect(res.statusCode).toBe(200);
        // Pas de reflet d'origine inconnue.
        expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example');
        await app.close();
    });

    it('headers sécu : CSP + HSTS + nosniff', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.headers['content-security-policy']).toContain("default-src 'self'");
        expect(res.headers['strict-transport-security']).toContain('max-age=');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        await app.close();
    });

    it('request-id présent (traçabilité sans PII)', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.headers['x-request-id']).toBeDefined();
        await app.close();
    });

    it('erreurs au format {error:{code,message}} FR', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/api/exercises/UNKNOWN' });
        expect(res.statusCode).toBe(404);
        expect(res.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
        await app.close();
    });

    it('GET /api/config/flags public (BE-7.4 patch P3)', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/api/config/flags' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({
            pilote6: true,
            providers: { google: true, apple: true, email: true, phone: true, guest: true },
            tts: true,
            ranking: true,
            maintenance: false,
        });
        await app.close();
    });
});
