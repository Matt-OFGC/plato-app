#!/bin/bash

echo "🚀 Plato Deployment Script"
echo "=========================="

# Check if user is logged into Vercel
if ! npx vercel whoami > /dev/null 2>&1; then
    echo "❌ Not logged into Vercel. Please run: npx vercel login"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Logged into Vercel"

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
npx vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up your database at https://neon.tech"
echo "2. Add environment variables in Vercel dashboard:"
echo "   - DATABASE_URL: Your PostgreSQL connection string"
echo "   - NEXTAUTH_URL: Your Vercel domain"
echo "   - NEXTAUTH_SECRET: Run 'openssl rand -base64 32' to generate"
echo "3. Run database migrations: npx prisma migrate deploy"
echo ""
echo "Your team can then access the live site!"
