# 🚀 Plato Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Set up Database
1. Go to [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both offer free PostgreSQL)
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:pass@host:port/db`)

### Step 2: Deploy to Vercel
1. Push your code to GitHub (if not already done)
2. Go to [Vercel](https://vercel.com) and sign up/login
3. Click "New Project" and import your GitHub repository
4. Add these environment variables in Vercel:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://plato-abc123.vercel.app`)
   - `NEXTAUTH_SECRET`: Generate a random string (use: `openssl rand -base64 32`)

### Step 3: Run Database Migrations
After deployment, run:
```bash
npx prisma migrate deploy
```

## Alternative: Deploy to Railway

### Step 1: Set up Railway
1. Go to [Railway](https://railway.app)
2. Create new project from GitHub
3. Add PostgreSQL database service
4. Railway will automatically set `DATABASE_URL`

### Step 2: Configure Environment
Add these environment variables:
- `NEXTAUTH_URL`: Your Railway domain
- `NEXTAUTH_SECRET`: Random string

## Manual Deployment Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations
npx prisma migrate deploy

# 4. Build the app
npm run build

# 5. Deploy to Vercel
npx vercel --prod
```

## Environment Variables Needed

```env
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secret-key"
```

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables set correctly
- [ ] App loads without errors
- [ ] User registration works
- [ ] Ingredient creation works
- [ ] Recipe creation works
- [ ] Cost calculations work correctly

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Update `NEXTAUTH_URL` to match your domain
5. Update DNS records as instructed

## Team Access

Once deployed, share the live URL with your team. They can:
- Create accounts and start testing
- Add ingredients and recipes
- Test the unit conversion features
- Provide feedback on the UI/UX

## Monitoring

- Vercel provides built-in analytics
- Check Vercel dashboard for deployment status
- Monitor database usage in your PostgreSQL provider
