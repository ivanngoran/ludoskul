import type { GeneratedQuestion } from '../types/index.js';
import { questionHash, randInt, rngFromSeed, shuffle, uniqueOptions } from './rng.js';

function buildSuite(seed: string, index: number, prompt: string, answer: number): GeneratedQuestion {
    const rng = rngFromSeed(`${seed}:${index}`);
    const options = uniqueOptions(String(answer), [
        String(answer + 1),
        String(answer - 1),
        String(answer + 2),
        String(answer - 2),
        String(answer + 10),
        String(answer + 3),
    ]);
    while (options.length < 4) options.push(String(answer + options.length + 7));
    return {
        index,
        hash: questionHash(seed, index, prompt),
        prompt,
        options: shuffle(rng, options.slice(0, 4)),
        asset: null,
        answer: String(answer),
    };
}

export function generateSuite(level: number, seed: string): GeneratedQuestion[] {
    const rng = rngFromSeed(seed);
    const out: GeneratedQuestion[] = [];
    const seen = new Set<string>();
    let guard = 0;
    while (out.length < 3 && guard++ < 60) {
        let seq: number[];
        let answer: number;
        if (level === 1) {
            const s = randInt(rng, 1, 20);
            seq = [s, s + 1, s + 2];
            answer = s + 3;
        } else if (level === 2) {
            const s = randInt(rng, 1, 15) * 2;
            seq = [s, s + 2, s + 4];
            answer = s + 6;
        } else if (level <= 4) {
            const s = randInt(rng, 5, 30);
            const step = level === 4 ? -1 : randInt(rng, 2, 5);
            seq = [s, s + step, s + 2 * step];
            answer = s + 3 * step;
        } else if (level <= 6) {
            const s = randInt(rng, 1, 10);
            const step = randInt(rng, 3, 10);
            seq = [s, s + step, s + 2 * step];
            answer = s + 3 * step;
        } else if (level === 7) {
            const s = randInt(rng, 1, 8);
            seq = [s, s * 2, s * 4];
            answer = s * 8;
        } else if (level <= 10) {
            const s = randInt(rng, 2, 12);
            const a = randInt(rng, 1, 5);
            const b = randInt(rng, 1, 5);
            seq = [s, s + a, s + a - b, s + 2 * a - b];
            answer = s + 2 * a - 2 * b + a;
        } else if (level <= 12) {
            const n = randInt(rng, 2, 8);
            const base = n + 1;
            answer = base * base;
            seq = [(base - 3) * (base - 3), (base - 2) * (base - 2), (base - 1) * (base - 1)];
        } else {
            const a = randInt(rng, 1, 5);
            seq = [a, a + 1, a + 3].slice(0, 3);
            answer = a + 6;
        }
        const prompt = `Que vient après ? ${seq.join(', ')}, ?`;
        if (seen.has(prompt)) continue;
        seen.add(prompt);
        out.push(buildSuite(seed, out.length, prompt, answer));
    }
    return out;
}
