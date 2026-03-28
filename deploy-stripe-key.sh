#!/bin/bash

# FormCatch Stripe Key Deployment Script
# This script securely deploys the Stripe secret key to FormCatch

set -e

echo "🔑 FormCatch Stripe Key Deployment"
echo "=================================="
echo

# Check if we have Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable not set"
    echo "💡 Run: export VERCEL_TOKEN=your_token"
    exit 1
fi

# Prompt for Stripe secret key
echo "Enter your Stripe secret key (starts with sk_):"
echo "⚠️  This will be deployed to production immediately"
read -s STRIPE_SECRET_KEY

# Validate the key format
if [[ ! $STRIPE_SECRET_KEY =~ ^sk_.* ]]; then
    echo "❌ Error: Invalid Stripe key format. Must start with 'sk_'"
    exit 1
fi

echo
echo "🚀 Deploying Stripe key to FormCatch..."

# Add environment variable to Vercel
echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production --force --token "$VERCEL_TOKEN"

# Update local .env.local
sed -i "s/STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY/" .env.local

echo "✅ Stripe key deployed successfully!"
echo
echo "📋 Summary:"
echo "  - Vercel environment variable: ✓ Set"
echo "  - Local .env.local: ✓ Updated"
echo "  - FormCatch revenue: ✓ ENABLED"
echo
echo "🌐 FormCatch is now ready to accept payments!"
echo "📍 Live URL: https://formcatch-one.vercel.app"
echo
echo "💰 Revenue tiers:"
echo "  - Free: 5 submissions/month"
echo "  - Pro ($5): 100 submissions/month"
echo "  - Team ($15): 1000 submissions/month"

# Trigger redeploy
echo "🔄 Triggering production deployment..."
vercel deploy --prod --token "$VERCEL_TOKEN" --yes

echo
echo "🎉 FormCatch is now fully revenue-enabled!"
echo "💡 Test the payment flow at: https://formcatch-one.vercel.app"