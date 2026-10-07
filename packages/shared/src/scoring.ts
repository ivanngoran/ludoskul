import { timeLimitForLevel } from './constants/timeLimits.js';

export interface ArcadeAnswerInput {
    level: number;
    streakBefore: number;
    timeLeftMs: number;
    correct: boolean;
}

export function arcadeQuestionPoints(input: ArcadeAnswerInput): number {
    if (!input.correct) return 0;
    const base = 100;
    const mult = 1 + (input.level - 1) * 0.1;
    const totalMs = timeLimitForLevel(input.level) * 1000;
    const bonusVitesse = Math.round((50 * Math.max(0, input.timeLeftMs)) / totalMs);
    const bonusSerie = Math.min(input.streakBefore, 5) * 5;
    return Math.round(base * mult + bonusVitesse + bonusSerie);
}

export function arcadeLevelBonus(level: number, livesLeft: number): number {
    return 100 + level * 20 + livesLeft * 50;
}

export function trainingQuestionPoints(level: number, timeLeftMs: number): number {
    const base = 100;
    const mult = 1 + (level - 1) * 0.1;
    const totalMs = timeLimitForLevel(level) * 1000;
    const bonusVitesse = Math.round((50 * Math.max(0, timeLeftMs)) / totalMs);
    return Math.round((base * mult + bonusVitesse) / 5);
}

export function xpFromArcadeScore(score: number): number {
    return Math.floor(score / 10);
}

export function xpFromTrainingScore(score: number): number {
    return Math.min(Math.floor(score / 50), 200);
}

export function playerLevel(xpTotal: number): number {
    return Math.floor(Math.sqrt(Math.max(0, xpTotal) / 100)) + 1;
}
