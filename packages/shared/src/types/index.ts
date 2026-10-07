import { z } from 'zod';

export const exerciseCodeSchema = z.enum([
    'ADD',
    'SUB',
    'MUL',
    'DIV',
    'MIX',
    'TAB',
    'CMP',
    'FRAC',
    'DECI',
    'POURC',
    'COMP10',
    'DOUBLE',
    'TIME',
    'MES',
    'MONEY',
    'SHAPE_2D',
    'SHAPE_3D',
    'PROP',
    'SYM',
    'PERIM',
    'AREA',
    'ANGLE',
    'VOL',
    'REP',
    'SUITE',
    'PROB',
]);

export type ExerciseCode = z.infer<typeof exerciseCodeSchema>;

export const sessionModeSchema = z.enum(['TRAINING', 'ARCADE']);
export type SessionMode = z.infer<typeof sessionModeSchema>;

export const inputModeSchema = z.enum(['mouse', 'touch']);
export type InputMode = z.infer<typeof inputModeSchema>;

export const exerciseCategorySchema = z.enum([
    'CALCUL',
    'NOMBRES',
    'MESURES',
    'GEOMETRIE',
    'LOGIQUE',
]);
export type ExerciseCategory = z.infer<typeof exerciseCategorySchema>;

export interface GeneratedQuestion {
    index: number;
    hash: string;
    prompt: string;
    options: string[];
    asset: string | null;
    answer: string;
}

export interface GenerateParams {
    code: ExerciseCode;
    level: number;
    seed: string;
}
