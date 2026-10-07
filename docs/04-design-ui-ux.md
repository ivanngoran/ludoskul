# Design UI/UX - Interface Ludique

## Principes Directeurs

### 1. Focus Absolu sur la Question

- **Question en grand** : Taille police 48-64px selon device
- **Zéro bruit** : Pas de header persistant, pas de sidebar, pas de pub
- **Contraste maximal** : Question sur fond neutre, réponses bien séparées
- **Une action à la fois** : Pas de parallélisme visuel

### 2. Esthétique "Joueur" pas "Enfantin"

- Formes organiques, arrondis généreux (16-24px)
- Ombres douces, profondeur subtile (layers)
- Micro-animations : bounce, shake, pulse, confetti
- Palette saturée mais équilibrée (pas fluo agressif)

### 3. Feedback Immédiat et Visuel

- **Correct** : Vert + check + bounce + son doux + confetti discret
- **Incorrect** : Rouge + shake + son grave + vibration (mobile)
- **Temps** : Anneau progressif autour question (pas barre stressante)

### 4. Accessibilité First (jeu pointeur-seul)

- Mode contraste élevé (toggle au pointeur)
- Police dyslexie-friendly (OpenDyslexic option)
- Réduit mouvement (respecte `prefers-reduced-motion`)
- Hors jeu : focus visible clavier ; en jeu : pas de focus clavier (`tabindex=-1`, voir 10-§1)

## Écrans Principaux

### 0. Sélecteur de Mode (obligatoire avant partie)

```
┌─────────────────────────────────────┐
│  Que veux-tu faire ?                │
│                                     │
│  ┌──────────────┐ ┌──────────────┐   │
│  │ 🛠️           │ │ 🏆           │   │
│  │ ENTRAÎNEMENT │ │ ARCADE       │   │
│  │ Sans pression│ │ Chrono+classé│   │
│  │ Exo + niveau │ │ L1→L15 45 Q  │   │
│  │ au choix, ♾️  │ │ 3 vies/niv   │   │
│  └──────────────┘ └──────────────┘   │
│                                     │
│  Dernier : 🛠️ ADD Niv 7 [Reprendre]  │
└─────────────────────────────────────┘
```

Règles : 2 cartes ≥ 160×200px cliquables/tappables, présélection visuelle = dernier mode joué, activation uniquement au pointeur (pas de toggle clavier en jeu). Badge mode persistant en jeu (🛠️ bleu-gris vs 🏆 or).

### 1. Accueil / Sélection Exercice (avec mode actif)

```
┌───────────────────────────────────────────────────┐
│  🌟 Ludoskul        👤 Pseudo  🏆                 │  ← Barre discrète (56px)
├───────────────────────────────────────────────────┤
│                                                   │
│  CALCUL      NOMBRES     MESURES    GÉOMÉTRIE+ LOGIQUE│  ← 5 familles, scroll horizontal mobile
│ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────┐
│ │➕ Add   │ │🔢 Compar│ │🕒 Heure│ │🔷 Formes │ │🧩Suite│
│ │➖ Soust │ │🍕 Fract │ │📏 Mesur│ │📦 Solides│ │🧮Probl│
│ │✖️ Mult  │ │🔟 Décim │ │💶 Monna│ │📐 Angles │ │      │
│ │➗ Divis │ │% Pourc  │ │        │ │🧊 Volume │ │      │
│ │🎲 Mixte │ │         │ │        │ │🗺️ Repère │ │      │
│ │📋 Tables│ │➕ Compl │ │        │ │📏 Périm  │ │      │
│ │⚡Doubles│ │         │ │        │ │📐 Aire   │ │      │
│ └─────────┘ └─────────┘ └────────┘ └──────────┘ └──────┘
│                                                   │
│  [Mon Profil]  [Classements]  [🏆]                │  ← Pied discret
└───────────────────────────────────────────────────┘
```

**Carte Exercice** : 280×200px min, hover/tap → scale(1.02), ombre portée, couleur thème
Couleurs familles : Calcul=orange, Nombres=violet, Mesures=vert, Géométrie=bleu, Logique=rose.

### 2. Écran de Jeu (Cœur de l'Expérience) — pointeur seul

> Les 3 écrans ci-dessous = **ARCADE 🏆**. Training 🛠️ : même mise en page, HUD différent (voir 2bis). Tous boutons et cartes = clic/tap uniquement.

#### État Initial - Question (arcade)

```
┌─────────────────────────────────────┐
│  Niveau 3/15     ❤❤♡     1 250 pts │  ← HUD minimal (48px)
├─────────────────────────────────────┤
│                                     │
│           23 + 47 = ?               │  ← Question CENTRÉE, GRANDE
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │   60    │ │   70    │           │  ← Réponses : cartes larges
│   └─────────┘ └─────────┘           │     160×80px min, touch-friendly
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │   65    │ │   72    │           │
│   └─────────┘ └─────────┘           │
│                                     │
│         ⏱○○○○○○○○○○○○○○○○○○○○○○○    │  ← Anneau temps (SVG animé)
│                                     │
└─────────────────────────────────────┘
```

#### État Feedback - Correct

```
┌─────────────────────────────────────┐
│  Niveau 3/15     ❤❤♡     1 375 pts │
├─────────────────────────────────────┤
│                                     │
│        ✓  23 + 47 = 70             │  ← Question + réponse validée
│           🎉 +125 pts              │  ← Animation score (compteur)
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │   60    │ │  ✓ 70   │  ← Carte verte, bounce
│   └─────────┘ └─────────┘           │
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │   65    │ │   72    │           │
│   └─────────┘ └─────────┘           │
│                                     │
│        ⏱○○○○○○○○○○○○○○○○○○○○○○○    │
│                                     │
└─────────────────────────────────────┘
→ Auto-advance après 1.2s
```

#### État Feedback - Incorrect

```
┌─────────────────────────────────────┐
│  Niveau 3/15     ❤♡♡     1 250 pts │  ← Vie perdue visuelle
├─────────────────────────────────────┤
│                                     │
│        ✗  23 + 47 ≠ 65             │
│           La réponse est 70         │  ← Correction visible
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │  ✗ 65   │ │   70    │  ← Carte rouge shake
│   └─────────┘ └─────────┘           │
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │   60    │ │   72    │           │
│   └─────────┘ └─────────┘           │
│                                     │
│        ⏱○○○○○○○○○○○○○○○○○○○○○○○    │
│                                     │
└─────────────────────────────────────┘
→ Attend tap/clic "Continuer" (ou auto 2s, toujours pointeur)
```

#### 2bis. HUD Training 🛠️ (infini, sans vies, sans stress)

```
┌─────────────────────────────────────┐
│ 🛠️ ADD Niv 7  ♾️ Q12   412 pts 🛠️   │  ← pas de vies, pas de rang
├─────────────────────────────────────┤
│                                     │
│           14 × 6 = ?                │
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │   82    │ │   84    │           │
│   └─────────┘ └─────────┘           │
│                                     │
│   ┌─────────┐ ┌─────────┐           │
│   │   74    │ │   94    │           │
│   └─────────┘ └─────────┘           │
│                                     │
│         ○○○○○○○○○○○○○○○○○○○○○○○ (gris-bleu indicatif)│
│  [⏸️] [Niveau] [Exo] [🏆 Arcade] [⏹️] │ ← entre blocs, pointeur
└─────────────────────────────────────┘
```

Fin de bloc (toutes les 3 Q) : récap calme + 5 gros boutons pointeur `[Continuer ♾️] [Niveau] [Exo] [🏆 Arcade] [Arrêter]`. Pas de fanfare, pas de confetti (feedback doux).
`[🏆 Arcade]` pré-remplit exo+ niveau courant (`POST sessions {ARCADE}` puis démarrage direct niveau N si N>1 ? Non : arcade démarre toujours L1, mais affiche `Objectif : atteindre Niv 7 !` + progression). `[Niveau]` ouvre sélecteur 1-15 (grille pointeur, niveau courant surligné). `[Exo]` retour grille filtrée par famille.

#### Fin de session Training (arrêt volontaire)

```
┌─────────────────────────────────────┐
│  🛠️ FIN D'ENTRAÎNEMENT              │
├─────────────────────────────────────┤
│  ADD Niv 7 — 18 Q — 83% — 6:12      │
│  Score local : 412 pts 🛠️ (+8 XP)    │
│  Blocs : 6 — Série max : 7          │
│                                     │
│  💡 Conseil : 2 erreurs sur 14+?    │
│  [Revoir l'aide]                    │
│                                     │
│  [🔁 CONTINUER] [🏆 PASSER EN ARCADE]│
│  [Niveau] [Exo] [ACCUEIL]           │
└─────────────────────────────────────┘
```

`PASSER EN ARCADE` = nouvelle session arcade (L1, rappel `Training Niv 7 : 83% — prêt ?` si badge `Prêt pour l'Arcade`, sinon `Conseil : encore 1 bloc à 80%`). Jamais de rang affiché ici.

#### Fin de Niveau (3/3 questions) — arcade (valeurs réalistes conformes 07-§3)

```
┌─────────────────────────────────────┐
│  Niveau 3 TERMINÉ   ❤❤♡   1 850 pts │
├─────────────────────────────────────┤
│                                     │
│        🌟 NIVEAU RÉUSSI !           │
│        +260 bonus niveau            │
│                                     │
│   ════════════════════════════════   │
│   Précision: 89%   Temps: 18s       │
│   Série max: 5   ⚡ Rapide: 3       │
│   ════════════════════════════════   │
│                                     │
│        [NIVEAU SUIVANT ▶]           │  ← CTA principal
│                                     │
└─────────────────────────────────────┘
```

#### Fin d'Exercice (15/15) — valeurs réalistes conformes 07-§3 (plafond ~18-20k)

```
┌─────────────────────────────────────┐
│  🏆 EXERCICE TERMINÉ !              │
├─────────────────────────────────────┤
│                                     │
│        Score Final: 16 420 pts      │
│        Temps: 4m 32s                │
│        Précision: 91%               │
│                                     │
│   🥇 Rang mondial: #247             │
│   📈 Progression: +12 places        │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  🎁 RÉCOMPENSES             │   │
│   │  • Badge "Marathon"         │   │
│   │  • +1 642 XP                │   │
│   │  • Avatar "Einstein Jr"     │   │
│   └─────────────────────────────┘   │
│                                     │
│   [REJOUER]   [CLASSEMENT]  [ACCUEIL]│
│                                     │
└─────────────────────────────────────┘
```

> `Score Final` et `+XP` liés par 07-§5 (`floor(score/10)`). `Calculateur Pro` exige ADD+SUB+MUL+DIV 15/15 : ne pas l'afficher pour un seul exo pilote.

### 3. Classement Mondial (arcade uniquement, training = pas de rang) — valeurs réalistes conformes 07-§3 (plafond ~18-20k)

```
┌─────────────────────────────────────┐
│  🏆 Classement - Addition Rapide    │
│  📅 Cette semaine  ▼  [🔄]          │
├─────────────────────────────────────┤
│                                     │
│  🥇 1. MathWizard     18 420  98%  │
│  🥈 2. NumberNinja    18 150  97%  │
│  🥉 3. CalcQueen      17 980  96%  │
│      4. FastFingers   17 720  95%  │
│      5. SumMaster     17 450  94%  │
│      ...                            │
│                                     │
│  ═══════════════════════════════════ │
│  👤 247. TOI (Pseudo)  16 420  91%  │  ← Joueur mis en évidence
│  ═══════════════════════════════════ │
│                                     │
│  248. AlgeBro       16 380  90%     │
│  249. GeoGenius     16 310  92%     │
│                                     │
└─────────────────────────────────────┘
```

### 4. Profil / Progression

```
┌─────────────────────────────────────┐
│  👤 Pseudo          Niveau 14 ⭐    │
│  🎨 Thème: Arc-en-ciel  🌍 FR       │
├─────────────────────────────────────┤
│  XP: 18 450 / 25 000  ████████░░ 73%│
│                                     │
│  ┌─────────┬─────────┬─────────┐    │
│  │ Sessions│  Score  │ Précis. │    │
│  │   142   │  1.8M   │  87%    │    │  ← cumul tous modes, plafond arcade 07-§3 respecté
│  └─────────┴─────────┴─────────┘    │
│                                     │
│  📊 PROGRÈS PAR EXERCICE             │
│  ┌─────────────────────────────────┐ │
│  │ ➕ Addition      ████████░░ Lv15 │ │
│  │ ➖ Soustraction  ███████░░░ Lv12 │ │
│  │ ✖️ Multiplic.    ██████░░░░ Lv10 │ │
│  │ 🔷 Formes 2D     █████████░ Lv14 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  🏅 BADGES (12/39)                  │
│  [🧠] [⚡] [🎯] [🏆] [🔥] [⭐] ...    │
│                                     │
│  🔐 CONNEXIONS : G ✓ ·  ✓ · ✉️ ✓ · 💬 — │
│  ☁️ Sauvegardé (sync il y a 2 min)  │
│  [Appareils] [Exporter]             │
│                                     │
│  [PARAMÈTRES]  [DÉCONNEXION]        │
└─────────────────────────────────────┘
```

### 5. Connexion / OTP / Invité (hors jeu : pointeur + clavier autorisés)

```
┌─────────────────────────────────────┐
│  🌟 Bienvenue sur Ludoskul          │
│                                     │
│  [G Continuer avec Google]          │  ← bouton officiel, pointeur
│  [ Continuer avec Apple]           │  ← noir officiel
│  [✉️ Continuer avec Email]          │
│  [💬 Téléphone / WhatsApp]          │
│  ───────── ou ─────────             │
│  [Jouer sans compte (invité) ⏩]     │  ← <10s, bandeau Non sauvegardé après
│                                     │
│  ✉️ Email → [______________] [Envoyer le code]│
│  Code 6 chiffres : [□□□□□□] + pavé tactile│
│  ⏳ Renvoyer dans 42s — [Recevoir par SMS au lieu de WhatsApp]│
│  💬 Tél → [🇫🇷 +33 _ __ __ __ __] [Envoyer]│
│  👨‍👩‍👧 <15 ans : [Compte parent d'abord → + profil enfant]│
└─────────────────────────────────────┘
```

Règles : gros boutons ≥ 64px haut, OTP 6 cases ≥ 56px + pavé numérique tactile (clavier physique OK hors jeu), messages génériques anti-énumération, picker pays E.164, erreurs FR (`Code expiré — renvoyer`). Invité → bandeau `☁️❌ Non sauvegardé — [Sauvegarder]` + upgrade sans perte (voir 08b-§4).

## Composants UI (Design System) — pointeur seul en jeu

> Règle produit : en session de jeu (question + feedback + boutons Continuer/Niveau suivant), **souris ou doigt uniquement, pas de clavier**. `onPress` pointeur (`onClick` + `onTouchEnd`, `touch-action: manipulation`, anti-zoom double-tap). Événements clavier ignorés (`tabindex=-1` sur cartes, pas de hotkeys 1-4). Boutons ≥ 160×64px, cartes réponses ≥ 160×80px (visuel 96×96 mini). Curseur pointer desktop, ripple/feedback tactile mobile.

### Button

```tsx
// Variantes — activation pointeur uniquement en jeu (hors jeu : formulaires au clavier OK)
<Button variant="primary" size="lg" pointerOnlyInGame>Continuer</Button>     // CTA principal
<Button variant="secondary" size="md">Rejouer</Button>     // Actions secondaires
<Button variant="ghost" size="sm" icon={<Settings />}/>   // Toolbar
<Button variant="danger" size="md">Quitter</Button>       // Destructif

// États
:disabled → opacity-50, cursor-not-allowed
:hover (souris) → scale-1.02 + ombre
:active → scale-[0.98]
:focus-visible (hors jeu uniquement) → ring-4 ring-primary/30
```

### Card (Réponse) — tap/clic uniquement

```tsx
<AnswerCard
  value="70"
  state="correct" | "incorrect" | "selected" | "default"
  onPress={handleAnswer} // pointer uniquement : onClick + onPointerUp, verrou 400ms, tabindex=-1 en jeu
/>
// Animations: bounce (correct), shake (incorrect), scale (press)
// Pas de hotkeys clavier. Ordre visuel = ordre tactile, 2 colonnes mobile, 4 colonnes desktop.
```

### ReadAloud (TTS 🔊 — MVP non-lecteurs)

```tsx
<ReadAloud
  text="23 + 47 = ?"
  audioSrc="/audio/add_23_47.mp3"
  maxReplaysArcade={1}
/>
// Bouton 🔊 ≥ 56px à côté de l'énoncé, pointeur uniquement. Training : réécoutes illimitées. Arcade : 1 réécoute, chrono continue.
// Cache MP3 consignes fixes + fallback Web Speech FR. `aria-label="Lire l'énoncé"`. Jamais d'autoplay (choix user).
```

### TimerRing

```tsx
<TimerRing
  progress={0.65} // 0-1
  timeRemaining={6.5}
  warningThreshold={0.3}
/>
// SVG circle stroke-dashoffset animé
// Couleur: vert → orange → rouge selon seuil
```

### LevelProgress

```tsx
<LevelProgress current={3} total={15} completed={2} currentLevelQuestions={3} />
// Barre segments : remplis (vert), actuel (bleu animé), restants (gris)
```

### Confetti / Celebration

```tsx
<ConfettiBurst
  trigger={showCelebration}
  colors={themeColors}
  particleCount={50}
/>
// Canvas-based, cleanup auto, respects reduced-motion
```

### Prompts visuels riches (toujours QCM 4) — périmètre pilote vs v1.1

```tsx
<ClockFace hour={3} minute={15} size={180} />        // TIME (PILOTE) : aiguilles épaisses 8px, chiffres 12/3/6/9, aria-label
<PatternRow items={['🔴','🔵','🔴','?']} />           // SUITE (PILOTE) : 4 visuels + ?
<Statement text="Léa a 3 pommes..." maxChars={140} />// SUITE/TIME (PILOTE) : texte 20-24px, 2 lignes max, bouton lecture audio
// --- v1.1 uniquement (stubs en pilote, pas de route active) ---
<FractionBar num={3} den={4} />                      // FRAC v1.1 : barre 4 parts, 3 coloriées
<FractionPie num={1} den={2} />                      // FRAC/POURC v1.1 : camembert
<NumberLine min={0} max={10} value={7} />            // CMP/DECI v1.1 : droite graduée, point surligné
<MoneyStack coins={['2€','1€','50c']} />             // MONEY v1.1 : pièces/billets SVG côte à côte
<Protractor angle={90} />                            // ANGLE v1.1 : rapporteur simplifié 0/90/180
<CubesStack map={[[2,2],[2,1]]} />                   // VOL v1.1 : empilement isométrique, cubes cachés pointillés en aide
<GridBoard size={5} treasure="C3" />                 // REP v1.1 : grille lettres/chiffres, case ≥48px
// Règles : prompt ≤ 220px haut mobile, réponses toujours 4 cartes dessous, jamais de scroll pendant chrono
```

## Responsive Breakpoints

| Device   | Largeur    | Adaptations                                                 |
| -------- | ---------- | ----------------------------------------------------------- |
| Mobile S | 320-374px  | Question 40px, réponses 2 colonnes, padding 16px            |
| Mobile M | 375-429px  | Question 48px, réponses 2 colonnes, padding 20px            |
| Mobile L | 430-767px  | Question 56px, réponses 2-3 colonnes                        |
| Tablette | 768-1023px | Question 64px, réponses 4 colonnes, layout centré max 600px |
| Desktop  | 1024px+    | Même que tablette, max-width 700px centré                   |

## Thèmes

### Défaut "Arc-en-ciel" (Coloré, joyeux)

- Arithmétique : Orange chaleureux (#ec6f1a)
- Géométrie : Bleu vif (#1a7fe0)
- Accents : Vert succès, Violet bonus, Rose fun

### "Contraste Élevé" (Accessibilité)

- Fond noir pur (#000), texte blanc (#fff)
- Primaires : Jaune (#ffeb00), Cyan (#00ffff)
- Focus : Contour blanc 4px

### "Doux" (Sensibilité sensorielle)

- Pastels désaturés
- Animations réduites (opacity only)
- Pas de confetti, feedbacks subtils

### "Nuit" (Dark mode)

- Fond #18181b, cartes #27272a
- Primaires inchangées (lisibles sur sombre)

## Animations & Transitions

| Élément            | Animation          | Durée     | Easing      |
| ------------------ | ------------------ | --------- | ----------- |
| Entrée question    | Fade + slide up    | 300ms     | ease-out    |
| Sélection réponse  | Scale 0.95 → 1.02  | 150ms     | spring      |
| Feedback correct   | Bounce + confetti  | 600ms     | spring      |
| Feedback incorrect | Shake horizontal   | 400ms     | ease-in-out |
| Transition niveau  | Cross-fade + scale | 400ms     | ease-in-out |
| Chargement         | Skeleton pulse     | 1.5s loop | ease-in-out |
| Classement update  | Slide + highlight  | 500ms     | ease-out    |

**Respect `prefers-reduced-motion`** : Toutes durées → 0ms, pas de confetti, pas de bounce.

## Sonorité (Optionnel, désactivable)

| Événement     | Son              | Caractéristiques         |
| ------------- | ---------------- | ------------------------ |
| Correct       | "pop" doux       | 800Hz, 100ms, sine       |
| Incorrect     | "buzz" grave     | 200Hz, 200ms, square     |
| Niveau réussi | "fanfare" courte | 3 notes montantes, 500ms |
| Exercice fini | "tada"           | 5 notes, 1s              |
| Clic bouton   | "tap" subtil     | 1000Hz, 30ms, click      |

## Icônes & Illustrations

- **Style** : Outline arrondi, 2.5px stroke, coins arrondis
- **Set** : Lucide React (cohérent, tree-shakable)
- **Illustrations** : SVG custom par exercice (mascotte par catégorie)
  - Arithmétique : Renard malin 🦊
  - Géométrie : Caméléon géométrique 🦎

## Copywriting (Ton)

- **Encourageant** : "Bravo !", "Bien joué !", "Tu progresses !"
- **Clair** : "Addition", pas "Somme arithmétique"
- **Bref** : Max 2 lignes pour instructions
- **Positif** : "Réessaie" pas "Échec", "Presque" pas "Faux"

## Checklist Qualité UI

- [ ] Question lisible à 2m (test écran classe)
- [ ] Zones pointeur en jeu ≥ 96×96px visuel (mini 48×48 WCAG), souris + tactile testés, pas de clavier requis
- [ ] Touches clavier en jeu sans effet (1-4, Entrée, Espace, Tab ignorés, test auto)
- [ ] Contraste ≥ 4.5:1 (texte), 3:1 (UI)
- [ ] Focus visible hors jeu (login, menus, ranking, paramètres) ; en jeu `tabindex=-1` volontaire (voir 10-§1)
- [ ] Pas de clignotement > 3Hz
- [ ] Textes redimensionnables 200% sans perte
- [ ] États de chargement (skeleton) < 200ms perçu
- [ ] Erreurs réseau : toast + retry, pas page blanche
