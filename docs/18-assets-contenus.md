# 18 — Assets, contenus et validation pédagogique

> Tranche 13-E (relecture enseignant) et 13-C (TTS). Tout asset ou texte élève est **relu péda avant launch**. Règle : pas d'asset sans `aria-label`, pas de texte élève sans entrée `fr.json`, pas d'audio sans manifeste.

## 1. Inventaire SVG (style unique, voir 04/06)

- Style : contour 8px, remplissage pastel, `viewBox 0 0 120 120`, fond transparent, `aria-label` FR obligatoire, contraste ≥ 4.5:1, < 5 Ko inline.
- Emplacement : `apps/web/public/assets/{shapes,clock,patterns,money,measure}/<nom>.svg`. Nommage : `shape-carre.svg`, `shape-triangle.svg`, `clock-h3m15.svg` (généré ou paramétré — préférer composant `ClockFace` paramétré + 4 SVG de fallback), `pattern-ab-*.svg`, `coin-2e.svg`, `bill-5e.svg`, `ruler-cm.svg`.
- Pilote requis : formes 2D (cercle, carré, triangle, rectangle, losange + rotations), horloges (heures piles, demies, quarts, 5-en-5), motifs suites (🔴🔵▲●). Le reste (fractions, solides, rapporteur, cubes, grilles) = v1.1 avec chaque exo.
- Test : chaque SVG a `aria-label`, passe le contraste, pèse < 5 Ko, s'affiche ≥ 96 px sans flou.

## 2. TTS : manifeste et fichiers audio

- Voix : MP3 pré-générés pour **consignes fixes** (ex `selectionne-le-triangle.mp3`, `quelle-heure.mp3`), fallback Web Speech API FR pour énoncés variables. Cache local (service worker) + headers cache 1 an.
- Manifeste : `GET exercises/:code/tts` (BE-3.4) → `{audioSrc, fallbackTTS:true}`. Composant `ReadAloud` (04) : bouton 🔊 ≥ 56 px, 1 réécoute arcade (chrono continue), illimité training, jamais d'autoplay.
- Inventaire pilote : ~15 consignes fixes à enregistrer (voix unique, ton enfant, débit lent). Énoncés variables (nombres, heures) = synthèse vocale uniquement.
- Test : chaque consigne pilote a son MP3 < 100 Ko ; fallback testé sans réseau ; 1 réécoute arcade vérifiée.

## 3. Textes FR : `fr.json` unique

- Tous les textes élève (consignes, feedbacks, boutons, aides, erreurs FR, templates OTP sans secrets) dans `packages/shared/src/i18n/fr.json`, clés hiérarchiques (`game.feedback.correct`, `auth.otp.expired`…).
- Règles : ton 04 (encourageant, bref, jamais `Faux`), énoncés PROB/SUITE ≤ 140 caractères, vocabulaire CP en L1-6 (voir 06b).
- Test : aucune chaîne FR en dur dans le code (lint `i18n/no-raw-text` sur `apps/web/src/features/`), `fr.json` valide et complet (clé manquante = fallback visible en dev).

## 4. Validation pédagogique (référent enseignant — bloquant launch)

- Référent : 1 enseignant cycles 2/3 nommé avant Phase 4 (`référent: NOM + contact + date nomination` notés ici). Grille par exercice : exactitude mathématique (fractions, conversions, divisions exactes), vocabulaire de niveau, distracteurs plausibles mais non ambigus, mapping compétences (chercher, calculer, représenter).
- Processus : fixtures gelées (17-§4) relues ligne à ligne → sign-off `grille-validation/<code>.md` coché (`lu + approuvé + date + signature référent`). Sans sign-off pilote 6 = pas de launch (gate 23-§4).
- Template sign-off par exo (`grille-validation/_template.md`) : `code, niveaux relus 1-15, exactitude OK/KO + remarques, vocabulaire OK/KO, distracteurs OK/KO, mapping compétences, décision GO/NO-GO + date + nom`.
- v1.1 : même grille à chaque nouvel exo, 1-2 exos/semaine max (charge QA référent : ~0,5 j/exo — voir 05-Phase 4b).

## Checklist

- [ ] SVG pilote livrés + tests aria/contraste/poids
- [ ] MP3 consignes + manifeste + fallback testés
- [ ] `fr.json` complet + lint anti-chaîne-en-dur
- [ ] Grille validation signée pour les 6 pilotes
