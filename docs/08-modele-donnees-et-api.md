# 08 — Modèle de Données et Contrats API

> Fait foi pour backend/frontend. Tous les exemples sont réels et copiables.

## 1. Dictionnaire de données (PostgreSQL via Prisma)

Principes : IDs `cuid2` partout (voir 17-§2), timestamps UTC, soft-delete jamais (RGPD = delete réel), `Json` uniquement pour config non requêtée.

- **User** : `id, email(unique, nullable si 100% OAuth/phone/guest), passwordHash(bcrypt 12, nullable si 100% OIDC/OTP), pseudo(unique, 3-16, /^[A-Za-z0-9_-]+$/), avatarId, country(ISO2 nullable), xp(int), level(int), theme, accessibility{contrast, dyslexiaFont, reducedMotion, soundOn, fontScale}, birthYear?(année seule enfant), isChild(bool), parentId?, rankingPublic(bool, défaut false si isChild), guest(bool), createdAt, updatedAt`
- **Exercise** : table référentiel seedée, non modifiable par users. `code(unique, ex ADD), name, description, category(CALCUL|NOMBRES|MESURES|GEOMETRIE|LOGIQUE), icon, color(hex), config(Json = extrait 06/06b pour ce code), isActive, order`
- **Session** : une tentative. `id, userId, exerciseId, mode(TRAINING|ARCADE), seedBase(string), startLevel(int, training=choisi/arcade=1), maxLevel(int 1-15), blockIndex(int, training uniquement), score(int), trainingScore(int, training uniquement), timeSpent(float s), correct(int), total(int), accuracy(float), completed(bool, arcade 15/15 uniquement), stopped(bool, training), assisted(bool), offline(bool), keyboard(bool, MVP=false uniquement — v1.2 `clavier-accessible`, voir 10-§1), createdAt, finishedAt(nullable)`. Index `(userId, exerciseId, mode, createdAt)`.
- **Answer** (nouveau, nécessaire audit/anti-triche) : `id, sessionId, mode, level(1-15), blockIndex(int, training), questionIndex(0-2), questionHash(string), chosen(string), correct(bool), timeMs(int), inputMode(mouse|touch — `keyboard`refusé en MVP, accepté uniquement si session`keyboard=true` v1.2), createdAt`. Permet recalcul score serveur (arcade strict, training stats).
- **Ranking** (snapshot hebdo, **arcade uniquement**) : `id, userId, exerciseId, weekStart(date lundi 00:00 UTC), score(int = meilleur score arcade completed de la semaine), timeSpent(float = temps du meilleur score, tie-break), accuracy, maxLevel, rank(int nullable, calculé), updatedAt`. Unique `(userId, exerciseId, weekStart)`. Index `(exerciseId, weekStart, score DESC, timeSpent ASC)`. Training n'y écrit jamais.
- **Progress** (agrégat tout temps, 2 volets) : `userId+exerciseId unique, bestScoreArcade, bestAccuracyArcade, maxLevelArcade, totalSessionsArcade, trainingQuestions, trainingAccuracy, trainingLevelsPracticed(int[]), lastPlayed, lastTrainingAt`
- **Badge** + **UserBadge** : `code(unique), name, description, xpBonus, icon` / `userId+badgeCode unique, earnedAt`
- **AuthRefresh** : `id, userId, tokenHash, expiresAt, revokedAt(nullable), createdAt` (rotation à chaque refresh).

Règles : suppression User → cascade Session/Answer/Ranking/Progress/UserBadge/AuthRefresh (droit à l'oubli). Pseudo conservé 30j en table `DeletedPseudo` pour anti-usurpation, puis libéré.

## 2. Auth (résumé — opposable en 08b)

> 4 providers MVP + invité : `google` (OIDC), `apple` (OIDC relay accepté), `email` (OTP code/lien 15 min par défaut + password optionnel), `phone` (OTP WhatsApp d'abord, fallback SMS, 5 min), `guest` (local + upgrade sans perte). Détail, endpoints OTP/OAuth/link/devices/famille et règles mineurs <15 ans : voir `08b-auth-comptes-sauvegarde.md`.

Base `/api`. JSON partout. Erreurs format `{error:{code,message,details?}}`.

```
POST /api/auth/register
Body {"email":"eleve@ex.fr","pseudo":"MathLeo","password":"…(≥8, 1 chiffre)"}
→ 201 {"user":{"id":"…","pseudo":"MathLeo","level":1,"xp":0},"accessToken":"eyJ…(15min)","refreshExpiresAt":"…"}
Set-Cookie refreshToken=…; HttpOnly; Secure; SameSite=Lax; 7j

POST /api/auth/login {"emailOrPseudo":"…","password":"…"} → 200 même forme
POST /api/auth/email/code + /verify, POST /api/auth/phone/code + /verify, GET /api/auth/oauth/:provider/url|callback → voir 08b-§4
POST /api/auth/refresh (cookie) → 200 nouveau accessToken + rotation refresh
POST /api/auth/logout → 204 (révoque device courant)
GET /api/auth/me (Bearer) → 200 {"id","email","pseudo","avatarId","country","xp","level","theme","accessibility","guest","rankingPublic","providers"}
PATCH /api/auth/me {"pseudo?","avatarId?","country?","theme?","accessibility"?} → 200 user
DELETE /api/auth/me {"password":"…"} → 204 + purge cascade + libère email/téléphone immédiatement, pseudo réservé 30j
```

Codes communs : `EMAIL_TAKEN, PSEUDO_TAKEN, INVALID_CREDENTIALS, WEAK_PASSWORD, TOKEN_EXPIRED` + OTP/OAuth/famille en 08b-§4.

## 3. Exercices & questions

```
GET /api/exercises → 200 {"exercises":[{"code":"ADD","name":"Addition Rapide","category":"CALCUL","icon":"plus","color":"#ec6f1a","order":1,"bestScoreArcade":12400,"maxLevelArcade":15,"trainingQuestions":120}, …6 pilotes (26 avec ?includeInactive=1)]}
GET /api/exercises/:code → 200 {"code":"ADD","name":"…","description":"…","levels":15,"questionsPerLevel":3,"modes":["TRAINING","ARCADE"],"timeLimits":{"1-3":10,"4-6":8,"7-10":6,"11-15":5,"training":"indicatif"},"help":{"table?":…, "formula?":…}}

# ARCADE
POST /api/sessions {"exerciseCode":"ADD","mode":"ARCADE"} → 201 {"sessionId":"sess_…","mode":"ARCADE","exerciseCode":"ADD","seedBase":"a3f…","startLevel":1|repris,"serverTime":"2026-…Z"}
GET /api/sessions/:id/questions?level=3 → 200 {"mode":"ARCADE","level":3,"timeLimit":10,"seed":"sha…","lives":3,"questions":[
  {"index":0,"hash":"q_9f2…","prompt":"23 + 47 = ?","options":["60","70","65","72"],"asset":null},
  {"index":1,…}, {"index":2,…}
]}
# TRAINING (niveau libre + blocs infinis)
POST /api/sessions {"exerciseCode":"ADD","mode":"TRAINING","level":7} → 201 {"sessionId":"sess_…","mode":"TRAINING","level":7,"blockIndex":0,"seedBase":"…"}
GET /api/sessions/:id/questions?level=7&block=0 → 200 {"mode":"TRAINING","level":7,"blockIndex":0,"timeLimit":6,"indicative":true,"seed":"sha…","questions":[…3…]}
GET /api/sessions/:id/questions?level=7&block=1 → 200 {… nouveau seed, même difficulté …}
POST /api/sessions/:id/training-level {"level":9} → 200 {"level":9,"blockIndex":0,"seed":"…"}  # changement niveau entre blocs
# Note : jamais `answer` côté client. `hash` = sha(seed+index+prompt) pour lier réponse.

POST /api/sessions/:id/answers
Body {"level":3,"blockIndex?":0,"index":0,"questionHash":"q_9f2…","chosen":"70","timeMs":2800}
→ arcade 200 {"mode":"ARCADE","correct":true,"points":166,"streak":3,"lives":3,"score":1420}
→ training 200 {"mode":"TRAINING","correct":true,"trainingPoints":24,"streakLocal":4,"tip":"Astuce : 23+47 = 20+40+3+7"}
# Serveur : arcade → recalcule + vérifie timeMs ≤ limite+1000 + hash, sinon 422. Training → vérifie hash seulement, stocke timeMs pour stats.

POST /api/sessions/:id/complete {"assisted":false}  # ARCADE uniquement
→ 200 {"mode":"ARCADE","score":12400,"correct":41,"total":45,"accuracy":91.1,"timeSpent":272.4,"xpGained":1240,"badges":["MARATHON"],"ranking":{"exerciseCode":"ADD","weekRank":247,"weekScore":12400}}
POST /api/sessions/:id/stop {}  # TRAINING uniquement (arrêt volontaire)
→ 200 {"mode":"TRAINING","questions":18,"accuracy":83.3,"trainingScore":412,"xpGained":8,"badges":["BOSSEUR"]}
POST /api/sessions/:id/abandon → 200 {"mode":"ARCADE","maxLevel":7,"saved":true}
```

Génération serveur = implémentation exacte 06/06b avec RNG seedé (ex `seedrandom` ou `xxhash`). Arcade : `seed=sha(sessionId:code:niveau)`. Training : `seed=sha(sessionId:code:niveau:bloc)`. Tests : seed fixe → questions byte-identiques.

## 4. Ranking (REST)

```
GET /api/ranking/:code?period=week&limit=100&cursor=…
→ 200 {"exerciseCode":"ADD","weekStart":"2026-09-14T00:00:00Z","entries":[
  {"rank":1,"pseudo":"MathWizard","avatarId":"fox","country":"FR","score":18420,"accuracy":98.2,"timeSpent":198.5},
  …],"nextCursor":"…","me":{"rank":247,"score":12400,"accuracy":91.1,"delta":+12}}
period = week|month|all. month = meilleur hebdo arcade du mois, all = Progress.bestScoreArcade.
GET /api/ranking/:code/me → 200 {"rank":247,"score":…,"around":[{"rank":244,…},{"rank":245,…},{"rank":246,…},{"rank":247(me)},…+3]}
GET /api/ranking/:code?weekStart=YYYY-MM-DD → 200 archive semaine N-1 figée (lundi UTC, lecture seule, même tri/curseur — voir BE-5.2 patch P2)
POST /api/ranking/:code/report {"reportedUserId":"…","reason":"pseudo|score"} → 202 {"received":true} (revue <48h, voir 09-§4 + BE-5.5)
```

Pagination curseur `(score, timeSpent, userId)`, pas offset (stable temps réel).

## 5. Progression / profil

```
GET /api/progress → 200 {"progress":[{"exerciseCode":"ADD","bestScoreArcade":12400,"bestAccuracyArcade":91.1,"maxLevelArcade":15,"totalSessionsArcade":12,"trainingQuestions":120,"trainingAccuracy":84.2,"trainingLevelsPracticed":[5,6,7],"lastPlayed":"…","lastTrainingAt":"…"}, …]}
GET /api/stats → 200 {"totals":{"sessionsArcade":60,"questionsTraining":820,"xp":18450,"avgAccuracyArcade":87.3,"avgAccuracyTraining":82.1},"byExercise":[{"code":"ADD","avgScoreArcade":…,"avgAccuracyTraining":…}],"lastSessions":[…50]}
GET /api/badges → 200 {"badges":[{"code":"MARATHON","name":"Marathon","earned":true,"earnedAt":"…"}, …39]}
GET /api/export → 200 JSON complet 1 clic (profil, identités/providers, sessions, progress 2 volets, badges, devices, consentements — voir BE-6.4, <5s)
GET /api/config/flags → 200 public sans auth, cache 60s : {"pilote6":true,"providers":{"google":true,"apple":true,"email":true,"phone":true,"guest":true},"tts":true,"ranking":true,"maintenance":false} (voir BE-7.4 patch P3)
```

## 6. WebSocket (Socket.io, namespace `/ranking`)

Auth : `auth:{token}` (accessToken). Rooms : `exercise:ADD`, etc.

```
C→S "ranking:subscribe" {"exerciseCode":"ADD"} → rejoint room, reçoit snapshot immédiat
C→S "ranking:unsubscribe" {"exerciseCode":"ADD"}
S→C "ranking:update" {"exerciseCode":"ADD","top":[{"rank":1,…100}],"me":{…}|null,"at":"…Z"}
  # émis au plus 1/s par room (throttle), payload ≤ 30KB
S→C "ranking:you-moved" {"exerciseCode":"ADD","oldRank":250,"newRank":247}
S→C "session:celebrated" {"pseudo":"…","score":…,"rank":…} # top 10 uniquement, anti-spam
```

Fallback : si WS indisponible, polling `GET ranking` toutes les 15s (même rendu).

## 7. Erreurs & statuts

`400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT (dont EMAIL_CONFLICT + suggestedAction, ALREADY_LINKED, BLOCK_IN_PROGRESS, LAST_AUTH_METHOD, PARENTAL_CONSENT_REQUIRED), 422 ANSWER_REJECTED (temps dépassé/hash invalide/inputMode keyboard) + OTP (INVALID_OTP, OTP_EXPIRED, OTP_TOO_MANY_ATTEMPTS, RESEND_TOO_SOON), 429 RATE_LIMITED`. Toujours message FR clair côté client : ex `429` → `Doucement ! Réessaie dans quelques secondes.`

Rate limits : `100 req/min/IP` global, `30/min/user`, `POST answers 60/min arcade, 120/min training`, `POST sessions 10/min arcade, 20/min training`.

## 8. Exemples bout-en-bout

### Arcade (ADD L3 Q1)

1. `POST /sessions {ADD, ARCADE}` → `{sessionId:s1, seedBase:x}`
2. `GET /sessions/s1/questions?level=3` → 3 QCM (10s strict, lives 3)
3. User clique `70` en 2.8s → `POST answers {level:3,index:0,hash,chosen:70,timeMs:2800}` → `{correct:true,points:166,…}`
4. ×3 → niveau suivant … ×15 → `POST complete` → score + XP + rang.

### Training (ADD L7 infini)

1. `POST /sessions {ADD, TRAINING, level:7}` → `{sessionId:t1, block:0}`
2. `GET /sessions/t1/questions?level=7&block=0` → 3 QCM (6s indicatif)
3. Réponses → `{trainingPoints, tip}` sans vies
4. `BLOC_RECAP` → `[Continuer]` → `GET …&block=1` (nouveau seed) … jusqu'à `POST stop` → stats + XP réduit, jamais ranking.
