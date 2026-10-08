import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

/** BE-2.7 Devices + refresh rotation + logout (08-§2, 10-§2). */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function refreshFrom(res: { headers: Record<string, unknown> }): string {
    const setCookie = res.headers['set-cookie'] as string | string[] | undefined;
    const first = Array.isArray(setCookie) ? setCookie[0] : (setCookie ?? '');
    const match = /refreshToken=([^;]+)/.exec(first);
    if (!match) throw new Error('refresh cookie manquant');
    return decodeURIComponent(match[1]);
}

describe.runIf(dbReady)('BE-2.7 Devices + refresh rotation + logout', () => {
    let prisma: PrismaClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const userIds: string[] = [];
    const emails: string[] = [];

    beforeAll(async () => {
        prisma = new PrismaClient();
        process.env.JWT_SECRET ??= 'test-jwt-secret-32-chars-minimum-xxxx';
        process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-32-chars-min-xxxx';
        app = await buildApp();
    });

    afterAll(async () => {
        for (const id of userIds) {
            await prisma.user.delete({ where: { id } }).catch(() => undefined);
        }
        for (const email of emails) {
            const identity = await prisma?.identity
                .findUnique({ where: { emailLower: email }, select: { userId: true } })
                .catch(() => null);
            if (identity) {
                await prisma.user.delete({ where: { id: identity.userId } }).catch(() => undefined);
            }
        }
        await app?.close();
        await prisma?.$disconnect();
    });

    async function registerUser() {
        const email = `${uniq('dev')}` + '@example.fr';
        emails.push(email);
        const reg = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo: `Dev_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        expect(reg.statusCode).toBe(201);
        userIds.push(reg.json().user.id as string);
        return { token: reg.json().accessToken as string, refresh: refreshFrom(reg) };
    }

    it('rotation : ancien refresh révoqué, nouveau OK', async () => {
        const { token, refresh } = await registerUser();
        void token;
        const rotated = await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { cookie: `refreshToken=${refresh}` } });
        expect(rotated.statusCode).toBe(200);
        expect(rotated.json().accessToken).toBeDefined();
        const next = refreshFrom(rotated);
        expect(next).not.toBe(refresh);
        const replay = await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { cookie: `refreshToken=${refresh}` } });
        expect(replay.statusCode).toBe(401);
        expect(replay.json()).toMatchObject({ error: { code: 'TOKEN_EXPIRED' } });
    });

    it('vol refresh (replay) → famille révoquée : le nouveau refresh est rejeté aussi', async () => {
        const { refresh } = await registerUser();
        const rotated = await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { cookie: `refreshToken=${refresh}` } });
        const next = refreshFrom(rotated);
        await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { cookie: `refreshToken=${refresh}` } });
        const afterTheft = await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { cookie: `refreshToken=${next}` } });
        expect(afterTheft.statusCode).toBe(401);
    });

    it('devices listés ; logout ne révoque que le device courant', async () => {
        const { token, refresh } = await registerUser();
        const devices = await app.inject({ method: 'GET', url: '/api/auth/devices', headers: { authorization: `****** ${token}` } });
        expect(devices.statusCode).toBe(200);
        expect(devices.json().devices.length).toBeGreaterThanOrEqual(1);
        const logout = await app.inject({
            method: 'POST',
            url: '/api/auth/logout',
            headers: { authorization: `****** ${token}`, cookie: `refreshToken=${refresh}` },
        });
        expect(logout.statusCode).toBe(204);
        const after = await app.inject({ method: 'POST', url: '/api/auth/refresh', headers: { cookie: `refreshToken=${refresh}` } });
        expect(after.statusCode).toBe(401);
    });
});
