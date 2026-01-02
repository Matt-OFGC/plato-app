# Troubleshooting Database Setup

## Problem
Registration still returns 500 error even after build completed.

## Check 1: Did `prisma db push` Run During Build?

1. **Go to Vercel Dashboard:**
   - Your Project → Deployments → Latest Deployment
   - Click on the deployment
   - Click "Build Logs" tab

2. **Look for these lines:**
   ```
   Running prisma generate...
   Running prisma db push...
   ```

3. **Check for errors:**
   - Look for any red error messages
   - Check if `prisma db push` completed successfully
   - Look for "The table does not exist" errors

## Check 2: Verify Tables Exist

### Option A: Check Vercel Logs (Runtime)
1. Vercel Dashboard → Your Project → Logs
2. Look for recent errors when registration is attempted
3. Check if you see "table does not exist" errors

### Option B: Run Check Script Locally
If you have DATABASE_URL:

```bash
# Get DATABASE_URL from Vercel
# Vercel Dashboard → Settings → Environment Variables

export DATABASE_URL="your-database-url"
npx tsx scripts/check-database-tables.ts
```

## Solution: Manual Database Setup

If tables don't exist, run this manually:

### Step 1: Get DATABASE_URL
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Copy `DATABASE_URL` value

### Step 2: Run Database Setup
```bash
export DATABASE_URL="your-database-url-from-vercel"
npx prisma db push --accept-data-loss
npx prisma generate
```

### Step 3: Verify
```bash
npx tsx scripts/check-database-tables.ts
```

You should see:
```
✅ User table exists
✅ Company table exists
✅ Recipe table exists
✅ Ingredient table exists
✅ Membership table exists
```

## Why This Might Happen

1. **`prisma db push` didn't run** - Check build logs
2. **DATABASE_URL not available during build** - Vercel might not expose it during build
3. **Build command failed silently** - Check for errors in build logs
4. **Database connection issue** - Check if DATABASE_URL is correct

## Quick Fix: Add to Postinstall

Instead of build command, add to `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "db:push": "prisma db push --accept-data-loss"
  }
}
```

Then manually run once:
```bash
# In Vercel, you can't run this automatically, so run it manually:
# Get DATABASE_URL from Vercel env vars, then:
export DATABASE_URL="..."
npx prisma db push --accept-data-loss
```

## Next Steps

1. **Check Vercel build logs** - See if `prisma db push` ran
2. **Check Vercel runtime logs** - See actual error when registering
3. **Run manual setup** - If build didn't create tables, run manually
4. **Test registration** - After tables are created, try again




