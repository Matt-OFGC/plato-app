# Migration Validation Hardening - PR Summary

## Overview
Hardened the migration validation script to prevent schema drift and orphaned data from being silently skipped. All checks now fail-fast with precise error messages.

## Changes Made

### 1. Fail-Fast Assertions (Step 0.6)
**File:** `scripts/validate-migrations-staging.sh`

- Added mandatory required table presence check
- Verifies existence of: Recipe, RecipeItem, RecipeSection, Ingredient, Category, Company, User, Membership
- Exit code 1 with precise message if any table is missing
- No "skip if missing" logic for required tables

**Exit message example:**
```
✗ REQUIRED TABLES MISSING - SCHEMA DRIFT DETECTED
  Missing tables: RecipeItem RecipeSection
  Root cause: Schema drift or wrong migration order
```

### 2. Orphan Integrity Gate (Step 0.7)
**Files:** 
- `scripts/validate-migrations-staging.sh`
- `docs/db/integrity_checks.sql` (NEW)

- Added comprehensive orphan detection queries
- Checks all foreign key relationships:
  - RecipeItem → Recipe, Ingredient, RecipeSection
  - RecipeSection → Recipe
  - Recipe → Category, Company
  - Ingredient → Company
  - Membership → User, Company
- Prints top 20 offending record IDs on failure
- Exit code 1 if any orphans detected

**Exit message example:**
```
✗ ORPHANED DATA DETECTED - 5 violations found
Top 20 offending records:
ORPHAN_RECIPE_ITEM_RECIPE|123|456|RecipeItem references non-existent Recipe
```

### 3. Migration Order Guard (Step 0.8)
**File:** `scripts/validate-migrations-staging.sh`

- Validates that FK constraints reference existing tables
- Checks migration files for REFERENCES clauses
- Ensures referenced tables exist before FK creation
- Exit code 1 if migration order violation detected

### 4. Force FK Validation (Step 9)
**File:** `scripts/validate-migrations-staging.sh`

- Automatically validates all NOT VALID foreign keys
- Checks for blocking transactions before validation
- Suggests `pg_terminate_backend(pid)` commands (does not execute)
- Exit code 1 if validation fails or blockers present

### 5. Updated Checklist
**File:** `docs/db/GO_NO_GO_CHECKLIST.md`

- Added "Required Tables Present" gate (5.5)
- Added "Orphan Integrity Gate" gate (5.6)
- Updated decision criteria to include new checks

## Testing

### Test Required Table Missing:
```bash
# Should fail at Step 0.6
./scripts/validate-migrations-staging.sh
# Expected: Exit 1 with "REQUIRED TABLES MISSING"
```

### Test Orphan Detection:
```bash
# Create orphaned data, then run:
./scripts/validate-migrations-staging.sh
# Expected: Exit 1 with "ORPHANED DATA DETECTED" and sample IDs
```

### Test FK Validation:
```bash
# With NOT VALID FKs present:
./scripts/validate-migrations-staging.sh
# Expected: Attempts validation, suggests blockers if needed
```

## Commands for Next Steps

If validator fails on table presence:
```bash
# 1. Apply Prisma schema
DATABASE_URL="$STAGING_DATABASE_URL" npx prisma migrate deploy

# 2. Re-run validation
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
```

If validator fails on orphans:
```bash
# 1. Check orphaned records
psql "$STAGING_DATABASE_URL" -f docs/db/integrity_checks.sql

# 2. Clean up orphans (example for RecipeItem):
psql "$STAGING_DATABASE_URL" -c "
DELETE FROM \"RecipeItem\" ri
WHERE NOT EXISTS (SELECT 1 FROM \"Recipe\" r WHERE r.id = ri.\"recipeId\");
"

# 3. Re-run validation
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
```

## Acceptance Criteria Met

✅ Running validator on DB missing required table returns exit 1 with precise message
✅ Orphan rows cause exit 1 with sample IDs printed  
✅ Foreign keys are validated, indexes valid/ready
✅ No soft skips for required objects
✅ CI-friendly: non-zero exit codes on any breach

