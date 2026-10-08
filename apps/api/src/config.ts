/**
 * Config centrale API (BE-1.2).
 * Source : docs 08-§7, 08b-§4, 10-§2, 19-§2.
 * Secrets via ENV/vault uniquement, jamais en repo.
 */

function required(name: string, fallback = ''): string {
    return process.env[name] ?? fallback;
}

function parseOrigins(): string[] {
    const raw = required('CORS_ORIGIN', required('FRONT_URL', 'http://localhost:5173'));
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

export function isJwtConfigured(): boolean {
    return config.jwtSecret.length >= 32 && config.jwtRefreshSecret.length >= 32;
}

/** CSP stricte opposable 10-§2 (domaine ajusté au figement 22-§1). */
export function cspDirectives(): Record<string, string[]> {
    return {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'connect-src': ["'self'", 'https://api.ludoskul.app', 'wss://api.ludoskul.app'],
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
