# Runbook — Déploiement (voir 21-§1)

## Pré-requis

- CI verte (`lint, typecheck, test, openapi:check, audit 0 high/critical`).
- `openapi.json` régénéré et commité si contrat touché.
- Flags `GET /api/config/flags` connus (état avant/après noté).

## Procédure

1. `turbo run build` local OK.
2. `prisma migrate deploy` (staging d'abord, puis prod). Vérifier `seed check` : 6 actifs / 26 avec `?includeInactive` / 39 badges.
3. Déployer API puis web (preview → staging → prod).
4. Smoke prod : `GET /health` < 50ms, login invité < 10s, 1 question ADD arcade, `GET /api/ranking/ADD?period=week` < 150ms p95, `GET /api/config/flags` 200.
5. Switch traffic (Vercel/Railway) + surveiller Sentry 30 min.

## Rollback (< 5 min, big bang)

1. Flag `maintenance=true` (jeu local training seul) si P0.
2. Redeploy N-1 (tag git précédent) API + web.
3. DB : pas de rollback migration destructive sans runbook dédié — chaque migration est réversible ou a son runbook noté (voir 17-§2). Si migration irréversible : PITR 7j (RTO < 1h, voir `restore.md`).
4. Flag `maintenance=false` + smoke. Noter dans `incidents-YYYY-MM.md`.

## Rollback migration initiale BE-1.1 (testé, voir `schema.test.ts`)

Migration `20261007000000_init_be11` = 14 tables + 3 enums, aucune colonne destructive.
Rollback manuel (ordre inverse des dépendances, FK cascade) :

```sql
DROP TABLE IF EXISTS "AuthRefresh", "UserBadge", "Device", "Identity", "Family",
  "Answer", "Session", "Ranking", "Progress", "OtpChallenge", "DeletedPseudo",
  "Badge", "Exercise", "User";
DROP TYPE IF EXISTS "AuthProvider", "SessionMode", "ExerciseCategory";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261007000000_init_be11';
```

Vérifié par test (`rollback testé : migration initiale réversible`) : 14 `CREATE TABLE`
présents, 0 `DROP COLUMN`, 0 changement de type destructif.
