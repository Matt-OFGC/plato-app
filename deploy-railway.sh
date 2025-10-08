#!/bin/bash

# Railway Deployment Script for Plato
echo "🚀 Deploying Plato to Railway..."

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (will open browser)
echo "🔐 Logging into Railway..."
railway login

# Initialize Railway project (if not already done)
echo "📦 Initializing Railway project..."
railway init

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://your-app-name.railway.app"
echo ""
echo "📋 Next steps:"
echo "1. Set up your database in Railway dashboard"
echo "2. Configure environment variables"
echo "3. Set up Google OAuth credentials"
echo "4. Run database migrations"

