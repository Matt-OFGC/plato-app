#!/bin/bash
# Triage Validation Failures
# Usage: ./scripts/triage-validation-failures.sh [staging_validation.log]

LOG_FILE="${1:-staging_validation.log}"

if [ ! -f "$LOG_FILE" ]; then
  echo "Error: Log file not found: $LOG_FILE"
  exit 1
fi

echo "=========================================="
echo "Validation Failure Triage"
echo "=========================================="
echo ""

echo "1. FAILED/BLOCKER issues:"
echo "----------------------------------------"
grep -nE "(FAILED|BLOCKER)" "$LOG_FILE" | head -20 || echo "  None found"
echo ""

echo "2. Invalid constraints/indexes:"
echo "----------------------------------------"
grep -nE "(Invalid|not valid|not ready|convalidated.*false|indisvalid.*false)" "$LOG_FILE" | head -20 || echo "  None found"
echo ""

echo "3. Performance regressions:"
echo "----------------------------------------"
grep -nE "(regression|>20%|latency|slow|performance)" "$LOG_FILE" | head -20 || echo "  None found"
echo ""

echo "4. Lock/timeout issues:"
echo "----------------------------------------"
grep -nE "(lock|timeout|block|wait|deadlock)" "$LOG_FILE" | head -20 || echo "  None found"
echo ""

echo "5. Migration errors:"
echo "----------------------------------------"
grep -nE "(migration.*fail|error.*migration|ERROR|EXCEPTION)" "$LOG_FILE" | head -20 || echo "  None found"
echo ""

echo "=========================================="
echo "Typical Fixes:"
echo "=========================================="
echo ""
echo "Invalid FK/index:"
echo "  - Ensure NOT VALID + later VALIDATE"
echo "  - Use CREATE INDEX CONCURRENTLY"
echo ""
echo "SET NOT NULL failing:"
echo "  - Backfill nulls first: UPDATE table SET col = default WHERE col IS NULL;"
echo ""
echo "20% perf regression:"
echo "  - Add missing index (see perf_report.md)"
echo "  - Rewrite slow query"
echo ""
echo "Locks/blockers:"
echo "  - Split migrations into smaller batches"
echo "  - Kill idle-in-transaction sessions:"
echo "    SELECT pg_terminate_backend(pid) FROM pg_stat_activity"
echo "    WHERE state = 'idle in transaction' AND now() - state_change > interval '5 minutes';"
echo ""
echo "=========================================="


