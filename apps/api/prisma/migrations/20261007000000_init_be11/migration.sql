-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('CALCUL', 'NOMBRES', 'MESURES', 'GEOMETRIE', 'LOGIQUE');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('TRAINING', 'ARCADE');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple', 'email', 'phone', 'guest', 'microsoft', 'passkey');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "pseudo" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL DEFAULT 'fox',
    "country" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "accessibility" JSONB NOT NULL DEFAULT '{}',
    "birthYear" INTEGER,
    "isChild" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "rankingPublic" BOOLEAN NOT NULL DEFAULT true,
    "guest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerSub" TEXT NOT NULL,
    "emailLower" TEXT,
    "phoneHash" TEXT,
    "phoneE164Encrypted" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "targetHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resendAvailableAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'appareil',
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentText" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" "ExerciseCategory" NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "help" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "seedBase" TEXT NOT NULL,
    "startLevel" INTEGER NOT NULL,
    "maxLevel" INTEGER NOT NULL DEFAULT 1,
    "blockIndex" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "trainingScore" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "stopped" BOOLEAN NOT NULL DEFAULT false,
    "assisted" BOOLEAN NOT NULL DEFAULT false,
    "offline" BOOLEAN NOT NULL DEFAULT false,
    "keyboard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "level" INTEGER NOT NULL,
    "blockIndex" INTEGER NOT NULL DEFAULT 0,
    "questionIndex" INTEGER NOT NULL,
    "questionHash" TEXT NOT NULL,
    "chosen" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "inputMode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "timeSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLevel" INTEGER NOT NULL DEFAULT 1,
    "rank" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "bestScoreArcade" INTEGER NOT NULL DEFAULT 0,
    "bestAccuracyArcade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLevelArcade" INTEGER NOT NULL DEFAULT 0,
    "totalSessionsArcade" INTEGER NOT NULL DEFAULT 0,
    "trainingQuestions" INTEGER NOT NULL DEFAULT 0,
    "trainingAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trainingLevelsPracticed" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "lastPlayed" TIMESTAMP(3),
    "lastTrainingAt" TIMESTAMP(3),

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "xpBonus" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT 'medal',

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeCode" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRefresh" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthRefresh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletedPseudo" (
    "id" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedPseudo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_pseudo_key" ON "User"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_emailLower_key" ON "Identity"("emailLower");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_phoneHash_key" ON "Identity"("phoneHash");

-- CreateIndex
CREATE INDEX "Identity_userId_idx" ON "Identity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_provider_providerSub_key" ON "Identity"("provider", "providerSub");

-- CreateIndex
CREATE UNIQUE INDEX "Device_refreshTokenHash_key" ON "Device"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Family_childUserId_key" ON "Family"("childUserId");

-- CreateIndex
CREATE INDEX "Family_parentUserId_idx" ON "Family"("parentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_code_key" ON "Exercise"("code");

-- CreateIndex
CREATE INDEX "Session_userId_exerciseId_mode_createdAt_idx" ON "Session"("userId", "exerciseId", "mode", "createdAt");

-- CreateIndex
CREATE INDEX "Ranking_exerciseId_weekStart_score_idx" ON "Ranking"("exerciseId", "weekStart", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_userId_exerciseId_weekStart_key" ON "Ranking"("userId", "exerciseId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_exerciseId_key" ON "Progress"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeCode_key" ON "UserBadge"("userId", "badgeCode");

-- CreateIndex
CREATE UNIQUE INDEX "AuthRefresh_tokenHash_key" ON "AuthRefresh"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "DeletedPseudo_pseudo_key" ON "DeletedPseudo"("pseudo");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Identity" ADD CONSTRAINT "Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeCode_fkey" FOREIGN KEY ("badgeCode") REFERENCES "Badge"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthRefresh" ADD CONSTRAINT "AuthRefresh_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

