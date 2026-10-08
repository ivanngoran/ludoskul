-- BE-2.1 : cible chiffrée du challenge (lien magique one-shot réversible côté serveur).
-- Le hash seul ne permet pas de retrouver l'email ; le chiffré AES-256-GCM oui.

-- AlterTable
ALTER TABLE "OtpChallenge" ADD COLUMN "targetEncrypted" TEXT;
