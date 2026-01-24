#!/bin/bash

echo "=========================================="
echo "   WAHALA UK - Stripe Setup Helper"
echo "=========================================="
echo ""
echo "Follow these steps:"
echo ""
echo "1. Go to: https://stripe.com"
echo "2. Click 'Sign up' (top right)"
echo "3. Create your account"
echo "4. After login, click 'Developers' in the top menu"
echo "5. Click 'API keys' on the left sidebar"
echo "6. You'll see TWO keys:"
echo ""
echo "   Publishable key: pk_test_... (Copy this)"
echo "   Secret key: Click 'Reveal test key' → sk_test_... (Copy this)"
echo ""
echo "=========================================="
echo ""
read -p "Do you have your Stripe keys ready? (yes/no): " READY

if [ "$READY" != "yes" ]; then
    echo ""
    echo "No problem! Get your keys from Stripe first, then run this script again:"
    echo "bash /app/add-stripe-keys.sh"
    exit 0
fi

echo ""
echo "Great! Let's add your keys..."
echo ""
read -p "Enter your PUBLISHABLE key (pk_test_...): " PUB_KEY
read -p "Enter your SECRET key (sk_test_...): " SECRET_KEY

echo ""
echo "Adding keys to your app..."

# Backup existing .env
cp /app/backend/.env /app/backend/.env.backup

# Check if keys already exist and update, otherwise append
if grep -q "STRIPE_SECRET_KEY" /app/backend/.env; then
    sed -i "s|STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=\"$SECRET_KEY\"|" /app/backend/.env
else
    echo "STRIPE_SECRET_KEY=\"$SECRET_KEY\"" >> /app/backend/.env
fi

if grep -q "STRIPE_PUBLISHABLE_KEY" /app/backend/.env; then
    sed -i "s|STRIPE_PUBLISHABLE_KEY=.*|STRIPE_PUBLISHABLE_KEY=\"$PUB_KEY\"|" /app/backend/.env
else
    echo "STRIPE_PUBLISHABLE_KEY=\"$PUB_KEY\"" >> /app/backend/.env
fi

echo ""
echo "✅ Keys added successfully!"
echo ""
echo "Now restarting backend..."
sudo supervisorctl restart backend

echo ""
echo "=========================================="
echo "   ✅ STRIPE IS NOW CONNECTED!"
echo "=========================================="
echo ""
echo "Your payment features are now live:"
echo "  • Instant chat unlock (£0.99)"
echo "  • Virtual roses (£0.10)"
echo "  • Premium subscriptions (£9.99/month or £89.99/year)"
echo "  • Donations (coming soon)"
echo "  • Affiliate subscriptions (coming soon)"
echo ""
echo "Test with card: 4242 4242 4242 4242"
echo ""
