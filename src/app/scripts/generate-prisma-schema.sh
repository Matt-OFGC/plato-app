#!/bin/bash
# Script to introspect database and generate Prisma schema
# This reads your database structure and creates schema.prisma

set -e

echo "🚀 Generating Prisma schema from database..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Checking .env.local..."
  if [ -f .env.local ]; then
    export $(grep DATABASE_URL .env.local | head -1 | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found"
  echo "Please set DATABASE_URL or ensure it's in .env.local"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Step 1: Introspect database and generate schema
echo "📊 Step 1: Introspecting database..."
npx prisma db pull

echo ""
echo "✅ Schema generated from database!"
echo ""

# Step 2: Generate Prisma Client
echo "📦 Step 2: Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client generated!"
echo ""
echo "🎉 Done! You now have:"
echo "   - schema.prisma with all your tables"
echo "   - TypeScript types for all models"
echo "   - Type-safe Prisma Client ready to use"
echo ""

