# 11 — Roadmap (MVP pilote 6 exos, 100% gratuit — voir 13)

> MVP pilote : ADD, SUB, TAB, SHAPE_2D, TIME, SUITE + 2 modes + TTS + 4 providers. Catalogue complet 26 (06 + 06b) prêt. Principe : **même moteur (15×3 arcade / blocs training, timer, ranking arcade/exercice), nouvelles configs 06-like**.

## 1. Protocole d'ajout d'une matière (à suivre à la lettre)

1. Créer `XX-catalogue-<matiere>.md` sur modèle 06/06b (26 exos maths = exemple complet : calcul, nombres, mesures, géométrie, logique).
2. Ajouter `category` enum (`FRENCH`, `SCIENCE`…) + seed `Exercise` (migration).
3. Ajouter générateur `packages/shared/generators/<matiere>.ts` (même interface `generateQuestions(code, level, seed)`).
4. Ajouter composant interaction si besoin (sinon réutiliser QCM) + stories + tests a11y.
5. Ranking auto (aucun code ranking à changer : clé = `exerciseCode`).
6. Badges matière + aide + copy FR relue.
7. E2E 1 exo pilote 15/15 avant généralisation.

Ne jamais : changer formule score 07, changer temps MVP, ajouter chat/DM, ajouter saisie libre sans spec anti-triche.

## 2. V1.1 (20 exos restants + gratuit durable, sans nouvelle matière)

- 20 exos 06/06b au rythme 1-2/semaine (MUL, DIV, MIX, COMP10, DOUBLE, CMP, FRAC, DECI, POURC, MES, MONEY, SHAPE_3D, PROP, SYM, PERIM, AREA, ANGLE, VOL, REP, PROB) + QA référent enseignant.
- 100% gratuit : quotas OTP (WhatsApp d'abord), pas de pub, pas de paywall. Si dérive coûts : quotas renforcés + offline-first.
- Défi quotidien pointeur (1 niveau/jour/exo, streak jours, badge Régulier).
- Mode révision tactile (rejoue erreurs perso, hors ranking, `assisted=true`).
- PWA installable + offline complet.
- Landing + `/help` + FAQ parents (profils enfants, export/suppression).

## 3. V2 — Français (exemple type)

| Code | Nom | Mécanique (même moteur) |
|---|---|---|
| VOCA | Vocabulaire rapide | image → mot (QCM 4) |
| ORTHO | Orthographe | compléter lettre (`ch_teau → a/â/e`) |
| GRAM | Nature/classement | `Sélectionne le verbe` |
| CONJ | Conjugaison | `Nous (être) → sommes/…` |
| LECT | Lecture flash | phrase flash 5s → question compréhension |
| DICT | Dictée courte | audio → QCM / saisie (v2.1) |

Mêmes 15×3, mêmes temps 10/8/6/5s sans bonus (TTS : chrono continue en arcade, voir 07-§2), même ranking arcade/exercice.

## 4. V3 — Sciences / Histoire / Langues (même patron)

- Sciences : `Sélectionne l'organe`, `Cycle eau : étape suivante ?`, QCM visuel.
- Histoire : frise → `Quel événement en 1789 ?` (distracteurs ± années proches).
- Anglais : `Cat → chat/chien/…` (audio + image).
Chaque matière = 1 catalogue 06-like + assets.

## 5. Mode Classe (enseignants, très demandé, après V2)

- Code classe, tableau de bord (précision moyenne, temps, points faibles par exo, sans ranking public inter-élèves si < 15 ans sans consentement parental, voir 08b-§2).
- Assignation (`ADD L1-5 pour lundi`), verrouillage niveaux, impression fiches.
- RGPD renforcé : minimisation, export classe, suppression fin année. Pas de notes officielles (positionnement : entraînement ludique, pas évaluation).
- Modèle : 100% gratuit y compris classe (voir 13-D), quotas OTP/infra surveillés.

## 6. Non-objectifs durables

- Multijoueur temps réel 1v1 (tension modération + perf, réévaluer à 100k MAU).
- Création exos par users (qualité/anti-triche).
- Mobile natif (PWA suffit jusqu'à preuve contraire).
- IA générative de questions en direct (coût + hallucinations ; génération validée humaine uniquement).
