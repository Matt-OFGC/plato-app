# Authentication System Setup Guide

## ✅ Environment Variables Status

Your environment variables are configured! Here's what's set:

### Required Variables ✅
- ✅ `JWT_SECRET` - Set in .env.local
- ✅ `ADMIN_JWT_SECRET` - Set in .env.local
- ✅ `DATABASE_URL` - Configured

### OAuth Providers ✅
- ✅ `GOOGLE_CLIENT_ID` - Configured
- ✅ `GOOGLE_CLIENT_SECRET` - Configured
- ✅ `GOOGLE_REDIRECT_URI` - Set to localhost (update for production)

### Optional (but recommended)
- ✅ `RESEND_API_KEY` - Configured (for email sending)
- ✅ `EMAIL_FROM` - Set to "Plato <onboarding@plato.app>"
- ⚠️ `GITHUB_CLIENT_ID` - Not configured (optional)
- ⚠️ `GITHUB_CLIENT_SECRET` - Not configured (optional)

## 🔧 Setting Up GitHub OAuth (Optional)

If you want to enable GitHub login:

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Plato
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/oauth/github/callback`
4. Copy the Client ID and Client Secret
5. Add to `.env.local`:
   ```env
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

## 🧪 Testing Authentication Flows

### 1. Test Login Flow
```bash
# Start your dev server
npm run dev

# Visit: http://localhost:3000/login
# Try logging in with an existing account
```

### 2. Test OAuth Login
1. Visit: http://localhost:3000/login
2. Click "Continue with Google" button
3. Should redirect to Google and back

### 3. Test Password Reset
1. Visit: http://localhost:3000/reset-password
2. Enter your email
3. Check email for reset link (or console logs in dev mode)

### 4. Test Session Management
```bash
# After logging in, test session endpoint
curl http://localhost:3000/api/session

# Should return your user info
```

### 5. Test MFA Setup (if implemented)
```bash
# Setup TOTP
curl -X POST http://localhost:3000/api/auth/mfa/totp/setup \
  -H "Cookie: session=your-session-cookie"

# Verify TOTP
curl -X POST http://localhost:3000/api/auth/mfa/totp/verify \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "...", "token": "123456"}'
```

## 🔍 Manual Testing Checklist

- [ ] Login with email/password works
- [ ] Login with Google OAuth works (if configured)
- [ ] Login with GitHub OAuth works (if configured)
- [ ] Password reset email is sent
- [ ] Password reset link works
- [ ] Password change requires current password
- [ ] Sessions are created in database
- [ ] Session revocation works
- [ ] Rate limiting works (try 6+ failed logins)
- [ ] MFA setup works (if using)
- [ ] Security alerts are sent on password change

## 📝 Production Deployment Checklist

Before deploying to production:

1. **Update OAuth Redirect URIs**
   ```env
   GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/oauth/google/callback"
   GITHUB_REDIRECT_URI="https://yourdomain.com/api/auth/oauth/github/callback"
   NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
   ```

2. **Update Google OAuth Settings**
   - Go to Google Cloud Console
   - Add production callback URL to authorized redirect URIs

3. **Update GitHub OAuth Settings**
   - Go to GitHub OAuth App settings
   - Update Authorization callback URL

4. **Set Production Environment Variables**
   - Use strong, unique JWT secrets
   - Configure production email service (Resend/SendGrid)
   - Set secure cookie flags (already handled in code)

5. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

## 🚨 Security Notes

- ✅ JWT secrets are set and secure
- ✅ Passwords are hashed with bcrypt
- ✅ Sessions are database-backed (can be revoked)
- ✅ Rate limiting is enabled
- ✅ CSRF protection for OAuth flows
- ✅ Security alerts on suspicious activity

## 📚 API Documentation

See `AUTH_UPGRADE_COMPLETE.md` for full API endpoint documentation.

## 🐛 Troubleshooting

### OAuth not working?
- Check redirect URIs match exactly (including http/https)
- Verify OAuth app credentials are correct
- Check browser console for errors

### Sessions not persisting?
- Check cookies are being set (browser dev tools)
- Verify JWT_SECRET is set
- Check database Session table exists

### Password reset emails not sending?
- Check RESEND_API_KEY is set
- Verify EMAIL_FROM is configured
- Check console logs for email errors

### MFA not working?
- Verify otplib package is installed: `npm list otplib`
- Check MfaDevice table exists in database
- Verify QR code generation library (qrcode) is installed

