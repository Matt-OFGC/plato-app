-- Restore System Admin Column
-- This migration restores the `isAdmin` column for system admin backend access
-- System admin is separate from company-level permissions (which use membership.role)
-- Date: 2025-01-22
-- Risk: Low (only adds column, doesn't remove data)

-- Step 1: Add isAdmin column if it doesn't exist
-- This column ONLY controls access to /system-admin/* backend
-- Company-level permissions use membership.role (ADMIN, MANAGER, STAFF)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT false;

-- Step 2: Ensure all existing users have isAdmin = false (safety check)
UPDATE "User" SET "isAdmin" = false WHERE "isAdmin" IS NULL;

-- Step 3: Set isAdmin = true for plato328@admin.com if account exists
UPDATE "User" 
SET "isAdmin" = true 
WHERE email = 'plato328@admin.com' AND "isActive" = true;

-- Step 4: Add comment to document the column's purpose
COMMENT ON COLUMN "User"."isAdmin" IS 'System admin access for /system-admin/* backend only. Separate from company-level permissions (membership.role).';

-- Verification: Check that column was added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'isAdmin'
    ) THEN
        RAISE EXCEPTION 'Failed to add isAdmin column';
    END IF;
END $$;


