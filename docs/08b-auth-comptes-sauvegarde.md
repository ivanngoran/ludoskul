# 08b — Auth multi-provider, comptes (dont mineurs) et sauvegarde

> Fait foi avec 08. Principe : **1 humain = 1 `User`, N `Identity` liées**. Jeu pointeur-seul, **auth hors jeu au pointeur + clavier autorisé** (saisie email, code OTP, mot de passe parent).

## 1. Providers MVP (4 + invité, extensible)

| Provider                       | Code                                                                   | Flow                                                                                                                  | Quand l'utiliser                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Google                         | `google`                                                               | OIDC code + PKCE, `email_verified` exigé                                                                              | Élèves ≥ âge numérique, parents, enseignants. Bouton officiel Google.                                    |
| Apple                          | `apple`                                                                | OIDC, email relay privé accepté, `email_verified=true`                                                                | Familles iOS, obligatoire si wrapper iOS plus tard. Bouton noir officiel.                                |
| Email                          | `email_code` (défaut enfants) + `email_password` (parents/enseignants) | OTP 6 chiffres / lien magique 15 min **ou** mot de passe ≥8 + 1 chiffre (bcrypt 12)                                   | Enfant sans Google/Apple/téléphone. Pas de mdp à retenir en `email_code`.                                |
| Téléphone / WhatsApp           | `phone`                                                                | OTP 6 chiffres 5 min, canal **WhatsApp d'abord** (template Cloud API), **fallback SMS** auto si non lu / non WhatsApp | Parents, enseignants, élèves avec numéro (souvent celui du parent). Format E.164, picker pays + exemple. |
| Invité                         | `guest`                                                                | Pseudo local + UUID local, aucune vérification, **données locales uniquement** + upgrade 1 tap                        | Démarrage < 10s, classe sans emails, test. Bandeau `Non sauvegardé ☁️❌`.                                |
| Autres (v1.2, interface prête) | `microsoft` (écoles), `passkey` (WebAuthn, sans mdp)                   | OIDC générique / WebAuthn                                                                                             | Ne pas coder en MVP, prévoir `provider` enum extensible + `link` générique.                              |

Règles :

- Tout provider vérifié peut **créer** ou **lier** : s'il existe un `User` avec même email vérifié / même `phoneHash`, on lie (pas de doublon). Sinon création + pseudo unique demandé (3-16).
- `email_password` et `email_code` partagent la même `Identity email` (2 facteurs d'usage, 1 adresse). Mot de passe optionnel, ajoutable/retirrable dans paramètres (interdit de retirer le dernier moyen actif).
- Apple relay : on stocke le relay (utilisable pour mails produit), jamais l'email réel deviné. Changement relay = nouvelle identité à relier.
- WhatsApp : template OTP pré-approuvé FR (`Votre code Ludoskul : {{1}}. 5 min.`), pas de marketing. Si échec distribution 30s → SMS même code (même TTL/essais, pas de nouveau code). Coûts plafonnés + alertes.

## 2. Mineurs (6-14 ans) — France 15 ans, défaut strict

- Majorité numérique : **FR = 15 ans**, UE 13-16 selon pays. MVP applique **15 ans par défaut**, 13-14 uniquement avec preuve consentement parental explicite.
- Parcours :
  - ≥15 ans : inscription autonome (case âge + CGU + confidentialité).
  - <15 ans : **compte parent d'abord** (Google/Apple/email/téléphone vérifié), puis `Créer un profil enfant` (pseudo, avatar, âge approximatif, **sans email/téléphone enfant**), case consentement parental horodatée (`parentId`, `consentAt`, `consentText=v1`). Enfant se connecte via **code famille / QR parent** ou appareil parent (pas d'OTP vers enfant).
- Famille : `Family{id, parentUserId, childUserIds[], createdAt}`. Parent voit progression enfants, gère ranking public (OFF par défaut <15 ans : `rankingPublic=false` → scores visibles perso, exclus Top public mais éligibles badges), export/suppression par enfant.
- Zero pub, zero tracking pub, zero revente. Pseudos modérés, pays optionnel, jamais école/ville.

## 3. Données auth (complète 08-§1)

- `Identity{id, userId, provider(google|apple|email|phone|guest + microsoft|passkey réservés v1.2 — voir 17-§2), providerSub(unique par provider), emailLower?, emailVerifiedAt?, phoneE164Encrypted?, phoneHash(unique), phoneVerifiedAt?, createdAt, lastUsedAt}`. Unique `(provider, providerSub)`, unique `emailLower` si vérifié, unique `phoneHash` si vérifié.
- `User` += `birthYear? (pas jour exact enfant), isChild(bool), parentId?, rankingPublic(bool défaut false si isChild), guest(bool), createdAt`. `passwordHash` nullable (null si 100% OIDC/OTP).
- `OtpChallenge{id, purpose(register|login|link), channel(email|whatsapp|sms), targetHash, codeHash(argon2id), expiresAt(5-15min), attempts(int, max 5), resendAvailableAt(60s), consumedAt?}`. Jamais de code en clair en DB/logs.
- `Device{id, userId, label, refreshTokenHash, createdAt, lastSeenAt, revokedAt?}`. Liste visible `/me/devices`, révocation 1 tap.
- Numéros : chiffrés at-rest (pgcrypto/KMS), affichage masqué `+33 6 •• •• 42 18`, logs = `phoneHash` uniquement.
- Suppression User → cascade Identity/Otp/Device/Session/Answer/Ranking/Progress + libère email/téléphone immédiatement, pseudo réservé 30j.

## 4. Endpoints (base `/api`, JSON, erreurs `{error:{code,message}}`)

```
# OAuth Google/Apple/Microsoft (même patron)
GET /api/auth/oauth/:provider/url?redirect=/ → 200 {"url":"https://accounts.google…&state=…"}
GET /api/auth/oauth/:provider/callback?code=…&state=… → crée/lie User+Identity, 302 vers app + Set-Cookie refresh + accessToken (même forme que 08-§2)
POST /api/auth/oauth/:provider/link (Bearer, {idToken|code}) → lie au compte courant. 409 ALREADY_LINKED / EMAIL_CONFLICT (propose fusion si email vérifié identique)

# Email code (défaut) / lien magique
POST /api/auth/email/code {"email":"…","purpose":"register|login"} → 200 {"sent":true,"expiresIn":900,"resendIn":60} (toujours 200 même si inconnu : anti-énumération)
POST /api/auth/email/verify {"email":"…","code":"123456","pseudo?":"…(si register)"} → 201/200 User+Identity+tokens (5 essais puis invalidé)
GET /api/auth/email/magic?token=… → idem (lien 15 min, one-shot)

# Email password (parents/enseignants, optionnel enfant)
POST /api/auth/register {"email","pseudo","password"} → cf 08-§2
POST /api/auth/login {"emailOrPseudo","password"} → cf 08-§2

# Téléphone / WhatsApp OTP
POST /api/auth/phone/code {"phone":"+33612345678","channel":"auto|whatsapp|sms"} → 200 {"sent":true,"channel":"whatsapp","expiresIn":300,"resendIn":60}
POST /api/auth/phone/verify {"phone":"…","code":"…","pseudo?":"…"} → User+Identity+tokens
POST /api/auth/phone/code (resend) respect cooldown 60s, max 5/h/numéro, 20/h/IP

# Commun
POST /api/auth/refresh (cookie) → rotation (08-§2)
POST /api/auth/logout → révoque device courant
GET /api/auth/me → += {"guest":false,"rankingPublic":true,"providers":["google","email"],"devices":2,"isChild":false}
GET /api/auth/identities → liste providers liés
DELETE /api/auth/identities/:provider → 204 (refusé si dernier moyen : LAST_AUTH_METHOD)
GET /api/auth/devices → liste devices. DELETE /api/auth/devices/:id → révoque
POST /api/auth/guest {"pseudo":"…"} → 201 User guest local+serveur léger (ou 100% local si offline, upgrade plus tard)
POST /api/auth/guest/upgrade (Bearer guest + {provider…}) → conserve xp/progress/sessions (merge userId, pas de perte)
POST /api/auth/merge/confirm {targetEmail, proof:(OTP|OAuth code frais <10min)} → fusion transactionnelle si email/phone vérifié identique des 2 côtés (garde User le plus ancien, réassigne tout, supprime source, audit). Sinon 409 + suggestedAction. Idempotent. (patch P1, voir BE-2.10)
POST /api/family/children (Bearer parent, {pseudo, birthYear}) → crée enfant + consentement. GET /api/family/children → progression enfants
PATCH /api/family/children/:id {rankingPublic} (parent seul, explicite)
DELETE /api/family/children/:id (Bearer parent, vérification + confirm) → cascade enfant + réserve pseudo 30j + ranking retiré ≤60s. Export proposé avant (BE-6.4). (patch P1, voir BE-2.10)
GET /api/family/join?token=… → consommation code/QR famille (token court 10min, one-shot) pour connexion enfant sur appareil partagé. Expiré → 422 + nouveau code à générer côté parent.
```

Erreurs : `INVALID_OTP, OTP_EXPIRED, OTP_TOO_MANY_ATTEMPTS, RESEND_TOO_SOON, PHONE_INVALID, EMAIL_INVALID, PROVIDER_ERROR, EMAIL_CONFLICT, ALREADY_LINKED, LAST_AUTH_METHOD, PARENTAL_CONSENT_REQUIRED, GUEST_UPGRADE_REQUIRED`.

Rate limits OTP (en plus de 08-§7) : `5 codes/h/numéro+email`, `5 vérifs/challenge`, `20/h/IP`, backoff resend 60s. Réponses génériques (`Code envoyé si le compte existe`).

## 5. Sauvegarde — locale + cloud + reprise (zéro perte cible)

- **Locale (toujours, même invité/offline)** : `localStorage ludo:v1:{session en cours après chaque réponse, prefs, file offline}` + `IndexedDB {assets, historique 10 blocs}`. Limites opposables : file offline ≤ 500 réponses (≈ 12 sessions arcade complètes) + `sessions/active` ≤ 1/exo/mode ; au-delà → blocage arcade offline avec message `Reconnecte-toi pour synchroniser` (training reste illimité local, purge FIFO 10 blocs). Versionnée + migration auto. Bandeau invité `Non sauvegardé ☁️❌ → [Sauvegarder]`.
- **Cloud auto-save** : chaque `POST answers` persiste déjà (RPO ≈ 0). `PUT /api/progress/sync {clientProgress, clientPrefs, at}` idempotent : arcade scores = serveur gagne (anti-triche), training compteurs + prefs = merge (max/union, `updatedAt` fait foi). Réponse `{merged, conflicts:[{scope, resolution:server|merge}]}` affichée front (toast `Score serveur conservé` si conflit arcade).
- **Reprise** : `GET /api/sessions/active` → arcade reprend au niveau interrompu (même seed, vies reset), training reprend au bloc (nouveau seed même niveau). 1 session active/exo/mode (409 + proposition `Reprendre`/`Abandonner`). Multi-device : arcade = dernier écrivain gagne + perdant notifié (`session:superseded` WS, bannière `Session reprise ailleurs`) ; training = mergeable par clé `questionHash` (union sans double-compte, `updatedAt` max pour prefs, compteurs = max serveur/client par exo/niveau).
- **Backup/produit** : dumps Postgres quotidiens + PITR 7j, Redis AOF (ranking reconstructible depuis Postgres). Export user 1 clic + suppression cascade 30j max (08/10). Suppression guest : `DELETE /api/auth/me` guest = purge locale + serveur léger immédiate, sans réserve pseudo 30j (pseudo guest libéré aussitôt, pas d'anti-usurpation).
- **Offline** : file persistée, pastille `Hors ligne`, resync auto au retour ; arcade sync avant dimanche 23:59 UTC pour ranking, sinon stats perso seules.

## 6. UX auth (pointeur + clavier hors jeu autorisé — voir 04)

Écran `/login` : 4 gros boutons pointeur `[G Continuer avec Google] [ Continuer avec Apple] [✉️ Email] [💬 Téléphone / WhatsApp]` + lien `[Jouer sans compte]`. Email → champ + `[Envoyer le code]` (pavé tactile + clavier OK hors jeu). OTP → 6 cases larges (auto-advance pointeur, collage autorisé, pavé numérique tactile), timer resend, `[Renvoyer]`, `[Changer de numéro]`, fallback `[Recevoir par SMS]`. Erreurs FR non énumératives. Apple/Google = boutons officiels, redirect + loader `Vérification…`.

## 7. Tests & DoD auth/sauvegarde

- Unitaires : normalisation E.164/email, hash OTP, merge sync, cap XP training, `rankingPublic` défaut enfant.
- Intégration (mocks OIDC/Twilio/WhatsApp) : register→login→link→unlink→last-method-refusé, OTP expiry/5 essais/resend-cooldown, invité→upgrade conserve XP/sessions, sync conflit (serveur gagne arcade, merge training), delete cascade.
- E2E : 4 parcours (Google, Apple relay, email code, phone WhatsApp→SMS fallback) + invité→sauvegarde + reprise multi-device + offline→resync. Secrets en CI uniquement, jamais en logs.
