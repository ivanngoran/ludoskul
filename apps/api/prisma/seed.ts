import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const dir = dirname(fileURLToPath(import.meta.url));
const exercises = JSON.parse(readFileSync(join(dir, 'seeds', 'exercises.json'), 'utf8')) as Array<{
    code: string;
    name: string;
    category: 'CALCUL' | 'NOMBRES' | 'MESURES' | 'GEOMETRIE' | 'LOGIQUE';
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

const prisma = new PrismaClient();

for (const e of exercises) {
    await prisma.exercise.upsert({
        where: { code: e.code },
        update: {
            name: e.name,
            description: e.description,
            category: e.category,
            icon: e.icon,
            color: e.color,
            config: e.config as object,
            help: e.help as object,
            isActive: e.isActive,
            order: e.order,
        },
        create: {
            code: e.code,
            name: e.name,
            description: e.description,
            category: e.category,
            icon: e.icon,
            color: e.color,
            config: e.config as object,
            help: e.help as object,
            isActive: e.isActive,
            order: e.order,
        },
    });
}

for (const b of badges) {
    // 08-§1 : le modèle Badge ne persiste pas `requires` (code,name,description,xpBonus,icon).
    // `requires` reste servi par GET /api/badges depuis le référentiel JSON (07-§5, 17-§3)
    // et sa présence est vérifiée par db:seed:check. Persistance en BE-6.2 si attribution serveur l'exige.
    await prisma.badge.upsert({
        where: { code: b.code },
        update: { name: b.name, description: b.description, xpBonus: b.xpBonus, icon: b.icon },
        create: { code: b.code, name: b.name, description: b.description, xpBonus: b.xpBonus, icon: b.icon },
    });
}

const pilots = exercises.filter((e) => e.isActive).length;
console.log(`seed OK: ${exercises.length} exercices (${pilots} pilotes), ${badges.length} badges`);
await prisma.$disconnect();
