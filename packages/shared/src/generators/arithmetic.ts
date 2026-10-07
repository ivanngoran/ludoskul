import type { GeneratedQuestion } from '../types/index.js';
import { questionHash, randInt, rngFromSeed, shuffle, uniqueOptions } from './rng.js';

const ADD_RANGES: Array<[number, number, number, number]> = [
    [1, 5, 1, 5],
    [1, 7, 1, 7],
    [2, 10, 2, 10],
    [5, 15, 5, 15],
    [5, 20, 5, 20],
    [10, 30, 10, 30],
    [10, 50, 10, 50],
    [15, 60, 10, 40],
    [20, 70, 20, 70],
    [20, 99, 10, 50],
    [50, 150, 20, 80],
    [50, 200, 50, 100],
    [100, 300, 50, 150],
    [100, 400, 100, 200],
    [100, 500, 100, 300],
];

const SUB_RANGES: Array<[number, number, number, number]> = [
    [2, 6, 1, 5],
    [3, 10, 1, 8],
    [5, 15, 1, 10],
    [10, 20, 5, 15],
    [10, 30, 5, 20],
    [20, 40, 10, 25],
    [20, 60, 10, 30],
    [30, 80, 15, 40],
    [40, 99, 20, 50],
    [50, 99, 20, 60],
    [100, 200, 20, 90],
    [100, 250, 50, 120],
    [150, 350, 50, 150],
    [200, 500, 100, 250],
    [200, 600, 100, 300],
];

function numericDistractors(answer: number): string[] {
    const out: string[] = [];
    const candidates = [
        answer + 1,
        answer - 1,
        answer + 2,
        answer - 2,
        answer + 3,
        answer - 3,
        answer + 10,
        answer - 10,
    ];
    for (const c of candidates) {
        if (c >= 0 && c !== answer && !out.includes(String(c))) out.push(String(c));
        if (out.length >= 6) break;
    }
    const s = String(answer);
    if (s.length === 2 && s[0] !== s[1]) {
        const inv = s[1] + s[0];
        if (!out.includes(inv)) out.push(inv);
    }
    let i = 1;
    while (out.length < 6) {
        const c = answer + 10 + i;
        if (!out.includes(String(c))) out.push(String(c));
        i++;
    }
    return out;
}

function buildNumeric(seed: string, index: number, prompt: string, answer: number): GeneratedQuestion {
    const rng = rngFromSeed(`${seed}:${index}`);
    const options = uniqueOptions(String(answer), shuffle(rng, numericDistractors(answer)));
    while (options.length < 4) options.push(String(answer + options.length + 11));
    const shuffled = shuffle(rng, options.slice(0, 4));
    return {
        index,
        hash: questionHash(seed, index, prompt),
        prompt,
        options: shuffled,
        asset: null,
        answer: String(answer),
    };
}

export function generateAdd(level: number, seed: string): GeneratedQuestion[] {
    const [aMin, aMax, bMin, bMax] = ADD_RANGES[level - 1] as [number, number, number, number];
    const rng = rngFromSeed(seed);
    const seen = new Set<string>();
    const out: GeneratedQuestion[] = [];
    let guard = 0;
    while (out.length < 3 && guard++ < 50) {
        const a = randInt(rng, aMin, aMax);
        const b = randInt(rng, bMin, bMax);
        const prompt = `${a} + ${b} = ?`;
        if (seen.has(prompt)) continue;
        seen.add(prompt);
        out.push(buildNumeric(seed, out.length, prompt, a + b));
    }
    return out;
}

export function generateSub(level: number, seed: string): GeneratedQuestion[] {
    const [aMin, aMax, bMin, bMax] = SUB_RANGES[level - 1] as [number, number, number, number];
    const rng = rngFromSeed(seed);
    const seen = new Set<string>();
    const out: GeneratedQuestion[] = [];
    let guard = 0;
    while (out.length < 3 && guard++ < 50) {
        let a = randInt(rng, aMin, aMax);
        let b = randInt(rng, bMin, bMax);
        if (b > a) [a, b] = [b, a];
        const prompt = `${a} - ${b} = ?`;
        if (seen.has(prompt)) continue;
        seen.add(prompt);
        out.push(buildNumeric(seed, out.length, prompt, a - b));
    }
    return out;
}

const TAB_TABLES: number[][] = [
    [2], [3], [4], [5], [6], [2, 3, 4, 5, 6], [7], [8], [9],
    [2, 3, 4, 5, 6, 7, 8, 9, 10], [11], [12], [13], [11, 12, 13],
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
];

export function generateTab(level: number, seed: string): GeneratedQuestion[] {
    const tables = TAB_TABLES[level - 1] as number[];
    const rng = rngFromSeed(seed);
    const seen = new Set<string>();
    const out: GeneratedQuestion[] = [];
    let guard = 0;
    while (out.length < 3 && guard++ < 50) {
        const t = tables[Math.floor(rng() * tables.length)] as number;
        const m = randInt(rng, 2, 10);
        const prompt = `${t} × ${m} = ?`;
        if (seen.has(prompt)) continue;
        seen.add(prompt);
        out.push(buildNumeric(seed, out.length, prompt, t * m));
    }
    return out;
}
