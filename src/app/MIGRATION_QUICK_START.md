# Migration Workflow - Quick Start

## What This Does

This workflow safely tests database migrations on staging before applying them to production.

## The Simple Way

### Step 1: Set Your Database URLs

Open your terminal and run:

```bash
export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"
export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"
```

**Replace:**
- `USER` → Your database username
- `PASS` → Your database password  
- `PROD_HOST` → Your production database host
- `PROD_DB` → Your production database name
- `STAGING_HOST` → Your staging database host
- `STAGING_DB` → Your staging database name

**⚠️ NEVER paste credentials in chat - only in your terminal**

### Step 2: Run the Helper Script

```bash
cd /Users/matt/plato/src/app
./scripts/run-migration-helper.sh
```

The helper will:
- ✅ Check if URLs are set
- ✅ Guide you through setting them if needed
- ✅ Run the full migration workflow
- ✅ Show you the results

### Step 3: Review Results

**If it passes (EXIT_CODE=0):**
- ✅ All checks passed
- ✅ Safe to deploy to production
- The script will ask if you want to deploy

**If it fails (EXIT_CODE≠0):**
- ❌ Don't deploy!
- ❌ Fix issues first
- Check `staging_validation.log` for details

## What the Workflow Does

1. **Refreshes staging** from production (if needed)
2. **Checks extensions** (pg_trgm, citext, uuid-ossp)
3. **Installs missing extensions** if needed
4. **Runs validation** (applies migrations, runs tests)
5. **Shows results** (pass or fail)
6. **If PASS** → Option to deploy to production
7. **If FAIL** → Shows what needs fixing

## Alternative: Direct Run

If you prefer to run it directly:

```bash
cd /Users/matt/plato/src/app
./scripts/execute-migration-workflow.sh
```

## Troubleshooting

### "Environment variables not set"
- Make sure you exported PROD_DATABASE_URL and STAGING_DATABASE_URL
- Run `echo $PROD_DATABASE_URL` to check

### "Script not found"
- Make sure you're in `/Users/matt/plato/src/app`
- Check that scripts exist: `ls scripts/`

### "Permission denied"
- Make scripts executable: `chmod +x scripts/*.sh`

### "Extensions missing"
- The script will offer to install them
- Say "yes" when prompted

## After Running

### If PASSED:
- Review `staging_validation.log`
- Check performance differences
- Deploy when ready

### If FAILED:
- Check `staging_validation.log` for errors
- Fix issues in your code
- Re-run the workflow

## Need Help?

The workflow script will guide you through each step. Just follow the prompts!


