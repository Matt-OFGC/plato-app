# Quick Start: Database Audit Execution

**Status:** ✅ **READY**  
**Time to Deploy:** 30-60 minutes

## 🚀 Three-Step Process

### Step 1: Verify Safety (30 seconds)
```bash
cd /Users/matt/plato/src/app
./scripts/verify-migration-safety.sh
```
**Expected:** ✅ All safety checks passed

### Step 2: Validate on Staging (30-60 minutes)
```bash
# Set staging database
export STAGING_DATABASE_URL="postgresql://user:pass@host:port/staging_db"

# Run full validation (applies migrations + tests)
./scripts/validate-migrations-staging.sh
```

**This will:**
- Run tests before/after
- Apply all migrations
- Verify constraints/indexes
- Compare performance
- Check for locks

**Success:** All checks pass ✅

### Step 3: Deploy to Production (10-20 minutes)
```bash
# Confirm staging passed
export STAGING_VALIDATION_PASSED=true
export PROD_DATABASE_URL="postgresql://user:pass@host:port/prod_db"

# Deploy
./scripts/deploy-migrations-production.sh
```

## 📋 Manual Alternative

If you prefer manual control, see:
- `STAGING_VALIDATION_GUIDE.md` - Step-by-step staging validation
- `DEPLOYMENT_RUNBOOK.md` - Production deployment guide

## ⚠️ Decision Rule

**✅ GO:** Staging validation passes all checks  
**❌ NO-GO:** Any test failure, invalid constraint, or >20% perf regression

## 📁 Key Files

- **Migrations:** `migrations/*.sql`
- **Rollbacks:** `migrations/rollbacks/*.sql`
- **Tests:** `tests/integration/*.test.ts`
- **Scripts:** `scripts/*.sh`
- **Docs:** `docs/db/*.md`

---

**Ready to proceed?** Run Step 1 now to verify safety.


