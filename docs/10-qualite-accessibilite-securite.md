# 10 — Qualité, Accessibilité, Sécurité, RGPD, Tests

## 1. Accessibilité (WCAG 2.2 AA cible, avec dérogation jeu pointeur-seul documentée)

> Choix produit : **session de jeu (questions + feedback + boutons Continuer/Niveau suivant) = souris ou doigt uniquement, pas de clavier**. Clavier reste requis hors jeu (auth, formulaires, paramètres).

- Question ≥ 40px mobile, 56-64px tablette/desktop. Zoom 200% sans scroll horizontal (layout fluide, `rem`).
- Contraste : texte ≥ 4.5:1, UI ≥ 3:1. Thème `contraste` : fond #000, texte #fff.
- **Dérogation WCAG 2.1.1 (clavier) — assumée et tracée** : la zone jeu a `tabindex=-1`, hotkeys désactivées, validation uniquement `pointerup/click`. Conséquence : non-conformité stricte AA en jeu pour utilisateurs clavier seul / switch.
  - Justification produit : équité arcade (vitesse clavier vs tactile), simplicité 6-14 ans, cibles larges.
  - Mitigations obligatoires : cibles ≥ 48px (visuel ≥ 96px en jeu), pas de drag fin (tap simple), pas de limite motrice (training sans timeout), temps arcade inchangés mais boutons larges, lecture d'écran informative (pas opérante en jeu) + aide parent/enseignant pour lancer la partie hors jeu au clavier.
  - Hors jeu : Tab order logique, Entrée/Esc fonctionnels (login, menus, profil, ranking, paramètres). Focus ring épais hors jeu.
  - Feuille de route : mode `clavier-accessible` optionnel v1.2 (réponses 1-4 + Entrée) avec ranking séparé. Spec data : `Session.keyboard=true` (défaut false), `Ranking` exclu du Top pointeur si `keyboard=true` (Top clavier séparé `?input=keyboard|pointer`, défaut `pointer`), `Answer.inputMode` étendu (`mouse|touch|keyboard` — `keyboard` accepté uniquement si session `keyboard=true`, sinon 422 inchangé). Endpoints 08/08b à étendre en v1.2 (`POST sessions {keyboard:true}`, `GET ranking/:code?input=`). En MVP : `keyboard=false` uniquement, `inputMode=keyboard` → 422 `KEYBOARD_NOT_ALLOWED`.
  - Traçabilité légale : dérogation reprise en CGU + confidentialité (voir 20-§1 : mention pointeur-seul + alternative parent/enseignant hors jeu).
- Lecteur d'écran en jeu : `role=img` + `aria-label` descriptif sur prompts, `aria-live=polite` pour feedback (`Bonne réponse`), mais pas d'opération au clavier en jeu (dérogation ci-dessus).
- `prefers-reduced-motion` : 0 animation, 0 confetti, transitions opacity 100ms max. Option `doux` en plus.
- Daltonisme : jamais couleur seule (icône ✓/✗ + texte + forme). Palette testée protan/deutan/tritan.
- Dyslexie : police option OpenDyslexic/Atkinson, interlignage 1.5, pas de justification, lignes ≤ 70 chars.
- Audit : `axe-core` 0 violation bloquante hors jeu à chaque PR + test manuel NVDA/VoiceOver 1×/sprint + test tactile 48px + test TTS (1 réécoute arcade, chrono continu, cache offline).

## 2. Sécurité

- Mots de passe : bcrypt 12, jamais loggés. Verrouillage login password : 5 échecs → blocage 15 min/IP+compte + message FR générique (anti-énumération) ; contrôle fuite HaveIBeenPwned (k-anonymity) au register/reset, refus si compromis + message `Choisis un autre mot de passe`. 2FA parent : TOTP optionnel v1.1 (pas de 2FA enfant — OTP email/parent suffit).
- OTP : hash argon2id, TTL 5-15 min, 5 essais, resend 60s. JWT access 15min (mémoire JS, pas localStorage), refresh HttpOnly Secure SameSite=Lax 7j + rotation + révocation par device.
- Validation : Zod côté API sur tout input (pseudo regex, email, E.164, bornes niveau/temps). Helmet : CSP stricte opposable (`default-src 'self'`, `script-src 'self'`, `connect-src 'self' https://api.<domaine> wss://api.<domaine>`, `img-src 'self' data:`, `media-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'` — ajuster domaine au figement 22-§1), HSTS, nosniff. CORS = origine frontend seule. CSRF : SameSite + token double-submit sur mutations sensibles (delete compte, unlink).
- OAuth : PKCE + state/nonce, `email_verified` exigé, allow-list redirect, JWKS cache. WhatsApp/SMS via provider officiel, templates approuvés, coûts plafonnés + alertes.
- Rate limiting + WAF (Cloudflare) : voir 08-§7 + 08b-§4 (5 codes/h/numéro-email, 20/h/IP). Logs sans PII (userId/phoneHash, jamais email/numéro/clair/OTP en clair). Numéros chiffrés at-rest, affichage masqué.
- Mineurs : autonomie ≥ 15 ans FR (13-16 UE selon pays, défaut 15). <15 ans : compte parent + consentement horodaté + profils enfants sans email/téléphone + `rankingPublic=false` par défaut. Pas de pub, pas de tracking pub, pas de revente données. Pseudos modérés.
- Dépendances : `npm audit` 0 high/critical en prod, Dependabot auto, SBOM 1×/mois.

## 3. RGPD (UE)

- Base légale : consentement (compte, parental <15 ans) + intérêt légitime (ranking arcade, anti-triche). Registre traitements + consentements parentaux horodatés.
- Droits : export JSON 1 clic (`/settings → Exporter mes données` : profil, identités/providers, sessions, progress arcade+training, badges, devices, consentements), suppression définitive 1 clic + vérification (password ou OTP ou OAuth) (cascade 08/08b, SLA 30j max, immédiat en DB prod). Email support `privacy@ludoskul.app` (réponse 72h).
- Conservation : sessions détaillées (Answer) 13 mois, OTP challenges 30j (puis purge), ranking hebdo archivé 3 ans anonymisé (pseudo → `joueur_#`), logs 12 mois sans PII.
- Cookies : uniquement fonctionnels (refresh, thème, a11y). Pas de bandeau si 0 traceur (choix MVP : 0 traceur tiers, analytics auto-hébergées ex Plausible EU ou rien en MVP).

## 4. Performance (budgets opposables)

- LCP < 2.0s 4G, INP < 150ms, CLS < 0.05, Lighthouse Perf > 90, A11y > 95.
- JS initial < 200KB gzip (code-split par route, `QuestionView` lazy sous 50KB), images SVG inline (< 5KB/forme), fonts `woff2` + `display=swap`.
- API p95 : `GET questions` < 120ms, `POST answers` < 100ms, `GET ranking` < 150ms. Redis cache Top 100 5s. DB index §08.
- Tests perf : Lighthouse CI à chaque PR (budget fail si régression > 10%), k6 500 RPS sur `GET ranking` avant launch.

## 5. Stratégie de tests (pyramide)

- **Unitaires (Vitest, >80%)** : générateurs 06 (100 seeds/niveau), formule score 07 (valeurs limites), tri ranking 09, validators Zod.
- **Intégration (Supertest)** : auth → session → 45 answers → complete → ranking visible. RGPD delete cascade.
- **E2E (Playwright, 10 scénarios critiques)** : inscription → ADD L1-L2 complet souris seule, test touches 1-4/Entrée ignorées en jeu, échec niveau → retry pointeur, fin 15/15 → ranking, offline → resync, tactile 360px, lecteur d'écran informatif, contraste, navigation clavier hors jeu.
- **Visuels (Chromatic)** : QuestionView correct/incorrect, 4 thèmes, 3 breakpoints.
- **A11y** : axe-core auto hors jeu 0 violation + checklist §04 + dérogation jeu pointeur-seul tracée (test clavier en jeu = doit rester sans effet).
- **Données** : seed démo + fixtures pseudos FR pour staging.
- Definition of Done : voir 05 (review + tests + a11y + perf + docs + staging PO).
