# 12 — Glossaire

| Terme                | Définition opposable                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ----- | ----- | --------- | ------- | --------------------------------------- |
| Mode Entraînement 🛠️ | Exo + niveau libres, blocs de 3 régénérés à l'infini, pas de vies, chrono indicatif, score local /5, XP plafonné 200/j/exo, jamais classé.                                           |
| Mode Arcade 🏆       | L1→L15 enchaînés (45 Q), 3 vies/niveau, chrono strict 10/8/6/5s, score 07-§3, seul éligible ranking.                                                                                 |
| Exercice             | Unité jeu : code unique (ex ADD), 15 niveaux × 3 questions (arcade). 6 au MVP pilote (ADD, SUB, TAB, SHAPE_2D, TIME, SUITE) ; catalogue 26 prêt (12 base + 14 complément) pour v1.1. |
| Niveau               | 1..15 dans un exercice. Difficulté croissante selon 06/06b. Arcade : 3 vies, 1 temps/question. Training : choix libre, infini.                                                       |
| Question             | 1 énoncé + 4 propositions (MVP). Temps 10/8/6/5s (strict arcade, indicatif training).                                                                                                |
| Session              | Tentative user : arcade (complète si 15/15 → `completed=true`) ou training (infinie, `completed=false`, `stopped=true`).                                                             |
| Vies                 | Arcade : 3 par niveau. -1 par erreur/timeout arcade. 0 = échec niveau. Training : aucune.                                                                                            |
| Streak / Série       | Nb bonnes consécutives. Arcade : cross-niveaux, bonus. Training : locale, affichage seul.                                                                                            |
| Score                | Formules 07 uniquement (arcade full / training /5 local). Somme questions + bonus (arcade). Plafond réel ~18-20k (maquettes 04 conformes depuis 2026-09-28).                         |
| Précision            | `correct/total*100` (arcade /45, training /jouées).                                                                                                                                  |
| XP                   | Arcade `floor(score/10)`. Training `min(floor(score/50),200/j/exo)`. Niveau joueur = `floor(sqrt(xp/100))+1`.                                                                        |
| Ranking              | Classement mondial **arcade uniquement** par `(exercice, semaine)`. Tri score→précision→temps→date→userId.                                                                           |
| Semaine ranking      | Lundi 00:00 UTC → dimanche 23:59 UTC.                                                                                                                                                |
| Assisted             | Session aidée (niveau baissé) : hors ranking.                                                                                                                                        |
| Seed                 | Arcade : `sha(sessionId:code:niveau)` ; training : `sha(sessionId:code:niveau:bloc)` — reproduit 3 questions.                                                                        |
| QCM                  | Question choix multiple 4 réponses (standard MVP).                                                                                                                                   |
| Distracteur          | Mauvaise réponse plausible générée selon règles 06.                                                                                                                                  |
| Timeout              | Temps écoulé = incorrect + -1 vie.                                                                                                                                                   |
| Badge                | Récompense 1 fois (sauf Top hebdo). Liste 07-5.                                                                                                                                      |
| Identity / Provider  | Compte de connexion lié à un User : `google                                                                                                                                          | apple | email | phone | microsoft | passkey | guest`. 1 User = N Identity (voir 08b). |
| Invité (guest)       | User sans vérification, données locales + upgrade sans perte vers compte vérifié. Bandeau `Non sauvegardé`.                                                                          |
| Famille              | Parent + profils enfants <15 ans, consentement horodaté, `rankingPublic=false` par défaut enfant.                                                                                    |
| OTP                  | Code 6 chiffres : email 15 min / téléphone-WhatsApp-SMS 5 min, 5 essais, resend 60s.                                                                                                 |
| Sauvegarde           | Locale (localStorage/IndexedDB après chaque réponse) + cloud auto-save + reprise `sessions/active` + export/suppression. RPO ≈ 0.                                                    |
| PWA                  | Version installable web (v1.1). Pas d'app native au MVP.                                                                                                                             |
| A11y                 | Accessibilité (WCAG AA).                                                                                                                                                             |
| RGPD                 | Règlement données UE, droits export/suppression §10.                                                                                                                                 |

Abréviations codes exos : ADD, SUB, MUL, DIV, MIX, TAB, COMP10, DOUBLE (calcul) ; CMP, FRAC, DECI, POURC (nombres) ; TIME, MES, MONEY (mesures) ; SHAPE_2D, SHAPE_3D, PROP, SYM, PERIM, AREA, ANGLE, VOL, REP (géométrie) ; SUITE, PROB (logique) — voir 06 + 06b.
