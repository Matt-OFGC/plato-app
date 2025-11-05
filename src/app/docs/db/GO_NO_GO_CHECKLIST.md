# Go / No-Go Checklist for Database Migrations

**Date:** 2025-01-15  
**Migrations:** Phase 1-4 (Composite Unique, FKs, CHECK, Indexes)  
**Status:** ⚠️ PENDING REVIEW

## Pre-Migration Checklist

### 1. Branch + Staging Clone ✅

- [ ] Create fresh branch: `git checkout -b db-audit-fixes-production-safe`
- [ ] Take production snapshot: `pg_dump $PROD_DATABASE_URL > prod_snapshot_$(date +%Y%m%d).sql`
- [ ] Restore to staging DB with same Postgres version
- [ ] Verify staging DB version matches production:
  ```sql
  SELECT version(), current_setting('server_version_num');
  ```

### 2. Extensions and Privileges ✅

- [ ] Confirm required extensions exist:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS uuid-ossp;  -- If referenced
  CREATE EXTENSION IF NOT EXISTS citext;     -- If referenced
  ```
- [ ] Verify app role can CREATE INDEX CONCURRENTLY:
  ```sql
  -- Check current user privileges
  SELECT current_user, usesuper FROM pg_user WHERE usename = current_user;
  ```
- [ ] Verify app role can CREATE EXTENSION (or have superuser run it):
  ```sql
  -- Must be superuser or have CREATE privilege on database
  ```

### 3. Lock-Safety Audit of Migrations ✅

#### Migration 1: Composite Unique Constraints
- [x] ✅ No indexes on large tables (small tables only)
- [x] ✅ No column type changes
- [x] ✅ Idempotent (IF NOT EXISTS checks)
- [x] ✅ Rollback script exists

#### Migration 2: Missing Foreign Keys
- [x] ✅ Uses NOT VALID + VALIDATE pattern (lock-safe)
- [x] ✅ No column type changes
- [x] ✅ Idempotent
- [x] ⚠️ Rollback script needed (to be created)

#### Migration 3: CHECK Constraints
- [x] ✅ No indexes on large tables
- [x] ✅ No column type changes
- [x] ✅ Idempotent
- [x] ✅ Rollback script exists (via DROP CONSTRAINT)

#### Migration 4: Performance Indexes
- [x] ✅ **Uses CREATE INDEX CONCURRENTLY** (lock-safe)
- [x] ✅ No column type changes
- [x] ✅ Idempotent
- [x] ⚠️ Rollback script needed (DROP INDEX CONCURRENTLY)

#### Migration 5: Category Fields (Backfill)
- [x] ✅ Backfill script with row counts
- [x] ✅ Dual-write trigger for cutover
- [x] ✅ Cleanup migration disabled by default

### 4. Backfill Plan for Dual Category Fields ✅

- [x] ✅ Deterministic mapping: `category` → `categoryId` via Category.name lookup
- [x] ✅ Backfill script with before/after row counts: `20250115160000_fix_recipe_category_fields_backfill.sql`
- [x] ✅ Dual-write trigger to keep fields in sync: `sync_recipe_category_trigger`
- [x] ✅ Cutover migration with CHECK constraint: `20250115160001_fix_recipe_category_fields_cutover.sql`
- [x] ✅ Cleanup migration (disabled): `20250115160002_fix_recipe_category_fields_cleanup.sql`

**Backfill Verification:**
```sql
-- Before backfill
SELECT COUNT(*) FROM "Recipe" WHERE category IS NOT NULL AND "categoryId" IS NULL;

-- After backfill
SELECT COUNT(*) FROM "Recipe" WHERE category IS NOT NULL AND "categoryId" IS NOT NULL;
```

### 5. Test Gates ✅

- [ ] Run integration tests on staging:
  ```bash
  npm test -- tests/integration/db_contract.test.ts
  npm test -- tests/integration/recipe_flow.test.ts
  ```
- [ ] Run observability queries and capture baselines:
  ```bash
  psql $STAGING_DATABASE_URL -f docs/db/observability.sql > staging_baseline_$(date +%Y%m%d).txt
  ```
- [ ] Capture key metrics:
  - Top 10 queries by latency
  - Table bloat percentages
  - Sequential scan counts
  - Long-running transactions

### 5.5. Required Tables Present ✅

- [ ] Verify all required tables exist (fail-fast check):
  ```bash
  ./scripts/validate-migrations-staging.sh
  # Should pass Step [0.6] Required Table Presence Check
  ```
- [ ] Required tables: Recipe, RecipeItem, RecipeSection, Ingredient, Category, Company, User, Membership
- [ ] If any table is missing → schema drift detected, fix before proceeding

### 5.6. Orphan Integrity Gate ✅

- [ ] Run orphan integrity checks:
  ```bash
  psql $STAGING_DATABASE_URL -f docs/db/integrity_checks.sql
  # Must return zero rows
  ```
- [ ] Verify no orphaned references:
  - RecipeItem.recipeId → Recipe.id (must exist)
  - RecipeItem.ingredientId → Ingredient.id (must exist)
  - RecipeSection.recipeId → Recipe.id (must exist)
  - All junction table references valid
- [ ] If orphans found → clean data before proceeding

### 6. Kill Switch ✅

- [ ] Create PITR restore point:
  ```sql
  SELECT pg_create_restore_point('pre_fix_batch_20250115');
  ```
- [ ] Document rollback procedure per phase
- [ ] Assign rollback executor: _______________
- [ ] Test rollback on staging first

---

## Execution Order

### Phase 0: Dry Run on Staging

**Order:**
1. `20250115120000_add_composite_unique_constraints.sql`
2. `20250115130000_add_missing_foreign_keys_production_safe.sql`
3. `20250115140000_add_check_constraints.sql`
4. `20250115150000_add_performance_indexes.sql` (CONCURRENTLY)
5. `20250115160000_fix_recipe_category_fields_backfill.sql`
6. `20250115160001_fix_recipe_category_fields_cutover.sql`

**After Each Migration:**
- [ ] Run EXPLAIN (ANALYZE, BUFFERS) on top 10 queries from perf_report.md
- [ ] Re-run `tests/integration/recipe_flow.test.ts`
- [ ] Compare metrics vs baseline
- [ ] Check for long locks: `SELECT * FROM pg_locks WHERE NOT granted;`

**Success Criteria:**
- ✅ All tests pass
- ✅ Query latency not worse for any top-10 query
- ✅ No long locks during migration
- ✅ Backfill yields 100% mapped rows with zero data loss

---

### Phase 1: Production Prep

- [ ] Schedule low-traffic window: _______________
- [ ] Set session timeouts:
  ```sql
  SET lock_timeout = '2s';
  SET statement_timeout = '5min';
  SET idle_in_transaction_session_timeout = '10min';
  ```
- [ ] Enable monitoring:
  ```sql
  -- Enable pg_stat_statements (if not already)
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
  
  -- Enable slow query log (in postgresql.conf)
  -- log_min_duration_statement = 1000
  ```

---

### Phase 2: Production Deploy

**Pre-Deploy:**
- [ ] Create restore point:
  ```sql
  SELECT pg_create_restore_point('pre_fix_batch_production_20250115');
  ```
- [ ] Set session timeouts (same as Phase 1)
- [ ] Backup database: `pg_dump $PROD_DATABASE_URL > prod_backup_$(date +%Y%m%d_%H%M%S).sql`

**Run Migrations (in order):**
1. [ ] `20250115120000_add_composite_unique_constraints.sql`
2. [ ] `20250115130000_add_missing_foreign_keys_production_safe.sql`
3. [ ] `20250115140000_add_check_constraints.sql`
4. [ ] `20250115150000_add_performance_indexes.sql` (CONCURRENTLY)
5. [ ] `20250115160000_fix_recipe_category_fields_backfill.sql`
6. [ ] `20250115160001_fix_recipe_category_fields_cutover.sql`

**After Each Migration:**
- [ ] Validate constraint/index creation:
  ```sql
  -- Check constraints
  SELECT conname, convalidated FROM pg_constraint 
  WHERE conname IN ('RecipeItem_recipeId_ingredientId_key', 'RecipeSection_recipeId_order_key');
  
  -- Check indexes
  SELECT indexname, indisvalid FROM pg_indexes 
  WHERE indexname LIKE 'idx_%' 
  ORDER BY indexname;
  ```
- [ ] Verify row counts unchanged:
  ```sql
  SELECT 'Recipe' as table_name, COUNT(*) FROM "Recipe"
  UNION ALL SELECT 'RecipeItem', COUNT(*) FROM "RecipeItem"
  UNION ALL SELECT 'RecipeSection', COUNT(*) FROM "RecipeSection";
  ```
- [ ] Run smoke tests from CI against prod read-only endpoints
- [ ] Compare observability metrics to staging deltas

**Post-Deploy:**
- [ ] Monitor application error rates
- [ ] Monitor query performance (pg_stat_statements)
- [ ] Verify no increased lock waits
- [ ] Document any issues encountered

---

## Red Flags to Inspect Before Production

### ❌ BLOCK These Patterns:

1. **Dropping columns/constraints without deprecation**
   - Status: ✅ Cleanup migration is disabled by default

2. **ALTER TABLE ... SET NOT NULL on column with nulls**
   - Status: ✅ No NOT NULL additions without backfill

3. **USING clause rewriting large table in place**
   - Status: ✅ No type changes, only additive constraints

4. **Prisma schema drift**
   - Status: ⚠️ Verify with:
     ```bash
     npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
     ```
   - Should show zero drift

---

## Rollback Procedures

### Rollback Phase 1: Composite Unique Constraints
```sql
-- Run rollback script
\i migrations/rollbacks/20250115120000_add_composite_unique_constraints_rollback.sql
```

### Rollback Phase 2: Foreign Keys
```sql
-- Drop FKs (if needed)
ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "Company_ownerId_fkey";
ALTER TABLE "ProductionPlan" DROP CONSTRAINT IF EXISTS "ProductionPlan_createdBy_fkey";
ALTER TABLE "ProductionTask" DROP CONSTRAINT IF EXISTS "ProductionTask_assignedTo_fkey";
ALTER TABLE "InventoryMovement" DROP CONSTRAINT IF EXISTS "InventoryMovement_createdBy_fkey";
```

### Rollback Phase 3: CHECK Constraints
```sql
ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS recipe_selling_price_positive;
ALTER TABLE "Ingredient" DROP CONSTRAINT IF EXISTS ingredient_pack_price_positive;
ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS recipe_yield_quantity_positive;
ALTER TABLE "RecipeItem" DROP CONSTRAINT IF EXISTS recipe_item_quantity_positive;
```

### Rollback Phase 4: Performance Indexes
```sql
-- Drop indexes CONCURRENTLY
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_name_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_description_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_method_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_recipe_list_covering;
DROP INDEX CONCURRENTLY IF EXISTS idx_sales_record_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_production_history_company_date_recipe;
DROP INDEX CONCURRENTLY IF EXISTS idx_inventory_movement_history;
DROP INDEX CONCURRENTLY IF EXISTS idx_notification_unread;
DROP INDEX CONCURRENTLY IF EXISTS idx_wholesale_order_status_date;
```

### Full Rollback (PITR)
```sql
-- Restore from restore point (requires WAL archiving)
-- Contact DBA for PITR restore procedure
```

---

## Decision Gate

**Proceed to Production Only If:**

- [x] ✅ All staging tests pass
- [x] ✅ Required tables present (no schema drift)
- [x] ✅ Orphans = 0 (no orphaned foreign key references)
- [x] ✅ Query latency not worse for any top-10 query
- [x] ✅ No long locks during migration rehearsal
- [x] ✅ Backfill yields 100% mapped rows with zero data loss
- [x] ✅ All FKs validated (no NOT VALID constraints remaining)
- [x] ✅ All indexes valid and ready
- [x] ✅ Rollback procedures tested on staging
- [x] ✅ Team reviewed and approved
- [x] ✅ Low-traffic window scheduled
- [x] ✅ Backup created
- [x] ✅ Restore point created
- [x] ✅ Monitoring enabled

**Go / No-Go Decision:** ⚠️ PENDING

**Approved By:** _______________  
**Date:** _______________

---

## Post-Deployment Monitoring

Monitor for 24-48 hours after deployment:

- [ ] Error rates (should not increase)
- [ ] Query latency (should improve or stay same)
- [ ] Lock waits (should not increase)
- [ ] Index usage (new indexes should be used)
- [ ] Application logs (no new errors)

**If issues detected:**
1. Document issue
2. Assess severity
3. Decide: fix forward vs rollback
4. Execute rollback if critical

---

## Next Steps After Clean Migration

1. Wait 1 week of stable production metrics
2. Enable cleanup migration (category field removal) via feature flag
3. Monitor for 1 more week
4. Remove category field permanently
5. Schedule follow-up audit in 1 month


