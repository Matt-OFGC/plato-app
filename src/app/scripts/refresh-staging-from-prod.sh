#!/bin/bash
# Refresh Staging Database from Production Snapshot
# Usage: ./scripts/refresh-staging-from-prod.sh
#
# Requires:
# - PROD_DATABASE_URL environment variable
# - STAGING_DATABASE_URL environment variable
# - pg_dump, pg_restore, dropdb, createdb in PATH

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROD_URL="${PROD_DATABASE_URL:-}"
STAGING_URL="${STAGING_DATABASE_URL:-}"

if [ -z "$PROD_URL" ]; then
  echo -e "${RED}Error: PROD_DATABASE_URL must be set${NC}"
  echo "  export PROD_DATABASE_URL=\"postgres://user:pass@host:5432/prod_db\""
  exit 1
fi

if [ -z "$STAGING_URL" ]; then
  echo -e "${RED}Error: STAGING_DATABASE_URL must be set${NC}"
  echo "  export STAGING_DATABASE_URL=\"postgres://user:pass@host:5432/staging_db\""
  exit 1
fi

echo -e "${GREEN}=== Refreshing Staging from Production ===${NC}"
echo "Production: ${PROD_URL%%@*}"
echo "Staging: ${STAGING_URL%%@*}"
echo ""

# Extract database name from URL
STAGING_DB_NAME=$(echo "$STAGING_URL" | sed -E 's|.*/([^/]+)$|\1|' | sed 's|?.*||')

# Step 1: Create production snapshot
echo -e "${YELLOW}[1] Creating Production Snapshot${NC}"
DUMP_FILE="prod_$(date +%Y%m%d_%H%M%S).dump"
echo "Dumping to: $DUMP_FILE"

if pg_dump --format=custom "$PROD_URL" -f "$DUMP_FILE"; then
  DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
  echo -e "${GREEN}✓${NC} Snapshot created: $DUMP_FILE ($DUMP_SIZE)"
else
  echo -e "${RED}✗${NC} Failed to create snapshot"
  exit 1
fi

# Step 2: Verify Postgres versions match
echo ""
echo -e "${YELLOW}[2] Verifying Postgres Versions Match${NC}"
PROD_VERSION=$(psql "$PROD_URL" -t -A -c "SELECT current_setting('server_version_num');" 2>/dev/null || echo "")
STAGING_VERSION=$(psql "$STAGING_URL" -t -A -c "SELECT current_setting('server_version_num');" 2>/dev/null || echo "")

if [ -n "$PROD_VERSION" ] && [ -n "$STAGING_VERSION" ]; then
  if [ "$PROD_VERSION" = "$STAGING_VERSION" ]; then
    echo -e "${GREEN}✓${NC} Versions match: $PROD_VERSION"
  else
    echo -e "${YELLOW}⚠${NC} Version mismatch!"
    echo "  Production: $PROD_VERSION"
    echo "  Staging: $STAGING_VERSION"
    read -p "Continue anyway? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}⚠${NC} Could not verify versions (may not have access)"
fi

# Step 3: Recreate staging database
echo ""
echo -e "${YELLOW}[3] Recreating Staging Database${NC}"
echo "Database: $STAGING_DB_NAME"

# Extract connection params for dropdb/createdb
STAGING_HOST=$(echo "$STAGING_URL" | sed -E 's|.*@([^:]+):.*|\1|')
STAGING_PORT=$(echo "$STAGING_URL" | sed -E 's|.*:([0-9]+)/.*|\1|' || echo "5432")
STAGING_USER=$(echo "$STAGING_URL" | sed -E 's|postgres://([^:]+):.*|\1|')

if dropdb --if-exists -h "$STAGING_HOST" -p "$STAGING_PORT" -U "$STAGING_USER" "$STAGING_DB_NAME" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Dropped existing staging database"
else
  echo -e "${YELLOW}⚠${NC} Could not drop staging database (may not exist)"
fi

if createdb -h "$STAGING_HOST" -p "$STAGING_PORT" -U "$STAGING_USER" "$STAGING_DB_NAME" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Created fresh staging database"
else
  echo -e "${RED}✗${NC} Failed to create staging database"
  exit 1
fi

# Step 4: Restore snapshot
echo ""
echo -e "${YELLOW}[4] Restoring Snapshot to Staging${NC}"
if pg_restore --no-owner --no-privileges --clean --if-exists -d "$STAGING_URL" "$DUMP_FILE" 2>&1 | tee restore.log; then
  echo -e "${GREEN}✓${NC} Snapshot restored"
else
  RESTORE_EXIT=${PIPESTATUS[0]}
  if [ $RESTORE_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Restore completed (warnings may be present)"
  else
    echo -e "${RED}✗${NC} Restore failed - check restore.log"
    exit 1
  fi
fi

# Step 5: Verify required extensions
echo ""
echo -e "${YELLOW}[5] Verifying Required Extensions${NC}"
EXTS=$(psql "$STAGING_URL" -t -A -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');" 2>/dev/null || echo "")

REQUIRED_EXTS="pg_trgm citext uuid-ossp"
MISSING_EXTS=""

for ext in $REQUIRED_EXTS; do
  if echo "$EXTS" | grep -q "$ext"; then
    echo -e "  ${GREEN}✓${NC} Extension $ext exists"
  else
    echo -e "  ${YELLOW}⚠${NC} Extension $ext missing"
    MISSING_EXTS="$MISSING_EXTS $ext"
  fi
done

if [ -n "$MISSING_EXTS" ]; then
  echo ""
  echo -e "${YELLOW}Missing extensions:$MISSING_EXTS${NC}"
  echo "⚠️  Install these before validation:"
  echo ""
  for ext in $MISSING_EXTS; do
    echo "  psql \"\$STAGING_DATABASE_URL\" -c \"CREATE EXTENSION IF NOT EXISTS $ext;\""
  done
  echo ""
  echo "These will be created by migrations if user has CREATE privilege,"
  echo "but it's safer to install them explicitly before validation."
fi

# Step 6: Verify row counts
echo ""
echo -e "${YELLOW}[6] Verifying Data Restored${NC}"
RECIPE_COUNT=$(psql "$STAGING_URL" -t -A -c "SELECT COUNT(*) FROM \"Recipe\";" 2>/dev/null || echo "0")
INGREDIENT_COUNT=$(psql "$STAGING_URL" -t -A -c "SELECT COUNT(*) FROM \"Ingredient\";" 2>/dev/null || echo "0")
COMPANY_COUNT=$(psql "$STAGING_URL" -t -A -c "SELECT COUNT(*) FROM \"Company\";" 2>/dev/null || echo "0")

echo "  Recipes: $RECIPE_COUNT"
echo "  Ingredients: $INGREDIENT_COUNT"
echo "  Companies: $COMPANY_COUNT"

if [ "$RECIPE_COUNT" -eq 0 ] && [ "$INGREDIENT_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}⚠${NC} No data found - verify restore was successful"
else
  echo -e "${GREEN}✓${NC} Data restored successfully"
fi

# Summary
echo ""
echo -e "${GREEN}=== Staging Refresh Complete ===${NC}"
echo "Snapshot: $DUMP_FILE"
echo "Staging database: $STAGING_DB_NAME"
echo ""
echo "Next step: Run validation"
echo "  ./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log"

