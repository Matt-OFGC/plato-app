-- Create OAuthAccount table
CREATE TABLE IF NOT EXISTS "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- Create MfaDevice table
CREATE TABLE IF NOT EXISTS "MfaDevice" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret" TEXT,
    "credentialId" TEXT,
    "publicKey" TEXT,
    "phoneNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaDevice_pkey" PRIMARY KEY ("id")
);

-- Create indexes for OAuthAccount
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthAccount_provider_providerId_key" ON "OAuthAccount"("provider", "providerId");
CREATE INDEX IF NOT EXISTS "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");
CREATE INDEX IF NOT EXISTS "OAuthAccount_provider_providerId_idx" ON "OAuthAccount"("provider", "providerId");

-- Create indexes for MfaDevice
CREATE INDEX IF NOT EXISTS "MfaDevice_userId_idx" ON "MfaDevice"("userId");
CREATE INDEX IF NOT EXISTS "MfaDevice_userId_type_idx" ON "MfaDevice"("userId", "type");

-- Add foreign key constraints
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MfaDevice" ADD CONSTRAINT "MfaDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

