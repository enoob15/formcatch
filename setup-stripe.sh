#!/bin/bash

echo "=== FormCatch Stripe Key Setup ==="
echo ""

# Function to read secret input (hidden)
read_secret() {
    echo -n "$1: "
    read -s secret_input
    echo ""
}

echo "Enter your Stripe keys (input will be hidden for security):"
echo ""

# Read secret key
read_secret "Stripe Secret Key (sk_test_...)"
STRIPE_SECRET_KEY="$secret_input"

# Read publishable key (this one is safe to show)
echo -n "Stripe Publishable Key (pk_test_...): "
read STRIPE_PUBLISHABLE_KEY

echo ""
echo "Writing keys to .env.local..."

# Create .env.local file
cat > .env.local << EOF
# Stripe Configuration
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
EOF

echo "✅ Keys saved to .env.local"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Add to Vercel: vercel env add STRIPE_SECRET_KEY"
echo "3. Redeploy: vercel --prod"
echo ""
echo "🔒 Your secret key was entered securely (not visible in terminal history)"