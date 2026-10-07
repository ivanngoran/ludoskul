import type { GeneratedQuestion } from '../types/index.js';
import { questionHash, randInt, rngFromSeed, shuffle, uniqueOptions } from './rng.js';

function fmt(h: number, m: number): string {
    return `${h}h${m.toString().padStart(2, '0')}`;
}

function buildTime(seed: string, index: number, prompt: string, answer: string, asset: string | null): GeneratedQuestion {
    const rng = rngFromSeed(`${seed}:${index}`);
    const options = uniqueOptions(answer, [
        shiftMinutes(answer, 30),
        shiftMinutes(answer, -30),
        shiftMinutes(answer, 60),
        shiftMinutes(answer, 15),
        shiftMinutes(answer, -15),
        shiftMinutes(answer, 90),
    ]);
    while (options.length < 4) options.push(shiftMinutes(answer, options.length * 7 + 5));
    return {
        index,
        hash: questionHash(seed, index, prompt),
        prompt,
        options: shuffle(rng, options.slice(0, 4)),
        asset,
        answer,
    };
}

function shiftMinutes(hh: string, delta: number): string {
    const m = hh.match(/(\d+)h(\d{2})/);
    if (!m) return hh;
    let total = parseInt(m[1] as string, 10) * 60 + parseInt(m[2] as string, 10) + delta;
    total = ((total % 1440) + 1440) % 1440;
    return fmt(Math.floor(total / 60), total % 60);
}

export function generateTime(level: number, seed: string): GeneratedQuestion[] {
    const rng = rngFromSeed(seed);
    const out: GeneratedQuestion[] = [];
    const seen = new Set<string>();
    let guard = 0;
    while (out.length < 3 && guard++ < 60) {
        let h: number;
        let m: number;
        if (level === 1) {
            h = randInt(rng, 1, 12);
            m = 0;
        } else if (level === 2) {
            h = randInt(rng, 1, 12);
            m = rng() < 0.5 ? 0 : 30;
        } else if (level === 3) {
            h = randInt(rng, 1, 12);
            m = [0, 15, 30, 45][Math.floor(rng() * 4)] as number;
        } else if (level <= 6) {
            h = randInt(rng, 1, 12);
            m = randInt(rng, 0, 11) * 5;
        } else if (level <= 9) {
            h = randInt(rng, 1, 12);
            m = randInt(rng, 0, 59);
        } else {
            h = randInt(rng, 0, 23);
            m = randInt(rng, 0, 59);
        }
        const answer = fmt(h, m);
        const prompt = `Quelle heure est-il ? (${answer})`;
        if (seen.has(prompt)) continue;
        seen.add(prompt);
        out.push(buildTime(seed, out.length, prompt, answer, `clock:${h}:${m}`));
    }
    return out;
}
