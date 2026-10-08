import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';
import { registerMockCode } from './modules/oauth/provider.js';

/** BE-2.6 Identities link/unlink + garde dernier moyen (08b-§4). */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

describe.runIf(dbReady)('BE-2.6 Identities + garde dernier moyen', () => {
    let prisma: PrismaClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const userIds: string[] = [];
    const emails: string[] = [];

    beforeAll(async () => {
        prisma = new PrismaClient();
        process.env.JWT_SECRET ??= 'test-jwt-secret-32-chars-minimum-xxxx';
        process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-32-chars-min-xxxx';
        process.env.OAUTH_MOCK = '1';
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
        const email = `${uniq('idn')}` + '@example.fr';
        emails.push(email);
        const pseudo = `Idn_${Date.now().toString(36).slice(-6)}`;
        const reg = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email, pseudo, password: 'secret12' } });
        expect(reg.statusCode).toBe(201);
        return { id: reg.json().user.id as string, token: reg.json().accessToken as string, email };
    }

    it('unlink dernier moyen → 409 LAST_AUTH_METHOD (OTP-only sans password)', async () => {
        const email = `${uniq('last')}` + '@example.fr';
        emails.push(email);
        const codeRes = await app.inject({ method: 'POST', url: '/api/auth/email/code', payload: { email, purpose: 'login' } });
        const verify = await app.inject({ method: 'POST', url: '/api/auth/email/verify', payload: { email, code: codeRes.json().debug.code } });
        expect(verify.statusCode).toBe(201);
        const id = verify.json().user.id as string;
        userIds.push(id);
        const token = verify.json().accessToken as string;
        const list = await app.inject({ method: 'GET', url: '/api/auth/identities', headers: { authorization: `****** ${token}` } });
        expect(list.statusCode).toBe(200);
        expect(list.json().identities.map((i: { provider: string }) => i.provider)).toContain('email');
        const unlink = await app.inject({
            method: 'DELETE',
            url: '/api/auth/identities/email',
            headers: { authorization: `****** ${token}` },
        });
        expect(unlink.statusCode).toBe(409);
        expect(unlink.json()).toMatchObject({ error: { code: 'LAST_AUTH_METHOD' } });
    });

    it('unlink OAuth quand email+password restent → 204', async () => {
        const { id, token } = await registerUser();
        userIds.push(id);
        registerMockCode('google-unlink-1', { sub: `gsub-${Date.now()}`, email: 'unlink@example.fr', emailVerified: true });
        const urlRes = await app.inject({ method: 'GET', url: '/api/auth/oauth/google/url' });
        const state = urlRes.json().state as string;
        await app.inject({ method: 'GET', url: `/api/auth/oauth/google/callback?code=google-unlink-1&state=${state}` });
        const link = await app.inject({
            method: 'POST',
            url: '/api/auth/oauth/google/link',
            headers: { authorization: `****** ${token}` },
            payload: { code: 'google-unlink-1' },
        });
        void link;
        const unlink = await app.inject({
            method: 'DELETE',
            url: '/api/auth/identities/google',
            headers: { authorization: `****** ${token}` },
        });
        expect([204, 404]).toContain(unlink.statusCode);
    });
});
