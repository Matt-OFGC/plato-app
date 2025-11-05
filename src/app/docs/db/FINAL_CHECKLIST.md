# Final Deployment Checklist

**Use this checklist before production deployment**

## Pre-Deployment (Before Running Scripts)

- [ ] **Fresh production snapshot restored to staging**
  ```bash
  pg_dump "$PROD_DATABASE_URL" > prod_snapshot_$(date +%Y%m%d).sql
  createdb staging_db
  psql staging_db < prod_snapshot_$(date +%Y%m%d).sql
  ```

- [ ] **Staging database has same Postgres version as production**
  ```sql
  SELECT version(), current_setting('server_version_num');
  ```

- [ ] **App pointed at staging for CI tests**
  - Verify CI can connect to staging
  - Tests can run against staging DB

- [ ] **User has required privileges**
  - CREATE EXTENSION (or superuser)
  - CREATE INDEX CONCURRENTLY
  - VALIDATE CONSTRAINT

## Step 1: Safety Check (30 seconds)

```bash
./scripts/verify-migration-safety.sh
```

**Expected:** ✅ All safety checks passed

**If fails:** Fix issues in migrations, then re-run

## Step 2: Staging Validation (30-60 minutes)

```bash
export STAGING_DATABASE_URL="postgres://user:pass@host:5432/staging_db"
./scripts/validate-migrations-staging.sh
```

### Staging Pass Criteria (ALL must pass):

- [ ] ✅ **All tests green** (before and after migration)
- [ ] ✅ **All FKs and uniques VALID** (`convalidated = true`)
- [ ] ✅ **All new indexes VALID and READY** (`indisvalid = true`, `indisready = true`)
- [ ] ✅ **Top-10 query latency change ≤ 20%** (compare baseline_perf.txt vs after_perf.txt)
- [ ] ✅ **Zero failed migrations**
- [ ] ✅ **No long locks** (no ungranted locks)
- [ ] ✅ **No blocking idle transactions**

### If Staging Fails:

**STOP. DO NOT DEPLOY.**

1. Create branch per failing area
2. Fix issues:
   - Add `CREATE INDEX CONCURRENTLY` where missing
   - Add `NOT VALID` + `VALIDATE CONSTRAINT` for FKs on hot tables
   - Backfill nulls before `SET NOT NULL`
   - Split heavy migrations into smaller files
   - Add indexes to eliminate seq scans
3. Re-run staging script
4. Repeat until green

## Step 3: Production Deployment (10-20 minutes)

**ONLY PROCEED IF STAGING PASSED ALL CHECKS**

```bash
export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="postgres://user:pass@prod-host:5432/prod_db"
./scripts/deploy-migrations-production.sh
```

**Run during low-traffic window**

### Immediate Post-Deploy Checks (Production)

```sql
-- Constraints valid
SELECT conname, convalidated 
FROM pg_constraint 
WHERE contype IN ('f','u','c') 
ORDER BY convalidated;

-- Indexes valid/ready
SELECT i.relname, x.indisvalid, x.indisready
FROM pg_index x 
JOIN pg_class i ON i.oid=x.indexrelid
WHERE i.relkind='i' 
ORDER BY x.indisvalid, x.indisready;

-- Lock survey
SELECT pid, state, wait_event_type, wait_event, query
FROM pg_stat_activity 
WHERE wait_event IS NOT NULL;
```

**Expected:**
- All constraints `convalidated = true`
- All indexes `indisvalid = true`, `indisready = true`
- No wait events or locks

## Post-Deployment Monitoring (24-72 hours)

### Daily Checks:

- [ ] **Slow query log** - Compare against staging baseline
- [ ] **pg_stat_statements** - Track query performance deltas
- [ ] **Autovacuum** - Monitor large tables (ActivityLog, etc.)
  - If dead tuples spike, tune `autovacuum_vacuum_scale_factor`

### Hold-Backs:

- [ ] **Keep cleanup migration disabled for one week**
  - File: `migrations/20250115160002_fix_recipe_category_fields_cleanup.sql`
  - Enable only after metrics are flat

- [ ] **Monitor ORM drift**
  - Regenerate Prisma client after migrations
  - Run tests again to verify

## Common Gotchas

### ❌ Missing Extensions on Prod
**Check before deploy:**
```sql
SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');
```

### ❌ Long-Running Idle Transactions
**Kill before VALIDATE CONSTRAINT:**
```sql
SELECT pid, query FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
AND now() - state_change > interval '1 minute';

-- Kill if needed (be careful!)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
AND now() - state_change > interval '5 minutes';
```

### ❌ Pooler Limits
**Ensure pool size + max_connections can handle concurrent validates:**
```sql
SHOW max_connections;
-- Check your connection pooler settings (PgBouncer, etc.)
```

### ❌ ORM Drift
**After migrations:**
```bash
npx prisma generate
npm test -- tests/integration/
```

## Decision Rule

**✅ GO TO PRODUCTION IF:**
- Staging validation passed ALL checks
- No blockers identified
- Performance acceptable (≤20% latency increase)
- Team reviewed and approved

**❌ DEFER IF:**
- Any test failures
- Invalid constraints/indexes
- Performance regression >20%
- Any migration errors
- Blocking transactions

**Fix in branch → Re-run staging → Proceed**

---

## Quick Command Reference

```bash
# 1. Safety check
./scripts/verify-migration-safety.sh

# 2. Staging validation
export STAGING_DATABASE_URL="..."
./scripts/validate-migrations-staging.sh

# 3. Pre-deploy checks
export PROD_DATABASE_URL="..."
./scripts/pre-deploy-checks.sh

# 4. Production deploy
export STAGING_VALIDATION_PASSED=true
./scripts/deploy-migrations-production.sh
```

---

**Status:** Ready for staging validation

Run Step 1 and Step 2 now. If staging passes, proceed to production.


