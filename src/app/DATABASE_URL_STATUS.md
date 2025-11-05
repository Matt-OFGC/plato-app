# Database URL Status Check

**Date:** $(date)

## ✅ Check Results

### Current Environment
- ❌ `DATABASE_URL` not set in environment
- ❌ `.env.local` file not found
- ❌ No other `.env` files found

### Vercel CLI
- ❌ Vercel CLI not installed

### Next Steps

## Option 1: Use Vercel CLI (Recommended)

Install and pull environment variables:

```bash
# Install Vercel CLI globally
npm install -g vercel

# OR use npx (no installation needed)
npx vercel env pull
```

**Note:** You'll need to authenticate with Vercel first. The CLI will guide you through login.

After running `vercel env pull`, it will create `.env.local` with your environment variables.

## Option 2: Get from Vercel Dashboard

1. Go to https://vercel.com
2. Log in to your account
3. Select your project
4. Go to **Settings** → **Environment Variables**
5. Find `DATABASE_URL` or `POSTGRES_URL`
6. Copy the value

Then set it manually:
```bash
export DATABASE_URL="postgres://..."
```

## Option 3: Check Other Locations

Based on the finder script, also check:

1. **Prisma config**: `prisma/.env` or `prisma/schema.prisma`
2. **Application config**: `next.config.js`, `lib/db.ts`
3. **Cloud provider**: AWS RDS, Heroku, Railway, Supabase dashboards
4. **CI/CD**: GitHub Secrets, GitLab Variables
5. **Team**: Ask DevOps/backend engineers or check shared password managers

## Once You Have DATABASE_URL

Test the connection:
```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

Then set both URLs:
```bash
export PROD_DATABASE_URL="$DATABASE_URL"
export STAGING_DATABASE_URL="postgres://..." # Create staging DB or use different name
```

Then run the workflow:
```bash
./scripts/execute-migration-workflow.sh
```


