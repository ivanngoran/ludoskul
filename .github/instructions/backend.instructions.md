---
description: "Use when working on Fastify API, Prisma schema, Zod validation, OpenAPI, auth OTP/OAuth/guest/famille, sessions arcade/training, generateurs deterministes, scoring serveur, ranking Redis/WS. Backend Ludoskul."
applyTo:
  - "apps/api/**/*"
  - "packages/shared/src/generators/**/*"
  - "packages/shared/src/validators/**/*"
---
# Backend — Fastify + Prisma (Ludoskul)

## Stack et emplacements
- Node 20 + Fastify 4 + TS 5 strict + Prisma 5 + PostgreSQL 16 + Redis 7 + Socket.io 4. Schéma unique `apps/api/prisma/schema.prisma`, entry `apps/api/src/app.ts`.
- Générateurs déterministes dans `packages/shared/src/generators/` (même code front/back). Jamais de logique métier dupliquée : importer depuis `packages/shared`.

## Contrats d'abord
- Source de vérité : [08-données+API](../../docs/08-modele-donnees-et-api.md) + [08b-auth](../../docs/08b-auth-comptes-sauvegarde.md). Toute route a un schéma Zod request+response ; `apps/api/openapi.json` est généré (`openapi:gen`), jamais édité main. Vérifier `openapi:check` en CI.
- Erreurs : `{error:{code,message,details?}}` avec codes opposables (`VALIDATION_ERROR, UNAUTHORIZED, EMAIL_TAKEN, PSEUDO_TAKEN, OTP_EXPIRED, OTP_TOO_MANY_ATTEMPTS, RESEND_TOO_SOON, PHONE_INVALID, PARENTAL_CONSENT_REQUIRED, BLOCK_IN_PROGRESS, LAST_AUTH_METHOD, EMAIL_CONFLICT, ANSWER_REJECTED, KEYBOARD_NOT_ALLOWED, RATE_LIMITED`). Message client toujours en FR.
- Front génère ses types via `openapi-typescript` depuis `openapi.json` — ne jamais typer l'API à la main côté front.

## Données (Prisma)
- IDs `cuid2` partout. Enums : `SessionMode(TRAINING|ARCADE)`, `ExerciseCategory(CALCUL|NOMBRES|MESURES|GEOMETRIE|LOGIQUE)`, providers `google|apple|email|phone|guest` (`microsoft|passkey` réservés v1.2).
- Téléphone chiffré at-rest (pgcrypto/KMS), OTP en hash argon2id uniquement, jamais de code en clair. `birthYear` seule pour enfants, jamais email/tél enfant.
- Seeds idempotents (`upsert`) : `seeds/exercises.json` (26 lignes, 6 `isActive=true` : ADD,SUB,TAB,SHAPE_2D,TIME,SUITE) + `seeds/badges.json` (39 codes, voir [07-§5](../../docs/07-mecaniques-jeu-scoring.md)). Test seed : 6 actifs / 26 avec `?includeInactive` / 39 badges.
- Delete User = cascade réelle (sessions/answers/ranking/progress/badges/refresh/devices) + pseudo réservé 30j en `DeletedPseudo`. Migrations `migrate dev` local / `migrate deploy` prod, jamais `db push` hors dev.

## Auth (détail en 08b)
- JWT access 15 min, refresh HttpOnly Secure SameSite=Lax 7j + rotation à chaque usage (réutilisation = révocation famille + alerte). Access en mémoire JS côté front, jamais localStorage.
- OTP : code 6 chiffres, TTL email 15 min / phone 5 min, 5 essais, resend 60s, rate 5/h/email-ou-numéro + 20/h/IP, réponses 200 génériques anti-énumération. WhatsApp d'abord puis SMS même code (pas de nouveau code).
- OAuth google/apple : PKCE S256 + state/nonce 10 min, `email_verified` exigé, relay Apple = identité distincte. Fusion uniquement si email/phone vérifié identique, sinon 409 + `suggestedAction`.
- Invité : `POST guest` puis `POST guest/upgrade` en transaction (réassigne sessions/answers/progress/badges, `guest=false`, idempotent). Famille : parent vérifié crée enfant (`isChild, rankingPublic=false` défaut, consentement horodaté), QR/code 10 min one-shot, `DELETE family/children/:id` retire du Top ≤60s.

## Sessions et scoring serveur (ne jamais faire confiance au client)
- 1 active/exo/mode/user. Arcade `POST sessions {exerciseCode,mode:ARCADE}` (startLevel 1 ou reprise) ; training avec `level` 1-15 libre + `blockIndex`. Changement mode = nouvelle session. `training-level` entre blocs uniquement sinon 409 `BLOCK_IN_PROGRESS`.
- Questions sans réponses : arcade `GET questions?level=N`, training `+&block=B`. Seeds : arcade `sha(sessionId:code:niveau)`, training `sha(sessionId:code:niveau:bloc)` (RNG `seedrandom` ou `xxhash`). `hash = sha(seed+index+prompt)` pour lier réponse.
- Génération exacte [06](../../docs/06-catalogue-exercices-maths.md) + [06b](../../docs/06b-catalogue-maths-complement.md) : plages, SUB a≥b, TIME minutes 0-59, QCM 4 uniques, unicité intra-bloc, distracteurs (±1/±2/±10, inversion, confusables, jamais négatif).
- `POST answers {level,blockIndex?,index,questionHash,chosen,timeMs,inputMode}` : arcade recalcule points selon [07-§3](../../docs/07-mecaniques-jeu-scoring.md) + vérifie `timeMs ≤ limite+1000` et hash sinon 422 ; training vérifie hash seulement, stocke `timeMs` pour stats. `inputMode` MVP = `mouse|touch`, `keyboard` → 422 `KEYBOARD_NOT_ALLOWED`.
- `POST complete {assisted}` arcade 15/15 uniquement ; `POST stop` training uniquement (jamais de ranking) ; `POST abandon` sauve `maxLevel`, non classé.

## Ranking et temps réel
- `Ranking` arcade-only, unique `(userId,exerciseId,weekStart lundi 00:00 UTC)`, tri `score DESC, timeSpent ASC`. Pagination curseur `(score,timeSpent,userId)`, pas d'offset. `period=week|month|all`, archive N-1 lecture seule.
- Redis sorted sets Top 100 cache 5s. Socket.io namespace `/ranking`, rooms `exercise:CODE`, `ranking:update` throttle 1/s payload ≤30KB, `ranking:you-moved` + `session:celebrated` Top 10 uniquement.

## Sécu et conf
- Helmet CSP stricte (voir [10-§2](../../docs/10-qualite-accessibilite-securite.md)), HSTS, nosniff, CORS = origine front seule, CSRF double-submit sur delete/unlink, bcrypt 12, HaveIBeenPwned k-anonymity au register/reset, lock login 5 échecs → 15 min.
- ENV/vault uniquement (`DATABASE_URL, REDIS_URL, JWT_SECRET/REFRESH≥32, GOOGLE_*, APPLE_*, WHATSAPP_*, SMS_*, OTP_*`), `.env.example` versionné. Logs JSON sans PII (userId/phoneHash, jamais email/numéro/code). `npm audit` 0 high/critical, Dependabot + SBOM mensuel.
