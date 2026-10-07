import { describe, expect, it } from 'vitest';
import { generateQuestions } from './generators/index.js';
import { PILOT_CODES } from './constants/exercises.js';
import { arcadeQuestionPoints, trainingQuestionPoints } from './scoring.js';

describe('generateurs pilote', () => {
    for (const code of PILOT_CODES) {
        it(`${code} L1/8/15 deterministe et QCM 4 uniques`, () => {
            for (const level of [1, 8, 15]) {
                const seed = `fixture-${code}-${level}`;
                const q1 = generateQuestions(code, level, seed);
                const q2 = generateQuestions(code, level, seed);
                expect(q1).toEqual(q2);
                expect(q1).toHaveLength(3);
                for (const q of q1) {
                    expect(q.options).toHaveLength(4);
                    expect(new Set(q.options).size).toBe(4);
                    expect(q.options).toContain(q.answer);
                }
            }
        });
    }

    it('SUB jamais negatif, a>=b', () => {
        for (let i = 0; i < 100; i++) {
            const qs = generateQuestions('SUB', 7, `seed-${i}`);
            for (const q of qs) expect(Number(q.answer) >= 0).toBe(true);
        }
    });
});

describe('scoring 07', () => {
    it('exemple ADD L3 doc = 166 pts', () => {
        expect(arcadeQuestionPoints({ level: 3, streakBefore: 2, timeLeftMs: 7200, correct: true })).toBe(166);
    });
    it('incorrect = 0', () => {
        expect(arcadeQuestionPoints({ level: 5, streakBefore: 4, timeLeftMs: 5000, correct: false })).toBe(0);
    });
    it('training = /5 sans serie', () => {
        expect(trainingQuestionPoints(3, 7200)).toBe(Math.round((100 * 1.2 + 36) / 5));
    });
});
