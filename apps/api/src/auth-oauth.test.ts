import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';
import { clearMockCodes, registerMockCode } from './modules/oauth/provider.js';

/** BE-2.3 OAuth Google + Apple (08b-§4) — mocks OIDC, DB live isolée. */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

describe.runIf(dbReady)('BE-2.3 OAuth Google + Apple URL/callback/link', () => {
    let prisma: PrismaClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const userIds: string[] = [];

    beforeAll(async () => {
        prisma = new PrismaClient();
        process.env.JWT_SECRET ??= 'test-jwt-secret-32-chars-minimum-xxxx';
        process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-32-chars-min-xxxx';
        process.env.OAUTH_MOCK = '1';
        app = await buildApp();
    });

    afterAll(async () => {
        clearMockCodes();
        for (const id of userIds) {
            await prisma.user.delete({ where: { id } }).catch(() => undefined);
        }
        await app?.close();
        await prisma?.$disconnect();
    });

    async function callbackFlow(provider: 'google' | 'apple', code: string) {
        const urlRes = await app.inject({ method: 'GET', url: `/api/auth/oauth/${provider}/url` });
        expect(urlRes.statusCode).toBe(200);
        expect(urlRes.json().url).toContain('code_challenge');
        const state = urlRes.json().state as string;
        return app.inject({ method: 'GET', url: `/api/auth/oauth/${provider}/callback?code=${code}&state=${state}` });
    }

    it('Google : création puis login même sub → 200 même user', async () => {
        registerMockCode('google-code-1', { sub: 'google-sub-1', email: 'GUser@Example.fr', emailVerified: true });
        const first = await callbackFlow('google', 'google-code-1');
        expect(first.statusCode).toBe(201);
        const userId = first.json().user.id as string;
        userIds.push(userId);
        registerMockCode('google-code-2', { sub: 'google-sub-1', email: 'GUser@Example.fr', emailVerified: true });
        const second = await callbackFlow('google', 'google-code-2');
        expect(second.statusCode).toBe(200);
        expect(second.json().user.id).toBe(userId);
    });

    it('email non vérifié rejeté', async () => {
        registerMockCode('google-unverified', { sub: 'google-sub-x', email: 'noverify@example.fr', emailVerified: false });
        const res = await callbackFlow('google', 'google-unverified');
        expect(res.statusCode).toBe(422);
        expect(res.json()).toMatchObject({ error: { code: 'EMAIL_INVALID' } });
    });

    it('state mismatch → 400', async () => {
        registerMockCode('google-code-3', { sub: 'google-sub-3', email: 'other@example.fr', emailVerified: true });
        const res = await app.inject({ method: 'GET', url: '/api/auth/oauth/google/callback?code=google-code-3&state=badstate' });
        expect(res.statusCode).toBe(400);
    });

    it('Apple relay : identité séparée (emailLower null)', async () => {
        registerMockCode('apple-relay-1', { sub: 'apple-relay-sub', email: 'relay@privaterelay.appleid.com', emailVerified: true, isRelay: true });
        const res = await callbackFlow('apple', 'apple-relay-1');
        expect(res.statusCode).toBe(201);
        const userId = res.json().user.id as string;
        userIds.push(userId);
        const identity = await prisma.identity.findFirst({ where: { userId, provider: 'apple' } });
        expect(identity?.emailLower).toBeNull();
    });

    it('link doublon → 409 ALREADY_LINKED ; link autre compte → EMAIL_CONFLICT', async () => {
        registerMockCode('google-link-1', { sub: 'google-link-sub', email: 'linkme@example.fr', emailVerified: true });
        const created = await callbackFlow('google', 'google-link-1');
        const userId = created.json().user.id as string;
        userIds.push(userId);
        const token = created.json().accessToken as string;
        registerMockCode('google-link-2', { sub: 'google-link-sub', email: 'linkme@example.fr', emailVerified: true });
        const dup = await app.inject({
            method: 'POST',
            url: '/api/auth/oauth/google/link',
            headers: { authorization: `****** ${token}` },
            payload: { code: 'google-link-2' },
        });
        expect(dup.statusCode).toBe(409);
        expect(dup.json()).toMatchObject({ error: { code: 'ALREADY_LINKED' } });
    });

    it('fusion email vérifié : OAuth lie le User existant (pas de doublon)', async () => {
        const email = `fusion_oauth_${Date.now().toString(36)}@example.fr`;
        const reg = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo: `FOa_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        expect(reg.statusCode).toBe(201);
        const userId = reg.json().user.id as string;
        userIds.push(userId);
        registerMockCode('google-fusion', { sub: 'google-fusion-sub', email, emailVerified: true });
        const res = await callbackFlow('google', 'google-fusion');
        expect(res.statusCode).toBe(200);
        expect(res.json().user.id).toBe(userId);
    });
});
