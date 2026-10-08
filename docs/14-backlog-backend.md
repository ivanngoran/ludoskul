# 14 — Backlog Backend MVP pilote (6 exos, 2 modes, auth complète)

> MVP pilote : ADD, SUB, TAB, SHAPE_2D, TIME, SUITE. Catalogue 26 prêt (06/06b), 20 restants en v1.1. 2 modes 🛠️/🏆, pointeur-seul en jeu, TTS 🔊, 100% gratuit. Refs opposables : 06/06b (génération), 07 (score/XP), 08/08b (contrats), 09 (ranking), 10 (sécu/RGPD).
> Convention : `- [ ] BE-X.Y` = story à cocher. Tout exemple est copiable. Tout endpoint nouveau doit apparaître dans 08/08b (mettre à jour si écart trouvé en §16).

## BE-EPIC-1 — Fondations API/DB/Docs

- [x] **BE-1.1 Prisma schema + migrations initiales**
      Contexte : socle données 08-§1 + 08b-§3 + 03 (SessionMode, 5 catégories).
      Faire : modèles `User` (+guest,isChild,parentId,rankingPublic,birthYear,email/passwordHash nullables si OIDC/OTP — voir 08-§1), `Identity` (provider,providerSub,emailLower,phoneHash chiffré), `OtpChallenge` (codeHash argon2id,TTL,attempts,resendAt), `Device`, `Family`, `Exercise` (26 lignes seedées : 6 `isActive=true` pilote, 20 `false` v1.1, config JSON extrait 06/06b), `Session` (mode,blockIndex,trainingScore,stopped,assisted,offline,keyboard MVP=false — voir 08-§1 + 10-§1), `Answer` (mode,blockIndex,inputMode mouse|touch en MVP), `Ranking` (arcade-only), `Progress` (2 volets), `Badge` (39 codes opposables 07-§5) + `UserBadge`, `AuthRefresh`, `DeletedPseudo`. IDs `cuid2` partout.
      Validation : unicités `(provider,providerSub)`, emailLower vérifié unique, phoneHash vérifié unique, `(userId,exerciseId,weekStart)` ranking, `(userId,exerciseId)` progress.
      Acceptation : `prisma migrate dev` OK vide→seed ; `prisma validate` ; rollback testé ; 0 donnée PII en clair (numéro chiffré).
      DoD : migration + seed + test cascade delete (user → tout sauf DeletedPseudo 30j).

- [x] **BE-1.2 Fastify app + plugins + santé + config**
      Faire : `app.ts` (cors origine front seule, helmet CSP/HSTS/nosniff, rate-limit global, request-id, logs JSON sans PII, `GET /health` + `/ready` DB/Redis, gestion erreurs `{error:{code,message}}`, Swagger `/api/docs`).
      ENV : `DATABASE_URL, REDIS_URL, JWT_SECRET/REFRESH(≥32), GOOGLE_*, APPLE_*, WHATSAPP_*, SMS_*, FRONT_URL, OTP_*`. Secrets jamais en repo.
      Acceptation : `/health` 200 <50ms ; CORS refuse origine inconnue ; header CSP présent ; log sans email/téléphone/code.
      DoD : README run local + CI verte.

- [x] **BE-1.3 Seed référentiel + badges**
      Faire : seed 26 exos (ordre, icon, color, category CALCUL/NOMBRES/MESURES/GEOMETRIE/LOGIQUE, help) + 39 badges (07-§5 : arcade, training Bosseur/Persévérant/Prêt, Top hebdo, pros, fun). 6 pilotes actifs.
      Acceptation : `GET exercises` retourne 6 actifs + `?includeInactive` 26 ; badges listés 39.
      DoD : script `db:seed` idempotent + test.

- [-] **BE-1.4 CI + OpenAPI + qualité socle**
      Faire : GitHub Actions (lint, typecheck, test, migrate-check, audit 0 high/critical), OpenAPI généré depuis Zod, SBOM mensuel.
      Acceptation : PR bloquée si test rouge ou vulnérabilité high+.
      DoD : badge CI vert + `/api/docs` à jour.
      Réalisé 2026-10-08 : CI avec Postgres 16 de service (`migrate deploy` + `db:seed` + `db:seed:check`), `prisma validate`, `lint` + `typecheck` + `test` + `build`, `openapi:gen/check` vert, audit prod 0 high/critical (`pnpm audit --prod`). Audit global : 3 dev-only restantes (`tinypool` via vitest 3, `braces` via tailwind 3 — v1.1). Stack Fastify 5 (décision 13-L1).
      Rework revue BE-EPIC-01 (2026-10-08) : 500 FR générique + log serveur (10-§2), `/health`+`/ready` hors rate-limit, 429 `RATE_LIMITED` FR, CORS fail-fast prod + `assertProdConfig`, schémas Zod sur 15 routes (0 `Default Response`), `openapi:check` codes+schémas, CI `frozen-lockfile` + `migrate diff --exit-code` + openapi figé, job SBOM mensuel + Dependabot, Dockerfiles `frozen-lockfile`, `/ready` 503 sans DB, cascade RGPD obligatoire en CI, rollback BE-1.1 testé + runbook, `seed-check` synchro shared/seeds + `requires` 6 pros (`POLYVALENT` complété), artefacts Prisma désuivisis + `.gitignore`, README Fastify 5, CSP front `index.html`, `keyboard` → 422 `KEYBOARD_NOT_ALLOWED` + `FST_ERR_VALIDATION` → `VALIDATION_ERROR`. Tests : 33 API + 10 shared verts, lint/typecheck/build/audit prod OK.

## BE-EPIC-2 — Auth multi-provider + mineurs + devices (08b)

- [ ] **BE-2.1 Email OTP code + verify + lien magique (défaut enfants)**
      Faire : `POST email/code {email,purpose}` → toujours 200 générique + crée `OtpChallenge` (code 6, TTL 15min, resend 60s) + envoi (provider mail) ; `POST email/verify {email,code,pseudo?}` → vérifie (5 essais max puis invalidé), crée/lie `User+Identity email` (fusion si emailLower vérifié existant), émet access(15min)+refresh(HttpOnly 7j, Device créé) ; `GET email/magic?token` one-shot idem.
      Règles : normalisation lowercase+trim, anti-énumération stricte, rate 5/h/email + 20/h/IP.
      Acceptation : register inconnu + login connu mêmes réponses 200 ; code expiré → `OTP_EXPIRED` ; 6e essai → `OTP_TOO_MANY_ATTEMPTS` ; resend <60s → `RESEND_TOO_SOON`.
      Tests : TTL, essais, fusion doublon, refresh rotation.

- [ ] **BE-2.2 Email password register/login + reset (parents/enseignants)**
      Faire : `POST register {email,pseudo,password≥8+1chiffre}` (bcrypt12, `EMAIL_TAKEN/PSEUDO_TAKEN/WEAK_PASSWORD`), `POST login {emailOrPseudo,password}` (`INVALID_CREDENTIALS` générique), forgot/reset via OTP email (réutilise BE-2.1, TTL 15min). Partage `Identity email` avec BE-2.1.
      Acceptation : login pseudo ou email OK ; timing-safe ; reset invalide ancien password.
      DoD : tests + audit log sans password.

- [ ] **BE-2.3 OAuth Google + Apple URL/callback/link**
      Faire : `GET oauth/:provider/url` (PKCE S256, state/nonce stockés 10min) ; `GET oauth/:provider/callback?code&state` (échange, vérif id_token JWKS, `email_verified` exigé, Apple relay accepté comme email distinct) → crée/lie (fusion email vérifié) + tokens+Device ; `POST oauth/:provider/link` (Bearer + code) → `ALREADY_LINKED/EMAIL_CONFLICT` (si conflit : propose fusion seulement si email vérifié identique, sinon 409 + `suggestedAction:"use_other_account"`).
      Boutons officiels côté front, jamais de secret côté client.
      Acceptation : mocks OIDC (email non vérifié rejeté) ; relay Apple crée identité séparée ; link doublon → 409 ; unlink dernier moyen refusé (BE-2.6).
      Tests : PKCE, state mismatch, JWKS rotation.

- [ ] **BE-2.4 Téléphone/WhatsApp OTP + fallback SMS**
      Faire : `POST phone/code {phone(E.164),channel:auto|whatsapp|sms}` → normalise (libphonenumber), crée challenge (6 chiffres, TTL 5min, resend 60s), envoie WhatsApp template `Votre code Ludoskul : {{1}}. 5 min.` ; si non distribué 30s ou non-WhatsApp → SMS même code (pas de nouveau code) ; réponse `{sent:true,channel,expiresIn:300,resendIn:60}` générique. `POST phone/verify {phone,code,pseudo?}` → lie/crée + tokens.
      Règles : 5 codes/h/numéro, 5 vérifs/challenge, 20/h/IP ; stockage `phoneHash` unique + E.164 chiffré ; logs hash seul ; coûts : compteur + alerte seuil.
      Acceptation : E.164 invalide → `PHONE_INVALID` ; expiré → `OTP_EXPIRED` ; 6e → verrou ; fallback SMS testé mock ; même code WhatsApp/SMS.
      Tests : cooldown, fusion même numéro, affichage masqué `+33 6 •• •• 42 18`.

- [ ] **BE-2.5 Invité + upgrade sans perte**
      Faire : `POST guest {pseudo}` → `User guest=true` + Device léger (ou offline-first : UUID local, upgrade différé) ; `POST guest/upgrade` (Bearer guest + preuve provider BE-2.1/2.3/2.4) → merge : garde xp/sessions/answers/progress/badges (réassigne userId en transaction), `guest=false`, lie Identity. Bandeau front `Non sauvegardé` tant que guest.
      Acceptation : sessions guest conservées après upgrade (compte answers avant/après identique) ; double upgrade idempotent ; guest supprimable sans cascade lointaine.
      Tests : merge conflit pseudo, offline guest → online upgrade.

- [ ] **BE-2.6 Identities link/unlink + garde dernier moyen**
      Faire : `GET identities` ; `DELETE identities/:provider` → refuse `LAST_AUTH_METHOD` si dernier actif ; `EMAIL_CONFLICT` avec proposition fusion. Audit `lastUsedAt`.
      Acceptation : unlink OAuth quand email+phone restent → 204 ; unlink dernier → 409 + message FR.
      Tests : garde + audit.

- [ ] **BE-2.7 Devices + refresh rotation + logout**
      Faire : refresh rotation à chaque usage (ancien révoqué, détection réutilisation = révocation famille + alerte), `GET devices`, `DELETE devices/:id`, `POST logout` (device courant). Access 15min mémoire front, refresh HttpOnly Lax 7j.
      Acceptation : vol refresh détecté → tous devices révoqués + `TOKEN_EXPIRED` ; liste devices correcte ; logout n'affecte pas autres devices.
      Tests : rotation, replay, multi-device.

- [ ] **BE-2.8 Famille + consentement + rankingPublic**
      Faire : `POST family/children {pseudo,birthYear}` (Bearer parent vérifié) → crée `User isChild,parentId,rankingPublic=false` + `consentAt/consentText=v1` ; `GET family/children` → progression par enfant (arcade+training) ; code/QR famille pour connexion enfant sur appareil partagé (token court 10min, one-shot) ; `PATCH family/children/:id {rankingPublic}` (parent seul, explicite).
      Règles FR 15 ans défaut (08b-§2) : <15 ans exige parent ; pseudos modérés ; jamais email/tél enfant.
      Acceptation : enfant <15 sans parent → `PARENTAL_CONSENT_REQUIRED` ; ranking enfant exclu Top public mais badges OK ; export/suppression par enfant (BE-6.4).
      Tests : consentement, QR expiry, rankingPublic toggle.

- [ ] **BE-2.9 Profil lecture/MAJ/suppression**
      Faire : `GET me` (+guest,rankingPublic,providers,devices,isChild), `PATCH me` (pseudo/avatar/country/theme/accessibility + validation), `DELETE me` (vérification password|OTP|OAuth + purge cascade + DeletedPseudo 30j + libération email/phone immédiate).
      Acceptation : pseudo pris → `PSEUDO_TAKEN` ; delete vérifie second facteur ; export avant delete possible (BE-6.4).
      Tests : cascade + réserve pseudo.

- [ ] **BE-2.10 Fusion confirmée + suppression enfant (patch 16-P1)**
      Contexte : BE-2.3/2.4/2.1 détectent `EMAIL_CONFLICT` (même email vérifié sur 2 Users) ou parent veut retirer un profil enfant. Sans endpoint dédié, le front resterait bloqué en 409.
      Faire : `POST auth/merge/confirm {sourceUserId?, targetEmail, proof:(OTP|OAuth code frais <10min)}` → fusion transactionnelle (garde le User vérifié le plus ancien comme cible, réassigne Identity/Device/Session/Answer/Ranking/Progress/Badges/Family, supprime source, audit) ; `DELETE family/children/:id` (Bearer parent, vérification + confirm, cascade enfant + réserve pseudo 30j, ranking enfant retiré ≤60s).
      Règles : fusion seulement si email/phone **vérifié identique** des 2 côtés (sinon 409 + `suggestedAction`), jamais auto ; enfant : parent seul ; export proposé avant (BE-6.4).
      Acceptation : Given conflit vérifié When confirm avec preuve fraîche Then 1 seul User + 0 perte (compter answers/xp avant/après) ; Given preuve expirée Then 422 ; Given delete enfant Then exclu Top + parent voit `Supprimé` 30j (pseudo réservé).
      Tests : fusion idempotente, double-confirm sans doublon, delete enfant + réserve + ranking.

## BE-EPIC-3 — Exercices + générateurs pilote + TTS

- [ ] **BE-3.1 Catalogue lecture (6 actifs + 20 inactifs)**
      Faire : `GET exercises` (6 pilotes + champs `bestScoreArcade,trainingQuestions`), `GET exercises/:code` (levels 15, questionsPerLevel 3, modes, timeLimits + `training:indicatif`, help formules/tables/conversions). `?includeInactive=1` (admin/test) retourne 26.
      Acceptation : codes pilotes exacts ADD,SUB,TAB,SHAPE_2D,TIME,SUITE ; help hors chrono ; 404 code inconnu.
      Tests : contrat + ordre affichage.

- [ ] **BE-3.2 Générateurs déterministes 6 pilotes + distracteurs**
      Faire : `generateQuestions(code,level,seed)` : ADD/SUB (plages 06, SUB a≥b), TAB (tables 06), SHAPE_2D (pool/rotations + anti-hasard position), TIME (horloges valides 0-59, conversions), SUITE (+1/+2/motifs ABAB/-1/+5/×2…). Distracteurs 06/06b (numériques ±1/±2/±10/inversion, confusables formes, 1h30 vs 1h03, jamais négatif — voir 06 règle 4). Unicité intra-bloc/session, jamais réponse dupliquée.
      Seeds : arcade `sha(session:code:niveau)`, training `sha(session:code:niveau:bloc)`.
      Acceptation : 100 seeds/niveau → 0 doublon intra-bloc, 100% plages, TIME minutes valides, SUITE réponses exactes, QCM 4 uniques.
      Tests : property-based + fixtures seed fixe byte-identiques.

- [ ] **BE-3.3 Aides hors chrono**
      Faire : contenus help par pilote (tables TAB, mémo 60min/1h TIME, exemple suite, formes légendées) servis par BE-3.1, jamais pendant QUESTION (front les cache).
      Acceptation : help présent 6/6, FR simple, ≤140 chars énoncés SUITE/TIME complexes.
      Tests : présence + longueur.

- [ ] **BE-3.4 Manifeste TTS + cache**
      Faire : `GET exercises/:code/tts?level=&index=` → `{audioSrc:/audio/…mp3, fallbackTTS:true}` + headers cache 1 an + voix pré-générées consignes fixes ; fallback Web Speech flag front. 1 réécoute arcade (compteur serveur non bloquant, indicatif), illimité training.
      Acceptation : 6 pilotes ont manifestes ; 404 → fallback ; cache OK.
      Tests : manifest + headers.

## BE-EPIC-4 — Sessions 2 modes + scoring serveur

- [ ] **BE-4.1 Création sessions + changement niveau training**
      Faire : `POST sessions {exerciseCode(pilote),mode:ARCADE}` → `{sessionId,seedBase,startLevel:1|reprise}` (409 si active même exo/mode + proposition reprendre/abandonner) ; `POST sessions {exerciseCode,mode:TRAINING,level:1-15}` → `{blockIndex:0}` ; `POST sessions/:id/training-level {level}` (entre blocs uniquement, sinon 409 `BLOCK_IN_PROGRESS`).
      Règles : 1 active/exo/mode/user ; changement mode = nouvelle session.
      Acceptation : double création → 409 + `activeSessionId` ; training-level hors 1-15 → 400 ; changement mode converti jamais.
      Tests : conflits + reprise.

- [ ] **BE-4.2 Distribution questions (sans réponses)**
      Faire : arcade `GET sessions/:id/questions?level=N` → `{mode,timeLimit(10/8/6/5),seed,lives,questions[3:{index,hash,prompt,options[4],asset}]}` ; training `?level&block` → `{indicative:true,blockIndex,seed,…}`. `hash=sha(seed+index+prompt)`. Jamais `answer`.
      Acceptation : même seed → mêmes 3 Q ; blocs successifs même niveau → Q différentes ; position bonne réponse uniformisée (anti-hasard) ; asset SHAPE_2D/TIME présent + aria-label.
      Tests : déterminisme + unicité + contrat.

- [ ] **BE-4.3 Validation réponses + anti-macro pointeur**
      Faire : `POST sessions/:id/answers {level,blockIndex?,index,questionHash,chosen,timeMs,inputMode:mouse|touch}` → vérifie hash + existence bloc ; arcade : `timeMs≤limite+1000` sinon 422, `inputMode=keyboard` → 422 `KEYBOARD_NOT_ALLOWED`, recalcule `points` formule 07 (base×mult+vitesse+série), met à jour streak/lives/score ; training : vérifie hash seul (temps stocké stats), `trainingPoints/5`, `tip` 1 ligne + `streakLocal`, jamais de vies.
      Acceptation : hash faux → 422 ; temps arcade dépassé → 422 ; keyboard → 422 ; double submit même index → 2e ignorée (idempotence) ; training temps long accepté.
      Tests : recalcul vs soumis, idempotence, inputMode.

- [ ] **BE-4.4 Fin arcade (complete) / training (stop) / abandon**
      Faire : `POST sessions/:id/complete {assisted:false}` (arcade, 15 niveaux réussis requis sinon 409) → recalcule depuis Answers (rejet si écart), score+bonus 07, `xpGained=floor/10`, badges (BE-6.2), upsert Ranking (BE-5.1), `{score,correct/45,accuracy,timeSpent,xpGained,badges,ranking:{weekRank}}` ; `POST sessions/:id/stop` (training) → `{questions,accuracy,trainingScore,xpGained=min(/50,200/j/exo),badges training}` jamais ranking ; `POST sessions/:id/abandon` (arcade) → `{maxLevel,saved:true}` non classé.
      Acceptation : complete incomplet → 409 ; score trafiqué → invalidé + log ; stop training ne crée pas ranking ; assisted → hors Top (marqué).
      Tests : recalcul complet, caps XP, assisted.

- [ ] **BE-4.5 Reprise + multi-device + offline**
      Faire : `GET sessions/active` → session reprenable (arcade : même seed niveau, vies reset ; training : nouveau seed même niveau) ; conflit multi-device arcade → 409 + event `session:superseded` (WS si online) ; file offline acceptée (`offline:true`, Answers horodatées) + `PUT progress/sync` merge (BE-4.6).
      Acceptation : reprise après refresh conserve maxLevel/bloc ; 2 onglets arcade → 2e voit 409 + CTA reprendre/abandonner.
      Tests : reprise + conflit + offline resync avant dimanche ranking.

- [ ] **BE-4.6 Sync sauvegarde idempotent**
      Faire : `PUT progress/sync {clientProgress,clientPrefs,at}` → arcade scores : serveur gagne ; training compteurs/prefs : merge max/union par `updatedAt` ; réponse `{merged,conflicts:[…]}`. Version `ludo:v1` + migration.
      Acceptation : rejouer même payload → même état (idempotent) ; conflit arcade → serveur conservé + signalé ; training additionne sans double-compte (clé answer hash).
      Tests : idempotence + conflits + migration v0→v1.

## BE-EPIC-5 — Ranking arcade temps réel + anti-triche

- [ ] **BE-5.1 Upsert ranking + Redis**
      Faire : à chaque complete arcade éligible (`completed,assisted=false`) : upsert `(userId,exerciseId,weekStart lundi UTC)` meilleur score + `ZADD exercise:{code}:{week} (score×1e6−time)` + publish. Training/stopped/abandon n'écrivent jamais.
      Acceptation : 2 completes même semaine → meilleur conservé ; assisted → ignoré ; Redis/Postgres cohérents (job réconciliation).
      Tests : upsert + tri + semaine lundi UTC.

- [ ] **BE-5.2 Lecture ranking (Top + moi + périodes + archive) (patch 16-P2)**
      Faire : `GET ranking/:code?period=week|month|all&limit≤100&cursor` → Top Redis hydrate Postgres (cache 5s) + `me{rank,score,delta}` ; `GET ranking/:code/me` → `around ±3` ; month = meilleur hebdo mois, all = bestScoreArcade ; **archive : `GET ranking/:code?weekStart=YYYY-MM-DD(lundi)` → Top figé N-1 (même tri/curseur, lecture seule)** ; Enfant `rankingPublic=false` → exclu Top public (visible perso + parent).
      Acceptation : curseur stable (score,time,userId) ; sans session → `me:null` + CTA ; archive N-1 identique au figé cron ; p95 <150ms.
      Tests : pagination + périodes + archive + exclusion enfant + perfs k6.

- [ ] **BE-5.3 WebSocket ranking**
      Faire : namespace `/ranking` auth accessToken, rooms `exercise:CODE`, `ranking:subscribe/unsubscribe`, events `ranking:update` (throttle 1/s/room, ≤30KB), `you-moved`, `session:celebrated` (top10, anti-spam). Fallback polling 15s documenté front.
      Acceptation : complete → update <2s ; 10k/room sans dégradation (rooms shardées) ; disconnect/reconnect propre.
      Tests : charge + throttle + auth expirée.

- [ ] **BE-5.4 Cron hebdo + archives + badges Top**
      Faire : lundi 00:00 UTC : fige `rank` N-1 (archivé `?period` historique), crée semaine N, attribue badges Top100/10/#1 (BE-6.2), purge `DeletedPseudo>30j`, alertes. Idempotent + lock.
      Acceptation : double run même semaine → inchangé ; archive consultable ; badges Top attribués une fois.
      Tests : cron + idempotence + fuseau UTC.

- [ ] **BE-5.5 Anti-triche + modération**
      Faire : 5 couches 09-§4 (contrats, recalcul, heuristiques `moy<600ms & >95%` / `45/45<60s` / `>20 sessions/h`, rate+1 active, signalement 1 clic → revue <48h, sanctions graduées, jamais ban auto enfant : `Score en vérification`). `POST ranking/:code/report {userId,reason}` + audit log 1 an.
      Acceptation : bot simulé flaggé review (pas ban) ; score recalculé écart → session invalidée ; report abuse-rate-limited.
      Tests : heuristiques + sanctions + RGPD log.

## BE-EPIC-6 — Progress/stats/badges/XP/export

- [ ] **BE-6.1 Progress + stats 2 volets**
      Faire : agrégats `bestScoreArcade/bestAccuracy/maxLevelArcade/totalSessionsArcade + trainingQuestions/trainingAccuracy/levelsPracticed/lastPlayed/lastTrainingAt` ; `GET progress`, `GET progress/:code`, `GET stats {totals:{sessionsArcade,questionsTraining,xp,avgArcade,avgTraining},byExercise,lastSessions[50]}`.
      Acceptation : training n'écrase jamais best arcade ; stats distinguent 🛠️/🏆.
      Tests : agrégats + 50 dernières.

- [ ] **BE-6.2 Badges 39 + déclencheurs**
      Faire : définitions 07-§5 (arcade Marathon/Perfection/pros, training Bosseur/Persévérant/Prêt, fun Tôt/Tard/Régulier, Top hebdo regagnables) + `GET badges` (earned/at) + attribution serveur vérifiée à complete/stop/cron.
      Pilote : seuls badges atteignables avec 6 exos testés (ex Calculateur Pro complet exige MUL/DIV → non attribuable en pilote : documenté `requires:[ADD,SUB,MUL,DIV]`).
      Acceptation : 1 badge 1 fois (sauf Top) ; Toast front via réponse ; conditions aux limites (45/45, série 10).
      Tests : chaque déclencheur + non-régression pilote.

- [ ] **BE-6.3 XP + niveaux**
      Faire : arcade `floor(score/10)`, training `min(floor(/50),200/j/exo)` + `niveau=floor(sqrt(xp/100))+1`, paliers avatars/thèmes. Compteurs anti-farm (`>500 training/h` → XP 0 + log).
      Acceptation : exemple 12400→1240 XP ; cap training/j/exo ; farm écrêté sans ban.
      Tests : formules + caps.

- [ ] **BE-6.4 Export + suppression**
      Faire : `GET export` JSON (profil, identities/providers, sessions, progress 2 volets, badges, devices, consentements) 1 clic ; `DELETE me` (BE-2.9) cascade + DeletedPseudo 30j + libération email/phone immédiate.
      Acceptation : export complet <5s ; delete → login impossible + ranking retiré ≤60s + pseudo réservé 30j.
      Tests : cascade + réserve + SLA.

## BE-EPIC-7 — Transverse prod (100% gratuit, quotas)

- [ ] **BE-7.1 Validation + headers + CORS + rate limits**
      Faire : Zod toute entrée (pseudo, email, E.164, niveau 1-15, timeMs, inputMode), Helmet, CORS front seule, CSRF double-submit (delete/unlink), limits 08-§7 + OTP 08b (5/h/numéro-email, 20/h/IP, resend 60s).
      Acceptation : fuzz 400 propres FR ; CORS étrangère bloquée ; OTP brute-force bloquée.
      Tests : validation + limits + headers.

- [ ] **BE-7.2 Observabilité + coûts gratuits**
      Faire : Sentry erreurs (sans PII), logs JSON structurés (Logtail optionnel si coût — voir 21-§2), métriques (`otp_sent{channel}`, `sessions{mode}`, `ws_updates`, `sync_conflicts`, coûts estimés OTP/jour) + alertes seuils (quotas gratuits). Dashboard 48h post-launch.
      Acceptation : erreur staging remonte avec request-id ; alerte OTP si >seuil.
      Tests : logs sans PII + alertes.

- [ ] **BE-7.3 Backups + restore**
      Faire : Postgres quotidien + PITR 7j, Redis AOF (ranking reconstructible), test restore mensuel, runbook.
      Acceptation : restore test OK ; RPO≈0 (chaque réponse), RTO<1h.
      Tests : restore + réconciliation Redis/Postgres.

- [ ] **BE-7.4 Go-live pilote + feature flags + config publique (patch 16-P3)**
      Faire : flags `pilote6=true`, `providers{google,apple,email,phone,guest}`, `tts=true`, `ranking=true`, kill-switch OTP/OAuth par provider + page statut ; **`GET config/flags` public (sans auth, cache 60s) → `{pilote6,providers:{…},tts,ranking,maintenance}`** consommé par FE-7.1 ; Checklist 05 go/no-go (perf Lighthouse, E2E, sécu, légal).
      Acceptation : désactiver un provider → flag false + front masque bouton + message FR + alternatives ; rollback flag <1min ; config publique sans secret.
      Tests : flags + kill-switch + checklist.
