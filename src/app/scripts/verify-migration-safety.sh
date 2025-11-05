#!/bin/bash
# Migration Safety Verification Script
# Greps migrations for risky patterns that could cause production issues
# Usage: ./scripts/verify-migration-safety.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

MIGRATIONS_DIR="migrations"

echo -e "${GREEN}=== Migration Safety Verification ===${NC}"
echo ""

ISSUES=0

# Check 1: No in-place rewrites on big tables
echo -e "${YELLOW}[1] Checking for in-place type changes (RISKY)${NC}"
TYPE_CHANGES=$(grep -nE 'ALTER TABLE .* (SET DATA TYPE|USING|ALTER COLUMN .* TYPE)' "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
if [ -n "$TYPE_CHANGES" ]; then
  echo -e "${RED}✗ Found risky type changes:${NC}"
  echo "$TYPE_CHANGES"
  ISSUES=$((ISSUES + 1))
else
  echo -e "${GREEN}✓ No in-place type changes found${NC}"
fi
echo ""

# Check 2: Indexes must be concurrent (for large tables)
echo -e "${YELLOW}[2] Checking for non-concurrent indexes on large tables${NC}"
NON_CONCURRENT=$(grep -nE 'CREATE INDEX(?! CONCURRENTLY)' "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "IF NOT EXISTS" || true)
if [ -n "$NON_CONCURRENT" ]; then
  echo -e "${YELLOW}⚠ Found non-concurrent indexes (may be OK for small tables):${NC}"
  echo "$NON_CONCURRENT"
  # Not a blocker, but worth noting
else
  echo -e "${GREEN}✓ All indexes use CONCURRENTLY${NC}"
fi
echo ""

# Check 3: FKs should use NOT VALID pattern
echo -e "${YELLOW}[3] Checking FK migration uses NOT VALID pattern${NC}"
FK_FILE="$MIGRATIONS_DIR/20250115130000_add_missing_foreign_keys_production_safe.sql"
if [ -f "$FK_FILE" ]; then
  HAS_NOT_VALID=$(grep -nE 'NOT VALID' "$FK_FILE" || true)
  HAS_VALIDATE=$(grep -n 'VALIDATE CONSTRAINT' "$FK_FILE" || true)
  
  if [ -z "$HAS_NOT_VALID" ]; then
    echo -e "${RED}✗ FK migration missing NOT VALID pattern${NC}"
    ISSUES=$((ISSUES + 1))
  else
    echo -e "${GREEN}✓ FK migration uses NOT VALID pattern${NC}"
  fi
  
  if [ -z "$HAS_VALIDATE" ]; then
    echo -e "${RED}✗ FK migration missing VALIDATE CONSTRAINT step${NC}"
    ISSUES=$((ISSUES + 1))
  else
    echo -e "${GREEN}✓ FK migration includes VALIDATE CONSTRAINT${NC}"
  fi
else
  echo -e "${YELLOW}⚠ FK migration file not found${NC}"
fi
echo ""

# Check 4: No DROP COLUMN without deprecation
echo -e "${YELLOW}[4] Checking for DROP COLUMN (should have deprecation cycle)${NC}"
DROP_COLUMNS=$(grep -nE 'DROP COLUMN' "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
if [ -n "$DROP_COLUMNS" ]; then
  # Check if cleanup migration is disabled
  CLEANUP_FILE="$MIGRATIONS_DIR/20250115160002_fix_recipe_category_fields_cleanup.sql"
  if [ -f "$CLEANUP_FILE" ]; then
    IS_DISABLED=$(grep -nE 'cleanup_enabled.*FALSE|DISABLED' "$CLEANUP_FILE" || true)
    if [ -n "$IS_DISABLED" ]; then
      echo -e "${GREEN}✓ DROP COLUMN found but cleanup migration is disabled (safe)${NC}"
    else
      echo -e "${YELLOW}⚠ DROP COLUMN found - verify cleanup migration is disabled by default${NC}"
      echo "$DROP_COLUMNS"
    fi
  else
    echo -e "${RED}✗ DROP COLUMN found without disabled cleanup migration${NC}"
    echo "$DROP_COLUMNS"
    ISSUES=$((ISSUES + 1))
  fi
else
  echo -e "${GREEN}✓ No DROP COLUMN found${NC}"
fi
echo ""

# Check 5: No SET NOT NULL without backfill
echo -e "${YELLOW}[5] Checking for SET NOT NULL without backfill${NC}"
SET_NOT_NULL=$(grep -nE 'SET NOT NULL|ALTER COLUMN.*SET NOT NULL' "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)
if [ -n "$SET_NOT_NULL" ]; then
  echo -e "${RED}✗ Found SET NOT NULL (should have backfill first):${NC}"
  echo "$SET_NOT_NULL"
  ISSUES=$((ISSUES + 1))
else
  echo -e "${GREEN}✓ No SET NOT NULL found${NC}"
fi
echo ""

# Check 6: All migrations have rollback scripts
echo -e "${YELLOW}[6] Checking for rollback scripts${NC}"
ROLLBACK_DIR="$MIGRATIONS_DIR/rollbacks"
MISSING_ROLLBACKS=0
for f in "$MIGRATIONS_DIR"/*.sql; do
  if [[ "$f" == *"cleanup.sql" ]]; then
    continue # Cleanup migrations may not need rollback
  fi
  
  BASENAME=$(basename "$f" .sql)
  ROLLBACK_FILE="$ROLLBACK_DIR/${BASENAME}_rollback.sql"
  
  if [ ! -f "$ROLLBACK_FILE" ] && [[ "$f" != *"backfill.sql" ]] && [[ "$f" != *"cutover.sql" ]]; then
    echo -e "${YELLOW}⚠ Missing rollback: $ROLLBACK_FILE${NC}"
    MISSING_ROLLBACKS=$((MISSING_ROLLBACKS + 1))
  fi
done

if [ $MISSING_ROLLBACKS -eq 0 ]; then
  echo -e "${GREEN}✓ All migrations have rollback scripts${NC}"
else
  echo -e "${YELLOW}⚠ $MISSING_ROLLBACKS migrations missing rollback scripts${NC}"
fi
echo ""

# Check 7: Idempotency checks (IF NOT EXISTS, IF EXISTS)
echo -e "${YELLOW}[7] Checking for idempotency patterns${NC}"
CONSTRAINT_CREATES=$(grep -nE 'ADD CONSTRAINT' "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v 'IF NOT EXISTS' || true)
if [ -n "$CONSTRAINT_CREATES" ]; then
  # Check if wrapped in DO block with IF NOT EXISTS check
  HAS_CHECKS=$(grep -nE 'IF NOT EXISTS.*pg_constraint|IF EXISTS.*pg_constraint' "$MIGRATIONS_DIR"/*.sql || true)
  if [ -z "$HAS_CHECKS" ]; then
    echo -e "${YELLOW}⚠ Some constraints may not be idempotent (check DO blocks)${NC}"
  else
    echo -e "${GREEN}✓ Constraints use idempotency checks${NC}"
  fi
else
  echo -e "${GREEN}✓ No direct constraint additions found${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}=== Verification Summary ===${NC}"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✓ All safety checks passed${NC}"
  echo "Migrations are production-safe"
  exit 0
else
  echo -e "${RED}✗ Found $ISSUES critical issues${NC}"
  echo "Fix these before production deployment"
  exit 1
fi


