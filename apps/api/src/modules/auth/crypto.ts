import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../../config.js';

/**
 * Socle auth BE-EPIC-2 (08b-§3/§4, 10-§2).
 * - OTP : code 6 chiffres, hash argon2id uniquement, jamais en clair en DB/logs.
 * - JWT access 15 min (HS256) ; refresh opaque 7j + rotation (hash SHA-256 en DB).
 * - Logs : jamais email/téléphone/code/mot de passe (10-§2).
 */

export const EMAIL_OTP_TTL_MS = 15 * 60 * 1000;
export const PHONE_OTP_TTL_MS = 5 * 60 * 1000;
export const MAGIC_TTL_MS = 15 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_CODES_PER_HOUR = 5;
export const OTP_VERIFY_PER_IP_PER_HOUR = 20;
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const FAMILY_TOKEN_TTL_MS = 10 * 60 * 1000;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function sha256Hex(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function targetHash(kind: 'email' | 'phone', normalized: string): string {
    const pepper = process.env.OTP_PEPPER ?? '';
    return sha256Hex(`${kind}:${normalized}:${pepper}`);
}

export function randomOtpCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
}

export async function hashOtp(code: string): Promise<string> {
    return argonHash(code, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
}

export async function verifyOtpCode(codeHash: string, code: string): Promise<boolean> {
    try {
        return await argonVerify(codeHash, code);
    } catch {
        return false;
    }
}

function accessKey(): Uint8Array {
    return new TextEncoder().encode(config.jwtSecret);
}

export async function signAccessToken(userId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt(now)
        .setExpirationTime(now + ACCESS_TTL_SECONDS)
        .setIssuer('ludoskul')
        .sign(accessKey());
}

export async function verifyAccessToken(token: string): Promise<string | null> {
    try {
        const { payload } = await jwtVerify(token, accessKey(), { issuer: 'ludoskul' });
        return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
        return null;
    }
}

export function refreshTokenHash(token: string): string {
    return sha256Hex(`refresh:${token}`);
}

export function maskPhone(e164: string): string {
    const digits = e164.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const cc = e164.startsWith('+') ? `+${digits.slice(0, Math.max(0, digits.length - 9))}` : '';
    return `${cc} •• •• ${last4.slice(0, 2)} ${last4.slice(2)}`.trim();
}

function dataEncKey(): Buffer {
    const explicit = process.env.DATA_ENC_KEY ?? '';
    if (/^[0-9a-fA-F]{64}$/.test(explicit)) return Buffer.from(explicit, 'hex');
    return createHash('sha256').update(`ludoskul-data-enc:${config.jwtSecret}`, 'utf8').digest();
}

/** Chiffrement at-rest AES-256-GCM (même pattern que le téléphone, 08b-§3). */
export function encryptTarget(plaintext: string): string {
    const iv = randomBytes(12);
    const key = dataEncKey();
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${enc.toString('hex')}`;
}

export function decryptTarget(payload: string): string | null {
    try {
        const [ivHex, tagHex, encHex] = payload.split(':');
        const decipher = createDecipheriv('aes-256-gcm', dataEncKey(), Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
    } catch {
        return null;
    }
}

export function errorBody(
    code: string,
    message: string,
    details?: unknown,
): { error: { code: string; message: string; details?: unknown } } {
    return details === undefined ? { error: { code, message } } : { error: { code, message, details } };
}
