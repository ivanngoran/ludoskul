import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('BE-1.3 Seed référentiel + badges (06/06b, 07-§5)', () => {
    it('GET /api/exercises retourne 6 pilotes', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/api/exercises' });
        expect(res.statusCode).toBe(200);
        const codes = res.json().exercises.map((e: { code: string }) => e.code).sort();
        expect(codes).toEqual(['ADD', 'SHAPE_2D', 'SUB', 'SUITE', 'TAB', 'TIME']);
        await app.close();
    });

    it('GET /api/exercises?includeInactive=1 retourne 26', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/api/exercises?includeInactive=1' });
        expect(res.statusCode).toBe(200);
        expect(res.json().exercises).toHaveLength(26);
        await app.close();
    });

    it('GET /api/badges retourne 39 codes 07-§5', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/api/badges' });
        expect(res.statusCode).toBe(200);
        expect(res.json().badges).toHaveLength(39);
        const codes = res.json().badges.map((b: { code: string }) => b.code);
        for (const expected of ['FIRST_STEP', 'MARATHON', 'PERFECT', 'CALC_PRO', 'LOYAL_30']) {
            expect(codes).toContain(expected);
        }
        await app.close();
    });

    it('GET /api/exercises/:code 404 inconnu', async () => {
        const app = await buildApp();
        const res = await app.inject({ method: 'GET', url: '/api/exercises/UNKNOWN' });
        expect(res.statusCode).toBe(404);
        expect(res.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
        await app.close();
    });
});
