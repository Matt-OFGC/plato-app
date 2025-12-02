-- Add serving size information to Ingredient model
-- This allows users to see how many servings/pieces are in a pack
-- Example: Pack of hash browns = 1.35kg, 36 hash browns per pack = 37.5g each

ALTER TABLE "Ingredient" 
ADD COLUMN IF NOT EXISTS "servingsPerPack" INTEGER,
ADD COLUMN IF NOT EXISTS "servingUnit" TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN "Ingredient"."servingsPerPack" IS 'Number of servings/pieces per pack (e.g., 36 hash browns)';
COMMENT ON COLUMN "Ingredient"."servingUnit" IS 'Unit description for the serving (e.g., "hash brown", "piece", "slice")';

