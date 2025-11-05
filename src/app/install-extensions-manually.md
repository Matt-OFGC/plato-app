# Install Extensions Manually via Neon Dashboard

Since psql might not be available, you can install extensions through Neon's SQL Editor:

## Steps:

1. **Go to Neon Dashboard**
   - Open: https://console.neon.tech
   - Click on your **"Plato"** project
   - Click on the **"staging"** branch
   - Click **"SQL Editor"** in the left sidebar

2. **Run these SQL commands** (one at a time or all together):

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

3. **Verify they're installed:**

```sql
SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','citext','uuid-ossp');
```

You should see all three extensions listed.

4. **Then re-run the workflow:**

```bash
./scripts/execute-migration-workflow.sh
```

The script should now detect the extensions and proceed!


