# Google OAuth Setup Checklist

## ✅ Current Local Setup

Your local environment is correctly configured:
```
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/oauth/google/callback"
```

## 📋 Google Cloud Console Setup

You need to add **both** redirect URIs to your Google OAuth app:

### 1. Local Development ✅ (Add this)
```
http://localhost:3000/api/auth/oauth/google/callback
```

### 2. Production (Add your actual domain)
```
https://your-actual-domain.com/api/auth/oauth/google/callback
```

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, click **+ ADD URI**
5. Add both URLs above
6. Click **SAVE**

## 🔧 Production Environment Variables

Set these in your production hosting platform (Vercel, Railway, etc.):

```env
# Your production domain (replace with actual domain)
GOOGLE_REDIRECT_URI=https://your-actual-domain.com/api/auth/oauth/google/callback
NEXT_PUBLIC_BASE_URL=https://your-actual-domain.com

# Existing (keep these)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## ⚠️ Important Notes

- **Local:** Use `http://localhost:3000` (not https)
- **Production:** Use `https://yourdomain.com` (not http)
- **No trailing slashes** - the URL must end exactly with `/callback` not `/callback/`
- **Exact match required** - Google will reject if there's any difference

## 🧪 Testing

1. **Local:** `http://localhost:3000/login` - Click "Continue with Google"
2. **Production:** Visit your production login page - Click "Continue with Google"

## 🐛 Troubleshooting

**If you get "redirect_uri_mismatch" error:**
- Double-check the URL matches EXACTLY in Google Cloud Console
- Make sure you saved the changes in Google Cloud Console
- Restart your dev server after changing env vars
- For production, redeploy after updating environment variables

## 📝 Find Your Production Domain

Your site is likely deployed to:
- **Vercel:** Check your Vercel dashboard
- **Railway:** Check your Railway project settings
- **Other:** Check your hosting provider's dashboard

Once you know your domain, update:
1. Google Cloud Console (add redirect URI)
2. Production environment variables (add GOOGLE_REDIRECT_URI and NEXT_PUBLIC_BASE_URL)

