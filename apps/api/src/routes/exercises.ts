import type { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXERCISES, timeLimitForLevel } from '@ludoskul/shared';
import { openApiSchemas } from './schemas.js';

const seedsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'prisma', 'seeds');
const seedBadges = JSON.parse(readFileSync(join(seedsDir, 'badges.json'), 'utf8')) as Array<{
    code: string;
    name: string;
    description: string;
    xpBonus: number;
    icon: string;
    requires?: string[];
}>;

export async function exerciseRoutes(app: FastifyInstance): Promise<void> {
    app.get('/api/exercises', { schema: openApiSchemas.exerciseList }, async (req) => {
        const includeInactive = (req.query as { includeInactive?: string }).includeInactive === '1';
        const list = EXERCISES.filter((e) => includeInactive || e.isPilot).map((e) => ({
            code: e.code,
            name: e.name,
            category: e.category,
            icon: e.icon,
            color: e.color,
            order: e.order,
            bestScoreArcade: 0,
            maxLevelArcade: 0,
            trainingQuestions: 0,
        }));
        return { exercises: list };
    });

    app.get('/api/exercises/:code', { schema: openApiSchemas.exerciseDetail }, async (req, reply) => {
        const { code } = req.params as { code: string };
        const found = EXERCISES.find((e) => e.code === code);
        if (!found) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Exercice inconnu' } });
        return {
            code: found.code,
            name: found.name,
            description: found.name,
            levels: 15,
            questionsPerLevel: 3,
            modes: ['TRAINING', 'ARCADE'],
            timeLimits: { '1-3': timeLimitForLevel(1), '4-6': timeLimitForLevel(4), '7-10': timeLimitForLevel(7), '11-15': timeLimitForLevel(11), training: 'indicatif' },
            timeLimitForLevel: timeLimitForLevel(1),
            help: {},
        };
    });

    app.get('/api/exercises/:code/tts', { schema: openApiSchemas.exerciseTts }, async (req) => {
        const { code } = req.params as { code: string };
        const { level, index } = req.query as { level?: string; index?: string };
        return { audioSrc: `/audio/${code}/${level ?? 1}/${index ?? 0}.mp3`, fallbackTTS: true };
    });

    // BE-1.3 : référentiel badges 07-§5 (39 codes). Attribution serveur en BE-6.2.
    app.get('/api/badges', { schema: openApiSchemas.badgeList }, async () => ({
        badges: seedBadges.map((b) => ({ ...b, earned: false, earnedAt: null })),
    }));
}
