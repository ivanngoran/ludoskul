import type { GeneratedQuestion } from '../types/index.js';
import { questionHash, rngFromSeed, shuffle } from './rng.js';

export interface ShapeDef {
    id: string;
    label: string;
    withArticle: string;
}

export const SHAPES_2D: ShapeDef[] = [
    { id: 'cercle', label: 'cercle', withArticle: 'le cercle' },
    { id: 'carre', label: 'carré', withArticle: 'le carré' },
    { id: 'triangle', label: 'triangle', withArticle: 'le triangle' },
    { id: 'rectangle', label: 'rectangle', withArticle: 'le rectangle' },
    { id: 'losange', label: 'losange', withArticle: 'le losange' },
    { id: 'trapeze', label: 'trapèze', withArticle: 'le trapèze' },
    { id: 'parallelogramme', label: 'parallélogramme', withArticle: 'le parallélogramme' },
    { id: 'pentagone', label: 'pentagone', withArticle: 'le pentagone' },
    { id: 'hexagone', label: 'hexagone', withArticle: "l'hexagone" },
    { id: 'octogone', label: 'octogone', withArticle: "l'octogone" },
    { id: 'ellipse', label: 'ellipse', withArticle: "l'ellipse" },
    { id: 'decagone', label: 'décagone', withArticle: 'le décagone' },
];

const POOLS: string[][] = [
    ['cercle', 'carre'],
    ['cercle', 'carre', 'triangle'],
    ['cercle', 'carre', 'triangle'],
    ['cercle', 'carre', 'triangle', 'rectangle'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme', 'pentagone', 'hexagone'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme', 'pentagone', 'hexagone'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme', 'pentagone', 'hexagone', 'octogone', 'ellipse'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme', 'pentagone', 'hexagone', 'octogone', 'ellipse'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme', 'pentagone', 'hexagone', 'octogone', 'ellipse', 'decagone'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme', 'pentagone', 'hexagone', 'octogone', 'ellipse', 'decagone'],
    ['cercle', 'carre', 'triangle', 'rectangle', 'losange', 'trapeze', 'parallelogramme', 'pentagone', 'hexagone', 'octogone', 'ellipse', 'decagone'],
];

function shapeById(id: string): ShapeDef {
    return SHAPES_2D.find((s) => s.id === id) as ShapeDef;
}

export function generateShape2d(level: number, seed: string): GeneratedQuestion[] {
    const pool = POOLS[level - 1] as string[];
    const rng = rngFromSeed(seed);
    const out: GeneratedQuestion[] = [];
    const usedTargets = new Set<string>();
    let guard = 0;
    while (out.length < 3 && guard++ < 50) {
        const targetId = pool[Math.floor(rng() * pool.length)] as string;
        if (usedTargets.has(targetId) && pool.length >= 3) continue;
        usedTargets.add(targetId);
        const target = shapeById(targetId);
        const poolOthers = shuffle(
            rng,
            pool.filter((id) => id !== targetId),
        );
        // Garantit 4 propositions uniques même si pool niveau < 4 (ex L1 : cercle/carré).
        // Priorité au pool du niveau (confusables), complété par formes suivantes.
        const fallback = shuffle(
            rng,
            SHAPES_2D.map((s) => s.id).filter((id) => id !== targetId && !poolOthers.includes(id)),
        );
        const others = [...poolOthers, ...fallback].slice(0, 3);
        const options = shuffle(rng, [targetId, ...others]);
        const prompt = `Sélectionne ${target.withArticle}`;
        out.push({
            index: out.length,
            hash: questionHash(seed, out.length, prompt + ':' + targetId),
            prompt,
            options,
            asset: null,
            answer: targetId,
        });
    }
    return out;
}
