# Runbook — Cron ranking lundi 00:00 UTC (voir 09 + BE-5.4)

## Vérification

1. Lundi 00:05 UTC : `weekStart` semaine N créée, semaine N-1 figée (`rank` renseigné).
2. Archive N-1 consultable : `GET /api/ranking/:code?weekStart=<lundi N-1>` identique au figé.
3. Badges Top100/10/#1 attribués une fois (pas de doublon).
4. `DeletedPseudo > 30j` purgés.

## Rejeu idempotent

- Relancer le job avec le même `weekStart` : aucun changement (lock + clé unique `(userId,exerciseId,weekStart)`).
- Si manqué : alerte `cron lundi manqué` (voir 21-§2) → rejouer manuellement avant 12:00 UTC + noter l'incident.

## Rollback

- Pas de suppression d'archive : en cas d'erreur de calcul, corriger + rejouer idempotent, jamais effacer N-1.
