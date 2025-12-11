# JWT Secret Setup Guide

## What is JWT_SECRET?

**JWT_SECRET** (or **SESSION_SECRET**) is a secret key used to:
- **Sign** user session tokens (like a signature to prove they're real)
- **Verify** that session tokens haven't been tampered with
- **Secure** user authentication

Think of it like a password for your app's security system.

## Why It's Important

Without a proper secret:
- ❌ Anyone could create fake session tokens
- ❌ Users could impersonate other users
- ❌ Your app's security would be compromised

## What Changed

**Before:** The app had a weak fallback secret (`'fallback-secret-change-in-production'`) that anyone could guess.

**Now:** The app requires a proper secret in production, which is much safer.

## How to Set It Up

### Option 1: Local Development (.env.local)

1. **Check if you have `.env.local` file:**
   ```bash
   ls -la .env.local
   ```

2. **If it exists, add this line:**
   ```bash
   JWT_SECRET=your-super-secret-random-string-here
   ```

3. **If it doesn't exist, create it:**
   ```bash
   echo "JWT_SECRET=your-super-secret-random-string-here" > .env.local
   ```

4. **Generate a secure random secret:**
   ```bash
   # On Mac/Linux:
   openssl rand -base64 32
   
   # Or use Node.js:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Option 2: Production (Vercel)

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com
   - Select your project
   - Go to Settings → Environment Variables

2. **Add Environment Variable:**
   - **Name:** `JWT_SECRET` (or `SESSION_SECRET` for backward compatibility)
   - **Value:** A long random string (use the generator above)
   - **Environment:** Production, Preview, Development (check all)

3. **Redeploy:**
   - After adding the variable, redeploy your app
   - Vercel will pick up the new environment variable

### Option 3: Other Hosting Providers

Add the environment variable in your hosting provider's dashboard:
- **Name:** `JWT_SECRET` or `SESSION_SECRET`
- **Value:** A secure random string (32+ characters)

## Quick Setup Script

Run this to generate and add to your `.env.local`:

```bash
# Generate a secure secret
SECRET=$(openssl rand -base64 32)

# Add to .env.local (or create it)
echo "JWT_SECRET=$SECRET" >> .env.local

# Show what was added (don't share this!)
echo "Added JWT_SECRET to .env.local"
```

## Verification

After setting it up, restart your dev server:

```bash
npm run dev
```

You should see:
- ✅ App starts normally (no errors)
- ✅ Login/logout works
- ✅ No warnings about missing JWT_SECRET

If you see an error about missing JWT_SECRET in production, that means you need to add it to your hosting provider's environment variables.

## Important Notes

1. **Never commit `.env.local` to Git** - It's already in `.gitignore`
2. **Use different secrets for dev/staging/production**
3. **Keep secrets secure** - Don't share them publicly
4. **If you lose the secret** - Users will need to log in again (sessions will be invalid)

## Backward Compatibility

The app accepts **either**:
- `JWT_SECRET` (preferred)
- `SESSION_SECRET` (for backward compatibility)

Both work the same way. Use whichever you prefer.

## Troubleshooting

**Error: "JWT_SECRET or SESSION_SECRET environment variable must be set"**
- ✅ Add `JWT_SECRET` to your `.env.local` (development)
- ✅ Add `JWT_SECRET` to your hosting provider (production)

**App works in dev but fails in production**
- ✅ Check that environment variable is set in production
- ✅ Make sure you redeployed after adding the variable

**Sessions not working after adding secret**
- ✅ This is normal - old sessions are invalid
- ✅ Users need to log in again
- ✅ New sessions will work correctly

---

**Status:** ✅ Safe to use - The app will tell you if the secret is missing, preventing security issues.
