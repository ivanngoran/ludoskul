# Spécifications Fonctionnelles Détaillées (2 modes)

## 0. Modes de jeu (règle produit)

- **Entraînement 🛠️** : choix libre 1 exercice + 1 niveau (1-15). Questions régénérées à l'infini par blocs de 3 jusqu'à Arrêt / Changer niveau / Changer exercice / Passer en Arcade. Pas de vies, pas de game over, chrono indicatif jamais éliminatoire, score local 🛠️, XP réduit plafonné, jamais classé.
- **Arcade 🏆** : mode déjà spécifié — enchaînement L1→L15 (45 questions), 3 vies/niveau, chrono strict 10/8/6/5s, score formule 07, ranking mondial par exercice.
- Sélecteur de mode obligatoire avant partie. Changement de mode = nouvelle session.

## 1. Architecture des Exercices

### Structure Universelle

```
Exercice (6 au MVP pilote : ADD, SUB, TAB, SHAPE_2D, TIME, SUITE — catalogue 26 prêt en 06/06b pour v1.1)
├── ARCADE : Niveau 1 (3 Q) → … → Niveau 15 (3 Q) = 45 Q enchaînées, 3 vies/niveau
└── TRAINING : (Exercice + Niveau choisi 1-15) × blocs de 3 Q régénérés à l'infini
    ├── Bloc 0 (3 Q même difficulté)
    ├── Bloc 1 (3 Q régénérées, nouveau seed)
    └── … jusqu'à Arrêt / Niveau / Exo / Arcade
```

### Progression par Niveau

| Niveau | Difficulté | Exemple Arithmétique   | Exemple Géométrie                      |
| ------ | ---------- | ---------------------- | -------------------------------------- |
| 1-3    | Facile     | 2+3, 5-1               | Cercle, carré, triangle                |
| 4-6    | Moyen      | 12+7, 15-8, 3×4        | Rectangle, losange, cube               |
| 7-10   | Difficile  | 23+47, 8×7, 56÷8       | Parallélogramme, pavé droit            |
| 11-15  | Expert     | 123+456, 12×13, 144÷12 | Polygones réguliers, solides complexes |

### Génération de Questions

- **Aléatoire paramétré** : Plages de nombres, types d'opérations, formes selon niveau (référence opposable : 06/06b, chaque ligne = test)
- **Unicité** : Pas de répétition dans une session arcade (45 Q) ni dans un bloc training (3 Q) ; seeds : arcade `sha(session:code:niveau)`, training `sha(session:code:niveau:bloc)`
- **Équilibrage** : Distribution uniforme des types de questions
- **Training** : même difficulté que le niveau choisi, nouveau seed à chaque bloc (régénération infinie)

## 2. Mécanique de Jeu (détail opposable en 07, résumé ici)

### Modes (résumé, détail opposable en 07)

- Training : infini, niveau choisi, régénération par blocs de 3, aide + correction systématiques.
- Arcade : 15 niveaux enchaînés, vies, chrono, ranking.

### Chronomètre

- **Arcade — temps par question** : 10s (niveaux 1-3), 8s (4-6), 6s (7-10), 5s (11-15)
- **Training — mêmes durées à titre indicatif**, dépassement autorisé (`Prends ton temps`), jamais de vie perdue.
- **Bonus temps (arcade)** : pastille ⚡ si < 50% temps (pas de +2s — voir 07, corrige l'ancienne spec +2s)
- **Pénalité (arcade)** : -1 vie si temps écoulé (3 vies par niveau)

### Système de Score (formules opposables en 07-§3)

```
Arcade : points = round(100 × (1+(N-1)×0.1) + 50×reste/total + 5×min(streak,5)) + bonus niveau + bonus perfect
Training : points/5, pas de bonus, score local 🛠️ jamais classé
- Base arcade : 100 pts par question correcte
- Bonus_Vitesse arcade : round(50 × temps_restant / temps_total)
- Bonus_Série arcade : 5 × min(streak,5)
```

### Vies et Game Over (arcade)

- 3 vies par niveau
- Perte vie : mauvaise réponse ou timeout (arcade uniquement)
- 0 vie → Échec niveau → Recommencer niveau (score conservé)
- 15 niveaux validés → Exercice terminé → Classement
- Training : pas de vies, pas d'échec, régénération infinie.

## 3. Exercices Arithmétiques et Calcul

### Types d'Exercices — Calcul (base, détail 06)

| Code | Nom                   | Description           |
| ---- | --------------------- | --------------------- |
| ADD  | Addition Rapide       | a + b = ?             |
| SUB  | Soustraction Rapide   | a - b = ?             |
| MUL  | Multiplication Rapide | a × b = ?             |
| DIV  | Division Rapide       | a ÷ b = ?             |
| MIX  | Calcul Mental Mixte   | Opérations aléatoires |
| TAB  | Tables Multiplication | 2×? à 13×?            |

### Types d'Exercices — Calcul malin (complément, détail 06b)

| Code   | Nom                         | Description             |
| ------ | --------------------------- | ----------------------- |
| COMP10 | Compléments 10/100/1000     | 7 + ? = 10              |
| DOUBLE | Doubles / moitiés / triples | Double 14 ? Moitié 50 ? |

### Paramètres par Niveau (Exemple ADD)

| Niveau | Min | Max | Opérations |
| ------ | --- | --- | ---------- |
| 1      | 1   | 5   | +          |
| 5      | 5   | 15  | +          |
| 10     | 10  | 50  | +          |
| 15     | 50  | 200 | +          |

## 4. Exercices Nombres, Mesures, Géométrie, Logique

### Nombres (détail 06b)

| Code  | Nom                 | Description                                       |
| ----- | ------------------- | ------------------------------------------------- |
| CMP   | Comparaison / ordre | Plus grand ? Ranger ? `<,>,=`                     |
| FRAC  | Fractions simples   | Lecture, équivalence, moitié/quart d'une quantité |
| DECI  | Décimaux            | Lecture, comparaison, +/-, ×10                    |
| POURC | Pourcentages        | 50/25/10/75%, réductions simples                  |

### Mesures & Monnaie (détail 06b)

| Code  | Nom                              | Description                               |
| ----- | -------------------------------- | ----------------------------------------- |
| TIME  | Heures & durées                  | Lire horloge, +15min, conversions h/min/s |
| MES   | Longueurs / masses / contenances | mm/cm/m/km, g/kg, mL/L/cL                 |
| MONEY | Monnaie euro                     | Totaux, rendu sur 5/10/20€                |

### Géométrie (base 06 + avancée 06b)

| Code     | Nom                  | Description                                     |
| -------- | -------------------- | ----------------------------------------------- |
| SHAPE_2D | Formes 2D            | "Sélectionne le triangle"                       |
| SHAPE_3D | Solides 3D           | "Sélectionne le cube"                           |
| PROP     | Propriétés           | "Combien de côtés ?"                            |
| SYM      | Symétrie             | "Cette figure a-t-elle un axe ?"                |
| PERIM    | Périmètre            | Calcul périmètre simple                         |
| AREA     | Aire                 | Calcul aire simple                              |
| ANGLE    | Angles               | Droit / aigu / obtus, 90°/180°, complémentaires |
| VOL      | Volumes              | Comptage cubes, V=c³, V=L×l×h                   |
| REP      | Repérage quadrillage | C3, déplacements →↑, coordonnées                |

### Logique & Problèmes (détail 06b)

| Code  | Nom              | Description                            |
| ----- | ---------------- | -------------------------------------- |
| SUITE | Suites logiques  | 2,4,6,? + motifs ABAB                  |
| PROB  | Petits problèmes | Énoncé ≤140 chars, 1 puis 2 opérations |

Total : catalogue complet 26 prêt (06 + 06b) ; MVP pilote 6 actifs : ADD, SUB, TAB, SHAPE_2D, TIME, SUITE (voir 13-A). Chaque exercice : 15 niveaux × 3 questions (arcade) / blocs de 3 infinis (training), timer standard.

### Interactions — pointeur exclusif en jeu

- **Sélection simple** : clic souris / tap doigt sur forme (4 propositions). Pas de clavier.
- **Choix multiple** : clic/tap sur 4 cartes réponses. Pas de hotkeys 1-4, pas d'Entrée pour valider (bouton Suite cliquable/tappable).
- **Prompts visuels riches (toujours QCM 4 pointeur)** : horloge analogique (TIME), barres/camemberts fractions (FRAC/POURC), droite graduée (CMP/DECI), pièces/billets (MONEY), rapporteur simplifié (ANGLE), empilements cubes (VOL), grille cases (REP), suite avec ? (SUITE), énoncé court (PROB)
- **Glisser-déposer souris/doigt uniquement** (niveaux 10+, v1.1 pour nouveaux exos) : pointer drag, jamais clavier.
- Clavier uniquement hors jeu (login, pseudo, recherche). En session, événements clavier ignorés.

## 5. Classement Mondial

### Périmètre

- Un classement par **exercice** (ex: ADD, SHAPE_2D, etc.)
- Reset hebdomadaire (lundi 00:00 UTC)
- Historique personnel conservé

### Métriques

- **Score total** (somme 45 questions)
- **Temps total** (secondes)
- **Précision** (% bonnes réponses)
- **Niveau max atteint**

### Affichage

- Top 100 mondial
- Position joueur + ±3 autour
- Filtres : Semaine / Mois / Tout temps
- Pseudonyme + Avatar + Pays (optionnel)

### Anti-triche

- Limite taux requêtes
- Validation côté serveur temps/réponses
- Détection patterns impossibles (score max en temps min)
- Signalement communauté

## 6. Comptes, sauvegarde et progression

### Connexion (détail opposable en 08b)

- Providers : Google, Apple, Email (OTP code/lien par défaut + password optionnel), Téléphone/WhatsApp OTP (WhatsApp d'abord, fallback SMS), Invité local + upgrade sans perte. Autres (Microsoft, Passkeys) : interface prête v1.2.
- Mineurs <15 ans (FR) : compte parent + profils enfants (pseudo sans email), consentement horodaté, `rankingPublic=false` par défaut.
- Liaison multi-provider (même email vérifié = même User), unlink interdit si dernier moyen, liste devices + révocation.

### Sauvegarde (zéro perte cible)

- Locale après chaque réponse (localStorage/IndexedDB) + cloud auto-save (`POST answers` + `PUT progress/sync` idempotent).
- Reprise `GET sessions/active` (arcade au niveau, training au bloc), 1 session active/exo/mode, multi-device notifié.
- Offline : file persistée, resync auto ; arcade avant dimanche 23:59 UTC pour ranking.
- Export 1 clic + suppression cascade.

### XP et Niveaux (formules 07)

- Arcade `floor(score/10)`, Training plafonné `min(floor(score/50),200/j/exo)`
- Niveau joueur : `floor(sqrt(xp/100))+1`
- Récompenses : Avatars, badges (39), thèmes UI

### Historique

- Dernières 50 sessions (arcade + training distingués 🛠️/🏆)
- Graphiques : Score/temps par exercice, évolution précision arcade vs training
- Points forts / faiblesses + conseil `Prêt pour l'Arcade`

## 7. Accessibilité

- Contraste élevé (option)
- Taille police ajustable
- Navigation pointeur exclusive en jeu (souris/doigt, pas de clavier) ; clavier uniquement hors jeu (login, menus)
- Lecteur d'écran informatif en jeu + complet hors jeu (ARIA, voir 10-§1 dérogation)
- Mode daltonien
