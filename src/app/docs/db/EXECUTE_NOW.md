# Execute Now: Step-by-Step Guide

**Follow these steps in order. Do not skip.**

## Step 1: Refresh Staging from Prod

```bash
# Create prod snapshot
pg_dump "$PROD_DATABASE_URL" > prod_snapshot_$(date +%Y%m%d_%H%M%S).sql

# Restore to staging
createdb staging_db_name  # or use your staging DB name
psql staging_db_name < prod_snapshot_$(date +%Y%m%d_%H%M%S).sql

# Verify same Postgres version
psql "$STAGING_DATABASE_URL" -c "SELECT version(), current_setting('server_version_num');"
psql "$PROD_DATABASE_URL" -c "SELECT version(), current_setting('server_version_num');"
# Versions should match

# Verify extensions
psql "$STAGING_DATABASE_URL" -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');"
```

**Expected:** Extensions exist or can be created

---

## Step 2: Point App/CI at Staging

```bash
export STAGING_DATABASE_URL="postgres://user:pass@host:5432/staging_db"

# Verify app can connect
psql "$STAGING_DATABASE_URL" -c "SELECT 1;"
```

**Expected:** Connection successful

---

## Step 3: Run Validation

```bash
# Option A: Use the automated script (recommended)
./scripts/run-full-validation.sh staging 2>&1 | tee staging_validation.log

# Option B: Run validation script directly
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
```

**This will:**
1. Run tests before migration
2. Capture performance baseline
3. Apply all 6 migrations
4. Re-run tests
5. Verify constraints/indexes
6. Check for blockers
7. Exit with code 0 (pass) or 1 (fail)

---

## Step 4: Pass Criteria (ALL Must Be True)

Check `staging_validation.log` for:

### ✅ Tests Green
```bash
grep -i "test" staging_validation.log | grep -i "fail\|error"
# Should return nothing
```

### ✅ All FKs/Uniques VALID
```bash
psql "$STAGING_DATABASE_URL" -c "SELECT conname, convalidated FROM pg_constraint WHERE contype IN ('f','u') AND convalidated=false;"
# Should return 0 rows
```

### ✅ All Indexes VALID and READY
```bash
psql "$STAGING_DATABASE_URL" -c "SELECT i.relname, x.indisvalid, x.indisready FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE i.relkind='i' AND (x.indisvalid=false OR x.indisready=false);"
# Should return 0 rows
```

### ✅ Performance ≤20% Regression
```bash
# Compare baseline vs after
diff -u baseline_perf.txt after_perf.txt | grep -E "mean_exec_time|total_exec_time"
# Check for >20% increases
```

### ✅ No Failed Migrations
```bash
grep -i "failed\|error" staging_validation.log | grep -i "migration"
# Should return nothing
```

### ✅ No Long Locks or Blocking Transactions
```bash
grep -i "lock\|block" staging_validation.log | grep -i "found\|detected"
# Should show "No active locks" or "No blocking transactions"
```

---

## Step 5a: If PASS → Deploy to Production

```bash
# Schedule low-traffic window first!

# Set environment
export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="postgres://user:pass@prod-host:5432/prod"

# Deploy
./scripts/run-full-validation.sh production 2>&1 | tee prod_deploy.log

# OR use direct script
./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log
```

### Post-Deploy Checks (Run Both):

```sql
-- Check constraints
SELECT conname, convalidated 
FROM pg_constraint 
WHERE contype IN ('f','u','c')
ORDER BY convalidated, conname;

-- Check indexes
SELECT i.relname, x.indisvalid, x.indisready
FROM pg_index x 
JOIN pg_class i ON i.oid=x.indexrelid 
WHERE i.relkind='i'
ORDER BY x.indisvalid, x.indisready, i.relname;
```

**Expected:**
- All constraints: `convalidated = true`
- All indexes: `indisvalid = true`, `indisready = true`

### Hold-Backs:

- [ ] **Keep cleanup migration disabled for 7 days**
  - File: `migrations/20250115160002_fix_recipe_category_fields_cleanup.sql`
  - Enable only after metrics are flat

- [ ] **Monitor daily:**
  - Slow query log
  - pg_stat_statements (compare to staging baseline)
  - Application error rates

---

## Step 5b: If FAIL → Fix and Re-Run

**STOP. DO NOT DEPLOY.**

### Common Failures and Fixes:

#### Invalid Constraints/Indexes
```bash
# Check which ones failed
grep -i "invalid\|not valid\|not ready" staging_validation.log

# Fix: Add VALIDATE CONSTRAINT step or wait for indexes to finish
```

#### Performance Regression >20%
```bash
# Review performance diff
diff -u baseline_perf.txt after_perf.txt

# Fix options:
# 1. Add missing index (see perf_report.md)
# 2. Rewrite slow query
# 3. Split migration into smaller chunks
```

#### Lock/Blocked Session
```bash
# Find blockers
psql "$STAGING_DATABASE_URL" -c "SELECT pid, state, query FROM pg_stat_activity WHERE wait_event IS NOT NULL;"

# Fix:
# 1. Kill blocking transactions
# 2. Add CONCURRENTLY to index creation
# 3. Split FK migrations
```

### Fix Process:

1. **Create branch:**
   ```bash
   git checkout -b fix/migration-issue-name
   ```

2. **Fix the issue** (see fixes above)

3. **Re-run staging validation:**
   ```bash
   ./scripts/run-full-validation.sh staging 2>&1 | tee staging_validation.log
   ```

4. **Repeat until green**

---

## Common Foot-Guns (Check Before Prod)

### ❌ Missing Extensions on Prod
```sql
-- Check before deploy
SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');

-- Create if missing (requires superuser or CREATE privilege)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
```

### ❌ Pool Limits Too Low
```sql
-- Check current connections
SHOW max_connections;
SELECT COUNT(*) FROM pg_stat_activity;

-- Ensure pool can handle concurrent VALIDATE operations
-- May need to increase pool size or max_connections
```

### ❌ ORM Client Not Regenerated
```bash
# After migrations, regenerate Prisma client
npx prisma generate

# Run tests again
npm test -- tests/integration/
```

---

## Bottom Line

**Run this now:**
```bash
export STAGING_DATABASE_URL="your-staging-url"
./scripts/run-full-validation.sh staging 2>&1 | tee staging_validation.log
```

**Use pass/fail as the gate:**
- ✅ **PASS** → Deploy to production
- ❌ **FAIL** → Fix in branch, re-run staging

**No half-measures. If staging fails, stop and fix.**

---

## Quick Reference

```bash
# 1. Safety check
./scripts/verify-migration-safety.sh

# 2. Staging validation
export STAGING_DATABASE_URL="..."
./scripts/run-full-validation.sh staging

# 3. If passes, production deploy
export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="..."
./scripts/run-full-validation.sh production
```

---

**Ready to execute. Run Step 3 now.**


