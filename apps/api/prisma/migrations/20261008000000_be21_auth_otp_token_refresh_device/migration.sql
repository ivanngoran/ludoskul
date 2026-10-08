-- BE-2.1 : lien magique one-shot (tokenHash unique) + liaison refresh/device.
-- tokenHash nullable (code OTP seul sans magic link) : index unique partiel
-- pour accepter plusieurs NULL (Postgres les autorise en UNIQUE de toute façon).

-- AlterTable
ALTER TABLE "AuthRefresh" ADD COLUMN "deviceId" TEXT;

-- AlterTable
ALTER TABLE "OtpChallenge" ADD COLUMN "tokenHash" TEXT;

-- CreateIndex
CREATE INDEX "AuthRefresh_deviceId_idx" ON "AuthRefresh"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "OtpChallenge_tokenHash_key" ON "OtpChallenge"("tokenHash");
