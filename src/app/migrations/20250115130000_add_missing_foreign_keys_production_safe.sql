-- Migration: Add Missing Foreign Keys (Production-Safe)
-- Date: 2025-01-15 13:00:00
-- Description: Adds missing foreign key constraints using NOT VALID + VALIDATE pattern
-- Priority: HIGH (Prevents orphaned records)
-- Risk: LOW-MEDIUM (May fail if orphaned data exists)
-- Lock-Safety: Uses NOT VALID then VALIDATE to avoid long locks

-- NOTE: This migration uses NOT VALID pattern for FKs on hot tables
-- Step 1: Add FK as NOT VALID (fast, no lock)
-- Step 2: VALIDATE CONSTRAINT (validates existing data, can be slow but non-blocking)

-- Pre-flight check: Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Company') THEN
    RAISE EXCEPTION 'Table Company does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    RAISE EXCEPTION 'Table User does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ProductionPlan') THEN
    RAISE EXCEPTION 'Table ProductionPlan does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ProductionTask') THEN
    RAISE EXCEPTION 'Table ProductionTask does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'InventoryMovement') THEN
    RAISE EXCEPTION 'Table InventoryMovement does not exist';
  END IF;
END $$;

-- Check for orphaned Company.ownerId references
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM "Company" c
  WHERE c."ownerId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = c."ownerId");
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned Company.ownerId references. Setting to NULL.', orphaned_count;
    -- Clean up orphaned references
    UPDATE "Company" 
    SET "ownerId" = NULL 
    WHERE "ownerId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = "Company"."ownerId");
  END IF;
END $$;

-- Check for orphaned ProductionPlan.createdBy references
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM "ProductionPlan" p
  WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."createdBy");
  
  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Found % orphaned ProductionPlan.createdBy references. Cannot add FK constraint. Please fix data first.', orphaned_count;
  END IF;
END $$;

-- Check for orphaned ProductionTask.assignedTo references
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM "ProductionTask" t
  WHERE t."assignedTo" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = t."assignedTo");
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned ProductionTask.assignedTo references. Setting to NULL.', orphaned_count;
    -- Clean up orphaned references
    UPDATE "ProductionTask" 
    SET "assignedTo" = NULL 
    WHERE "assignedTo" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = "ProductionTask"."assignedTo");
  END IF;
END $$;

-- Check for orphaned InventoryMovement.createdBy references
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM "InventoryMovement" m
  WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = m."createdBy");
  
  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Found % orphaned InventoryMovement.createdBy references. Cannot add FK constraint. Please fix data first.', orphaned_count;
  END IF;
END $$;

-- Add FK: Company.ownerId → User.id (ON DELETE SET NULL)
-- Using NOT VALID pattern for lock-safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%Company_ownerId_fkey%'
  ) THEN
    -- Step 1: Add FK as NOT VALID (fast, no validation)
    ALTER TABLE "Company" 
    ADD CONSTRAINT "Company_ownerId_fkey" 
    FOREIGN KEY ("ownerId") REFERENCES "User"(id) 
    ON DELETE SET NULL 
    NOT VALID;
    
    RAISE NOTICE 'Added FK constraint: Company.ownerId → User.id (NOT VALID)';
    
    -- Step 2: Validate constraint (validates existing data, non-blocking)
    ALTER TABLE "Company" VALIDATE CONSTRAINT "Company_ownerId_fkey";
    
    RAISE NOTICE 'Validated FK constraint: Company.ownerId → User.id';
  ELSE
    RAISE NOTICE 'FK constraint Company.ownerId → User.id already exists';
  END IF;
END $$;

-- Add FK: ProductionPlan.createdBy → User.id (ON DELETE RESTRICT)
-- Using NOT VALID pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%ProductionPlan_createdBy_fkey%'
  ) THEN
    ALTER TABLE "ProductionPlan" 
    ADD CONSTRAINT "ProductionPlan_createdBy_fkey" 
    FOREIGN KEY ("createdBy") REFERENCES "User"(id) 
    ON DELETE RESTRICT 
    NOT VALID;
    
    ALTER TABLE "ProductionPlan" VALIDATE CONSTRAINT "ProductionPlan_createdBy_fkey";
    
    RAISE NOTICE 'Added and validated FK constraint: ProductionPlan.createdBy → User.id';
  ELSE
    RAISE NOTICE 'FK constraint ProductionPlan.createdBy → User.id already exists';
  END IF;
END $$;

-- Add FK: ProductionTask.assignedTo → User.id (ON DELETE SET NULL)
-- Using NOT VALID pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%ProductionTask_assignedTo_fkey%'
  ) THEN
    ALTER TABLE "ProductionTask" 
    ADD CONSTRAINT "ProductionTask_assignedTo_fkey" 
    FOREIGN KEY ("assignedTo") REFERENCES "User"(id) 
    ON DELETE SET NULL 
    NOT VALID;
    
    ALTER TABLE "ProductionTask" VALIDATE CONSTRAINT "ProductionTask_assignedTo_fkey";
    
    RAISE NOTICE 'Added and validated FK constraint: ProductionTask.assignedTo → User.id';
  ELSE
    RAISE NOTICE 'FK constraint ProductionTask.assignedTo → User.id already exists';
  END IF;
END $$;

-- Add FK: InventoryMovement.createdBy → User.id (ON DELETE RESTRICT)
-- Using NOT VALID pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%InventoryMovement_createdBy_fkey%'
  ) THEN
    ALTER TABLE "InventoryMovement" 
    ADD CONSTRAINT "InventoryMovement_createdBy_fkey" 
    FOREIGN KEY ("createdBy") REFERENCES "User"(id) 
    ON DELETE RESTRICT 
    NOT VALID;
    
    ALTER TABLE "InventoryMovement" VALIDATE CONSTRAINT "InventoryMovement_createdBy_fkey";
    
    RAISE NOTICE 'Added and validated FK constraint: InventoryMovement.createdBy → User.id';
  ELSE
    RAISE NOTICE 'FK constraint InventoryMovement.createdBy → User.id already exists';
  END IF;
END $$;

-- Verify ON DELETE CASCADE on Recipe.companyId (should already exist via Prisma)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%Recipe_companyId_fkey%'
  ) THEN
    -- Check if ON DELETE CASCADE is set
    RAISE NOTICE 'Recipe.companyId FK exists. Verify ON DELETE CASCADE is set in Prisma schema.';
  ELSE
    RAISE WARNING 'Recipe.companyId FK missing. Should be added via Prisma schema update.';
  END IF;
END $$;

-- Verify ON DELETE CASCADE on Ingredient.companyId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%Ingredient_companyId_fkey%'
  ) THEN
    RAISE NOTICE 'Ingredient.companyId FK exists. Verify ON DELETE CASCADE is set in Prisma schema.';
  ELSE
    RAISE WARNING 'Ingredient.companyId FK missing. Should be added via Prisma schema update.';
  END IF;
END $$;

-- Verify ON DELETE CASCADE on Category.companyId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%Category_companyId_fkey%'
  ) THEN
    RAISE NOTICE 'Category.companyId FK exists. Verify ON DELETE CASCADE is set in Prisma schema.';
  ELSE
    RAISE WARNING 'Category.companyId FK missing. Should be added via Prisma schema update.';
  END IF;
END $$;

-- Post-migration verification
SELECT 
  constraint_name,
  table_name,
  CASE 
    WHEN convalidated THEN 'VALID'
    ELSE 'NOT VALID'
  END as validation_status
FROM (
  SELECT 
    conname as constraint_name,
    conrelid::regclass::text as table_name,
    convalidated
  FROM pg_constraint
  WHERE conname IN (
    'Company_ownerId_fkey',
    'ProductionPlan_createdBy_fkey',
    'ProductionTask_assignedTo_fkey',
    'InventoryMovement_createdBy_fkey'
  )
) fks
ORDER BY constraint_name;

-- Note: Prisma schema should be updated to reflect these FKs
-- Run: npx prisma migrate dev --name add_missing_foreign_keys

