#!/bin/bash
set -e

echo "🚂 Deploying to Railway..."

# Check for Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install: npm i -g @railway/cli"
    exit 1
fi

# Check current directory
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found. Please run from the server directory."
    exit 1
fi

echo "📦 Building project..."
npm run build

echo "🚀 Deploying to Railway..."
railway up --detach

# Get the deployment URL
echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📊 Check deployment status with: railway logs"
echo ""
echo "🔗 Get your deployment URL with: railway domain"
echo ""
echo "📝 Environment variables to set in Railway dashboard:"
echo "  - ADMIN_TOKEN (generate secure token)"
echo "  - JWT_SECRET (generate with: openssl rand -base64 32)"
echo "  - CORS_ORIGINS (your frontend domain)"
echo "  - UPLOADS_DIR=/data/uploads"
echo ""
echo "🗂️ Remember to add a volume mount at /data"
echo ""
echo "📱 For your frontend deployment, set:"
echo "  - VITE_API_URL=https://[your-railway-domain]"
echo "  - VITE_WS_URL=wss://[your-railway-domain]"
