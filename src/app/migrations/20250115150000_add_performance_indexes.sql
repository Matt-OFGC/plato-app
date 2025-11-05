-- Migration: Add Performance Indexes
-- Date: 2025-01-15 15:00:00
-- Description: Adds performance indexes for common query patterns
-- Priority: MEDIUM (Improves query performance)
-- Risk: LOW (Additive change, may slow down writes slightly)

-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction or DO block
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS is not supported in PostgreSQL
-- The migration script will catch "already exists" errors and continue
-- Each index creation is idempotent

-- Enable pg_trgm extension for full-text search (if not already enabled)
-- Must be run as superuser or with CREATE EXTENSION privilege
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram indexes for Recipe search (name, description, method)
-- Using CONCURRENTLY to avoid locking during index creation
-- If index already exists, error will be caught and ignored by migration script

CREATE INDEX CONCURRENTLY idx_recipe_name_trgm ON "Recipe" USING GIN (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY idx_recipe_description_trgm ON "Recipe" USING GIN (description gin_trgm_ops);

CREATE INDEX CONCURRENTLY idx_recipe_method_trgm ON "Recipe" USING GIN (method gin_trgm_ops);

-- Add covering index for Recipe list queries
CREATE INDEX CONCURRENTLY idx_recipe_list_covering ON "Recipe" ("companyId", "name") 
INCLUDE ("id", "imageUrl", "categoryId", "yieldQuantity", "yieldUnit");

-- Add covering index for SalesRecord analytics
CREATE INDEX CONCURRENTLY idx_sales_record_analytics ON "SalesRecord" ("companyId", "transactionDate" DESC) 
INCLUDE ("totalRevenue", "recipeId");

-- Add composite index for ProductionHistory
CREATE INDEX CONCURRENTLY idx_production_history_company_date_recipe 
ON "ProductionHistory" ("companyId", "productionDate" DESC, "recipeId");

-- Add index for InventoryMovement history
CREATE INDEX CONCURRENTLY idx_inventory_movement_history 
ON "InventoryMovement" ("inventoryId", "createdAt" DESC, "type");

-- Add partial index for unread notifications
CREATE INDEX CONCURRENTLY idx_notification_unread ON "Notification" ("userId", "createdAt" DESC) 
WHERE "read" = false;

-- Add composite index for WholesaleOrder status queries
CREATE INDEX CONCURRENTLY idx_wholesale_order_status_date 
ON "WholesaleOrder" ("companyId", "status", "deliveryDate" DESC);

-- Post-migration verification
-- Verify all indexes exist and are valid
SELECT 
  i.indexname,
  CASE 
    WHEN i.indexname IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END as status,
  CASE 
    WHEN idx.indisvalid THEN 'VALID'
    WHEN idx.indisvalid IS FALSE THEN 'INVALID'
    ELSE 'UNKNOWN'
  END as validity
FROM (
  VALUES 
    ('idx_recipe_name_trgm'),
    ('idx_recipe_description_trgm'),
    ('idx_recipe_method_trgm'),
    ('idx_recipe_list_covering'),
    ('idx_sales_record_analytics'),
    ('idx_production_history_company_date_recipe'),
    ('idx_inventory_movement_history'),
    ('idx_notification_unread'),
    ('idx_wholesale_order_status_date')
) AS verification(indexname)
LEFT JOIN pg_indexes i ON i.indexname = verification.indexname
LEFT JOIN pg_index idx ON idx.indexrelid = (
  SELECT oid FROM pg_class WHERE relname = verification.indexname
);

-- Note: Index creation may take time on large tables.
-- Monitor index creation progress if needed.
