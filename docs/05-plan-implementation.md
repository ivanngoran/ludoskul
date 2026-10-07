# Plan d'Implémentation

## Phases & Jalons

### Phase 0 : Fondations (Semaine 1)

**Objectif** : Monorepo fonctionnel, CI/CD, Design System de base

| Tâche | Description                                                                                                                                        | Livrable                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 0.1   | Init Turborepo + workspaces                                                                                                                        | `turbo.json`, `package.json` root |
| 0.2   | Config TypeScript strict partagé                                                                                                                   | `tsconfig.base.json`              |
| 0.3   | Setup ESLint + Prettier + Husky                                                                                                                    | Pre-commit hooks                  |
| 0.4   | Design System : tokens couleurs, typographie, spacing                                                                                              | `packages/ui/src/tokens/`         |
| 0.5   | Composants de base : Button, Card, Input, TimerRing                                                                                                | Storybook déployé                 |
| 0.6   | CI GitHub Actions : lint, typecheck, test, build                                                                                                   | Badges README                     |
| 0.7   | Déploiement preview Vercel + Railway (preview/PR + staging + prod ; `preprod` à formaliser si exigée — voir 03) + Dockerfiles/compose (voir 19-§5) | URLs staging                      |

**Critères succès** : `turbo run build` ✅, Storybook en ligne, preview deploy auto

---

### Phase 1 : Auth & Core Backend (Semaine 2)

**Objectif** : API auth, users, exercises CRUD, DB migrations

| Tâche | Description                                                                                                                 | Livrable                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1.1   | Prisma schema + migrations init                                                                                             | `prisma/schema.prisma`                       |
| 1.2   | Fastify app + plugins (cors, helmet, rate-limit)                                                                            | `apps/api/src/app.ts`                        |
| 1.3   | Auth module : email+password, OTP email, OTP WhatsApp/SMS, OAuth google/apple, guest+upgrade, link/unlink, devices, famille | `/api/auth/*`, `/api/family/*` (voir 08b-§4) |
| 1.4   | Users module : profile, preferences, rankingPublic, isChild/parent                                                          | `/api/auth/me` PATCH                         |
| 1.5   | Exercises module : CRUD, config JSON                                                                                        | `/api/exercises/*`                           |
| 1.6   | Seed DB : 26 lignes catalogue (06 + 06b) dont 6 pilotes actives (`isActive=true`)                                           | Script `db:seed`                             |
| 1.7   | Tests intégration auth (4 providers mocks + OTP limites + guest upgrade + delete cascade) + exercises                       | Vitest + supertest                           |
| 1.8   | OpenAPI/Swagger auto-généré                                                                                                 | `/api/docs`                                  |
| 1.9   | Sauvegarde : sync progress idempotent, sessions/active reprise, file offline                                                | `syncService.ts`, `sessions/active`          |

**Critères succès** : Google/Apple/email-code/phone-OTP/invité → même User liable, liste exercices via API ✅

---

### Phase 2 : Frontend Auth & Navigation (Semaine 3)

**Objectif** : Pages auth, routing, state management, layout

| Tâche | Description                                                                                 | Livrable                                      |
| ----- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 2.1   | Vite + React + Tailwind + Router                                                            | `apps/web` fonctionnel                        |
| 2.2   | Pages : Login (4 providers + invité), OTP, Register parent/enfant, Forgot Password, Devices | `/login`, `/register`, `/otp`, `/family`      |
| 2.3   | Auth context + Zustand store (token, user, providers, guest, sync état)                     | `stores/authStore.ts` + `stores/syncStore.ts` |
| 2.4   | Protected routes + redirect logic                                                           | `<PrivateRoute>`                              |
| 2.5   | Layout principal : Header minimal, Footer                                                   | `components/Layout.tsx`                       |
| 2.6   | Home : grille exercices par catégorie                                                       | `/` page                                      |
| 2.7   | Thème provider + localStorage persist                                                       | `ThemeProvider`                               |
| 2.8   | Error boundaries + loading states                                                           | UX robuste                                    |

**Critères succès** : Login Google/Apple/email/phone/invité → grille exercices + bandeau sauvegarde (invité) + reprise session ✅

---

### Phase 3 : Moteur de Jeu - Pilote calcul (Semaine 4-5) — ADD/SUB/TAB

**Objectif** : Gameplay 2 modes pour 3 exos pilote + fondations TTS/sauvegarde

| Tâche | Description                                                                                                          | Livrable                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 3.1   | Générateur questions partagé (shared)                                                                                | `packages/shared/src/generators/`                                     |
| 3.2   | Types questions : input numérique, choix multiple                                                                    | `types/questions.ts`                                                  |
| 3.3   | Store exercice dual : arcade (niveau, vies, streak, score) + training (niveau choisi, blocIndex, compteurs infinis)  | `stores/exerciseStore.ts` + `stores/trainingStore.ts`                 |
| 3.4   | Composant QuestionView pointeur-seul (grande question, 4 réponses, tabindex=-1 en jeu)                               | `QuestionView.tsx`                                                    |
| 3.5   | TimerRing animé + alertes visuelles/sonores                                                                          | `TimerRing.tsx`                                                       |
| 3.6   | Feedback correct/incorrect + animations                                                                              | `FeedbackOverlay.tsx`                                                 |
| 3.7   | Logiques : arcade 3 Q → niveau suivant (L1→L15) + training blocs infinis + sélecteur mode/exo/niveau                 | `useArcadeFlow` + `useTrainingFlow` hooks                             |
| 3.8   | Écrans : fin niveau + fin exercice arcade (15 niveaux) + fin bloc + fin session training + passage arcade pré-rempli | `LevelComplete`, `ExerciseComplete`, `BlockRecap`, `TrainingComplete` |
| 3.9   | Persistance session (localStorage + sync serveur)                                                                    | `sessionService.ts`                                                   |
| 3.10  | Tests unitaires générateur + store                                                                                   | Vitest coverage > 80%                                                 |
| 3.11  | Accessibilité : pointeur-seul en jeu + screen reader informatif, clavier hors jeu                                    | Audit axe-core hors jeu + test clavier-ignoré en jeu                  |

**Critères succès** : Arcade ADD L1→L15 complet classé + Training ADD Niv 7 infini (3 blocs, changement niveau, stop, XP réduit) ✅

---

### Phase 4 : Pilote Géométrie + Mesures + Logique (Semaine 6) — MVP 6 exos

**Objectif** : SHAPE_2D, TIME, SUITE (ADD/SUB/TAB déjà en Phase 3) + TTS 🔊

| Tâche | Description                                                                         | Livrable                                           |
| ----- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| 4.1   | Assets SVG : formes 2D + horloges + motifs suites + TTS (voir 06/06b lignes pilote) | `public/assets/shapes/`, `clock/`, `audio/` cache  |
| 4.2   | Composant ShapeSelector pointeur (grille 4 formes)                                  | `ShapeSelector.tsx`                                |
| 4.3   | Composants ClockFace + PatternRow + ReadAloud (TTS, 1 réécoute arcade)              | `ClockFace.tsx`, `PatternRow.tsx`, `ReadAloud.tsx` |
| 4.4   | Générateurs SHAPE_2D/TIME/SUITE (niveaux 1-15, 06/06b)                              | `geometryGenerators.ts`, `timeGenerator.ts`        |
| 4.5   | TTS : cache MP3 consignes + fallback Web Speech, règle chrono (07)                  | `ttsService.ts`                                    |
| 4.6   | Intégration ExerciseView 6 exos pilote                                              | `ExerciseView.tsx`                                 |
| 4.7   | Tests visuels + audio (Chromatic/Storybook)                                         | Snapshots + MP3 validés                            |

**Critères succès** : 6 exos pilote jouables 1-15 en 2 modes + TTS ✅

### Phase 4b : v1.1 — 20 exos restants (1-2/semaine, même moteur, catalogue 06/06b prêt)

| Tâche | Description                                                             | Charge indicative                                         |
| ----- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| 4b.1  | MUL, DIV, MIX, COMP10, DOUBLE puis CMP, FRAC, DECI, POURC               | ~1 j/exo (générateur + distracteurs + fixtures + stories) |
| 4b.2  | MES, MONEY puis SHAPE_3D, PROP, SYM, PERIM, AREA, ANGLE, VOL, REP, PROB | ~1 j/exo + assets SVG si nouveaux                         |
| 4b.3  | QA pédagogique référent enseignant par exo + badges associés            | ~0,5 j/exo (grille 18-§4 + sign-off)                      |

Jalons : lot 1 (MUL/DIV/MIX) → lot 2 (calcul malin + nombres) → lot 3 (mesures/monnaie) → lot 4 (géométrie avancée + PROB). Chaque lot = E2E 1 exo 15/15 + grilles signées avant lot suivant.

---

### Phase 5 : Classement & Temps Réel (Semaine 7)

**Objectif** : Leaderboards mondiaux, WebSocket, position joueur

| Tâche | Description                                        | Livrable                 |
| ----- | -------------------------------------------------- | ------------------------ |
| 5.1   | Ranking module API : calcul rang, pagination       | `/api/ranking/*`         |
| 5.2   | Job cron hebdo : reset classements, calcul rangs   | `cron/weeklyRanking.ts`  |
| 5.3   | Redis sorted sets : temps réel top 100             | `rankingService.ts`      |
| 5.4   | Socket.io server : rooms par exercice              | `socket/ranking.ts`      |
| 5.5   | Client : hook `useRanking(exerciseCode)`           | `hooks/useRanking.ts`    |
| 5.6   | Page Ranking : top 100 + position joueur + filtres | `/ranking/:exerciseCode` |
| 5.7   | Notifications live : "X a pris la place #Y"        | `LiveNotification.tsx`   |
| 5.8   | Anti-triche : validation serveur score/temps       | Middleware validation    |

**Critères succès** : Fin exercice → maj classement visible en < 2s ✅

---

### Phase 6 : Progression & Profil (Semaine 8)

**Objectif** : Historique, stats, badges, XP, paramètres

| Tâche | Description                                    | Livrable                     |
| ----- | ---------------------------------------------- | ---------------------------- |
| 6.1   | Progress module API : agrégats par exercice    | `/api/progress/*`            |
| 6.2   | Stats globales : graphiques (Recharts)         | `components/StatsCharts.tsx` |
| 6.3   | Page Profil : XP, badges, progression par exo  | `/profile`                   |
| 6.4   | Système badges : définitions + déclencheurs    | `badges/definitions.ts`      |
| 6.5   | Avatars débloquables + sélection               | `AvatarPicker.tsx`           |
| 6.6   | Paramètres : thème, accessibilité, son, compte | `/settings`                  |
| 6.7   | Export données RGPD + suppression compte       | `/api/auth/me DELETE`        |

**Critères succès** : Profil complet, badges s'affichent, export JSON ✅

---

### Phase 7 : Polish & Launch (Semaine 9)

**Objectif** : Qualité production, tests E2E, monitoring, lancement

| Tâche | Description                                                             | Livrable              |
| ----- | ----------------------------------------------------------------------- | --------------------- |
| 7.1   | Tests E2E critiques (Playwright)                                        | `tests/e2e/*.spec.ts` |
| 7.2   | Audit performance (Lighthouse > 90)                                     | Rapport               |
| 7.3   | Audit accessibilité (axe-core, manuel)                                  | Rapport WCAG AA       |
| 7.4   | Sentry + logs JSON config prod (Logtail optionnel si coût — voir 21-§2) | Dashboards            |
| 7.5   | Feature flags (LaunchDarkly-like simple)                                | `lib/flags.ts`        |
| 7.6   | Documentation utilisateur (FAQ, aide)                                   | `/help` page          |
| 7.7   | Landing page marketing (hors auth)                                      | `/` public            |
| 7.8   | Déploiement production + DNS                                            | `ludoskul.app`        |
| 7.9   | Post-launch : monitoring 48h, hotfixes                                  | Incident log          |

**Critères succès** : Prod stable, 0 erreur critique, Lighthouse > 90 ✅

---

## Dépendances Critiques

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
                                    │
                                    ├──→ Phase 5 (peut démarrer après 3.9)
                                    │
                                    └──→ Phase 6 (après 3.9 + 5.1)
                                             │
                                             └──→ Phase 7
```

## Estimation Effort — HISTORIQUE (12 exos/1 mode, ne plus utiliser pour le pilote)

| Phase                | Backend | Frontend | Shared/Infra | Total  |
| -------------------- | ------- | -------- | ------------ | ------ |
| 0                    | 1       | 2        | 3            | 6      |
| 1                    | 5       | 0        | 1            | 6      |
| 2                    | 1       | 5        | 0            | 6      |
| 3                    | 2       | 8        | 2            | 12     |
| 4                    | 1       | 5        | 1            | 7      |
| 5                    | 3       | 3        | 1            | 7      |
| 6                    | 2       | 4        | 1            | 7      |
| 7                    | 1       | 3        | 2            | 6      |
| **Total historique** | **16**  | **30**   | **11**       | **57** |

**Buffer 20% historique** : ~12 jours → **~69 jours homme** (périmètre 12 exos/1 mode/auth simple — OBSOLÈTE).
**MVP pilote actuel (6 exos + 2 modes + auth 4 providers + TTS) : à re-chiffrer au démarrage à partir de 14/15 (découpage à la story), l'estimation ci-dessus ne fait plus foi.**

---

## Risques & Mitigations

| Risque                             | Probabilité | Impact | Mitigation                                          |
| ---------------------------------- | ----------- | ------ | --------------------------------------------------- |
| Génération questions trop complexe | Moyenne     | Élevé  | Prototype isolé Phase 0.5, tests property-based     |
| WebSocket scaling                  | Faible      | Élevé  | Redis adapter, rooms par exo, pas broadcast global  |
| Animations perf mobile             | Moyenne     | Moyen  | `will-change`, `transform` only, test devices réels |
| Accessibilité oubliée              | Faible      | Élevé  | Intégrée dès Phase 0 (tokens), audit continu        |
| Tricherie classement               | Moyenne     | Moyen  | Validation serveur, rate limit, heuristiques        |
| Scope creep (nouvelles matières)   | Élevée      | Élevé  | Freeze scope MVP, backlog v2 séparé                 |

---

## Definition of Done (Par Feature)

- [ ] Code review approuvée (1+ reviewer)
- [ ] Tests unitaires > 80% coverage nouveaux fichiers
- [ ] Tests E2E chemin critique
- [ ] Storybook stories (composants UI)
- [ ] Accessibilité : axe-core 0 violations
- [ ] Performance : pas de régression bundle size
- [ ] Documentation README mise à jour
- [ ] Déployé sur staging validé par PO
- [ ] Merge sur `main` → deploy preview auto

---

## Commandes Utiles (package.json root)

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "playwright test",
    "db:push": "cd apps/api && prisma db push",
    "db:migrate": "cd apps/api && prisma migrate dev",
    "db:seed": "cd apps/api && tsx prisma/seed.ts",
    "db:studio": "cd apps/api && prisma studio",
    "storybook": "cd packages/ui && storybook dev -p 6006",
    "clean": "turbo run clean && rm -rf node_modules .turbo",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  }
}
```

---

## Variables d'Environnement

### Apps/API (.env — liste opposable alignée BE-1.2, valeurs en vault/CI uniquement)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ludoskul
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-min-32-chars
JWT_REFRESH_SECRET=different-secret-min-32-chars
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CORS_ORIGIN=http://localhost:5173
FRONT_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
# OAuth / OTP / SMS (jamais en repo, CI/vault uniquement — voir BE-1.2/BE-2.3/BE-2.4)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_TEMPLATE_OTP=
SMS_API_KEY=
SMS_SENDER=Ludoskul
OTP_EMAIL_TTL=900
OTP_PHONE_TTL=300
OTP_RESEND_COOLDOWN=60
OTP_MAX_PER_HOUR=5
```

### Apps/Web (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Ludoskul
```

---

## Checklist Lancement (Go/No-Go)

### Technique

- [ ] Build production réussi (0 erreur TypeScript, 0 warning ESLint)
- [ ] Tests E2E passent sur staging
- [ ] Lighthouse Performance > 90, Accessibility > 95, Best Practices > 90
- [ ] Bundle size < 200KB gzipped (initial JS)
- [ ] 0 vulnérabilités `npm audit` (high/critical)
- [ ] Sentry capture erreurs staging
- [ ] Logs structurés (JSON) en prod
- [ ] Backups DB automatisés (quotidiens + point-in-time)
- [ ] Rate limiting + WAF configurés

### Produit

- [ ] 6 exos pilote jouables 1-15 en 2 modes sans bug bloquant (catalogue 26 prêt pour v1.1)
- [ ] Classement temps réel fonctionnel
- [ ] Profil + badges + paramètres complets
- [ ] Flow inscription → premier exercice < 2 min
- [ ] Textes relus (orthographe, ton)
- [ ] Assets optimisés (SVG compressés, WebP)
- [ ] Favicon, PWA manifest, meta tags SEO

### Légal / Conformité

- [ ] Mentions légales + CGU + Politique confidentialité + consentement parental <15 ans FR (voir 08b-§2)
- [ ] RGPD : consentement cookies, export/suppression données (identités, OTP, devices inclus)
- [ ] Âge minimum 15 ans FR en autonomie (13-16 UE selon pays, défaut 15 + parcours parent/enfant)
- [ ] Numéros chiffrés, OTP hashés, logs sans PII
- [ ] Conditions d'utilisation classements arcade-only + pseudonymes

---

## Post-Launch (Mois 1-3)

| Semaine | Focus                                                           |
| ------- | --------------------------------------------------------------- |
| 1-2     | Monitoring intensif, hotfixes, feedback utilisateurs            |
| 3-4     | Analytics : funnel inscription→premier exo→rétention J7         |
| 5-8     | Nouvelles fonctionnalités v1.1 (mode défi quotidien, révision)  |
| 9-12    | Préparation v2 : Français (vocabulaire, grammaire), mode classe |
