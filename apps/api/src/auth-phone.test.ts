import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';
import { phoneHash } from './modules/phone/otp-phone.js';

/** BE-2.4 Téléphone/WhatsApp OTP + fallback SMS (08b-§4) — mocks, DB live isolée. */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

describe.runIf(dbReady)('BE-2.4 Téléphone/WhatsApp OTP + fallback SMS', () => {
    let prisma: PrismaClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let app: any;
    const hashes: string[] = [];

    beforeAll(async () => {
        prisma = new PrismaClient();
        process.env.JWT_SECRET ??= 'test-jwt-secret-32-chars-minimum-xxxx';
        process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-32-chars-min-xxxx';
        app = await buildApp();
    });

    afterAll(async () => {
        for (const hash of hashes) {
            const identity = await prisma?.identity
                .findUnique({ where: { phoneHash: hash }, select: { userId: true } })
                .catch(() => null);
            if (identity) {
                await prisma.user.delete({ where: { id: identity.userId } }).catch(() => undefined);
            }
        }
        await app?.close();
        await prisma?.$disconnect();
    });

    async function requestCode(phone: string, channel: string = 'auto') {
        return app.inject({ method: 'POST', url: '/api/auth/phone/code', payload: { phone, channel } });
    }

    it('E.164 invalide → PHONE_INVALID', async () => {
        const res = await requestCode('not-a-phone');
        expect(res.statusCode).toBe(400);
        expect(res.json()).toMatchObject({ error: { code: 'PHONE_INVALID' } });
    });

    it('code WhatsApp puis verify 201 ; fusion même numéro → 200 même user', async () => {
        const phone = '+33612345678';
        hashes.push(phoneHash(phone));
        const first = await requestCode(phone);
        expect(first.statusCode).toBe(200);
        expect(first.json()).toMatchObject({ sent: true, channel: 'whatsapp', expiresIn: 300, resendIn: 60 });
        const code = first.json().debug.code as string;
        const verify = await app.inject({ method: 'POST', url: '/api/auth/phone/verify', payload: { phone, code, pseudo: 'TelKid' } });
        expect(verify.statusCode).toBe(201);
        const userId = verify.json().user.id as string;
        const identity = await prisma.identity.findFirst({ where: { userId, provider: 'phone' } });
        expect(identity?.phoneHash).toBeDefined();
        expect(identity?.phoneE164Encrypted).toBeDefined();
        expect(identity?.phoneE164Encrypted).not.toContain('0612345678');
        await prisma.otpChallenge.updateMany({
            where: { targetHash: phoneHash(phone) },
            data: { resendAvailableAt: new Date(Date.now() - 1000) },
        });
        const second = await requestCode(phone);
        const verify2 = await app.inject({ method: 'POST', url: '/api/auth/phone/verify', payload: { phone, code: second.json().debug.code } });
        expect(verify2.statusCode).toBe(200);
        expect(verify2.json().user.id).toBe(userId);
    });

    it('fallback SMS : même code (pas de nouveau code)', async () => {
        process.env.PHONE_MOCK_NON_WHATSAPP = '1';
        try {
            const phone = '+33698765432';
            hashes.push(phoneHash(phone));
            const res = await requestCode(phone);
            expect(res.statusCode).toBe(200);
            expect(res.json()).toMatchObject({ sent: true, channel: 'sms' });
            const code = res.json().debug.code as string;
            const verify = await app.inject({ method: 'POST', url: '/api/auth/phone/verify', payload: { phone, code } });
            expect(verify.statusCode).toBe(201);
        } finally {
            delete process.env.PHONE_MOCK_NON_WHATSAPP;
        }
    });

    it('code expiré → OTP_EXPIRED ; 6 essais faux → verrou', async () => {
        const phone = '+33711112233';
        hashes.push(phoneHash(phone));
        const req = await requestCode(phone);
        const code = req.json().debug.code as string;
        await prisma.otpChallenge.updateMany({
            where: { targetHash: phoneHash(phone) },
            data: { expiresAt: new Date(Date.now() - 1000) },
        });
        const expired = await app.inject({ method: 'POST', url: '/api/auth/phone/verify', payload: { phone, code } });
        expect(expired.statusCode).toBe(422);
        expect(expired.json()).toMatchObject({ error: { code: 'OTP_EXPIRED' } });
    });
});
