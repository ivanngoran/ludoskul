---
description: "Use when working on React Vite Tailwind UI, Zustand stores, arcade/training flows, QuestionView pointeur-seul, TimerRing, TTS ReadAloud, ranking live, offline sync, themes. Frontend Ludoskul."
applyTo:
  - "apps/web/**/*"
  - "packages/ui/**/*"
---
# Frontend — React + Vite (Ludoskul)

## Stack et structure
- React 18 + TS 5 strict + Vite 5 + Tailwind 3 + Zustand 4 + React Query 5 + Framer Motion 11 + Socket.io client 4. Code-split par route, `QuestionView` lazy <50KB, JS initial <200KB gzip.
- Routes : `/login,/otp,/register,/family,/,/play,/ranking/:code,/profile,/settings,/help`. Stores : `authStore` (user/providers/guest/devices), `exerciseStore` (arcade), `trainingStore` (blocs), `syncStore` (file offline + `sessions/active`). Voir [03-architecture](../../docs/03-architecture-technique.md).
- Design system `packages/ui` + Storybook : `Button, AnswerCard, TimerRing, LevelProgress, Confetti, ReadAloud, ClockFace, PatternRow, OtpBoxes, PhoneInput`. Stories 4 thèmes × 3 breakpoints + snapshots Chromatic. Voir [04-design](../../docs/04-design-ui-ux.md).

## Règle pointeur-seul en jeu (bloquante)
- En QUESTION + feedback : clic/tap uniquement (`onClick+onPointerUp`), cartes `tabindex=-1`, touches 1-4/A-D/Entrée/Espace/Tab ignorées, verrou anti-double-tap 400ms, `inputMode: mouse|touch` envoyé (`keyboard` → 422 attendue). Cibles ≥96px visuel (≥48px min WCAG), question 40-64px, hover scale 1.02 desktop.
- Clavier requis hors jeu (login/OTP/forms/menus/profil) avec focus ring épais et Tab order logique. Lecteur d'écran en jeu informatif seulement (`role=img` + `aria-label`, `aria-live=polite`), pas opérant. Voir [10-§1](../../docs/10-qualite-accessibilite-securite.md).
- Test obligatoire : touches en jeu sans effet, E2E souris seule ADD L1-L2, tactile 360px.

## Boucles arcade / training (voir 07)
- Sélecteur mode obligatoire avant partie : `[🛠️ Entraînement]` vs `[🏆 Arcade]` + reprise `Dernier : … [Reprendre]` depuis `GET sessions/active`. Changement mode en cours = confirm abandon + nouvelle session.
- Arcade : `useArcadeFlow` L1→15, 3Q/niveau, 3 vies reset/niveau, streak cross-niveaux, HUD `Niveau X/15 ❤ score`, `TimerRing` strict 10/8/6/5 vert→rouge, timeout = incorrect + -1 vie. Échec → `[Réessayer]` nouveau seed même difficulté / `[Quitter]`. Fin 15/15 → `POST complete` + écran `🏆 TERMINÉ` (score/temps/précision/rang/badges).
- Training : `useTrainingFlow` niveau libre 1-15, blocs de 3 `blockIndex++` seed nouveau/bloc, compteurs cumulés, pas de vies, timer gris-bleu indicatif + `Prends ton temps`, pause autorisée, changements niveau/exo entre blocs uniquement (sinon 409 `BLOCK_IN_PROGRESS` + guidage). Fin bloc : 5 CTA `[Continuer ♾️][Niveau][Exo][🏆 Arcade][Arrêter]` ; fin session `POST stop` jamais classée. Passage arcade = nouvelle session L1 + rappel `Training Niv 7 : 83%`.
- Feedbacks : correct vert+bounce+`+pts`+⚡ si <50% temps ; incorrect rouge+shake+bonne entourée+`Presque ! La réponse est…`+`[Voir l'aide]`+`[Continuer]` (auto 2.5s arcade, manuel si incorrect training). `reduced-motion` : opacity seule, 0 confetti. Tons FR via `fr.json`, jamais `Faux`.

## TTS, assets, offline
- `ReadAloud` 🔊 ≥56px : MP3 pré-générés + cache 1 an + fallback Web Speech. Arcade 1 réécoute max chrono-continu (bouton désactivé après), training illimité. Manifeste `GET exercises/:code/tts`. SVG inline <5KB avec `aria-label`, énoncés SUITE/TIME ≤140 chars.
- Offline : `localStorage ludo:v1` après chaque réponse + IndexedDB assets/historique 10 blocs + migration v0→v1, banner `Hors ligne` / `Non sauvegardé ☁️❌ [Sauvegarder]` (guest), resync auto + toast. Socket.io `/ranking` rooms `exercise:CODE`, fallback polling 15s.
- API client : baseURL ENV (`VITE_API_URL, VITE_WS_URL`), access 15min mémoire JS (pas localStorage), refresh auto + retry 1× sur 401, request-id, messages FR (`429` → `Doucement !…`). Types générés depuis `openapi.json` (`openapi-typescript`), 0 type API manuel. 0 secret en bundle.
