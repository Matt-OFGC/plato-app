-- Backfill Script: Migrate Recipe.category (String) to Recipe.categoryId (Int)
-- Date: 2025-01-15 16:00:00
-- Description: Backfills categoryId from category string values
-- Run BEFORE: 20250115160001_fix_recipe_category_fields_cutover.sql

-- Pre-flight: Count rows before backfill
DO $$
DECLARE
  total_recipes INTEGER;
  recipes_with_category INTEGER;
  recipes_with_category_id INTEGER;
  recipes_with_both INTEGER;
  recipes_needing_backfill INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_recipes FROM "Recipe";
  SELECT COUNT(*) INTO recipes_with_category FROM "Recipe" WHERE category IS NOT NULL AND category != '';
  SELECT COUNT(*) INTO recipes_with_category_id FROM "Recipe" WHERE "categoryId" IS NOT NULL;
  SELECT COUNT(*) INTO recipes_with_both FROM "Recipe" WHERE category IS NOT NULL AND category != '' AND "categoryId" IS NOT NULL;
  SELECT COUNT(*) INTO recipes_needing_backfill FROM "Recipe" 
    WHERE category IS NOT NULL AND category != '' AND "categoryId" IS NULL;
  
  RAISE NOTICE '=== BACKFILL PRE-FLIGHT CHECK ===';
  RAISE NOTICE 'Total recipes: %', total_recipes;
  RAISE NOTICE 'Recipes with category (String): %', recipes_with_category;
  RAISE NOTICE 'Recipes with categoryId (Int): %', recipes_with_category_id;
  RAISE NOTICE 'Recipes with both: %', recipes_with_both;
  RAISE NOTICE 'Recipes needing backfill: %', recipes_needing_backfill;
END $$;

-- Step 1: Find recipes with category string but no categoryId
-- Match by companyId + category name (case-insensitive)
UPDATE "Recipe" r
SET "categoryId" = c.id
FROM "Category" c
WHERE r.category IS NOT NULL 
  AND r.category != ''
  AND r."categoryId" IS NULL
  AND c.name ILIKE r.category
  AND (
    (r."companyId" IS NULL AND c."companyId" IS NULL)
    OR (r."companyId" = c."companyId")
  );

-- Step 2: Report backfill results
DO $$
DECLARE
  backfilled_count INTEGER;
  remaining_count INTEGER;
  unmapped_categories TEXT[];
BEGIN
  SELECT COUNT(*) INTO backfilled_count
  FROM "Recipe"
  WHERE category IS NOT NULL 
    AND category != ''
    AND "categoryId" IS NOT NULL;
  
  SELECT COUNT(*) INTO remaining_count
  FROM "Recipe"
  WHERE category IS NOT NULL 
    AND category != ''
    AND "categoryId" IS NULL;
  
  -- Find unmapped category strings
  SELECT ARRAY_AGG(DISTINCT category) INTO unmapped_categories
  FROM "Recipe"
  WHERE category IS NOT NULL 
    AND category != ''
    AND "categoryId" IS NULL;
  
  RAISE NOTICE '=== BACKFILL RESULTS ===';
  RAISE NOTICE 'Successfully backfilled: % recipes', backfilled_count;
  RAISE NOTICE 'Remaining unmapped: % recipes', remaining_count;
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Unmapped categories found: %', unmapped_categories;
    RAISE WARNING 'These recipes will need manual mapping or category creation';
  END IF;
END $$;

-- Step 3: Verify backfill completeness
SELECT 
  'Backfill verification' as check_type,
  COUNT(*) FILTER (WHERE category IS NOT NULL AND category != '' AND "categoryId" IS NOT NULL) as successfully_mapped,
  COUNT(*) FILTER (WHERE category IS NOT NULL AND category != '' AND "categoryId" IS NULL) as still_unmapped,
  COUNT(*) FILTER (WHERE category IS NULL OR category = '') as no_category_string
FROM "Recipe";

-- Note: If unmapped categories exist, create them first:
-- INSERT INTO "Category" (name, "companyId") 
-- SELECT DISTINCT category, "companyId" 
-- FROM "Recipe" 
-- WHERE category IS NOT NULL AND category != '' AND "categoryId" IS NULL
-- ON CONFLICT DO NOTHING;
-- Then re-run this backfill script.


