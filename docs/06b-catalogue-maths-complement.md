# 06b — Catalogue Maths Complément (14 nouveaux exercices, 2 modes)

> Extension de `06-catalogue-exercices-maths.md`. Mêmes invariants arcade : **15 niveaux × 3 questions**, **timer L1-3=10s, L4-6=8s, L7-10=6s, L11-15=5s**, **QCM 4 pointeur**, **seed déterministe**, **pas de doublon**. Training : mêmes lignes, blocs de 3 régénérés à l'infini au niveau choisi.
> Catalogue complet : **12 (06) + 14 (ce fichier) = 26 exercices**, 5 familles. MVP pilote 6 actifs (ADD, SUB, TAB, SHAPE_2D, TIME, SUITE — voir 13-A), 20 en v1.1 au fil de l'eau.

## Règles communes (complément 06)

1. **Toujours QCM 4**, même pour nouveaux visuels. Le prompt peut être riche (SVG horloge, barre fraction, droite graduée, pièces, grille), les réponses restent 4 cartes.
2. **Français simple** : énoncé ≤ 140 caractères pour PROB, vocabulaire CP-CE1 en L1-6 (`image, partage, boîte, pièce`), mots-outils seuls.
3. **Nombres propres** : FRAC/DECI/POURC/MONEY/TIME/MES/VOL = résultats exacts, décimaux propres (max 2 décimales), divisions qui tombent juste, conversions sans piège d'arrondi.
4. **Distracteurs** : reprendre règle 06 + spécifiques ci-dessous (confusables visuels, erreurs classiques : 1/3 vs 1/4, 1,5 vs 1,05, 1h30 vs 1h03, 2,5cm vs 25mm, angle aigu vs obtus).
5. **Assets** : style identique 06 (contour 8px, pastel, `viewBox 0 0 120 120`, `aria-label` FR). Nouveaux : `clock, fraction-bar, fraction-pie, number-line, coins-euro, bills-euro, protractor, cubes-stack, grid-5x5, pattern-shapes`.
6. **Aide hors chrono** : table fractions/%, mémo conversions (60min=1h, 100cm=1m, 1000g=1kg, 100c=1€), rapporteur simplifié, exemple suite.

---

## A. NOMBRES & CALCUL MALIN

### CMP — Comparaison, ordre, encadrement — `Quel est le plus grand ? / Complète avec <, >, =`

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | 2 nombres 1-10, écart ≥ 2 | Plus grand : 4 ou 7 ? → 7 |
| 2 | 1-20 | 13 ou 9 ? → 13 |
| 3 | `<, >, =` avec 2 nombres 1-20 | 12 `?` 9 → `>` |
| 4 | 2 nombres 10-50 | 34 ou 43 ? → 43 |
| 5 | 3 nombres 1-50, plus grand / plus petit | 17, 29, 23 → 29 |
| 6 | dizaines/unités, ordre croissant 3 nombres | Ranger 31, 13, 21 → 13,21,31 (QCM : 4 ordres proposés) |
| 7 | 2 nombres 50-200 | 129 ou 192 ? → 192 |
| 8 | encadrement à la dizaine (entre 40 et 50 ?) | 47 entre ? → 40 et 50 |
| 9 | 3 nombres 100-500 | 408, 480, 804 → plus petit 408 |
| 10 | `<, >, =` 100-999 | 505 `?` 550 → `<` |
| 11 | grands nombres 1 000-9 999 | 3 402 ou 3 420 ? → 3 420 |
| 12 | ordre 4 nombres 1 000-9 999 (QCM ordres) | — |
| 13 | encadrement centaine/millier | 3 647 entre ? → 3 600 et 3 700 |
| 14 | nombres à virgule simples (1,5 vs 1,05 — piège) | 2,4 ou 2,38 ? → 2,4 |
| 15 | mixte tout + fractions simples vs décimaux (1/2 vs 0,5 → `=`) | 1/2 `?` 0,5 → `=` |

Distracteurs : voisins (±1, ±10), inversion chiffres (34/43), 4 ordres permutés pour rangements.

### FRAC — Fractions simples — `Quelle fraction ? / Laquelle vaut 1/2 ?`

Visuels : barres et camemberts partagés en parts égales, coloriées.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | 1/2 avec image (moitié coloriée) | Image moitié → 1/2 |
| 2 | 1/3, 1/4 avec image | Quart colorié → 1/4 |
| 3 | 2/4, 3/4 avec image | 3 parts/4 → 3/4 |
| 4 | lire 1/2 à 4/4 sans image (texte) | Trois quarts → 3/4 |
| 5 | équivalence 1/2 = 2/4 (images côte à côte) | 2/4 vaut ? → 1/2 |
| 6 | comparer 1/2 vs 1/4 vs 1/3 (plus grand ?) | Plus grand : 1/2 |
| 7 | 1/5 à 5/5, 1/6 à 1/8 lecture | — |
| 8 | équivalences 1/3=2/6, 3/4=6/8 | 6/8 vaut ? → 3/4 |
| 9 | comparer 2/3 vs 3/4 (visuel) | Plus grand → 3/4 |
| 10 | moitié/tiers/quart d'une quantité (1/2 de 10, 1/4 de 12) | 1/2 de 10 → 5 |
| 11 | 1/2 de 25 paires ? Non — pairs uniquement L11 (1/2 de 50 → 25) | 1/4 de 20 → 5 |
| 12 | 3/4 de 12, 2/3 de 18 (divisions exactes) | 3/4 de 12 → 9 |
| 13 | additions même dénominateur (1/4+2/4) | 1/4+2/4 → 3/4 |
| 14 | équivalences avancées (2/3=4/6=6/9) | 4/6 vaut ? → 2/3 |
| 15 | mixte + pièges (2/4 vs 3/6 → `=`, 3/5 vs 2/3) | 3/6 `?` 1/2 → `=` |

Distracteurs : numérateur/dénominateur inversés (2/3 vs 3/2), parts non égales signalées, `±1 part`.

### DECI — Nombres décimaux — `1,5 ou 1,05 ? / 0,3 + 0,4 ?`

Notation FR virgule. Droite graduée visuelle L1-8.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | dixièmes visuels (0,5 = moitié) | Moitié → 0,5 |
| 2 | lire 0,1 à 0,9 | 0,3 → `zéro virgule trois` (QCM chiffres) |
| 3 | comparer 0,2 vs 0,7 | Plus grand → 0,7 |
| 4 | 1,1 à 2,5 lecture + placement | 1,5 entre ? → 1 et 2 |
| 5 | additions dixièmes (0,3+0,4, 1,2+0,5) | 0,3+0,4 → 0,7 |
| 6 | piège 1,5 vs 1,05 (avec visuel) | Plus grand : 1,5 |
| 7 | soustractions dixièmes (1,8-0,5) | 1,8-0,5 → 1,3 |
| 8 | 2 décimales lecture (1,25) | 1,25 → QCM |
| 9 | comparer 2,38 vs 2,4 | Plus grand → 2,4 |
| 10 | additions 2 décimales propres (1,25+0,75 → 2,00) | 1,25+0,75 → 2 |
| 11 | compléments à 1 (0,3+? =1) | 0,7+? =1 → 0,3 |
| 12 | ×10 / ÷10 (2,5×10 → 25) | 3,4×10 → 34 |
| 13 | additions mixtes (2,5+1,75) | 2,5+1,75 → 4,25 |
| 14 | ordre 4 décimaux (QCM ordres) | — |
| 15 | problèmes monnaie/mesure (2,50€+1,20€) | 2,50+1,20 → 3,70 |

Distracteurs : virgule décalée (12,5 vs 1,25), `±0,1 / ±0,01`, confusion 1,5/1,05.

### POURC — Pourcentages — `50% de 20 ? / 50% = ?`

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | 50% = moitié (image) | 50% de la barre → moitié |
| 2 | 50% de nombres pairs ≤ 20 | 50% de 10 → 5 |
| 3 | 25% = quart (image) | 25% → quart |
| 4 | 25% de 12, 20 | 25% de 12 → 3 |
| 5 | 10% = 1/10 (bande 10 cases) | 10% de 30 → 3 |
| 6 | 10%, 20%, 30% de dizaines | 20% de 50 → 10 |
| 7 | 50/25/10% mixte | 10% de 70 → 7 |
| 8 | conversions 50%=1/2, 25%=1/4, 75%=3/4 | 75% vaut ? → 3/4 |
| 9 | 75% de 12, 20 | 75% de 12 → 9 |
| 10 | 1%, 5% intro (100 cases) | 5% de 40 → 2 |
| 11 | 20%, 30%, 40%, 60% de nombres ronds | 30% de 60 → 18 |
| 12 | réductions simples (-50%, -25% : prix 20€ -50% → 10€) | 40€ -25% → 30€ |
| 13 | 15%, 35% de 100/200 | 15% de 200 → 30 |
| 14 | conversions % ↔ décimal (0,25 ↔ 25%) | 0,3 ↔ 30% |
| 15 | mixte + pièges (30% de 50 vs 50% de 30 → `=`) | 30% de 50 → 15 |

### COMP10 — Compléments à 10 / 100 / 1000 — `7 + ? = 10`

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | compléments à 10 (1-9) | 7+? =10 → 3 |
| 2 | compléments à 10 inversés (?+4=10) | ?+4=10 → 6 |
| 3 | compléments à 20 (12+? =20) | 14+? =20 → 6 |
| 4 | dizaines à 100 (30+? =100) | 30+? =100 → 70 |
| 5 | 2 chiffres à 100 (45+? =100) | 45+? =100 → 55 |
| 6 | compléments à 50 | 27+? =50 → 23 |
| 7 | centaines à 1000 (300+? =1000) | 300+? =1000 → 700 |
| 8 | 3 chiffres à 1000 ronds (450+? =1000) | 450+? =1000 → 550 |
| 9 | 3 chiffres à 1000 (365+? =1000) | 365+? =1000 → 635 |
| 10 | à 100 en 2 sauts (mixte) | — |
| 11 | décimaux à 1 (0,7+? =1) | 0,7+? =1 → 0,3 |
| 12 | euros à 5€ (3,20+? =5) | 3,20+? =5 → 1,80 |
| 13 | minutes à 60 (25+? =60) | 25+? =60 → 35 |
| 14 | à 1000 rapides (4 nombres QCM serrés) | 648+? =1000 → 352 |
| 15 | mixte tout, QCM pièges ±10 | — |

### DOUBLE — Doubles, moitiés, triples — `Double de 14 ? / Moitié de 50 ?`

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | doubles 1-5 | Double 4 → 8 |
| 2 | moitiés pairs ≤ 10 | Moitié 8 → 4 |
| 3 | doubles 6-10 | Double 7 → 14 |
| 4 | moitiés pairs ≤ 20 | Moitié 18 → 9 |
| 5 | doubles 11-20 | Double 14 → 28 |
| 6 | moitiés 20-50 paires | Moitié 34 → 17 |
| 7 | triples 2-10 | Triple 6 → 18 |
| 8 | tiers multiples 3 (3-30) | Tiers 21 → 7 |
| 9 | doubles 25-100 (25, 50, 75) | Double 75 → 150 |
| 10 | moitiés 100-200 paires | Moitié 150 → 75 |
| 11 | doubles décimaux (2,5 / 3,5) | Double 2,5 → 5 |
| 12 | moitiés décimales (5,5 / 7,5) | Moitié 7 → 3,5 |
| 13 | quadruples 3-15 | Quadruple 12 → 48 |
| 14 | quart multiples 4 | Quart 48 → 12 |
| 15 | mixte ×2/÷2/×3/÷3 rapides | Triple 14 → 42 |

---

## B. MESURES & MONNAIE

### TIME — Heures & durées — `Quelle heure ? / Dans 15 min ?`

Horloge analogique SVG (aiguilles épaisses) + digitale en réponses. `aria-label="Il est 3 heures et quart"`.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | heures piles (1h-12h) | 🕒 → 3h |
| 2 | demies (…h30) | 🕝 → 2h30 |
| 3 | quarts (…h15, …h45) | 🕘 → 9h15 |
| 4 | 5 en 5 (…h05 à …h55) | 4h20 → QCM horloges |
| 5 | minute près L5 (8h07…) | 8h07 → QCM |
| 6 | digitale → analogique (choisir horloge) | 7h45 → image |
| 7 | +15 / +30 min (3h → 3h15) | 2h45 +15min → 3h |
| 8 | +1h / -1h, matin/après-midi (14h ↔ 2h) | 14h = ? → 2h ap-midi |
| 9 | durées simples (9h→11h = 2h) | 9h à 10h30 → 1h30 |
| 10 | conversions h/min (1h=60, 2h=120) | 2h = ? min → 120 |
| 11 | conversions min/h (90min=1h30) | 90 min → 1h30 |
| 12 | +45min avec retenue heure (10h40+45 → 11h25) | 10h40+45 → 11h25 |
| 13 | horaires (départ 9h15, trajet 40min → arrivée ?) | 9h15+40 → 9h55 |
| 14 | secondes (1min=60s, 2min30=150s) | 2min30 → 150s |
| 15 | mixte + pièges (1h30 vs 1h03, 90min vs 1h30 → `=`) | 1h15 = ? min → 75 |

### MES — Longueurs, masses, contenances — `2m = ? cm / Plus lourd ?`

Mémo aide : 10mm=1cm, 100cm=1m, 1000m=1km, 1000g=1kg, 1000mL=1L.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | comparer longueurs images (plus long ?) | Règle vs crayon → ? |
| 2 | cm : règle 1-15cm (lecture) | Segment 7cm → 7 |
| 3 | m/cm : 1m=100cm, 2m=200cm | 2m → 200cm |
| 4 | mm/cm : 10mm=1cm, 30mm=3cm | 30mm → 3cm |
| 5 | km/m : 1km=1000m, 3km=3000m | 2km → 2000m |
| 6 | choisir unité (porte ? m, fourmi ? mm) | Porte → m |
| 7 | masses : comparer (pastèque vs pomme) + g/kg intro | 1kg = ? g → 1000 |
| 8 | 500g+500g=1kg, 2kg=2000g | 500g+500g → 1kg |
| 9 | contenances : verre 20cL, bouteille 1L, 1L=100cL | 1L → 100cL |
| 10 | conversions mixtes mm/cm/m | 150cm → 1m50 |
| 11 | ordres longueurs 4 valeurs (QCM ordres) | 90cm, 1m, 80cm → ? |
| 12 | masses/contenances conversions | 2L → 200cL |
| 13 | périmètre avec unités (3m+50cm → 350cm) | 1m+30cm → 130cm |
| 14 | problèmes (bouteille 1,5L = ? verres 25cL → 6) | 1L = ? verres 25cL → 4 |
| 15 | mixte + pièges (2500m vs 2,5km → `=`) | 2500m `?` 2,5km → `=` |

### MONEY — Monnaie euro — `Total ? / Rendu ?`

Visuels pièces 1,2,5,10,20,50c, 1€,2€ + billets 5,10,20€. Centimes entiers, totaux ≤ 100€.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | reconnaître pièce/billet (2€ vs 1€) | Image 2€ → 2€ |
| 2 | totaux 2 pièces ≤ 5€ | 1€+2€ → 3€ |
| 3 | 3 pièces ≤ 5€ | 2+1+1 → 4€ |
| 4 | centimes (50c+20c) | 50+20c → 70c |
| 5 | 1€ = 100c | 1€ → 100c |
| 6 | totaux mixtes €+c (2€+50c) | 2€50+1€ → 3€50 |
| 7 | billets 5+10€ | 10+5 → 15€ |
| 8 | total courses 2 articles | 3€+2€50 → 5€50 |
| 9 | rendu sur 5€ (5-3€ =2€) | 5€-3,50€ → 1,50€ |
| 10 | rendu sur 10€ | 10-7,20 → 2,80€ |
| 11 | 3 articles totaux | 2,50+1+3 → 6,50€ |
| 12 | rendu sur 20€ | 20-13,40 → 6,60€ |
| 13 | comparer 2 paniers (moins cher ?) | Panier A 7,20 vs B 6,90 → B |
| 14 | billets + rendu (50€-…) | 20-9,90 → 10,10€ |
| 15 | problèmes (budget 15€, 3 articles, reste ?) | 15-12,30 → 2,70€ |

---

## C. GÉOMÉTRIE AVANCÉE

### ANGLE — Angles — `Droit, aigu ou obtus ?`

Rapporteur simplifié (0/90/180 marqués), coins surlignés.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | droit vs pas droit (équerre visuelle) | Coin carré → droit |
| 2 | trier 4 angles : lequel est droit ? | — |
| 3 | aigu (petit) vs obtus (grand) intro | Petit → aigu |
| 4 | classer droit/aigu/obtus (images) | — |
| 5 | angles du carré/rectangle (4 droits) | Rectangle : droits ? → 4 |
| 6 | triangle rectangle (1 droit) | — |
| 7 | lecture 0°, 90°, 180° | Plat → 180° |
| 8 | lecture 45°, 135° (diagonales) | — |
| 9 | estimation 30/60/120/150° (QCM 4 proches ±15°) | — |
| 10 | angles triangle (somme 180° : 90+60+? =30) | 90+60+? → 30° |
| 11 | aiguille horloge (3h = 90°) | 3h → 90° |
| 12 | complémentaires à 90° (30+? =90) | 30+? → 60° |
| 13 | supplémentaires à 180° | 70+? → 110° |
| 14 | polygones (pentagone : obtus) | — |
| 15 | mixte + pièges visuels (presque-droit ≠ droit) | — |

### VOL — Volumes (comptage cubes) — `Combien de cubes ?`

Empilements isométriques, cubes cachés à déduire (max 2 couches L1-10, 3 couches L11-15).

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | barre 2-4 cubes alignés | 3 cubes → 3 |
| 2 | 2-6 cubes en L (1 couche) | — |
| 3 | rectangle 2×3 (6) | 2×3 → 6 |
| 4 | 2 couches pleines 2×2 (8) | 2×2×2 → 8 |
| 5 | cube 2×2×2 vs pavé 3×2×1 | — |
| 6 | volume cube arête 2-3 (formule V=c³) | c=2 → 8 |
| 7 | pavé 2×3×2 (V=L×l×h) | 2×3×2 → 12 |
| 8 | cube arête 3-4 | c=3 → 27 |
| 9 | pavé 3×3×3 vs cube (piège unités) | — |
| 10 | pièces avec 1 cube caché | Compter caché → ? |
| 11 | 3 couches, 2 cachés | — |
| 12 | V pavé 4×3×2 | → 24 |
| 13 | V cube 5 | → 125 |
| 14 | comparer 2 volumes (plus grand ?) | 3³ vs 4×3×2 → 27 vs 24 |
| 15 | volume manquant (V=36, base 3×3 → h=4) | 36÷9 → 4 |

Unités : `cubes` L1-5, `cm³` L6+.

### REP — Repérage quadrillage — `Où est le trésor ? (C3)`

Grille 5×5 (L1-10) puis 8×8 (L11-15). Colonnes lettres, lignes chiffres. `aria-label="Grille, trésor en C3"`.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | case coloriée parmi 2×2 (A1/B2) | Rouge en A1 → A1 |
| 2 | 3×3, lire case | ⭐ en B2 → B2 |
| 3 | 4×4, lire case | — |
| 4 | placer (consigne C3 → choisir parmi 4 grilles) | C3 → image |
| 5 | 5×5 lecture | — |
| 6 | déplacement 1 pas (→, ←, ↑, ↓) : de B2 → vers ? | B2 + → → C2 |
| 7 | 2 pas en ligne | B2 + →→ → D2 |
| 8 | chemin 2 segments (→ puis ↑) | — |
| 9 | coder chemin (flèches → QCM) | — |
| 10 | nœuds vs cases intro | — |
| 11 | 8×8 lecture | G7 → ? |
| 12 | déplacements 3-4 pas | — |
| 13 | plus court chemin (2 options) | — |
| 14 | coordonnées (x,y) intro collège (3,4) | (3,4) → ? |
| 15 | mixte cases/nœuds/coordonnées | — |

---

## D. LOGIQUE & PROBLÈMES

### SUITE — Suites logiques — `Que vient après ? 2, 4, 6, ?`

Moitié nombres, moitié motifs (formes/couleurs). QCM 4.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | +1 (3,4,5,?) | 3,4,5 → 6 |
| 2 | +2 (2,4,6,?) | → 8 |
| 3 | motifs ABAB (🔴🔵🔴🔵→?) | → 🔴 |
| 4 | -1 (10,9,8,?) | → 7 |
| 5 | +5 / +10 (5,10,15,?) | → 20 |
| 6 | motifs ABC (🔺🟦⭕🔺…) | — |
| 7 | ×2 (2,4,8,?) | → 16 |
| 8 | -2 / -5 | 20,18,16 → 14 |
| 9 | +3 / +4 | 3,7,11 → 15 |
| 10 | alternance +1/-1, +2/-2 | 5,7,6,8 → 7 |
| 11 | ×3 / ÷2 (pairs) | 3,6,12 → 24 |
| 12 | carrés (1,4,9,?) | → 16 |
| 13 | motifs 2 attributs (forme+couleur) | — |
| 14 | Fibonacci intro (1,1,2,3,5,?) | → 8 |
| 15 | mixte + intrus (trouver l'erreur : 2,4,7,8 → 7) | 2,4,7,8 → 7 faux, 6 attendu |

### PROB — Petits problèmes — énoncé 1-2 opérations, QCM 4

Longueur ≤ 140 chars, nombres ronds, 1 opération L1-10, 2 opérations L11-15. Pas de piège lecture avant L8.

| Niv | Contenu | Exemple |
|---|---|---|
| 1 | + : `Léa a 3 pommes, Tom donne 2. Total ?` | 3+2 → 5 |
| 2 | - : `7 billes, perd 2. Reste ?` | → 5 |
| 3 | + avec dizaines | 12+8 → 20 |
| 4 | - avec dizaines | 20-5 → 15 |
| 5 | × intro : `3 paquets de 4 images` | 3×4 → 12 |
| 6 | ÷ partage : `12 bonbons pour 3` | → 4 |
| 7 | mesures : `2m + 50cm ?` | → 2m50 |
| 8 | monnaie : `3€ + 2€50` | → 5€50 |
| 9 | temps : `départ 9h, 30min trajet` | → 9h30 |
| 10 | mixte 1 opération, grands nombres | 25+15 → 40 |
| 11 | 2 additions : `4€ + 3€ + 2€` | → 9€ |
| 12 | + puis - : `20€, achète 7€, reste ?` | → 13€ |
| 13 | × puis + : `3×4€ + 2€` | → 14€ |
| 14 | ÷ puis - / comparaisons | `24 images / 4, donne 2, reste ?` → 4 |
| 15 | mixte 2 étapes + données inutiles (tri) | `12 élèves, 3 absents, 4 ballons chacun présent ?` → 36 |

Distracteurs PROB : bonne opération mais erreur calcul (±1, ±10), mauvaise opération (addition au lieu de multiplication), oubli 2e étape.

---

## Assets nouveaux requis (SVG)

`clock-face, fraction-bar- halves/thirds/quarters/sixths/eighths, fraction-pie, number-line-0-10, coins (1c→2€), bills (5→20€), protractor-simple, cube-unit, grid-2x2→8x8, pattern-AB, ruler-cm, scale-kg, bottle-L`. Chaque asset : pastel, contour 8px, `aria-label` FR, contraste ≥ 4.5:1, tactile ≥ 48px.

## Tests par nouvel exercice

- 100 générations/niveau : plages respectées, résultats exacts (pas de 1/3 de 10), distracteurs uniques ≠ bonne, QCM 4.
- TIME : horloges valides (minutes 0-59), conversions vérifiées.
- FRAC/POURC : images parts égales (tolérance SVG 1px).
- MONEY : totaux centimes entiers, rendus ≥ 0.
- PROB : énoncé ≤ 140 chars, 1 seule question, vocabulaire liste blanche L1-6.
