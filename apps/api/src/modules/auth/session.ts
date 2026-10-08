import type { FastifyReply, FastifyRequest } from 'fastify';
import { getPrisma } from './db.js';
import {
    REFRESH_TTL_MS,
    errorBody,
    randomToken,
    refreshTokenHash,
    signAccessToken,
    verifyAccessToken,
} from './crypto.js';

/**
 * Sessions auth : émet access (15 min) + refresh opaque (7j, HttpOnly) + Device.
 * 08b-§4 : `POST refresh` rotation ; `POST logout` révoque le device courant.
 */

export const REFRESH_COOKIE = 'refreshToken';

export function refreshCookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string; maxAge: number } {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: Math.floor(REFRESH_TTL_MS / 1000),
    };
}

export async function issueSession(
    reply: FastifyReply,
    userId: string,
    label = 'appareil',
): Promise<{ accessToken: string; refreshExpiresAt: string }> {
    const prisma = getPrisma();
    const device = await prisma.device.create({ data: { userId, label } });
    const refresh = randomToken();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
    await prisma.authRefresh.create({
        data: { userId, deviceId: device.id, tokenHash: refreshTokenHash(refresh), expiresAt: refreshExpiresAt },
    });
    const accessToken = await signAccessToken(userId);
    reply.setCookie(REFRESH_COOKIE, refresh, refreshCookieOptions());
    return { accessToken, refreshExpiresAt: refreshExpiresAt.toISOString() };
}

export async function requireUserId(req: FastifyRequest, reply: FastifyReply): Promise<string | null> {
    const header = req.headers.authorization;
    if (!header?.startsWith('****** ')) {
        await reply.status(401).send(errorBody('UNAUTHORIZED', 'Connecte-toi pour continuer'));
        return null;
    }
    const userId = await verifyAccessToken(header.slice(7));
    if (!userId) {
        await reply.status(401).send(errorBody('TOKEN_EXPIRED', 'Session expirée, reconnecte-toi'));
        return null;
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
        await reply.status(401).send(errorBody('UNAUTHORIZED', 'Compte introuvable'));
        return null;
    }
    return user.id;
}
