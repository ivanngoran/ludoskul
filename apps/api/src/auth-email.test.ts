import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

/**
 * BE-2.1 Email OTP (08b-§4) — DB live isolée (port 15432, même base que le seed).
 * Nettoyage ciblé par suffixe pour ne jamais toucher aux autres données.
 */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

describe.runIf(dbReady)('BE-2.1 Email OTP code + verify + lien magique', () => {
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
        await prisma?.otpChallenge.deleteMany({}).catch(() => undefined);
        await app?.close();
        await prisma?.$disconnect();
    });

    async function requestCode(email: string) {
        const res = await app.inject({
            method: 'POST',
            url: '/api/auth/email/code',
            payload: { email, purpose: 'login' },
        });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({ sent: true, expiresIn: 900, resendIn: 60 });
        return res.json().debug as { code: string; magicToken: string } | undefined;
    }

    it('register inconnu + login connu : mêmes réponses 200 génériques', async () => {
        const fresh = `${uniq('otp')}` + '@example.fr';
        emails.push(fresh);
        const debug = await requestCode(fresh);
        expect(debug?.code).toMatch(/^\d{6}$/);
        const verify = await app.inject({
            method: 'POST',
            url: '/api/auth/email/verify',
            payload: { email: fresh, code: debug?.code, pseudo: 'OtpKid' },
        });
        expect(verify.statusCode).toBe(201);
        expect(verify.json().user.pseudo).toBeDefined();
        expect(verify.headers['set-cookie']).toBeDefined();
    });

    it('resend <60s → RESEND_TOO_SOON', async () => {
        const email = `${uniq('resend')}` + '@example.fr';
        emails.push(email);
        await requestCode(email);
        const second = await app.inject({
            method: 'POST',
            url: '/api/auth/email/code',
            payload: { email, purpose: 'login' },
        });
        expect(second.statusCode).toBe(429);
        expect(second.json()).toMatchObject({ error: { code: 'RESEND_TOO_SOON' } });
    });

    it('5 codes faux → INVALID_OTP puis 6e → OTP_TOO_MANY_ATTEMPTS', async () => {
        const email = `${uniq('tries')}` + '@example.fr';
        emails.push(email);
        await requestCode(email);
        for (let i = 0; i < 5; i += 1) {
            const res = await app.inject({
                method: 'POST',
                url: '/api/auth/email/verify',
                payload: { email, code: '000000' },
            });
            expect(res.statusCode).toBe(422);
            expect(res.json()).toMatchObject({ error: { code: 'INVALID_OTP' } });
        }
        const sixth = await app.inject({
            method: 'POST',
            url: '/api/auth/email/verify',
            payload: { email, code: '000000' },
        });
        expect(sixth.statusCode).toBe(422);
        expect(sixth.json()).toMatchObject({ error: { code: 'OTP_TOO_MANY_ATTEMPTS' } });
    });

    it('code expiré → OTP_EXPIRED', async () => {
        const email = `${uniq('expired')}` + '@example.fr';
        emails.push(email);
        const debug = await requestCode(email);
        expect(debug?.code).toBeDefined();
        const { normalizeEmail, targetHash } = await import('./modules/auth/crypto.js');
        await prisma.otpChallenge.updateMany({
            where: { targetHash: targetHash('email', normalizeEmail(email)) },
            data: { expiresAt: new Date(Date.now() - 1000) },
        });
        const res = await app.inject({
            method: 'POST',
            url: '/api/auth/email/verify',
            payload: { email, code: debug?.code },
        });
        expect(res.statusCode).toBe(422);
        expect(res.json()).toMatchObject({ error: { code: 'OTP_EXPIRED' } });
    });

    it('lien magique one-shot : 1er OK, 2e rejeté', async () => {
        const email = `${uniq('magic')}` + '@example.fr';
        emails.push(email);
        const debug = await requestCode(email);
        expect(debug?.magicToken).toBeDefined();
        const first = await app.inject({ method: 'GET', url: `/api/auth/email/magic?token=${debug?.magicToken}` });
        expect(first.statusCode).toBe(200);
        expect(first.json().accessToken).toBeDefined();
        const second = await app.inject({ method: 'GET', url: `/api/auth/email/magic?token=${debug?.magicToken}` });
        expect(second.statusCode).toBe(422);
    });

    it('fusion doublon : 2e verify même email → 200 (pas de doublon User)', async () => {
        const email = `${uniq('fusion')}` + '@example.fr';
        emails.push(email);
        const first = await requestCode(email);
        const v1 = await app.inject({ method: 'POST', url: '/api/auth/email/verify', payload: { email, code: first?.code } });
        expect(v1.statusCode).toBe(201);
        const userId = v1.json().user.id as string;
        const { normalizeEmail: norm, targetHash: th } = await import('./modules/auth/crypto.js');
        await prisma.otpChallenge.updateMany({
            where: { targetHash: th('email', norm(email)) },
            data: { resendAvailableAt: new Date(Date.now() - 1000) },
        });
        const second = await requestCode(email);
        const v2 = await app.inject({ method: 'POST', url: '/api/auth/email/verify', payload: { email, code: second?.code } });
        expect(v2.statusCode).toBe(200);
        expect(v2.json().user.id).toBe(userId);
        await prisma.user.delete({ where: { id: userId } });
    });
});
