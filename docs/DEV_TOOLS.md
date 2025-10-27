# Development Tools Documentation

## Overview

This document describes the backend development tools available for managing and working with the Plato database and application.

## Quick Start

### Prisma Studio

Launch a visual database browser to view and edit data:

```bash
npm run studio
```

Access at: `http://localhost:5555`

This opens an interactive GUI where you can:
- Browse all database tables
- View and edit records
- Search and filter data
- Create new records

### Database Seeding

Populate your database with realistic test data:

```bash
# Seed the database
npm run db:seed

# Reset database and reseed (DESTRUCTIVE)
npm run db:reset
```

The seed script creates:
- 10 users (including `admin@example.com` with password `password`)
- 5 companies
- 6 categories
- 6 shelf life options
- 4 storage options
- 10 suppliers
- 18 ingredients
- 5 recipes with recipe items

### Database Management Scripts

```bash
# Generate Prisma client
npm run db:migrate

# Check migration status
npm run db:status

# Analyze database
npm run db:analyze
```

## System Admin Dashboard

Access the admin dashboard at `/system-admin/dashboard` (requires system admin authentication).

### Features

#### Overview Tab
- System statistics (users, companies, recipes, ingredients)
- Quick action cards

#### Users Tab
- View all users
- Manage user accounts
- Edit user details
- Upgrade/downgrade subscriptions

#### Companies Tab
- View all companies
- Manage company information
- View company stats

#### Database Browser (NEW)
- Browse any database table
- Search and filter records
- Paginated viewing
- View table statistics

#### Activity Logs (NEW)
- View audit trail
- Filter by action type
- See user activity
- Track entity changes

#### System Status
- Environment info
- Database connection status
- System health checks

## Available npm Scripts

```json
{
  "studio": "prisma studio",           // Launch Prisma Studio
  "db:seed": "tsx prisma/seed.ts",     // Seed database
  "db:reset": "prisma migrate reset --force && npm run db:seed",  // Reset and reseed
  "db:migrate": "prisma migrate dev",  // Run migrations
  "db:status": "prisma migrate status" // Check migration status
}
```

## Development Workflow

### Starting Fresh

1. **Generate Prisma client** (already runs on install):
   ```bash
   npm install
   ```

2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Seed with test data**:
   ```bash
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Working with the Database

**View data visually:**
```bash
npm run studio
```

**View data in admin panel:**
1. Go to `/system-admin/dashboard`
2. Click "Database" tab
3. Select table from dropdown
4. Search and browse records

**Reset to clean state:**
```bash
npm run db:reset  # WARNING: Deletes all data
```

### Debugging

**Check database connection:**
- Visit `/system-admin/dashboard` → System Status tab

**View activity logs:**
- Visit `/system-admin/dashboard` → Activity Logs tab

**Query specific data:**
- Use Prisma Studio (`npm run studio`)
- Or use Database Browser in admin panel

## API Endpoints

### Database Browser API
```
GET /api/admin/db-browser?table=User&page=1&limit=20
```
Returns paginated data from specified table.

**Parameters:**
- `table`: Table name (User, Company, Recipe, etc.)
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20)

### Activity Logs API
```
GET /api/admin/activity-logs?page=1&limit=50
```
Returns paginated activity logs with user information.

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 50)

## Security

All admin endpoints are protected by:
- System admin authentication
- Admin session validation
- Environment checks (dev tools disabled in production)

The seed script:
- Only runs in development
- Uses test credentials
- Should never be run in production

## Troubleshooting

### Prisma Studio won't start
- Check `DATABASE_URL` in `.env`
- Verify database is running
- Run `npx prisma generate`

### Seed script fails
- Ensure database is migrated (`npm run db:migrate`)
- Check all required environment variables
- Verify database connection

### Admin dashboard not accessible
- Ensure you're logged in as system admin
- Check authentication credentials
- Verify session cookie

## Future Enhancements

Planned improvements:
- [ ] Data export to CSV/JSON
- [ ] Query console for custom SQL
- [ ] Database backup/restore
- [ ] Performance analytics
- [ ] Real-time data sync
- [ ] Bulk operations

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Studio Guide](https://www.prisma.io/studio)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
