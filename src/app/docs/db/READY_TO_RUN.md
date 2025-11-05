# ✅ Ready to Run: Staging Validation

**Status:** All scripts ready, safety checks passed ✅

## What's Ready

### ✅ Safety Verification
```bash
$ ./scripts/verify-migration-safety.sh
✓ All safety checks passed
```

### ✅ Enhanced Scripts
- `validate-migrations-staging.sh` - Includes all required checks:
  - Tests before/after
  - FKs VALID verification
  - Indexes VALID and READY verification
  - Performance comparison
  - Idle transaction detection
  - Lock detection
  - Exit codes for CI/CD

- `pre-deploy-checks.sh` - Pre-production validation
- `deploy-migrations-production.sh` - Enhanced with all checks

## Run Staging Validation Now

### Step 1: Set Environment
```bash
export STAGING_DATABASE_URL="postgres://user:pass@host:5432/staging_db"
```

### Step 2: Run Validation
```bash
./scripts/validate-migrations-staging.sh
```

**This will:**
1. ✅ Run tests (baseline)
2. ✅ Capture performance baseline
3. ✅ Check extensions
4. ✅ Apply all migrations
5. ✅ Re-run tests
6. ✅ Verify constraints/indexes
7. ✅ Check for blockers
8. ✅ Exit with proper code

### Step 3: Review Results

**PASS Criteria (ALL must be true):**
- ✅ All tests green
- ✅ All FKs VALID (`convalidated = true`)
- ✅ All indexes VALID and READY (`indisvalid = true`, `indisready = true`)
- ✅ No performance regression >20%
- ✅ Zero failed migrations
- ✅ No long locks
- ✅ No blocking idle transactions

**If PASS:**
```bash
export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="postgres://user:pass@prod-host:5432/prod"
./scripts/deploy-migrations-production.sh
```

**If FAIL:**
- Stop immediately
- Fix in branch
- Re-run staging validation
- Do NOT deploy until staging passes

## Script Output Interpretation

### Success Output:
```
✓ Staging validation PASSED
Next steps:
1. Review performance diff for any >20% latency increases
2. If performance acceptable, set: export STAGING_VALIDATION_PASSED=true
3. Deploy to production: ./scripts/deploy-migrations-production.sh
```

### Failure Output:
```
✗ Staging validation FAILED
BLOCKERS DETECTED - DO NOT DEPLOY
Fix issues in branch, then re-run staging validation
```

Exit code: 0 = PASS, 1 = FAIL (suitable for CI/CD)

## Common Issues & Fixes

### Issue: Tests Fail
**Fix:** Check test logs, fix data issues, re-run

### Issue: Invalid FKs
**Fix:** Check for orphaned data, clean up, re-run migration

### Issue: Invalid Indexes
**Fix:** Wait for CONCURRENTLY indexes to finish building, check logs

### Issue: Performance Regression >20%
**Fix:** Review EXPLAIN plans, add missing indexes, optimize queries

### Issue: Blocking Transactions
**Fix:** Kill idle transactions:
```sql
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
AND now() - state_change > interval '5 minutes';
```

## Pre-Deployment Checklist

Before running staging validation:
- [ ] Fresh prod snapshot restored to staging
- [ ] Same Postgres version
- [ ] App/CI can connect to staging
- [ ] User has CREATE EXTENSION privilege
- [ ] User has CREATE INDEX CONCURRENTLY privilege

## Post-Staging (If Passes)

1. Review performance diff manually
2. Get team approval
3. Schedule low-traffic window
4. Run production deployment script
5. Monitor for 24-48 hours

---

**Ready to execute.** Run `./scripts/validate-migrations-staging.sh` against staging now.


