# 23 — QA, E2E, fixtures et analytics (sans tracker pub)

> Tranche 13-G (Plausible-ou-rien). Principe : **aucun SDK pub** (pas de GA/Meta). Mesure produit = événements propres + Plausible EU auto-hébergé **ou rien** au MVP.

## 1. Pyramide de tests (opposable, complète 10-§5)

- Unitaires (Vitest, > 80 % nouveaux fichiers) : générateurs vs fixtures gelées (17-§4), formules 07 (bornes : L1/L15, streak 0/5, timeout), tri ranking 09, validators Zod, merge sync (serveur-gagne arcade).
- Intégration (Supertest, mocks OIDC/WhatsApp/SMS) : 4 parcours auth + link/unlink + garde dernier-moyen, OTP TTL/essais/resend, guest→upgrade sans perte, arcade 45 réponses→complete→ranking, training→stop sans ranking, delete cascade.
- E2E (Playwright, 10 scénarios) : inscription→ADD L1-L2 arcade pointeur ; touches clavier sans effet en jeu ; échec→retry ; training 3 blocs + changement niveau + stop ; offline→resync ; TTS 1 réécoute arcade ; invité→sauvegarde ; contraste + 360 px ; export + suppression.
- Visuels (Chromatic) : QuestionView correct/incorrect, HUD arcade/training, 4 thèmes × 3 breakpoints.
- A11y : axe-core hors jeu 0 bloquant + test clavier-ignoré en jeu + TTS offline.
- Perfs : Lighthouse CI (budgets 10-§4), k6 `GET ranking` 500 RPS, WS 10k/room (voir BE-5.3).

## 2. Fixtures et données de test

- Seeds gelés 17-§4 (générateurs), `fixtures/users.json` (parent, enfant `rankingPublic=false`, invité), `fixtures/ranking.json` (Top 10 + moi ±3 simulés), mocks OTP/OIDC à codes fixes en test (`000000` accepté uniquement en ENV=test).
- Staging : seed démo + pseudos FR, cron ranking déclenchable manuellement, flags forçables.

## 3. Analytics produit (événements propres)

| Événement                                   | Quand                                     | Usage                 |
| ------------------------------------------- | ----------------------------------------- | --------------------- |
| `auth_provider`                             | login/register/upgrade (provider, guest?) | funnel entrée         |
| `session_start{mode,code,level}`            | création session                          | activation            |
| `level_complete{arcade}` / `training_block` | fin niveau/bloc                           | progression           |
| `training_stop{questions,accuracy}`         | arrêt training                            | engagement libre      |
| `arcade_complete{score,accuracy}`           | 15/15                                     | conversion ranking    |
| `sync_conflict{resolution}`                 | conflit sync                              | fiabilité offline     |
| `tts_play{mode}`                            | lecture audio                             | adoption non-lecteurs |
| `help_open{page}`                           | aide/landing                              | contenu utile         |

- Funnel : inscription → 1er exo → J7 ; rétention J1/J7/J30 ; précision arcade vs training par exo ; part TTS ; resync réussis.
- Interdits : identifiants pub, fingerprint, revente, email/tél en clair dans events (userId hashé).
- Sans Plausible : les événements restent loggés côté serveur (agrégats anonymes) — le funnel reste calculable.

## 4. Gates go/no-go (rappel 05, vérifiés ici)

- [ ] E2E 10/10 verts sur staging + perfs/a11y budgets OK
- [ ] Grilles péda 6 pilotes signées (18-§4) + assets/MP3/`fr.json` complets
- [ ] Légal publié + consentement v1 + export/delete E2E verts
- [ ] Flags/kill-switch + runbooks + alertes quotas testés
- [ ] 0 vulnérabilité high/critical, secrets hors repo, logs sans PII

## Checklist

- [ ] Pyramide verte en CI + fixtures gelées
- [ ] Events analytics émis + funnel J7 lisible (ou logs serveur équivalents)
- [ ] Gates go/no-go cochés + décision launch datée
