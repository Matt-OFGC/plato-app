# Database Safety Guide

## ⚠️ CRITICAL: This guide prevents data loss in production

This document outlines the safeguards and procedures to prevent accidental data loss in your application.

## Current Safeguards

### 1. Production Environment Protection

The database reset command (`npm run db:reset`) is **PROTECTED** in production:

- **Development**: Resets are allowed but require `--force` flag
- **Production**: Database resets are **BLOCKED** and will exit with error

### 2. Safety Script

A safety check script (`scripts/db-reset-safety.js`) prevents accidental resets:

```bash
# This will ALWAYS fail in production
npm run db:reset
```

### 3. Environment Detection

The system checks `NODE_ENV`:
- `development` or not set = Development mode
- `production` = Production mode (protected)

## How Data Loss Can Occur

### ✅ SAFE Operations (No data loss)
- `npm run db:migrate` - Runs migrations
- `npm run db:status` - Checks migration status
- `npm run db:backup` - Creates database backup

### ⚠️ DANGEROUS Operations (Can cause data loss)
- `npm run db:reset` - **DELETES ALL DATA** and rebuilds database
- `npm run dev:clean` - Includes `db:reset`, **DELETES ALL DATA**

## Recommended Workflow

### Daily Development

```bash
# Start dev server (safe)
npm run dev

# Run migrations (safe)
npm run db:migrate

# Check status (safe)
npm run db:status
```

### When You Need Fresh Data

```bash
# ⚠️ ONLY IN DEVELOPMENT
# 1. Make sure NODE_ENV is not 'production'
# 2. Backup first (optional but recommended)
npm run db:backup

# 3. Reset with force flag
npm run db:reset -- --force
```

### Production Deployment

**NEVER** run these in production:
- ❌ `npm run db:reset`
- ❌ `npm run dev:clean`
- ❌ Any command with `--force` flag

**ALWAYS** run these in production:
- ✅ `npm run db:migrate` (to apply schema changes)
- ✅ `npm run build` (to build the application)

## Backup Before Major Operations

Always backup before:
- Schema migrations
- Data migrations
- Database resets
- Deployments to production

```bash
# Create a backup
npm run db:backup
```

## Recovery Procedures

### If You Accidentally Reset Production

1. **Stop all operations immediately**
2. Contact your database administrator
3. Restore from the most recent backup
4. Notify affected users
5. Document the incident

## Additional Safety Measures

### 1. Database Backup Schedule

Set up automated backups for production:
- Daily backups at minimum
- Weekly and monthly retention policies
- Test restores regularly

### 2. Read-Only Mode for Production

Consider implementing:
- Read-only connections for analytics/reporting
- Write protection for critical tables
- Audit logging for all data changes

### 3. Environment-Specific Commands

```bash
# Development (safe to reset)
NODE_ENV=development npm run db:reset -- --force

# Production (blocked)
NODE_ENV=production npm run db:reset -- --force
# → Will exit with error
```

## Contact & Support

If you encounter any issues:
1. Check this guide first
2. Review the error messages carefully
3. Contact the development team
4. Do not proceed if uncertain

---

**Last Updated**: October 2024
**Next Review**: Monthly

