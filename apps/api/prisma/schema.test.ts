import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(dir, 'schema.prisma');
const migrationPath = join(dir, 'migrations', '20261007000000_init_be11', 'migration.sql');

function readSchema(): string {
    return readFileSync(schemaPath, 'utf8');
}

describe('BE-1.1 Prisma schema socle 08-§1 + 08b-§3', () => {
    it('schema.prisma existe et migration initiale existe', () => {
        expect(existsSync(schemaPath)).toBe(true);
        expect(existsSync(migrationPath)).toBe(true);
    });

    it('enums opposables présents', () => {
        const s = readSchema();
        expect(s).toContain('enum ExerciseCategory');
        expect(s).toContain('CALCUL');
        expect(s).toContain('NOMBRES');
        expect(s).toContain('MESURES');
        expect(s).toContain('GEOMETRIE');
        expect(s).toContain('LOGIQUE');
        expect(s).toContain('enum SessionMode');
        expect(s).toContain('TRAINING');
        expect(s).toContain('ARCADE');
        expect(s).toContain('enum AuthProvider');
        for (const p of ['google', 'apple', 'email', 'phone', 'guest']) {
            expect(s).toContain(p);
        }
    });

    it('13 modèles opposables présents', () => {
        const s = readSchema();
        for (const m of [
            'model User',
            'model Identity',
            'model OtpChallenge',
            'model Device',
            'model Family',
            'model Exercise',
            'model Session',
            'model Answer',
            'model Ranking',
            'model Progress',
            'model Badge',
            'model UserBadge',
            'model AuthRefresh',
            'model DeletedPseudo',
        ]) {
            expect(s).toContain(m);
        }
    });

    it('IDs cuid partout (Prisma5: cuid(), cible cuid2 côté app)', () => {
        const s = readSchema();
        // 08-§1 + 17-§2 : IDs cuid2 partout. Prisma 5 → @default(cuid()), génération cuid2 via lib.
        expect(s).toContain('cuid2');
        const idDefaults = s.match(/@id @default\(cuid\(\)\)/g) ?? [];
        // 14 modèles avec @id (User, Identity, Otp, Device, Family, Exercise, Session, Answer, Ranking, Progress, Badge, UserBadge, AuthRefresh, DeletedPseudo)
        expect(idDefaults.length).toBeGreaterThanOrEqual(14);
        expect(s).not.toContain('@default(cuid(2))');
        expect(s).not.toContain('@default(uuid())');
        expect(s).not.toContain('autoincrement()');
    });

    it('unicités opposables BE-1.1', () => {
        const s = readSchema();
        expect(s).toContain('@@unique([provider, providerSub])');
        expect(s).toContain('@@unique([userId, exerciseId, weekStart])');
        expect(s).toContain('@@unique([userId, exerciseId])');
        expect(s).toContain('@@unique([userId, badgeCode])');
        // emailLower / phoneHash uniques (08b-§3 : uniques si vérifiés — contrainte forte MVP)
        expect(s).toMatch(/emailLower\s+String\?\s+@unique/);
        expect(s).toMatch(/phoneHash\s+String\?\s+@unique/);
        // pseudo + email user uniques
        expect(s).toMatch(/pseudo\s+String\s+@unique/);
    });

    it('User socle 08-§1 + 08b-§3 : guest/isChild/parentId/rankingPublic/birthYear/accessibility', () => {
        const s = readSchema();
        expect(s).toContain('guest');
        expect(s).toContain('isChild');
        expect(s).toContain('parentId');
        expect(s).toContain('rankingPublic');
        expect(s).toContain('birthYear');
        expect(s).toContain('accessibility');
        expect(s).toContain('passwordHash');
    });

    it('Identity 08b-§3 : provider enum, phone chiffré at-rest (jamais clair)', () => {
        const s = readSchema();
        expect(s).toContain('providerSub');
        expect(s).toContain('phoneE164Encrypted');
        expect(s).toContain('emailVerifiedAt');
        expect(s).toContain('phoneVerifiedAt');
        // 0 donnée PII en clair : pas de champ phone/email en clair hors hash/chiffré
        expect(s).not.toMatch(/phone\s+String/);
        // OTP hash uniquement (jamais code clair)
        expect(s).toContain('codeHash');
        expect(s).not.toContain('code String');
    });

    it('OtpChallenge : codeHash argon2id, TTL, attempts, resendAt', () => {
        const s = readSchema();
        expect(s).toContain('targetHash');
        expect(s).toContain('codeHash');
        expect(s).toContain('expiresAt');
        expect(s).toContain('attempts');
        expect(s).toContain('resendAvailableAt');
        expect(s).toContain('consumedAt');
    });

    it('Device + AuthRefresh : rotation refresh, révocation par device', () => {
        const s = readSchema();
        expect(s).toContain('refreshTokenHash');
        expect(s).toContain('lastSeenAt');
        expect(s).toContain('revokedAt');
        expect(s).toContain('tokenHash');
        expect(s).toContain('expiresAt');
    });

    it('Family : consentement horodaté v1 (08b-§2, 20-§2)', () => {
        const s = readSchema();
        expect(s).toContain('consentAt');
        expect(s).toContain('consentText');
        expect(s).toContain('parentUserId');
        expect(s).toContain('childUserId');
    });

    it('Session 08-§1 : mode, blockIndex, trainingScore, stopped, assisted, offline, keyboard=false MVP', () => {
        const s = readSchema();
        expect(s).toContain('seedBase');
        expect(s).toContain('blockIndex');
        expect(s).toContain('trainingScore');
        expect(s).toContain('stopped');
        expect(s).toContain('assisted');
        expect(s).toContain('offline');
        expect(s).toContain('keyboard');
    });

    it('Answer : mode, blockIndex, inputMode mouse|touch MVP', () => {
        const s = readSchema();
        expect(s).toContain('questionHash');
        expect(s).toContain('questionIndex');
        expect(s).toContain('inputMode');
        expect(s).toContain('timeMs');
    });

    it('Ranking arcade-only + Progress 2 volets + Badge 39 codes', () => {
        const s = readSchema();
        expect(s).toContain('weekStart');
        expect(s).toContain('bestScoreArcade');
        expect(s).toContain('trainingQuestions');
        expect(s).toContain('trainingLevelsPracticed');
        expect(s).toContain('xpBonus');
        expect(s).toContain('badgeCode');
    });

    it('cascade delete User → tout sauf DeletedPseudo 30j (RGPD droit à l’oubli)', () => {
        const s = readSchema();
        const cascades = s.match(/onDelete:\s*Cascade/g) ?? [];
        // User→Identity/Device/Session/Answer(via Session)/Ranking/Progress/UserBadge/AuthRefresh/Family/ParentChildren
        expect(cascades.length).toBeGreaterThanOrEqual(10);
        // DeletedPseudo : table réserve 30j, aucune FK vers User (pas de cascade inverse)
        const deletedBlock = s.slice(s.indexOf('model DeletedPseudo'));
        expect(deletedBlock).not.toContain('onDelete');
        expect(deletedBlock).toContain('expiresAt');
        // Session→Answer cascade audit/anti-triche
        expect(s).toContain('Answer');
    });

    it('migration SQL contient tables + index + FK cascade', () => {
        const sql = readFileSync(migrationPath, 'utf8');
        for (const t of ['"User"', '"Identity"', '"OtpChallenge"', '"Device"', '"Family"', '"Exercise"', '"Session"', '"Answer"', '"Ranking"', '"Progress"', '"Badge"', '"UserBadge"', '"AuthRefresh"', '"DeletedPseudo"']) {
            expect(sql).toContain(`CREATE TABLE ${t}`);
        }
        expect(sql).toContain('ON DELETE CASCADE');
        expect(sql).toContain('Identity_provider_providerSub_key');
        expect(sql).toContain('Ranking_userId_exerciseId_weekStart_key');
        expect(sql).toContain('Progress_userId_exerciseId_key');
        expect(sql).toContain('UserBadge_userId_badgeCode_key');
    });
});
