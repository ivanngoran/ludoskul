# 07 — Mécaniques de Jeu, Scoring, XP, Badges (2 modes)

> Fait foi pour tout calcul. Ne pas arrondir différemment, ne pas ajouter de multiplicateur caché.
> **2 modes** : `TRAINING` (entraînement libre, infini, non classé) et `ARCADE` (enchaîné 15×3, chrono strict, classé mondial). Même générateurs 06/06b, mêmes 15 niveaux de difficulté.

## 0. Choix du mode (règle produit)

- Sélecteur obligatoire avant chaque partie : `[🛠️ Entraînement]` vs `[🏆 Arcade]`.
- **TRAINING** : on choisit 1 exercice + 1 niveau (1-15, accès libre sans déblocage). Les questions se régénèrent à l'infini par blocs de 3 (nouveau seed chaque bloc) jusqu'à Arrêt / Changer niveau / Changer exercice / Passer en Arcade.
- **ARCADE** : enchaînement imposé L1 → L15 (45 questions), 3 vies/niveau, chrono éliminatoire, score 07-§3, ranking mondial 09.
- Changement de mode en cours de session = abandon session courante + nouvelle session (pas de conversion de score).

## 1. Boucles de jeu

### 1a. ARCADE (state machine — mode classé)

```
IDLE → MODE_SELECT(arcade) → NIVEAU_INTRO (1.0s, consigne + niveau X/15)
→ QUESTION (chrono actif)
  → REPONSE_CORRECTE (feedback 1.2s auto) → QUESTION suivante OU NIVEAU_REUSSI
  → REPONSE_INCORRECTE (feedback + correction, bouton Continuer / auto 2.5s) → QUESTION suivante OU NIVEAU_ECHOUE
  → TIMEOUT (compte comme incorrect, -1 vie) → idem
→ NIVEAU_REUSSI (3 questions jouées ET vies restantes ≥1) → bonus → NIVEAU_INTRO suivant
→ NIVEAU_ECHOUE (vies = 0) → écran réessayer (score conservé, vies reset, mêmes 3 questions régénérées avec nouveau seed)
→ EXERCICE_TERMINE (15 niveaux réussis) → récompenses → envoi serveur → ranking
→ ABANDON (quitter) → sauvegarde progression partielle (max niveau atteint, pas de score ranking)
```

Règles arcade :

- 3 questions par niveau, ordre fixe.
- 3 vies par niveau, reset à chaque niveau. Pas de report.
- Pas de pause pendant question (pause = abandon, anti-triche). Pause autorisée uniquement entre niveaux.
- **Pointeur exclusif (règle produit) : souris sur ordinateur, doigt sur téléphone. Pas de clavier en jeu.**
  - Répondre = clic/tap sur 1 des 4 cartes. Continuer / Niveau suivant / Réessayer = clic/tap bouton.
  - Touches 1-4, A-D, Entrée, Espace, Tab : ignorées pendant QUESTION et feedback (pas de focus clavier en zone jeu, `tabindex=-1` sur cartes réponses).
  - Justification : équité arcade (anti-macro clavier), simplicité enfants, cibles tactiles larges.
  - Clavier reste nécessaire hors jeu (saisie email/pseudo/mot de passe) — voir 10-§1 pour dérogation WCAG documentée.
- Mobile : tap, zone ≥ 96×96px visuel (≥48px minimum WCAG), anti-double-tap (verrou 400ms après réponse). Souris : hover scale 1.02, curseur pointer, pas de double-clic compté double.

### 1b. TRAINING (boucle infinie — mode libre, non classé)

```
IDLE → MODE_SELECT(training) → PICK(exercice + niveau 1-15, défaut = dernier joué)
→ BLOC_INTRO (consigne + niveau + "infini ♾️")
→ QUESTION (chrono indicatif, jamais éliminatoire)
  → REPONSE (feedback immédiat + correction + aide courte + bouton Suite auto 1.2s si correct, manuel si incorrect)
  → toutes les 3 questions → BLOC_RECAP (précision bloc, série, temps moyen, boutons [Continuer ♾️] [Changer niveau] [Changer exo] [Passer en Arcade] [Arrêter])
→ ARRET (choix user) → récap session training → XP réduit → jamais ranking
```

Règles training :

- Aucune vie, aucun game over, aucun verrouillage. Erreur = explication, pas punition.
- Blocs de 3 questions même difficulté (même ligne 06/06b), seed nouveau à chaque bloc : `seed = sha(sessionId + ":" + code + ":" + niveau + ":" + blocIndex)`.
- Changement niveau/exo à tout moment entre blocs (pas en pleine question, au pointeur). Compteurs bloc reset, compteurs session cumulés.
- **Pointeur exclusif aussi en training** : mêmes règles que arcade (clic/tap uniquement, clavier ignoré en zone jeu).
- Pause autorisée à tout moment (timer indicatif mis en pause, pas d'anti-triche stricte).
- Timer indicatif : même durées 10/8/6/5 affichées en gris-bleu, dépassement = pastille `Prends ton temps` (pas de -1 vie, streak local conservé si bonne malgré dépassement, mais pas de pastille ⚡).
- Toggle optionnel `Avec chrono` (défaut OFF en L1-6, ON indicatif en L7+ ?) : si ON, affiche ⚡ mais ne punit jamais. Serveur ne rejette jamais pour temps en training.

## 2. Timer exact + TTS 🔊 (non-lecteurs)

> Bouton `🔊 Lire` pointeur à côté de chaque énoncé/consigne. Voix : MP3 pré-générés (consignes fixes) + fallback Web Speech API, cache local. Arcade : **1 réécoute max imposée côté front (bouton désactivé après), compteur serveur observabilité uniquement (jamais de 422 pour TTS)** ; training : illimité.
> **Arcade : le chrono continue pendant l'audio (équité ranking).** Training : timer indicatif, audio libre.

### ARCADE (strict, classé)

- Durées : L1-3 `10s`, L4-6 `8s`, L7-10 `6s`, L11-15 `5s` (voir 06).
- Résolution : 100ms affichage, calcul au ms pour score.
- À `0` : timeout = incorrect, bonne réponse révélée, -1 vie, série (streak) reset à 0.
- Bonus visuel uniquement : si réponse correcte < 50% temps, pastille `⚡ Rapide !` (pas de temps ajouté — simplifie ranking).
- Serveur valide : `temps_soumis ≤ temps_limite + 1.0s tolérance réseau`. Au-delà → réponse rejetée (`422`).

### TRAINING (indicatif, jamais punitif)

- Mêmes durées affichées (repère), anneau gris-bleu au lieu de vert→rouge stressant.
- À `0` : pas de timeout compté, message `Prends ton temps 🐢`, question reste jouable.
- `⚡ Rapide !` affiché si < 50% temps (motivation), sans impact score classé.
- Serveur : aucune rejet temporel en training (`timeMs` stocké pour stats seulement).

## 3. Score

### ARCADE — formule unique (seule éligible ranking)

Pour chaque question `i` correcte :

```
base = 100
mult_niveau = 1 + (niveau-1) * 0.1        # L1=1.0, L15=2.4
bonus_vitesse = round(50 * temps_restant / temps_total)   # 0..50
bonus_serie = min(streak_avant_reponse, 5) * 5            # 0..25 (streak = nb correctes consécutives en cours, cross-niveaux)
points_question = round(base * mult_niveau + bonus_vitesse + bonus_serie)
```

Si incorrecte / timeout : `0 pts`, `streak = 0`, `vies -= 1`.

Bonus niveau (si niveau réussi) :

```
bonus_niveau = 100 + niveau * 20 + vies_restantes * 50
# Ex L3 avec 2 vies : 100+60+100 = 260
```

Bonus exercice (si 15/15) :

```
bonus_perfect_accuracy = 1000 si précision 100% sinon 0
```

Score session = somme points_questions + somme bonus_niveaux + bonus_perfect.

Exemple chiffré (ADD L3, temps 10s, streak 2, reste 7.2s) : `100*1.2=120 + round(50*0.72)=36 + 2*5=10 → 166 pts`.

Score max théorique ≈ 45×(100×2.4+50+25) + bonus ≈ 14k + bonus ≈ ~18k. Maquettes 04 corrigées le 2026-09-28 avec valeurs réalistes (~16-18k) — **plafond réel ≈ 18-20k, ne pas promettre 50k en prod**.

### TRAINING — score local (jamais classé, anti-farming)

```
points_question_training = round((base * mult_niveau + bonus_vitesse) / 5)  # pas de bonus_serie classé, streak local affiché seulement
# Pas de bonus_niveau, pas de bonus_perfect. Incorrect = 0, streak local reset, sans vie.
score_training = somme points (cumul session, remis à 0 si changement niveau/exo ? Non : cumulé + détail par niveau)
```

- Score training affiché avec suffixe `🛠️` et couleur neutre (jamais or du ranking).
- Non comparable arcade : leaderboard training inexistant (volontaire). Seule stat persistée : `nb_questions, précision, temps_moyen` par (exo, niveau).

## 4. Vies, échec, rejouabilité

### ARCADE

- `vies = 3` par niveau.
- Échec niveau : bouton `Réessayer le niveau` (recommandé) ou `Quitter`. Score déjà gagné conservé. Streak reset.
- Régénération échec : nouveau seed (évite par-cœur positions), même difficulté (même ligne tableau 06).
- Abandon : `completed=false`, `maxLevel` sauvegardé pour reprise (`Reprendre au niveau X`), mais non éligible ranking hebdo.

### TRAINING

- Pas de vies, pas d'échec. 0 = impossible.
- `Arrêter` / `Changer niveau` / `Changer exo` disponibles entre blocs (et via menu ⋯ en pleine question avec confirm, sans pénalité).
- Rejouabilité infinie : `blocIndex++`, nouveau seed, même difficulté. Historique blocs consultable (10 derniers).

## 5. XP, niveaux joueur, récompenses

```
# ARCADE
xp_gagne_arcade = floor(score_session_arcade / 10)   # ex 12 400 pts → 1 240 XP
# TRAINING (anti-farm)
xp_gagne_training = min(floor(score_training / 50), 200) par jour et par exercice
niveau_joueur = floor(sqrt(xp_total / 100)) + 1
# L1: 0 XP, L2: 100 XP, L5: 1 600 XP, L10: 8 100 XP, L15: 19 600 XP
```

paliers débloquent :

- Avatars : 12 de base + 1 par tranche 5 niveaux joueur.
- Thèmes : `default` (L1), `nuit` (L3), `doux` (L5), `contraste` (toujours dispo, pas verrouillé).
- Badges (39 exhaustifs ci-dessous — fait foi, `seeds/badges.json` doit contenir exactement ces 39 codes) — déclencheurs serveur vérifiés :

| #   | Code            | Badge                | Condition                                                                                                   | XP bonus |
| --- | --------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| 1   | FIRST_STEP      | Premier pas          | finir niveau 1 (tout exo)                                                                                   | +50      |
| 2   | STREAK_5        | Série 5              | 5 bonnes d'affilée                                                                                          | +50      |
| 3   | STREAK_10       | Série 10             | 10 bonnes d'affilée                                                                                         | +100     |
| 4   | FLAWLESS_LEVEL  | Sans faute (niveau)  | 3/3 niveau                                                                                                  | +100     |
| 5   | SPEEDY          | Rapide               | 3 ⚡ dans même niveau                                                                                       | +100     |
| 6   | SURVIVOR        | Survivant            | finir niveau avec 1 vie                                                                                     | +80      |
| 7   | MARATHON        | Marathon             | finir 15/15 (tout exo)                                                                                      | +500     |
| 8   | PERFECT         | Perfection           | 45/45 (100%)                                                                                                | +1000    |
| 9   | CALC_PRO        | Calculateur Pro      | finir ADD+SUB+MUL+DIV 15/15 — `requires:[ADD,SUB,MUL,DIV]`, non attribuable en pilote                       | +800     |
| 10  | GEOMETER        | Géomètre             | finir SHAPE_2D+SHAPE_3D+PROP+SYM 15/15 — `requires:[SHAPE_2D,SHAPE_3D,PROP,SYM]`, non attribuable en pilote | +800     |
| 11  | NUMERATION_PRO  | Numération Pro       | finir CMP+FRAC+DECI+POURC 15/15 — `requires:[CMP,FRAC,DECI,POURC]`, non attribuable en pilote               | +800     |
| 12  | MEASURES_PRO    | Mesures Pro          | finir TIME+MES+MONEY 15/15 — `requires:[TIME,MES,MONEY]`, non attribuable en pilote                         | +800     |
| 13  | LOGICIAN        | Logicien             | finir SUITE+PROB 15/15 — `requires:[SUITE,PROB]`, non attribuable en pilote                                 | +600     |
| 14  | POLYVALENT      | Polyvalent Maths     | finir les 26 exos 15/15 — non attribuable en pilote                                                         | +2000    |
| 15  | EARLY_BIRD      | Tôt                  | jouer avant 8h (tout mode)                                                                                  | +20      |
| 16  | NIGHT_OWL       | Tard                 | jouer après 20h (tout mode)                                                                                 | +20      |
| 17  | REGULAR_3       | Régulier (3j)        | streak 3 jours (tout mode, ≥5 questions/jour)                                                               | +150     |
| 18  | REGULAR_7       | Régulier (7j)        | streak 7 jours (tout mode, ≥5 questions/jour)                                                               | +400     |
| 19  | TOP_100         | Top 100 hebdo        | par exercice, **arcade uniquement**                                                                         | +200     |
| 20  | TOP_10          | Top 10 hebdo         | par exercice, **arcade uniquement**                                                                         | +500     |
| 21  | TOP_1           | #1 hebdo             | par exercice, **arcade uniquement**                                                                         | +1000    |
| 22  | WORKER          | Bosseur (training)   | 50 questions training même semaine                                                                          | +150     |
| 23  | PERSEVERANT     | Persévérant          | 3 blocs training même exo/niveau d'affilée                                                                  | +100     |
| 24  | READY_ARCADE    | Prêt pour l'Arcade   | 80% précision sur 2 blocs training niveau N → CTA Arcade N                                                  | +100     |
| 25  | EXPLORER_3      | Explorateur          | finir 1 niveau dans 3 exos différents                                                                       | +100     |
| 26  | EXPLORER_6      | Aventurier           | finir 1 niveau dans les 6 exos pilote                                                                       | +250     |
| 27  | FAITHFUL_10     | Fidèle               | 10 sessions arcade terminées (tout exo)                                                                     | +200     |
| 28  | MARATHON_3      | Triple marathon      | finir 15/15 dans 3 exos différents                                                                          | +600     |
| 29  | FLAWLESS_5      | Sans faute ×5        | 5 niveaux 3/3 (tout exo, cumul)                                                                             | +200     |
| 30  | SPEED_DEMON     | Éclair               | 10 ⚡ cumulés (arcade)                                                                                      | +150     |
| 31  | COMEBACK        | Revanche             | réussir un niveau après 2 échecs (même exo)                                                                 | +100     |
| 32  | TRAINING_100    | Assidu               | 100 questions training cumulées (tout exo)                                                                  | +150     |
| 33  | TRAINING_500    | Infatigable          | 500 questions training cumulées (tout exo)                                                                  | +400     |
| 34  | MENTOR          | Grand frère          | parent : 2 profils enfants créés + consentement                                                             | +100     |
| 35  | CURIOUS         | Curieux              | ouvrir l'aide 5 fois (tout exo)                                                                             | +50      |
| 36  | LISTENER        | Auditeur             | 10 lectures TTS (tout mode)                                                                                 | +50      |
| 37  | WEEKEND_WARRIOR | Guerrier du week-end | finir 1 niveau arcade samedi ou dimanche                                                                    | +80      |
| 38  | PERFECT_LEVEL_3 | Triple sans faute    | 3 niveaux 3/3 d'affilée (même session arcade)                                                               | +250     |
| 39  | LOYAL_30        | Loyal                | streak 30 jours (≥5 questions/jour)                                                                         | +800     |

Pilote (6 exos ADD,SUB,TAB,SHAPE_2D,TIME,SUITE) : attribuables 1-8, 15-28 (sauf pros), 29-39. Non attribuables en pilote : 9-14 (exigent exos v1.1) — `GET badges` les retourne avec `earned:false` + `requires` explicite, front affiche `Bientôt`.

Règle : 1 badge = 1 fois par user (sauf Top hebdo, regagnable). Toast + son `tada` léger.

## 6. Précision, temps, stats session

```
# ARCADE
precision = correct / 45 * 100 (ou / jouées si abandon)
# TRAINING
precision_training = correct / jouées * 100 (par bloc + cumul session)
temps_total = somme temps_reponse (s, 1 décimale)
rapides = nb réponses < 50% temps
serie_max = max streak atteint
```

Affichés fin niveau / fin exercice (arcade) et fin bloc / fin session (training).

## 7. Feedbacks (rappel implémentation, détail en 04)

- Correct arcade : carte verte + `✓` + bounce 600ms + `+166` compteur + pop 800Hz + confetti discret (≤50 particules, jamais en mode réduit).
- Correct training : même + pastille `Bien !` + aide `Astuce : …` 1 ligne (ex `8+5 = 8+2+3`), jamais de points or.
- Incorrect/timeout : carte rouge + shake 400ms + bonne réponse entourée vert + correction texte (`La réponse est 70`) + buzz 200Hz + vibration 50ms mobile. En training, bouton `Voir l'aide` prioritaire sur `Suite`.
- Fin niveau arcade : fanfare 3 notes + écran récap + CTA `Niveau suivant ▶` (autofocus).
- Fin bloc training : récap calme (pas de fanfare) + 5 CTA (`Continuer ♾️`, `Niveau`, `Exo`, `Arcade ▶`, `Arrêter`).
- Fin exercice arcade : écran victoire + rang provisoire + récompenses.

## 8. Anti-frustration (enfants)

- Toujours montrer la correction, jamais `Faux` seul. Ton : `Presque ! La réponse est 70`.
- Après 2 échecs même niveau : proposer `Revoir l'aide` (table, formule, exemple) + bouton `Niveau plus facile` (redescend 1 niveau sans pénalité ranking, session marquée `assisted=true`, exclue du ranking — voir 09-§1).
- Pas de compte à rebours sonore stressant les 3 dernières secondes (visuel seul).
- Sons désactivables en 1 tap, mémorisés.

## 9. Cas limites

- Double soumission : ignorer 2e (id question + verrou).
- Perte réseau : file locale (localStorage), retry auto, envoi à fin exercice arcade. Training : 100% jouable offline (seed local), sync stats au retour, XP training recalculé serveur. Arcade offline : jouable, marquée `offline=true`, synchronisée au retour (hors ranking live, éligible hebdo si sync avant dimanche 23:59 UTC).
- Changement onglet / minimize : arcade → timer continue, `visibilitychange > 3s` = timeout. Training → timer en pause, reprise manuelle.
- Horloge trafiquée : temps serveur fait foi pour ranking arcade (durée session vs timestamps). Training : heure locale acceptée.
- Farm training : cap XP 200/jour/exo + heuristique `>500 questions training/h` = XP 0 + log (pas de ban, simple écrêtage).
