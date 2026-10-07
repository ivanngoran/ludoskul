# 19 — Règles de développement (CONTRIBUTING, env, Turbo, DoD, navigateurs)

> Tranche 13-H (matrice navigateurs) et 13-J (repo privé MVP). Ce document = le `CONTRIBUTING.md` résumé opposable ; le fichier racine pointe ici.

## 1. Repo et gouvernance

- Repo **privé** pendant le MVP. Ouverture v1.1 envisagée pour `packages/shared/generators` en MIT uniquement (jamais auth/ranking). Licence : à trancher avant toute ouverture (défaut : tous droits réservés).
- Branches : `main` protégée (CI verte + 1 review). Préfixes : `feat/`, `fix/`, `docs/`, `chore/`. Commits : Conventional Commits (`feat(arcade): …`, `fix(auth): …`).
- Monorepo Turborepo : `apps/web`, `apps/api`, `packages/shared`, `packages/ui`. Pipeline : `dev`, `build` (dépendances `^build`), `lint`, `typecheck`, `test`, `openapi:gen`, `e2e` (web, après build).

## 2. Environnements et secrets

- `.env.example` versionné par app (clés sans valeurs). `.env` locaux jamais commités. Secrets (JWT, OAuth, WhatsApp/SMS, KMS) via variables d'environnement / vault uniquement.
- Front : `VITE_API_URL`, `VITE_WS_URL`, `VITE_APP_NAME`. API : `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `GOOGLE_*`, `APPLE_*`, `WHATSAPP_*`, `SMS_*`, `OTP_*`.
- CI : secrets en secrets GitHub, jamais en logs (masquage). Pas de seed OTP réel en test (mocks).

## 3. Definition of Done (par story 14/15, complète 05)

- [ ] Code + review (1 approveur)
- [ ] Tests unitaires/intégration verts, coverage nouveaux fichiers > 80 %
- [ ] `openapi:check` vert si endpoint touché ; fixtures seed inchangées ou mise à jour revue
- [ ] Storybook à jour (composant UI) + snapshots Chromatic validés
- [ ] axe-core 0 violation hors jeu ; test clavier-sans-effet en jeu
- [ ] Pas de régression bundle (< 200 Ko gzip initial) ni Lighthouse CI (> 90 perf, > 95 a11y hors jeu)
- [ ] Textes via `fr.json`, SVG avec `aria-label`, aucun secret/PII en log
- [ ] Déployé staging + validé PO + case backlog cochée

## 4. Matrice navigateurs/appareils supportés (opposable, tranche 13-H)

| Cible                   | Seuil opposable                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome / Edge           | N-2                                                                                                                                                                                                           |
| Safari (macOS + iOS)    | N-2 (iOS 16+)                                                                                                                                                                                                 |
| Firefox                 | N-2                                                                                                                                                                                                           |
| Android (Chrome)        | 10+                                                                                                                                                                                                           |
| Écran min               | 360 px large                                                                                                                                                                                                  |
| RAM min tablettes école | 2 Go : jeu jouable sans confetti, `QuestionView` < 50 Ko, SVG inline uniquement. < 2 Go : mode dégradé auto (animations OFF, pas de confetti, polling ranking 30s au lieu de WS, message `Mode léger activé`) |
| Stockage min            | 100 Mo libres (PWA + cache TTS + file offline 500 réponses)                                                                                                                                                   |

- Protocole tablettes anciennes : 1 device réel < 2 Go RAM testé par sprint (jeu ADD L1-L3 arcade + training 1 bloc, INP < 300ms toléré en dégradé vs 150ms standard).
- Non supporté = message FR + conseil (mettre à jour), jamais page blanche. E2E tourne sur Chromium + WebKit + 360 px.

## 5. Commandes racine + conteneurs (Docker-ready)

`dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `openapi:gen`, `openapi:check`, `storybook`. Voir 05 pour le détail par phase.

Docker-ready (manquant à implémenter en Phase 0 — voir BE-1.2) : `apps/api/Dockerfile` (Node 20-slim, `prisma migrate deploy` au start, healthcheck `/health`), `apps/web/Dockerfile` (build Vite + Nginx statique), `docker-compose.yml` local (api+web+postgres16+redis7). Images < 300 Mo (api) / < 50 Mo (web). Aucun secret dans l'image.
