#!/bin/bash
# Helper script to run the migration workflow
# This makes it easier to set up and run

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🚀 Migration Workflow Helper"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root. Please run from /Users/matt/plato/"
    exit 1
fi

# Check if environment variables are already set
if [ -n "${PROD_DATABASE_URL:-}" ] && [ -n "${STAGING_DATABASE_URL:-}" ]; then
    echo "✅ Environment variables already set"
    echo "   PROD: ${PROD_DATABASE_URL%%@*}@..."
    echo "   STAGING: ${STAGING_DATABASE_URL%%@*}@..."
    echo ""
    read -p "Use these? (yes/no): " use_existing
    if [ "$use_existing" != "yes" ]; then
        unset PROD_DATABASE_URL
        unset STAGING_DATABASE_URL
    fi
fi

# If not set, guide user to set them
if [ -z "${PROD_DATABASE_URL:-}" ] || [ -z "${STAGING_DATABASE_URL:-}" ]; then
    echo "📝 You need to set your database URLs"
    echo ""
    echo "Option 1: Set them now (they'll be saved for this terminal session)"
    echo "Option 2: Set them manually in your terminal"
    echo ""
    read -p "Set them now? (yes/no): " set_now
    
    if [ "$set_now" = "yes" ]; then
        echo ""
        echo "Enter PROD_DATABASE_URL:"
        echo "Format: postgres://USER:PASS@HOST:5432/DATABASE"
        read -p "> " PROD_DATABASE_URL
        export PROD_DATABASE_URL
        
        echo ""
        echo "Enter STAGING_DATABASE_URL:"
        echo "Format: postgres://USER:PASS@HOST:5432/DATABASE"
        read -p "> " STAGING_DATABASE_URL
        export STAGING_DATABASE_URL
        
        echo ""
        echo "✅ URLs set (for this terminal session only)"
    else
        echo ""
        echo "Please set them manually:"
        echo '  export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"'
        echo '  export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"'
        echo ""
        echo "Then run this script again."
        exit 0
    fi
fi

echo ""
echo "🔍 Checking prerequisites..."
echo ""

# Check if the main script exists
if [ ! -f "$SCRIPT_DIR/execute-migration-workflow.sh" ]; then
    echo "❌ Error: execute-migration-workflow.sh not found"
    exit 1
fi

# Make sure it's executable
chmod +x "$SCRIPT_DIR/execute-migration-workflow.sh"

# Check for other required scripts
REQUIRED_SCRIPTS=(
    "validate-migrations-staging.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$script" ]; then
        echo "⚠️  Warning: $script not found (may not be required)"
    fi
done

echo "✅ Ready to run migration workflow"
echo ""
read -p "Start the migration workflow now? (yes/no): " start_now

if [ "$start_now" != "yes" ]; then
    echo "Cancelled. Run this script again when ready."
    exit 0
fi

echo ""
echo "🚀 Starting migration workflow..."
echo ""

# Run the actual workflow script
exec "$SCRIPT_DIR/execute-migration-workflow.sh"

