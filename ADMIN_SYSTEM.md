# Admin System Documentation

## 🔐 Secure Admin Access

A completely separate admin authentication system has been created for secure site management.

## Login Credentials

- **Username:** `Plato328`
- **Password:** `Ilovecows123!`

## Access URLs

### Admin Login Page
- **URL:** `https://yourdomain.com/system-admin/auth`
- This is a secure, non-obvious URL that only you should know
- Features a dark themed security interface

### Admin Dashboard
- **URL:** `https://yourdomain.com/system-admin/dashboard`
- Automatically redirects to login if not authenticated
- Full access to all system management features

### Old Admin Page
- The old `/admin` page now redirects to the new secure system

## Features

### 1. **System Overview**
- Real-time statistics dashboard
- Total users, companies, recipes, and ingredients counts
- Quick action buttons for common tasks

### 2. **User Management**
- View all registered users
- Search users by email or name
- Activate/deactivate user accounts
- Grant/revoke admin privileges
- View subscription status and membership info
- Track last login dates

### 3. **Company Management**
- View all registered companies
- Search companies by name or business type
- See member counts, recipes, and ingredients per company
- Track company creation dates

### 4. **File Management**
- Upload and replace logo files
- Upload favicon
- Upload general images
- Automatic deployment to live site

### 5. **System Status**
- Database connection health monitoring
- System statistics
- Real-time status checks

## Security Features

✅ **Separate Authentication** - Completely independent from regular user logins
✅ **Session-based Auth** - Secure JWT tokens with 12-hour expiration
✅ **Non-obvious URL** - Hidden admin portal at `/system-admin/auth`
✅ **Activity Logging** - All login attempts are logged
✅ **Secure Cookies** - HTTP-only, secure cookies in production

## Environment Variables (✅ CONFIGURED)

**Admin security has been enhanced with environment variables!**

The following has been added to your `.env` and `.env.local` files:

```bash
# Admin Panel JWT Secret (secure random key)
ADMIN_JWT_SECRET="5b361b3e07d2a89f66a17f0b95c738942e6f07090b2153651283ef4d4cfec67d"
```

### Optional Additional Security

For even more security, you can add these to your `.env` file:

```bash
# Admin credentials (optional - defaults are set in code)
ADMIN_USERNAME=Plato328
ADMIN_PASSWORD_HASH=$2b$10$YourHashedPasswordHere
```

To generate a password hash, you can run this in Node.js:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('Ilovecows123!', 10);
console.log(hash);
```

### For Production Deployment

When deploying to production (Vercel, Railway, etc.), make sure to add these environment variables:

```bash
JWT_SECRET="your-production-jwt-secret"
ADMIN_JWT_SECRET="42640eba8eea6eb202850f28af5b4f59ecd75079c5c2bf25a4ebcf54423cb6f1"
```

A different secret has been generated for production in `.env.production` for reference.

## API Endpoints

All admin API endpoints require admin authentication:

- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/toggle` - Activate/deactivate user
- `POST /api/admin/users/toggle-admin` - Grant/revoke admin
- `GET /api/admin/companies` - List all companies
- `POST /api/admin/upload` - Upload files (logo, favicon, images)
- `GET /api/admin/status` - System health status

## Usage

1. Navigate to `https://yourdomain.com/system-admin/auth`
2. Enter username: `Plato328`
3. Enter password: `Ilovecows123!`
4. Access the full admin dashboard
5. Manage users, companies, and files
6. Monitor system health

## Important Notes

⚠️ **Keep the URL Secret** - The `/system-admin/auth` URL should only be known to authorized administrators
⚠️ **Strong Credentials** - Change the default password in production by updating the environment variables
⚠️ **Session Expiry** - Admin sessions expire after 12 hours for security
⚠️ **HTTPS Required** - Always access admin panel over HTTPS in production

## Session Management

- Admin sessions are completely separate from regular user sessions
- Sessions last 12 hours before requiring re-authentication
- Logout is available from the admin dashboard header
- Sessions are invalidated on logout

---

**Created:** October 2024
**System:** Plato Admin Portal v1.0

