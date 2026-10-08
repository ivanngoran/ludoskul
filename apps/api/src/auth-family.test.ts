import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

/** BE-2.8 Famille + consentement + rankingPublic (08b-§2, 10-§2). */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

describe.runIf(dbReady)('BE-2.8 Famille + consentement + rankingPublic', () => {
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

    async function registerParent() {
        const email = `${uniq('parent')}` + '@example.fr';
        emails.push(email);
        const reg = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo: `Parent_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        expect(reg.statusCode).toBe(201);
        userIds.push(reg.json().user.id as string);
        return { token: reg.json().accessToken as string };
    }

    it('parent crée enfant : isChild + rankingPublic=false + consentement', async () => {
        const { token } = await registerParent();
        const created = await app.inject({
            method: 'POST',
            url: '/api/family/children',
            headers: { authorization: `****** ${token}` },
            payload: { pseudo: `Kid_${Date.now().toString(36).slice(-6)}`, birthYear: 2018 },
        });
        expect(created.statusCode).toBe(201);
        expect(created.json().child.rankingPublic).toBe(false);
        const childId = created.json().child.id as string;
        userIds.push(childId);
        const child = await prisma.user.findUniqueOrThrow({ where: { id: childId } });
        expect(child.isChild).toBe(true);
        expect(child.email).toBeNull();
        const family = await prisma.family.findUnique({ where: { childUserId: childId } });
        expect(family?.consentText).toBe('v1');
    });

    it('GET children + PATCH rankingPublic (parent seul)', async () => {
        const { token } = await registerParent();
        const created = await app.inject({
            method: 'POST',
            url: '/api/family/children',
            headers: { authorization: `****** ${token}` },
            payload: { pseudo: `Kid2_${Date.now().toString(36).slice(-5)}`, birthYear: 2016 },
        });
        const childId = created.json().child.id as string;
        userIds.push(childId);
        const list = await app.inject({ method: 'GET', url: '/api/family/children', headers: { authorization: `****** ${token}` } });
        expect(list.statusCode).toBe(200);
        expect(list.json().children.length).toBeGreaterThanOrEqual(1);
        const patched = await app.inject({
            method: 'PATCH',
            url: `/api/family/children/${childId}`,
            headers: { authorization: `****** ${token}` },
            payload: { rankingPublic: true },
        });
        expect(patched.statusCode).toBe(200);
        expect(patched.json().child.rankingPublic).toBe(true);
    });

    it('invite/join one-shot : 1er OK, 2e rejeté', async () => {
        const { token } = await registerParent();
        const created = await app.inject({
            method: 'POST',
            url: '/api/family/children',
            headers: { authorization: `****** ${token}` },
            payload: { pseudo: `Kid3_${Date.now().toString(36).slice(-5)}`, birthYear: 2019 },
        });
        const childId = created.json().child.id as string;
        userIds.push(childId);
        const invite = await app.inject({
            method: 'POST',
            url: '/api/family/invite',
            headers: { authorization: `****** ${token}` },
            payload: { childId },
        });
        expect(invite.statusCode).toBe(200);
        const joinToken = invite.json().token as string;
        const first = await app.inject({ method: 'GET', url: `/api/family/join?token=${joinToken}` });
        expect(first.statusCode).toBe(200);
        expect(first.json().user.isChild).toBe(true);
        const second = await app.inject({ method: 'GET', url: `/api/family/join?token=${joinToken}` });
        expect(second.statusCode).toBe(422);
    });

    it('guest ne peut pas créer d’enfant → PARENTAL_CONSENT_REQUIRED', async () => {
        const guest = await app.inject({ method: 'POST', url: '/api/auth/guest', payload: { pseudo: `Gp_${Date.now().toString(36).slice(-6)}` } });
        const guestId = guest.json().user.id as string;
        userIds.push(guestId);
        const res = await app.inject({
            method: 'POST',
            url: '/api/family/children',
            headers: { authorization: `****** ${guest.json().accessToken}` },
            payload: { pseudo: `KidX_${Date.now().toString(36).slice(-5)}`, birthYear: 2018 },
        });
        expect(res.statusCode).toBe(403);
        expect(res.json()).toMatchObject({ error: { code: 'PARENTAL_CONSENT_REQUIRED' } });
    });
});
