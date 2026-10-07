# Runbook — Provider OTP/OAuth down (voir 21-§1 + BE-7.4)

## Seuils quotas gratuits (à ajuster au démarrage, voir 21-§2)

- OTP WhatsApp : alerte à 80% du quota jour, kill-switch à 100%.
- OTP SMS fallback : alerte à 50% (coût supérieur), kill-switch à 100%.
- Compteurs : `otp_sent{channel}` + coûts estimés/jour sur dashboard.

## Procédure

1. Activer kill-switch : flag `providers.<nom>=false` via `GET /api/config/flags` (< 1 min, sans redeploy).
2. Front masque le bouton + message FR + alternatives (ex WhatsApp down → `Recevoir par SMS`, email down → `Continuer avec Google`).
3. File resend : cooldown 60s respecté, pas de nouveau code si même TTL (WhatsApp→SMS même code).
4. Alerter (dashboard + incident log) + contacter provider.
5. Retour : flag `true` + smoke (envoi + vérification mock) + noter l'incident.

## Message FR type

- `Le service WhatsApp est en pause. Recevez votre code par SMS ou continuez avec Google.`
