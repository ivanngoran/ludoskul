import type { FastifyInstance } from 'fastify';
import { EXERCISES, timeLimitForLevel } from '@ludoskul/shared';

export async function exerciseRoutes(app: FastifyInstance): Promise<void> {
    app.get('/api/exercises', async (req) => {
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

    app.get('/api/exercises/:code', async (req, reply) => {
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
            timeLimits: { '1-3': 10, '4-6': 8, '7-10': 6, '11-15': 5, training: 'indicatif' },
            timeLimitForLevel: timeLimitForLevel(1),
            help: {},
        };
    });

    app.get('/api/exercises/:code/tts', async (req) => {
        const { code } = req.params as { code: string };
        const { level, index } = req.query as { level?: string; index?: string };
        return { audioSrc: `/audio/${code}/${level ?? 1}/${index ?? 0}.mp3`, fallbackTTS: true };
    });
}
