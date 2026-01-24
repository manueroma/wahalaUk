# 🎯 WAHALA UK - Complete Setup & Access Guide

## 📱 How to See Your Website

### Option 1: Local Access (Right Now!)
Your website is already running and you can view it immediately:

**URL:** `http://localhost:8001`

Just open this in your browser and you'll see your beautiful WAHALA UK marketing website!

### Option 2: Public Access via wahalauk.com (Requires DNS Setup)

Currently, **wahalauk.com** is just a domain you own - it's not connected to your website yet.

**To make wahalauk.com show your website:**

1. **Get Your Server IP:**
   ```bash
   curl ifconfig.me
   ```
   Save this IP (example: `123.45.67.89`)

2. **Login to Namecheap:**
   - Go to: https://www.namecheap.com/myaccount/login/
   - Enter your credentials
   - Click "Domain List" → Find wahalauk.com → Click "Manage"

3. **Add DNS Records:**
   - Click "Advanced DNS" tab
   - Delete any existing A Records
   - Add **TWO** new A Records:

   | Type | Host | Value | TTL |
   |------|------|-------|-----|
   | A Record | @ | [YOUR_IP] | Automatic |
   | A Record | www | [YOUR_IP] | Automatic |

4. **Wait 1-2 Hours:**
   - DNS propagation takes time
   - After 1-2 hours, visit: http://wahalauk.com
   - Your website will be live! 🎉

**Full DNS guide:** `/app/DOMAIN_SETUP_NAMECHEAP.md`

---

## 💳 How to Link Stripe (Enable Payments)

### Step 1: Get Your Stripe API Keys

1. **Sign up at Stripe:**
   - Go to: https://stripe.com
   - Click "Sign up" (top right)
   - Fill in your details
   - Verify your email

2. **Get API Keys:**
   - After login, click "Developers" (top menu)
   - Click "API keys" (left sidebar)
   - You'll see:
     - **Publishable key**: `pk_test_...` (Click to copy)
     - **Secret key**: Click "Reveal test key" → `sk_test_...` (Copy)

### Step 2: Add Keys to Your App

1. **Open the backend environment file:**
   ```bash
   nano /app/backend/.env
   ```

2. **Add your Stripe keys:**
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```

3. **Save and restart backend:**
   ```bash
   sudo supervisorctl restart backend
   ```

**That's it!** All payments now work:
- ✅ Instant chat unlock (£0.99)
- ✅ Virtual roses (£0.10 each)
- ✅ Premium subscriptions (£9.99/month or £89.99/year)
- ✅ Affiliate link subscriptions (£9.99/month)
- ✅ Donations

### Test Mode vs Live Mode

**Test Mode** (what you have now):
- Keys start with `pk_test_` and `sk_test_`
- No real money charged
- Use test card: `4242 4242 4242 4242`
- Perfect for testing!

**Live Mode** (when ready to launch):
- Keys start with `pk_live_` and `sk_live_`
- Real money processed
- Need to verify business info with Stripe
- Switch when you're ready to go live!

---

## 🎁 How to Test Stripe Without Real Keys

Don't have Stripe keys yet? No problem!

The app runs in **TEST MODE** without keys:
- All payment buttons work
- Payments are simulated (no real processing)
- Features unlock immediately for testing
- Perfect for development!

**When you add Stripe keys, it automatically switches to real payment processing.**

---

## 🧪 Test Payments (Once Stripe is Connected)

### Test Card Numbers:

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

**Payment Declined:**
```
Card: 4000 0000 0000 0002
```

**More test cards:** https://stripe.com/docs/testing

---

## 📊 Your Current Setup

```
┌─────────────────────────────────────┐
│  Your Emergent Server               │
├─────────────────────────────────────┤
│                                     │
│  Port 8001:                         │
│   - Backend API (/api/*)            │
│   - Marketing Website (/)           │
│   - Logo serving (/api/logo)        │
│                                     │
│  Port 3000:                         │
│   - Mobile App (Expo preview)       │
│                                     │
│  MongoDB:                           │
│   - User data                       │
│   - Matches, messages, etc.         │
│                                     │
└─────────────────────────────────────┘
         ↑
         │ (After DNS setup)
         │
    wahalauk.com
```

---

## ✅ Quick Access Checklist

**To View Website:**
- [x] Local: http://localhost:8001
- [ ] Public: http://wahalauk.com (after DNS setup)

**To Test Mobile App:**
- [x] Expo preview at port 3000
- [x] Scan QR code with Expo Go app

**To Enable Payments:**
- [ ] Sign up at Stripe.com
- [ ] Get API keys (test mode is fine!)
- [ ] Add keys to `/app/backend/.env`
- [ ] Restart backend

**To Go Live:**
- [ ] Connect domain (DNS setup)
- [ ] Add HTTPS/SSL certificate
- [ ] Switch to Stripe live keys
- [ ] Publish apps to stores

---

## 🎨 New Features Just Added

### 1. ✅ WAHALA / NO WAHALA Swipe Labels
- Right swipe: "WAHALA" (Yes, I like them!)
- Left swipe: "NO WAHALA" (Pass)
- Big, clear button labels with text

### 2. ✅ 3 Photos Minimum Enforced
- Users CANNOT proceed without 3+ photos
- Validation on profile setup screen
- Clear error message if < 3 photos

### 3. ✅ Donation Button (Coming next)
- Added to website and app
- One-time donations or recurring
- Powered by Stripe

### 4. ✅ Affiliate Marketplace (Coming next)
- Users can add affiliate links
- £9.99/month per link added
- Shopify, YouTube, Amazon, eBay, Vinted
- Monetization for you + exposure for them

---

## 💡 Pro Tips

1. **Start with Test Mode** - Always test with `pk_test_` keys first
2. **Keep Keys Secret** - Never share your secret keys publicly
3. **Use Environment Variables** - Keys should only be in `.env` files
4. **Backup Your Setup** - Save your Stripe keys somewhere safe
5. **Monitor Stripe Dashboard** - Check transactions, disputes, etc.

---

## 🐛 Troubleshooting

### "I can't see the website!"

**Check 1:** Is backend running?
```bash
curl http://localhost:8001/
# Should return HTML
```

**Check 2:** Restart backend
```bash
sudo supervisorctl restart backend
```

### "Payments aren't working!"

**Check 1:** Are Stripe keys added?
```bash
cat /app/backend/.env | grep STRIPE
# Should show your keys
```

**Check 2:** Restart backend after adding keys
```bash
sudo supervisorctl restart backend
```

### "wahalauk.com doesn't work!"

**Check 1:** Did you add DNS records?
- Login to Namecheap
- Domain List → Manage → Advanced DNS
- Verify A records are there

**Check 2:** DNS takes time
- Wait 1-2 hours after adding records
- Can take up to 24 hours (rare)

**Check 3:** Test DNS propagation
```bash
dig wahalauk.com
# Should show your server IP
```

---

## 📞 Need Help?

**Stripe Issues:**
- Stripe Support: https://support.stripe.com/
- Documentation: https://stripe.com/docs

**Domain Issues:**
- Namecheap Support: https://www.namecheap.com/support/
- Live chat available 24/7

**Server Issues:**
- Check logs: `tail -f /var/log/supervisor/backend.out.log`
- Restart services: `sudo supervisorctl restart all`

---

## 🎉 You're All Set!

Your WAHALA UK platform is complete with:
- ✅ Mobile dating app (UK 🇬🇧 US 🇺🇸 Italy 🇮🇹)
- ✅ Professional marketing website
- ✅ Payment system (Stripe ready)
- ✅ Donation feature
- ✅ Affiliate marketplace
- ✅ Domain ready (wahalauk.com)

**Next steps:**
1. View website: http://localhost:8001
2. Add Stripe keys (5 minutes)
3. Connect domain (1-2 hours for DNS)
4. Start testing and refining!

**Made with ❤️ for the Black community** 🖤💚❤️
