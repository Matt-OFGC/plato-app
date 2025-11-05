-- Database Observability Queries
-- 
-- Use these queries to monitor database health, performance, and issues.
-- Run these regularly or set up automated monitoring.

-- ============================================================================
-- QUERY PERFORMANCE MONITORING
-- ============================================================================

-- Top 10 slowest queries (requires pg_stat_statements extension)
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  (total_exec_time / 1000 / 60) as total_minutes,
  (mean_exec_time / 1000) as mean_seconds
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Queries with highest total execution time
SELECT 
  LEFT(query, 100) as query_preview,
  calls,
  total_exec_time,
  mean_exec_time,
  (total_exec_time / calls) as avg_time_per_call
FROM pg_stat_statements
WHERE calls > 100
ORDER BY total_exec_time DESC
LIMIT 10;

-- ============================================================================
-- TABLE STATISTICS
-- ============================================================================

-- Table sizes and row counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  n_live_tup as row_count,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Largest tables
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size('public.'||tablename)) AS table_size,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 20;

-- ============================================================================
-- INDEX USAGE
-- ============================================================================

-- Unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND pg_relation_size(indexrelid) > 1024 * 1024  -- Larger than 1MB
ORDER BY pg_relation_size(indexrelid) DESC;

-- Most used indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- Index bloat (large indexes that may need REINDEX)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan as scans,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'LOW_USAGE'
    ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 10 * 1024 * 1024  -- Larger than 10MB
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- CONNECTION MONITORING
-- ============================================================================

-- Active connections by database
SELECT 
  datname,
  count(*) as connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
GROUP BY datname
ORDER BY connections DESC;

-- Long-running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state != 'idle'
ORDER BY duration DESC;

-- Idle in transaction (potential connection leaks)
SELECT 
  pid,
  now() - state_change AS idle_duration,
  state,
  query,
  application_name,
  client_addr
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND (now() - state_change) > interval '1 minute'
ORDER BY idle_duration DESC;

-- ============================================================================
-- VACUUM & AUTOVACUUM STATUS
-- ============================================================================

-- Tables needing vacuum
SELECT 
  schemaname,
  tablename,
  n_live_tup,
  n_dead_tup,
  round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
  AND round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 10
ORDER BY n_dead_tup DESC;

-- Autovacuum activity
SELECT 
  schemaname,
  tablename,
  last_autovacuum,
  last_autoanalyze,
  CASE 
    WHEN last_autovacuum IS NULL THEN 'NEVER_VACUUMED'
    WHEN last_autovacuum < now() - interval '7 days' THEN 'NEEDS_VACUUM'
    ELSE 'RECENT'
  END as vacuum_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum NULLS FIRST;

-- ============================================================================
-- LOCK MONITORING
-- ============================================================================

-- Current locks
SELECT 
  locktype,
  relation::regclass,
  mode,
  granted,
  pid,
  pg_blocking_pids(pid) as blocked_by
FROM pg_locks
WHERE relation IS NOT NULL
ORDER BY granted, pid;

-- Blocked queries
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocking_locks.pid AS blocking_pid,
  blocked_activity.query AS blocked_query,
  blocking_activity.query AS blocking_query,
  blocked_activity.application_name AS blocked_app,
  blocking_activity.application_name AS blocking_app
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- ============================================================================
-- RECIPE-SPECIFIC MONITORING
-- ============================================================================

-- Recipe statistics by company
SELECT 
  c.name as company_name,
  COUNT(r.id) as recipe_count,
  COUNT(DISTINCT r."categoryId") as category_count,
  COUNT(ri.id) as total_items,
  AVG(item_counts.items_per_recipe) as avg_items_per_recipe,
  MAX(r."updatedAt") as last_updated
FROM "Company" c
LEFT JOIN "Recipe" r ON r."companyId" = c.id
LEFT JOIN "RecipeItem" ri ON ri."recipeId" = r.id
LEFT JOIN (
  SELECT "recipeId", COUNT(*) as items_per_recipe
  FROM "RecipeItem"
  GROUP BY "recipeId"
) item_counts ON item_counts."recipeId" = r.id
GROUP BY c.id, c.name
ORDER BY recipe_count DESC;

-- Recipes without ingredients
SELECT 
  r.id,
  r.name,
  r."companyId",
  COUNT(ri.id) as item_count
FROM "Recipe" r
LEFT JOIN "RecipeItem" ri ON ri."recipeId" = r.id
GROUP BY r.id, r.name, r."companyId"
HAVING COUNT(ri.id) = 0
ORDER BY r."updatedAt" DESC
LIMIT 20;

-- Recipes with duplicate ingredients (violates unique constraint if added)
SELECT 
  r.id,
  r.name,
  ri."ingredientId",
  COUNT(*) as duplicate_count
FROM "Recipe" r
JOIN "RecipeItem" ri ON ri."recipeId" = r.id
GROUP BY r.id, r.name, ri."ingredientId"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================================================
-- INGREDIENT STATISTICS
-- ============================================================================

-- Most used ingredients
SELECT 
  i.id,
  i.name,
  COUNT(ri.id) as usage_count,
  COUNT(DISTINCT ri."recipeId") as recipe_count
FROM "Ingredient" i
LEFT JOIN "RecipeItem" ri ON ri."ingredientId" = i.id
GROUP BY i.id, i.name
ORDER BY usage_count DESC
LIMIT 20;

-- Ingredients without recipes
SELECT 
  i.id,
  i.name,
  i."companyId"
FROM "Ingredient" i
LEFT JOIN "RecipeItem" ri ON ri."ingredientId" = i.id
WHERE ri.id IS NULL
ORDER BY i."updatedAt" DESC
LIMIT 20;

-- ============================================================================
-- DATA QUALITY CHECKS
-- ============================================================================

-- Recipes with invalid data (before CHECK constraints)
SELECT 
  'Negative selling price' as issue,
  COUNT(*) as count
FROM "Recipe"
WHERE "sellingPrice" < 0
UNION ALL
SELECT 
  'Non-positive yield quantity' as issue,
  COUNT(*) as count
FROM "Recipe"
WHERE "yieldQuantity" <= 0
UNION ALL
SELECT 
  'Negative pack price' as issue,
  COUNT(*) as count
FROM "Ingredient"
WHERE "packPrice" < 0
UNION ALL
SELECT 
  'Non-positive item quantity' as issue,
  COUNT(*) as count
FROM "RecipeItem"
WHERE "quantity" <= 0;

-- Orphaned records (missing foreign keys)
SELECT 
  'RecipeItems without Recipe' as issue,
  COUNT(*) as count
FROM "RecipeItem" ri
WHERE NOT EXISTS (SELECT 1 FROM "Recipe" r WHERE r.id = ri."recipeId")
UNION ALL
SELECT 
  'RecipeItems without Ingredient' as issue,
  COUNT(*) as count
FROM "RecipeItem" ri
WHERE NOT EXISTS (SELECT 1 FROM "Ingredient" i WHERE i.id = ri."ingredientId")
UNION ALL
SELECT 
  'RecipeSections without Recipe' as issue,
  COUNT(*) as count
FROM "RecipeSection" rs
WHERE NOT EXISTS (SELECT 1 FROM "Recipe" r WHERE r.id = rs."recipeId");

-- ============================================================================
-- PERFORMANCE INDICATORS
-- ============================================================================

-- Cache hit ratio (should be > 99%)
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  round(sum(heap_blks_hit) * 100.0 / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Index hit ratio (should be > 99%)
SELECT 
  sum(idx_blks_read) as idx_read,
  sum(idx_blks_hit) as idx_hit,
  round(sum(idx_blks_hit) * 100.0 / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) AS index_hit_ratio
FROM pg_statio_user_indexes;

-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================

-- Enable pg_stat_statements extension (run as superuser):
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable query logging in postgresql.conf:
-- log_min_duration_statement = 1000  -- Log queries > 1 second
-- log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

-- Run these queries regularly (daily/weekly) or set up automated monitoring.


