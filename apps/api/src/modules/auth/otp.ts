import { getPrisma } from './db.js';
import {
    EMAIL_OTP_TTL_MS,
    OTP_CODES_PER_HOUR,
    OTP_MAX_ATTEMPTS,
    RESEND_COOLDOWN_MS,
    decryptTarget,
    encryptTarget,
    errorBody,
    hashOtp,
    randomOtpCode,
    randomToken,
    sha256Hex,
    targetHash,
    verifyOtpCode,
} from './crypto.js';

/**
 * Challenges OTP email (BE-2.1, 08b-§4).
 * - Code 6 chiffres, hash argon2id ; TTL 15 min ; 5 essais max puis invalidé.
 * - Resend 60s ; 5 codes/h/email ; réponses génériques anti-énumération.
 * - Lien magique : token opaque stocké hashé (one-shot, même TTL).
 * - Logs = hash seul, jamais le code (10-§2).
 */

export interface OtpSendResult {
    expiresIn: number;
    resendIn: number;
    /** Code + token en clair UNIQUEMENT hors prod (provider mail mock). Jamais loggé. */
    debug?: { code: string; magicToken: string };
}

export interface OtpFailure {
    status: number;
    code: string;
    message: string;
}

export function failure(status: number, code: string, message: string): OtpFailure {
    return { status, code, message };
}

export function sendFailure(
    reply: { status: (n: number) => { send: (b: unknown) => unknown } },
    f: OtpFailure,
): unknown {
    return reply.status(f.status).send(errorBody(f.code, f.message));
}

export async function sendEmailCode(emailNormalized: string, purpose: string): Promise<OtpSendResult | OtpFailure> {
    const prisma = getPrisma();
    const target = targetHash('email', emailNormalized);
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const count = await prisma.otpChallenge.count({ where: { targetHash: target, createdAt: { gte: since } } });
    if (count >= OTP_CODES_PER_HOUR) {
        return failure(429, 'RATE_LIMITED', 'Trop de codes demandés. Réessaie dans une heure.');
    }
    const latest = await prisma.otpChallenge.findFirst({
        where: { targetHash: target, consumedAt: null },
        orderBy: { createdAt: 'desc' },
    });
    if (latest && latest.resendAvailableAt.getTime() > Date.now()) {
        const resendIn = Math.ceil((latest.resendAvailableAt.getTime() - Date.now()) / 1000);
        return failure(429, 'RESEND_TOO_SOON', `Patiente ${resendIn}s avant de renvoyer un code`);
    }
    const code = randomOtpCode();
    const magicToken = randomToken(32);
    const now = Date.now();
    await prisma.otpChallenge.create({
        data: {
            purpose,
            channel: 'email',
            targetHash: target,
            targetEncrypted: encryptTarget(`email:${emailNormalized}`),
            codeHash: await hashOtp(code),
            tokenHash: sha256Hex(`magic:${magicToken}`),
            expiresAt: new Date(now + EMAIL_OTP_TTL_MS),
            resendAvailableAt: new Date(now + RESEND_COOLDOWN_MS),
        },
    });
    await deliverEmail(emailNormalized, code, magicToken, purpose);
    const result: OtpSendResult = { expiresIn: 900, resendIn: 60 };
    if (process.env.NODE_ENV !== 'production') {
        result.debug = { code, magicToken };
    }
    return result;
}

export async function verifyEmailCode(
    emailNormalized: string,
    code: string,
): Promise<{ challengeId: string } | OtpFailure> {
    const prisma = getPrisma();
    const target = targetHash('email', emailNormalized);
    const challenge = await prisma.otpChallenge.findFirst({
        where: { targetHash: target, channel: { in: ['email', 'email_password'] }, consumedAt: null },
        orderBy: { createdAt: 'desc' },
    });
    if (!challenge) {
        return failure(422, 'INVALID_OTP', 'Code invalide. Demande un nouveau code.');
    }
    if (challenge.expiresAt.getTime() <= Date.now()) {
        return failure(422, 'OTP_EXPIRED', 'Code expiré. Demande un nouveau code.');
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
        return failure(422, 'OTP_TOO_MANY_ATTEMPTS', 'Trop de tentatives. Demande un nouveau code.');
    }
    const valid = await verifyOtpCode(challenge.codeHash, code);
    if (!valid) {
        const attempts = challenge.attempts + 1;
        await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts } });
        return failure(422, 'INVALID_OTP', 'Code invalide. Réessaie.');
    }
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    return { challengeId: challenge.id };
}

export async function consumeMagicToken(token: string): Promise<{ email: string } | OtpFailure> {
    const prisma = getPrisma();
    const challenge = await prisma.otpChallenge.findFirst({ where: { tokenHash: sha256Hex(`magic:${token}`) } });
    if (!challenge || challenge.consumedAt) {
        return failure(422, 'INVALID_OTP', 'Lien invalide ou déjà utilisé.');
    }
    if (challenge.expiresAt.getTime() <= Date.now()) {
        return failure(422, 'OTP_EXPIRED', 'Lien expiré. Demande un nouveau code.');
    }
    const decrypted = challenge.targetEncrypted ? decryptTarget(challenge.targetEncrypted) : null;
    if (!decrypted?.startsWith('email:')) {
        return failure(422, 'INVALID_OTP', 'Lien invalide ou déjà utilisé.');
    }
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    return { email: decrypted.slice('email:'.length) };
}

/** Provider mail : mock hors prod (log hash uniquement). Prod : SMTP/API branché en BE-7. */
async function deliverEmail(email: string, code: string, magicToken: string, purpose: string): Promise<void> {
    void email;
    void code;
    void magicToken;
    void purpose;
}
