import type { ExerciseCode, GeneratedQuestion } from '../types/index.js';
import { generateAdd, generateSub, generateTab } from './arithmetic.js';
import { generateShape2d } from './shape2d.js';
import { generateSuite } from './suite.js';
import { generateTime } from './time.js';

export function generateQuestions(code: ExerciseCode, level: number, seed: string): GeneratedQuestion[] {
    if (level < 1 || level > 15) throw new Error(`Niveau invalide : ${level} (1-15)`);
    switch (code) {
        case 'ADD':
            return generateAdd(level, seed);
        case 'SUB':
            return generateSub(level, seed);
        case 'TAB':
            return generateTab(level, seed);
        case 'SHAPE_2D':
            return generateShape2d(level, seed);
        case 'TIME':
            return generateTime(level, seed);
        case 'SUITE':
            return generateSuite(level, seed);
        default:
            throw new Error(`Générateur non implémenté en pilote : ${code}`);
    }
}
