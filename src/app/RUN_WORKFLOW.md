# Run Migration Workflow

The script is waiting for database credentials. Here's how to run it:

## Method 1: Set Environment Variables First (Recommended)

```bash
# Set credentials (use secrets manager or read -s)
export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"
export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"

# Then run the workflow
./scripts/execute-migration-workflow.sh
```

## Method 2: Let Script Prompt (Interactive)

```bash
# Run script - it will prompt for credentials
./scripts/execute-migration-workflow.sh

# When prompted, paste your credentials:
# Enter PROD_DATABASE_URL (use read -s for password):
# [paste your prod URL]
# Enter STAGING_DATABASE_URL (use read -s for password):
# [paste your staging URL]
```

## Method 3: Manual Step-by-Step (More Control)

```bash
# Step 1: Set credentials
export PROD_DATABASE_URL="postgres://USER:PASS@PROD_HOST:5432/PROD_DB"
export STAGING_DATABASE_URL="postgres://USER:PASS@STAGING_HOST:5432/STAGING_DB"

# Step 2: Refresh staging
./scripts/refresh-staging-from-prod.sh

# Step 3: Check extensions
psql "$STAGING_DATABASE_URL" -c "SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');"

# Step 4: Run validation
./scripts/validate-migrations-staging.sh 2>&1 | tee staging_validation.log
EXIT_CODE=$?
echo "EXIT_CODE=$EXIT_CODE"

# Step 5: If EXIT_CODE=0, deploy
if [ $EXIT_CODE -eq 0 ]; then
  export STAGING_VALIDATION_PASSED=true
  ./scripts/deploy-migrations-production.sh 2>&1 | tee prod_deploy.log
fi
```

## Security Note

**DO NOT paste credentials into chat or commit them to git.**

Use:
- Secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Environment variables from secure storage
- `read -s` for interactive input (hides password)

## Current Status

The script is waiting for `PROD_DATABASE_URL` and `STAGING_DATABASE_URL`.

Set these environment variables, then re-run:
```bash
./scripts/execute-migration-workflow.sh
```


