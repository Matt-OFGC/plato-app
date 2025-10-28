# Local Development Setup Instructions

## Quick Start

### 1. Environment Setup

Create a `.env` file in your project root (`/Users/matt/plato/.env`) with the following content:

```env
# Database - Your Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_WGem2Fog0DwI@ep-lively-queen-ab2rgn0t-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Session & Security - Generate secure random strings
SESSION_SECRET="LbCGSE30D4NyRtxPqpgj1NeeFk4mjJKjEEfy+dQaWZ4="
JWT_SECRET="Smejp5jiYOJkAbflUHm8drA2z3GWJyCz0WmXOa5H7ik="
ADMIN_SESSION_SECRET="Kx9mN2pQ8vR5tY7uI3oP6aS1dF4gH9jL0zC2bV8nM5="

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Admin Access
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpassword"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Test Database Connection

```bash
npx prisma db pull
```

### 5. Run Development Server

```bash
npm run dev
```

## Troubleshooting

### Database Connection Issues

If you see "Database Connection Failed" errors:

1. **Check `.env` file exists**: Ensure `.env` is in the project root
2. **Verify DATABASE_URL**: Make sure it's correctly formatted
3. **Test connection**: Run `npx prisma db pull` to test
4. **Check network**: Ensure you can reach the Neon database

### Pages Loading But No Content

This was the main issue - pages show sidebar but no data because:

1. **Missing `.env` file** - Database queries fail silently
2. **No error handling** - Errors were swallowed, showing empty arrays
3. **No error boundaries** - Users saw blank pages instead of error messages

**Fixed by**:
- ✅ Created `.env` file with DATABASE_URL
- ✅ Added try-catch blocks around all database queries
- ✅ Added error boundaries for better error display
- ✅ Added database health check endpoint (`/api/health/db`)

### Development Diagnostics

The app now includes:

- **Database Health Check**: Visit `/api/health/db` to see connection status
- **Error Display Component**: Shows database status in development
- **Error Boundaries**: Catch and display errors gracefully
- **Console Logging**: Detailed error information in development mode

### Common Issues

#### 1. "Module not found" errors
```bash
npm install
npx prisma generate
```

#### 2. Database connection timeout
- Check your internet connection
- Verify Neon database is running
- Try regenerating connection string from Neon dashboard

#### 3. Authentication issues
- Clear browser cookies
- Check SESSION_SECRET is set
- Restart development server

#### 4. Prisma client errors
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Secret for session encryption |
| `JWT_SECRET` | ✅ | Secret for JWT tokens |
| `ADMIN_SESSION_SECRET` | ✅ | Secret for admin sessions |
| `NEXT_PUBLIC_APP_URL` | ✅ | App URL for redirects |
| `NODE_ENV` | ✅ | Environment (development/production) |
| `ADMIN_USERNAME` | ✅ | Admin panel username |
| `ADMIN_PASSWORD` | ✅ | Admin panel password |

## Database Schema

The app uses PostgreSQL with Prisma ORM. Key tables:

- `User` - User accounts and authentication
- `Company` - Business/organization data
- `Membership` - User-company relationships and roles
- `Recipe` - Recipe data and metadata
- `Ingredient` - Ingredient catalog
- `Category` - Recipe categorization

## Production Deployment

For production deployment:

1. Set environment variables in your hosting platform (Vercel/Railway/etc.)
2. Use production-grade secrets (generate new ones)
3. Set `NODE_ENV=production`
4. Update `NEXT_PUBLIC_APP_URL` to your domain

## Support

If you encounter issues:

1. Check the browser console for errors
2. Visit `/api/health/db` to check database status
3. Look for error messages in the terminal running `npm run dev`
4. Verify all environment variables are set correctly
