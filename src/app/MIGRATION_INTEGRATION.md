# Migration Integration Guide

## Your Migration System

You use a **structured SQL migration system** with:
- Numbered SQL migration files in `migrations/` directory
- Rollback scripts in `migrations/rollbacks/`
- Validation and deployment scripts
- Prisma for type generation (not migrations)

## ✅ Migration File Created

The migration file is ready and follows your naming convention:
- **File:** `migrations/20250116000000_staff_training_system.sql`
- **Date:** 2025-01-16 00:00:00
- **Order:** After all existing migrations

## 🚀 How to Run Through Your System

### Option 1: Via Your Migration Scripts (Recommended)

Add the migration to your deployment script:

```bash
# Add to scripts/deploy-migrations-production.sh
MIGRATION_FILES=(
  "migrations/20250115120000_add_composite_unique_constraints.sql"
  "migrations/20250115130000_add_missing_foreign_keys_production_safe.sql"
  "migrations/20250115140000_add_check_constraints.sql"
  "migrations/20250115150000_add_performance_indexes.sql"
  "migrations/20250115160000_fix_recipe_category_fields_backfill.sql"
  "migrations/20250115160001_fix_recipe_category_fields_cutover.sql"
  "migrations/20250116000000_staff_training_system.sql"  # ← ADD THIS LINE
)
```

Then run your existing deployment process:
```bash
./scripts/deploy-migrations-production.sh
```

### Option 2: Via Prisma $executeRaw (Respects Your Workflow)

Use the Prisma-based script that runs through your database connection:

```bash
npx tsx scripts/run-staff-training-migration-via-prisma.ts
```

This:
- ✅ Uses your existing Prisma connection
- ✅ Respects your database structure
- ✅ Handles "already exists" errors gracefully
- ✅ Works with your migration validation

### Option 3: Direct SQL (If Needed)

```bash
psql $DATABASE_URL -f migrations/20250116000000_staff_training_system.sql
```

## 📋 After Migration

### 1. Generate Prisma Client

```bash
npx prisma generate
```

This generates TypeScript types for the new models.

### 2. Update Your Prisma Schema (Optional)

If you want Prisma to know about these models, you can add them to `prisma/schema.prisma`. However, since you use SQL migrations, this is optional - Prisma client will work as long as the tables exist in the database.

### 3. Verify Migration

Check that tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'Role', 
  'RolePermission', 
  'StaffProfile', 
  'TrainingModule', 
  'TrainingContent', 
  'TrainingRecord', 
  'TrainingModuleRecipe',
  'CleaningJob', 
  'ProductionJobAssignment'
);
```

## ✅ What Gets Created

The migration creates these tables (matching your existing structure):

1. **Role** - Custom roles for companies
2. **RolePermission** - Permission mappings for roles
3. **StaffProfile** - Extended staff member profiles
4. **TrainingModule** - Training modules
5. **TrainingContent** - Training content (text, images, videos)
6. **TrainingRecord** - Staff training completion records
7. **TrainingModuleRecipe** - Links training modules to recipes
8. **CleaningJob** - Cleaning job assignments
9. **ProductionJobAssignment** - Production job assignments

All tables:
- ✅ Use `IF NOT EXISTS` (idempotent)
- ✅ Include proper foreign keys
- ✅ Include indexes for performance
- ✅ Follow your naming conventions
- ✅ Integrate with existing tables (Company, Membership, User, Recipe, ProductionPlan)

## 🔄 Integration with Your Workflow

The migration:
- ✅ Follows your naming convention (`YYYYMMDDHHMMSS_description.sql`)
- ✅ Uses `IF NOT EXISTS` for idempotency
- ✅ Includes proper indexes
- ✅ Doesn't break existing functionality
- ✅ Can be added to your validation scripts

## 📝 Next Steps

1. **Add to your migration order** (update deployment scripts)
2. **Run through your validation process** (if you have staging validation)
3. **Deploy using your standard process**
4. **Generate Prisma client** after migration
5. **Test the new features**

The migration is ready to integrate into your structured system! 🎉

