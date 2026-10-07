# 06 — Catalogue Exercices Maths (Référence Implémentation)

> Ce document fait foi pour la génération des questions. Chaque ligne = cas de test.
> Invariant : **15 niveaux × 3 questions = 45 questions par exercice**. Temps par question : **L1-3 = 10s, L4-6 = 8s, L7-10 = 6s, L11-15 = 5s**.

## Règles globales de génération

1. **QCM à 4 propositions partout (MVP)** : équité ranking, tactile mobile, rapidité. Saisie libre repoussée en v1.1.
2. **Seed déterministe** : arcade `seed = sha256(sessionId + ":" + code + ":" + niveau)`, training `seed = sha256(sessionId + ":" + code + ":" + niveau + ":" + blocIndex)` (voir 08-§3). Fourni par serveur. Même seed = mêmes 3 questions. Permet rejouabilité, debug, anti-triche.
3. **Pas de doublon** dans une session de 45 questions (clé unicité = énoncé normalisé).
4. **Distracteurs numériques** (arithmétique, périmètre, aire) : générer 3 parmi :
   - `bonne ±1, ±2, ±3`
   - `bonne ±10` (si bonne > 20)
   - `erreur opératoire fréquente` : ex `a+b` → `a+b+1`, `a*b` → `a*(b+1)`, `a-b` → `|a-b-2|`
   - `inversion chiffres` : 54 → 45 (si 2 chiffres et différent)
     Puis `shuffle` avec RNG seedé. Ne jamais proposer 2 fois la même valeur. Valeurs négatives interdites partout en arithmétique (SUB garantit `a ≥ b`, voir règle 8 ; distracteurs recalculés si < 0 → remplacer par `bonne +1/+2`).
5. **Distracteurs géométrie** : 3 formes / réponses différentes de la bonne, prises dans le pool du niveau. Préférer confusables (carré vs rectangle, losange vs carré tourné, cube vs pavé).
6. **Énoncés** : français court, verbe d'action unique. Ex : `23 + 47 = ?`, `Sélectionne le triangle`, `Combien de côtés ?`, `Périmètre du carré (côté 5) ?`.
7. **Accessibilité** : chaque forme SVG a `aria-label` + titre texte. Couleurs jamais seul indice (toujours forme + label).
8. **Validation** : division toujours exacte (reste 0), soustraction toujours `a >= b` (résultat ≥ 0) à tous les niveaux L1-15.

---

## ARITHMÉTIQUE

### ADD — Addition Rapide — `a + b = ?`

| Niv | Plage a | Plage b | Contrainte               | Temps | Exemple         |
| --- | ------- | ------- | ------------------------ | ----- | --------------- |
| 1   | 1-5     | 1-5     | somme ≤ 10               | 10s   | 2+3=? → 5       |
| 2   | 1-7     | 1-7     | somme ≤ 12               | 10s   | 4+5=? → 9       |
| 3   | 2-10    | 2-10    | sans retenue prioritaire | 10s   | 6+3=? → 9       |
| 4   | 5-15    | 5-15    | avec retenue possible    | 8s    | 12+7=? → 19     |
| 5   | 5-20    | 5-20    | —                        | 8s    | 14+9=? → 23     |
| 6   | 10-30   | 10-30   | —                        | 8s    | 18+15=? → 33    |
| 7   | 10-50   | 10-50   | —                        | 6s    | 23+47=? → 70    |
| 8   | 15-60   | 10-40   | —                        | 6s    | 35+28=? → 63    |
| 9   | 20-70   | 20-70   | —                        | 6s    | 46+37=? → 83    |
| 10  | 20-99   | 10-50   | —                        | 6s    | 67+28=? → 95    |
| 11  | 50-150  | 20-80   | —                        | 5s    | 87+65=? → 152   |
| 12  | 50-200  | 50-100  | —                        | 5s    | 123+89=? → 212  |
| 13  | 100-300 | 50-150  | —                        | 5s    | 234+156=? → 390 |
| 14  | 100-400 | 100-200 | —                        | 5s    | 345+178=? → 523 |
| 15  | 100-500 | 100-300 | double retenue fréquente | 5s    | 486+275=? → 761 |

### SUB — Soustraction Rapide — `a - b = ?` (toujours a ≥ b)

| Niv | Plage a | Plage b | Contrainte               | Temps | Exemple         |
| --- | ------- | ------- | ------------------------ | ----- | --------------- |
| 1   | 2-6     | 1-5     | résultat 0-5             | 10s   | 5-1=? → 4       |
| 2   | 3-10    | 1-8     | —                        | 10s   | 8-3=? → 5       |
| 3   | 5-15    | 1-10    | sans emprunt prioritaire | 10s   | 12-4=? → 8      |
| 4   | 10-20   | 5-15    | —                        | 8s    | 15-8=? → 7      |
| 5   | 10-30   | 5-20    | —                        | 8s    | 24-13=? → 11    |
| 6   | 20-40   | 10-25   | —                        | 8s    | 32-17=? → 15    |
| 7   | 20-60   | 10-30   | avec emprunt             | 6s    | 53-27=? → 26    |
| 8   | 30-80   | 15-40   | —                        | 6s    | 64-28=? → 36    |
| 9   | 40-99   | 20-50   | —                        | 6s    | 81-36=? → 45    |
| 10  | 50-99   | 20-60   | —                        | 6s    | 92-47=? → 45    |
| 11  | 100-200 | 20-90   | —                        | 5s    | 152-68=? → 84   |
| 12  | 100-250 | 50-120  | —                        | 5s    | 213-89=? → 124  |
| 13  | 150-350 | 50-150  | —                        | 5s    | 324-157=? → 167 |
| 14  | 200-500 | 100-250 | —                        | 5s    | 412-186=? → 226 |
| 15  | 200-600 | 100-300 | double emprunt           | 5s    | 523-278=? → 245 |

### MUL — Multiplication Rapide — `a × b = ?`

| Niv | Plage / tables                       | Temps | Exemple       |
| --- | ------------------------------------ | ----- | ------------- |
| 1   | 2×2 à 2×5, 3×2 à 3×3                 | 10s   | 2×3=? → 6     |
| 2   | tables 2,3 (jusqu'à ×5)              | 10s   | 3×4=? → 12    |
| 3   | tables 2,3,4 (jusqu'à ×5)            | 10s   | 4×4=? → 16    |
| 4   | tables 2-5 (jusqu'à ×6)              | 8s    | 5×4=? → 20    |
| 5   | tables 2-5 (jusqu'à ×9)              | 8s    | 4×7=? → 28    |
| 6   | tables 2-6 (jusqu'à ×9)              | 8s    | 6×7=? → 42    |
| 7   | tables 2-7                           | 6s    | 8×7=? → 56    |
| 8   | tables 2-8                           | 6s    | 8×6=? → 48    |
| 9   | tables 2-9                           | 6s    | 9×7=? → 63    |
| 10  | tables 2-10                          | 6s    | 9×9=? → 81    |
| 11  | 11×2 à 11×12, 12×2 à 12×10           | 5s    | 11×8=? → 88   |
| 12  | 12×12, 13×2 à 13×10                  | 5s    | 12×12=? → 144 |
| 13  | 2 chiffres × 1 chiffre (12×3 à 19×9) | 5s    | 14×6=? → 84   |
| 14  | 20-30 × 3-9                          | 5s    | 23×4=? → 92   |
| 15  | 12×13 à 19×19                        | 5s    | 13×14=? → 182 |

### DIV — Division Rapide — `a ÷ b = ?` (exacte uniquement)

Génération : tirer `b` et `quotient q`, calculer `a = b*q`. Proposer `a ÷ b`.

| Niv | b     | q     | Temps | Exemple       |
| --- | ----- | ----- | ----- | ------------- |
| 1   | 2     | 2-3   | 10s   | 6÷2=? → 3     |
| 2   | 2,3   | 2-4   | 10s   | 9÷3=? → 3     |
| 3   | 2-4   | 2-5   | 10s   | 12÷4=? → 3    |
| 4   | 2-5   | 3-6   | 8s    | 20÷5=? → 4    |
| 5   | 2-5   | 4-8   | 8s    | 28÷4=? → 7    |
| 6   | 3-6   | 4-9   | 8s    | 36÷6=? → 6    |
| 7   | 4-7   | 4-9   | 6s    | 56÷8=? → 7    |
| 8   | 4-8   | 5-9   | 6s    | 54÷6=? → 9    |
| 9   | 5-9   | 5-10  | 6s    | 72÷8=? → 9    |
| 10  | 6-10  | 6-10  | 6s    | 81÷9=? → 9    |
| 11  | 6-11  | 7-11  | 5s    | 88÷11=? → 8   |
| 12  | 7-12  | 7-12  | 5s    | 144÷12=? → 12 |
| 13  | 11-13 | 8-13  | 5s    | 132÷11=? → 12 |
| 14  | 12-15 | 8-14  | 5s    | 168÷12=? → 14 |
| 15  | 12-19 | 11-15 | 5s    | 182÷13=? → 14 |

Distracteurs DIV : `q±1, q±2, q+10/b` arrondi, jamais 0.

### MIX — Calcul Mental Mixte

Tirage uniforme parmi opérations débloquées :

- L1-3 : ADD+SUB niveau équivalent
- L4-6 : + MUL (tables 2-5)
- L7-10 : + DIV (tables 2-9), MUL 2-9
- L11-15 : tout, plages du niveau (voir tables ADD/SUB/MUL/DIV correspondantes)

Énoncé préfixé par picto : `➕ 12+7`, `➗ 56÷8` pour éviter confusion.

### TAB — Tables de Multiplication (par cœur)

| Niv | Table(s)                                                      | Format                           | Exemple     |
| --- | ------------------------------------------------------------- | -------------------------------- | ----------- |
| 1   | table 2                                                       | `2 × ?` et `? × 2`               | 2×4=? → 8   |
| 2   | table 3                                                       | idem                             | 3×5=? → 15  |
| 3   | table 4                                                       | idem + commutativité (4×6 / 6×4) | 4×6=? → 24  |
| 4   | table 5                                                       | idem                             | 5×7=? → 35  |
| 5   | table 6                                                       | idem                             | 6×6=? → 36  |
| 6   | tables 2-6 mélangées                                          | —                                | 6×4=? → 24  |
| 7   | table 7                                                       | —                                | 7×8=? → 56  |
| 8   | table 8                                                       | —                                | 8×7=? → 56  |
| 9   | table 9 (astuce doigts rappelée en aide)                      | —                                | 9×6=? → 54  |
| 10  | tables 2-10 mélangées                                         | —                                | 8×9=? → 72  |
| 11  | table 11                                                      | —                                | 11×7=? → 77 |
| 12  | table 12                                                      | —                                | 12×7=? → 84 |
| 13  | table 13                                                      | —                                | 13×4=? → 52 |
| 14  | tables 11-13 mélangées                                        | —                                | 13×6=? → 78 |
| 15  | tables 2-13 super-mix (questions les plus rapides valorisées) | —                                | 12×8=? → 96 |

Aide affichable (pas pendant chrono) : table complète du niveau.

---

## GÉOMÉTRIE

Assets requis : SVG `circle, square, triangle, rectangle, losange, trapeze, parallelogramme, pentagone, hexagone, octogone, ellipse, sphere, cube, pave, cylindre, cone, pyramide, prisme`. Style : contour épais 8px, remplissage pastel, fond blanc. Chaque asset : `viewBox 0 0 120 120`, `aria-label` FR.

### SHAPE_2D — Reconnaître les formes planes — `Sélectionne le X`

Consigne + 4 formes cliquables (grille 2×2, zones ≥ 96×96px).

| Niv | Pool cibles                                                            | Distracteurs                 | Exemple consigne               |
| --- | ---------------------------------------------------------------------- | ---------------------------- | ------------------------------ |
| 1   | cercle, carré                                                          | cercle/carré uniquement      | Sélectionne le cercle          |
| 2   | + triangle                                                             | pool L1-2                    | Sélectionne le triangle        |
| 3   | cercle, carré, triangle (maîtrise)                                     | idem, rotations variées      | Sélectionne le carré           |
| 4   | + rectangle                                                            | + rectangle                  | Sélectionne le rectangle       |
| 5   | + losange                                                              | confusables carré/losange    | Sélectionne le losange         |
| 6   | révision 5 formes, tailles/orientations variées                        | —                            | Sélectionne le rectangle       |
| 7   | + trapèze, parallélogramme                                             | —                            | Sélectionne le trapèze         |
| 8   | 7 formes, intrus proches                                               | parallélogramme vs rectangle | Sélectionne le parallélogramme |
| 9   | + pentagone, hexagone                                                  | —                            | Sélectionne l'hexagone         |
| 10  | 9 formes                                                               | pentagone vs hexagone        | Sélectionne le pentagone       |
| 11  | + octogone, ellipse                                                    | cercle vs ellipse            | Sélectionne l'ellipse          |
| 12  | 11 formes, petites tailles                                             | —                            | Sélectionne l'octogone         |
| 13  | + décagone                                                             | décagone vs octogone         | Sélectionne le décagone        |
| 14  | toutes formes, rotations extrêmes                                      | —                            | Sélectionne le parallélogramme |
| 15  | toutes formes + pièges (carré tourné ≠ losange : indice angles droits) | confusables max              | Sélectionne le losange         |

Règle anti-hasard : position bonne réponse uniformisée par seed (pas toujours même case).

### SHAPE_3D — Reconnaître les solides — `Sélectionne le X`

Même interaction (4 rendus SVG isometric simples).

| Niv   | Pool                                                         |
| ----- | ------------------------------------------------------------ |
| 1     | sphère, cube                                                 |
| 2     | + cylindre                                                   |
| 3     | sphère, cube, cylindre (maîtrise)                            |
| 4     | + cône                                                       |
| 5     | + pavé droit (vs cube : piège arêtes inégales)               |
| 6     | révision 5 solides                                           |
| 7     | + pyramide (base carrée)                                     |
| 8     | 6 solides, vues variées                                      |
| 9     | + prisme triangulaire                                        |
| 10    | 7 solides                                                    |
| 11-12 | + pyramide triangulaire, prisme hexagonal                    |
| 13-15 | tous solides + pièges (cylindre vs prisme, cône vs pyramide) |

### PROP — Propriétés — `Combien de ... ?`

Types : côtés, sommets, faces, arêtes, angles droits.

| Niv | Formes concernées                                      | Questions types                 | Exemple                             |
| --- | ------------------------------------------------------ | ------------------------------- | ----------------------------------- |
| 1   | carré, triangle                                        | nb côtés (3/4)                  | Carré : combien de côtés ? → 4      |
| 2   | + cercle (0 côté, 0 sommet — introduire notion)        | côtés                           | Cercle : côtés ? → 0                |
| 3   | carré, triangle, rectangle                             | côtés + sommets                 | Triangle : sommets ? → 3            |
| 4   | + losange                                              | côtés/sommets                   | Losange : côtés ? → 4               |
| 5   | carré, rectangle, triangle                             | angles droits (0/1/4)           | Rectangle : angles droits ? → 4     |
| 6   | + parallélogramme, trapèze                             | angles droits, côtés parallèles | Parallélo : paires parallèles ? → 2 |
| 7   | cube (faces 6, sommets 8, arêtes 12)                   | faces                           | Cube : faces ? → 6                  |
| 8   | cube + pavé                                            | sommets/arêtes                  | Pavé : sommets ? → 8                |
| 9   | pentagone, hexagone                                    | côtés/sommets                   | Hexagone : côtés ? → 6              |
| 10  | pyramide base carrée (faces 5, sommets 5)              | faces/sommets                   | Pyramide : faces ? → 5              |
| 11  | octogone, cylindre (faces 3, 0 sommet)                 | mixte                           | Cylindre : faces ? → 3              |
| 12  | cône, sphère (faces 2/1)                               | mixte                           | Cône : sommets ? → 1                |
| 13  | prisme triangulaire (faces 5)                          | mixte                           | Prisme : arêtes ? → 9               |
| 14  | toutes formes 2D/3D                                    | mixte                           | Sphère : faces ? → 1                |
| 15  | toutes + pièges (cercle 0 côté vs ovale, pavé vs cube) | mixte                           | Pavé : arêtes ? → 12                |

Réponses QCM : bonne ±1, ±2 (jamais négatif ; 0 autorisé si pertinent).

### SYM — Symétrie — `Axe(s) de symétrie ?`

2 formats : `Oui/Non + combien ?` simplifié en QCM 4 (0,1,2,4 / infini).

| Niv   | Notion                                                  | Formes                               | Exemple                           |
| ----- | ------------------------------------------------------- | ------------------------------------ | --------------------------------- |
| 1     | pliage intuitif (image + axe pointillé)                 | cercle (infini→« beaucoup »), carré  | Carré : plié en 2 égaux ? Oui/Non |
| 2     | 1 axe vertical                                          | triangle isocèle, cœur simple        | Triangle isocèle : axes ? → 1     |
| 3     | 0 vs 1                                                  | triangle quelconque (0), isocèle (1) | Triangle quelconque : axes ? → 0  |
| 4     | rectangle (2), carré (4)                                | —                                    | Rectangle : axes ? → 2            |
| 5     | cercle (infini), ellipse (2)                            | —                                    | Cercle : axes ? → beaucoup        |
| 6     | losange (2), parallélogramme (0)                        | piège parallélo                      | Parallélo : axes ? → 0            |
| 7     | triangle équilatéral (3)                                | —                                    | Équilatéral : axes ? → 3          |
| 8     | pentagone régulier (5)                                  | —                                    | Pentagone : axes ? → 5            |
| 9     | hexagone (6)                                            | —                                    | Hexagone : axes ? → 6             |
| 10    | lettres/figures usuelles (A=1, H=2, N=0…)               | ludique                              | Lettre H : axes ? → 2             |
| 11-12 | figures composées simples                               | —                                    | Drapeau simple : axes ? → …       |
| 13-15 | solides (plan de symétrie) intro + polygones 8-10 côtés | —                                    | Octogone : axes ? → 8             |

Vocabulaire : L1-3 dire « plié en 2 pareils », L4+ introduire « axe de symétrie ».

### PERIM — Périmètres simples (cm, entiers)

Formules rappelées en aide hors chrono. QCM 4.

| Niv | Figure                                                    | Valeurs      | Exemple             |
| --- | --------------------------------------------------------- | ------------ | ------------------- |
| 1   | carré côté 2-5                                            | P=4×c        | c=3 → 12            |
| 2   | carré 4-8                                                 | —            | c=5 → 20            |
| 3   | rectangle L 4-8, l 2-5 (entiers)                          | P=2×(L+l)    | 5×3 → 16            |
| 4   | rectangle 5-10 × 3-7                                      | —            | 7×4 → 22            |
| 5   | triangle côtés 3-8 (donnés)                               | P=a+b+c      | 3+4+5 → 12          |
| 6   | triangle 5-12                                             | —            | 6+8+10 → 24         |
| 7   | polygones réguliers (penta/hexa côté 3-6)                 | P=n×c        | Hexa c=4 → 24       |
| 8   | mixte carré/rectangle/triangle                            | —            | —                   |
| 9   | carré côté 10-20                                          | —            | c=12 → 48           |
| 10  | rectangle 10-20 × 5-12                                    | —            | 15×8 → 46           |
| 11  | triangle 10-20                                            | —            | 12+15+9 → 36        |
| 12  | hexagone/octogone 5-10                                    | —            | Octo c=6 → 48       |
| 13  | figures composées (2 carrés accolés, périmètre extérieur) | guidé visuel | —                   |
| 14  | conversions mm/cm simples (c=30mm → P en cm)              | —            | c=30mm carré → 12cm |
| 15  | problèmes (périmètre donné, retrouver côté)               | inverse      | P carré=36 → c=9    |

### AREA — Aires simples (entiers, cm²)

| Niv | Figure                                                          | Valeurs  | Exemple     |
| --- | --------------------------------------------------------------- | -------- | ----------- |
| 1   | carré 2-4 (comptage carreaux visuel)                            | A=c²     | c=3 → 9     |
| 2   | carré 3-6                                                       | —        | c=4 → 16    |
| 3   | rectangle 2-5 × 2-4 (carreaux)                                  | A=L×l    | 4×3 → 12    |
| 4   | rectangle 4-8 × 3-6                                             | —        | 6×4 → 24    |
| 5   | carré 5-10                                                      | —        | c=7 → 49    |
| 6   | rectangle 5-10 × 4-8                                            | —        | 8×5 → 40    |
| 7   | triangle rectangle legs 3-6 (A=base×hauteur/2, division exacte) | —        | 4×6/2 → 12  |
| 8   | triangle rectangle 4-10                                         | —        | 6×8/2 → 24  |
| 9   | mixte carré/rectangle                                           | —        | —           |
| 10  | carré 10-15                                                     | —        | c=12 → 144  |
| 11  | rectangle 10-15 × 5-10                                          | —        | 12×8 → 96   |
| 12  | triangle rectangle 6-12                                         | —        | 10×8/2 → 40 |
| 13  | assemblages 2 rectangles (visuel quadrillé)                     | addition | —           |
| 14  | aire donnée, retrouver côté (carré)                             | inverse  | A=49 → c=7  |
| 15  | problèmes mixtes périmètre/aire (distinguer les 2)              | —        | —           |

Garantie : toutes divisions d'aire tombent juste (choisir base×hauteur paire).

---

## Exigences de test par exercice (arcade + training, même générateur)

- Arcade : pour chaque niveau, 100 générations → 0 doublon intra-session 45 Q, 100% réponses dans plages, 100% divisions exactes (DIV), 100% soustractions positives (SUB), 100% distracteurs uniques et ≠ bonne réponse.
- Training : même ligne de difficulté que le niveau choisi, blocs de 3 Q : 0 doublon intra-bloc, seeds `bloc` et `bloc+1` = questions différentes, changement niveau = nouvelle difficulté immédiate.
- Pour géométrie : vérifier chaque asset existe, `aria-label` présent, contraste ≥ 4.5:1, zone pointeur ≥ 96px visuel (48px mini).
- Pour PERIM/AREA : vérifier unités affichées (cm / cm²), résultats entiers.
