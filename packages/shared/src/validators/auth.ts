import { z } from 'zod';

export const pseudoSchema = z
    .string()
    .min(3)
    .max(16)
    .regex(/^[A-Za-z0-9_-]+$/);

export const emailSchema = z.string().trim().toLowerCase().email();

/**
 * Schémas auth partagés front/back (08b-§4).
 * Normalisation : email trim+lowercase (emailSchema), téléphone E.164 validé
 * côté serveur via libphonenumber (regex de garde ici).
 */

export const otpPurposeSchema = z.enum([
    'register',
    'login',
    'link',
    'reset_password',
    'delete_account',
    'merge',
]);

export const otpCodeSchema = z.string().regex(/^\d{6}$/, 'Code à 6 chiffres requis');

export const emailCodeSchema = z.object({
    email: emailSchema,
    purpose: otpPurposeSchema.default('login'),
});

export const emailVerifySchema = z.object({
    email: emailSchema,
    code: otpCodeSchema,
    pseudo: pseudoSchema.optional(),
    purpose: otpPurposeSchema.optional(),
});

export const magicQuerySchema = z.object({
    token: z.string().min(32),
});

const passwordSchema = z.string().min(1, 'Mot de passe requis');

export const registerSchema = z.object({
    email: emailSchema,
    pseudo: pseudoSchema,
    password: passwordSchema,
    birthYear: z.number().int().min(1900).max(2100).optional(),
});

export const loginSchema = z.object({
    emailOrPseudo: z.string().trim().min(1),
    password: z.string().min(1),
});

export const passwordForgotSchema = z.object({
    email: emailSchema,
});

export const passwordResetSchema = z.object({
    email: emailSchema,
    code: otpCodeSchema,
    newPassword: passwordSchema,
});

export const oauthProviderSchema = z.enum(['google', 'apple']);

export const oauthLinkSchema = z.object({
    code: z.string().min(1),
});

export const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, 'Numéro E.164 requis');

export const phoneCodeSchema = z.object({
    phone: phoneSchema,
    channel: z.enum(['auto', 'whatsapp', 'sms']).default('auto'),
});

export const phoneVerifySchema = z.object({
    phone: phoneSchema,
    code: otpCodeSchema,
    pseudo: pseudoSchema.optional(),
});

export const guestSchema = z.object({
    pseudo: pseudoSchema,
});

export const upgradeProofSchema = z.union([
    z.object({ type: z.literal('email'), email: emailSchema, code: otpCodeSchema }),
    z.object({ type: z.literal('phone'), phone: phoneSchema, code: otpCodeSchema }),
    z.object({ type: z.literal('oauth'), provider: oauthProviderSchema, code: z.string().min(1) }),
]);

export const guestUpgradeSchema = z.object({
    proof: upgradeProofSchema,
});

export const mergeProofSchema = z.union([
    z.object({ type: z.literal('otp'), code: otpCodeSchema }),
    z.object({ type: z.literal('oauth'), provider: oauthProviderSchema, code: z.string().min(1) }),
]);

export const mergeConfirmSchema = z.object({
    sourceUserId: z.string().min(1).optional(),
    targetEmail: emailSchema,
    proof: mergeProofSchema,
});

export const familyChildSchema = z.object({
    pseudo: pseudoSchema,
    birthYear: z.number().int().min(1900).max(2100),
});

export const familyInviteSchema = z.object({
    childId: z.string().min(1),
});

export const patchChildSchema = z.object({
    rankingPublic: z.boolean(),
});

export const patchMeSchema = z
    .object({
        pseudo: pseudoSchema.optional(),
        avatarId: z.string().min(1).max(32).optional(),
        country: z
            .string()
            .regex(/^[A-Z]{2}$/, 'Pays ISO2 requis')
            .optional(),
        theme: z.string().min(1).max(32).optional(),
        accessibility: z.record(z.unknown()).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, 'Aucun champ à mettre à jour');

export const deleteMeSchema = z.object({
    password: z.string().min(1).optional(),
    otp: z.object({ email: emailSchema, code: otpCodeSchema }).optional(),
    oauth: z.object({ provider: oauthProviderSchema, code: z.string().min(1) }).optional(),
});

export const familyJoinQuerySchema = z.object({
    token: z.string().min(32),
});
