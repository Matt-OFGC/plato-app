# 🚀 RUN NOW: Database Migration Execution

**Status:** ✅ Ready  
**Time:** 30-60 minutes

## Quick Execution

### Step 1: Refresh Staging from Prod

```bash
export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"
export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"

# Automated
./scripts/refresh-staging-from-prod.sh

# OR Manual
pg_dump --format=custom "$PROD_DATABASE_URL" -f prod_$(date +%Y%m%d_%H%M%S).dump
STAGING_DB_NAME=$(echo "$STAGING_DATABASE_URL" | sed -E 's|.*/([^/]+)$|\1|')
dropdb --if-exists "$STAGING_DB_NAME" && createdb "$STAGING_DB_NAME"
pg_restore --no-owner --no-privileges --clean --if-exists -d "$STAGING_DATABASE_URL" prod_*.dump
psql "$STAGING_DATABASE_URL" -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');"
```

### Step 2: Run Validation Gate

```bash
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
EXIT_CODE=$?
echo "EXIT_CODE=$EXIT_CODE"

# Quick scan
grep -E "(PASSED|FAILED|BLOCKER)" staging_validation.log | tail -n 50
```

**Decision:**
- **Exit code 0 = PASS** → Proceed to Step 3A
- **Any other = FAIL** → Go to Step 3B

### Step 3A: If PASS → Deploy to Prod

```bash
# Schedule low-traffic window first!

export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"

./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log
```

**Post-deploy checks:**
```sql
-- All constraints validated
SELECT conname, convalidated 
FROM pg_constraint 
WHERE contype IN ('f','u','c') AND NOT convalidated;
-- Should return 0 rows

-- All indexes valid and ready
SELECT i.relname, x.indisvalid, x.indisready
FROM pg_index x 
JOIN pg_class i ON i.oid=x.indexrelid 
WHERE NOT x.indisvalid OR NOT x.indisready;
-- Should return 0 rows
```

**Hold-backs:**
- Keep cleanup migration disabled for 7 days
- Watch pg_stat_statements daily

### Step 3B: If FAIL → Stop and Fix

**❌ STOP - DO NOT DEPLOY**

**Review issues:**
```bash
grep -E "(FAILED|BLOCKER|Invalid|failed)" staging_validation.log
```

**Common fixes:**
- Invalid FK/index → ensure NOT VALID + VALIDATE, use CONCURRENTLY
- SET NOT NULL failing → backfill nulls first
- Perf regression >20% → add index or rewrite query
- Locks → split migration, validate in batches, kill blockers

**Fix in branch, re-run Step 2**

---

## Minimal Decision Rule

- **Staging exit code 0 → ship**
- **Anything else → don't. Fix, re-run, then ship**

---

## Execute Step 2 Now

```bash
export STAGING_DATABASE_URL="your-staging-url"
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
echo "EXIT_CODE=$?"
```

**That's it. Use the exit code as the gate.**


