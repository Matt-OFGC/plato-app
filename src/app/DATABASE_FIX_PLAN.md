# Database Structure Fix Plan

## Your Real Problems (From Your Description)

1. **"Issues when adding new features"** → Missing constraints allow bad data
2. **"Breaking old stuff when changing one thing"** → No foreign keys = orphaned data
3. **"Recipes not talking to each other"** → Missing unique constraints = duplicate/inconsistent data

## Root Causes (From ERD Analysis)

### ❌ CRITICAL Issues Found:

1. **Missing Unique Constraints:**
   - RecipeItem: Can have duplicate ingredients in same recipe
   - RecipeSection: Can have duplicate order values

2. **Missing Foreign Keys:**
   - Company.ownerId → User.id (orphaned owners)
   - ProductionTask.assignedTo → User.id (orphaned assignments)

3. **Missing CHECK Constraints:**
   - Prices can be negative
   - Quantities can be zero/negative

4. **Missing Indexes:**
   - Slow recipe searches
   - Slow joins between recipes/ingredients

5. **Data Redundancy:**
   - Recipe.category (string) + Recipe.categoryId (FK) - duplicate data!

## The Solution

We've ALREADY created migrations to fix ALL of these! They're in `migrations/`:

1. ✅ `20250115120000_add_composite_unique_constraints.sql` - Fixes duplicates
2. ✅ `20250115130000_add_missing_foreign_keys_production_safe.sql` - Fixes orphans
3. ✅ `20250115140000_add_check_constraints.sql` - Prevents bad data
4. ✅ `20250115150000_add_performance_indexes.sql` - Speeds up queries
5. ✅ `20250115160000_fix_recipe_category_fields_*.sql` - Removes redundancy

## What We Need to Do

**Step 1: Get your database schema**
Since both DBs are empty, we need to either:
- Option A: Find your Prisma schema file (it might be in a different location)
- Option B: Generate schema from an existing database that has tables
- Option C: Create a minimal schema to get started

**Step 2: Apply the schema to staging**
Once we have the schema, apply it:
```bash
DATABASE_URL="$STAGING_DATABASE_URL" npx prisma migrate deploy
```

**Step 3: Run the migrations**
The validation script will then apply all the fixes:
```bash
./scripts/validate-migrations-staging.sh
```

## Next Step: Find Your Schema

Let me search for where your Prisma schema might be...
