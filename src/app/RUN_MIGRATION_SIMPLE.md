# Run Migration - Simple Instructions

## ✅ Quick Way to Run Migration

Since you have a structured database system, here's the simplest way:

### Option 1: Via API Endpoint (Easiest)

1. **Set MIGRATION_SECRET in your environment:**
   ```bash
   export MIGRATION_SECRET="your-secret-key"
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **Call the migration endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/migrate/staff-training \
     -H "Authorization: Bearer your-secret-key"
   ```

Or use this in your browser/Postman:
- URL: `POST /api/migrate/staff-training`
- Header: `Authorization: Bearer your-secret-key`

### Option 2: Direct SQL (If DATABASE_URL is available)

```bash
# Load environment
source .env.local  # or wherever your DATABASE_URL is

# Run migration
psql "$DATABASE_URL" -f migrations/20250116000000_staff_training_system.sql
```

### Option 3: Add to Your Deployment Scripts

Add this line to your `scripts/deploy-migrations-production.sh`:

```bash
"migrations/20250116000000_staff_training_system.sql"
```

Then run your standard deployment process.

## After Migration

```bash
npx prisma generate
```

## Verify

Check tables were created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Role', 'StaffProfile', 'TrainingModule');
```

---

**The migration file is ready at:** `migrations/20250116000000_staff_training_system.sql`

You can run it through whatever process you normally use! 🚀

