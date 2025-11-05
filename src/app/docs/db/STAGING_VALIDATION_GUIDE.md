# Staging Validation Guide

**Purpose:** Validate all migrations on staging before production deployment  
**Time Required:** 30-60 minutes  
**Prerequisites:** Fresh production snapshot restored to staging

## Quick Start

```bash
# 1. Verify migration safety
./scripts/verify-migration-safety.sh

# 2. Run full staging validation
export STAGING_DATABASE_URL="postgresql://..."
./scripts/validate-migrations-staging.sh

# 3. If validation passes, deploy to production
export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="postgresql://..."
./scripts/deploy-migrations-production.sh
```

## Detailed Steps

### Step 0: Create Staging from Production Snapshot

```bash
# Create backup from production
pg_dump "$PROD_DATABASE_URL" > prod_snapshot_$(date +%Y%m%d).sql

# Restore to staging
createdb staging_db_name
psql staging_db_name < prod_snapshot_$(date +%Y%m%d).sql

# Verify same Postgres version
psql "$STAGING_DATABASE_URL" -c "SELECT version(), current_setting('server_version_num');"
```

### Step 1: Run Tests Before Migration (Baseline)

```bash
npm test -- tests/integration/
```

**Expected:** All tests pass

### Step 2: Record Performance Baseline

```bash
psql "$STAGING_DATABASE_URL" -f docs/db/observability.sql > baseline_perf.txt
```

**Save for comparison after migrations**

### Step 3: Confirm Required Extensions

```sql
SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','uuid-ossp','citext');
```

**Expected:** Extensions exist or will be created by migrations

### Step 4: Capture Table Sizes

```sql
SELECT relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC 
LIMIT 20;
```

**Save row counts for verification after migration**

### Step 5: Set Timeouts and Create Restore Point

```sql
SET lock_timeout='2s';
SET statement_timeout='5min';
SELECT pg_create_restore_point('pre_fix_batch_staging_' || to_char(now(), 'YYYYMMDD_HH24MISS'));
```

### Step 6: Apply Migrations

```bash
# Manual application (for debugging)
for f in migrations/20250115120000_*.sql migrations/20250115130000_*.sql migrations/20250115140000_*.sql migrations/20250115150000_*.sql migrations/20250115160000_*.sql migrations/20250115160001_*.sql; do
  echo ">> $f"
  psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || exit 1
done

# Or use automated script
./scripts/validate-migrations-staging.sh
```

### Step 7: Re-run Tests

```bash
npm test -- tests/integration/
```

**Expected:** All tests still pass

### Step 8: Compare Performance

```bash
psql "$STAGING_DATABASE_URL" -f docs/db/observability.sql > after_perf.txt
diff -u baseline_perf.txt after_perf.txt | head -200
```

**Check for:**
- Query latency increases > 20%
- New sequential scans
- Increased lock waits

### Step 9: Verify Foreign Keys

```sql
SELECT conname, convalidated 
FROM pg_constraint 
WHERE contype='f' 
ORDER BY convalidated, conname;
```

**Expected:** All `convalidated = true`

### Step 10: Verify Indexes

```sql
SELECT i.relname idx, x.indisvalid, x.indisready
FROM pg_index x 
JOIN pg_class i ON i.oid=x.indexrelid
WHERE i.relkind='i' 
  AND i.relname LIKE 'idx_%'
ORDER BY x.indisvalid, x.indisready;
```

**Expected:** All `indisvalid = true`, `indisready = true`

### Step 11: Verify Dual-Write Trigger

```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname ILIKE '%recipe_category%';
```

**Expected:** Trigger exists if category migration ran

## Success Criteria

✅ **All tests pass** (before and after)  
✅ **All FKs are VALID**  
✅ **All indexes are VALID**  
✅ **No performance regression > 20%**  
✅ **No new sequential scans**  
✅ **Row counts unchanged**  
✅ **No active locks**

## Blockers (Stop if Any Occur)

❌ **Test failures**  
❌ **Invalid foreign keys** (`convalidated = false`)  
❌ **Invalid indexes** (`indisvalid = false`)  
❌ **Query latency increase > 20%**  
❌ **Migration errors**  
❌ **Data loss** (row count changes)

## If Validation Fails

1. **Stop immediately**
2. **Check migration logs** (`*.log` files)
3. **Review error messages**
4. **Fix issues in branch**
5. **Re-run validation**

## Decision Rule

**Proceed to Production ONLY IF:**
- ✅ All staging validation checks pass
- ✅ No blockers identified
- ✅ Performance metrics acceptable
- ✅ Team reviewed and approved

**Defer if any breach. Fix in branch. Re-run staging.**

---

## Production Deployment

Once staging validation passes:

```bash
export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="postgresql://..."
./scripts/deploy-migrations-production.sh
```

See `DEPLOYMENT_RUNBOOK.md` for detailed production steps.


