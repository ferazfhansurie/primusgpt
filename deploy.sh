#!/bin/bash

# PRIMUS GPT - Quick Deployment Script
# This script helps deploy both web and API to Vercel

echo "🚀 PRIMUS GPT Deployment Helper"
echo "================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📦 Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Ask what to deploy
echo "What would you like to deploy?"
echo "1) Web App (primus-web)"
echo "2) API Server (trading-analyzer-api)"
echo "3) Both"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying Web App..."
        cd primus-web
        vercel --prod
        ;;
    2)
        echo ""
        echo "📦 Deploying API Server..."
        cd trading-analyzer-api
        vercel --prod
        ;;
    3)
        echo ""
        echo "📦 Deploying Web App..."
        cd primus-web
        vercel --prod
        
        echo ""
        echo "📦 Deploying API Server..."
        cd ../trading-analyzer-api
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Update VITE_API_URL in web app with your API URL"
echo "2. Set all environment variables in Vercel dashboard"
echo "3. Deploy Telegram bot to VPS/Railway/Render"
echo ""
echo "📖 Read VERCEL_DEPLOYMENT.md for detailed instructions"
