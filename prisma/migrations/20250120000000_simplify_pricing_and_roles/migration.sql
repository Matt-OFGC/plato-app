-- AlterTable: Add aiSubscriptionType to Subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "aiSubscriptionType" TEXT;

-- AlterTable: Update Subscription tier default (no migration needed, just default for new records)
-- Existing records keep their current tier values

-- AlterTable: Add subscriptionType to MentorSubscription
ALTER TABLE "MentorSubscription" ADD COLUMN IF NOT EXISTS "subscriptionType" TEXT DEFAULT 'unlimited';

-- AlterEnum: Change MemberRole enum
-- First, add new enum values
DO $$ BEGIN
    CREATE TYPE "MemberRole_new" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing records to map old roles to new ones
UPDATE "Membership" SET "role" = 'ADMIN' WHERE "role" = 'OWNER';
UPDATE "Membership" SET "role" = 'ADMIN' WHERE "role" = 'ADMIN' AND "role"::text NOT IN ('ADMIN', 'MANAGER', 'EMPLOYEE');
UPDATE "Membership" SET "role" = 'MANAGER' WHERE "role" = 'EDITOR';
UPDATE "Membership" SET "role" = 'EMPLOYEE' WHERE "role" = 'VIEWER';

-- Alter the column to use the new enum
ALTER TABLE "Membership" ALTER COLUMN "role" TYPE "MemberRole_new" USING ("role"::text::"MemberRole_new");

-- Drop old enum and rename new one
DROP TYPE IF EXISTS "MemberRole";
ALTER TYPE "MemberRole_new" RENAME TO "MemberRole";

-- Update User subscriptionTier defaults (for new records only, existing records unchanged)
-- No migration needed as this is just a default value

