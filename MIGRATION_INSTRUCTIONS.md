# Customer Type Migration Instructions

## After Deployment

Once your Vercel deployment succeeds, run the migration using one of these methods:

### Option 1: API Endpoint (Recommended)

1. Set `MIGRATION_SECRET` environment variable in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `MIGRATION_SECRET` with a secure random string (e.g., generate with `openssl rand -hex 32`)

2. After deployment, call the migration endpoint:
   ```bash
   curl -X POST https://your-app.vercel.app/api/migrations/customer-type \
     -H "Authorization: Bearer YOUR_MIGRATION_SECRET"
   ```

### Option 2: Vercel Postgres SQL Editor

1. Go to Vercel Dashboard → Your Project → Storage → Postgres
2. Click "SQL Editor" or "Query"
3. Run this SQL:
   ```sql
   ALTER TABLE "WholesaleCustomer" ADD COLUMN IF NOT EXISTS "customerType" TEXT DEFAULT 'wholesale';
   UPDATE "WholesaleCustomer" SET "customerType" = 'wholesale' WHERE "customerType" IS NULL;
   ```

### Option 3: Local Script (if you have production DB access)

```bash
DATABASE_URL="your-production-database-url" npx tsx src/app/scripts/run-customer-type-migration.ts
```

## Verification

After running the migration, verify it worked:

```sql
SELECT "customerType", COUNT(*) 
FROM "WholesaleCustomer" 
GROUP BY "customerType";
```

All customers should have `customerType = 'wholesale'`.
