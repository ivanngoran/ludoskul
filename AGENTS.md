# Ludoskul — Consignes Agents

Appli web d'exercices maths ludiques 6-14 ans. MVP pilote 6 exos (`ADD,SUB,TAB,SHAPE_2D,TIME,SUITE`) + catalogue 26 prêt. 2 modes : `TRAINING` (libre, infini, non classé) et `ARCADE` (15 niveaux x 3 Q = 45, chrono strict, classé mondial). UI FR, 100% gratuit, zéro pub. État actuel : repo docs-only (`docs/` fait foi) — Phase 0 monorepo à créer selon specs.

## Stack imposée (ne pas changer sans décision 13)

Node 20 LTS + Fastify 4 + Prisma 5 + PostgreSQL 16 + Redis 7 + React 18 + Vite 5 + Tailwind 3 + Socket.io 4. Turborepo + pnpm. ORM Prisma uniquement. Hébergement Vercel (front) + Railway/Render (API). Docker-ready à ajouter.

## Architecture

- Monorepo cible : `apps/web`, `apps/api`, `packages/shared` (types + `generators/`), `packages/ui` (design system + Storybook). Voir [03-architecture](docs/03-architecture-technique.md).
- Contrats opposables : [08-données+API](docs/08-modele-donnees-et-api.md) + [08b-auth](docs/08b-auth-comptes-sauvegarde.md) + [17-contrats-exécutables](docs/17-contrats-executables.md). Tout endpoint nouveau doit exister en 08/08b et en `openapi.json` généré (jamais édité main).
- Règles jeu/score : [06](docs/06-catalogue-exercices-maths.md) + [06b](docs/06b-catalogue-maths-complement.md) pour génération, [07](docs/07-mecaniques-jeu-scoring.md) pour formules (ne jamais inventer une autre formule), [09](docs/09-classement-mondial.md) ranking arcade-only semaine lundi UTC.
- Design/UX : [04](docs/04-design-ui-ux.md). Qualité/sécu/RGPD : [10](docs/10-qualite-accessibilite-securite.md) prioritaire sur tout.
- Ordre priorité en cas de contradiction : `10 > 06/06b > 07 > 08/08b > 09 > 02 > 04 > 03`. Backlogs [14](docs/14-backlog-backend.md) / [15](docs/15-backlog-frontend.md) exécutent les specs — corriger backlog/code, jamais la spec silencieusement.

## Build and Test

- Commandes racine attendues (Phase 0) : `pnpm dev | build (turbo run build) | lint | typecheck | test | test:e2e | db:migrate | db:seed | openapi:gen | openapi:check | storybook`. Voir [19-§5](docs/19-regles-developpement.md) + [05-plan](docs/05-plan-implementation.md).
- CI GitHub Actions : lint + typecheck + test + migrate-check + `openapi:check` + audit 0 high/critical. `main` protégée (CI verte + 1 review).
- DoD par story : tests >80% nouveaux fichiers, `openapi:check` vert si endpoint touché, axe-core 0 violation hors jeu, bundle <200 Ko gzip initial, Lighthouse >90 perf / >95 a11y hors jeu, textes via `fr.json`, déployé staging + validé PO. Voir [19-§3](docs/19-regles-developpement.md).

## Conventions

- Branches `feat/|fix/|docs/|chore/`, Conventional Commits (`feat(arcade): …`). Repo privé MVP. Langue doc/UI : FR.
- Secrets via ENV/vault uniquement, `.env.example` versionné, `.env` jamais commité. Logs JSON sans PII (jamais email/tél/code/OTP/mot de passe).
- Auth : JWT access 15 min en mémoire JS (pas localStorage) + refresh HttpOnly Secure SameSite=Lax 7j + rotation. Voir [08b](docs/08b-auth-comptes-sauvegarde.md).
- Prisma : schéma unique `apps/api/prisma/schema.prisma`, IDs `cuid2` partout, téléphone chiffré at-rest, OTP hash argon2id uniquement. Seeds idempotents (`upsert`), fixtures `seeds.json` gelées byte-identiques.
- Jeu pointeur-seul : souris/tap uniquement en QUESTION + feedback, `tabindex=-1`, touches 1-4/Entrée/Espace/Tab ignorées, `inputMode: mouse|touch` (`keyboard` → 422 `KEYBOARD_NOT_ALLOWED` en MVP). Clavier requis hors jeu. Voir [10-§1](docs/10-qualite-accessibilite-securite.md).
- Détails backend → `.github/instructions/backend.instructions.md`, frontend → `frontend.instructions.md`, tests/contrats → `testing.instructions.md`.

## Documentation — rôle de chaque fichier et consultation par l'agent

`docs/` fait foi. L'agent doit consulter la doc avant de coder, pas après. Règle : lire la spec opposable concernée, appliquer, citer le § dans la PR. En cas d'écart backlog/code vs spec 06-10, corriger backlog/code, jamais la spec silencieusement.

- `docs/01-vision-generale.md` — pourquoi, pour qui, périmètre MVP / hors périmètre. Quand : démarrage de toute tâche pour cadrer.
- `docs/02-specifications-fonctionnelles.md` — personas, user stories, fonctionnel. Quand : avant toute story produit.
- `docs/03-architecture-technique.md` — stack, monorepo, choix techniques. Quand : avant structure, config, infra, dépendance.
- `docs/04-design-ui-ux.md` — écrans, composants, thèmes, animations. Quand : avant tout travail UI dans `apps/web` ou `packages/ui`.
- `docs/05-plan-implementation.md` — phases, estimations, DoD, go/no-go. Quand : pour ordonner l'exécution.
- `docs/06-catalogue-exercices-maths.md` — 12 exos de base, paramètres 15 niveaux. Quand : avant tout générateur/question. Fait foi génération.
- `docs/06b-catalogue-maths-complement.md` — 14 exos complémentaires. Quand : même usage que 06.
- `docs/07-mecaniques-jeu-scoring.md` — boucles, timers, vies, formules score/XP/badges. Quand : avant session/scoring. Ne jamais inventer une autre formule.
- `docs/08-modele-donnees-et-api.md` — schéma DB, endpoints REST, WebSocket. Quand : avant tout modèle/endpoint. Opposable.
- `docs/08b-auth-comptes-sauvegarde.md` — providers, OTP, invité, mineurs/famille, sync. Quand : avant auth/profil/devices/famille.
- `docs/09-classement-mondial.md` — ranking arcade-only, semaine lundi UTC. Quand : avant ranking/Redis/WS.
- `docs/10-qualite-accessibilite-securite.md` — WCAG AA, RGPD mineurs, sécu, perfs. Prioritaire sur tout. Quand : systématiquement avant coder/tester/reviewer.
- `docs/11-roadmap-extensions.md` — pilote 6 puis v1.1 20 exos. Quand : pour ne pas implémenter hors MVP.
- `docs/12-glossaire.md` — vocabulaire commun. Quand : en cas de doute terminologique.
- `docs/13-decisions-ouvertes.md` — décisions tranchées. Quand : avant de remettre en cause stack/périmètre.
- `docs/14-backlog-backend.md` — stories BE à cocher. Quand : exécution backend. Voir suivi ci-dessous.
- `docs/15-backlog-frontend.md` — stories FE + endpoints requis. Quand : exécution frontend. Voir suivi ci-dessous.
- `docs/16-matrice-endpoints.md` — preuve croisée front/back. Quand : avant tout ajout d'endpoint.
- `docs/17-contrats-executables.md` — OpenAPI générée, Prisma, seeds, fixtures. Quand : avant contrat/migration/seed/fixture.
- `docs/18-assets-contenus.md` — SVG, TTS/MP3, `fr.json`. Quand : avant asset/contenu/texte UI.
- `docs/19-regles-developpement.md` — CONTRIBUTING, env/secrets, Turbo, DoD, navigateurs. Quand : avant commit/PR/déploiement.
- `docs/20-legal.md` — CGU, confidentialité, consentement parental. Quand : avant données perso/mineurs.
- `docs/21-exploitation.md` + `docs/runbook/` — monitoring, flags, incidents, deploy, ranking-monday, OTP-down, delete/restore. Quand : avant exploit/incident/deploy.
- `docs/22-produit.md` — marque, landing, help, PWA/SEO, templates OTP. Quand : avant pages publiques.
- `docs/23-qa-analytics.md` — pyramide tests, E2E, analytics sans tracker. Quand : avant tests/métriques.
- `.github/instructions/backend.instructions.md` — règles backend détaillées. Quand : obligatoire avant tout fichier `apps/api/**/*`, `packages/shared/src/generators/**/*`, `packages/shared/src/validators/**/*`.
- `.github/instructions/frontend.instructions.md` — règles frontend détaillées. Quand : obligatoire avant tout fichier `apps/web/**/*`, `packages/ui/**/*`.
- `.github/instructions/testing.instructions.md` — règles tests/contrats. Quand : obligatoire avant `**/*.test.*`, `**/*.spec.*`, `**/e2e/**/*`, `packages/shared/test/fixtures/**/*`, `apps/api/prisma/**/*`, `apps/api/openapi.json`.

Comment consulter : 1) identifier le périmètre (backend/frontend/test), lire le `.github/instructions/*.md` applicable ; 2) lire la spec opposable listée ci-dessus (10 d'abord) ; 3) lire la story 14/15 ; 4) implémenter + tests ; 5) vérifier `openapi:check`, DoD 19-§3, mettre à jour le backlog dans la même PR.

## Suivi backlogs 14/15 — marquage obligatoire des stories

Cycle unique : `[ ]` à faire → `[-]` en cours → `[x]` terminée → `[o]` revue. Un seul `[-]` à la fois par agent.

- Au début de chaque tâche : passer `- [ ] BE-X.Y / FE-X.Y` en `- [-] BE-X.Y / FE-X.Y` dans `docs/14-backlog-backend.md` ou `docs/15-backlog-frontend.md` et commiter ce marquage.
- À la fin de chaque tâche : passer `- [-]` en `- [x]` uniquement si DoD 19-§3 vérifiée (tests >80% nouveaux fichiers, `openapi:check` vert, axe 0 violation hors jeu, `fr.json`, 0 secret/PII).
- Après review (CI verte + 1 review) : passer `- [x]` en `- [o]` (revue/validée). Ne jamais passer en `[o]` sans review.
- Ne jamais cocher `[x]` sans tests verts, ne jamais sauter `[-]`, ne jamais modifier la spec pour faire passer le backlog.
