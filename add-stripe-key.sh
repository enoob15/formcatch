#!/bin/bash

echo "=== FormCatch Stripe Setup ==="
echo ""
echo "I'll create a template file for you to edit..."

cat > /root/Projects/formcatch/.env.local << 'EOF'
# FormCatch Stripe Configuration
# Edit this file and replace YOUR_SECRET_KEY with your actual key

STRIPE_SECRET_KEY=YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TFlJL1WhUTqrnmERzPc8FzfcYBebHTsJBBUvrSN5BQQ5wcsKUWSXshgDHl1nwTDMXh79X0KJMYBaNmXvWidzscw00EGMwJHIT
EOF

echo "✅ Created .env.local template"
echo ""
echo "Now edit the file to add your secret key:"
echo "nano /root/Projects/formcatch/.env.local"
echo ""
echo "Replace 'YOUR_SECRET_KEY_HERE' with your actual sk_test_ key"