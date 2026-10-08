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

    it('GET /ready 503 sans DB, 200 avec DB (readiness probe)', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/ready' });
        if (process.env.DATABASE_URL) {
            expect(res.statusCode).toBe(200);
            expect(res.json()).toMatchObject({ ok: true });
        } else {
            expect(res.statusCode).toBe(503);
            expect(res.json()).toMatchObject({ ok: false, db: 'unconfigured' });
        }
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

    it('500 → message FR générique sans fuite interne (10-§2)', async () => {
        const app = await buildApp();
        app.get('/boom-test', async () => {
            throw new Error('CONN_REFUSED secret interne ******h/db');
        });
        const res = await app.inject({ method: 'GET', url: '/boom-test' });
        expect(res.statusCode).toBe(500);
        expect(res.json()).toEqual({
            error: { code: 'INTERNAL', message: 'Une erreur interne est survenue, réessaie plus tard.' },
        });
        expect(res.body).not.toContain('CONN_REFUSED');
        await app.close();
    });

    it('/health et /ready hors rate-limit (sondes Railway/Render)', async () => {
        const app = await buildApp();
        let last = 0;
        for (let i = 0; i < 105; i++) {
            const r = await app.inject({ method: 'GET', url: '/health' });
            last = r.statusCode;
        }
        expect(last).toBe(200);
        await app.close();
    });

    it('429 au format {error:{code:RATE_LIMITED}} FR', async () => {
        process.env.RATE_LIMIT_MAX = '5';
        process.env.RATE_LIMIT_DISABLED = '0';
        let app: Awaited<ReturnType<typeof buildApp>> | undefined;
        try {
            app = await buildApp();
            let body = '';
            for (let i = 0; i < 20; i++) {
                const r = await app.inject({ method: 'GET', url: '/api/exercises' });
                if (r.statusCode === 429) {
                    body = r.body;
                    break;
                }
            }
            expect(body).toContain('RATE_LIMITED');
            expect(JSON.parse(body)).toMatchObject({ error: { code: 'RATE_LIMITED' } });
        } finally {
            delete process.env.RATE_LIMIT_MAX;
            delete process.env.RATE_LIMIT_DISABLED;
            await app?.close();
        }
    });

    it('inputMode=keyboard → 422 KEYBOARD_NOT_ALLOWED (10-§1 pointeur-seul)', async () => {
        const app = await buildApp();
        const created = await app.inject({
            method: 'POST',
            url: '/api/sessions',
            payload: { exerciseCode: 'ADD', mode: 'ARCADE' },
        });
        expect(created.statusCode).toBe(201);
        const sessionId = created.json().sessionId as string;
        const questions = await app.inject({ method: 'GET', url: `/api/sessions/${sessionId}/questions?level=1` });
        const first = questions.json().questions[0] as { hash: string; options: string[] };
        const res = await app.inject({
            method: 'POST',
            url: `/api/sessions/${sessionId}/answers`,
            payload: { level: 1, index: 0, questionHash: first.hash, chosen: first.options[0], timeMs: 1000, inputMode: 'keyboard' },
        });
        expect(res.statusCode).toBe(422);
        expect(res.json()).toMatchObject({ error: { code: 'KEYBOARD_NOT_ALLOWED' } });
        await app.close();
    });

    it('body invalide → 400 VALIDATION_ERROR FR (pas FST_ERR_VALIDATION)', async () => {
        const app = await buildApp();
        const res = await app.inject({
            method: 'POST',
            url: '/api/sessions',
            payload: { exerciseCode: 'ADD', mode: 'WRONG' },
        });
        expect(res.statusCode).toBe(400);
        expect(res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        await app.close();
    });

    it('404 route inconnue → {error:{code:NOT_FOUND}} FR (08-§2)', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/does-not-exist' });
        expect(res.statusCode).toBe(404);
        expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Ressource inconnue' } });
        await app.close();
    });

    it('JSON invalide → 400 VALIDATION_ERROR FR (pas FST_ERR_CTP_*)', async () => {
        const app = await buildApp();
        const res = await app.inject({
            method: 'POST',
            url: '/api/sessions',
            headers: { 'content-type': 'application/json' },
            payload: '{bad json',
        });
        expect(res.statusCode).toBe(400);
        expect(res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        expect(res.body).not.toContain('FST_ERR');
        await app.close();
    });

    it('arcade : level query ignoré (progression serveur L1, pas de saut L15)', async () => {
        const app = await buildApp();
        const created = await app.inject({
            method: 'POST',
            url: '/api/sessions',
            payload: { exerciseCode: 'ADD', mode: 'ARCADE' },
        });
        expect(created.statusCode).toBe(201);
        const sessionId = created.json().sessionId as string;
        const res = await app.inject({ method: 'GET', url: `/api/sessions/${sessionId}/questions?level=15` });
        expect(res.statusCode).toBe(200);
        expect(res.json().level).toBe(1);
        await app.close();
    });

    it('arcade : answer hors niveau courant → 422 + complete incomplet → 409', async () => {
        const app = await buildApp();
        const created = await app.inject({
            method: 'POST',
            url: '/api/sessions',
            payload: { exerciseCode: 'ADD', mode: 'ARCADE' },
        });
        const sessionId = created.json().sessionId as string;
        const questions = await app.inject({ method: 'GET', url: `/api/sessions/${sessionId}/questions` });
        const first = questions.json().questions[0] as { hash: string; options: string[] };
        const wrong = await app.inject({
            method: 'POST',
            url: `/api/sessions/${sessionId}/answers`,
            payload: { level: 15, index: 0, questionHash: first.hash, chosen: first.options[0], timeMs: 1000, inputMode: 'mouse' },
        });
        expect(wrong.statusCode).toBe(422);
        expect(wrong.json()).toMatchObject({ error: { code: 'ANSWER_REJECTED' } });
        const incomplete = await app.inject({ method: 'POST', url: `/api/sessions/${sessionId}/complete`, payload: {} });
        expect(incomplete.statusCode).toBe(409);
        await app.close();
    });

    it('double submit même réponse → 409 CONFLICT (idempotence)', async () => {
        const app = await buildApp();
        const created = await app.inject({
            method: 'POST',
            url: '/api/sessions',
            payload: { exerciseCode: 'ADD', mode: 'TRAINING', level: 1 },
        });
        const sessionId = created.json().sessionId as string;
        const questions = await app.inject({ method: 'GET', url: `/api/sessions/${sessionId}/questions?level=1&block=0` });
        const first = questions.json().questions[0] as { hash: string; options: string[] };
        const payload = { level: 1, blockIndex: 0, index: 0, questionHash: first.hash, chosen: first.options[0], timeMs: 1000, inputMode: 'mouse' };
        const once = await app.inject({ method: 'POST', url: `/api/sessions/${sessionId}/answers`, payload });
        expect(once.statusCode).toBe(200);
        const twice = await app.inject({ method: 'POST', url: `/api/sessions/${sessionId}/answers`, payload });
        expect(twice.statusCode).toBe(409);
        expect(twice.json()).toMatchObject({ error: { code: 'CONFLICT' } });
        await app.close();
    });

    it('GET /api/sessions/active : prototype pré-auth vide (pas de fuite inter-users)', async () => {
        const app = await buildApp();
        await app.inject({ method: 'POST', url: '/api/sessions', payload: { exerciseCode: 'ADD', mode: 'ARCADE' } });
        await app.inject({ method: 'POST', url: '/api/sessions', payload: { exerciseCode: 'SUB', mode: 'ARCADE' } });
        const res = await app.inject({ method: 'GET', url: '/api/sessions/active' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ sessions: [] });
        await app.close();
    });

    it('sessionId cuid2 (pas de Math.random)', async () => {
        const app = await buildApp();
        const created = await app.inject({
            method: 'POST',
            url: '/api/sessions',
            payload: { exerciseCode: 'ADD', mode: 'ARCADE' },
        });
        expect(created.json().sessionId).toMatch(/^sess_[a-z0-9]{24}$/);
        await app.close();
    });
});
