# Execute Migration Workflow

**Follow these steps in exact order. No shortcuts.**

## Step 1: Set Environment Variables

**⚠️ Use secrets manager or `read -s` - DO NOT paste creds into chat**

```bash
# Option 1: Use read -s (secure)
read -s PROD_DB_URL
export PROD_DATABASE_URL="$PROD_DB_URL"

read -s STAGING_DB_URL
export STAGING_DATABASE_URL="$STAGING_DB_URL"

# Option 2: Set directly (if using secrets manager)
export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"
export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"
```

---

## Step 2: Refresh Staging from Prod

```bash
./scripts/refresh-staging-from-prod.sh

# Verify extensions
psql "$STAGING_DATABASE_URL" -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');"
```

**If extensions missing, install before validation:**
```bash
psql "$STAGING_DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql "$STAGING_DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS citext;"
psql "$STAGING_DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

---

## Step 3: Run Validation Gate

```bash
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
EXIT_CODE=$?
echo "EXIT_CODE=$EXIT_CODE"

# Quick scan
grep -E "(PASSED|FAILED|BLOCKER)" staging_validation.log | tail -n 50
```

**Pass criteria (encoded in script):**
- Exit code 0 = PASS
- Any other = FAIL

---

## Step 4: Decide

### If EXIT_CODE=0 → Deploy (Step 5A)

### If EXIT_CODE≠0 → Stop and Fix (Step 5B)

---

## Step 5A: If PASS → Deploy to Prod

**⚠️ Schedule low-traffic window first!**

```bash
export STAGING_VALIDATION_PASSED=true
./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log
```

### Post-Deploy Spot Checks

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

### Hold-Backs

- [ ] Keep cleanup migration disabled for 7 days
- [ ] Monitor pg_stat_statements daily

---

## Step 5B: If FAIL → Fix the Cause

**❌ STOP - DO NOT DEPLOY**

### Fast Triage

```bash
# Use triage script
./scripts/triage-validation-failures.sh staging_validation.log

# OR manual grep
grep -nE "(FAILED|BLOCKER|Invalid|regression|timeout|lock)" staging_validation.log
```

### Typical Fixes

#### Invalid FK/index
```sql
-- Ensure NOT VALID + later VALIDATE
ALTER TABLE child ADD CONSTRAINT fk_name 
FOREIGN KEY (parent_id) REFERENCES parent(id) NOT VALID;

ALTER TABLE child VALIDATE CONSTRAINT fk_name;

-- Use CREATE INDEX CONCURRENTLY
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

#### SET NOT NULL failing
```sql
-- Backfill nulls first
UPDATE table SET column = default_value WHERE column IS NULL;

-- Then set NOT NULL
ALTER TABLE table ALTER COLUMN column SET NOT NULL;
```

#### 20% perf regression
- Add missing index (see `docs/db/perf_report.md`)
- Rewrite slow query
- Split migration into smaller chunks

#### Locks/blockers
```sql
-- Kill idle-in-transaction sessions
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
AND now() - state_change > interval '5 minutes';

-- Split migrations, validate in smaller batches
```

---

## Pitfalls to Avoid

### ❌ Missing Extensions on Prod

**Check before deploy:**
```sql
SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');
```

**Create if missing:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### ❌ Pool Size Too Small During VALIDATE

**Check connection limits:**
```sql
SHOW max_connections;
SELECT COUNT(*) FROM pg_stat_activity;
```

**Ensure pool can handle concurrent VALIDATE operations**

### ❌ ORM Client Not Regenerated

**After migrations:**
```bash
npx prisma generate
npm test -- tests/integration/
```

---

## Automated Workflow

**Run everything in one command:**
```bash
./scripts/execute-migration-workflow.sh
```

This script will:
1. Prompt for credentials securely
2. Refresh staging
3. Check/install extensions
4. Run validation
5. Deploy if pass, or provide triage if fail

---

## Quick Reference

```bash
# 1. Set env vars (use secrets manager or read -s)
export PROD_DATABASE_URL="..."
export STAGING_DATABASE_URL="..."

# 2. Refresh staging
./scripts/refresh-staging-from-prod.sh

# 3. Run validation
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
echo "EXIT_CODE=$?"

# 4. If EXIT_CODE=0, deploy
export STAGING_VALIDATION_PASSED=true
./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log

# 5. If EXIT_CODE≠0, triage
./scripts/triage-validation-failures.sh staging_validation.log
```

---

**Execute Step 3 now. Use EXIT_CODE as the gate.**


