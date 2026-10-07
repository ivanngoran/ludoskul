export function timeLimitForLevel(level: number): number {
    if (level >= 1 && level <= 3) return 10;
    if (level >= 4 && level <= 6) return 8;
    if (level >= 7 && level <= 10) return 6;
    return 5;
}

export const ARCADE_TOLERANCE_MS = 1000;
export const QUESTIONS_PER_LEVEL = 3;
export const MAX_LEVEL = 15;
export const LIVES_PER_LEVEL = 3;
