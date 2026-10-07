# 15 — Backlog Frontend MVP pilote (6 exos, 2 modes, pointeur-seul)

> MVP pilote : ADD, SUB, TAB, SHAPE_2D, TIME, SUITE. Pointeur exclusif en jeu (souris/tap, `tabindex=-1`, clavier ignoré, `inputMode:mouse|touch` envoyé). Clavier autorisé hors jeu (login/OTP/forms). TTS 🔊 inclus. 100% gratuit.
> Convention : `- [ ] FE-X.Y`. Chaque story liste ses **endpoints requis** par **Création / Lecture / Modification / Suppression** (ressource + usage, chemins exacts en 08/08b — le front ne les invente jamais). Tout exemple copiable.

## FE-EPIC-1 — Fondations web + design system pointeur

- [ ] **FE-1.1 Scaffold app + API client + stores + routing**
  Objectif : app démarrable, routée, connectée API/WS, offline-aware.
  Faire : Vite React TS + Router (`/login,/otp,/register,/family,/,/play,/ranking/:code,/profile,/settings,/help`), client API (baseURL ENV, access 15min mémoire, refresh auto, retry 1× 401, request-id, messages FR), stores Zustand (`authStore` user/providers/guest/devices, `exerciseStore` arcade, `trainingStore` blocs, `syncStore` file offline + `sessions/active`), Socket.io client (`/ranking`, rooms par exo, fallback polling 15s).
  Endpoints requis — Lecture : santé API ; Lecture : exercices (grille) ; Lecture : profil courant (rehydratation).
  Acceptation : Given app lancée When API down Then banner `Hors ligne` + file locale ; When 401 Then refresh puis retry ; When refresh expiré Then `/login` + retour après login.
  DoD : `dev/build/lint/typecheck` verts, ENV documentés, 0 secret en bundle.

- [ ] **FE-1.2 Design system pointeur + Storybook + thèmes**
  Objectif : composants 04 implémentés une fois, réutilisés partout.
  Faire : `Button` (≥160×64, hover scale, active .98, focus-visible hors jeu), `AnswerCard` (≥160×80/96 visuel, `onClick+onPointerUp`, verrou 400ms, `tabindex=-1` en jeu, bounce/shake), `TimerRing` (arcade vert→rouge strict, training gris-bleu indicatif), `LevelProgress`, `Confetti` (arcade seul, reduced-motion OFF), `ReadAloud` (🔊 ≥56px, 1 réécoute arcade chrono-continu / illimité training, cache MP3 + Web Speech fallback), `ClockFace`, `FractionBar` (v1.1, stub), `PatternRow`, `GridBoard` (v1.1 stub), `Statement` (≤140 chars + TTS), `OtpBoxes` (6 cases + pavé tactile + collage), `PhoneInput` (picker pays E.164), thèmes (default/nuit/doux/contraste), tons FR (`Presque !`, jamais `Faux`).
  Endpoints requis — Lecture : manifeste TTS par exo (audioSrc) ; Lecture : help par exo.
  Acceptation : Storybook 4 thèmes × 3 breakpoints ; test clavier en jeu sans effet (1-4/Entrée/Tab ignorés) ; cibles mesurées ≥ seuils ; reduced-motion coupe confetti/bounce.
  DoD : stories + snapshots Chromatic + audit axe hors jeu 0 bloquant.

- [ ] **FE-1.3 Layout + erreurs + sauvegarde locale visible**
  Objectif : coquille robuste + état sync compris par enfant.
  Faire : `Layout` (header 56px pseudo/avatar/mode 🛠️/🏆, footer Profil/Classements), `ErrorBoundary` + toast FR + retry (jamais page blanche), skeleton <200ms, banner `Hors ligne`/`Non sauvegardé ☁️❌ [Sauvegarder]` (guest), `syncStore` (localStorage `ludo:v1` après chaque réponse + IndexedDB assets/historique 10 blocs + migration).
  Endpoints requis — Lecture : sessions actives (reprise) ; Modification : sync progress (merge).
  Acceptation : Given offline When réponse Then persistée locale + pastille ; When online Then resync auto + toast ; Given guest Then bandeau sauvegarde visible.
  DoD : tests offline/resync + migration v0→v1.

## FE-EPIC-2 — Auth UI (4 providers + invité + famille)

- [ ] **FE-2.1 Écran login + routing protégé**
  Objectif : entrée <2 min, choix clair, reprise après login.
  Faire : `/login` 4 gros boutons pointeur `[G Google][Apple][✉️ Email][💬 Téléphone/WhatsApp]` + `[Jouer sans compte ⏩]` + mentions âge/parent/CGU ; `<PrivateRoute>` ( arcade/training/ranking/profile), retour profond après auth ; boutons OAuth officiels + loader `Vérification…`.
  Endpoints requis — Lecture : URL OAuth par provider (création de l'intention) ; Création : session OAuth (callback) ; Création : session invité ; Lecture : profil courant.
  Acceptation : Given non connecté When `/play` Then `/login?next=/play` puis retour ; Given provider KO Then message FR + alternatives ; Given invité Then accès jeu + bandeau.
  DoD : E2E 5 entrées + deep-link.

- [ ] **FE-2.2 Email OTP + password + magic link**
  Objectif : enfant sans Google/téléphone joue, parent peut mettre un mot de passe.
  Faire : `/otp-email` (champ + `[Envoyer le code]`, messages génériques anti-énumération), 6 cases + pavé tactile + collage + timer resend 60s + lien magique (deep-link one-shot), `/register` (pseudo 3-16 + password ≥8+chiffre pour parents) + forgot/reset via OTP.
  Endpoints requis — Création : envoi code email ; Création : vérification code (création/liaison session) ; Création : register/login password ; Modification : reset password via OTP.
  Acceptation : Given email inconnu/register Then mêmes 200 génériques ; When code expiré/6e essai/resend précoce Then messages FR exacts (08b) ; When collage code Then auto-rempli.
  DoD : E2E register+login+reset + tests limites.

- [ ] **FE-2.3 Téléphone/WhatsApp OTP + fallback SMS**
  Objectif : parent/enseignant sans email sous la main.
  Faire : `PhoneInput` (drapeau + E.164 + exemple), `[Envoyer]` → `{channel:whatsapp|sms,expiresIn,resendIn}`, 6 cases, `[Renvoyer]`, `[Recevoir par SMS au lieu de WhatsApp]`, `[Changer de numéro]`, numéro masqué affiché.
  Endpoints requis — Création : envoi code téléphone (choix canal) ; Création : vérification code ; Lecture : état resend.
  Acceptation : Given numéro invalide Then `PHONE_INVALID` FR ; When WhatsApp non distribué Then proposition SMS même code ; When cooldown Then compteur + bouton désactivé.
  DoD : E2E mocks WhatsApp→SMS + limites 5/h.

- [ ] **FE-2.4 OAuth callbacks + identités + devices + famille + upgrade**
  Objectif : multi-provider sans doublon, appareils gérables, enfants protégés, guest convertible.
  Faire : pages callback (loader + erreur + retry), `/settings/connexions` (liste providers + `[Lier Google/Apple]` + `[Retirer]` avec garde dernier-moyen + fusion proposée si conflit), `/settings/appareils` (liste + révoquer), `/family` (parent crée profil enfant pseudo+année, consentement horodaté, QR/code 10min pour appareil partagé, `rankingPublic` toggle, progression par enfant, export/suppression par enfant), upgrade guest (`[Sauvegarder]` → choix provider → merge conservant xp/sessions, bandeau disparaît).
  Endpoints requis — Création : liaison provider ; Lecture : identités + appareils + enfants ; Modification : toggle rankingPublic, pseudo/avatar ; Suppression : unlink provider (sauf dernier), révocation device, suppression compte/enfant ; Création : enfant + consentement ; Création : upgrade invité.
  Acceptation : Given conflit email Then 409 + proposition fusion ; Given unlink dernier Then refus FR ; Given guest upgrade Then answers/xp identiques avant/après ; Given enfant Then exclu Top public + visible parent.
  DoD : E2E link/unlink/devices/famille/upgrade + tests garde.

## FE-EPIC-3 — Sélection mode/exo/niveau + aide

- [ ] **FE-3.1 Sélecteur mode obligatoire + reprise**
  Objectif : jamais de partie sans mode explicite.
  Faire : écran `Que veux-tu faire ?` 2 cartes pointeur (🛠️ libre/infini vs 🏆 L1→L15/chrono/classé) + `Dernier : 🛠️ ADD Niv 7 [Reprendre]` (depuis sessions actives), présélection dernier mode, badge mode persistant en jeu.
  Endpoints requis — Lecture : sessions actives (reprise) ; Lecture : exercices (noms).
  Acceptation : Given entrée `/play` sans mode Then sélecteur bloquant ; Given reprise Then 1 tap reprend ; Given changement mode en cours Then confirm abandon + nouvelle session.
  DoD : E2E sélecteur + reprise.

- [ ] **FE-3.2 Accueil 6 pilotes + état sauvegarde**
  Objectif : choisir vite, voir où on en est.
  Faire : grille 5 familles (6 pilotes visibles, 20 `Bientôt` grisés v1.1), cartes 280×200 (couleur famille, best arcade, training Q, streak), filtre/recherche pointeur, CTA `[Classements] [Mon Profil]`, pastille offline/invité.
  Endpoints requis — Lecture : exercices (6 actifs + progress) ; Lecture : progress/stats (best, training) ; Lecture : sessions actives.
  Acceptation : Given 20 inactifs Then grisés + `Bientôt` (pas d'erreur) ; Given offline Then grille cache + pastille ; Given enfant rankingPublic OFF Then pas de rang public affiché.
  DoD : E2E grille + cache + responsive 360px.

- [ ] **FE-3.3 Sélecteur niveau training + aide + TTS consigne**
  Objectif : training libre au bon niveau, sans lire obligatoirement.
  Faire : grille 1-15 pointeur (niveau courant surligné, précision training par niveau, `Prêt pour l'Arcade` si ≥80% 2 blocs), aide hors chrono (tables, mémo 60min, exemples) + `ReadAloud` consigne.
  Endpoints requis — Lecture : détail exercice (levels, timeLimits, help) ; Lecture : progress par exo (précision training/niveau) ; Lecture : manifeste TTS.
  Acceptation : Given niveau hors 1-15 Then refusé ; Given aide en QUESTION Then masquée (hors chrono uniquement) ; Given TTS Then audio + fallback.
  DoD : E2E niveau + aide + TTS.

## FE-EPIC-4 — Arcade 🏆 (6 pilotes, pointeur, chrono strict)

- [ ] **FE-4.1 Boucle arcade + HUD + QuestionView**
  Objectif : 45 Q enchaînées, équitables, rapides.
  Faire : `useArcadeFlow` (L1→15, 3Q/niveau, vies reset/niveau, streak cross-niveaux, verrou 400ms, `inputMode` envoyé, clavier ignoré), HUD `Niveau X/15 ❤❤♡ score` + `TimerRing` strict 10/8/6/5 + `QuestionView` (question 40-64px, 4 cartes, assets SHAPE_2D/TIME/SUITE + aria-label, `ReadAloud` 1 réécoute chrono-continu).
  Endpoints requis — Création : session arcade ; Lecture : questions par niveau (sans réponses) ; Création : réponse (avec timeMs+inputMode) ; Modification : abandon.
  Acceptation : Given clavier 1-4/Entrée en QUESTION Then sans effet ; Given double-tap <400ms Then 1 seule comptée ; Given `inputMode=keyboard` forcé Then 422 affichée FR ; Given timeout Then incorrect+vies-1+correction.
  DoD : E2E ADD L1-L2 + timeout + anti-macro + perfs INP<150ms.

- [ ] **FE-4.2 Feedbacks + fin/échec niveau + abandon**
  Objectif : comprendre vite, ne jamais frustrer.
  Faire : correct (vert+bounce+`+pts`+pop+confetti discret+⚡ si <50%), incorrect/timeout (rouge+shake+bonne entourée+`Presque ! La réponse est…`+`[Voir l'aide]`+`[Continuer]` pointeur auto 2.5s), fin niveau (fanfare+bonus+`[Niveau suivant ▶]`), échec (vies 0 → `[Réessayer]` nouveau seed même difficulté / `[Quitter]`), abandon (confirm + `maxLevel` sauvé, non classé).
  Endpoints requis — Création : réponse ; Lecture : questions rejouées (nouveau seed) ; Modification : abandon.
  Acceptation : Given 0 vie Then retry même difficulté Q différentes ; Given abandon Then reprise proposée + pas de ranking ; Given reduced-motion Then opacity seule.
  DoD : E2E échec/retry/abandon + snapshots.

- [ ] **FE-4.3 Fin exercice arcade + rang + récompenses**
  Objectif : célébrer + donner envie de rejouer/progresser.
  Faire : écran `🏆 TERMINÉ` (score, temps, précision, `Rang #247 +12`, récompenses badges/XP/avatar) + `[Rejouer][Classement][Accueil]`, toast badges, fanfare `tada` (coupable si Off).
  Endpoints requis — Création : complétion arcade (score recalculé serveur) ; Lecture : rang/moi + badges gagnés ; Lecture : progress mis à jour.
  Acceptation : Given 15/15 Then `completed` + upsert ranking <2s visible ; Given score trafiqué (test) Then rejet + log ; Given assisted Then mention non-Top.
  DoD : E2E 15/15 (seed fixture courte en test) + ranking.

## FE-EPIC-5 — Training 🛠️ infini + passage arcade

- [ ] **FE-5.1 Boucle training + HUD ♾️ + pause + changements**
  Objectif : pratiquer sans pression, changer à tout moment entre blocs.
  Faire : `useTrainingFlow` (niveau choisi, `blockIndex++`, seed nouveau/bloc, compteurs cumulés, pas de vies, timer gris-bleu indicatif + `Prends ton temps`, pause manuelle, `ReadAloud` illimité, changements niveau/exo entre blocs + menu ⋯ en QUESTION avec confirm sans pénalité).
  Endpoints requis — Création : session training (avec niveau) ; Lecture : questions par niveau+bloc ; Création : réponse training (sans contrainte temps) ; Modification : changement niveau (entre blocs).
  Acceptation : Given changement en QUESTION Then refusé `BLOCK_IN_PROGRESS` + guidage ; Given pause Then timer figé + reprise ; Given blocs 0→1 même niveau Then Q différentes même difficulté.
  DoD : E2E 3 blocs + changement + pause.

- [ ] **FE-5.2 Fins training + passage arcade pré-rempli**
  Objectif : finir proprement ou basculer motivé.
  Faire : fin bloc (récap calme + 5 CTA `[Continuer ♾️][Niveau][Exo][🏆 Arcade][Arrêter]`), fin session (18Q/83%/temps/score 🛠️/XP réduit/badges training/conseil `Revoir l'aide` + `[🔁 Continuer][🏆 Passer en arcade][Niveau][Exo][Accueil]`), passage arcade = nouvelle session arcade L1 + rappel `Training Niv 7 : 83%` (+ badge `Prêt` si ≥80% 2 blocs).
  Endpoints requis — Création : arrêt training (stats+XP) ; Création : session arcade (depuis training) ; Lecture : badges ; Modification : sync.
  Acceptation : Given stop Then jamais de ranking créé ; Given passage arcade Then L1 + objectif N affiché ; Given 80% 2 blocs Then CTA + badge `Prêt`.
  DoD : E2E stop + passage + badges training.

## FE-EPIC-6 — Ranking + profil + sauvegarde visibles

- [ ] **FE-6.1 Ranking arcade temps réel + signalement**
  Objectif : compétition saine, live <2s, sans harcèlement.
  Faire : `/ranking/:code` (Top100 + `Moi ±3`, périodes Semaine/Mois/Tout temps, pastille `● direct`, highlight slide, toast `Tu passes #246 !`, fallback polling 15s si WS KO, `[Signaler ce pseudo]` 1 tap + confirm).
  Endpoints requis — Lecture : ranking top + curseur ; Lecture : mon rang + autour ; Lecture : historique périodes ; Création : signalement ; Lecture temps réel : subscribe/update/you-moved/celebrated.
  Acceptation : Given sans session Then `me:null` + CTA jouer ; Given enfant rankingPublic OFF Then exclu Top + visible perso/parent ; Given WS KO Then polling sans régression ; Given Top10 Then `celebrated` anti-spam.
  DoD : E2E ranking + live + périodes + signalement + perfs.

- [ ] **FE-6.2 Profil 2 volets + badges + appareils + export/suppression + famille**
  Objectif : tout l'historique + contrôle données au même endroit.
  Faire : `/profile` (XP/niveau, 2 volets arcade/training par exo, graphiques score/précision, 39 badges + dates, training levels pratiqués), `/settings` (thème, son, contraste/dyslexie/reduced-motion, connexions providers + lier/retirer, appareils + révoquer, `rankingPublic`, `[Exporter JSON]` + `[Supprimer]` avec vérification, famille parent/enfants + progression par enfant).
  Endpoints requis — Lecture : profil, progress, stats, badges, identités, appareils, enfants ; Modification : profil/préférences, rankingPublic, consentement ; Création : export ; Suppression : unlink, device, compte/enfant ; Modification : sync.
  Acceptation : Given training seul Then best arcade intact + stats 🛠️/🏆 séparées ; Given unlink dernier Then refus FR ; Given export Then JSON complet <5s ; Given delete Then logout + ranking retiré ≤60s.
  DoD : E2E profil/settings/famille/export/delete + RGPD.

## FE-EPIC-7 — PWA/offline + qualité launch

- [ ] **FE-7.1 Offline-first + resync + PWA + tests/launch**
  Objectif : jouer partout, resync sans perte, lancer serein et gratuit.
  Faire : manifest PWA + icons + service worker (assets/TTS/questions cache, file answers persistée), resync auto + conflits (`serveur gagne arcade`, merge training, toast explicite), quotas gratuits visibles (debug), Lighthouse CI (>90 perf, >95 a11y hors jeu), k6 front (ranking polling), E2E 10 scénarios (auth 4 + invité, arcade 15/15 fixture, training infini+stop, offline→resync, pointeur-seul, TTS, contraste, 360px), landing `/` + `/help` + SEO/meta, feature flags (`pilote6,providers,tts,ranking`) + kill-switch UI.
  Endpoints requis — Lecture : sessions actives, manifests, flags ; Modification : sync ; Création : réponses en file.
  Acceptation : Given offline complet Then training 100% + arcade avec resync avant dimanche pour ranking ; Given flag provider OFF Then bouton masqué + message ; Given Lighthouse Then budgets respectés.
  DoD : checklist 05 go/no-go cochée + runbook + monitoring 48h.
