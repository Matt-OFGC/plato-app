# Production Environment Variables Setup

## 🚀 For Railway Deployment

Since you're using Railway, follow these steps:

### Step 1: Get Your Production Domain

1. Go to [Railway Dashboard](https://railway.app/)
2. Select your **Plato** project
3. Click on your service/deployment
4. Look for **Settings** → **Networking** or check the **Domains** section
5. Your domain will look like: `your-app-name.up.railway.app` or a custom domain

**Write down your production domain:** `https://___________`

### Step 2: Add Environment Variables in Railway

1. In Railway, go to your project → **Variables** tab
2. Add these environment variables:

```env
GOOGLE_REDIRECT_URI=https://your-actual-domain.com/api/auth/oauth/google/callback
NEXT_PUBLIC_BASE_URL=https://your-actual-domain.com
```

**Replace `your-actual-domain.com` with your actual Railway domain**

### Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:

```
https://your-actual-domain.com/api/auth/oauth/google/callback
```

(Replace with your actual Railway domain)

### Step 4: Redeploy

After adding the environment variables in Railway, trigger a redeploy:
- Railway will auto-redeploy when you save environment variables, OR
- Push a commit to trigger deployment

## ✅ Quick Checklist

- [ ] Found my Railway domain: `https://___________`
- [ ] Added `GOOGLE_REDIRECT_URI` in Railway with my domain
- [ ] Added `NEXT_PUBLIC_BASE_URL` in Railway with my domain  
- [ ] Added redirect URI in Google Cloud Console
- [ ] Redeployed/Railway auto-redeployed

## 🔍 Find Your Domain Faster

Your Railway domain might be:
- `your-app-name.up.railway.app` (default)
- Or a custom domain you set up

Check your Railway dashboard for the exact URL!

---

## 🆘 If You Need Help Finding Your Domain

Run this after your next deploy and check the logs:
```bash
# In Railway, check the deployment logs for the URL
# Or check the "Networking" section of your service
```

