# 🚀 Quick Deploy Guide for Plato

## Option 1: Deploy to Vercel (Recommended - 5 minutes)

### Step 1: Set up Database
1. Go to **[Neon.tech](https://neon.tech)** (free PostgreSQL)
2. Sign up and create a new project called "Plato"
3. Copy the connection string (looks like: `postgresql://user:pass@host:port/db`)

### Step 2: Deploy to Vercel
1. Go to **[Vercel.com](https://vercel.com)** and sign up
2. Click "New Project" → "Import Git Repository"
3. If you don't have GitHub repo yet:
   ```bash
   # Create GitHub repo and push
   gh repo create plato-app --public
   git remote add origin https://github.com/YOUR_USERNAME/plato-app.git
   git push -u origin main
   ```
4. Import your GitHub repo in Vercel
5. Add these environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your Neon connection string
   - `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://plato-abc123.vercel.app`)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

### Step 3: Run Database Migrations
After deployment, in Vercel dashboard:
1. Go to your project → "Functions" tab
2. Click "Create Function" → "Edge Function"
3. Add this code to run migrations:
```javascript
import { PrismaClient } from '@prisma/client'

export default async function handler(req, res) {
  const prisma = new PrismaClient()
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
  res.status(200).json({ message: 'Database ready' })
}
```

## Option 2: Deploy to Railway (Even Easier)

1. Go to **[Railway.app](https://railway.app)**
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your Plato repository
5. Railway will automatically:
   - Detect it's a Next.js app
   - Add PostgreSQL database
   - Set environment variables
   - Deploy your app

## Option 3: Manual Vercel CLI

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy
npx vercel --prod

# 3. Set environment variables
npx vercel env add DATABASE_URL
npx vercel env add NEXTAUTH_URL
npx vercel env add NEXTAUTH_SECRET

# 4. Redeploy with env vars
npx vercel --prod
```

## After Deployment

1. **Test the live site** - Make sure all pages load
2. **Create a test account** - Verify registration works
3. **Add test ingredients** - Verify database works
4. **Create test recipes** - Verify cost calculation works
5. **Share with your team** - Send them the live URL

## Team Access

Once deployed, your team can:
- Visit the live URL
- Create accounts and start testing
- Add ingredients and recipes
- Test unit conversions
- Provide feedback

## Monitoring

- **Vercel**: Built-in analytics and deployment logs
- **Neon**: Database usage and performance metrics
- **Railway**: Full-stack monitoring dashboard

## Cost

- **Vercel**: Free tier (perfect for testing)
- **Neon**: Free tier (512MB database)
- **Railway**: Free tier (500 hours/month)

## Need Help?

1. Check the deployment logs in your platform dashboard
2. Verify all environment variables are set correctly
3. Make sure database migrations ran successfully
4. Test each feature systematically

Your team will be able to access the live site within 10 minutes! 🎉
