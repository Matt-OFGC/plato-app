# GitHub OAuth Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"** (or "Register a new application")
3. Fill in the form:
   - **Application name**: `Plato` (or your app name)
   - **Homepage URL**: 
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Authorization callback URL**: 
     - Development: `http://localhost:3000/api/auth/oauth/github/callback`
     - Production: `https://yourdomain.com/api/auth/oauth/github/callback`
4. Click **"Register application"**

### Step 2: Get Credentials

After creating the app, you'll see:
- **Client ID** (public)
- **Client Secret** (click "Generate a new client secret" if needed)

### Step 3: Add to Environment Variables

Add these to your `.env.local` file:

```env
GITHUB_CLIENT_ID=your-client-id-here
GITHUB_CLIENT_SECRET=your-client-secret-here
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth/github/callback
```

### Step 4: Test

1. Restart your dev server: `npm run dev`
2. Visit: http://localhost:3000/login
3. Click "Continue with GitHub"
4. Authorize the app
5. You should be logged in!

## Production Setup

When deploying to production:

1. **Update GitHub OAuth App:**
   - Go back to your OAuth app settings
   - Update "Authorization callback URL" to: `https://yourdomain.com/api/auth/oauth/github/callback`

2. **Update Environment Variables:**
   ```env
   GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/oauth/github/callback
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

3. **Deploy and test!**

## Troubleshooting

**"Redirect URI mismatch" error?**
- Make sure the callback URL in GitHub matches exactly (including http/https)
- Check there are no trailing slashes
- Verify the URL is added to authorized redirect URIs

**OAuth button not showing?**
- Check `GITHUB_CLIENT_ID` is set in environment
- Restart your dev server after adding env vars
- Check browser console for errors

**"Invalid client" error?**
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- Make sure client secret was generated (not the old one)

