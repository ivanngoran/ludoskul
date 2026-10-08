import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

/** BE-2.10 Fusion confirmée + suppression enfant (patch 16-P1). */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

describe.runIf(dbReady)('BE-2.10 Fusion confirmée + suppression enfant', () => {
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

    it('fusion : 2 comptes même email vérifié → 1 seul User, 0 perte', async () => {
        const email = `${uniq('merge')}` + '@example.fr';
        emails.push(email);
        const codeRes = await app.inject({ method: 'POST', url: '/api/auth/email/code', payload: { email, purpose: 'login' } });
        const first = await app.inject({ method: 'POST', url: '/api/auth/email/verify', payload: { email, code: codeRes.json().debug.code } });
        expect(first.statusCode).toBe(201);
        const userA = first.json().user.id as string;
        const tokenA = first.json().accessToken as string;
        const exercise = await prisma.exercise.findFirstOrThrow({ where: { code: 'ADD' } });
        const session = await prisma.session.create({
            data: { userId: userA, exerciseId: exercise.id, mode: 'TRAINING', seedBase: `m-${userA}`, startLevel: 1 },
        });
        await prisma.answer.create({
            data: { sessionId: session.id, mode: 'TRAINING', level: 1, questionIndex: 0, questionHash: `mh-${userA}`, chosen: '1', correct: true, timeMs: 400, inputMode: 'mouse' },
        });
        const answersBefore = await prisma.answer.count({ where: { session: { userId: userA } } });
        const regB = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email: `${uniq('mergeB')}` + '@example.fr', pseudo: `MgB_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        const userB = regB.json().user.id as string;
        const tokenB = regB.json().accessToken as string;
        userIds.push(userB);
        const { normalizeEmail: norm, targetHash: th } = await import('./modules/auth/crypto.js');
        await prisma.otpChallenge.updateMany({ where: { targetHash: th('email', norm(email)) }, data: { resendAvailableAt: new Date(Date.now() - 1000) } });
        const codeRes2 = await app.inject({ method: 'POST', url: '/api/auth/email/code', payload: { email, purpose: 'merge' } });
        expect(codeRes2.statusCode).toBe(200);
        const confirm = await app.inject({
            method: 'POST',
            url: '/api/auth/merge/confirm',
            headers: { authorization: `****** ${tokenB}` },
            payload: { targetEmail: email, proof: { type: 'otp', code: codeRes2.json().debug.code } },
        });
        expect(confirm.statusCode).toBe(200);
        expect(confirm.json()).toMatchObject({ merged: true });
        const keptId = confirm.json().user.id as string;
        const answersAfter = await prisma.answer.count({ where: { session: { userId: keptId } } });
        expect(answersAfter).toBe(answersBefore);
        userIds.push(keptId);
        void tokenA;
    });

    it('preuve expirée → 422', async () => {
        const email = `${uniq('mergeproof')}` + '@example.fr';
        emails.push(email);
        const reg = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo: `MgP_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        userIds.push(reg.json().user.id as string);
        const res = await app.inject({
            method: 'POST',
            url: '/api/auth/merge/confirm',
            headers: { authorization: `****** ${reg.json().accessToken}` },
            payload: { targetEmail: email, proof: { type: 'otp', code: '000000' } },
        });
        expect(res.statusCode).toBe(422);
    });

    it('delete enfant : exclu + pseudo réservé 30j', async () => {
        const email = `${uniq('delchild')}` + '@example.fr';
        emails.push(email);
        const reg = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo: `DcP_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        userIds.push(reg.json().user.id as string);
        const token = reg.json().accessToken as string;
        const created = await app.inject({
            method: 'POST',
            url: '/api/family/children',
            headers: { authorization: `****** ${token}` },
            payload: { pseudo: `DcK_${Date.now().toString(36).slice(-5)}`, birthYear: 2017 },
        });
        const childId = created.json().child.id as string;
        const childPseudo = created.json().child.pseudo as string;
        const deleted = await app.inject({ method: 'DELETE', url: `/api/family/children/${childId}`, headers: { authorization: `****** ${token}` } });
        expect(deleted.statusCode).toBe(204);
        expect(await prisma.user.findUnique({ where: { id: childId } })).toBeNull();
        expect(await prisma.deletedPseudo.findUnique({ where: { pseudo: childPseudo } })).toBeDefined();
        await prisma.deletedPseudo.delete({ where: { pseudo: childPseudo } }).catch(() => undefined);
    });
});
