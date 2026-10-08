import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

/** BE-2.2 register/login/reset (08-§2, 10-§2) — DB live isolée, cleanup ciblé. */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

describe.runIf(dbReady)('BE-2.2 Email password register/login + reset', () => {
    let prisma: PrismaClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const emails: string[] = [];

    beforeAll(async () => {
        prisma = new PrismaClient();
        process.env.JWT_SECRET ??= 'test-jwt-secret-32-chars-minimum-xxxx';
        process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-32-chars-min-xxxx';
        app = await buildApp();
    });

    afterAll(async () => {
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

    it('register 201 puis login email + pseudo OK', async () => {
        const email = `${uniq('pwd')}` + '@example.fr';
        emails.push(email);
        const pseudo = `Pwd_${Date.now().toString(36).slice(-6)}`;
        const register = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo, password: 'secret12' },
        });
        expect(register.statusCode).toBe(201);
        expect(register.json().accessToken).toBeDefined();
        const loginEmail = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: { emailOrPseudo: email, password: 'secret12' },
        });
        expect(loginEmail.statusCode).toBe(200);
        const loginPseudo = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: { emailOrPseudo: pseudo, password: 'secret12' },
        });
        expect(loginPseudo.statusCode).toBe(200);
    });

    it('register doublon → EMAIL_TAKEN / PSEUDO_TAKEN ; password faible → WEAK_PASSWORD', async () => {
        const email = `${uniq('dup')}` + '@example.fr';
        emails.push(email);
        const pseudo = `Dup_${Date.now().toString(36).slice(-6)}`;
        const first = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email, pseudo, password: 'secret12' } });
        expect(first.statusCode).toBe(201);
        const dupEmail = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo: `Other_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        expect(dupEmail.statusCode).toBe(409);
        expect(dupEmail.json()).toMatchObject({ error: { code: 'EMAIL_TAKEN' } });
        const dupPseudo = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email: `${uniq('other')}` + '@example.fr', pseudo, password: 'secret12' },
        });
        expect(dupPseudo.statusCode).toBe(409);
        expect(dupPseudo.json()).toMatchObject({ error: { code: 'PSEUDO_TAKEN' } });
        const weak = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email: `${uniq('weak')}` + '@example.fr', pseudo: `Weak_${Date.now().toString(36).slice(-6)}`, password: 'court' },
        });
        expect(weak.statusCode).toBe(400);
        expect(weak.json()).toMatchObject({ error: { code: 'WEAK_PASSWORD' } });
    });

    it('login faux password → INVALID_CREDENTIALS générique (timing-safe)', async () => {
        const email = `${uniq('bad')}` + '@example.fr';
        emails.push(email);
        const pseudo = `Bad_${Date.now().toString(36).slice(-6)}`;
        await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email, pseudo, password: 'secret12' } });
        const bad = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { emailOrPseudo: email, password: 'nope1234' } });
        expect(bad.statusCode).toBe(401);
        expect(bad.json()).toMatchObject({ error: { code: 'INVALID_CREDENTIALS' } });
        const unknown = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: { emailOrPseudo: `${uniq('ghost')}` + '@example.fr', password: 'nope1234' },
        });
        expect(unknown.statusCode).toBe(401);
        expect(unknown.json()).toMatchObject({ error: { code: 'INVALID_CREDENTIALS' } });
    });

    it('forgot/reset via OTP : ancien password invalidé', async () => {
        const email = `${uniq('reset')}` + '@example.fr';
        emails.push(email);
        const pseudo = `Rst_${Date.now().toString(36).slice(-6)}`;
        await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email, pseudo, password: 'secret12' } });
        const forgot = await app.inject({ method: 'POST', url: '/api/auth/password/forgot', payload: { email } });
        expect(forgot.statusCode).toBe(200);
        const code = forgot.json().debug.code as string;
        const reset = await app.inject({
            method: 'POST',
            url: '/api/auth/password/reset',
            payload: { email, code, newPassword: 'nouveau34' },
        });
        expect(reset.statusCode).toBe(200);
        const oldLogin = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { emailOrPseudo: email, password: 'secret12' } });
        expect(oldLogin.statusCode).toBe(401);
        const newLogin = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { emailOrPseudo: email, password: 'nouveau34' } });
        expect(newLogin.statusCode).toBe(200);
    });
});
