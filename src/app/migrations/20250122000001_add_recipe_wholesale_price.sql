-- Add wholesalePrice field to Recipe table
ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "wholesalePrice" DECIMAL(10,2);

