import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const exercises = JSON.parse(readFileSync(join(dir, 'seeds', 'exercises.json'), 'utf8')) as Array<{
    code: string;
    name: string;
    category: string;
    icon: string;
    color: string;
    order: number;
    isActive: boolean;
    description: string;
    config: unknown;
    help: unknown;
}>;
const badges = JSON.parse(readFileSync(join(dir, 'seeds', 'badges.json'), 'utf8')) as Array<{
    code: string;
    name: string;
    description: string;
    xpBonus: number;
    icon: string;
}>;

const PILOT_CODES = ['ADD', 'SUB', 'TAB', 'SHAPE_2D', 'TIME', 'SUITE'];

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`seed check échoué: ${message}`);
}

assert(exercises.length === 26, `26 exercices attendus, vu ${exercises.length}`);
const active = exercises.filter((e) => e.isActive);
assert(active.length === 6, `6 pilotes actifs attendus, vu ${active.length}`);
for (const code of PILOT_CODES) {
    assert(active.some((e) => e.code === code), `pilote ${code} doit être actif`);
}
const orders = exercises.map((e) => e.order).sort((a, b) => a - b);
assert(JSON.stringify(orders) === JSON.stringify(Array.from({ length: 26 }, (_, i) => i + 1)), 'orders 1..26 uniques');
for (const e of exercises.filter((x) => x.isActive)) {
    assert(!!e.config && Object.keys(e.config as object).length > 0, `config non vide pour ${e.code}`);
    assert(!!e.help && Object.keys(e.help as object).length > 0, `help non vide pour ${e.code}`);
}

assert(badges.length === 39, `39 badges attendus, vu ${badges.length}`);
const codes = new Set(badges.map((b) => b.code));
assert(codes.size === 39, 'codes badges uniques');

console.log(`seed check OK: ${exercises.length} exercices (${active.length} pilotes), ${badges.length} badges`);
