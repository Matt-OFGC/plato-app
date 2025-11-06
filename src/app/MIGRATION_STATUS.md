# Migration Status

## ✅ Ready to Run

All code is complete and ready for migration. The migration file is located at:
- `migrations/20250116000000_staff_training_system.sql`

## 📋 Next Steps

### 1. Set Up Database Connection

Your `.env.local` file exists. Make sure it contains:
```
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 2. Run Migration

**Option A: Direct psql command**
```bash
cd /Users/matt/plato/src/app
source .env.local  # Load environment variables
psql "$DATABASE_URL" -f migrations/20250116000000_staff_training_system.sql
```

**Option B: Using the bash script**
```bash
cd /Users/matt/plato/src/app
./scripts/run-staff-training-migration-direct.sh
```

**Option C: Using TypeScript script**
```bash
cd /Users/matt/plato/src/app
npx tsx scripts/run-staff-training-migration.ts
```

### 3. Generate Prisma Client

After migration completes:
```bash
npx prisma generate
```

### 4. Verify

Check that tables were created:
```bash
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Role', 'StaffProfile', 'TrainingModule');"
```

## 📝 What Gets Created

The migration creates these tables:
1. `Role` - Custom roles
2. `RolePermission` - Role permissions mapping
3. `StaffProfile` - Staff member profiles
4. `TrainingModule` - Training modules
5. `TrainingContent` - Training content (text, images, videos)
6. `TrainingRecord` - Staff training completion records
7. `TrainingModuleRecipe` - Links training to recipes
8. `CleaningJob` - Cleaning job assignments
9. `ProductionJobAssignment` - Production job assignments

## ✨ After Migration

Once migration is complete, you can:
- ✅ Navigate to `/dashboard/team` - Team management
- ✅ Navigate to `/dashboard/scheduling` - Scheduling
- ✅ Navigate to `/dashboard/training` - Training dashboard
- ✅ Create training modules
- ✅ Manage roles and permissions
- ✅ Assign cleaning jobs
- ✅ Link training to recipes

## 🐛 Troubleshooting

If you encounter connection issues:
1. Verify DATABASE_URL is correct
2. Check database server is running
3. Verify network/firewall settings
4. Try connecting manually: `psql "$DATABASE_URL"`

See `RUN_MIGRATION.md` for detailed troubleshooting.

