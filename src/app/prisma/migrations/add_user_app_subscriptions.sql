-- Migration: Add UserAppSubscription model for user-level app subscriptions
-- This allows users to subscribe to multiple apps (e.g., Plato Bake, Plato Scheduling)
-- instead of having apps tied to companies

-- Step 1: Create UserAppSubscription table
CREATE TABLE IF NOT EXISTS "UserAppSubscription" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
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

-- Step 2: Create unique constraint on userId + app
CREATE UNIQUE INDEX IF NOT EXISTS "UserAppSubscription_userId_app_key" ON "UserAppSubscription"("userId", "app");

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS "UserAppSubscription_userId_idx" ON "UserAppSubscription"("userId");
CREATE INDEX IF NOT EXISTS "UserAppSubscription_userId_status_idx" ON "UserAppSubscription"("userId", "status");
CREATE INDEX IF NOT EXISTS "UserAppSubscription_app_idx" ON "UserAppSubscription"("app");

-- Step 4: Create unique constraint on stripeSubscriptionId (if provided)
CREATE UNIQUE INDEX IF NOT EXISTS "UserAppSubscription_stripeSubscriptionId_key" ON "UserAppSubscription"("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "UserAppSubscription" 
ADD CONSTRAINT "UserAppSubscription_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Add comment to document the table
COMMENT ON TABLE "UserAppSubscription" IS 'Tracks which apps each user has subscribed to. Users can have multiple app subscriptions.';

