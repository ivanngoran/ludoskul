# Architecture Technique

## Stack Technologique

### Frontend

| Technologie      | Version | Justification                               |
| ---------------- | ------- | ------------------------------------------- |
| React            | 18+     | Écosystème, performances, hooks             |
| TypeScript       | 5+      | Typage strict, maintenabilité               |
| Vite             | 5+      | Build rapide, HMR instantané                |
| Tailwind CSS     | 3+      | Utility-first, design system cohérent       |
| Framer Motion    | 11+     | Animations fluides, gestures                |
| Zustand          | 4+      | State management simple, pas de boilerplate |
| React Query      | 5+      | Cache serveur, synchronisation              |
| Socket.io Client | 4+      | Temps réel (classement live)                |

### Backend

| Technologie | Version                                       | Justification                                              |
| ----------- | --------------------------------------------- | ---------------------------------------------------------- |
| Node.js     | 20 LTS                                        | JS full-stack, performance                                 |
| Fastify     | 4+                                            | Rapide, schema validation, hooks                           |
| TypeScript  | 5+                                            | Partage types frontend/backend                             |
| PostgreSQL  | 16+                                           | ACID, JSONB, performances                                  |
| Prisma      | 5+                                            | Type-safe ORM, migrations                                  |
| Redis       | 7+                                            | Cache, sessions, leaderboards temps réel                   |
| Socket.io   | 4+                                            | WebSockets classements live                                |
| OIDC/OAuth  | `openid-client` + JWKS Apple/Google           | Google/Apple/Microsoft, PKCE, state/nonce                  |
| OTP         | WhatsApp Cloud API + SMS fallback (ex Twilio) | OTP téléphone 6 chiffres, templates approuvés              |
| Secrets     | Vault/ENV chiffrés (jamais en repo)           | `GOOGLE_*`, `APPLE_*`, `WHATSAPP_*`, `JWT_*`, KMS pgcrypto |

### Infrastructure

| Composant      | Choix                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Hébergement    | Vercel (Frontend) + Railway/Render (Backend) — hébergeurs UE à lister en 20                           |
| CI/CD          | GitHub Actions                                                                                        |
| Monitoring     | Sentry (sans PII) + logs JSON structurés — Logtail optionnel si coût (voir 21-§2, choix 100% gratuit) |
| CDN            | Cloudflare Images (assets statiques)                                                                  |
| Conteneurs     | Docker-ready : `Dockerfile` API/web + `compose` local à ajouter (manquant — voir 19-§5)               |
| Environnements | `preview` (PR) + `staging` + `prod` (+ `preprod` à formaliser si exigée)                              |

## Structure Projet (Monorepo)

```
ludoskul/
├── apps/
│   ├── web/                 # Frontend React
│   │   ├── src/
│   │   │   ├── components/  # UI réutilisables
│   │   │   ├── features/    # Features par domaine
│   │   │   │   ├── auth/
│   │   │   │   ├── exercises/
│   │   │   │   ├── ranking/
│   │   │   │   └── profile/
│   │   │   ├── hooks/       # Hooks personnalisés
│   │   │   ├── lib/         # Utils, config
│   │   │   ├── styles/      # Tailwind, globals
│   │   │   └── types/       # Types partagés
│   │   └── package.json
│   │
│   └── api/                 # Backend Fastify
│       ├── src/
│       │   ├── modules/     # Modules métier
│       │   │   ├── auth/
│       │   │   ├── exercises/
│       │   │   ├── ranking/
│       │   │   └── users/
│       │   ├── plugins/     # Fastify plugins
│       │   ├── services/    # Services transverses
│       │   ├── utils/       # Helpers
│       │   └── app.ts       # Entry point
│       └── package.json
│
├── packages/
│   ├── shared/              # Types, constantes, utils partagés
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   ├── validators/
│   │   │   └── generators/
│   │   └── package.json
│   │
│   └── ui/                  # Design System (Storybook)
│       ├── src/
│       │   ├── components/
│       │   ├── tokens/
│       │   └── themes/
│       └── package.json
│
├── turbo.json               # Turborepo config
├── package.json             # Workspace root
└── docs/                    # Cette documentation
```

## Base de Données (Prisma Schema — résumé, 08-§1 fait foi)

```prisma
// apps/api/prisma/schema.prisma — emplacement opposable (voir 17-§2). IDs cuid2 partout.
// Modèles opposables : User (+guest,isChild,parentId,rankingPublic,birthYear), Identity,
// OtpChallenge (codeHash argon2id), Device, Family, Exercise (26 seedées, 6 isActive=true),
// Session (mode TRAINING|ARCADE, seedBase, startLevel, maxLevel, blockIndex, score,
// trainingScore, timeSpent, correct, total, accuracy, completed arcade 15/15 uniquement,
// stopped, assisted, offline), Answer (sessionId, mode, level, blockIndex, questionIndex,
// questionHash, chosen, correct, timeMs), Ranking (arcade uniquement, unique
// userId+exerciseId+weekStart lundi UTC), Progress (2 volets arcade+training),
// Badge (39) + UserBadge, AuthRefresh (rotation), DeletedPseudo (réserve 30j).
// Enums : ExerciseCategory(CALCUL|NOMBRES|MESURES|GEOMETRIE|LOGIQUE),
// SessionMode(TRAINING|ARCADE), provider extensible (google|apple|email|phone|guest + microsoft|passkey réservés v1.2).
// Téléphone chiffré at-rest (pgcrypto/KMS), OTP hashés uniquement, cascade delete User → tout sauf DeletedPseudo.
```

> Ne pas dupliquer le schéma ici : toute évolution passe par migration Prisma + `openapi:check` (voir 17). L'ancien extrait avec `model Session` dupliqué est supprimé.

## API REST (Fastify)

### Authentification (détail opposable en 08b)

```
POST   /api/auth/register     # Email+password (parents/enseignants)
POST   /api/auth/login        # Email/pseudo+password
POST   /api/auth/email/code|verify  # OTP email (défaut enfants)
POST   /api/auth/phone/code|verify  # OTP WhatsApp→SMS
GET    /api/auth/oauth/:provider/url|callback  # google|apple (+microsoft v1.2)
POST   /api/auth/oauth/:provider/link  # Liaison multi-provider
POST   /api/auth/guest|guest/upgrade   # Invité → compte sans perte
GET|DELETE /api/auth/devices|identities # Sessions, révocation, unlink
POST   /api/auth/refresh      # Refresh token rotation
POST   /api/auth/logout       # Déconnexion device courant
GET    /api/auth/me           # Profil (+guest, rankingPublic, providers)
PATCH  /api/auth/me           # MAJ profil (pseudo, avatar, thème)
```

### Exercices & sessions (contrats opposables en 08-§3, résumé ici)

```
POST   /api/sessions {exerciseCode, mode:ARCADE}            # crée session arcade
POST   /api/sessions {exerciseCode, mode:TRAINING, level}   # crée session training + bloc 0
GET    /api/sessions/:id/questions?level=N                  # arcade : 3 Q sans réponses
GET    /api/sessions/:id/questions?level=N&block=B          # training : 3 Q bloc B
POST   /api/sessions/:id/training-level {level}             # changement niveau entre blocs
POST   /api/sessions/:id/answers {level,blockIndex?,index,questionHash,chosen,timeMs,inputMode}  # valide réponse
POST   /api/sessions/:id/complete {assisted}                # ARCADE uniquement (15/15 requis)
POST   /api/sessions/:id/stop {}                            # TRAINING uniquement (arrêt volontaire)
POST   /api/sessions/:id/abandon                            # arcade : sauvegarde maxLevel, non classé
GET    /api/sessions/active                                 # reprise (1 active/exo/mode)
PUT    /api/progress/sync {clientProgress,clientPrefs,at}   # sync idempotent (serveur gagne arcade)
GET    /api/exercises / GET /api/exercises/:code           # catalogue (6 actifs pilote, 26 avec ?includeInactive)
GET    /api/exercises/:code/tts?level=&index=              # manifeste TTS (voir 08b/BE-3.4)
```

### Classement (arcade uniquement, détail 08-§4 + 09)

```
GET    /api/ranking/:code?period=week|month|all&limit&cursor  # Top + me (curseur, pas offset)
GET    /api/ranking/:code/me                                  # position + autour ±3
GET    /api/ranking/:code?weekStart=YYYY-MM-DD               # archive semaine N-1 figée (lundi UTC)
POST   /api/ranking/:code/report {userId,reason}             # signalement pseudo
```

### Progression / profil / export

```
GET    /api/progress / GET /api/progress/:code / GET /api/stats / GET /api/badges
GET    /api/export (JSON 1 clic) — voir 08-§5 + BE-6.4
GET    /api/config/flags (public, sans auth, cache 60s) — flags pilote6/providers/tts/ranking/maintenance
```

## WebSocket (Socket.io, namespace `/ranking` — détail 08-§6)

### Events Client → Server

```typescript
// Connexion authentifiée (auth:{token})
socket.emit("ranking:subscribe", { exerciseCode: "ADD" });
socket.emit("ranking:unsubscribe", { exerciseCode: "ADD" });
```

### Events Server → Client

```typescript
// Mise à jour temps réel classement (throttle 1/s/room, ≤30KB)
socket.on(
  "ranking:update",
  (data: {
    exerciseCode: string;
    top: RankingEntry[]; // top 100
    me: RankingEntry | null;
    at: string;
  }) => {},
);

// Mouvement du joueur
socket.on(
  "ranking:you-moved",
  (data: { exerciseCode: string; oldRank: number; newRank: number }) => {},
);

// Célébration top 10 uniquement (anti-spam)
socket.on(
  "session:celebrated",
  (data: { pseudo: string; score: number; rank: number }) => {},
);
```

// Fallback si WS indisponible : polling `GET ranking` toutes les 15s (même rendu).

## Génération Questions (Algorithme)

### Côté Serveur (Deterministic)

```typescript
// packages/shared/src/generators/questions.ts

interface QuestionParams {
  exerciseCode: string;
  level: number;
  blockIndex?: number; // training uniquement
  seed: string; // arcade = sha(sessionId:code:niveau) ; training = sha(sessionId:code:niveau:bloc) — voir 08-§3
}

function generateQuestions(params: QuestionParams): Question[] {
  const rng = seededRandom(params.seed);
  const config = EXERCISE_CONFIGS[params.exerciseCode];
  const levelConfig = config.levels[params.level - 1];

  return Array.from({ length: 3 }, (_, i) => {
    return generateQuestion(params.exerciseCode, levelConfig, rng, i);
  });
}

// Exemple ADD niveau 5
function generateAddition(config: LevelConfig, rng: RNG, index: number) {
  const a = rng.int(config.min, config.max);
  const b = rng.int(config.min, config.max);
  const answer = a + b;
  const distractors = generateDistractors(answer, 3, rng);

  return {
    id: `q_${index}`,
    type: "input", // ou 'choice' pour géométrie
    prompt: `${a} + ${b} = ?`,
    answer: answer.toString(),
    options: shuffle([answer, ...distractors], rng),
    timeLimit: config.timeLimit,
  };
}
```

### Côté Client (Prédictible)

- Même algorithme + même seed = mêmes questions
- Validation locale instantanée → feedback visuel
- Envoi serveur seulement à fin de niveau/session

## Gestion État Frontend (Zustand)

```typescript
// apps/web/src/stores/exerciseStore.ts

interface ExerciseState {
  // Session en cours
  currentExercise: Exercise | null;
  currentLevel: number;
  questions: Question[];
  currentQuestionIndex: number;
  answers: (string | null)[];
  timeRemaining: number;
  lives: number;
  streak: number;
  score: number;

  // Actions
  startExercise: (exercise: Exercise) => void;
  nextLevel: () => void;
  answerQuestion: (answer: string) => void;
  tickTimer: () => void;
  completeSession: () => SessionResult;
  reset: () => void;
}
```

## Design System (Tokens)

```typescript
// packages/ui/src/tokens/colors.ts

export const colors = {
  // Primaires par catégorie
  arithmetic: {
    50: "#fef7ee",
    100: "#fdedd6",
    200: "#fad6ac",
    300: "#f6ba7a",
    400: "#f19345",
    500: "#ec6f1a",
    600: "#de5410",
    700: "#b83e0e",
    800: "#933312",
    900: "#772d10",
  },
  geometry: {
    50: "#eef7ff",
    100: "#d6eaff",
    200: "#add5ff",
    300: "#7abfff",
    400: "#42a0ff",
    500: "#1a7fe0",
    600: "#1062b8",
    700: "#0e4c93",
    800: "#114077",
    900: "#133661",
  },

  // Neutres
  neutral: {
    /* ... */
  },

  // Sémantiques
  success: "#16a34a",
  warning: "#f59e0b",
  error: "#dc2626",
  info: "#2563eb",

  // Arrière-plans
  bg: {
    primary: "#fafafa",
    secondary: "#ffffff",
    tertiary: "#f4f4f5",
    inverse: "#18181b",
  },
};
```

## Sécurité

- **Auth** : JWT (access 15min + refresh 7j httpOnly cookie)
- **Rate limiting** : 100 req/min/IP, 30 req/min/user authentifié
- **Validation** : Zod schemas toutes entrées
- **CORS** : Origine frontend uniquement
- **Headers** : Helmet (CSP, HSTS, etc.)
- **Données** : RGPD compliant, suppression compte possible

## Performance

- **Bundle** : Code splitting par feature (React.lazy)
- **Images** : WebP/AVIF, responsive, lazy loading
- **Cache** : React Query (stale-while-revalidate), Redis (classements)
- **DB** : Index sur colonnes filtrées, pagination curseur
- **WS** : Room par exercice, broadcast ciblé
