# Quick Start: Run Migration Workflow

## ✅ Correct Process

**Do this in your terminal (not in chat):**

### Step 1: Cancel the current script
Press `Ctrl + C` to stop the script that's waiting for input.

### Step 2: Set environment variables
```bash
export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"
export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"
```

**Replace:**
- `USER` → Your database username
- `PASS` → Your database password
- `PROD_HOST` → Your production database host
- `PROD_DB` → Your production database name
- `STAGING_HOST` → Your staging database host
- `STAGING_DB` → Your staging database name

**⚠️ NEVER paste credentials here - only in your terminal**

### Step 3: Run the workflow
```bash
./scripts/execute-migration-workflow.sh
```

## What the Script Will Do

1. ✅ **Refresh staging** from production snapshot
2. ✅ **Check extensions** (pg_trgm, citext, uuid-ossp)
3. ✅ **Install missing extensions** if needed
4. ✅ **Run validation gate** (applies migrations, runs tests)
5. ✅ **Show exit code** (0 = pass, 1 = fail)
6. ✅ **If PASS** → Deploy to production
7. ✅ **If FAIL** → Provide triage guidance

## Decision Gate

- **EXIT_CODE=0** → All checks passed, proceed to deployment
- **EXIT_CODE≠0** → Stop, fix issues, re-run validation

## Example Output

### If Validation Passes:
```
=== ✓ STAGING VALIDATION PASSED ===
All criteria met:
  ✓ Tests green
  ✓ All FKs/uniques VALID
  ✓ All indexes VALID and READY
  ✓ No long locks
  ✓ No blocking idle transactions

Next steps:
1. Review performance diff
2. If performance acceptable, deploy to production
```

### If Validation Fails:
```
=== ✗ STAGING VALIDATION FAILED ===
BLOCKERS DETECTED - DO NOT DEPLOY

Review staging_validation.log for details
```

## After Running

### If PASS → Check Logs
```bash
# Review validation log
cat staging_validation.log

# Check performance diff
diff -u baseline_perf.txt after_perf.txt
```

### If FAIL → Triage
```bash
# Use triage script
./scripts/triage-validation-failures.sh staging_validation.log

# OR manual grep
grep -nE "(FAILED|BLOCKER|Invalid|regression|timeout|lock)" staging_validation.log
```

---

**Ready to execute. Run Step 2 and Step 3 in your terminal now.**


