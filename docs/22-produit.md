# 22 — Produit : marque, landing, help, PWA/SEO, templates OTP

> Tranche 13-I (marque), 13-F (zéro push), 13-K (temps d'écran v1.1). Bloque le go-live : domaine, nom expéditeur OTP, manifest PWA, pages publiques.

## 1. Marque et domaine (à figer avant landing — bloquant go-live)

| Élément                                              | Cible                                                                            | Statut à figer (nom + date) |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| Nom `Ludoskul`                                       | définitif sauf opposition — vérifier dépôt/INPI avant launch                     | ☐ vérifié le … par …        |
| Domaine                                              | `ludoskul.app` (cible ; repli `.fr`) — dispo + DNS + TLS vérifiés                | ☐ réservé le …              |
| Nom expéditeur OTP/mails                             | `Ludoskul` (WhatsApp/SMS/email — voir §5)                                        | ☐ configuré le …            |
| Logo + mascottes (renard calcul, caméléon géométrie) | commande unique, licence **cession complète** (SVG sources dans `assets/brand/`) | ☐ cédé le …                 |
| Sons jeu                                             | licence libre/CC0 listée (`assets/AUDIO-LICENSES.md`)                            | ☐ listé le …                |
| Voix TTS                                             | voix MP3 consignes unique, ton enfant, débit lent (voir 18-§2)                   | ☐ enregistrée le …          |

- Ton : voir 04 (encourageant, bref, FR simple). Voix TTS = voix MP3 consignes (18-§2).
- Sans ces 6 cases cochées : pas de landing, pas de manifest PWA, pas de templates OTP (nom expéditeur requis).

## 2. Landing publique `/` (hors auth)

- Sections : promesse (gratuit, sans pub, 6-14 ans) → 2 modes (🛠️/🏆) → 6 exos pilote → parents (famille, export/suppression, zéro pub) → FAQ courte → CTA `[Jouer]` + `[Se connecter]`.
- Exigences : LCP < 2 s, pas de tracker pub, liens CGU/confidentialité/mentions, `og:`/Twitter cards, JSON-LD `WebApplication` (gratuit, tranche d'âge, langue FR).

## 3. Help `/help` + FAQ (FR, parents + enfants)

- Enfants : comment jouer (pointeur, vies arcade, training infini), TTS 🔊, que faire si bloqué (aide, niveau plus facile).
- Parents : compte < 15 ans, consentement, ranking OFF par défaut, temps d'écran (conseil 20 min + pause — rappel doux **v1.1**, pas de blocage MVP), export/suppression, contact privacy.
- Enseignants : pilote = entraînement ludique **non noté** ; classe = v2.

## 4. PWA + SEO

- Manifest : nom, icônes 192/512 (mascotte), `theme_color`/`background_color`, `display:standalone`, `lang:fr`. Service worker : cache assets/TTS/questions, file answers offline, resync auto.
- SEO : title/description FR par page publique, sitemap, robots, canoniques, 404 FR joueuse.

## 5. Templates OTP (transactionnels uniquement)

- WhatsApp (template approuvé FR) : `Votre code Ludoskul : {{1}}. Il expire dans 5 minutes. Ne le partagez jamais.`
- SMS fallback : identique, expéditeur `Ludoskul`. Email code : sujet `Votre code Ludoskul (15 min)`, corps : code + rappel + lien magique optionnel.
- Règles : jamais de marketing dans ces canaux, quotas 08b (5/h/numéro), coûts suivis (21-§2). **Aucune push notification au MVP.**

## Checklist

- [ ] Marque/domaine/licences figés
- [ ] Landing + help + FAQ en ligne, SEO/PWA validés (Lighthouse, manifest, SW offline)
- [ ] Templates OTP approuvés (WhatsApp) + expéditeur configuré
