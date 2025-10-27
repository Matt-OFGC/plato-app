# Complete Development Tools Documentation

## Overview

This document covers all the development tools and utilities that have been implemented for managing and understanding your application.

## 🎯 Quick Access

### Prisma Studio
```bash
npm run studio
```
- Opens at `http://localhost:5555`
- Visual database browser
- View and edit records directly

### Database Seeding
```bash
npm run db:seed
```
- Populates database with realistic test data
- Safe to run multiple times (won't overwrite existing users)

### Reset Database
```bash
npm run db:reset
```
- WARNING: This will delete all data!
- Resets to fresh state and seeds with test data

## 📊 System Admin Dashboard

Access: `/system-admin/dashboard`

### Tabs Available

#### 1. Users Tab
Complete user management:
- **View all users** with search
- **Details panel** with expandable rows
- **Subscription management** - Upgrade/downgrade instantly
- **Password resets** - Send reset links
- **PIN management** - Reset team PIN codes
- **Company memberships** - View all companies user belongs to

#### 2. Companies Tab
- View all companies
- Company details and members
- Business information

#### 3. Database Tab
- Browse any table visually
- Search and filter records
- Paginated viewing

#### 4. Analytics Tab ✨ **NEW!**
**Key Metrics:**
- Total users and active users
- Companies and active companies
- Total recipes created
- Engagement score (0-100)

**Charts:**
- User signups over time (30 days)
- Daily login activity (7 days)
- Subscription tier distribution
- Business type distribution

**Insights:**
- Top 10 most active companies
- Feature usage statistics
- Recent activity feed (24 hours)

**Use Cases:**
- Track user growth trends
- Identify most valuable customers
- See which features get used most
- Monitor platform health

#### 5. Activity Logs Tab
- Complete audit trail
- Color-coded by action type
- Search and filter
- Paginated viewing

#### 6. Files Tab
- Upload and manage files
- Storage management

#### 7. System Tab
- System configuration
- Environment settings

## 🔧 Development Scripts

All scripts are defined in `package.json`:

### Database Scripts
```bash
# Prisma Studio - Visual database browser
npm run studio

# Seed database with test data
npm run db:seed

# Reset database (deletes all data!)
npm run db:reset

# Run migrations
npm run db:migrate

# Check migration status
npm run db:status
```

### Documentation
```bash
# View development guide
cat docs/DEV_TOOLS.md

# View admin features guide
cat docs/ADMIN_FEATURES_SUMMARY.md

# View this complete guide
cat docs/DEV_TOOLS_COMPLETE.md
```

## 📡 API Endpoints

### Admin Endpoints

#### Users
```
GET  /api/admin/users?includeMemberships=true
POST /api/admin/users/toggle
POST /api/admin/users/toggle-admin
POST /api/admin/users/upgrade-subscription
POST /api/admin/team/update-pin
```

#### Analytics
```
GET /api/admin/analytics
```
Returns comprehensive usage statistics including:
- Overview metrics
- Users by subscription tier
- Signups and logins over time
- Top companies
- Feature usage
- Business types
- Countries
- Recent activity

#### Database Browser
```
GET /api/admin/db-browser?table=User&page=1&limit=50
```

#### Activity Logs
```
GET /api/admin/activity-logs?page=1&limit=50
```

### System Endpoints

#### Health Check
```
GET /api/health
```
Returns system health status including:
- Database connection status
- Environment configuration
- Timestamp

Example response:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "healthy",
  "checks": {
    "database": true,
    "environment": true
  }
}
```

## 🛠️ Utility Libraries

### Logger (`src/lib/dev-tools/logger.ts`)

Structured logging utility:

```typescript
import { logger } from "@/lib/dev-tools/logger";

// Basic logging
logger.info("User created", { userId: 123 });
logger.warn("Deprecated endpoint used", { path: "/api/old" });
logger.error("Failed to process", error);
logger.debug("Debug info", { data });

// Performance tracking
const result = await logger.track("fetchUsers", async () => {
  return await prisma.user.findMany();
});

// API request logging
logger.logRequest("GET", "/api/users", 200, 45);
```

### Database Utils (`src/lib/dev-tools/db-utils.ts`)

Database utility functions:

```typescript
import { 
  getDatabaseStats, 
  checkDatabaseHealth, 
  getTableSizes 
} from "@/lib/dev-tools/db-utils";

// Get statistics
const stats = await getDatabaseStats();
// Returns: { users, companies, recipes, ingredients, activityLogs }

// Check health
const health = await checkDatabaseHealth();
// Returns: { healthy: true/false, message: string }

// Get table sizes (PostgreSQL)
const sizes = await getTableSizes();
// Returns: Array of { table_name, size }
```

## 🔍 Analytics Use Cases

### Understanding User Engagement

1. Go to Analytics tab
2. Check "Engagement Score" - Higher is better
3. Review "Feature Usage" to see what gets used most
4. Look at "Top Companies" to identify power users

### Tracking Growth

1. Open "User Signups (30 days)" chart
2. See the trend - is it growing?
3. Check "Daily Logins" to see active usage
4. Compare "Subscription Tiers" to understand upgrade patterns

### Feature Adoption

1. Scroll to "Feature Usage" section
2. See which actions users perform most
3. Identify features that might need promotion
4. Use this data to prioritize development

### Customer Segmentation

1. Check "Business Types" to see customer mix
2. Review "Countries" to see geographic distribution
3. Look at "Subscription Tiers" for pricing insights

## 🚀 Best Practices

### When to Use Each Tool

**Prisma Studio** - Quick data inspection during development
- Viewing specific records
- Manually testing data
- Quick fixes

**Admin Dashboard** - Production management and support
- Customer support issues
- Account management
- System monitoring

**Analytics** - Making informed decisions
- Before product decisions
- Understanding user behavior
- Tracking growth

**Database Seeding** - Development environment
- Setting up local dev
- Testing with realistic data
- Demo preparation

### Security Considerations

- **Admin dashboard** requires system admin authentication
- **Database browser** is read-only
- **Analytics** aggregates data (no PII exposed in raw form)
- All actions are logged in Activity Logs

### Performance

- Analytics queries are optimized with parallel fetches
- Pagination on all list views
- Efficient database queries using Prisma
- Charts render on the client using Recharts

## 📝 Troubleshooting

### Analytics not showing data?
- Check that users have been active
- Verify database connection
- Check browser console for errors

### Database browser not loading?
- Ensure admin authentication
- Check API endpoint is working
- Verify database connection

### Seed script errors?
- Check Prisma is set up correctly
- Verify DATABASE_URL environment variable
- Run migrations first: `npm run db:migrate`

## 🎉 What's Been Completed

✅ Prisma Studio integration
✅ Database seeding system
✅ Admin User Manager with full account control
✅ Subscription management
✅ Password reset functionality
✅ PIN management for teams
✅ Database Browser component
✅ Activity Logs viewer
✅ **System Analytics Dashboard** - NEW!
✅ Health check endpoint
✅ Structured logging utility
✅ Database utility functions
✅ Comprehensive documentation

## 📚 Additional Resources

- `docs/DEV_TOOLS.md` - Development environment setup
- `docs/ADMIN_FEATURES_SUMMARY.md` - Admin features guide
- `package.json` - All available scripts
- `prisma/schema.prisma` - Database schema

## 🔄 Keeping It Updated

To keep analytics and logs accurate:
- Analytics data is fetched in real-time
- Activity logs are automatically created
- No manual maintenance needed

## 💡 Tips

- Check Analytics daily to understand your users
- Use Activity Logs to troubleshoot issues
- Database Browser is perfect for quick data checks
- Admin tools give you the control you need

---

Need help? Check the troubleshooting section or review the individual documentation files.
