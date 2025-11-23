-- Migration: Add brand field to Company table
-- This migration adds the Brand enum and brand field to the Company model

-- Step 1: Create Brand enum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "Brand" AS ENUM ('plato', 'plato_bake');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add brand column to Company table with default value
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "brand" "Brand" NOT NULL DEFAULT 'plato';

-- Step 3: Create index on brand column for faster queries
CREATE INDEX IF NOT EXISTS "Company_brand_idx" ON "Company"("brand");

-- Step 4: Add comment to document the field
COMMENT ON COLUMN "Company"."brand" IS 'Brand identifier: plato (main app) or plato_bake (bakery-focused app)';

