# Creating a Staging Branch in Neon

Neon has a great feature called "Branches" - it's like git branches but for your database! This is perfect for creating a staging environment.

## Steps to Create Staging Branch

### Step 1: Click "New Branch" Button
- Look at the top right of the Branches page
- You'll see a button that says **"New Branch 1/10"**
- Click that button

### Step 2: Configure the Branch
When you click "New Branch", you'll see options:
- **Branch name**: Enter something like `staging` or `staging-validation`
- **Parent branch**: Should default to `main` (your production branch)
- **Compute size**: Can leave as default
- Click **"Create Branch"**

### Step 3: Get the Connection String
After creating the branch:
1. Click on your new `staging` branch in the list
2. It will show you the connection details
3. Copy the `DATABASE_URL` connection string
   - It will look like: `postgresql://neondb_owner:password@ep-xxxx-staging-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`

### Step 4: Set It Up
Once you have the staging connection string:

```bash
# Set your production URL (from main branch)
export PROD_DATABASE_URL="postgresql://neondb_owner:npg_mXqCKBWa9zg5@ep-autumn-breeze-abxaban3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Set your staging URL (from the new staging branch)
export STAGING_DATABASE_URL="postgresql://..." # The new staging branch connection string

# Then run the workflow
./scripts/execute-migration-workflow.sh
```

## Benefits of Neon Branches

- **Instant**: Creates a copy of your database instantly
- **Isolated**: Completely separate from production
- **Safe**: Test migrations without affecting production
- **Free**: Your plan allows 10 branches, you're using 1/10

## After Testing

Once migrations are validated on staging:
- Apply them to production (main branch)
- You can delete the staging branch if needed
- Or keep it for future testing


