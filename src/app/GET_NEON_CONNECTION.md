# Getting Your Neon Database Connection String

You're using **Neon** database (not Vercel Postgres). Here's how to get your connection string:

## Method 1: From Vercel Storage Page

1. **Click on "Plato"** (the Neon database entry)
2. Look for:
   - "Connection String"
   - "DATABASE_URL"
   - "Connection Details"
3. Copy the connection string

## Method 2: From Neon Dashboard

1. Go to: https://console.neon.tech
2. Log in (same account if linked)
3. Find your **"Plato"** project
4. Click on it
5. Go to **"Connection Details"** or **"Connection String"**
6. Copy the connection string

The connection string will look like:
```
postgres://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Method 3: Check Vercel Environment Variables

Even though it's Neon, Vercel might have auto-added it:

1. Go to: https://vercel.com/platos-projects-dd48080a/app/settings/environment-variables
2. Look for:
   - `DATABASE_URL`
   - `POSTGRES_URL`
   - `NEON_DATABASE_URL`
   - `POSTGRES_PRISMA_URL`

## Once You Have It

Set it in your terminal:

```bash
export DATABASE_URL="postgres://..."
export PROD_DATABASE_URL="$DATABASE_URL"

# For staging, you can:
# Option A: Use the same database (test in same DB - not recommended for prod)
# Option B: Create a separate Neon database for staging
export STAGING_DATABASE_URL="postgres://..." # Your staging DB URL

# Then run the workflow
./scripts/execute-migration-workflow.sh
```

## Quick Test

Test the connection:
```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

If that works, you have the correct connection string!


