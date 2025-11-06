#!/bin/bash
# Direct SQL migration script - runs SQL file directly without Prisma

echo "🚀 Starting Staff Training System Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL before running this script"
    exit 1
fi

# Get the migration file path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="$SCRIPT_DIR/../migrations/20250116000000_staff_training_system.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ ERROR: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "📄 Running migration file: $MIGRATION_FILE"
echo ""

# Run the migration using psql
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Run: npx prisma generate"
    echo "   2. Verify tables were created"
    echo "   3. Initialize default roles for existing companies"
else
    echo ""
    echo "❌ Migration failed. Please check the errors above."
    exit 1
fi

