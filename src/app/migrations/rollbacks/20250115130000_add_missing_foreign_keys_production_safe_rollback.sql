-- Rollback: Remove Missing Foreign Keys
-- Date: 2025-01-15 13:00:00
-- Description: Removes foreign key constraints added in forward migration
-- WARNING: Only use in emergency! Removing FKs allows orphaned records.

BEGIN;

-- Remove FK: InventoryMovement.createdBy → User.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'InventoryMovement_createdBy_fkey'
  ) THEN
    ALTER TABLE "InventoryMovement" 
    DROP CONSTRAINT "InventoryMovement_createdBy_fkey";
    
    RAISE NOTICE 'Removed FK constraint: InventoryMovement.createdBy → User.id';
  ELSE
    RAISE NOTICE 'FK constraint InventoryMovement_createdBy_fkey does not exist, skipping';
  END IF;
END $$;

-- Remove FK: ProductionTask.assignedTo → User.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ProductionTask_assignedTo_fkey'
  ) THEN
    ALTER TABLE "ProductionTask" 
    DROP CONSTRAINT "ProductionTask_assignedTo_fkey";
    
    RAISE NOTICE 'Removed FK constraint: ProductionTask.assignedTo → User.id';
  ELSE
    RAISE NOTICE 'FK constraint ProductionTask_assignedTo_fkey does not exist, skipping';
  END IF;
END $$;

-- Remove FK: ProductionPlan.createdBy → User.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ProductionPlan_createdBy_fkey'
  ) THEN
    ALTER TABLE "ProductionPlan" 
    DROP CONSTRAINT "ProductionPlan_createdBy_fkey";
    
    RAISE NOTICE 'Removed FK constraint: ProductionPlan.createdBy → User.id';
  ELSE
    RAISE NOTICE 'FK constraint ProductionPlan_createdBy_fkey does not exist, skipping';
  END IF;
END $$;

-- Remove FK: Company.ownerId → User.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Company_ownerId_fkey'
  ) THEN
    ALTER TABLE "Company" 
    DROP CONSTRAINT "Company_ownerId_fkey";
    
    RAISE NOTICE 'Removed FK constraint: Company.ownerId → User.id';
  ELSE
    RAISE NOTICE 'FK constraint Company_ownerId_fkey does not exist, skipping';
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
    ('Company_ownerId_fkey'),
    ('ProductionPlan_createdBy_fkey'),
    ('ProductionTask_assignedTo_fkey'),
    ('InventoryMovement_createdBy_fkey')
) AS fks(constraint_name);


