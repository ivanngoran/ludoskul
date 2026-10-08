# ludoskul-postgres — Postgres 16 local (BE-1.1)

Service Docker isolé pour la DB locale. Ne pas confondre avec `docker-compose.yml` racine (stack complète).

## Démarrage

```powershell
cd tools/ludoskul-postgres
Copy-Item .env.example .env
docker compose up -d
docker compose ps
docker compose logs -f postgres
```

## Connexion

Chaîne compatible `apps/api/.env.example` :

```
DATABASE_URL="postgresql://ludoskul:ludoskul@localhost:15432/ludoskul"
```

Vérification :

```powershell
docker exec ludoskul-postgres pg_isready -U ludoskul -d ludoskul
```

## Arrêt

```powershell
docker compose stop
docker compose down        # conserve le volume
docker compose down -v     # purge le volume ludoskul-postgres-data
```

## Notes

- Image `postgres:16-alpine`, volume nommé `ludoskul-postgres-data`.
- Port modifiable via `POSTGRES_PORT` dans `.env`.
- Mot de passe `ludoskul` = dev local uniquement, jamais en prod.
- Migrations : `pnpm --filter @ludoskul/api db:migrate` depuis la racine.
