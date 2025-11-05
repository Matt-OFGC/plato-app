# How to Find Your Database Connection Strings

## Quick Check Commands

Run these in your terminal to find your database URLs:

```bash
# 1. Check current environment variables
env | grep -i database

# 2. Check .env files (if they exist)
cat .env* 2>/dev/null | grep -i database || echo "No .env files found"

# 3. Check Prisma configuration
grep -r "DATABASE_URL\|postgres" prisma/ 2>/dev/null || echo "No Prisma config found"

# 4. Run the finder script
./scripts/find-database-urls.sh
```

## Common Locations

### 1. Environment Variables
Check if they're already set:
```bash
echo $DATABASE_URL
echo $PROD_DATABASE_URL
echo $STAGING_DATABASE_URL
```

### 2. .env Files
Look for these files in your project root:
- `.env`
- `.env.local`
- `.env.production`
- `.env.staging`
- `.env.development`

Check parent directory too:
```bash
cat ../.env* 2>/dev/null | grep DATABASE
```

### 3. Cloud Provider Dashboards

#### **Heroku**
```bash
heroku config:get DATABASE_URL --app your-app-name
```

#### **Vercel**
1. Go to your project dashboard
2. Settings → Environment Variables
3. Look for `DATABASE_URL`, `POSTGRES_URL`, etc.

#### **Railway**
1. Go to your project
2. Variables tab
3. Look for database connection strings

#### **Supabase**
1. Go to your project dashboard
2. Settings → Database
3. Connection string is shown there

#### **AWS RDS**
1. AWS Console → RDS
2. Select your database instance
3. Check "Connectivity & security" tab
4. Look for endpoint URL

#### **Google Cloud SQL**
1. Google Cloud Console → SQL
2. Select your instance
3. Check "Overview" → "Connection name"

### 4. Docker/Compose
If you use Docker:
```bash
# Check docker-compose.yml
grep -A 5 "postgres\|database" docker-compose.yml 2>/dev/null

# Check running containers
docker ps | grep postgres
docker inspect <container_id> | grep -i url
```

### 5. CI/CD Secrets
- **GitHub Actions**: Repository → Settings → Secrets → Actions
- **GitLab CI**: CI/CD → Variables
- **CircleCI**: Project Settings → Environment Variables

### 6. Application Config Files
Check these files:
- `next.config.js` or `next.config.ts`
- `config/database.js`
- `lib/db.ts` or `lib/database.ts`
- `src/config.ts`

### 7. Ask Your Team
- Check team documentation/wiki
- Ask DevOps or backend engineers
- Check shared password managers (1Password, LastPass, etc.)
- Check Slack/Discord channels for database info

## Database URL Format

```
postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Example:**
```
postgres://myuser:mypass123@db.example.com:5432/mydatabase
```

## If You Only Have One Database URL

If you only find `DATABASE_URL` (not separate PROD/STAGING):

1. **For Staging**: Create a staging database from prod snapshot
   ```bash
   # Use the same URL but point to staging database
   export STAGING_DATABASE_URL="postgres://USER:PASS@HOST:5432/staging_db"
   ```

2. **For Production**: Use your main DATABASE_URL
   ```bash
   export PROD_DATABASE_URL="$DATABASE_URL"
   ```

## Still Can't Find It?

1. **Check your deployment platform** (Vercel, Heroku, etc.)
2. **Check your hosting provider's dashboard**
3. **Ask your team lead or DevOps**
4. **Check project documentation**
5. **Look for database connection info in README files**

## Test Your Connection

Once you have the URLs, test them:
```bash
# Test production
psql "$PROD_DATABASE_URL" -c "SELECT version();"

# Test staging
psql "$STAGING_DATABASE_URL" -c "SELECT version();"
```

If these commands work, you have the correct URLs!


