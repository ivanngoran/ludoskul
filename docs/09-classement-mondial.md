# 09 — Classement Mondial (Arcade uniquement — Spec Opposable)

> Un ranking arcade par exercice (26 rankings). Reset hebdomadaire. Temps réel < 2s. **Training jamais classé.**

## 1. Périmètre et saisons

- Clé ranking : `(exerciseCode, weekStart, mode=ARCADE)`. `weekStart` = lundi 00:00:00 UTC (ISO week).
- Seule session `mode=ARCADE, completed=true, assisted=false, offline sync avant fin semaine` compte. `TRAINING`, `stopped`, `abandon` = exclus d'office.
- Retenu par user/semaine/exercice : **meilleur score arcade**. Si égalité score → voir §2.
- Reset : lundi 00:00 UTC, job cron : fige `rank` final semaine N-1 (archivé, consultable `?period` historique), crée semaine N vide, attribue badges Top.
- `month` = meilleur `weekScore` arcade du mois civil. `all` = `Progress.bestScoreArcade` (jamais reset). Training visible uniquement dans profil (`trainingQuestions`, pas de rang).

## 2. Tri et ex-aequo (ordre total, déterministe)

```
1. score DESC
2. accuracy DESC
3. timeSpent ASC (plus rapide gagne)
4. finishedAt ASC (plus tôt gagne)
5. userId ASC (stable)
```

Rang standard competition ranking (`1,2,2,4` : ex-aequo même rang, rang suivant sauté). Affichage `ex #247`. Pas de rang 0.

## 3. Affichage (voir maquettes 04)

- Top 100 + bloc `Moi ±3` (toujours visible même si #12 458).
- Colonnes : rang, pseudo, avatar, pays (si renseigné), score, précision. Temps en tooltip / détail.
- Filtres : Semaine / Mois / Tout temps. Défaut : Semaine.
- Live : pastille `● en direct`, surlignage ligne qui bouge (slide 500ms), toast `Tu passes #246 !`.
- Pseudonymes : 3-16 chars, modération (liste interdite + signalement). Pas de nom réel, pas d'email visible.
- Mineurs : pays optionnel, jamais ville/école. Pas de DM, pas de chat (volontaire).

## 4. Anti-triche (5 couches)

1. **Contrats** : jamais de bonne réponse côté client avant envoi ; `questionHash` vérifié ; `timeMs ≤ limite+1000`, sinon `422`.
2. **Recalcul serveur** : score recalculé depuis `Answer[]` avec formule 07. Si `score_soumis ≠ score_recalculé` → session invalidée + log.
3. **Heuristiques** : flag si `temps_moyen < 600ms` avec précision > 95% (bot), ou `45/45 en < 60s` (impossible humain vu temps lecture), ou > 20 sessions/h même exo.
4. **Rate + device** : limites §08-7, 1 session active par user/exo, refresh token rotation détecte partage compte.
5. **Modération** : signalement 1 clic (`Signaler ce pseudo`), revue < 48h, sanctions graduées : avertissement → retrait semaine → ban ranking (jamais ban jeu sauf fraude massive). Audit log conservé 1 an.

Faux positifs : enfant surdoué rapide → jamais banni auto, seulement `review` humaine. Message : `Score en vérification, reviens bientôt !` pas `Tricheur !`.

## 5. Performance ranking

- Écriture : `POST complete` → upsert Ranking + `ZADD redis exercise:{code}:{week} score member=userId` (score composite `score*1e6 - timeSpent` pour tri Redis) + publish WS.
- Lecture Top 100 : Redis `ZREVRANGE 0 99` + hydrate Postgres (pseudo/avatar) cachée 5s. Fallback Postgres si Redis down.
- Rang user : `ZREVRANK` O(log N). `Autour ±3` : `ZREVRANGE rank-3..rank+3`.
- Objectif : p95 `GET ranking` < 150ms, `WS update` < 2s après complete, 10k users simultanés par room sans dégradation (rooms sharded par exercice).

## 6. Cas limites

- Semaine sans session : `me=null`, CTA `Joue ton premier score !`.
- Égalité parfaite : même rang affiché, ordre userId stable (pas de flicker).
- Changement pseudo en cours de semaine : ranking affiche nouveau pseudo (userId fait foi), historique garde ancien + nouveau.
- Suppression compte : ligne supprimée immédiatement (RGPD), rangs recalculés au prochain tick (≤ 60s).
- `assisted=true`, abandon, ou toute session training : jamais en ranking, visibles uniquement dans `progress` perso (training) avec mention 🛠️.
