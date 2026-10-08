import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app.js';

/** BE-2.9 Profil lecture/MAJ/suppression (08-§2, 10-§3). */

const dbReady = (process.env.DATABASE_URL ?? '').length > 0;

function uniq(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

describe.runIf(dbReady)('BE-2.9 Profil lecture/MAJ/suppression', () => {
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
        const email = `${uniq('me')}` + '@example.fr';
        emails.push(email);
        const reg = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: { email, pseudo: `Me_${Date.now().toString(36).slice(-6)}`, password: 'secret12' },
        });
        expect(reg.statusCode).toBe(201);
        userIds.push(reg.json().user.id as string);
        return { token: reg.json().accessToken as string, email, pseudo: reg.json().user.pseudo as string };
    }

    it('GET me : profil complet + providers + devices', async () => {
        const { token } = await registerUser();
        const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { authorization: `****** ${token}` } });
        expect(me.statusCode).toBe(200);
        expect(me.json()).toMatchObject({ guest: false, rankingPublic: true, isChild: false, devices: 1 });
        expect(me.json().providers).toContain('email');
    });

    it('PATCH me : pseudo pris → PSEUDO_TAKEN ; MAJ OK sinon', async () => {
        const first = await registerUser();
        const second = await registerUser();
        const clash = await app.inject({
            method: 'PATCH',
            url: '/api/auth/me',
            headers: { authorization: `****** ${first.token}` },
            payload: { pseudo: second.pseudo },
        });
        expect(clash.statusCode).toBe(409);
        expect(clash.json()).toMatchObject({ error: { code: 'PSEUDO_TAKEN' } });
        const ok = await app.inject({
            method: 'PATCH',
            url: '/api/auth/me',
            headers: { authorization: `****** ${first.token}` },
            payload: { theme: 'ocean', country: 'FR' },
        });
        expect(ok.statusCode).toBe(200);
        expect(ok.json()).toMatchObject({ theme: 'ocean', country: 'FR' });
    });

    it('DELETE me : sans preuve → 403 ; avec password → 204 + cascade + pseudo réservé', async () => {
        const { token, email, pseudo } = await registerUser();
        const noProof = await app.inject({
            method: 'DELETE',
            url: '/api/auth/me',
            headers: { authorization: `****** ${token}` },
            payload: {},
        });
        expect(noProof.statusCode).toBe(403);
        const badProof = await app.inject({
            method: 'DELETE',
            url: '/api/auth/me',
            headers: { authorization: `****** ${token}` },
            payload: { password: 'faux1234' },
        });
        expect(badProof.statusCode).toBe(403);
        const deleted = await app.inject({
            method: 'DELETE',
            url: '/api/auth/me',
            headers: { authorization: `****** ${token}` },
            payload: { password: 'secret12' },
        });
        expect(deleted.statusCode).toBe(204);
        expect(await prisma.user.findFirst({ where: { email } })).toBeNull();
        const reserved = await prisma.deletedPseudo.findUnique({ where: { pseudo } });
        expect(reserved).toBeDefined();
        await prisma.deletedPseudo.delete({ where: { pseudo } }).catch(() => undefined);
    });
});
