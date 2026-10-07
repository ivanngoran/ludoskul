# Ludoskul — Documentation de Conception (MVP Maths)

> Dossier `docs/` autonome : un développeur doit pouvoir implémenter toute la plateforme MVP uniquement avec ces documents, sans contexte oral.

## Projet en 30 secondes

**Ludoskul** est une appli web d'exercices ludiques pour élèves 6-14 ans.

- MVP **pilote** : **6 exercices** (ADD, SUB, TAB, SHAPE_2D, TIME, SUITE — voir 13-A) + catalogue complet 26 prêt (06 + 06b, v1.1 au fil de l'eau).
- **2 modes** : **Entraînement 🛠️** (exo + niveau libres, régénération infinie, sans pression) et **Arcade 🏆** (15 niveaux × 3 questions = 45 enchaînées, chrono, ranking).
- **100% gratuit, zéro pub** (voir 13-D). TTS 🔊 inclus pour non-lecteurs (chrono arcade continue).
- UI : **belle, colorée, joueuse, question en grand, très peu de bruit**.
- **Ranking mondial par exercice**, reset hebdomadaire.

## Comment lire cette doc

Ordre de lecture conseillé :

1. `01-vision-generale.md` — pourquoi, pour qui, périmètre MVP / hors périmètre.
2. `02-specifications-fonctionnelles.md` — ce que fait l'app, personas, user stories.
3. `06-catalogue-exercices-maths.md` — **référence implémentable** : les 12 exercices de base avec paramètres des 15 niveaux.
   3b. `06b-catalogue-maths-complement.md` — **14 exercices complémentaires** (nombres, mesures, géométrie avancée, logique, problèmes). Même moteur, mêmes invariants.
4. `07-mecaniques-jeu-scoring.md` — boucle de jeu exacte, timer, vies, score, XP, badges.
5. `04-design-ui-ux.md` — écrans, composants, thèmes, animations, sons, responsive.
6. `03-architecture-technique.md` — stack, monorepo, choix techniques.
7. `08-modele-donnees-et-api.md` — schéma DB commenté, endpoints REST avec exemples, WebSocket.
   7b. `08b-auth-comptes-sauvegarde.md` — Google/Apple/email/OTP WhatsApp-SMS/invité, comptes mineurs + famille, sauvegarde locale/cloud/reprise.
8. `09-classement-mondial.md` — règles ranking arcade-only, ex-aequo, saisons, anti-triche.
9. `10-qualite-accessibilite-securite.md` — WCAG AA, RGPD mineurs, sécurité, perfs, tests.
10. `05-plan-implementation.md` — découpage en phases, estimations, Definition of Done, go/no-go.
11. `11-roadmap-extensions.md` — pilote 6 puis v1.1 20 exos, 100% gratuit.
12. `12-glossaire.md` — vocabulaire commun.
13. `13-decisions-ouvertes.md` — décisions tranchées (pilote, parent, TTS, gratuit).
14. `14-backlog-backend.md` — epics/stories backend pilote, explicites, à cocher.
15. `15-backlog-frontend.md` — epics/stories frontend + endpoints requis (Création/Lecture/Modification/Suppression).
16. `16-matrice-endpoints.md` — preuve croisée : 0 besoin front sans backend (patches P1-P3 appliqués en 14).
17. `17-contrats-executables.md` — OpenAPI générée, Prisma, seeds idempotents, fixtures gelées.
18. `18-assets-contenus.md` — SVG, TTS/MP3, `fr.json`, validation pédagogique référent.
19. `19-regles-developpement.md` — CONTRIBUTING, env/secrets, Turbo, DoD, matrice navigateurs.
20. `20-legal.md` — CGU, confidentialité, consentement parental, registre des traitements.
21. `21-exploitation.md` — runbooks, monitoring/quotas, flags/kill-switch, incidents.
22. `22-produit.md` — marque/domaine, landing, help/FAQ, PWA/SEO, templates OTP.
23. `23-qa-analytics.md` — pyramide tests, E2E, fixtures, analytics sans tracker, gates go/no-go.

## Conventions

- **Exercice** : ex `ADD`, `SHAPE_2D`, `FRAC`, `TIME`. Catalogue complet 26 prêt (06 + 06b) ; MVP pilote 6 actifs : ADD, SUB, TAB, SHAPE_2D, TIME, SUITE (voir 13-A).
- **Mode** : `TRAINING` (libre, infini, non classé) ou `ARCADE` (enchaîné, classé). Voir 07-§0.
- **Niveau** : 1..15 dans un exercice (arcade : enchaîné ; training : choix libre).
- **Question** : 3 par niveau/bloc, temps 10/8/6/5s (strict arcade, indicatif training).
- **Session** : une tentative (arcade complète/partielle ou training infinie). `completed=true` = arcade 15/15 réussis. Training ne complète jamais (elle s'arrête).
- **Score** : voir formules exactes en 07 (arcade full, training local /5). Ne jamais inventer une autre formule.
- **Temps** : en secondes, mesuré côté client pour affichage, validé côté serveur pour ranking arcade.
- Langue UI MVP : français. Tous les exemples de copy sont en français.
- Fuseau ranking : UTC, semaine = lundi 00:00:00 UTC → dimanche 23:59:59 UTC.

## État de la conception

| Document                 | Statut                                                                         |
| ------------------------ | ------------------------------------------------------------------------------ |
| 01 vision                | ✅ stable                                                                      |
| 02 specs fonctionnelles  | ✅ stable                                                                      |
| 03 architecture          | ✅ stable                                                                      |
| 04 design UI/UX          | ✅ stable                                                                      |
| 05 plan implémentation   | ✅ stable                                                                      |
| 06 catalogue exercices   | ✅ stable — fait foi pour génération questions (base)                          |
| 06b catalogue complément | ✅ stable — fait foi pour 14 exos complémentaires                              |
| 07 mécaniques jeu        | ✅ stable — fait foi pour score/XP                                             |
| 08 données + API         | ✅ stable — fait foi pour contrats (08b pour auth/sauvegarde)                  |
| 08b auth/sauvegarde      | ✅ stable — fait foi pour providers, mineurs, sync                             |
| 09 classement            | ✅ stable — fait foi pour rangs                                                |
| 10 qualité/sécu          | ✅ stable                                                                      |
| 11 roadmap               | ✅ stable (pilote 6 + v1.1 20, 100% gratuit)                                   |
| 12 glossaire             | ✅ stable                                                                      |
| 13 décisions             | ✅ tranché le 2026-09-17 (version 2026-09-28 : TTS figé front, E-K appliquées) |
| 14 backlog backend       | ✅ complet pilote, à cocher                                                    |
| 15 backlog frontend      | ✅ complet pilote + endpoints requis                                           |
| 16 matrice               | ✅ 0 manque (P1-P3 patchés)                                                    |
| 17 contrats exécutables  | ✅ OpenAPI/Prisma/seeds/fixtures                                               |
| 18 assets/contenus       | ✅ SVG/TTS/fr.json + validation péda                                           |
| 19 règles dev            | ✅ CONTRIBUTING/env/Turbo/DoD/navigateurs                                      |
| 20 légal                 | ✅ CGU/confidentialité/consentement/registre (relecture juriste requise)       |
| 21 exploitation          | ✅ runbooks/monitoring/flags/incidents                                         |
| 22 produit               | ✅ marque/landing/help/PWA/templates OTP                                       |
| 23 QA/analytics          | ✅ tests/E2E/fixtures/funnel + gates                                           |

En cas de contradiction entre docs, ordre de priorité : **10 (sécurité/RGPD/a11y) > 06 / 06b > 07 > 08 / 08b > 09 > 02 > 04 > 03**. `14/15/16` exécutent ces specs : en cas d'écart entre backlog et specs (06-10), les specs gagnent (corriger le backlog). La dérogation pointeur-seul (10-§1) est tracée et prime sur les règles produit jeu en cas de conflit d'interprétation.

## Démarrage rapide pour implémenteur

1. Lire 01 + 02 (30 min).
2. Implémenter générateurs avec 06 + 06b comme spec de test (chaque ligne de tableau = cas de test arcade + bloc training).
3. Implémenter 2 boucles jeu avec 07 (arcade enchaînée classée + training infinie non classée).
4. Maquetter 04 (QuestionView d'abord, c'est 80% de la valeur).
5. Brancher API 08 + ranking 09.
6. Vérifier checklists 10 avant mise en prod.

Aucun code n'est fourni ici volontairement : cette phase est **conception terminée**. La phase suivante est exécution selon 05.
