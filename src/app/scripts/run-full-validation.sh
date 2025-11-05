#!/bin/bash
# Full Validation and Deployment Script
# Run this script to execute the complete validation and deployment process
# Usage: ./scripts/run-full-validation.sh [staging|production]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MODE="${1:-staging}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Database Migration Validation${NC}"
echo -e "${BLUE}  Mode: $MODE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Verify safety
echo -e "${YELLOW}[Step 1] Verifying Migration Safety${NC}"
if ! ./scripts/verify-migration-safety.sh; then
  echo -e "${RED}✗ Safety check failed. Fix issues before proceeding.${NC}"
  exit 1
fi
echo ""

# Step 2: Set environment
if [ "$MODE" = "staging" ]; then
  echo -e "${YELLOW}[Step 2] Staging Validation${NC}"
  
  if [ -z "${STAGING_DATABASE_URL:-}" ]; then
    echo -e "${RED}Error: STAGING_DATABASE_URL must be set${NC}"
    echo "  export STAGING_DATABASE_URL=\"postgres://user:pass@host:5432/staging_db\""
    exit 1
  fi
  
  echo "Using staging database: ${STAGING_DATABASE_URL%%@*}"
  echo ""
  
  # Verify extensions on staging
  echo -e "${YELLOW}[Step 2a] Verifying Extensions on Staging${NC}"
  EXTS=$(psql "$STAGING_DATABASE_URL" -t -A -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');" 2>/dev/null || echo "")
  echo "Found extensions: $EXTS"
  echo ""
  
  # Run staging validation
  echo -e "${YELLOW}[Step 3] Running Staging Validation${NC}"
  echo "Output will be saved to: staging_validation.log"
  echo ""
  
  if ./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log; then
    echo ""
    echo -e "${GREEN}✓ Staging validation PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review staging_validation.log for any warnings"
    echo "2. Check performance diff: diff -u baseline_perf.txt after_perf.txt"
    echo "3. If performance acceptable (≤20% latency increase), proceed to production:"
    echo ""
    echo "   export STAGING_VALIDATION_PASSED=true"
    echo "   export PROD_DATABASE_URL=\"postgres://user:pass@prod-host:5432/prod\""
    echo "   ./scripts/run-full-validation.sh production"
    exit 0
  else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}✗ Staging validation FAILED (exit code: $EXIT_CODE)${NC}"
    echo ""
    echo "BLOCKERS DETECTED - DO NOT DEPLOY"
    echo ""
    echo "Review staging_validation.log for details:"
    echo "  - Invalid constraints/indexes"
    echo "  - Performance regression >20%"
    echo "  - Migration errors"
    echo "  - Blocking transactions"
    echo ""
    echo "Fix issues in branch, then re-run:"
    echo "  ./scripts/run-full-validation.sh staging"
    exit $EXIT_CODE
  fi

elif [ "$MODE" = "production" ]; then
  echo -e "${YELLOW}[Step 2] Production Deployment${NC}"
  
  if [ -z "${PROD_DATABASE_URL:-}" ]; then
    echo -e "${RED}Error: PROD_DATABASE_URL must be set${NC}"
    exit 1
  fi
  
  if [ "${STAGING_VALIDATION_PASSED:-false}" != "true" ]; then
    echo -e "${RED}Error: STAGING_VALIDATION_PASSED must be 'true'${NC}"
    echo "  Run staging validation first and ensure it passes"
    exit 1
  fi
  
  echo "Using production database: ${PROD_DATABASE_URL%%@*}"
  echo ""
  echo -e "${YELLOW}⚠️  WARNING: This will modify production database${NC}"
  read -p "Continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted"
    exit 1
  fi
  
  # Verify extensions on production
  echo ""
  echo -e "${YELLOW}[Step 2a] Verifying Extensions on Production${NC}"
  EXTS=$(psql "$PROD_DATABASE_URL" -t -A -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');" 2>/dev/null || echo "")
  echo "Found extensions: $EXTS"
  
  MISSING_EXTS=""
  for ext in pg_trgm citext uuid-ossp; do
    if ! echo "$EXTS" | grep -q "$ext"; then
      MISSING_EXTS="$MISSING_EXTS $ext"
    fi
  done
  
  if [ -n "$MISSING_EXTS" ]; then
    echo -e "${YELLOW}⚠ Missing extensions:$MISSING_EXTS${NC}"
    echo "  These will be created by migrations if user has CREATE privilege"
  fi
  echo ""
  
  # Run production deployment
  echo -e "${YELLOW}[Step 3] Running Production Deployment${NC}"
  echo "Output will be saved to: prod_deploy.log"
  echo ""
  
  if ./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log; then
    echo ""
    echo -e "${GREEN}✓ Production deployment successful${NC}"
    echo ""
    echo "Post-deployment checks:"
    echo ""
    echo "1. Verify constraints:"
    echo "   psql \"\$PROD_DATABASE_URL\" -c \"SELECT conname, convalidated FROM pg_constraint WHERE contype IN ('f','u','c');\""
    echo ""
    echo "2. Verify indexes:"
    echo "   psql \"\$PROD_DATABASE_URL\" -c \"SELECT i.relname, x.indisvalid, x.indisready FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE i.relkind='i';\""
    echo ""
    echo "3. Monitor for 24-48 hours:"
    echo "   - Check slow query log"
    echo "   - Monitor pg_stat_statements"
    echo "   - Watch for errors in application logs"
    echo ""
    echo "4. Keep cleanup migration disabled for 7 days"
    echo "   File: migrations/20250115160002_fix_recipe_category_fields_cleanup.sql"
    exit 0
  else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}✗ Production deployment FAILED (exit code: $EXIT_CODE)${NC}"
    echo ""
    echo "Review prod_deploy.log for details"
    echo "Rollback options:"
    echo "1. Use rollback scripts: migrations/rollbacks/"
    echo "2. PITR restore to restore point created at start"
    exit $EXIT_CODE
  fi

else
  echo -e "${RED}Error: Invalid mode. Use 'staging' or 'production'${NC}"
  echo "Usage: ./scripts/run-full-validation.sh [staging|production]"
  exit 1
fi


