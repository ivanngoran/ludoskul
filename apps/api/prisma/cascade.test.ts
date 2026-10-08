import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL ?? '';
const dbReady = dbUrl.length > 0;

describe.runIf(dbReady)('BE-1.1 cascade delete RGPD (DB live)', () => {
    it('delete User → cascade tout sauf DeletedPseudo', async () => {
        const prisma = new PrismaClient();
        const suffix = Date.now().toString(36);
        const user = await prisma.user.create({
            data: { pseudo: `Cascade_${suffix}`, guest: true },
        });
        const exercise = await prisma.exercise.findFirstOrThrow({ where: { code: 'ADD' } });
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                exerciseId: exercise.id,
                mode: 'TRAINING',
                seedBase: `seed-${suffix}`,
                startLevel: 1,
            },
        });
        await prisma.answer.create({
            data: {
                sessionId: session.id,
                mode: 'TRAINING',
                level: 1,
                questionIndex: 0,
                questionHash: `hash-${suffix}`,
                chosen: '1',
                correct: true,
                timeMs: 1000,
                inputMode: 'mouse',
            },
        });
        await prisma.identity.create({
            data: { userId: user.id, provider: 'guest', providerSub: `sub-${suffix}` },
        });
        await prisma.device.create({ data: { userId: user.id, label: 'test' } });
        await prisma.authRefresh.create({
            data: { userId: user.id, tokenHash: `hash-${suffix}`, expiresAt: new Date(Date.now() + 3600_000) },
        });

        await prisma.user.delete({ where: { id: user.id } });

        expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
        expect(await prisma.answer.count({ where: { sessionId: session.id } })).toBe(0);
        expect(await prisma.identity.count({ where: { userId: user.id } })).toBe(0);
        expect(await prisma.device.count({ where: { userId: user.id } })).toBe(0);
        expect(await prisma.authRefresh.count({ where: { userId: user.id } })).toBe(0);
        await prisma.$disconnect();
    });
});
