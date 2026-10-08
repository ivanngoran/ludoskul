# 13 — Décisions (tranchées le 2026-09-17, version 2026-09-28, fait foi pour A-D)

## A. Périmètre MVP — TRANCHÉ : A1 Pilote 6 exos

- MVP : ADD, SUB, TAB, SHAPE_2D, TIME, SUITE + 2 modes + auth complète + ranking. 06/06b = catalogue complet prêt (26), implémenté en v1.1 au rythme 1-2 exos/semaine, même moteur. 05 re-chiffré en ce sens.

## B. Rôles — TRANCHÉ : B1 Parent simple MVP

- MVP = profils enfants + progression/export/suppression parent. Classe/enseignant = v2 (code classe, assignation, dashboard).

## C. Non-lecteurs — TRANCHÉ : C1 Bouton TTS 🔊 MVP

- `ReadAloud` pointeur par question + consignes. Règle : training = audio libre (timer indicatif) ; arcade = audio autorisé mais **chrono continue** (équité, voir 07). Cache MP3 + fallback Web Speech. **Arcade : 1 réécoute max imposée côté front (bouton désactivé après), compteur serveur observabilité uniquement.** Spécifié en 04/07/10.

## D. Modèle économique — TRANCHÉ : D2 100% gratuit

- MVP et v1.x **100% gratuits, zéro pub enfants (non négociable)**. Garde-fous coûts : OTP WhatsApp d'abord + quotas (5/h/numéro), assets SVG légers, Redis cache, Plausible ou rien. Pas de paywall, pas d'offre établissement. Si coûts dérivent : quotas OTP renforcés + PWA offline-first (voir 11).

## E. Contenu pédagogique — qui garantit l'exactitude ?

- `OUVERT` : relecture Éducation Nationale (cycles 2/3/4, compétences ex `chercher, calculer, représenter`) par enseignant référent avant launch. `RECOMMANDÉ` : 1 référent + grille de validation par exo (06/06b + 1 ligne = 1 cas test + 1 validation péda). Sans ça, risque erreurs (fractions, conversions).

## F. Notifications et rappels

- `OUVERT` : **F1 (RECOMMANDÉ)** MVP = aucune notification push/marketing. Rappels = in-app uniquement (streak, défi). Email/WhatsApp = transactionnel OTP + sécurité uniquement. Push/PWA = v1.2 avec opt-in parental explicite.

## G. Analytics produit (sans tracker pub)

- `OUVERT` : **G1 (RECOMMANDÉ)** Plausible EU auto-hébergé ou rien en MVP + événements propres (`session_start:mode`, `level_complete`, `training_stop`, `auth_provider`, `sync_conflict`). Funnel inscription→1er exo→J7, rétention, précision par exo. Pas de GA/Meta SDK.

## H. Navigateurs / appareils / offline

- `TRANCHÉ` partiel : responsive 360px+, PWA v1.1, offline file training + arcade sync.
- `OUVERT` : liste support opposable (ex Chrome/Edge/Safari/Firefox N-2, Android 10+, iOS 16+), tablettes école (souvent anciennes) : seuil perf mémoire ? `RECOMMANDÉ` : ajouter matrice support en 10-§4.

## I. Marque, domaine, assets, voix

- `OUVERT` : nom `Ludoskul` définitif ? Domaine (`ludoskul.app` dispo ?), logo/mascottes (renard/caméléon : qui dessine, licence ?), sons (libres ?), voix TTS vs studio. Bloque landing + PWA manifest + mails OTP (nom expéditeur).

## J. Gouvernance et repo

- `OUVERT` : privé vs open source (quelle licence ? MIT/AGPL ?), contributions externes, Particle — `RECOMMANDÉ` : privé MVP, ouverture packages `shared/generators` en MIT en v1.1 (qualité communauté sans exposer auth/ranking).

## K. Sécurité enfants temps d'écran

- `OUVERT` : verrou parental (durée/jour, couvre-feu), rappel pause toutes les 20 min ? `RECOMMANDÉ` : rappel doux v1.1, pas de blocage MVP (hors périmètre, note en 10).

## L. Stack backend — TRANCHÉ : L1 Fastify 5 (2026-10-08, BE-1.4)

- Passage Fastify 4 → 5 imposé par l'audit sécu : Fastify 4 (<5.12.2) = 5 vulnérabilités high (bypass validation/auth, GHSA-jx2c-rxcm-jvmq, GHSA-667r-xxjv-c9mm, GHSA-p68q-wchp-6fh7, GHSA-hwr6-493r-vm6h, GHSA-c96f-x56v-gq3h). Après migration : 0 high/critical sur `fastify` et ses plugins (`@fastify/cors 11`, `helmet 13`, `rate-limit 11`, `swagger 9`, `swagger-ui 6`).
- Changement code minimal : typage `setErrorHandler((err: FastifyError, ...))` (Fastify 5 type `err: unknown` par défaut). Contrats 08/08b inchangés, `openapi:check` vert.
- Reste hors prod (dev-only, non bloquant) : `tinypool` via `vitest 3` (2 critical) + `braces` via `tailwindcss 3/chokidar` (1 high, sans patch). Audit prod (`pnpm audit --prod`) = 0 high/critical. Montée `vitest 4` / `tailwindcss 4` reportée en v1.1 (risque régression).

## Prochaine étape (version 2026-09-28 : A-D tranchées le 2026-09-17, E-K appliquées le 2026-09-24)

- A-D : voir §A-D ci-dessus (pilote 6, parent simple, TTS, 100 % gratuit).
- E (validation péda) → appliqué en `18-§4` (grille + sign-off référent).
- F (zéro push) → appliqué en `21` (transactionnel seul) + `22-§5`.
- G (analytics) → appliqué en `23-§3` (Plausible-ou-rien + events).
- H (navigateurs) → appliqué en `19-§4` (matrice opposable).
- I (marque) → appliqué en `22-§1` (à figer : nom, domaine, licences).
- J (repo) → appliqué en `19-§1` (privé MVP).
- K (temps d'écran) → appliqué en `22-§3` (conseil + rappel doux v1.1, pas de blocage).
