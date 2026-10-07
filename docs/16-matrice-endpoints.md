# 16 — Matrice croisée Frontend → Backend (vérification MVP pilote)

> Vérification du 2026-09-17, mise à jour 2026-09-28 (contrats 08/08b complétés : merge/famille-join, archive ranking, report, export, flags). Chaque endpoint requis par `15` doit être exposé et traité par `14` (détail opposable en 08/08b). Légende : ✅ couvert, 🟠 patch appliqué ci-dessous, ❌ manquant (zéro à la fin).

## 1. Auth / comptes / famille / appareils

| Besoin front (15)                                 | Opération                    | Backend (14)                           | Statut     |
| ------------------------------------------------- | ---------------------------- | -------------------------------------- | ---------- |
| URL OAuth par provider                            | Lecture (création intention) | BE-2.3                                 | ✅         |
| Session OAuth (callback)                          | Création                     | BE-2.3                                 | ✅         |
| Envoi code email + resend état                    | Création                     | BE-2.1                                 | ✅         |
| Vérification code email / magic                   | Création                     | BE-2.1                                 | ✅         |
| Register/login/reset password                     | Création/Modification        | BE-2.2                                 | ✅         |
| Envoi/vérification OTP phone/WhatsApp-SMS         | Création                     | BE-2.4                                 | ✅         |
| Session invité                                    | Création                     | BE-2.5                                 | ✅         |
| Upgrade invité (merge sans perte)                 | Création                     | BE-2.5                                 | ✅         |
| Liaison provider                                  | Création                     | BE-2.3 + BE-2.6                        | ✅         |
| Confirmation fusion (EMAIL_CONFLICT vérifié)      | Création                     | BE-2.10 (patch)                        | 🟠 ajouté  |
| Identités / appareils / enfants                   | Lecture                      | BE-2.6/BE-2.7/BE-2.8                   | ✅         |
| Toggle rankingPublic, pseudo/avatar, consentement | Modification                 | BE-2.8/BE-2.9                          | ✅         |
| Unlink provider (garde dernier)                   | Suppression                  | BE-2.6                                 | ✅         |
| Révocation device, logout device                  | Suppression/Modification     | BE-2.7                                 | ✅         |
| Suppression compte + enfant (cascade)             | Suppression                  | BE-2.9/BE-6.4 + BE-2.10 (patch enfant) | 🟠 précisé |
| Profil courant (+guest,providers,rankingPublic)   | Lecture                      | BE-2.9                                 | ✅         |
| Flags publics (`pilote6,providers,tts,ranking`)   | Lecture                      | BE-7.4 (patch)                         | 🟠 ajouté  |

## 2. Catalogue / questions / TTS / aide

| Besoin front                             | Opération       | Backend         | Statut |
| ---------------------------------------- | --------------- | --------------- | ------ |
| Grille exercices 6 pilotes (+20 Bientôt) | Lecture         | BE-3.1          | ✅     |
| Détail exo (levels, timeLimits, help)    | Lecture         | BE-3.1 + BE-3.3 | ✅     |
| Questions arcade (niveau, sans réponses) | Lecture         | BE-4.2          | ✅     |
| Questions training (niveau+bloc)         | Lecture         | BE-4.2          | ✅     |
| Manifeste TTS + cache                    | Lecture         | BE-3.4          | ✅     |
| Générateurs 6 pilotes + distracteurs     | Interne (testé) | BE-3.2          | ✅     |

## 3. Sessions / réponses / sync / reprise

| Besoin front                                   | Opération    | Backend                                   | Statut |
| ---------------------------------------------- | ------------ | ----------------------------------------- | ------ |
| Session arcade                                 | Création     | BE-4.1                                    | ✅     |
| Session training (+niveau)                     | Création     | BE-4.1                                    | ✅     |
| Changement niveau training (entre blocs)       | Modification | BE-4.1 (`training-level`, 409 si en bloc) | ✅     |
| Réponse arcade (timeMs+inputMode, 422)         | Création     | BE-4.3                                    | ✅     |
| Réponse training (+tip)                        | Création     | BE-4.3                                    | ✅     |
| Complétion arcade (recalcul+XP+badges+ranking) | Création     | BE-4.4                                    | ✅     |
| Arrêt training (stats+XP réduit)               | Création     | BE-4.4                                    | ✅     |
| Abandon arcade                                 | Modification | BE-4.4                                    | ✅     |
| Sessions actives + reprise + conflit 409       | Lecture      | BE-4.5                                    | ✅     |
| Sync progress idempotent + file offline        | Modification | BE-4.6                                    | ✅     |

## 4. Ranking / progress / badges / export

| Besoin front                                     | Opération          | Backend        | Statut    |
| ------------------------------------------------ | ------------------ | -------------- | --------- |
| Top100 + curseur + `me`                          | Lecture            | BE-5.2         | ✅        |
| Autour ±3 + périodes week/month/all              | Lecture            | BE-5.2         | ✅        |
| Archive semaine N-1 (`?weekStart`)               | Lecture            | BE-5.2 (patch) | 🟠 ajouté |
| Temps réel subscribe/update/you-moved/celebrated | Lecture temps réel | BE-5.3         | ✅        |
| Signalement pseudo                               | Création           | BE-5.5         | ✅        |
| Progress/stats 2 volets + byExercise             | Lecture            | BE-6.1         | ✅        |
| Badges 39 + dates                                | Lecture            | BE-6.2         | ✅        |
| Export JSON                                      | Création           | BE-6.4         | ✅        |

## 5. Patches appliqués à `14` (rien à deviner côté front)

- **P1** : `BE-2.10 Fusion + enfant` ajouté (confirm merge + `DELETE family/children/:id`).
- **P2** : `BE-5.2` étendu (`GET ranking/:code?weekStart=YYYY-MM-DD` archive N-1, même tri/curseur).
- **P3** : `BE-7.4` étendu (`GET config/flags` public + kill-switch par provider).

Après patches : **0 endpoint front sans backend** (vérifié 2026-09-28 : merge/famille-join, archive, report, export, flags désormais dans 08/08b). En cas d'écart futur : contrat 08/08b fait foi sur le chemin, 14/15 sur le besoin (mettre à jour le doc en retard).
