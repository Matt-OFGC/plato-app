-- Migration: Fix Recipe Category Fields (Cleanup) - DISABLED
-- Date: 2025-01-15 16:00:02
-- Description: Removes deprecated category field after cutover period
-- Status: DISABLED - Enable only after 1 week of stable production metrics
-- Run AFTER: 20250115160001_fix_recipe_category_fields_cutover.sql (after stability period)

-- WARNING: This migration is DESTRUCTIVE and removes a column
-- Only enable after:
-- 1. All code has been migrated to use categoryId
-- 2. 1 week of stable production metrics
-- 3. Zero queries reference Recipe.category
-- 4. Feature flag enabled

-- Check if cleanup is enabled (set via environment variable or feature flag)
DO $$
DECLARE
  cleanup_enabled BOOLEAN := FALSE; -- Set to TRUE to enable cleanup
BEGIN
  IF NOT cleanup_enabled THEN
    RAISE EXCEPTION 'Cleanup migration is disabled. Set cleanup_enabled = TRUE to proceed.';
  END IF;
END $$;

-- Pre-flight: Verify no code references Recipe.category
-- Check for any remaining references (this is a safety check)
DO $$
DECLARE
  -- In production, you might query pg_stat_statements or application logs
  -- For now, we'll just warn
BEGIN
  RAISE WARNING 'Before removing category field, verify:';
  RAISE WARNING '1. All application code uses categoryId';
  RAISE WARNING '2. No API endpoints return category field';
  RAISE WARNING '3. Database queries use categoryId';
  RAISE WARNING '4. Prisma schema updated to remove category field';
END $$;

-- Step 1: Remove CHECK constraint (no longer needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recipe_category_consistency_check'
  ) THEN
    ALTER TABLE "Recipe" DROP CONSTRAINT "recipe_category_consistency_check";
    RAISE NOTICE 'Removed CHECK constraint: recipe_category_consistency_check';
  END IF;
END $$;

-- Step 2: Remove trigger (no longer needed)
DROP TRIGGER IF EXISTS sync_recipe_category_trigger ON "Recipe";
DROP FUNCTION IF EXISTS sync_recipe_category_from_id();

RAISE NOTICE 'Removed dual-write trigger';

-- Step 3: Remove index on category field (if exists)
DROP INDEX IF EXISTS "Recipe_category_idx";

-- Step 4: Remove category column
-- NOTE: This is a DESTRUCTIVE operation - cannot be rolled back easily
-- Ensure you have a backup before running this
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Recipe' AND column_name = 'category'
  ) THEN
    ALTER TABLE "Recipe" DROP COLUMN category;
    RAISE NOTICE 'Removed deprecated category column';
  ELSE
    RAISE NOTICE 'Category column already removed';
  END IF;
END $$;

-- Post-migration verification
SELECT 
  'Cleanup verification' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Recipe' AND column_name = 'category'
    ) THEN 'COLUMN STILL EXISTS'
    ELSE 'COLUMN REMOVED'
  END as status;

-- Note: After this migration, update Prisma schema to remove category field
-- Run: npx prisma migrate dev --name remove_recipe_category_field


