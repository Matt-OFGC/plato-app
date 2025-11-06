# Run Migration - Step by Step Instructions

## ⚠️ Important: Set DATABASE_URL First

Before running the migration, you need to set your `DATABASE_URL` environment variable.

### Option 1: Using .env file (Recommended)

1. Check if you have a `.env` file in the project root:
   ```bash
   cd /Users/matt/plato/src/app
   ls -la .env
   ```

2. If `.env` exists, it should contain:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

3. If `.env` doesn't exist, create it:
   ```bash
   echo 'DATABASE_URL="your-database-connection-string"' > .env
   ```

### Option 2: Export in Terminal

```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### Option 3: Inline with Command

```bash
DATABASE_URL="your-connection-string" psql "$DATABASE_URL" -f migrations/20250116000000_staff_training_system.sql
```

---

## 🚀 Step 1: Run Migration

Once `DATABASE_URL` is set, run:

```bash
cd /Users/matt/plato/src/app
psql "$DATABASE_URL" -f migrations/20250116000000_staff_training_system.sql
```

**Alternative: Using the bash script**
```bash
cd /Users/matt/plato/src/app
./scripts/run-staff-training-migration-direct.sh
```

**Expected Output:**
- You should see SQL commands executing
- Tables will be created: `Role`, `RolePermission`, `StaffProfile`, `TrainingModule`, `TrainingContent`, `TrainingRecord`, `CleaningJob`, `ProductionJobAssignment`
- If tables already exist, you'll see "already exists" warnings (this is OK)

---

## 🔧 Step 2: Generate Prisma Client

After migration completes successfully:

```bash
cd /Users/matt/plato/src/app
npx prisma generate
```

**Expected Output:**
- Prisma Client will be generated
- TypeScript types will be created for all models
- You may see warnings about missing types (these are OK if tables don't exist yet)

---

## ✅ Step 3: Verify Migration

Run this SQL query to verify tables were created:

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
)
ORDER BY table_name;
```

You should see all 9 tables listed.

---

## 🧪 Step 4: Test the System

1. **Start your development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Navigate to the pages:**
   - `/dashboard/team` - Team management
   - `/dashboard/scheduling` - Scheduling page
   - `/dashboard/training` - Training dashboard

3. **Create a training module:**
   - Go to `/dashboard/training`
   - Click "Create Module"
   - Fill in the form and save

4. **Test permissions:**
   - Go to `/dashboard/settings/roles`
   - Create a custom role
   - Assign permissions

---

## 🐛 Troubleshooting

### Error: "relation already exists"
- This means tables were already created
- This is OK - the migration uses `IF NOT EXISTS`
- Continue to Step 2

### Error: "permission denied"
- Check your database user has CREATE TABLE permissions
- Verify DATABASE_URL is correct

### Error: "connection refused"
- Check DATABASE_URL is correct
- Verify database server is running
- Check network/firewall settings

### Error: "column already exists"
- Some columns may already exist
- Check if previous migration partially ran
- You may need to manually drop tables and re-run

### Prisma Generate Errors
- Make sure migration ran successfully first
- Check `prisma/schema.prisma` matches migration
- You may need to manually update schema.prisma to match migration

---

## 📋 Quick Reference

```bash
# 1. Set DATABASE_URL (if not in .env)
export DATABASE_URL="postgresql://..."

# 2. Run migration
psql "$DATABASE_URL" -f migrations/20250116000000_staff_training_system.sql

# 3. Generate Prisma client
npx prisma generate

# 4. Verify
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Role', 'StaffProfile', 'TrainingModule');"
```

---

## ✨ Next Steps After Migration

Once migration is complete:
1. ✅ Generate Prisma client
2. ✅ Test the application
3. ✅ Create initial roles (optional)
4. ✅ Create training templates (optional)
5. ✅ Start using the system!

All systems are ready to go! 🚀

