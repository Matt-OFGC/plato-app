# Vercel Production Environment Variables Setup

## 🚀 Setting Up Google OAuth in Vercel

I can't directly access your Vercel dashboard, but here's exactly what you need to do:

### Step 1: Get Your Vercel Domain

Your production domain will be one of:
- `your-project-name.vercel.app` (default Vercel domain)
- Or your custom domain if you've configured one

**To find it:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Plato** project
3. Check the **Domains** section or look at your latest deployment URL

### Step 2: Add Environment Variables in Vercel

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings** → **Environment Variables**
3. Add these two variables:

**Variable 1:**
- **Key:** `GOOGLE_REDIRECT_URI`
- **Value:** `https://your-vercel-domain.vercel.app/api/auth/oauth/google/callback`
- **Environment:** Production (and Preview if you want)

**Variable 2:**
- **Key:** `NEXT_PUBLIC_BASE_URL`
- **Value:** `https://your-vercel-domain.vercel.app`
- **Environment:** Production (and Preview if you want)

**⚠️ Replace `your-vercel-domain.vercel.app` with your actual Vercel domain!**

### Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:

```
https://your-vercel-domain.vercel.app/api/auth/oauth/google/callback
```

### Step 4: Redeploy

After adding environment variables:
- Vercel will automatically redeploy, OR
- Go to **Deployments** tab and click **Redeploy** on the latest deployment

## ✅ Quick Checklist

- [ ] Found my Vercel domain: `https://___________`
- [ ] Added `GOOGLE_REDIRECT_URI` in Vercel
- [ ] Added `NEXT_PUBLIC_BASE_URL` in Vercel  
- [ ] Added redirect URI in Google Cloud Console
- [ ] Redeployed (auto or manual)

## 💡 Tips

- If you have multiple environments (Production, Preview, Development), you can set different values for each
- Your Vercel domain is usually: `project-name.vercel.app`
- If you have a custom domain, use that instead

