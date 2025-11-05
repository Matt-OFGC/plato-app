-- Migration: Add CHECK Constraints
-- Date: 2025-01-15 14:00:00
-- Description: Adds CHECK constraints for data validation
-- Priority: MEDIUM (Improves data quality)
-- Risk: MEDIUM (May fail if invalid data exists)

BEGIN;

-- Pre-flight check: Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Recipe') THEN
    RAISE EXCEPTION 'Table Recipe does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Ingredient') THEN
    RAISE EXCEPTION 'Table Ingredient does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RecipeItem') THEN
    RAISE EXCEPTION 'Table RecipeItem does not exist';
  END IF;
END $$;

-- Check for invalid data before adding constraints
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for negative selling prices
  SELECT COUNT(*) INTO invalid_count
  FROM "Recipe"
  WHERE "sellingPrice" IS NOT NULL AND "sellingPrice" < 0;
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'Found % recipes with negative sellingPrice. Setting to NULL.', invalid_count;
    UPDATE "Recipe" 
    SET "sellingPrice" = NULL 
    WHERE "sellingPrice" < 0;
  END IF;
  
  -- Check for negative pack prices
  SELECT COUNT(*) INTO invalid_count
  FROM "Ingredient"
  WHERE "packPrice" < 0;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % ingredients with negative packPrice. Cannot add constraint. Please fix data first.', invalid_count;
  END IF;
  
  -- Check for non-positive yield quantities
  SELECT COUNT(*) INTO invalid_count
  FROM "Recipe"
  WHERE "yieldQuantity" <= 0;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % recipes with non-positive yieldQuantity. Cannot add constraint. Please fix data first.', invalid_count;
  END IF;
  
  -- Check for non-positive quantities in RecipeItem
  SELECT COUNT(*) INTO invalid_count
  FROM "RecipeItem"
  WHERE "quantity" <= 0;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % recipe items with non-positive quantity. Cannot add constraint. Please fix data first.', invalid_count;
  END IF;
END $$;

-- Add CHECK constraint: Recipe.sellingPrice >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recipe_selling_price_positive'
  ) THEN
    ALTER TABLE "Recipe" 
    ADD CONSTRAINT "recipe_selling_price_positive" 
    CHECK ("sellingPrice" IS NULL OR "sellingPrice" >= 0);
    
    RAISE NOTICE 'Added CHECK constraint: Recipe.sellingPrice >= 0';
  ELSE
    RAISE NOTICE 'CHECK constraint recipe_selling_price_positive already exists, skipping';
  END IF;
END $$;

-- Add CHECK constraint: Ingredient.packPrice >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ingredient_pack_price_positive'
  ) THEN
    ALTER TABLE "Ingredient" 
    ADD CONSTRAINT "ingredient_pack_price_positive" 
    CHECK ("packPrice" >= 0);
    
    RAISE NOTICE 'Added CHECK constraint: Ingredient.packPrice >= 0';
  ELSE
    RAISE NOTICE 'CHECK constraint ingredient_pack_price_positive already exists, skipping';
  END IF;
END $$;

-- Add CHECK constraint: Recipe.yieldQuantity > 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recipe_yield_quantity_positive'
  ) THEN
    ALTER TABLE "Recipe" 
    ADD CONSTRAINT "recipe_yield_quantity_positive" 
    CHECK ("yieldQuantity" > 0);
    
    RAISE NOTICE 'Added CHECK constraint: Recipe.yieldQuantity > 0';
  ELSE
    RAISE NOTICE 'CHECK constraint recipe_yield_quantity_positive already exists, skipping';
  END IF;
END $$;

-- Add CHECK constraint: RecipeItem.quantity > 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recipe_item_quantity_positive'
  ) THEN
    ALTER TABLE "RecipeItem" 
    ADD CONSTRAINT "recipe_item_quantity_positive" 
    CHECK ("quantity" > 0);
    
    RAISE NOTICE 'Added CHECK constraint: RecipeItem.quantity > 0';
  ELSE
    RAISE NOTICE 'CHECK constraint recipe_item_quantity_positive already exists, skipping';
  END IF;
END $$;

-- Verify constraints were created
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conname IN (
    'recipe_selling_price_positive',
    'ingredient_pack_price_positive',
    'recipe_yield_quantity_positive',
    'recipe_item_quantity_positive'
  );
  
  IF constraint_count < 4 THEN
    RAISE EXCEPTION 'Failed to create all CHECK constraints. Expected 4, found %', constraint_count;
  END IF;
  
  RAISE NOTICE 'Successfully created % CHECK constraints', constraint_count;
END $$;

COMMIT;

-- Post-migration verification
SELECT 
  constraint_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = constraint_name
    ) THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
FROM (
  VALUES 
    ('recipe_selling_price_positive'),
    ('ingredient_pack_price_positive'),
    ('recipe_yield_quantity_positive'),
    ('recipe_item_quantity_positive')
) AS constraints(constraint_name);


