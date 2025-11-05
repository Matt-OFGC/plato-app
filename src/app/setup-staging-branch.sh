#!/bin/bash
# Setup Staging Branch Connection
# After getting the staging connection string from Neon, update this script

# Production (main branch)
export PROD_DATABASE_URL="postgresql://neondb_owner:npg_mXqCKBWa9zg5@ep-autumn-breeze-abxaban3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Staging branch (staging branch)
export STAGING_DATABASE_URL="postgresql://neondb_owner:npg_mXqCKBWa9zg5@ep-small-base-abgcgmmc-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "✅ Environment variables set:"
echo "  PROD_DATABASE_URL = ${PROD_DATABASE_URL%%@*}***"
echo "  STAGING_DATABASE_URL = ${STAGING_DATABASE_URL%%@*}***"
echo ""
echo "To use these, run:"
echo "  source setup-staging-branch.sh"
echo ""
echo "Then run the workflow:"
echo "  ./scripts/execute-migration-workflow.sh"

