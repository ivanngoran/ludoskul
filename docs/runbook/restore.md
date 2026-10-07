# Runbook — Restore DB (voir 21-§1 + BE-7.3)

- Backups : Postgres quotidien + PITR 7j. Redis AOF (ranking reconstructible depuis Postgres via réconciliation `ZADD`).
- RPO ≈ 0 (chaque `POST answers` persisté), RTO < 1h.
- Test restore mensuel noté (date + résultat + nom).
- Procédure : restaurer PITR sur instance isolée → vérifier seed (6/26/39) + 1 session complète → switch DNS/conn → réconciliation Redis/Postgres → smoke `deploy.md`.
- Journal : `docs/runbook/restores-YYYY-MM.md` (date, motif, durée, résultat).
