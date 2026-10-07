# 17 — Contrats exécutables (OpenAPI, Prisma, seeds)

> Tranche 13 (périmètre pilote) : ce document rend les contrats 08/08b **exécutables et testés**. Tout écart entre code et contrat = bug bloquant CI.

## 1. OpenAPI : source de vérité générée, jamais éditée à la main

- Génération : schémas Zod des routes Fastify → `@fastify/swagger` + `@fastify/swagger-ui`. Le fichier `apps/api/openapi.json` est **généré** (`pnpm --filter api openapi:gen`) et commité pour diff review.
- Règle : toute route de 08/08b/16 a un schéma Zod request+response. Pas de schéma = pas de merge.
- Consommateurs : le client front génère ses types (`openapi-typescript`) depuis `openapi.json`. Jamais de types API dupliqués à la main.
- Test contrat (CI) : `openapi:check` vérifie que chaque endpoint requis par 15/16 existe dans `openapi.json` avec les bons codes (200/201/204/400/401/403/404/409/422/429).

## 2. Prisma : emplacements et règles

- Schema unique : `apps/api/prisma/schema.prisma`. Modèles : voir 08-§1 + 08b-§3 + 03 (Session, Answer, Ranking, Progress 2 volets, Identity, OtpChallenge, Device, Family, Badge, UserBadge, AuthRefresh, DeletedPseudo).
- IDs : `cuid2` partout. Enums : `SessionMode(TRAINING|ARCADE)`, `ExerciseCategory(CALCUL|NOMBRES|MESURES|GEOMETRIE|LOGIQUE)`, provider enum extensible (`google|apple|email|phone|guest` + `microsoft|passkey` réservés v1.2).
- Migrations : `prisma migrate dev` en local, `migrate deploy` en prod. Jamais de `db push` hors dev. Chaque migration = reversible ou runbook noté.
- Données sensibles : téléphone chiffré at-rest (pgcrypto/KMS), OTP en hash argon2id uniquement, jamais de code en clair.

## 3. Seeds versionnés et idempotents

- `apps/api/prisma/seed.ts` + `seeds/exercises.json` (26 lignes : code, nom FR, catégorie, icon, couleur, order, `isActive` — 6 pilotes `true`, 20 v1.1 `false`, config extrait 06/06b, help) + `seeds/badges.json` (39 badges : codes opposables 07-§5 — FIRST_STEP, STREAK_5/10, FLAWLESS_LEVEL, SPEEDY, SURVIVOR, MARATHON, PERFECT, CALC_PRO, GEOMETER, NUMERATION_PRO, MEASURES_PRO, LOGICIAN, POLYVALENT, EARLY_BIRD, NIGHT_OWL, REGULAR_3/7, TOP_100/10/1, WORKER, PERSEVERANT, READY_ARCADE, EXPLORER_3/6, FAITHFUL_10, MARATHON_3, FLAWLESS_5, SPEED_DEMON, COMEBACK, TRAINING_100/500, MENTOR, CURIOUS, LISTENER, WEEKEND_WARRIOR, PERFECT_LEVEL_3, LOYAL_30 — avec `requires` pour 9-14 non attribuables en pilote).
- Idempotence : `upsert` par clé unique (code exercice, code badge). Re-jouable sans doublon.
- Test seed (CI) : après seed sur DB vierge, `GET exercises` retourne 6 actifs ; `?includeInactive` retourne 26 ; `GET badges` retourne 39 ; les 6 pilotes ont config+help non vides.

## 4. Fixtures déterministes (générateurs)

- `packages/shared/test/fixtures/seeds.json` : 3 seeds fixes par exercice pilote × niveau 1/8/15, avec les 3 questions attendues **byte-identiques** (prompt, options, asset, hash). Générées une fois par l'implémentation de référence, relues péda (voir 18), puis gelées.
- Test : `generateQuestions(code, level, seed)` doit reproduire la fixture à l'octet. Toute modification volontaire = nouvelle fixture + revue + motif noté.
- Règle anti-régression : seed fixe → mêmes questions ; blocs training successifs → questions différentes.

## 5. Versionnement des contrats

- `openapi.json`, `schema.prisma`, `seeds/*.json`, `fixtures/seeds.json` versionnés en git. Changement de contrat = PR dédiée avec `BREAKING` ou `ADDITIVE` dans le titre + mise à jour de 08/08b/16 si le besoin change.
- Ordre de priorité inchangé (README) : specs 06-10 > backlogs 14/15 en cas d'écart — corriger le code ou le backlog, jamais la spec silencieusement.

## Checklist

- [ ] `openapi:gen` + `openapi:check` verts en CI
- [ ] Migration initiale + seed idempotent + test seed vert
- [ ] Fixtures gelées pour les 6 pilotes (3 seeds × niveaux 1/8/15)
- [ ] Types front générés depuis `openapi.json`, 0 type API manuel
