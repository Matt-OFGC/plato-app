# Migration Validation Quick Reference

## Run Validation
```bash
source setup-staging-branch.sh
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
echo "EXIT_CODE=$?"
```

## Check Results
```bash
# View final status
tail -50 staging_validation.log | grep -E "PASSED|FAILED|EXIT_CODE"

# View blockers
grep -nE "(FAILED|BLOCKER|Invalid|orphan|missing)" staging_validation.log | tail -20
```

## Common Failures & Fixes

### Missing Tables (Step 0.6)
```bash
# Fix: Apply Prisma schema
DATABASE_URL="$STAGING_DATABASE_URL" npx prisma migrate deploy
```

### Orphaned Data (Step 0.7)
```bash
# Check orphans
psql "$STAGING_DATABASE_URL" -f docs/db/integrity_checks.sql

# Clean RecipeItem orphans
psql "$STAGING_DATABASE_URL" -c "
DELETE FROM \"RecipeItem\" ri
WHERE NOT EXISTS (SELECT 1 FROM \"Recipe\" r WHERE r.id = ri.\"recipeId\");
"
```

### FK Validation Blocked (Step 9)
```bash
# Check blockers
psql "$STAGING_DATABASE_URL" -c "
SELECT pid, state, query FROM pg_stat_activity 
WHERE state = 'idle in transaction';
"

# Kill blockers (if safe)
psql "$STAGING_DATABASE_URL" -c "
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle in transaction' AND pid != pg_backend_pid();
"
```

