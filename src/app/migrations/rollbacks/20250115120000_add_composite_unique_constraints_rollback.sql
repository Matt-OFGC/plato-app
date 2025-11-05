-- Rollback: Remove Composite Unique Constraints
-- Date: 2025-01-15 12:00:00
-- Description: Removes composite unique constraints added in forward migration
-- WARNING: Only use in emergency! Removing constraints allows duplicate data.

BEGIN;

-- Remove RecipeSection unique constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'RecipeSection_recipeId_order_key'
  ) THEN
    ALTER TABLE "RecipeSection" 
    DROP CONSTRAINT "RecipeSection_recipeId_order_key";
    
    RAISE NOTICE 'Removed unique constraint: RecipeSection(recipeId, order)';
  ELSE
    RAISE NOTICE 'Constraint RecipeSection_recipeId_order_key does not exist, skipping';
  END IF;
END $$;

-- Remove RecipeItem unique constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'RecipeItem_recipeId_ingredientId_key'
  ) THEN
    ALTER TABLE "RecipeItem" 
    DROP CONSTRAINT "RecipeItem_recipeId_ingredientId_key";
    
    RAISE NOTICE 'Removed unique constraint: RecipeItem(recipeId, ingredientId)';
  ELSE
    RAISE NOTICE 'Constraint RecipeItem_recipeId_ingredientId_key does not exist, skipping';
  END IF;
END $$;

COMMIT;

-- Post-rollback verification
SELECT 
  'RecipeItem unique constraint' as constraint_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'RecipeItem_recipeId_ingredientId_key'
    ) THEN 'STILL EXISTS (ROLLBACK FAILED)' 
    ELSE 'REMOVED' 
  END as status
UNION ALL
SELECT 
  'RecipeSection unique constraint' as constraint_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'RecipeSection_recipeId_order_key'
    ) THEN 'STILL EXISTS (ROLLBACK FAILED)' 
    ELSE 'REMOVED' 
  END as status;


