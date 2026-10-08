import type { FastifyInstance, FastifySchema } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';
import {
    abandonResponseSchema,
    activeSessionsResponseSchema,
    answerResponseSchema,
    answerSchema,
    badgeListResponseSchema,
    completeResponseSchema,
    completeSessionSchema,
    configFlagsResponseSchema,
    createSessionResponseSchema,
    createSessionSchema,
    errorResponseSchema,
    exerciseDetailResponseSchema,
    exerciseListResponseSchema,
    exerciseTtsResponseSchema,
    healthResponseSchema,
    questionsResponseSchema,
    readyResponseSchema,
    stopResponseSchema,
    trainingLevelResponseSchema,
    trainingLevelSchema,
} from '@ludoskul/shared';

function json(schema: ZodTypeAny): unknown {
    return zodToJsonSchema(schema, { target: 'openApi3' });
}

function err(...codes: number[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const c of codes) out[String(c)] = { description: `Erreur ${c}`, content: { 'application/json': { schema: json(errorResponseSchema) } } };
    return out;
}

export const openApiSchemas: Record<string, FastifySchema> = {
    health: {
        response: { 200: { description: 'Santé OK', content: { 'application/json': { schema: json(healthResponseSchema) } } } },
    },
    ready: {
        response: {
            200: { description: 'Prêt', content: { 'application/json': { schema: json(readyResponseSchema) } } },
            503: { description: 'Pas prêt (DB non branchée)', content: { 'application/json': { schema: json(readyResponseSchema) } } },
        },
    },
    exerciseList: {
        response: { 200: { description: 'Catalogue', content: { 'application/json': { schema: json(exerciseListResponseSchema) } } } },
    },
    exerciseDetail: {
        response: {
            200: { description: 'Détail exercice', content: { 'application/json': { schema: json(exerciseDetailResponseSchema) } } },
            ...err(404),
        },
    },
    exerciseTts: {
        response: { 200: { description: 'Manifeste TTS', content: { 'application/json': { schema: json(exerciseTtsResponseSchema) } } } },
    },
    badgeList: {
        response: { 200: { description: 'Badges', content: { 'application/json': { schema: json(badgeListResponseSchema) } } } },
    },
    createSession: {
        body: json(createSessionSchema),
        response: {
            201: { description: 'Session créée', content: { 'application/json': { schema: json(createSessionResponseSchema) } } },
            ...err(400, 429),
        },
    },
    activeSessions: {
        response: { 200: { description: 'Sessions actives', content: { 'application/json': { schema: json(activeSessionsResponseSchema) } } } },
    },
    questions: {
        response: {
            200: { description: 'Questions sans réponses', content: { 'application/json': { schema: json(questionsResponseSchema) } } },
            ...err(404),
        },
    },
    trainingLevel: {
        body: json(trainingLevelSchema),
        response: {
            200: { description: 'Niveau training', content: { 'application/json': { schema: json(trainingLevelResponseSchema) } } },
            ...err(400, 404),
        },
    },
    answers: {
        body: json(answerSchema),
        response: {
            200: { description: 'Réponse validée', content: { 'application/json': { schema: json(answerResponseSchema) } } },
            ...err(400, 404, 422, 429),
        },
    },
    complete: {
        body: json(completeSessionSchema),
        response: {
            200: { description: 'Session arcade terminée', content: { 'application/json': { schema: json(completeResponseSchema) } } },
            ...err(400, 404),
        },
    },
    stop: {
        response: {
            200: { description: 'Session training arrêtée', content: { 'application/json': { schema: json(stopResponseSchema) } } },
            ...err(404),
        },
    },
    abandon: {
        response: {
            200: { description: 'Session abandonnée', content: { 'application/json': { schema: json(abandonResponseSchema) } } },
            ...err(404),
        },
    },
    configFlags: {
        response: { 200: { description: 'Flags publics', content: { 'application/json': { schema: json(configFlagsResponseSchema) } } } },
    },
};

export async function configRoutes(app: FastifyInstance): Promise<void> {
    app.get('/api/config/flags', { schema: openApiSchemas.configFlags }, async () => ({
        pilote6: true,
        providers: { google: true, apple: true, email: true, phone: true, guest: true },
        tts: true,
        ranking: true,
        maintenance: false,
    }));
}
