# @ludoskul/api — Run local (BE-1.2 / BE-1.4)

Socle fondations BE-EPIC-01 : Fastify 5 + Prisma 5 + PostgreSQL 16.

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

> Test cascade RGPD (`cascade.test.ts`, DoD BE-1.1) : skippé en local sans `DATABASE_URL`,
> obligatoire en CI (service Postgres, échec si DB absente).

CI `.github/workflows/ci.yml` : `prisma validate` + `db:seed:check` + `lint` + `typecheck` + `test` + `build` + `openapi:gen/check` + `audit high`.

## Secrets

Jamais en repo. `.env` local uniquement, `.env.example` versionné sans valeurs.
Clés : `DATABASE_URL, REDIS_URL, JWT_SECRET/REFRESH(≥32), GOOGLE_*, APPLE_*, WHATSAPP_*, SMS_*, FRONT_URL, OTP_*`.
Logs JSON sans PII (jamais email/tél/code/OTP/mot de passe).
