# 🚀 SUPER SIMPLE SETUP GUIDE

## 📱 How to View Your Website

**Look for "Preview" or "Web Preview" button in your Emergent interface and click it!**

Or ask Emergent support: "What is my preview URL?" - then open that URL in your browser.

The website is at the **root path** (just the main URL, not /api or anything).

---

## 💳 Add Stripe Keys (Super Easy!)

### Step 1: Get Stripe Account (5 minutes)
1. Open: **https://stripe.com**
2. Click **"Sign up"** (top right corner)
3. Enter your email and create password
4. Verify your email
5. Done! You're in!

### Step 2: Get Your API Keys
Once logged into Stripe:
1. Look at top menu → Click **"Developers"**
2. Left sidebar → Click **"API keys"**
3. You'll see a table with keys:

```
Publishable key:  pk_test_xxxxx  [Copy button]
Secret key:       •••••••••••••  [Reveal test key button]
```

4. Click **copy** next to Publishable key → Save it somewhere
5. Click **"Reveal test key"** next to Secret key → Copy it → Save it

You now have TWO keys that look like:
- `pk_test_51abc123...`
- `sk_test_51abc123...`

### Step 3: Add Keys to Your App

**Option A: Use the Helper Script (Easiest!)**
```bash
bash /app/add-stripe-keys.sh
```
Follow the prompts and paste your keys when asked!

**Option B: Manual Method**
```bash
# Open the environment file
nano /app/backend/.env

# Add these lines (replace with your actual keys):
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"

# Save: Ctrl+O, Enter, Ctrl+X

# Restart backend
sudo supervisorctl restart backend
```

**That's it!** ✅ Stripe is connected!

---

## 🧪 Test It Works

After adding keys, test with this card:
```
Card Number: 4242 4242 4242 4242
Expiry Date: 12/25 (any future date)
CVC: 123
ZIP: 12345
```

This is Stripe's test card - it will process successfully!

---

## ❓ Quick Troubleshooting

**"I can't find my preview URL"**
- Look for a "Preview" button in Emergent interface
- Or check Emergent dashboard for backend URL
- Ask Emergent: "Show me my preview URL"

**"Stripe won't let me sign up"**
- Check your email for verification link
- Try different browser if stuck
- Clear cookies and try again

**"Keys don't work"**
- Make sure you copied the FULL key (starts with pk_test_ or sk_test_)
- Check for extra spaces
- Make sure you restarted backend after adding keys

**"Where do I restart backend?"**
```bash
sudo supervisorctl restart backend
```

---

## ✅ What Happens After Setup

Once Stripe is connected, these features work automatically:
- 💬 Instant chat unlock (£0.99)
- 🌹 Virtual roses (£0.10 each)
- ⭐ Premium subscriptions (£9.99/month or £89.99/year)
- 🎁 Donations (coming next)
- 🔗 Affiliate subscriptions (coming next)

No additional setup needed!

---

## 🎉 You're Done!

Two things to do:
1. ✅ View your website (use Emergent preview URL)
2. ✅ Add Stripe keys (5 minutes at stripe.com)

Then you're ready to roll! 🚀
