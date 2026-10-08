import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { getPrisma } from '../auth/db.js';
import {
    OTP_CODES_PER_HOUR,
    OTP_MAX_ATTEMPTS,
    PHONE_OTP_TTL_MS,
    RESEND_COOLDOWN_MS,
    decryptTarget,
    encryptTarget,
    hashOtp,
    maskPhone,
    randomOtpCode,
    sha256Hex,
    targetHash,
    verifyOtpCode,
} from '../auth/crypto.js';
import { failure, type OtpFailure } from '../auth/otp.js';

/**
 * BE-2.4 Téléphone/WhatsApp OTP + fallback SMS (08b-§1/§4, 10-§2).
 * - Normalisation E.164 (libphonenumber) ; PHONE_INVALID si invalide.
 * - Code 6 chiffres, TTL 5 min, 5 essais, resend 60s, 5 codes/h/numéro.
 * - WhatsApp d'abord puis SMS **même code** (pas de nouveau code).
 * - Stockage phoneHash unique + E.164 chiffré ; logs hash seul ; affichage masqué.
 */

export type PhoneChannel = 'whatsapp' | 'sms';

export interface PhoneSendResult {
    sent: boolean;
    channel: PhoneChannel;
    expiresIn: number;
    resendIn: number;
    masked: string;
    debug?: { code: string };
}

export function normalizePhone(raw: string): string | null {
    try {
        const parsed = parsePhoneNumberWithError(raw);
        if (!parsed.isValid()) return null;
        return parsed.number;
    } catch {
        return null;
    }
}

export function phoneHash(e164: string): string {
    return targetHash('phone', e164);
}

async function deliverWhatsApp(e164: string, code: string): Promise<boolean> {
    void e164;
    void code;
    if (process.env.NODE_ENV === 'production' && !process.env.WHATSAPP_TOKEN) return false;
    return process.env.PHONE_MOCK_NON_WHATSAPP === '1' ? false : true;
}

async function deliverSms(e164: string, code: string): Promise<void> {
    void e164;
    void code;
}

export async function sendPhoneCode(e164: string, channel: 'auto' | PhoneChannel): Promise<PhoneSendResult | OtpFailure> {
    const prisma = getPrisma();
    const target = phoneHash(e164);
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
    const now = Date.now();
    let used: PhoneChannel = channel === 'sms' ? 'sms' : 'whatsapp';
    if (channel !== 'sms') {
        const delivered = await deliverWhatsApp(e164, code);
        if (!delivered) {
            await deliverSms(e164, code);
            used = 'sms';
        }
    } else {
        await deliverSms(e164, code);
    }
    await prisma.otpChallenge.create({
        data: {
            purpose: 'login',
            channel: used,
            targetHash: target,
            targetEncrypted: encryptTarget(`phone:${e164}`),
            codeHash: await hashOtp(code),
            expiresAt: new Date(now + PHONE_OTP_TTL_MS),
            resendAvailableAt: new Date(now + RESEND_COOLDOWN_MS),
        },
    });
    const result: PhoneSendResult = { sent: true, channel: used, expiresIn: 300, resendIn: 60, masked: maskPhone(e164) };
    if (process.env.NODE_ENV !== 'production') {
        result.debug = { code };
    }
    return result;
}

export async function verifyPhoneCode(e164: string, code: string): Promise<{ challengeId: string } | OtpFailure> {
    const prisma = getPrisma();
    const target = phoneHash(e164);
    const challenge = await prisma.otpChallenge.findFirst({
        where: { targetHash: target, channel: { in: ['whatsapp', 'sms'] }, consumedAt: null },
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

export function decryptPhoneTarget(encrypted: string | null): string | null {
    if (!encrypted) return null;
    const decrypted = decryptTarget(encrypted);
    return decrypted?.startsWith('phone:') ? decrypted.slice('phone:'.length) : null;
}

export { sha256Hex };
