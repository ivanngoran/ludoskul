# Runbook — Demande suppression (voir 20-§4 + BE-6.4)

1. Vérifier identité : password OU OTP OU OAuth frais (< 10 min).
2. Proposer export JSON avant (1 clic, < 5s : profil, identités, sessions, progress, badges, devices, consentements).
3. `DELETE /api/auth/me` (ou `DELETE /api/family/children/:id` parent) : cascade Identity/Otp/Device/Session/Answer/Ranking/Progress + libération email/tél immédiate + pseudo réservé 30j (`DeletedPseudo`).
4. Vérifier : login impossible, ranking retiré ≤ 60s, pseudo réservé 30j.
5. SLA 30j max (immédiat en DB prod). Preuve : log sans PII + confirmation FR.
6. Guest : purge immédiate sans réserve 30j (voir 08b-§5).
