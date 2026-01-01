# Setting NEXT_PUBLIC_BASE_URL in Vercel

## Quick Steps

### Option 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click on your **plato** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** `https://www.getplato.uk`
   - **Environment:** Select **Production** (and optionally Preview/Development)
6. Click **Save**
7. **Important:** Redeploy your project for the change to take effect
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

### Option 2: Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Set the environment variable
vercel env add NEXT_PUBLIC_BASE_URL production

# When prompted, enter: https://www.getplato.uk

# Redeploy
vercel --prod
```

## Verify It's Set

After setting the variable and redeploying, you can verify it's working by:

1. Sending a test email (password reset or verification)
2. Checking that the email link points to `https://www.getplato.uk` instead of `localhost:3000`

## Note

The `NEXT_PUBLIC_` prefix is important - it makes the variable available to both server and client-side code in Next.js.



