-- Rollback: Remove CHECK Constraints
-- Date: 2025-01-15 14:00:00
-- Description: Removes CHECK constraints added in forward migration
-- WARNING: Removing constraints allows invalid data to be inserted.

BEGIN;

-- Remove CHECK constraint: Recipe.sellingPrice >= 0
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recipe_selling_price_positive'
  ) THEN
    ALTER TABLE "Recipe" 
    DROP CONSTRAINT "recipe_selling_price_positive";
    
    RAISE NOTICE 'Removed CHECK constraint: recipe_selling_price_positive';
  ELSE
    RAISE NOTICE 'CHECK constraint recipe_selling_price_positive does not exist, skipping';
  END IF;
END $$;

-- Remove CHECK constraint: Ingredient.packPrice >= 0
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ingredient_pack_price_positive'
  ) THEN
    ALTER TABLE "Ingredient" 
    DROP CONSTRAINT "ingredient_pack_price_positive";
    
    RAISE NOTICE 'Removed CHECK constraint: ingredient_pack_price_positive';
  ELSE
    RAISE NOTICE 'CHECK constraint ingredient_pack_price_positive does not exist, skipping';
  END IF;
END $$;

-- Remove CHECK constraint: Recipe.yieldQuantity > 0
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recipe_yield_quantity_positive'
  ) THEN
    ALTER TABLE "Recipe" 
    DROP CONSTRAINT "recipe_yield_quantity_positive";
    
    RAISE NOTICE 'Removed CHECK constraint: recipe_yield_quantity_positive';
  ELSE
    RAISE NOTICE 'CHECK constraint recipe_yield_quantity_positive does not exist, skipping';
  END IF;
END $$;

-- Remove CHECK constraint: RecipeItem.quantity > 0
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'recipe_item_quantity_positive'
  ) THEN
    ALTER TABLE "RecipeItem" 
    DROP CONSTRAINT "recipe_item_quantity_positive";
    
    RAISE NOTICE 'Removed CHECK constraint: recipe_item_quantity_positive';
  ELSE
    RAISE NOTICE 'CHECK constraint recipe_item_quantity_positive does not exist, skipping';
  END IF;
END $$;

COMMIT;

-- Post-rollback verification
SELECT 
  constraint_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = constraint_name
    ) THEN 'STILL EXISTS (ROLLBACK FAILED)' 
    ELSE 'REMOVED' 
  END as status
FROM (
  VALUES 
    ('recipe_selling_price_positive'),
    ('ingredient_pack_price_positive'),
    ('recipe_yield_quantity_positive'),
    ('recipe_item_quantity_positive')
) AS constraints(constraint_name);


