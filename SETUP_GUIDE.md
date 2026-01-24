# 🚀 WAHALA UK - Quick Setup Guide

## ✅ What's Already Done

Your WAHALA UK dating app is **fully built and running**! Here's what you have:

### Frontend ✨
- ✅ User Registration & Login
- ✅ Profile Setup (3-10 photos)
- ✅ Swipe-based Discover screen
- ✅ Matches list with chat unlock
- ✅ Real-time chat with snap videos
- ✅ Rose leaderboard
- ✅ Premium subscription page
- ✅ User profile management

### Backend 🔧
- ✅ FastAPI server running on port 8001
- ✅ MongoDB database configured
- ✅ JWT authentication
- ✅ All API endpoints working
- ✅ Stripe integration ready (needs your keys)

### Features 🎯
- ✅ Swipe matching system
- ✅ 1-hour chat wait OR £0.99 instant unlock
- ✅ 7-second snap videos
- ✅ Virtual roses (£0.10 each)
- ✅ Rose leaderboard
- ✅ Premium subscriptions (£9.99/month, £89.99/year)
- ✅ Report functionality
- ✅ UK/US location verification
- ✅ Base64 image storage

## 🔑 **NEXT STEP: Add Stripe Keys (5 Minutes)**

To enable real payments, follow these steps:

### 1. Create Stripe Account
1. Go to: **https://stripe.com**
2. Click "Sign up" (top right)
3. Fill in your details
4. Verify your email

### 2. Get Your API Keys
1. After login, go to **Developers** (top menu)
2. Click **API keys** (left sidebar)
3. You'll see two keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: Click "Reveal test key" to see `sk_test_...`

### 3. Add Keys to Your App
1. Open the file: `/app/backend/.env`
2. Replace the empty quotes with your keys:
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```
3. Restart backend: `sudo supervisorctl restart backend`

**That's it!** Payments will now work in test mode. When ready for production, switch to live keys.

## 📱 How to Test Your App

### Option 1: Web Preview (Easiest)
- Open your Emergent preview URL in a browser
- Test all features directly in the browser
- Perfect for quick testing

### Option 2: Expo Go App (Real Device)
1. Download "Expo Go" app:
   - iOS: App Store
   - Android: Google Play
2. Open Expo Go
3. Scan the QR code shown in your Emergent dashboard
4. App will load on your phone!

### Option 3: Development Build
For production-ready testing with all native features.

## 🧪 Testing the App Flow

### 1. Create Two Test Accounts
Create two users to test the matching system:
- User 1: male, London, UK
- User 2: female, London, UK

### 2. Test Complete Flow
1. **Register** → **Login** → **Setup Profile** (add 3+ photos)
2. **Discover Tab** → Swipe right on profiles
3. **Matches Tab** → See matches appear
4. **Chat** → Test 1-hour wait or instant unlock
5. **Roses Tab** → View leaderboard
6. **Premium** → Test subscription flow
7. **Profile Tab** → View your profile

## 💳 Payment Testing

### Test Cards (Stripe Test Mode)

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Failed Payment (for testing errors):**
```
Card Number: 4000 0000 0000 0002
```

Test these payments:
- Instant chat unlock: £0.99
- Send a rose: £0.10
- Monthly premium: £9.99
- Yearly premium: £89.99

## 🐛 Troubleshooting

### "Can't connect to backend"
```bash
sudo supervisorctl restart backend
```

### "Images not loading"
Images are stored as base64 - check the photos array in MongoDB.

### "Stripe not working"
1. Check if keys are added to `/app/backend/.env`
2. Restart backend: `sudo supervisorctl restart backend`
3. Without keys, app runs in TEST MODE (simulated payments)

### "Chat not unlocking"
- Check if 1 hour has passed OR
- Use test mode (without Stripe keys) for instant unlock

## 📊 Database Access

Your MongoDB is running locally. To view data:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/wahala_uk

# View collections
show collections

# View users
db.users.find().pretty()

# View matches
db.matches.find().pretty()
```

## 🔐 Security Checklist (Before Launch)

- [ ] Change SECRET_KEY in `/app/backend/.env`
- [ ] Switch to Stripe live keys (not test keys)
- [ ] Enable HTTPS for production
- [ ] Set up proper MongoDB with authentication
- [ ] Add rate limiting to API
- [ ] Implement AI content moderation
- [ ] Set up backup system
- [ ] Add monitoring and logging
- [ ] Create privacy policy
- [ ] Create terms & conditions

## 🚀 Going to Production

### 1. Environment Variables
Update these in production:
```
SECRET_KEY=your-very-secure-random-key
STRIPE_SECRET_KEY=sk_live_... (not test!)
STRIPE_PUBLISHABLE_KEY=pk_live_... (not test!)
MONGO_URL=your-production-mongodb-url
```

### 2. Build Production App
```bash
cd /app/frontend
eas build --platform all
```

### 3. Deploy Backend
Deploy to:
- AWS EC2 / DigitalOcean
- Google Cloud Run
- Heroku
- Render

### 4. Configure Domain
Point wahalauk.com to your server.

## 📈 Feature Roadmap

### Phase 1 (Current) ✅
- Core dating functionality
- Chat system
- Payment integration
- Rose feature

### Phase 2 (Future)
- [ ] AI content moderation
- [ ] Push notifications
- [ ] Real-time WebSocket chat
- [ ] Video calls
- [ ] Advanced search filters
- [ ] Verified profiles
- [ ] Story features
- [ ] Voice messages

### Phase 3 (Growth)
- [ ] Referral program
- [ ] Events feature
- [ ] Group chats
- [ ] Live streaming
- [ ] Matchmaker mode

## 📞 Need Help?

### Quick Commands

**Restart Services:**
```bash
sudo supervisorctl restart expo    # Restart frontend
sudo supervisorctl restart backend # Restart backend
```

**View Logs:**
```bash
tail -f /var/log/supervisor/expo.out.log
tail -f /var/log/supervisor/backend.err.log
```

**Test Backend:**
```bash
curl http://localhost:8001/api/health
```

## 🎉 You're All Set!

Your WAHALA UK app is ready to use. The only thing you need to do is:

1. **Add Stripe keys** (5 minutes) - see instructions above
2. **Test the app** - create accounts and try all features
3. **Deploy when ready** - follow production checklist

Everything else is done! Enjoy building your dating empire! 💕

---

**Domain**: wahalauk.com
**App Name**: WAHALA UK
**Tagline**: Find Your Love

Made with ❤️ for the Black community
