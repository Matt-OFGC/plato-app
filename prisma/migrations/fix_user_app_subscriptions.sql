-- Migration: Fix User App Subscriptions Schema
-- This migration adds the UserAppSubscription model and App enum if they don't exist
-- Date: 2025-12-12
--
-- IMPORTANT: Run this migration manually if you encounter "Failed to fetch users" error
-- in the admin dashboard. This ensures the database schema matches the Prisma schema.

-- Step 1: Create App enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "App" AS ENUM ('plato', 'plato_bake');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Create UserAppSubscription table if it doesn't exist
CREATE TABLE IF NOT EXISTS "UserAppSubscription" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER NOT NULL,
  "app" "App" NOT NULL,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "UserAppSubscription_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create unique constraint on userId + app (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "UserAppSubscription_userId_app_key"
ON "UserAppSubscription"("userId", "app");

-- Step 4: Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS "UserAppSubscription_userId_idx"
ON "UserAppSubscription"("userId");

CREATE INDEX IF NOT EXISTS "UserAppSubscription_userId_status_idx"
ON "UserAppSubscription"("userId", "status");

CREATE INDEX IF NOT EXISTS "UserAppSubscription_app_idx"
ON "UserAppSubscription"("app");

-- Step 5: Create unique constraint on stripeSubscriptionId (if provided)
CREATE UNIQUE INDEX IF NOT EXISTS "UserAppSubscription_stripeSubscriptionId_key"
ON "UserAppSubscription"("stripeSubscriptionId")
WHERE "stripeSubscriptionId" IS NOT NULL;

-- Step 6: Add foreign key constraint (if not exists)
DO $$ BEGIN
  ALTER TABLE "UserAppSubscription"
  ADD CONSTRAINT "UserAppSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 7: Add table comment
COMMENT ON TABLE "UserAppSubscription" IS 'Tracks which apps each user has subscribed to. Users can have multiple app subscriptions.';

-- Verification query - uncomment to run after migration
-- SELECT COUNT(*) as table_exists FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'UserAppSubscription';
