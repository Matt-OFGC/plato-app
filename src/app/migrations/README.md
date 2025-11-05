# Database Migrations

This directory contains forward-only migrations with corresponding rollback scripts.

## Migration Strategy

- **Forward-only:** Migrations are designed to be applied sequentially
- **Idempotent:** All migrations use `IF NOT EXISTS` / `IF EXISTS` checks
- **Non-destructive:** Never drop columns without deprecation cycle
- **Rollback scripts:** Provided for emergency rollbacks (test thoroughly!)

## Migration Naming

Format: `YYYYMMDDHHMMSS_description.sql`

Example: `20250115120000_add_composite_unique_constraints.sql`

## Applying Migrations

### Prisma Migrations (Preferred)
```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_composite_unique_constraints

# Apply migrations in production
npx prisma migrate deploy
```

### Manual SQL Migrations (Emergency Only)
```bash
# Apply migration
psql $DATABASE_URL -f migrations/20250115120000_add_composite_unique_constraints.sql

# Rollback (if needed)
psql $DATABASE_URL -f migrations/rollbacks/20250115120000_add_composite_unique_constraints_rollback.sql
```

## Migration Order

1. **20250115120000_add_composite_unique_constraints.sql** - Add unique constraints
2. **20250115130000_add_missing_foreign_keys.sql** - Add missing FKs
3. **20250115140000_add_check_constraints.sql** - Add validation constraints
4. **20250115150000_add_performance_indexes.sql** - Add performance indexes
5. **20250115160000_fix_recipe_category_fields.sql** - Migrate category data

## Safety Checks

All migrations include:
- Pre-flight checks (verify current state)
- Idempotency (safe to run multiple times)
- Data validation (check for invalid data before applying constraints)
- Rollback scripts (for emergency recovery)

## Testing Migrations

```bash
# Test on local database first
npm run db:migrate:test

# Verify rollback works
npm run db:rollback:test
```

## Production Deployment

1. **Backup database first**
2. Test migration on staging
3. Apply migration during low-traffic window
4. Monitor for errors
5. Keep rollback script ready

---

**Never run destructive operations without backup!**


