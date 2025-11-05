#!/bin/bash
# Complete Execution Commands
# Copy and run these commands in order

set -euo pipefail

echo "=========================================="
echo "Database Migration Execution Guide"
echo "=========================================="
echo ""

# Step 1: Refresh staging from prod
echo "STEP 1: Refresh Staging from Production"
echo "----------------------------------------"
echo ""
echo "Set environment variables:"
echo '  export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"'
echo '  export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"'
echo ""
echo "Run refresh script:"
echo '  ./scripts/refresh-staging-from-prod.sh'
echo ""
echo "OR manually:"
echo '  # Snapshot prod'
echo '  pg_dump --format=custom "$PROD_DATABASE_URL" -f prod_$(date +%Y%m%d_%H%M%S).dump'
echo ''
echo '  # Recreate staging and restore'
echo '  STAGING_DB_NAME=$(echo "$STAGING_DATABASE_URL" | sed -E "s|.*/([^/]+)$|\1|")'
echo '  dropdb --if-exists "$STAGING_DB_NAME" && createdb "$STAGING_DB_NAME"'
echo '  pg_restore --no-owner --no-privileges --clean --if-exists -d "$STAGING_DATABASE_URL" prod_*.dump'
echo ''
echo '  # Verify extensions'
echo '  psql "$STAGING_DATABASE_URL" -c "SELECT extname FROM pg_extension WHERE extname IN ('\''pg_trgm'\'','\''citext'\'','\''uuid-ossp'\'');"'
echo ""
read -p "Press Enter after completing Step 1..."

# Step 2: Run validation
echo ""
echo "STEP 2: Run Validation Gate"
echo "----------------------------------------"
echo ""
echo "Run validation:"
echo '  ./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log'
echo '  EXIT_CODE=$?'
echo '  echo "EXIT_CODE=$EXIT_CODE"'
echo ""
echo "Quick scan for results:"
echo '  grep -E "(PASSED|FAILED|BLOCKER)" staging_validation.log | tail -n 50'
echo ""
echo "Pass criteria (encoded in script):"
echo "  - Exit code 0 = PASS"
echo "  - Any other = FAIL"
echo ""
read -p "Press Enter after completing Step 2..."

# Check exit code
if [ "${EXIT_CODE:-1}" -eq 0 ]; then
  echo ""
  echo "STEP 3A: Deploy to Production (Staging PASSED)"
  echo "----------------------------------------"
  echo ""
  echo "⚠️  Schedule low-traffic window first!"
  echo ""
  echo "Set environment:"
  echo '  export STAGING_VALIDATION_PASSED=true'
  echo '  export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"'
  echo ""
  echo "Deploy:"
  echo '  ./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log'
  echo ""
  echo "Post-deploy spot checks:"
  echo ""
  echo "-- All constraints validated"
  echo '  psql "$PROD_DATABASE_URL" -c "SELECT conname, convalidated FROM pg_constraint WHERE contype IN ('\''f'\'','\''u'\'','\''c'\'') AND NOT convalidated;"'
  echo ""
  echo "-- All new indexes valid and ready"
  echo '  psql "$PROD_DATABASE_URL" -c "SELECT i.relname, x.indisvalid, x.indisready FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE NOT x.indisvalid OR NOT x.indisready;"'
  echo ""
  echo "Hold-backs:"
  echo "  - Keep cleanup migration disabled for 7 days"
  echo "  - Watch pg_stat_statements daily"
else
  echo ""
  echo "STEP 3B: Fix Issues (Staging FAILED)"
  echo "----------------------------------------"
  echo ""
  echo "❌ STOP - DO NOT DEPLOY"
  echo ""
  echo "Open issues from staging_validation.log"
  echo ""
  echo "Typical fixes:"
  echo "  - Invalid FK/index → ensure NOT VALID + VALIDATE, use CONCURRENTLY"
  echo "  - SET NOT NULL failing → backfill nulls first"
  echo "  - Perf regression >20% → add index or rewrite query"
  echo "  - Locks → split migration, validate in batches, kill blockers"
  echo ""
  echo "Fix in branch, then re-run Step 2"
fi

echo ""
echo "=========================================="
echo "Decision Rule:"
echo "  Staging exit code 0 → ship"
echo "  Anything else → don't. Fix, re-run, then ship"
echo "=========================================="


