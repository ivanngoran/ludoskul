import { z } from 'zod';
import { exerciseCodeSchema, sessionModeSchema } from '../types/index.js';

export const cuidSchema = z.string().min(1);

export const createSessionSchema = z.object({
    exerciseCode: exerciseCodeSchema,
    mode: sessionModeSchema,
    level: z.number().int().min(1).max(15).optional(),
});

export const answerSchema = z.object({
    level: z.number().int().min(1).max(15),
    blockIndex: z.number().int().min(0).optional(),
    index: z.number().int().min(0).max(2),
    questionHash: z.string().min(1),
    chosen: z.string().min(1),
    timeMs: z.number().int().min(0),
    // 10-§1 : 'keyboard' accepté par la validation mais rejeté 422 KEYBOARD_NOT_ALLOWED en route (MVP pointeur-seul).
    inputMode: z.enum(['mouse', 'touch', 'keyboard']),
});

export const trainingLevelSchema = z.object({
    level: z.number().int().min(1).max(15),
});

export const completeSessionSchema = z.object({
    assisted: z.boolean().default(false),
});

export const pseudoSchema = z
    .string()
    .min(3)
    .max(16)
    .regex(/^[A-Za-z0-9_-]+$/);

export const emailSchema = z.string().trim().toLowerCase().email();

export const errorResponseSchema = z.object({
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
    }),
});

// Schémas réponse opposables 08/08b (17-§1 : toute route a un schéma Zod request+response).
export const healthResponseSchema = z.object({
    ok: z.literal(true),
    at: z.string(),
});

export const readyResponseSchema = z.object({
    ok: z.boolean(),
    db: z.string(),
    redis: z.string(),
});

export const exerciseListItemSchema = z.object({
    code: exerciseCodeSchema,
    name: z.string(),
    category: z.string(),
    icon: z.string(),
    color: z.string(),
    order: z.number().int(),
    bestScoreArcade: z.number().int(),
    maxLevelArcade: z.number().int(),
    trainingQuestions: z.number().int(),
});

export const exerciseListResponseSchema = z.object({
    exercises: z.array(exerciseListItemSchema),
});

export const exerciseDetailResponseSchema = z.object({
    code: exerciseCodeSchema,
    name: z.string(),
    description: z.string(),
    levels: z.literal(15),
    questionsPerLevel: z.literal(3),
    modes: z.tuple([z.literal('TRAINING'), z.literal('ARCADE')]),
    timeLimits: z.object({
        '1-3': z.literal(10),
        '4-6': z.literal(8),
        '7-10': z.literal(6),
        '11-15': z.literal(5),
        training: z.literal('indicatif'),
    }),
    timeLimitForLevel: z.number().int(),
    help: z.record(z.unknown()),
});

export const exerciseTtsResponseSchema = z.object({
    audioSrc: z.string(),
    fallbackTTS: z.literal(true),
});

export const badgeItemSchema = z.object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
    xpBonus: z.number().int(),
    icon: z.string(),
    requires: z.array(z.string()).optional(),
    earned: z.literal(false),
    earnedAt: z.null(),
});

export const badgeListResponseSchema = z.object({
    badges: z.array(badgeItemSchema),
});

export const createSessionResponseSchema = z.object({
    sessionId: z.string(),
    mode: sessionModeSchema,
    exerciseCode: exerciseCodeSchema,
    seedBase: z.string(),
    startLevel: z.number().int().min(1).max(15),
    serverTime: z.string(),
});

export const activeSessionsResponseSchema = z.object({
    sessions: z.array(
        z.object({
            id: z.string(),
            exerciseCode: exerciseCodeSchema,
            mode: sessionModeSchema,
            level: z.number().int(),
            blockIndex: z.number().int(),
            seedBase: z.string(),
            score: z.number().int(),
            streak: z.number().int(),
            lives: z.number().int(),
            correct: z.number().int(),
            total: z.number().int(),
        }),
    ),
});

export const questionItemSchema = z.object({
    index: z.number().int(),
    hash: z.string(),
    prompt: z.string(),
    options: z.array(z.string()).length(4),
    asset: z.string().nullable(),
});

export const questionsResponseSchema = z.object({
    mode: sessionModeSchema,
    level: z.number().int().min(1).max(15),
    blockIndex: z.number().int(),
    timeLimit: z.number().int(),
    indicative: z.boolean(),
    seed: z.string(),
    lives: z.number().int(),
    questions: z.array(questionItemSchema).length(3),
});

export const trainingLevelResponseSchema = z.object({
    level: z.number().int().min(1).max(15),
    blockIndex: z.literal(0),
    seed: z.string(),
});

export const answerArcadeResponseSchema = z.object({
    mode: z.literal('ARCADE'),
    correct: z.boolean(),
    points: z.number().int(),
    streak: z.number().int(),
    lives: z.number().int(),
    score: z.number().int(),
});

export const answerTrainingResponseSchema = z.object({
    mode: z.literal('TRAINING'),
    correct: z.boolean(),
    trainingPoints: z.number().int(),
    streakLocal: z.number().int(),
    tip: z.string(),
});

export const answerResponseSchema = z.union([answerArcadeResponseSchema, answerTrainingResponseSchema]);

export const completeResponseSchema = z.object({
    mode: z.literal('ARCADE'),
    score: z.number().int(),
    correct: z.number().int(),
    total: z.number().int(),
    accuracy: z.number(),
    xpGained: z.number().int(),
    badges: z.array(z.string()),
    ranking: z.null(),
});

export const stopResponseSchema = z.object({
    mode: z.literal('TRAINING'),
    questions: z.number().int(),
    accuracy: z.number(),
    trainingScore: z.number().int(),
    xpGained: z.number().int(),
    badges: z.array(z.string()),
});

export const abandonResponseSchema = z.object({
    mode: sessionModeSchema,
    maxLevel: z.number().int().min(1).max(15),
    saved: z.literal(true),
});

export const configFlagsResponseSchema = z.object({
    pilote6: z.literal(true),
    providers: z.object({
        google: z.literal(true),
        apple: z.literal(true),
        email: z.literal(true),
        phone: z.literal(true),
        guest: z.literal(true),
    }),
    tts: z.literal(true),
    ranking: z.literal(true),
    maintenance: z.literal(false),
});
