#!/bin/bash
# Setup Database URLs from Neon Connection Strings
# Run this to set up your environment variables

export DATABASE_URL="postgresql://neondb_owner:npg_mXqCKBWa9zg5@ep-autumn-breeze-abxaban3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
export PROD_DATABASE_URL="$DATABASE_URL"

# For staging, use the same database for now
# TODO: Create a separate staging database in Neon
export STAGING_DATABASE_URL="$DATABASE_URL"

echo "✅ Environment variables set:"
echo "  DATABASE_URL = ${DATABASE_URL%%@*}***"
echo "  PROD_DATABASE_URL = ${PROD_DATABASE_URL%%@*}***"
echo "  STAGING_DATABASE_URL = ${STAGING_DATABASE_URL%%@*}***"
echo ""
echo "To use these in your current shell, run:"
echo "  source setup-database-urls.sh"
echo ""
echo "Or run the workflow:"
echo "  ./scripts/execute-migration-workflow.sh"


