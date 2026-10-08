import type { FastifyInstance } from 'fastify';
import {
    arcadeLevelBonus,
    arcadeQuestionPoints,
    arcadeSeed,
    createSessionSchema,
    answerSchema,
    generateQuestions,
    timeLimitForLevel,
    trainingQuestionPoints,
    trainingSeed,
    type ExerciseCode,
} from '@ludoskul/shared';
import { createId } from '@paralleldrive/cuid2';
import { openApiSchemas } from './schemas.js';

interface StoredSession {
    id: string;
    exerciseCode: ExerciseCode;
    mode: 'ARCADE' | 'TRAINING';
    level: number;
    blockIndex: number;
    seedBase: string;
    score: number;
    streak: number;
    lives: number;
    correct: number;
    total: number;
    // 07-§1a : arcade = progression serveur L1→L15 (45 Q). maxLevelAnswered suit
    // la validation ; complete exige 15/15 (BE-4.4). Prototype BE-EPIC-01 : Map
    // mémoire pré-auth (BE-EPIC-4/5 → Prisma Session/Answer + userId + 1 active/exo/mode).
    maxLevelAnswered: number;
    answered: Set<string>;
}

const sessions = new Map<string, StoredSession>();

function newId(prefix: string): string {
    return `${prefix}_${createId()}`;
}

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/sessions', { schema: openApiSchemas.createSession }, async (req, reply) => {
        const parsed = createSessionSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Requête invalide' } });
        }
        const { exerciseCode, mode, level } = parsed.data;
        const id = newId('sess');
        const seedBase = `${id}:${exerciseCode}`;
        sessions.set(id, {
            id,
            exerciseCode,
            mode,
            level: mode === 'ARCADE' ? 1 : (level ?? 1),
            blockIndex: 0,
            seedBase,
            score: 0,
            streak: 0,
            lives: 3,
            correct: 0,
            total: 0,
            maxLevelAnswered: 0,
            answered: new Set<string>(),
        });
        return reply.status(201).send({
            sessionId: id,
            mode,
            exerciseCode,
            seedBase,
            startLevel: mode === 'ARCADE' ? 1 : (level ?? 1),
            serverTime: new Date().toISOString(),
        });
    });

    // Prototype pré-auth (BE-EPIC-4 → scope userId + 1 active/exo/mode) : ne renvoie
    // que le format, sans exposer les sessions des autres utilisateurs (revue #4).
    // En l'absence d'auth sur ce prototype, la liste reste vide par défaut.
    app.get('/api/sessions/active', { schema: openApiSchemas.activeSessions }, async () => ({ sessions: [] }));

    app.get('/api/sessions/:id/questions', { schema: openApiSchemas.questions }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const s = sessions.get(id);
        if (!s) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Session inconnue' } });
        const q = req.query as { level?: string; block?: string };
        // 07-§1a : arcade = niveau courant serveur uniquement (pas de saut L1→L15 via query).
        const level = s.mode === 'ARCADE' ? s.level : Number(q.level ?? s.level);
        const block = Number(q.block ?? s.blockIndex);
        if (!Number.isInteger(level) || level < 1 || level > 15) {
            return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Niveau 1-15 requis' } });
        }
        const seed = s.mode === 'ARCADE' ? arcadeSeed(id, s.exerciseCode, level) : trainingSeed(id, s.exerciseCode, level, block);
        const all = generateQuestions(s.exerciseCode, level, seed);
        const questions = all.map(({ answer: _answer, ...rest }) => {
            void _answer;
            return rest;
        });
        return {
            mode: s.mode,
            level,
            blockIndex: block,
            timeLimit: timeLimitForLevel(level),
            indicative: s.mode === 'TRAINING',
            seed,
            lives: s.lives,
            questions,
        };
    });

    app.post('/api/sessions/:id/training-level', { schema: openApiSchemas.trainingLevel }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const s = sessions.get(id);
        if (!s) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Session inconnue' } });
        const { level } = (req.body ?? {}) as { level?: number };
        if (!level || level < 1 || level > 15) {
            return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Niveau 1-15 requis' } });
        }
        s.level = level;
        s.blockIndex = 0;
        return { level, blockIndex: 0, seed: trainingSeed(id, s.exerciseCode, level, 0) };
    });

    app.post('/api/sessions/:id/answers', { schema: openApiSchemas.answers }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const s = sessions.get(id);
        if (!s) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Session inconnue' } });
        const parsed = answerSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Réponse invalide' } });
        }
        const body = parsed.data;
        if (body.inputMode === 'keyboard') {
            return reply.status(422).send({ error: { code: 'KEYBOARD_NOT_ALLOWED', message: 'Clavier non autorisé en jeu (MVP)' } });
        }
        // 07-§1a : arcade = niveau courant serveur uniquement (contournement L1→L15 refusé).
        if (s.mode === 'ARCADE' && body.level !== s.level) {
            return reply.status(422).send({ error: { code: 'ANSWER_REJECTED', message: 'Niveau courant uniquement' } });
        }
        const seed = s.mode === 'ARCADE'
            ? arcadeSeed(id, s.exerciseCode, s.level)
            : trainingSeed(id, s.exerciseCode, body.level, body.blockIndex ?? s.blockIndex);
        const expected = generateQuestions(s.exerciseCode, body.level, seed)[body.index];
        if (!expected || expected.hash !== body.questionHash) {
            return reply.status(422).send({ error: { code: 'ANSWER_REJECTED', message: 'Question inconnue ou expirée' } });
        }
        const limitMs = timeLimitForLevel(body.level) * 1000;
        if (s.mode === 'ARCADE' && body.timeMs > limitMs + 1000) {
            return reply.status(422).send({ error: { code: 'ANSWER_REJECTED', message: 'Temps dépassé' } });
        }
        // Idempotence anti-double-tap (07-§1a verrou 400ms) : même index+hash ignoré.
        const answerKey = `${body.level}:${body.blockIndex ?? s.blockIndex}:${body.index}:${body.questionHash}`;
        if (s.answered.has(answerKey)) {
            return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Réponse déjà enregistrée' } });
        }
        s.answered.add(answerKey);
        const correct = body.chosen === expected.answer;
        s.total += 1;
        if (s.mode === 'ARCADE') {
            s.maxLevelAnswered = Math.max(s.maxLevelAnswered, body.level);
            if (correct) {
                const pts = arcadeQuestionPoints({ level: body.level, streakBefore: s.streak, timeLeftMs: Math.max(0, limitMs - body.timeMs), correct: true });
                s.score += pts;
                s.streak += 1;
                s.correct += 1;
                // Progression serveur : niveau suivant après 3 réponses au niveau courant.
                if (s.total % 3 === 0 && s.level < 15) s.level += 1;
                return { mode: s.mode, correct: true, points: pts, streak: s.streak, lives: s.lives, score: s.score };
            }
            s.streak = 0;
            s.lives = Math.max(0, s.lives - 1);
            if (s.total % 3 === 0 && s.level < 15) s.level += 1;
            return { mode: s.mode, correct: false, points: 0, streak: 0, lives: s.lives, score: s.score };
        }
        if (correct) {
            const pts = trainingQuestionPoints(body.level, Math.max(0, limitMs - body.timeMs));
            s.score += pts;
            s.streak += 1;
            s.correct += 1;
            return { mode: s.mode, correct: true, trainingPoints: pts, streakLocal: s.streak, tip: 'Bien joué !' };
        }
        s.streak = 0;
        return { mode: s.mode, correct: false, trainingPoints: 0, streakLocal: 0, tip: `La réponse était ${expected.answer}` };
    });

    app.post('/api/sessions/:id/complete', { schema: openApiSchemas.complete }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const s = sessions.get(id);
        if (!s) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Session inconnue' } });
        if (s.mode !== 'ARCADE') {
            return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Réservé au mode arcade' } });
        }
        // BE-4.4 : complete exige 15 niveaux joués (45 réponses), sinon 409.
        if (s.maxLevelAnswered < 15 || s.total < 45) {
            return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Termine les 15 niveaux avant de valider' } });
        }
        const bonus = arcadeLevelBonus(15, s.lives);
        return {
            mode: s.mode,
            score: s.score + bonus,
            correct: s.correct,
            total: s.total,
            accuracy: s.total ? (s.correct / s.total) * 100 : 0,
            xpGained: Math.floor(s.score / 10),
            badges: [],
            ranking: null,
        };
    });

    app.post('/api/sessions/:id/stop', { schema: openApiSchemas.stop }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const s = sessions.get(id);
        if (!s) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Session inconnue' } });
        if (s.mode !== 'TRAINING') {
            return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Réservé au mode entraînement' } });
        }
        return {
            mode: 'TRAINING',
            questions: s.total,
            accuracy: s.total ? (s.correct / s.total) * 100 : 0,
            trainingScore: s.score,
            xpGained: Math.min(Math.floor(s.score / 50), 200),
            badges: [],
        };
    });

    app.post('/api/sessions/:id/abandon', { schema: openApiSchemas.abandon }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const s = sessions.get(id);
        if (!s) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Session inconnue' } });
        return { mode: s.mode, maxLevel: s.maxLevelAnswered > 0 ? s.maxLevelAnswered : s.level, saved: true };
    });
}
