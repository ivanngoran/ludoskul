/**
 * Config centrale API (BE-1.2).
 * Source : docs 08-§7, 08b-§4, 10-§2, 19-§2.
 * Secrets via ENV/vault uniquement, jamais en repo.
 */

function required(name: string, fallback = ''): string {
    return process.env[name] ?? fallback;
}

function parseOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
    const raw = env.CORS_ORIGIN ?? env.FRONT_URL ?? '';
    if (!raw.trim()) {
        if (env.NODE_ENV === 'production') {
            throw new Error('CORS_ORIGIN ou FRONT_URL requis en production (10-§2 : CORS = origine front seule)');
        }
        return ['http://localhost:5173'];
    }
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export const config = {
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl: required('DATABASE_URL', ''),
    redisUrl: required('REDIS_URL', ''),
    corsOrigins: parseOrigins(),
    jwtSecret: required('JWT_SECRET', ''),
    jwtRefreshSecret: required('JWT_REFRESH_SECRET', ''),
    frontUrl: required('FRONT_URL', 'http://localhost:5173'),
};

export function isJwtConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
    const jwt = env.JWT_SECRET ?? '';
    const refresh = env.JWT_REFRESH_SECRET ?? '';
    return jwt.length >= 32 && refresh.length >= 32;
}

/** Fail-fast prod (10-§2, 19-§2) : secrets et origine front requis au boot. */
export function assertProdConfig(env: NodeJS.ProcessEnv = process.env): void {
    if (env.NODE_ENV !== 'production') return;
    const origins = parseOrigins(env);
    if (origins.length === 0) {
        throw new Error('CORS_ORIGIN ou FRONT_URL requis en production (10-§2)');
    }
    if (!isJwtConfigured(env)) {
        throw new Error('JWT_SECRET et JWT_REFRESH_SECRET ≥32 requis en production (08b-§4)');
    }
}

/** CSP stricte opposable 10-§2 (domaine ajusté au figement 22-§1).
 * connect-src externalisé via API_URL/FRONT_URL (preview/staging) : jamais en dur seul. */
export function cspDirectives(env: NodeJS.ProcessEnv = process.env): Record<string, string[]> {
    const extra = new Set<string>();
    for (const raw of [env.API_URL, env.FRONT_URL, env.CORS_ORIGIN]) {
        for (const origin of (raw ?? '').split(',')) {
            const o = origin.trim().replace(/\/$/, '');
            if (o.startsWith('https://') || o.startsWith('wss://')) extra.add(o);
        }
    }
    return {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'connect-src': ["'self'", 'https://api.ludoskul.app', 'wss://api.ludoskul.app', ...extra],
        'img-src': ["'self'", 'data:'],
        'media-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
    };
}

/** Rate limits opposables 08-§7 (global). Détail par route en BE-7.1. */
export const rateLimits = {
    globalMax: 100,
    globalWindow: '1 minute',
} as const;
