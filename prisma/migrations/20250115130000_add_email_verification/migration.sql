-- AddEmailVerification
-- Add email verification fields to User table

ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationTokenExpiresAt" TIMESTAMP(3);

-- Create unique index for verification token
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

