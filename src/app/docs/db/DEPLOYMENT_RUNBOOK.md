# Database Migration Deployment Runbook

**Date:** 2025-01-15  
**Migrations:** Phase 1-4 (Production-Safe)  
**Estimated Duration:** 30-60 minutes  
**Risk Level:** Low-Medium

## Pre-Deployment

### 1. Verify Prerequisites

```bash
# Check PostgreSQL version matches staging
psql $PROD_DATABASE_URL -c "SELECT version(), current_setting('server_version_num');"

# Verify extensions
psql $PROD_DATABASE_URL -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_trgm', 'uuid-ossp', 'citext');"

# Check current user privileges
psql $PROD_DATABASE_URL -c "SELECT current_user, usesuper FROM pg_user WHERE usename = current_user;"
```

### 2. Create Backup

```bash
# Full backup
pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup size
ls -lh prod_backup_*.sql
```

### 3. Create Restore Point

```sql
-- Connect to production database
psql $PROD_DATABASE_URL

-- Create restore point (requires WAL archiving)
SELECT pg_create_restore_point('pre_fix_batch_production_20250115');
```

### 4. Set Session Timeouts

```sql
-- Set timeouts for migration session
SET lock_timeout = '2s';
SET statement_timeout = '5min';
SET idle_in_transaction_session_timeout = '10min';

-- Verify settings
SHOW lock_timeout;
SHOW statement_timeout;
```

### 5. Capture Baseline Metrics

```bash
# Run observability queries
psql $PROD_DATABASE_URL -f docs/db/observability.sql > prod_baseline_$(date +%Y%m%d_%H%M%S).txt

# Capture top queries
psql $PROD_DATABASE_URL -c "
SELECT query, calls, mean_exec_time, total_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
" > prod_top_queries_baseline.txt
```

---

## Deployment Steps

### Migration 1: Composite Unique Constraints

**File:** `migrations/20250115120000_add_composite_unique_constraints.sql`  
**Duration:** ~30 seconds  
**Lock Impact:** Low (small tables)

```bash
# Run migration
psql $PROD_DATABASE_URL -f migrations/20250115120000_add_composite_unique_constraints.sql

# Verify constraints created
psql $PROD_DATABASE_URL -c "
SELECT conname, contype, convalidated 
FROM pg_constraint 
WHERE conname IN ('RecipeItem_recipeId_ingredientId_key', 'RecipeSection_recipeId_order_key');
"
```

**Expected Output:**
```
conname                              | contype | convalidated
-------------------------------------+---------+-------------
RecipeItem_recipeId_ingredientId_key | u       | t
RecipeSection_recipeId_order_key     | u       | t
```

**Verification:**
- [ ] Constraints exist and are valid
- [ ] No errors in migration output
- [ ] Application still works (smoke test)

---

### Migration 2: Missing Foreign Keys

**File:** `migrations/20250115130000_add_missing_foreign_keys_production_safe.sql`  
**Duration:** ~1-2 minutes (depends on table size)  
**Lock Impact:** Low (uses NOT VALID pattern)

```bash
# Run migration
psql $PROD_DATABASE_URL -f migrations/20250115130000_add_missing_foreign_keys_production_safe.sql

# Verify FKs created and validated
psql $PROD_DATABASE_URL -c "
SELECT 
  conname as constraint_name,
  conrelid::regclass::text as table_name,
  CASE WHEN convalidated THEN 'VALID' ELSE 'NOT VALID' END as status
FROM pg_constraint
WHERE conname IN (
  'Company_ownerId_fkey',
  'ProductionPlan_createdBy_fkey',
  'ProductionTask_assignedTo_fkey',
  'InventoryMovement_createdBy_fkey'
)
ORDER BY conname;
"
```

**Expected Output:**
```
constraint_name                    | table_name        | status
-----------------------------------+-------------------+--------
Company_ownerId_fkey               | Company           | VALID
InventoryMovement_createdBy_fkey   | InventoryMovement | VALID
ProductionPlan_createdBy_fkey      | ProductionPlan    | VALID
ProductionTask_assignedTo_fkey     | ProductionTask    | VALID
```

**Verification:**
- [ ] All FKs exist and are VALID
- [ ] No orphaned records detected
- [ ] Application still works

---

### Migration 3: CHECK Constraints

**File:** `migrations/20250115140000_add_check_constraints.sql`  
**Duration:** ~30 seconds  
**Lock Impact:** Low (validates existing data)

```bash
# Run migration
psql $PROD_DATABASE_URL -f migrations/20250115140000_add_check_constraints.sql

# Verify CHECK constraints created
psql $PROD_DATABASE_URL -c "
SELECT conname, contype, convalidated 
FROM pg_constraint 
WHERE conname IN (
  'recipe_selling_price_positive',
  'ingredient_pack_price_positive',
  'recipe_yield_quantity_positive',
  'recipe_item_quantity_positive'
);
"
```

**Expected Output:**
```
conname                          | contype | convalidated
---------------------------------+---------+-------------
ingredient_pack_price_positive   | c       | t
recipe_item_quantity_positive   | c       | t
recipe_selling_price_positive    | c       | t
recipe_yield_quantity_positive   | c       | t
```

**Verification:**
- [ ] All CHECK constraints exist and are valid
- [ ] No invalid data detected
- [ ] Application still works

---

### Migration 4: Performance Indexes (CONCURRENTLY)

**File:** `migrations/20250115150000_add_performance_indexes.sql`  
**Duration:** ~5-15 minutes (depends on table size)  
**Lock Impact:** None (CONCURRENTLY)

**⚠️ IMPORTANT:** CONCURRENTLY indexes cannot run in transaction. Run each index separately or remove transaction wrapper.

```bash
# Option 1: Run entire migration (each index is idempotent)
psql $PROD_DATABASE_URL -f migrations/20250115150000_add_performance_indexes.sql

# Option 2: Run indexes individually for better monitoring
# (Extract each CREATE INDEX CONCURRENTLY statement and run separately)
```

**Monitor Index Creation:**
```sql
-- Check index creation progress
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY indexname;

-- Check if indexes are valid
SELECT 
  i.indexname,
  CASE WHEN idx.indisvalid THEN 'VALID' ELSE 'INVALID' END as status
FROM pg_indexes i
LEFT JOIN pg_index idx ON idx.indexrelid = (SELECT oid FROM pg_class WHERE relname = i.indexname)
WHERE i.indexname LIKE 'idx_%'
ORDER BY i.indexname;
```

**Expected Output:**
All indexes should show status = 'VALID'

**Verification:**
- [ ] All indexes exist and are VALID
- [ ] No errors during creation
- [ ] Query performance improved or unchanged

---

### Migration 5: Category Fields Backfill

**File:** `migrations/20250115160000_fix_recipe_category_fields_backfill.sql`  
**Duration:** ~1-2 minutes  
**Lock Impact:** Medium (UPDATE on Recipe table)

```bash
# Run backfill
psql $PROD_DATABASE_URL -f migrations/20250115160000_fix_recipe_category_fields_backfill.sql

# Verify backfill results
psql $PROD_DATABASE_URL -c "
SELECT 
  COUNT(*) FILTER (WHERE category IS NOT NULL AND category != '' AND \"categoryId\" IS NOT NULL) as mapped,
  COUNT(*) FILTER (WHERE category IS NOT NULL AND category != '' AND \"categoryId\" IS NULL) as unmapped
FROM \"Recipe\";
"
```

**Expected Output:**
```
mapped | unmapped
-------+----------
   X   |    0
```

**Verification:**
- [ ] All categories mapped (unmapped = 0)
- [ ] No data loss
- [ ] Application still works

---

### Migration 6: Category Fields Cutover

**File:** `migrations/20250115160001_fix_recipe_category_fields_cutover.sql`  
**Duration:** ~30 seconds  
**Lock Impact:** Low (adds trigger and constraint)

```bash
# Run cutover migration
psql $PROD_DATABASE_URL -f migrations/20250115160001_fix_recipe_category_fields_cutover.sql

# Verify trigger created
psql $PROD_DATABASE_URL -c "
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'sync_recipe_category_trigger';
"

# Verify CHECK constraint created
psql $PROD_DATABASE_URL -c "
SELECT conname, contype 
FROM pg_constraint 
WHERE conname = 'recipe_category_consistency_check';
"
```

**Verification:**
- [ ] Trigger exists
- [ ] CHECK constraint exists
- [ ] Application still works

---

## Post-Deployment Verification

### 1. Verify Row Counts Unchanged

```sql
SELECT 
  'Recipe' as table_name, 
  COUNT(*) as row_count,
  MAX("updatedAt") as last_updated
FROM "Recipe"
UNION ALL
SELECT 'RecipeItem', COUNT(*), MAX("updatedAt") FROM "RecipeItem"
UNION ALL
SELECT 'RecipeSection', COUNT(*), MAX("updatedAt") FROM "RecipeSection"
UNION ALL
SELECT 'Ingredient', COUNT(*), MAX("updatedAt") FROM "Ingredient";
```

**Expected:** Row counts match pre-deployment baseline

### 2. Verify Constraints and Indexes

```sql
-- Check all constraints
SELECT 
  conname,
  contype,
  CASE WHEN convalidated THEN 'VALID' ELSE 'NOT VALID' END as status
FROM pg_constraint
WHERE conname IN (
  'RecipeItem_recipeId_ingredientId_key',
  'RecipeSection_recipeId_order_key',
  'Company_ownerId_fkey',
  'ProductionPlan_createdBy_fkey',
  'ProductionTask_assignedTo_fkey',
  'InventoryMovement_createdBy_fkey',
  'recipe_selling_price_positive',
  'ingredient_pack_price_positive',
  'recipe_yield_quantity_positive',
  'recipe_item_quantity_positive',
  'recipe_category_consistency_check'
)
ORDER BY conname;

-- Check all indexes
SELECT 
  indexname,
  CASE WHEN indisvalid THEN 'VALID' ELSE 'INVALID' END as status
FROM pg_indexes i
LEFT JOIN pg_index idx ON idx.indexrelid = (SELECT oid FROM pg_class WHERE relname = i.indexname)
WHERE i.indexname LIKE 'idx_%'
ORDER BY i.indexname;
```

### 3. Run Smoke Tests

```bash
# Test key endpoints (adjust URLs as needed)
curl https://your-app.com/api/recipes | jq '.length'
curl https://your-app.com/api/recipes/1 | jq '.id'
curl https://your-app.com/dashboard/recipes | grep -q "Recipe"
```

### 4. Compare Performance Metrics

```bash
# Capture post-deployment metrics
psql $PROD_DATABASE_URL -f docs/db/observability.sql > prod_post_deploy_$(date +%Y%m%d_%H%M%S).txt

# Compare to baseline
diff prod_baseline_*.txt prod_post_deploy_*.txt
```

### 5. Monitor Application Logs

```bash
# Check for errors (adjust log location as needed)
tail -f /var/log/app/error.log | grep -i "database\|constraint\|foreign\|index"
```

---

## Rollback Procedures

### If Issues Detected

**Option 1: Rollback Individual Migration**

```bash
# Rollback Migration 1
psql $PROD_DATABASE_URL -f migrations/rollbacks/20250115120000_add_composite_unique_constraints_rollback.sql

# Rollback Migration 2 (drop FKs)
psql $PROD_DATABASE_URL -c "
ALTER TABLE \"Company\" DROP CONSTRAINT IF EXISTS \"Company_ownerId_fkey\";
ALTER TABLE \"ProductionPlan\" DROP CONSTRAINT IF EXISTS \"ProductionPlan_createdBy_fkey\";
ALTER TABLE \"ProductionTask\" DROP CONSTRAINT IF EXISTS \"ProductionTask_assignedTo_fkey\";
ALTER TABLE \"InventoryMovement\" DROP CONSTRAINT IF EXISTS \"InventoryMovement_createdBy_fkey\";
"

# Rollback Migration 3 (drop CHECK constraints)
psql $PROD_DATABASE_URL -c "
ALTER TABLE \"Recipe\" DROP CONSTRAINT IF EXISTS recipe_selling_price_positive;
ALTER TABLE \"Ingredient\" DROP CONSTRAINT IF EXISTS ingredient_pack_price_positive;
ALTER TABLE \"Recipe\" DROP CONSTRAINT IF EXISTS recipe_yield_quantity_positive;
ALTER TABLE \"RecipeItem\" DROP CONSTRAINT IF EXISTS recipe_item_quantity_positive;
"

# Rollback Migration 4 (drop indexes CONCURRENTLY)
psql $PROD_DATABASE_URL -c "
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_name_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_description_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_method_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_list_covering;
DROP INDEX CONCURRENTLY IF EXISTS idx_sales_record_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_production_history_company_date_recipe;
DROP INDEX CONCURRENTLY IF EXISTS idx_inventory_movement_history;
DROP INDEX CONCURRENTLY IF EXISTS idx_notification_unread;
DROP INDEX CONCURRENTLY IF EXISTS idx_wholesale_order_status_date;
"

# Rollback Migration 5-6 (remove trigger and constraint)
psql $PROD_DATABASE_URL -c "
DROP TRIGGER IF EXISTS sync_recipe_category_trigger ON \"Recipe\";
DROP FUNCTION IF EXISTS sync_recipe_category_from_id();
ALTER TABLE \"Recipe\" DROP CONSTRAINT IF EXISTS recipe_category_consistency_check;
"
```

**Option 2: Full PITR Restore**

```bash
# Contact DBA for PITR restore to restore point
# Restore point: pre_fix_batch_production_20250115
```

---

## Success Criteria

✅ **Migration Successful If:**

- [ ] All constraints created and VALID
- [ ] All indexes created and VALID
- [ ] Row counts unchanged
- [ ] No application errors
- [ ] Query performance improved or unchanged
- [ ] No increased lock waits
- [ ] All smoke tests pass

---

## Post-Deployment Monitoring (24-48 hours)

### Hourly Checks (First 4 Hours)

```sql
-- Check for long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '1 minute'
ORDER BY duration DESC;

-- Check for lock waits
SELECT * FROM pg_locks WHERE NOT granted;

-- Check error rates (from application logs)
```

### Daily Checks (Next 7 Days)

- [ ] Monitor query performance (pg_stat_statements)
- [ ] Check index usage (pg_stat_user_indexes)
- [ ] Verify no increased error rates
- [ ] Monitor application response times

---

## Emergency Contacts

**Database Team:** _______________  
**On-Call Engineer:** _______________  
**Escalation:** _______________

---

## Notes

- All migrations are idempotent (safe to run multiple times)
- CONCURRENTLY indexes may take longer but don't lock tables
- NOT VALID FKs validate in background (non-blocking)
- Category field cleanup migration is disabled by default (enable after 1 week)

---

**Deployment Completed By:** _______________  
**Date:** _______________  
**Status:** ⚠️ PENDING


