import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

/** BE-2.5 Invité + upgrade sans perte (08b-§4) — DB live isolée. */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

describe.runIf(dbReady)('BE-2.5 Invité + upgrade sans perte', () => {
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

    async function createGuest(pseudo: string) {
        const res = await app.inject({ method: 'POST', url: '/api/auth/guest', payload: { pseudo } });
        expect(res.statusCode).toBe(201);
        expect(res.json().user.guest).toBe(true);
        return { id: res.json().user.id as string, token: res.json().accessToken as string };
    }

    it('guest créé avec device léger ; upgrade email conserve sessions/answers', async () => {
        const guest = await createGuest(`Guest_${Date.now().toString(36).slice(-6)}`);
        userIds.push(guest.id);
        const exercise = await prisma.exercise.findFirstOrThrow({ where: { code: 'ADD' } });
        const session = await prisma.session.create({
            data: { userId: guest.id, exerciseId: exercise.id, mode: 'TRAINING', seedBase: `g-${guest.id}`, startLevel: 1 },
        });
        await prisma.answer.create({
            data: { sessionId: session.id, mode: 'TRAINING', level: 1, questionIndex: 0, questionHash: `h-${guest.id}`, chosen: '1', correct: true, timeMs: 500, inputMode: 'mouse' },
        });
        const answersBefore = await prisma.answer.count({ where: { session: { userId: guest.id } } });
        expect(answersBefore).toBe(1);
        const email = `${uniq('upgrade')}` + '@example.fr';
        emails.push(email);
        const codeRes = await app.inject({ method: 'POST', url: '/api/auth/email/code', payload: { email, purpose: 'login' } });
        const code = codeRes.json().debug.code as string;
        const upgrade = await app.inject({
            method: 'POST',
            url: '/api/auth/guest/upgrade',
            headers: { authorization: `****** ${guest.token}` },
            payload: { proof: { type: 'email', email, code } },
        });
        expect(upgrade.statusCode).toBe(200);
        expect(upgrade.json()).toMatchObject({ upgraded: true });
        const upgradedId = upgrade.json().user.id as string;
        const answersAfter = await prisma.answer.count({ where: { session: { userId: upgradedId } } });
        expect(answersAfter).toBe(answersBefore);
        const upgraded = await prisma.user.findUniqueOrThrow({ where: { id: upgradedId } });
        expect(upgraded.guest).toBe(false);
        userIds.push(upgradedId);
    });

    it('double upgrade idempotent (guest=false → 200 already)', async () => {
        const guest = await createGuest(`Guest2_${Date.now().toString(36).slice(-5)}`);
        userIds.push(guest.id);
        const email = `${uniq('upgrade2')}` + '@example.fr';
        emails.push(email);
        const codeRes = await app.inject({ method: 'POST', url: '/api/auth/email/code', payload: { email, purpose: 'login' } });
        const first = await app.inject({
            method: 'POST',
            url: '/api/auth/guest/upgrade',
            headers: { authorization: `****** ${guest.token}` },
            payload: { proof: { type: 'email', email, code: codeRes.json().debug.code } },
        });
        expect(first.statusCode).toBe(200);
        const token2 = first.json().accessToken as string;
        const second = await app.inject({
            method: 'POST',
            url: '/api/auth/guest/upgrade',
            headers: { authorization: `****** ${token2}` },
            payload: { proof: { type: 'email', email, code: '000000' } },
        });
        expect(second.statusCode).toBe(200);
        expect(second.json()).toMatchObject({ upgraded: true, already: true });
        userIds.push(first.json().user.id as string);
    });
});
