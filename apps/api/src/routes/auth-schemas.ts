import type { FastifySchema } from 'fastify';
import { z } from 'zod';
import {
    authUserSchema,
    createChildSchema,
    deviceListSchema,
    emailCodeSchema,
    emailVerifySchema,
    errorResponseSchema,
    familyChildrenSchema,
    familyChildSchema,
    familyInviteResultSchema,
    guestSchema,
    guestUpgradeSchema,
    identityListSchema,
    loginSchema,
    magicQuerySchema,
    meSchema,
    mergeConfirmSchema,
    mergeResultSchema,
    oauthLinkResultSchema,
    oauthLinkSchema,
    oauthUrlSchema,
    otpSentSchema,
    passwordForgotSchema,
    passwordResetResultSchema,
    passwordResetSchema,
    refreshResultSchema,
    patchChildSchema,
    patchChildResultSchema,
    patchMeResultSchema,
    patchMeSchema,
    phoneSentSchema,
    phoneCodeSchema,
    phoneVerifySchema,
    registerSchema,
    sessionTokensSchema,
    upgradeResultSchema,
} from '@ludoskul/shared';

function json(schema: z.ZodType): unknown {
    return z.toJSONSchema(schema, { target: 'openapi-3.0' });
}

function err(...codes: number[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const c of codes) out[String(c)] = { description: `Erreur ${c}`, content: { 'application/json': { schema: json(errorResponseSchema) } } };
    return out;
}

function ok(code: number, description: string, schema: z.ZodType, extraErr: number[] = []): Record<string, unknown> {
    return {
        [String(code)]: { description, content: { 'application/json': { schema: json(schema) } } },
        ...err(...extraErr),
    };
}

/** Schémas OpenAPI auth BE-EPIC-2 (08b-§4, 17-§1). */
export const authSchemas: Record<string, FastifySchema> = {
    emailCode: {
        body: json(emailCodeSchema),
        response: { ...ok(200, 'Code envoyé', otpSentSchema), ...err(400, 429) },
    },
    emailVerify: {
        body: json(emailVerifySchema),
        response: { ...ok(200, 'Vérifié', sessionTokensSchema), ...ok(201, 'Compte créé', sessionTokensSchema), ...err(400, 422, 429) },
    },
    emailMagic: {
        querystring: json(magicQuerySchema),
        response: { ...ok(200, 'Lien accepté', sessionTokensSchema), ...err(400, 422) },
    },
    register: {
        body: json(registerSchema),
        response: { ...ok(201, 'Compte créé', sessionTokensSchema), ...err(400, 409) },
    },
    login: {
        body: json(loginSchema),
        response: { ...ok(200, 'Connecté', sessionTokensSchema), ...err(400, 401) },
    },
    passwordForgot: {
        body: json(passwordForgotSchema),
        response: { ...ok(200, 'Code envoyé', otpSentSchema), ...err(400, 429) },
    },
    passwordReset: {
        body: json(passwordResetSchema),
        response: { ...ok(200, 'Mot de passe réinitialisé', passwordResetResultSchema), ...err(400, 422) },
    },
    oauthUrl: {
        response: { ...ok(200, 'URL OAuth', oauthUrlSchema), ...err(400) },
    },
    oauthCallback: {
        response: { ...ok(200, 'Connecté', sessionTokensSchema), ...ok(201, 'Compte créé', sessionTokensSchema), ...err(400, 422, 502) },
    },
    oauthLink: {
        body: json(oauthLinkSchema),
        response: { ...ok(200, 'Provider lié', oauthLinkResultSchema), ...err(400, 401, 409, 422, 502) },
    },
    phoneCode: {
        body: json(phoneCodeSchema),
        response: { ...ok(200, 'Code envoyé', phoneSentSchema), ...err(400, 429) },
    },
    phoneVerify: {
        body: json(phoneVerifySchema),
        response: { ...ok(200, 'Vérifié', sessionTokensSchema), ...ok(201, 'Compte créé', sessionTokensSchema), ...err(400, 422, 429) },
    },
    guest: {
        body: json(guestSchema),
        response: { ...ok(201, 'Invité créé', sessionTokensSchema), ...err(400) },
    },
    guestUpgrade: {
        body: json(guestUpgradeSchema),
        response: { ...ok(200, 'Compte sauvegardé', upgradeResultSchema), ...err(400, 401, 422) },
    },
    identities: {
        response: { ...ok(200, 'Providers liés', identityListSchema), ...err(401) },
    },
    unlinkIdentity: {
        response: { 204: { description: 'Moyen retiré' }, ...err(401, 404, 409) },
    },
    refresh: {
        response: { ...ok(200, 'Session renouvelée', refreshResultSchema), ...err(401) },
    },
    logout: {
        response: { 204: { description: 'Déconnecté' }, ...err(401) },
    },
    devices: {
        response: { ...ok(200, 'Appareils', deviceListSchema), ...err(401) },
    },
    revokeDevice: {
        response: { 204: { description: 'Appareil révoqué' }, ...err(400, 401, 404) },
    },
    me: {
        response: { ...ok(200, 'Profil', meSchema), ...err(401) },
    },
    patchMe: {
        body: json(patchMeSchema),
        response: { ...ok(200, 'Profil mis à jour', patchMeResultSchema), ...err(400, 401, 409) },
    },
    deleteMe: {
        response: { 204: { description: 'Compte supprimé' }, ...err(401, 403) },
    },
    mergeConfirm: {
        body: json(mergeConfirmSchema),
        response: { ...ok(200, 'Comptes fusionnés', mergeResultSchema), ...err(400, 401, 409, 422) },
    },
    createChild: {
        body: json(familyChildSchema),
        response: { ...ok(201, 'Enfant créé', createChildSchema), ...err(400, 403) },
    },
    listChildren: {
        response: { ...ok(200, 'Enfants', familyChildrenSchema), ...err(401) },
    },
    familyInvite: {
        response: { ...ok(200, 'Code famille', familyInviteResultSchema), ...err(400, 401, 403) },
    },
    familyJoin: {
        response: { ...ok(200, 'Enfant connecté', sessionTokensSchema), ...err(400, 404, 422) },
    },
    patchChild: {
        body: json(patchChildSchema),
        response: { ...ok(200, 'Enfant mis à jour', patchChildResultSchema), ...err(400, 401, 403) },
    },
    deleteChild: {
        response: { 204: { description: 'Profil enfant supprimé' }, ...err(401, 403) },
    },
};

export { authUserSchema };
