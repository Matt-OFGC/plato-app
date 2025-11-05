#!/bin/bash
# Complete Migration Workflow Execution Script
# Follows the exact workflow specified
# Usage: ./scripts/execute-migration-workflow.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Database Migration Workflow${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Set environment variables securely
echo -e "${YELLOW}[Step 1] Setting Environment Variables${NC}"
echo ""

if [ -z "${PROD_DATABASE_URL:-}" ]; then
  echo "Enter PROD_DATABASE_URL (use read -s for password):"
  read -s PROD_INPUT
  export PROD_DATABASE_URL="$PROD_INPUT"
  echo ""
fi

if [ -z "${STAGING_DATABASE_URL:-}" ]; then
  echo "Enter STAGING_DATABASE_URL (use read -s for password):"
  read -s STAGING_INPUT
  export STAGING_DATABASE_URL="$STAGING_INPUT"
  echo ""
fi

# Verify URLs are set
if [ -z "${PROD_DATABASE_URL:-}" ] || [ -z "${STAGING_DATABASE_URL:-}" ]; then
  echo -e "${RED}Error: Both PROD_DATABASE_URL and STAGING_DATABASE_URL must be set${NC}"
  echo ""
  echo "Option 1: Set as environment variables:"
  echo '  export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"'
  echo '  export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"'
  echo ""
  echo "Option 2: Use secrets manager"
  echo "Option 3: Use read -s (will prompt in script)"
  exit 1
fi

echo -e "${GREEN}✓${NC} Environment variables set"
echo "  PROD: ${PROD_DATABASE_URL%%@*}"
echo "  STAGING: ${STAGING_DATABASE_URL%%@*}"
echo ""

# Step 2: Refresh staging from prod (skip if using Neon branches)
echo -e "${YELLOW}[Step 2] Checking Staging Database${NC}"
echo ""

# Check if staging is a Neon branch (different endpoint = Neon branch)
if [[ "$STAGING_DATABASE_URL" != "$PROD_DATABASE_URL" ]] && [[ "$STAGING_DATABASE_URL" == *"neon.tech"* ]]; then
  echo -e "${GREEN}✓${NC} Using Neon branch - data already synced, skipping refresh"
  echo "  (Neon branches are instant copies with production data)"
else
  # Only refresh if pg_dump is available and not using Neon branches
  if command -v pg_dump >/dev/null 2>&1; then
    if ./scripts/refresh-staging-from-prod.sh; then
      echo -e "${GREEN}✓${NC} Staging refreshed"
    else
      echo -e "${RED}✗${NC} Failed to refresh staging"
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠${NC} pg_dump not installed - skipping refresh"
    echo "  Install PostgreSQL client tools if you need to refresh staging:"
    echo "    brew install postgresql  # macOS"
    echo "    # Or use Neon branches (already synced)"
  fi
fi

# Check extensions
echo ""
echo -e "${YELLOW}[Step 2a] Checking Required Extensions${NC}"
# Use Node.js if psql not available
if command -v psql >/dev/null 2>&1; then
  EXTS=$(psql "$STAGING_DATABASE_URL" -t -A -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');" 2>/dev/null || echo "")
else
  # Use Node.js script to check extensions
  CHECK_RESULT=$(STAGING_DATABASE_URL="$STAGING_DATABASE_URL" node scripts/check-extensions.js 2>&1)
  if echo "$CHECK_RESULT" | grep -q "ALL_INSTALLED"; then
    # All extensions installed - return them so the check passes
    EXTS="pg_trgm citext uuid-ossp"
  else
    # Parse missing extensions or use Node.js to query directly
    EXTS=$(STAGING_DATABASE_URL="$STAGING_DATABASE_URL" node -e "
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.STAGING_DATABASE_URL });
      (async () => {
        await client.connect();
        const result = await client.query(\"SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp')\");
        console.log(result.rows.map(r => r.extname).join(' '));
        await client.end();
      })().catch(() => process.exit(1));
    " 2>/dev/null || echo "")
  fi
fi

REQUIRED_EXTS="pg_trgm citext uuid-ossp"
MISSING_EXTS=""

for ext in $REQUIRED_EXTS; do
  if echo "$EXTS" | grep -q "$ext"; then
    echo -e "  ${GREEN}✓${NC} Extension $ext exists"
  else
    echo -e "  ${RED}✗${NC} Extension $ext missing"
    MISSING_EXTS="$MISSING_EXTS $ext"
  fi
done

if [ -n "$MISSING_EXTS" ]; then
  echo ""
  echo -e "${YELLOW}⚠ Missing extensions:$MISSING_EXTS${NC}"
  echo "Install them before validation:"
  for ext in $MISSING_EXTS; do
    echo "  psql \"\$STAGING_DATABASE_URL\" -c \"CREATE EXTENSION IF NOT EXISTS $ext;\""
  done
  echo ""
  read -p "Install missing extensions now? (yes/no): " install_confirm
  if [ "$install_confirm" = "yes" ]; then
    # Use Node.js script if psql not available
    if command -v psql >/dev/null 2>&1; then
      for ext in $MISSING_EXTS; do
        if psql "$STAGING_DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS $ext;" 2>&1; then
          echo -e "  ${GREEN}✓${NC} Installed $ext"
        else
          echo -e "  ${RED}✗${NC} Failed to install $ext (may need superuser privilege)"
        fi
      done
    else
      echo "  Installing via Node.js..."
      if STAGING_DATABASE_URL="$STAGING_DATABASE_URL" node scripts/install-extensions.js; then
        echo -e "  ${GREEN}✓${NC} Extensions installed"
      else
        echo -e "  ${RED}✗${NC} Failed to install extensions"
        exit 1
      fi
    fi
  else
    echo -e "${RED}Aborting: Install extensions before proceeding${NC}"
    exit 1
  fi
fi

echo ""

# Step 3: Run validation gate
echo -e "${YELLOW}[Step 3] Running Validation Gate${NC}"
echo ""

if ./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log; then
  EXIT_CODE=0
else
  EXIT_CODE=${PIPESTATUS[0]}
fi

echo ""
echo "EXIT_CODE=$EXIT_CODE"
echo ""

# Quick scan for results
echo -e "${YELLOW}Quick Scan Results:${NC}"
grep -E "(PASSED|FAILED|BLOCKER)" staging_validation.log | tail -n 50 || echo "No PASSED/FAILED markers found"
echo ""

# Step 4: Decide
echo -e "${YELLOW}[Step 4] Decision${NC}"
echo ""

if [ "$EXIT_CODE" -eq 0 ]; then
  echo -e "${GREEN}✓ EXIT_CODE=0 → Proceed to deployment${NC}"
  echo ""
  echo -e "${YELLOW}[Step 5A] Deploy to Production${NC}"
  echo ""
  echo -e "${RED}⚠️  Schedule low-traffic window first!${NC}"
  echo ""
  read -p "Proceed with production deployment? (yes/no): " deploy_confirm
  if [ "$deploy_confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
  fi
  
  export STAGING_VALIDATION_PASSED=true
  
  if ./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log; then
    echo ""
    echo -e "${GREEN}✓ Production deployment successful${NC}"
    echo ""
    echo "Post-deploy spot checks:"
    echo ""
    echo "-- All constraints validated"
    echo '  psql "$PROD_DATABASE_URL" -c "SELECT conname, convalidated FROM pg_constraint WHERE contype IN ('\''f'\'','\''u'\'','\''c'\'') AND NOT convalidated;"'
    echo ""
    echo "-- All indexes valid and ready"
    echo '  psql "$PROD_DATABASE_URL" -c "SELECT i.relname, x.indisvalid, x.indisready FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE NOT x.indisvalid OR NOT x.indisready;"'
    echo ""
    echo "Hold-backs:"
    echo "  - Keep cleanup migration disabled for 7 days"
    echo "  - Monitor pg_stat_statements daily"
  else
    echo ""
    echo -e "${RED}✗ Production deployment failed${NC}"
    echo "Review prod_deploy.log for details"
    exit 1
  fi
else
  echo -e "${RED}✗ EXIT_CODE=$EXIT_CODE → STOP - Do not deploy${NC}"
  echo ""
  echo -e "${YELLOW}[Step 5B] Fix Issues${NC}"
  echo ""
  echo "Fast triage:"
  echo '  grep -nE "(FAILED|BLOCKER|Invalid|regression|timeout|lock)" staging_validation.log'
  echo ""
  
  # Show triage results
  echo "Found issues:"
  grep -nE "(FAILED|BLOCKER|Invalid|regression|timeout|lock)" staging_validation.log | head -20 || echo "  (No obvious issues found - check full log)"
  echo ""
  
  echo "Typical fixes:"
  echo "  - Invalid FK/index → ensure NOT VALID + later VALIDATE, use CREATE INDEX CONCURRENTLY"
  echo "  - SET NOT NULL failing → backfill nulls first"
  echo "  - 20% perf regression → add index or rewrite query"
  echo "  - Locks/blockers → split migrations, validate in smaller batches, kill idle-in-transaction sessions"
  echo ""
  echo "Pitfalls to avoid:"
  echo "  - Missing pg_trgm/citext/uuid-ossp on prod"
  echo "  - Pool size too small during VALIDATE"
  echo "  - ORM client not regenerated after schema change"
  echo ""
  echo "Fix issues in branch, then re-run Step 3"
  exit 1
fi

