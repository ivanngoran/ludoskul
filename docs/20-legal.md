# 20 — Légal : CGU, confidentialité, consentement parental, registre

> Public 6-14 ans, FR 15 ans autonomie (08b-§2). Zéro pub, zéro revente. Modèles ci-dessous à faire relire par un juriste avant launch — la structure et les points obligatoires sont figés ici.

## 1. Documents publics (FR, lecture parent + enfant)

- **CGU** : objet ludique non noté, 2 modes, ranking arcade-only, pointeur-seul en jeu (souris/doigt, pas de clavier — dérogation WCAG 2.1.1 tracée en 10-§1, clavier requis hors jeu, alternative parent/enseignant pour lancer la partie), comptes (providers, invité), famille, suppression, signalement pseudos, contact `contact@<domaine>`.
- **Politique de confidentialité** : données collectées (profil, identités vérifiées, sessions/answers, progress, devices, logs sans PII), finalités (jeu, ranking, anti-triche, sécurité), bases légales, durées (voir §3), droits (export/suppression), contact `privacy@<domaine>` (réponse 72 h), hébergeurs UE listés.
- **Mentions légales** : éditeur, hébergement, directeur publication.
- Versionning : chaque document a `version + date`, historique conservé, acceptation horodatée au register / création enfant.

## 2. Consentement parental (< 15 ans, FR)

- Texte figé v1 (08b) : le parent crée le compte, déclare son lien, consent à : profil enfant (pseudo/avatar/âge approx, **sans email/téléphone**), progression visible parent, ranking public **OFF par défaut** (opt-in explicite séparé), export/suppression à tout moment.
- Preuve : `parentId + consentAt + consentText=v1` stockés (Family). Changement de version = re-consentement au prochain login parent.
- Enfant ≥ 15 ans : case âge + CGU/confidentialité en autonomie.

## 3. Registre des traitements (extrait opposable)

| Traitement                | Données                                            | Base légale                                    | Durée (+ justification)                                                 |
| ------------------------- | -------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Comptes + identités       | pseudo, email/tél vérifiés (tél chiffré), provider | Consentement / contrat                         | Compte actif + 30 j (pseudo réservé anti-usurpation)                    |
| Consentements parentaux   | parentId, texte v1, date                           | Obligation légale (mineurs)                    | Compte enfant + 3 ans (preuve prescription — à valider juriste)         |
| Sessions/Answers/Progress | scores, temps, précision                           | Contrat (jeu) + intérêt légitime (anti-triche) | 13 mois détail (CNIL jeux/mesure audience), agrégats anonymisés ensuite |
| Ranking hebdo             | pseudo, score, temps                               | Intérêt légitime                               | Semaine + archive 3 ans anonymisée (`joueur_#`)                         |
| OTP                       | hash code, tentatives                              | Sécurité (intérêt légitime)                    | 30 j puis purge                                                         |
| Logs techniques           | request-id, userId hashé (jamais PII)              | Intérêt légitime                               | 12 mois                                                                 |
| Devices/refresh           | hash token, appareil                               | Sécurité                                       | Révocation ou 7 j                                                       |

Manquants à cadrer avec le juriste avant launch (bloquant go-live) : DPO désigné (nom + contact), AIPD mineurs (jeu 6-14 ans + ranking public), procédure violation 72h (détection → notification CNIL/personnes), DPA hébergeurs UE listés (Vercel/Railway/Render : localisation + contrat), base `intérêt légitime` ranking/anti-triche (test de proportionnalité noté).

## 4. Droits et preuves

- Export JSON 1 clic (BE-6.4) : profil, identités, sessions, progress 2 volets, badges, devices, consentements. < 5 s.
- Suppression : vérification (password/OTP/OAuth), cascade 08/08b, ranking retiré ≤ 60 s, email/tél libérés immédiat, pseudo réservé 30 j.
- Signalement pseudo : 1 tap, revue < 48 h, sanctions graduées, audit log 1 an (09-§4).

## Checklist

- [ ] CGU + confidentialité + mentions publiées, versionnées, acceptation horodatée
- [ ] Texte consentement v1 figé + re-consentement sur changement
- [ ] Registre complété + export/suppression testés E2E
- [ ] Relecture juriste notée (nom + date)
