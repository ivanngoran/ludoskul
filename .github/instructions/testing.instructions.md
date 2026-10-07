---
description: "Use when writing Vitest unit tests, Supertest integration tests, Playwright E2E, fixtures deterministes, OpenAPI contract checks, axe-core a11y, Lighthouse/K6 perf. Tests et contrats Ludoskul."
applyTo:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/e2e/**/*"
  - "packages/shared/test/fixtures/**/*"
  - "apps/api/prisma/**/*"
  - "apps/api/openapi.json"
---
# Tests et contrats (Ludoskul)

## Pyramide et seuils (voir 10-§5, 23)
- Unitaires Vitest >80% nouveaux fichiers : générateurs 06/06b (100 seeds/niveau), formule score 07 (valeurs limites), tri ranking 09, validators Zod.
- Intégration Supertest : auth → session → 45 answers → complete → ranking visible ; RGPD delete cascade ; guest upgrade sans perte (compter answers/xp avant/après).
- E2E Playwright (10 scénarios critiques) : inscription → ADD L1-L2 souris seule, touches 1-4/Entrée ignorées en jeu, échec → retry pointeur, 15/15 → ranking, offline → resync, tactile 360px, lecteur d'écran informatif, contraste, clavier hors jeu.
- Visuels Chromatic : QuestionView correct/incorrect, 4 thèmes, 3 breakpoints. A11y : axe-core 0 violation hors jeu par PR + test clavier-sans-effet en jeu.

## Contrats exécutables (voir 17)
- `openapi.json` généré depuis Zod (`openapi:gen`), jamais édité main. `openapi:check` vérifie chaque endpoint requis par 15/16 avec bons codes (200/201/204/400/401/403/404/409/422/429). Pas de schéma = pas de merge.
- Prisma : `migrate dev` local / `migrate deploy` prod, jamais `db push` hors dev. Seed idempotent (`upsert`) : 6 actifs / 26 avec `?includeInactive` / 39 badges, config+help non vides sur 6 pilotes.
- Fixtures `packages/shared/test/fixtures/seeds.json` : 3 seeds fixes × niveaux 1/8/15 par pilote, questions byte-identiques (prompt, options, asset, hash). `generateQuestions(code,level,seed)` doit reproduire à l'octet. Modification volontaire = nouvelle fixture + revue + motif. Blocs training successifs → questions différentes.
- Changement contrat = PR dédiée `BREAKING` ou `ADDITIVE` + MAJ 08/08b/16. Priorité : specs 06-10 > backlogs 14/15.

## Budgets et gates
- Perf : LCP <2.0s 4G, INP <150ms (300ms toléré mode dégradé <2Go RAM), CLS <0.05, Lighthouse >90 perf / >95 a11y hors jeu, bundle <200Ko gzip initial, `QuestionView` <50Ko. API p95 : `GET questions` <120ms, `POST answers` <100ms, `GET ranking` <150ms. Lighthouse CI fail si régression >10%, k6 500 RPS sur `GET ranking` avant launch.
- Navigateurs : Chrome/Edge N-2, Safari N-2 (iOS 16+), Firefox N-2, Android Chrome 10+, 360px min, 2Go RAM mode dégradé auto (animations OFF, polling 30s), jamais page blanche. E2E sur Chromium + WebKit + 360px, 1 device réel <2Go testé par sprint.
- DoD : review + tests verts + `openapi:check` + Storybook/Chromatic + axe + perfs + `fr.json` + 0 secret/PII en log + staging validé PO + case backlog cochée.
