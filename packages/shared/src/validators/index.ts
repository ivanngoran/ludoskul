import { z } from 'zod';
import { exerciseCodeSchema, inputModeSchema, sessionModeSchema } from '../types/index.js';

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
    inputMode: inputModeSchema,
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
