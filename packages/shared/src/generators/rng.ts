import { createHash } from 'node:crypto';
import seedrandom from 'seedrandom';

export function shaSeed(...parts: string[]): string {
    return createHash('sha256').update(parts.join(':')).digest('hex');
}

export function arcadeSeed(sessionId: string, code: string, level: number): string {
    return shaSeed(sessionId, code, String(level));
}

export function trainingSeed(
    sessionId: string,
    code: string,
    level: number,
    blockIndex: number,
): string {
    return shaSeed(sessionId, code, String(level), String(blockIndex));
}

export function questionHash(seed: string, index: number, prompt: string): string {
    return `q_${shaSeed(seed, String(index), prompt).slice(0, 12)}`;
}

export type Rng = () => number;

export function rngFromSeed(seed: string): Rng {
    return seedrandom(seed);
}

export function randInt(rng: Rng, min: number, max: number): number {
    return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
    return arr[Math.floor(rng() * arr.length)];
}

export function shuffle<T>(rng: Rng, arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
}

export function uniqueOptions(answer: string, distractors: string[]): string[] {
    const set = new Set<string>([answer]);
    for (const d of distractors) {
        if (set.size >= 4) break;
        if (d !== answer) set.add(d);
    }
    return [...set];
}
