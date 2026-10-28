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
    // Forme large : la route normalise et répond VALIDATION_ERROR FR (anti-énumération).
    email: z.string().min(1),
    purpose: otpPurposeSchema.default('login'),
});

export const emailVerifySchema = z.object({
    email: z.string().min(1),
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
    // Forme large : la route valide E.164 (libphonenumber) et répond PHONE_INVALID (08b-§4).
    phone: z.string().min(1),
    channel: z.enum(['auto', 'whatsapp', 'sms']).default('auto'),
});

export const phoneVerifySchema = z.object({
    phone: z.string().min(1),
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

export const childSchema = z.object({
    id: z.string(),
    pseudo: z.string(),
    birthYear: z.number().nullable().optional(),
    xp: z.number().optional(),
    level: z.number().optional(),
    rankingPublic: z.boolean().optional(),
});

export const patchChildResultSchema = z.object({
    child: childSchema,
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
        accessibility: z.record(z.string(), z.unknown()).optional(),
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

/** Schémas de réponse auth (17-§1 : openapi-check exige un schéma typé par code). */

export const authUserSchema = z.object({
    id: z.string(),
    pseudo: z.string(),
    level: z.number().optional(),
    xp: z.number().optional(),
    guest: z.boolean().optional(),
    isChild: z.boolean().optional(),
});

export const sessionTokensSchema = z.object({
    user: authUserSchema,
    accessToken: z.string(),
    refreshExpiresAt: z.string(),
});

export const refreshResultSchema = z.object({
    accessToken: z.string(),
    refreshExpiresAt: z.string(),
});

export const otpSentSchema = z.object({
    sent: z.boolean(),
    expiresIn: z.number(),
    resendIn: z.number(),
    // Test-only hors prod (provider mail mock) : jamais présent en production.
    debug: z.object({ code: z.string(), magicToken: z.string().optional() }).optional(),
});

export const oauthUrlSchema = z.object({
    url: z.string(),
    state: z.string(),
});

export const oauthLinkResultSchema = z.object({
    linked: z.boolean(),
    provider: z.string(),
});

export const upgradeResultSchema = z.object({
    upgraded: z.boolean(),
    already: z.boolean().optional(),
    user: authUserSchema,
    accessToken: z.string(),
    refreshExpiresAt: z.string(),
});

export const identityItemSchema = z.object({
    provider: z.string(),
    emailLower: z.string().nullable().optional(),
    phoneMasked: z.string().nullable().optional(),
    emailVerifiedAt: z.string().nullable().optional(),
    phoneVerifiedAt: z.string().nullable().optional(),
    lastUsedAt: z.string().optional(),
    createdAt: z.string().optional(),
});

export const identityListSchema = z.object({
    identities: z.array(identityItemSchema),
});

export const deviceItemSchema = z.object({
    id: z.string(),
    label: z.string(),
    lastSeenAt: z.string().optional(),
    createdAt: z.string().optional(),
});

export const deviceListSchema = z.object({
    devices: z.array(deviceItemSchema),
});

export const meSchema = z.object({
    id: z.string(),
    email: z.string().nullable().optional(),
    pseudo: z.string(),
    avatarId: z.string().optional(),
    country: z.string().nullable().optional(),
    xp: z.number().optional(),
    level: z.number().optional(),
    theme: z.string().optional(),
    accessibility: z.unknown().optional(),
    guest: z.boolean().optional(),
    rankingPublic: z.boolean().optional(),
    isChild: z.boolean().optional(),
    providers: z.array(z.string()).optional(),
    devices: z.number().optional(),
});

export const patchMeResultSchema = z.object({
    id: z.string(),
    pseudo: z.string(),
    avatarId: z.string().optional(),
    country: z.string().nullable().optional(),
    theme: z.string().optional(),
    accessibility: z.unknown().optional(),
});

export const passwordResetResultSchema = z.object({
    reset: z.boolean(),
});

export const mergeResultSchema = z.object({
    merged: z.boolean(),
    already: z.boolean().optional(),
    user: authUserSchema,
});

export const familyChildrenSchema = z.object({
    children: z.array(childSchema.extend({ progress: z.array(z.unknown()).optional() })),
});

export const createChildSchema = z.object({
    child: childSchema,
});

export const familyInviteResultSchema = z.object({
    token: z.string(),
    expiresIn: z.number(),
});

export const phoneSentSchema = z.object({
    sent: z.boolean(),
    channel: z.string(),
    expiresIn: z.number(),
    resendIn: z.number(),
    // Test-only hors prod (provider SMS mock) : jamais présent en production.
    debug: z.object({ code: z.string() }).optional(),
});
