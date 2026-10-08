import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrisma } from '../modules/auth/db.js';
import { REFRESH_TTL_MS, errorBody, randomToken, refreshTokenHash, signAccessToken } from '../modules/auth/crypto.js';
import { REFRESH_COOKIE, issueSession, refreshCookieOptions, requireUserId } from '../modules/auth/session.js';

/**
 * BE-2.7 Devices + refresh rotation + logout (08-§2, 08b-§4, 10-§2).
 * - POST refresh (cookie) : rotation à chaque usage ; réutilisation d'un token
 *   révoqué = vol détecté → révocation famille (tous devices) + 401 TOKEN_EXPIRED.
 * - GET devices / DELETE devices/:id / POST logout (device courant).
 */

export async function deviceRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/auth/refresh', async (req, reply) => {
        const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
        if (!raw) {
            return reply.status(401).send(errorBody('TOKEN_EXPIRED', 'Session expirée, reconnecte-toi'));
        }
        const prisma = getPrisma();
        const hash = refreshTokenHash(raw);
        const stored = await prisma.authRefresh.findUnique({ where: { tokenHash: hash } });
        if (!stored) {
            return reply.status(401).send(errorBody('TOKEN_EXPIRED', 'Session expirée, reconnecte-toi'));
        }
        if (stored.revokedAt || stored.expiresAt.getTime() <= Date.now()) {
            await prisma.authRefresh.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } });
            await prisma.device.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } });
            return reply.status(401).send(errorBody('TOKEN_EXPIRED', 'Session compromise détectée. Reconnecte-toi sur tous tes appareils.'));
        }
        const next = randomToken();
        const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
        await prisma.$transaction([
            prisma.authRefresh.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
            prisma.authRefresh.create({
                data: { userId: stored.userId, deviceId: stored.deviceId, tokenHash: refreshTokenHash(next), expiresAt: refreshExpiresAt },
            }),
        ]);
        if (stored.deviceId) {
            await prisma.device.update({ where: { id: stored.deviceId }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
        }
        reply.setCookie(REFRESH_COOKIE, next, refreshCookieOptions());
        const accessToken = await signAccessToken(stored.userId);
        return { accessToken, refreshExpiresAt: refreshExpiresAt.toISOString() };
    });

    app.post('/api/auth/logout', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const prisma = getPrisma();
        const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
        if (raw) {
            const stored = await prisma.authRefresh.findUnique({ where: { tokenHash: refreshTokenHash(raw) } });
            if (stored) {
                await prisma.authRefresh.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
                if (stored.deviceId) {
                    await prisma.device.update({ where: { id: stored.deviceId }, data: { revokedAt: new Date() } }).catch(() => undefined);
                }
            }
        }
        reply.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
        return reply.status(204).send();
    });

    app.get('/api/auth/devices', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const prisma = getPrisma();
        const devices = await prisma.device.findMany({ where: { userId, revokedAt: null }, orderBy: { lastSeenAt: 'desc' } });
        return { devices: devices.map((d) => ({ id: d.id, label: d.label, lastSeenAt: d.lastSeenAt, createdAt: d.createdAt })) };
    });

    app.delete('/api/auth/devices/:id', async (req, reply) => {
        const userId = await requireUserId(req, reply);
        if (!userId) return;
        const parsed = z.string().min(1).safeParse((req.params as { id: string }).id);
        if (!parsed.success) {
            return reply.status(400).send(errorBody('VALIDATION_ERROR', 'Device invalide'));
        }
        const prisma = getPrisma();
        const device = await prisma.device.findFirst({ where: { id: parsed.data, userId } });
        if (!device) {
            return reply.status(404).send(errorBody('NOT_FOUND', 'Appareil introuvable'));
        }
        await prisma.device.update({ where: { id: device.id }, data: { revokedAt: new Date() } });
        await prisma.authRefresh.updateMany({ where: { deviceId: device.id, revokedAt: null }, data: { revokedAt: new Date() } });
        return reply.status(204).send();
    });

    void issueSession;
}
