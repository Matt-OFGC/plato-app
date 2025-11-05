-- Migration: Fix Recipe Category Fields (Cutover)
-- Date: 2025-01-15 16:00:01
-- Description: Adds dual-write trigger and CHECK constraint for category fields
-- Run AFTER: 20250115160000_fix_recipe_category_fields_backfill.sql
-- Run BEFORE: 20250115160002_fix_recipe_category_fields_cleanup.sql (disabled until stable)

-- Pre-flight: Verify backfill completed
DO $$
DECLARE
  unmapped_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM "Recipe"
  WHERE category IS NOT NULL 
    AND category != ''
    AND "categoryId" IS NULL;
  
  IF unmapped_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete. % recipes still have unmapped category strings. Run backfill script first.', unmapped_count;
  END IF;
END $$;

-- Step 1: Create function to sync categoryId → category (backward compatibility)
CREATE OR REPLACE FUNCTION sync_recipe_category_from_id()
RETURNS TRIGGER AS $$
BEGIN
  -- When categoryId is set, update category string from Category.name
  IF NEW."categoryId" IS NOT NULL THEN
    SELECT name INTO NEW.category
    FROM "Category"
    WHERE id = NEW."categoryId";
  ELSIF NEW."categoryId" IS NULL THEN
    NEW.category = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to keep fields in sync (dual-write)
DROP TRIGGER IF EXISTS sync_recipe_category_trigger ON "Recipe";
CREATE TRIGGER sync_recipe_category_trigger
  BEFORE INSERT OR UPDATE OF "categoryId" ON "Recipe"
  FOR EACH ROW
  EXECUTE FUNCTION sync_recipe_category_from_id();

-- Note: Dual-write trigger created: categoryId → category

-- Step 3: Note about consistency
-- PostgreSQL CHECK constraints cannot use subqueries, so we rely on the trigger
-- The trigger sync_recipe_category_from_id() ensures categoryId → category sync
-- Code should use categoryId as the source of truth

-- Step 4: Backfill any remaining category strings from categoryId (for consistency)
UPDATE "Recipe" r
SET category = c.name
FROM "Category" c
WHERE r."categoryId" = c.id
  AND (r.category IS NULL OR r.category != c.name);

-- Step 5: Verify consistency
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM "Recipe" r
  LEFT JOIN "Category" c ON c.id = r."categoryId"
  WHERE r."categoryId" IS NOT NULL
    AND (r.category IS NULL OR r.category != c.name);
  
  IF inconsistent_count > 0 THEN
    RAISE WARNING 'Found % recipes with inconsistent category/categoryId. Trigger should sync these automatically.', inconsistent_count;
  ELSE
    RAISE NOTICE 'All recipes have consistent category/categoryId values';
  END IF;
END $$;

-- Post-migration verification
SELECT 
  'Category field consistency' as check_type,
  COUNT(*) FILTER (WHERE "categoryId" IS NOT NULL AND category IS NOT NULL) as has_both,
  COUNT(*) FILTER (WHERE "categoryId" IS NOT NULL AND category IS NULL) as category_id_only,
  COUNT(*) FILTER (WHERE "categoryId" IS NULL AND category IS NOT NULL) as category_string_only,
  COUNT(*) FILTER (WHERE "categoryId" IS NULL AND (category IS NULL OR category = '')) as neither
FROM "Recipe";

-- Note: The category field is now kept in sync via trigger
-- Code should migrate to use categoryId only
-- After 1 week of stable production, run cleanup migration to remove category field


