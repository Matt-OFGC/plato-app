-- MVP Simplification Migration
-- This migration simplifies the app to MVP-only features
-- WARNING: This will drop many tables and data. Backup your database first!

-- Step 1: Update MemberRole enum (EMPLOYEE -> STAFF)
-- Note: PostgreSQL doesn't support renaming enum values directly, so we need to:
-- 1. Add new value
-- 2. Update existing records
-- 3. Remove old value (if no references)

-- Add STAFF to enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STAFF' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MemberRole')) THEN
        ALTER TYPE "MemberRole" ADD VALUE 'STAFF';
    END IF;
END $$;

-- Update existing EMPLOYEE records to STAFF
UPDATE "Membership" SET role = 'STAFF' WHERE role = 'EMPLOYEE';

-- Step 2: Add staffPermissions field to Membership
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "staffPermissions" Json;

-- Step 3: Remove isAdmin from User (use membership role instead)
ALTER TABLE "User" DROP COLUMN IF EXISTS "isAdmin";

-- Step 4: Simplify Subscription model
-- Remove fields that are now calculated from tier
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "maxIngredients";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "maxRecipes";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "aiSubscriptionType";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "metadata";

-- Update default values
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'free';
ALTER TABLE "Subscription" ALTER COLUMN "tier" SET DEFAULT 'free';
ALTER TABLE "Subscription" ALTER COLUMN "price" SET DEFAULT 0;

-- Step 5: Update User subscription defaults
ALTER TABLE "User" ALTER COLUMN "subscriptionTier" SET DEFAULT 'free';
ALTER TABLE "User" ALTER COLUMN "subscriptionStatus" SET DEFAULT 'free';

-- Step 6: Remove Company fields that are no longer needed
ALTER TABLE "Company" DROP COLUMN IF EXISTS "shopifyAccessToken";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "shopifyApiKey";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "shopifyIsConnected";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "shopifyLastSync";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "shopifyStoreUrl";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "shopifyWebhookSecret";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "safety_enabled";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "data_retention_days";
ALTER TABLE "Company" DROP COLUMN IF EXISTS "brand";

-- Step 7: Drop non-MVP tables
-- WARNING: This will delete all data in these tables!

DROP TABLE IF EXISTS "AnalyticsSnapshot" CASCADE;
DROP TABLE IF EXISTS "ChecklistItemCompletion" CASCADE;
DROP TABLE IF EXISTS "Collection" CASCADE;
DROP TABLE IF EXISTS "RecipeCollection" CASCADE;
DROP TABLE IF EXISTS "DailyTemperatureCheck" CASCADE;
DROP TABLE IF EXISTS "EquipmentIssue" CASCADE;
DROP TABLE IF EXISTS "EquipmentRegister" CASCADE;
DROP TABLE IF EXISTS "ExternalMapping" CASCADE;
DROP TABLE IF EXISTS "FeatureModule" CASCADE;
DROP TABLE IF EXISTS "IntegrationConfig" CASCADE;
DROP TABLE IF EXISTS "IntegrationSync" CASCADE;
DROP TABLE IF EXISTS "LeaveBalance" CASCADE;
DROP TABLE IF EXISTS "LeaveRequest" CASCADE;
DROP TABLE IF EXISTS "MfaDevice" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "OAuthAccount" CASCADE;
DROP TABLE IF EXISTS "PayrollIntegration" CASCADE;
DROP TABLE IF EXISTS "PayrollLine" CASCADE;
DROP TABLE IF EXISTS "PayrollRun" CASCADE;
DROP TABLE IF EXISTS "PayrollSyncLog" CASCADE;
DROP TABLE IF EXISTS "ScheduledTask" CASCADE;
DROP TABLE IF EXISTS "Shift" CASCADE;
DROP TABLE IF EXISTS "ShiftTemplate" CASCADE;
DROP TABLE IF EXISTS "ShopifyOrder" CASCADE;
DROP TABLE IF EXISTS "ShopifyOrderItem" CASCADE;
DROP TABLE IF EXISTS "ShopifyProductMapping" CASCADE;
DROP TABLE IF EXISTS "SmartAlert" CASCADE;
DROP TABLE IF EXISTS "TaskComment" CASCADE;
DROP TABLE IF EXISTS "TaskCompletion" CASCADE;
DROP TABLE IF EXISTS "TaskInstance" CASCADE;
DROP TABLE IF EXISTS "TaskPhoto" CASCADE;
DROP TABLE IF EXISTS "TaskTemplate" CASCADE;
DROP TABLE IF EXISTS "TemperatureReading" CASCADE;
DROP TABLE IF EXISTS "TemperatureRecord" CASCADE;
DROP TABLE IF EXISTS "TemperatureSensor" CASCADE;
DROP TABLE IF EXISTS "TemplateAppliance" CASCADE;
DROP TABLE IF EXISTS "TemplateChecklistItem" CASCADE;
DROP TABLE IF EXISTS "Timesheet" CASCADE;
DROP TABLE IF EXISTS "WebhookLog" CASCADE;
DROP TABLE IF EXISTS "Inventory" CASCADE;
DROP TABLE IF EXISTS "InventoryMovement" CASCADE;

-- Step 8: Migrate existing roles
-- OWNER -> ADMIN (if any exist)
UPDATE "Membership" SET role = 'ADMIN' WHERE role = 'OWNER';
-- EDITOR -> MANAGER
UPDATE "Membership" SET role = 'MANAGER' WHERE role = 'EDITOR';
-- VIEWER -> STAFF
UPDATE "Membership" SET role = 'STAFF' WHERE role = 'VIEWER';

-- Step 9: Update all users to free tier if not already set
UPDATE "User" SET "subscriptionTier" = 'free', "subscriptionStatus" = 'free' 
WHERE "subscriptionTier" IS NULL OR "subscriptionTier" NOT IN ('free', 'paid');

-- Step 10: Update all subscriptions to free tier if not already set
UPDATE "Subscription" SET "tier" = 'free', "status" = 'free', "price" = 0
WHERE "tier" IS NULL OR "tier" NOT IN ('free', 'paid');

-- Step 11: Remove Brand enum if it exists (no longer used)
-- Note: We can't drop enum types if they're still referenced, so this is commented out
-- DROP TYPE IF EXISTS "Brand" CASCADE;

