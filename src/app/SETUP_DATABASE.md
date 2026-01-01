# Database Setup Instructions

## Problem
The database tables don't exist, causing registration to fail with:
```
The table `public.User` does not exist in the current database.
```

## Solution: Run Database Setup

You have two options:

### Option 1: Using Prisma DB Push (Recommended for Fresh Database)

This will create all tables from your Prisma schema:

```bash
cd /Users/matt/plato/src/app
npx prisma db push --accept-data-loss
npx prisma generate
```

### Option 2: Using Prisma Migrate Deploy (For Production)

If you have migration files:

```bash
cd /Users/matt/plato/src/app
npx prisma migrate deploy
npx prisma generate
```

### Option 3: Run Setup Script

```bash
cd /Users/matt/plato/src/app
npx tsx scripts/setup-database.ts
```

## For Vercel Production

Since you're using Vercel, you need to run this in your production environment. You can:

1. **Add a build command** that runs migrations:
   - In Vercel dashboard → Project Settings → Build & Development Settings
   - Add to "Build Command": `prisma generate && prisma db push --accept-data-loss && next build`

2. **Or run manually via Vercel CLI**:
   ```bash
   vercel env pull .env.production
   npx prisma db push --accept-data-loss
   npx prisma generate
   ```

3. **Or use Vercel's Postinstall script** (add to package.json):
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "db:push": "prisma db push --accept-data-loss"
     }
   }
   ```

## Verify Setup

After running, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see tables like: `User`, `Company`, `Membership`, `Recipe`, `Ingredient`, etc.

## Important Notes

- `--accept-data-loss` is needed because we're recreating the database
- Make sure `DATABASE_URL` environment variable is set correctly
- After setup, try registering again - it should work!



