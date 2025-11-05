-- Rollback: Remove Performance Indexes
-- Date: 2025-01-15 15:00:00
-- Description: Removes performance indexes added in forward migration
-- Uses DROP INDEX CONCURRENTLY to avoid locking

-- Note: CONCURRENTLY indexes must be dropped CONCURRENTLY
-- These cannot run in a transaction

-- Drop trigram indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_name_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_description_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_method_trgm;

-- Drop covering indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_list_covering;
DROP INDEX CONCURRENTLY IF EXISTS idx_sales_record_analytics;

-- Drop composite indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_production_history_company_date_recipe;
DROP INDEX CONCURRENTLY IF EXISTS idx_inventory_movement_history;

-- Drop partial indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_notification_unread;

-- Drop composite indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_wholesale_order_status_date;

-- Post-rollback verification
SELECT 
  indexname,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = verification.indexname
    ) THEN 'STILL EXISTS (ROLLBACK FAILED)' 
    ELSE 'REMOVED' 
  END as status
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
) AS verification(indexname);


