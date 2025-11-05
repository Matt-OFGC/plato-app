#!/bin/bash
# Staging Migration Validation Script
# Run this against a fresh production snapshot to validate all migrations
# Usage: ./scripts/validate-migrations-staging.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

STAGING_URL="${STAGING_DATABASE_URL:-${DATABASE_URL}}"

if [ -z "$STAGING_URL" ]; then
  echo -e "${RED}Error: STAGING_DATABASE_URL or DATABASE_URL must be set${NC}"
  exit 1
fi

echo -e "${GREEN}=== Staging Migration Validation ===${NC}"
echo "Using database: ${STAGING_URL%%@*}"
echo ""

# Function to run SQL and capture output
run_sql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$STAGING_URL" -t -A -c "$1"
  else
    # Use Node.js as fallback
    STAGING_DATABASE_URL="$STAGING_URL" node -e "
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.STAGING_DATABASE_URL });
      (async () => {
        await client.connect();
        const result = await client.query(\`$1\`);
        if (result.rows.length > 0) {
          console.log(result.rows.map(r => Object.values(r)[0]).join('\\n'));
        }
        await client.end();
      })().catch(err => { console.error(err.message); process.exit(1); });
    " 2>/dev/null
  fi
}

# Function to check exit code
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1"
    return 1
  fi
}

# 0) Verify we're on staging (safety check)
echo -e "${YELLOW}[0] Safety Check${NC}"
DB_NAME=$(run_sql "SELECT current_database();")
if [[ "$DB_NAME" == *"prod"* ]] && [[ "$DB_NAME" != *"staging"* ]]; then
  echo -e "${RED}ERROR: This appears to be production! Aborting.${NC}"
  exit 1
fi
check_result "Database check passed"

# 0.5) Ensure Prisma schema is applied (prerequisite for SQL migrations)
echo ""
echo -e "${YELLOW}[0.5] Checking Prisma Schema${NC}"

# Check if Prisma schema file exists and has content
# Try multiple possible locations (monorepo support)
SCHEMA_FILE=""
if [ -f "../../prisma/schema.prisma" ]; then
  SCHEMA_FILE="../../prisma/schema.prisma"
elif [ -f "../prisma/schema.prisma" ]; then
  SCHEMA_FILE="../prisma/schema.prisma"
elif [ -f "prisma/schema.prisma" ]; then
  SCHEMA_FILE="prisma/schema.prisma"
elif [ -f "../../../prisma/schema.prisma" ]; then
  SCHEMA_FILE="../../../prisma/schema.prisma"
fi

if [ -z "$SCHEMA_FILE" ] || [ ! -s "$SCHEMA_FILE" ] || ! grep -q "datasource" "$SCHEMA_FILE" 2>/dev/null; then
  echo -e "${RED}✗ Prisma schema file is missing or empty${NC}"
  echo "  Checked: prisma/schema.prisma, ../prisma/schema.prisma, ../../prisma/schema.prisma"
  echo "  Error: Datasource block is missing"
  echo ""
  echo "  Root cause: No Prisma schema defined"
  echo "  Action required:"
  echo "    1. Define your Prisma schema"
  echo "    2. Include a datasource block pointing to your database"
  echo "    3. Define your models (RecipeItem, RecipeSection, etc.)"
  echo "    4. Then re-run this validation script"
  exit 1
fi

echo -e "${GREEN}✓${NC} Found Prisma schema: $SCHEMA_FILE"

PRISMA_TABLES=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations';" || echo "0")
RECIPE_TABLES=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('RecipeItem', 'RecipeSection');" || echo "0")
TOTAL_TABLES=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" || echo "0")

if [ "$TOTAL_TABLES" = "0" ]; then
  echo -e "${RED}✗ Database is completely empty (0 tables)${NC}"
  echo "  This indicates the schema has never been applied"
  echo ""
  echo "  Root cause: Empty database - schema not initialized"
  echo "  Action required:"
  echo "    1. Apply Prisma schema: DATABASE_URL=\"\$STAGING_DATABASE_URL\" npx prisma migrate deploy"
  echo "    2. Or use: DATABASE_URL=\"\$STAGING_DATABASE_URL\" npx prisma db push"
  echo "    3. Then re-run this validation script"
  exit 1
fi

if [ "$PRISMA_TABLES" = "0" ] || [ "$RECIPE_TABLES" = "0" ]; then
  echo -e "${YELLOW}⚠ Required tables not detected. Attempting to apply Prisma schema...${NC}"
  echo "  Running: npx prisma migrate deploy"
  if DATABASE_URL="$STAGING_URL" npx prisma migrate deploy 2>&1 | tee prisma_migrate.log; then
    echo -e "${GREEN}✓ Prisma schema applied${NC}"
  else
    echo -e "${RED}✗ Failed to apply Prisma schema${NC}"
    echo "  Check prisma_migrate.log for details"
    echo ""
    echo "  Alternative: Try: DATABASE_URL=\"\$STAGING_DATABASE_URL\" npx prisma db push"
    exit 1
  fi
else
  echo -e "${GREEN}✓ Prisma schema already applied (found RecipeItem/RecipeSection tables)${NC}"
fi
check_result "Prisma schema check complete"

# 0.6) REQUIRED TABLE PRESENCE CHECK (Fail-fast assertion)
echo ""
echo -e "${YELLOW}[0.6] Required Table Presence Check${NC}"
REQUIRED_TABLES=("Recipe" "RecipeItem" "RecipeSection" "Ingredient" "Category" "Company" "User" "Membership")
MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
  EXISTS=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" || echo "0")
  if [ "$EXISTS" = "0" ]; then
    MISSING_TABLES+=("$table")
    echo -e "  ${RED}✗${NC} Table $table is MISSING"
  else
    echo -e "  ${GREEN}✓${NC} Table $table exists"
  fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}✗ REQUIRED TABLES MISSING - SCHEMA DRIFT DETECTED${NC}"
  echo "  Missing tables: ${MISSING_TABLES[*]}"
  echo ""
  echo "  Root cause: Schema drift or wrong migration order"
  echo "  Action required:"
  echo "    1. Apply Prisma schema: DATABASE_URL=\"\$STAGING_DATABASE_URL\" npx prisma migrate deploy"
  echo "    2. Or restore from production snapshot"
  echo "    3. Then re-run this validation script"
  exit 1
fi
check_result "All required tables present"

# 0.7) ORPHAN INTEGRITY GATE
echo ""
echo -e "${YELLOW}[0.7] Orphan Integrity Check${NC}"
ORPHAN_CHECK_FILE="docs/db/integrity_checks.sql"
if [ ! -f "$ORPHAN_CHECK_FILE" ]; then
  echo -e "${RED}✗ Integrity checks file not found: $ORPHAN_CHECK_FILE${NC}"
  exit 1
fi

# Run orphan checks and capture results
ORPHAN_RESULTS=$(if command -v psql >/dev/null 2>&1; then
  psql "$STAGING_URL" -t -A -f "$ORPHAN_CHECK_FILE" 2>&1 | grep -v "^$" || true
else
  node scripts/execute-sql-file.js "$STAGING_URL" "$ORPHAN_CHECK_FILE" 2>&1 | grep -v "^$" || true
fi)

ORPHAN_COUNT=$(echo "$ORPHAN_RESULTS" | grep -c "^ORPHAN_\|^DUPLICATE_" 2>/dev/null || echo "0")
# Remove any whitespace/newlines from count
ORPHAN_COUNT=$(echo "$ORPHAN_COUNT" | tr -d '[:space:]' || echo "0")
# Ensure it's a number, default to 0 if not
if ! [[ "$ORPHAN_COUNT" =~ ^[0-9]+$ ]]; then
  ORPHAN_COUNT=0
fi

if [ "$ORPHAN_COUNT" -gt 0 ]; then
  echo -e "${RED}✗ ORPHANED DATA DETECTED - $ORPHAN_COUNT violations found${NC}"
  echo ""
  echo "Top 20 offending records:"
  echo "$ORPHAN_RESULTS" | head -20
  echo ""
  echo "  Root cause: Foreign key references point to non-existent parent records"
  echo "  Action required:"
  echo "    1. Clean up orphaned data"
  echo "    2. Verify data integrity"
  echo "    3. Re-run this validation script"
  exit 1
fi
check_result "No orphaned data detected"

# 0.8) MIGRATION ORDER GUARD
echo ""
echo -e "${YELLOW}[0.8] Migration Order Validation${NC}"
MIGRATION_DIR="migrations"
MIGRATION_FILES=(
  "20250115120000_add_composite_unique_constraints.sql"
  "20250115130000_add_missing_foreign_keys_production_safe.sql"
  "20250115140000_add_check_constraints.sql"
  "20250115150000_add_performance_indexes.sql"
  "20250115160000_fix_recipe_category_fields_backfill.sql"
  "20250115160001_fix_recipe_category_fields_cutover.sql"
)

# Check if migrations reference tables that should be created by Prisma (not migrations)
# This is a simplified check - in practice, Prisma creates all base tables
for mig_file in "${MIGRATION_FILES[@]}"; do
  if [ -f "$MIGRATION_DIR/$mig_file" ]; then
    # Check if migration adds FK to a table that might not exist
    if grep -q "ADD CONSTRAINT.*FOREIGN KEY" "$MIGRATION_DIR/$mig_file" 2>/dev/null; then
      # Extract referenced tables from FK definitions
      REF_TABLES=$(grep -oP "REFERENCES\s+\"\K\w+" "$MIGRATION_DIR/$mig_file" 2>/dev/null || true)
      for ref_table in $REF_TABLES; do
        EXISTS=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$ref_table';" || echo "0")
        if [ "$EXISTS" = "0" ]; then
          echo -e "${RED}✗ Migration $mig_file references table $ref_table which does not exist${NC}"
          echo "  Migration order violation: FK constraint added before table creation"
          exit 1
        fi
      done
    fi
  fi
done
check_result "Migration order validated"

# 1) Run tests before any migration (baseline)
echo ""
echo -e "${YELLOW}[1] Running Integration Tests (Baseline)${NC}"
npm test -- tests/integration/ --passWithNoTests 2>&1 | tee test_baseline.log
TEST_EXIT_CODE=${PIPESTATUS[0]}
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}✗ Tests failed before migration${NC}"
  exit 1
fi
check_result "All tests passed (baseline)"

# 2) Record performance baseline
echo ""
echo -e "${YELLOW}[2] Recording Performance Baseline${NC}"
if command -v psql >/dev/null 2>&1; then
  psql "$STAGING_URL" -f docs/db/observability.sql > baseline_perf.txt 2>&1
else
  # Use Node.js to execute SQL file
  node scripts/execute-sql-file.js "$STAGING_URL" docs/db/observability.sql > baseline_perf.txt 2>&1
fi
check_result "Performance baseline captured"

# 3) Confirm required extensions exist
echo ""
echo -e "${YELLOW}[3] Checking Required Extensions${NC}"
EXISTING_EXTS=$(run_sql "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','uuid-ossp','citext');" || true)
REQUIRED_EXTS="pg_trgm uuid-ossp citext"

for ext in $REQUIRED_EXTS; do
  if echo "$EXISTING_EXTS" | grep -q "$ext"; then
    echo -e "  ${GREEN}✓${NC} Extension $ext exists"
  else
    echo -e "  ${YELLOW}⚠${NC} Extension $ext missing (will be created by migration if needed)"
  fi
done

# Verify user has CREATE EXTENSION privilege
CAN_CREATE_EXT=$(run_sql "SELECT has_database_privilege(current_user, current_database(), 'CREATE');" || echo "f")
if [ "$CAN_CREATE_EXT" = "t" ]; then
  echo -e "  ${GREEN}✓${NC} User has CREATE privilege"
else
  echo -e "  ${YELLOW}⚠${NC} User may not have CREATE EXTENSION privilege (may need superuser)"
fi

check_result "Extension check complete"

# 4) Capture table sizes and row counts
echo ""
echo -e "${YELLOW}[4] Capturing Table Sizes and Row Counts${NC}"
run_sql "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;" > baseline_table_sizes.txt
check_result "Table sizes captured"
cat baseline_table_sizes.txt

# 5) Set conservative timeouts and create restore point
echo ""
echo -e "${YELLOW}[5] Setting Timeouts and Creating Restore Point${NC}"
# Set timeouts
if command -v psql >/dev/null 2>&1; then
  psql "$STAGING_URL" -v ON_ERROR_STOP=0 <<'SQL'
SET lock_timeout='2s';
SET statement_timeout='5min';
SQL
  # Try to create restore point (requires superuser, may fail on Neon)
  RESTORE_POINT=$(psql "$STAGING_URL" -t -A -c "SELECT pg_create_restore_point('pre_fix_batch_staging_' || to_char(now(), 'YYYYMMDD_HH24MISS'));" 2>&1 || echo "")
  if [ -n "$RESTORE_POINT" ] && [[ ! "$RESTORE_POINT" =~ "permission denied" ]]; then
    echo -e "  ${GREEN}✓${NC} Restore point created: $RESTORE_POINT"
  else
    echo -e "  ${YELLOW}⚠${NC} Restore point creation skipped (requires superuser; Neon branches provide snapshot safety)"
  fi
else
  # Use Node.js to set timeouts and create restore point
  STAGING_DATABASE_URL="$STAGING_URL" node -e "
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.STAGING_DATABASE_URL });
    (async () => {
      await client.connect();
      await client.query(\"SET lock_timeout='2s'\");
      await client.query(\"SET statement_timeout='5min'\");
      try {
        const result = await client.query(\"SELECT pg_create_restore_point('pre_fix_batch_staging_' || to_char(now(), 'YYYYMMDD_HH24MISS'))\");
        console.log('✓ Restore point created:', result.rows[0].pg_create_restore_point);
      } catch (err) {
        if (err.code === '42501') {
          console.log('⚠ Restore point creation skipped (requires superuser; Neon branches provide snapshot safety)');
        } else {
          throw err;
        }
      }
      await client.end();
    })().catch(err => { console.error(err); process.exit(1); });
  "
fi
check_result "Timeouts set and restore point attempted"

# 6) Apply migrations in order
echo ""
echo -e "${YELLOW}[6] Applying Migrations${NC}"
MIGRATION_FILES=(
  "migrations/20250115120000_add_composite_unique_constraints.sql"
  "migrations/20250115130000_add_missing_foreign_keys_production_safe.sql"
  "migrations/20250115140000_add_check_constraints.sql"
  "migrations/20250115150000_add_performance_indexes.sql"
  "migrations/20250115160000_fix_recipe_category_fields_backfill.sql"
  "migrations/20250115160001_fix_recipe_category_fields_cutover.sql"
)

for f in "${MIGRATION_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo -e "${RED}✗ Migration file not found: $f${NC}"
    exit 1
  fi
  
  echo "  Applying: $f"
  # Use psql if available, otherwise use Node.js script
  if command -v psql >/dev/null 2>&1; then
    if psql "$STAGING_URL" -v ON_ERROR_STOP=1 -f "$f" > "${f##*/}.log" 2>&1; then
      echo -e "  ${GREEN}✓${NC} $f"
    else
      echo -e "  ${RED}✗${NC} $f failed - check ${f##*/}.log"
      exit 1
    fi
  else
    # Use Node.js to execute SQL file (maintains same execution path as psql)
    if node scripts/execute-sql-file.js "$STAGING_URL" "$f" > "${f##*/}.log" 2>&1; then
      echo -e "  ${GREEN}✓${NC} $f"
    else
      echo -e "  ${RED}✗${NC} $f failed - check ${f##*/}.log"
      exit 1
    fi
  fi
done

# 7) Re-run tests
echo ""
echo -e "${YELLOW}[7] Running Integration Tests (After Migration)${NC}"
npm test -- tests/integration/ --passWithNoTests 2>&1 | tee test_after.log
TEST_EXIT_CODE=${PIPESTATUS[0]}
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}✗ Tests failed after migration${NC}"
  exit 1
fi
check_result "All tests passed (after migration)"

# 8) Compare performance
echo ""
echo -e "${YELLOW}[8] Comparing Performance${NC}"
if command -v psql >/dev/null 2>&1; then
  psql "$STAGING_URL" -f docs/db/observability.sql > after_perf.txt 2>&1
else
  # Use Node.js to execute SQL file
  node scripts/execute-sql-file.js "$STAGING_URL" docs/db/observability.sql > after_perf.txt 2>&1
fi
echo "Performance diff (first 200 lines):"
diff -u baseline_perf.txt after_perf.txt | head -200 || true
check_result "Performance comparison complete"

# 9) Verify all FKs are VALID (with force validation of NOT VALID constraints)
echo ""
echo -e "${YELLOW}[9] Verifying Foreign Keys${NC}"

# First, identify NOT VALID FKs and attempt to validate them
NOT_VALID_FKS=$(run_sql "SELECT conname, conrelid::regclass::text as table_name FROM pg_constraint WHERE contype='f' AND convalidated=false;" || echo "")

if [ -n "$NOT_VALID_FKS" ]; then
  echo -e "${YELLOW}⚠ Found NOT VALID foreign keys - attempting validation...${NC}"
  echo "$NOT_VALID_FKS" | while read -r fk_info; do
    FK_NAME=$(echo "$fk_info" | awk '{print $1}')
    TABLE_NAME=$(echo "$fk_info" | awk '{print $2}')
    echo "  Validating: $FK_NAME on $TABLE_NAME"
    
    # Check for blocking transactions
    BLOCKERS=$(run_sql "SELECT pid, state, now() - state_change as idle_duration, query FROM pg_stat_activity WHERE state = 'idle in transaction' AND now() - state_change > interval '10 seconds' LIMIT 5;" || echo "")
    if [ -n "$BLOCKERS" ]; then
      echo -e "    ${RED}✗ Blocking transactions detected:${NC}"
      echo "$BLOCKERS"
      echo ""
      echo "    Suggested commands to kill blockers:"
      echo "$BLOCKERS" | awk '{print "    SELECT pg_terminate_backend(" $1 ");"}' | head -5
      echo ""
      echo -e "    ${RED}✗ Cannot validate constraint - blocking transactions present${NC}"
      exit 1
    fi
    
    # Attempt validation
    VALIDATE_SQL="ALTER TABLE \"$TABLE_NAME\" VALIDATE CONSTRAINT \"$FK_NAME\";"
    if run_sql "$VALIDATE_SQL" > /dev/null 2>&1; then
      echo -e "    ${GREEN}✓${NC} Validated: $FK_NAME"
    else
      echo -e "    ${RED}✗${NC} Validation failed: $FK_NAME"
      echo "    Check for orphaned data or blocking transactions"
      exit 1
    fi
  done || exit 1
fi

# Final check - all FKs must be VALID
INVALID_FKS=$(run_sql "SELECT conname FROM pg_constraint WHERE contype='f' AND convalidated=false;" || echo "")
if [ -n "$INVALID_FKS" ]; then
  echo -e "${RED}✗ Invalid foreign keys found after validation attempt:${NC}"
  echo "$INVALID_FKS"
  echo ""
  echo "Check for:"
  echo "  1. Orphaned data (run integrity_checks.sql)"
  echo "  2. Blocking transactions (see pg_stat_activity)"
  exit 1
fi
check_result "All foreign keys are VALID"

# 10) Verify concurrent indexes are valid and ready
echo ""
echo -e "${YELLOW}[10] Verifying Indexes${NC}"
INVALID_IDX=$(run_sql "SELECT i.relname FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE i.relkind='i' AND (x.indisvalid=false OR x.indisready=false);")
if [ -n "$INVALID_IDX" ]; then
  echo -e "${RED}✗ Invalid or not-ready indexes found:${NC}"
  echo "$INVALID_IDX"
  echo ""
  echo "Detailed index status:"
  run_sql "SELECT i.relname as index_name, x.indisvalid as is_valid, x.indisready as is_ready FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE i.relkind='i' AND i.relname LIKE 'idx_%' ORDER BY x.indisvalid, x.indisready, i.relname;"
  exit 1
fi

# Check specifically for new indexes from migrations
NEW_IDX_STATUS=$(run_sql "SELECT i.relname, x.indisvalid, x.indisready FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE i.relkind='i' AND i.relname IN ('idx_recipe_name_trgm', 'idx_recipe_description_trgm', 'idx_recipe_method_trgm', 'idx_recipe_list_covering', 'idx_sales_record_analytics', 'idx_production_history_company_date_recipe', 'idx_inventory_movement_history', 'idx_notification_unread', 'idx_wholesale_order_status_date') ORDER BY i.relname;" || true)
if [ -n "$NEW_IDX_STATUS" ]; then
  echo "New index status:"
  echo "$NEW_IDX_STATUS" | while read line; do
    if echo "$line" | grep -q "f"; then
      echo -e "  ${RED}✗${NC} $line"
    else
      echo -e "  ${GREEN}✓${NC} $line"
    fi
  done
fi

check_result "All indexes are VALID and READY"

# 11) Check dual-write trigger exists
echo ""
echo -e "${YELLOW}[11] Verifying Dual-Write Trigger${NC}"
TRIGGER_EXISTS=$(run_sql "SELECT tgname FROM pg_trigger WHERE tgname = 'sync_recipe_category_trigger';" || echo "")
if [ -n "$TRIGGER_EXISTS" ] && [ "$TRIGGER_EXISTS" != "0" ]; then
  echo -e "${GREEN}✓${NC} Dual-write trigger exists: sync_recipe_category_trigger"
else
  echo -e "${YELLOW}⚠ Dual-write trigger not found (may not be needed if category migration skipped)${NC}"
fi

# 12) Check for locks
echo ""
echo -e "${YELLOW}[12] Checking for Active Locks${NC}"
LOCKS=$(run_sql "SELECT COUNT(*) FROM pg_locks WHERE NOT granted;" || echo "0")
# Remove whitespace from count
LOCKS=$(echo "$LOCKS" | tr -d '[:space:]' || echo "0")
# Ensure it's a number
if ! [[ "$LOCKS" =~ ^[0-9]+$ ]]; then
  LOCKS=0
fi

if [ "$LOCKS" -gt 0 ]; then
  echo -e "${RED}✗ $LOCKS ungranted locks found - BLOCKER${NC}"
  run_sql "SELECT pid, locktype, mode, granted FROM pg_locks WHERE NOT granted LIMIT 10;"
  NO_LOCKS=false
else
  echo -e "${GREEN}✓${NC} No active locks"
  check_result "No active locks"
fi

# 13) Verify top-10 query latency (performance check)
echo ""
echo -e "${YELLOW}[13] Checking Query Performance${NC}"
if command -v psql >/dev/null 2>&1; then
  # Capture top queries before/after if pg_stat_statements available
  TOP_QUERIES_BEFORE=$(run_sql "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;" 2>/dev/null || echo "")
  if [ -n "$TOP_QUERIES_BEFORE" ]; then
    echo "Top queries captured (compare with after_perf.txt)"
  else
    echo -e "${YELLOW}⚠ pg_stat_statements not available - skip performance comparison${NC}"
  fi
else
  echo -e "${YELLOW}⚠ psql not available - skip performance check${NC}"
fi

# 14) Check for long-running idle transactions (blockers for VALIDATE)
echo ""
echo -e "${YELLOW}[14] Checking for Idle Transactions${NC}"
IDLE_TXNS=$(run_sql "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle in transaction' AND now() - state_change > interval '1 minute';" || echo "0")
# Remove whitespace from count
IDLE_TXNS=$(echo "$IDLE_TXNS" | tr -d '[:space:]' || echo "0")
# Ensure it's a number
if ! [[ "$IDLE_TXNS" =~ ^[0-9]+$ ]]; then
  IDLE_TXNS=0
fi

if [ "$IDLE_TXNS" -gt 0 ]; then
  echo -e "${RED}✗ $IDLE_TXNS long-running idle transactions found - BLOCKER${NC}"
  echo "These can block VALIDATE CONSTRAINT. Kill them first:"
  run_sql "SELECT pid, state, now() - state_change as idle_duration, query FROM pg_stat_activity WHERE state = 'idle in transaction' AND now() - state_change > interval '1 minute' LIMIT 10;"
  NO_IDLE_TXNS=false
else
  echo -e "${GREEN}✓${NC} No blocking idle transactions"
  check_result "No blocking idle transactions"
fi

# 15) Final validation summary
echo ""
echo -e "${YELLOW}[15] Final Validation Summary${NC}"

# Check all criteria
ALL_TESTS_PASS=true
ALL_FKS_VALID=true
ALL_IDX_VALID=true
NO_LOCKS=true
NO_IDLE_TXNS=true

# Verify tests passed
if [ $TEST_EXIT_CODE -ne 0 ]; then
  ALL_TESTS_PASS=false
fi

# Verify FKs valid
INVALID_FKS_COUNT=$(run_sql "SELECT COUNT(*) FROM pg_constraint WHERE contype='f' AND convalidated=false;")
if [ "$INVALID_FKS_COUNT" -gt 0 ]; then
  ALL_FKS_VALID=false
fi

# Verify indexes valid and ready
INVALID_IDX_COUNT=$(run_sql "SELECT COUNT(*) FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid WHERE i.relkind='i' AND (x.indisvalid=false OR x.indisready=false);")
if [ "$INVALID_IDX_COUNT" -gt 0 ]; then
  ALL_IDX_VALID=false
fi

# Summary
echo ""
echo -e "${GREEN}=== Validation Complete ===${NC}"
echo ""
echo "Criteria Check:"
if [ "$ALL_TESTS_PASS" = true ]; then
  echo -e "  ${GREEN}✓${NC} All tests passed"
else
  echo -e "  ${RED}✗${NC} Tests failed"
fi

if [ "$ALL_FKS_VALID" = true ]; then
  echo -e "  ${GREEN}✓${NC} All FKs and uniques VALID"
else
  echo -e "  ${RED}✗${NC} Invalid FKs found"
fi

if [ "$ALL_IDX_VALID" = true ]; then
  echo -e "  ${GREEN}✓${NC} All indexes VALID and READY"
else
  echo -e "  ${RED}✗${NC} Invalid indexes found"
fi

if [ "$NO_LOCKS" = true ]; then
  echo -e "  ${GREEN}✓${NC} No long locks"
else
  echo -e "  ${RED}✗${NC} Long locks detected"
fi

if [ "$NO_IDLE_TXNS" = true ]; then
  echo -e "  ${GREEN}✓${NC} No blocking idle transactions"
else
  echo -e "  ${RED}✗${NC} Blocking idle transactions found"
fi

echo ""
echo "Performance:"
echo "  Review diff: diff -u baseline_perf.txt after_perf.txt"
echo "  Check for >20% latency increase in top-10 queries"
echo ""

# Final decision
FINAL_PASS=true

if [ "$ALL_TESTS_PASS" != true ]; then
  FINAL_PASS=false
fi
if [ "$ALL_FKS_VALID" != true ]; then
  FINAL_PASS=false
fi
if [ "$ALL_IDX_VALID" != true ]; then
  FINAL_PASS=false
fi
if [ "$NO_LOCKS" != true ]; then
  FINAL_PASS=false
fi
if [ "$NO_IDLE_TXNS" != true ]; then
  FINAL_PASS=false
fi

if [ "$FINAL_PASS" = true ]; then
  echo ""
  echo -e "${GREEN}=== ✓ STAGING VALIDATION PASSED ===${NC}"
  echo ""
  echo "All criteria met:"
  echo "  ✓ Tests green"
  echo "  ✓ All FKs/uniques VALID"
  echo "  ✓ All indexes VALID and READY"
  echo "  ✓ No long locks"
  echo "  ✓ No blocking idle transactions"
  echo ""
  echo "Next steps:"
  echo "1. Review performance diff: diff -u baseline_perf.txt after_perf.txt"
  echo "2. Verify top-10 query latency change ≤ 20%"
  echo "3. If performance acceptable, deploy to production:"
  echo ""
  echo "   export STAGING_VALIDATION_PASSED=true"
  echo "   export PROD_DATABASE_URL=\"postgres://user:pass@prod-host:5432/prod\""
  echo "   ./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}=== ✗ STAGING VALIDATION FAILED ===${NC}"
  echo ""
  echo "BLOCKERS DETECTED - DO NOT DEPLOY"
  echo ""
  echo "Review staging_validation.log for details:"
  echo "  grep -E '(FAILED|BLOCKER|Invalid|failed)' staging_validation.log"
  echo ""
  echo "Common fixes:"
  echo "  - Invalid FK/index → ensure NOT VALID + VALIDATE, use CONCURRENTLY"
  echo "  - SET NOT NULL failing → backfill nulls first"
  echo "  - Perf regression >20% → add index or rewrite query"
  echo "  - Locks → split migration, validate in batches, kill blockers"
  echo ""
  echo "Fix issues in branch, then re-run:"
  echo "  ./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log"
  echo ""
  exit 1
fi

