-- Migration: Add Composite Unique Constraints
-- Date: 2025-01-15 12:00:00
-- Description: Adds composite unique constraints to prevent duplicate entries
-- Priority: HIGH (Prevents data corruption)
-- Risk: LOW (Additive change, validates existing data)
-- Prerequisites: RecipeItem and RecipeSection tables must exist (created by Prisma schema)

BEGIN;

-- Pre-flight check: Verify tables exist (fail fast if they don't)
DO $$
DECLARE
  recipe_item_exists BOOLEAN;
  recipe_section_exists BOOLEAN;
BEGIN
  -- Check for RecipeItem table (Prisma uses quoted identifiers, so exact case matters)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'RecipeItem'
  ) INTO recipe_item_exists;
  
  -- Check for RecipeSection table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'RecipeSection'
  ) INTO recipe_section_exists;
  
  -- Fail if tables don't exist - this indicates schema drift or missing Prisma migrations
  IF NOT recipe_item_exists THEN
    RAISE EXCEPTION 'Table RecipeItem does not exist. Ensure Prisma schema is applied first (run: npx prisma migrate deploy or npx prisma db push)';
  END IF;
  
  IF NOT recipe_section_exists THEN
    RAISE EXCEPTION 'Table RecipeSection does not exist. Ensure Prisma schema is applied first (run: npx prisma migrate deploy or npx prisma db push)';
  END IF;
END $$;

-- Check for existing duplicate RecipeItems (will fail if duplicates exist)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT "recipeId", "ingredientId", COUNT(*) as cnt
    FROM "RecipeItem"
    GROUP BY "recipeId", "ingredientId"
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate RecipeItem entries. Please clean up before applying constraint.', duplicate_count;
    -- Note: Migration will continue, but constraint creation may fail
    -- Consider adding a data cleanup step here if needed
  END IF;
END $$;

-- Check for existing duplicate RecipeSection orders (will fail if duplicates exist)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT "recipeId", "order", COUNT(*) as cnt
    FROM "RecipeSection"
    GROUP BY "recipeId", "order"
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate RecipeSection order values. Please clean up before applying constraint.', duplicate_count;
    -- Note: Migration will continue, but constraint creation may fail
  END IF;
END $$;

-- Add composite unique constraint to RecipeItem
-- This prevents duplicate ingredient entries in the same recipe
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'RecipeItem_recipeId_ingredientId_key'
  ) INTO constraint_exists;
  
  IF NOT constraint_exists THEN
    ALTER TABLE "RecipeItem" 
    ADD CONSTRAINT "RecipeItem_recipeId_ingredientId_key" 
    UNIQUE ("recipeId", "ingredientId");
    
    RAISE NOTICE 'Added unique constraint: RecipeItem(recipeId, ingredientId)';
  ELSE
    RAISE NOTICE 'Constraint RecipeItem_recipeId_ingredientId_key already exists, skipping';
  END IF;
END $$;

-- Add composite unique constraint to RecipeSection
-- This prevents duplicate order values within the same recipe
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'RecipeSection_recipeId_order_key'
  ) INTO constraint_exists;
  
  IF NOT constraint_exists THEN
    ALTER TABLE "RecipeSection" 
    ADD CONSTRAINT "RecipeSection_recipeId_order_key" 
    UNIQUE ("recipeId", "order");
    
    RAISE NOTICE 'Added unique constraint: RecipeSection(recipeId, order)';
  ELSE
    RAISE NOTICE 'Constraint RecipeSection_recipeId_order_key already exists, skipping';
  END IF;
END $$;

-- Verify constraints were created
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conname IN ('RecipeItem_recipeId_ingredientId_key', 'RecipeSection_recipeId_order_key');
  
  IF constraint_count < 2 THEN
    RAISE EXCEPTION 'Failed to create all constraints. Expected 2, found %', constraint_count;
  END IF;
  
  RAISE NOTICE 'Successfully created % unique constraints', constraint_count;
END $$;

COMMIT;

-- Post-migration verification
SELECT 
  'RecipeItem unique constraint' as constraint_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'RecipeItem_recipeId_ingredientId_key'
    ) THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'RecipeSection unique constraint' as constraint_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'RecipeSection_recipeId_order_key'
    ) THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;
