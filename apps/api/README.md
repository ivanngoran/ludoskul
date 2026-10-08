# @ludoskul/api — Run local (BE-1.2 / BE-1.4 + BE-EPIC-2 auth)

Socle fondations BE-EPIC-01 : Fastify 5 + Prisma 5 + PostgreSQL 16.
Auth BE-EPIC-02 (08b) : email OTP + magic link, password, OAuth Google/Apple
(mocks hors prod), phone/WhatsApp→SMS (mocks), invité + upgrade, identities,
devices + refresh rotation, famille + consentement, profil, fusion.

## Prérequis

- Node 20 LTS + pnpm 10
- Postgres 16 local **ou** Docker Desktop

## 1. Postgres local isolé

```powershell
cd tools/ludoskul-postgres
Copy-Item .env.example .env
docker compose up -d
docker exec ludoskul-postgres pg_isready -U ludoskul -d ludoskul
```

Chaîne pour ce service isolé (port `15432`) :

```
DATABASE_URL="postgresql://ludoskul:ludoskul@localhost:15432/ludoskul"
```

> `apps/api/.env.example` pointe par défaut sur `5432` (stack `docker-compose.yml` racine).
> Si tu utilises `tools/ludoskul-postgres`, surcharge `DATABASE_URL` avec le port `15432`.

## 2. API

```powershell
# depuis la racine
cp apps/api/.env.example apps/api/.env  # puis ajuste DATABASE_URL si 15432
pnpm install
pnpm --filter @ludoskul/api exec prisma validate
pnpm --filter @ludoskul/api db:seed:check
pnpm --filter @ludoskul/api dev
```

Santé :

- `GET http://localhost:3001/health` → `{ok:true}` <50ms
- `GET http://localhost:3001/ready` → `{ok:true, db, redis}`
- `GET http://localhost:3001/api/docs` → Swagger
- `GET http://localhost:3001/api/exercises` → 6 pilotes
- `GET http://localhost:3001/api/exercises?includeInactive=1` → 26
- `GET http://localhost:3001/api/badges` → 39

Auth (BE-EPIC-2, 08b-§4) — hors prod, `debug:{code,magicToken}` retourné
(provider mail/SMS mock, jamais loggé) :

- `POST /api/auth/email/code {email,purpose}` → 200 générique
- `POST /api/auth/email/verify {email,code,pseudo?}` → 201/200 + tokens
- `GET /api/auth/email/magic?token=` → one-shot
- `POST /api/auth/register|login` + `POST /api/auth/password/forgot|reset`
- `GET /api/auth/oauth/:provider/url` + `GET .../callback?code&state`
  (mocks : `OAUTH_MOCK=1` + code pré-enregistré côté serveur)
- `POST /api/auth/phone/code|verify` (WhatsApp puis SMS même code)
- `POST /api/auth/guest` + `POST /api/auth/guest/upgrade` (****** + preuve)
- `GET|DELETE /api/auth/identities[/:provider]` (garde dernier moyen)
- `POST /api/auth/refresh|logout` + `GET|DELETE /api/auth/devices[/:id]`
- `GET|PATCH|DELETE /api/auth/me` + `POST /api/auth/merge/confirm`
- `POST|GET /api/family/children` + `PATCH|DELETE /api/family/children/:id`
- `POST /api/family/invite` + `GET /api/family/join?token=`

## 3. Migrations (dès Docker OK)

```powershell
pnpm --filter @ludoskul/api db:migrate
pnpm --filter @ludoskul/api db:seed
```

Migration initiale : `apps/api/prisma/migrations/20261007000000_init_be11/`.

## 4. Qualité (BE-1.4)

```powershell
pnpm --filter @ludoskul/api typecheck
pnpm --filter @ludoskul/api lint
pnpm --filter @ludoskul/api test
pnpm openapi:gen
pnpm openapi:check
pnpm audit --audit-level=high
```

CI `.github/workflows/ci.yml` : `prisma validate` + `db:seed:check` + `lint` + `typecheck` + `test` + `build` + `openapi:gen/check` + `audit high`.

## Secrets

Jamais en repo. `.env` local uniquement, `.env.example` versionné sans valeurs.
Clés : `DATABASE_URL, REDIS_URL, JWT_SECRET/REFRESH(≥32), GOOGLE_*, APPLE_*, WHATSAPP_*, SMS_*, FRONT_URL, OTP_*`.
Logs JSON sans PII (jamais email/tél/code/OTP/mot de passe).
