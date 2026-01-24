# WAHALA UK - Dating App for Black Professionals

## 📱 About the App

WAHALA UK is a premium dating app targeting Black men and women in the UK and US who are looking for serious relationships. Since COVID-19, dating has become challenging with remote work and fewer social gatherings. This app provides a platform for professionals ready to settle down and find meaningful connections.

## ✨ Key Features

### User Experience
- **Profile Creation**: 3-10 photos (base64 format), bio, interests, location
- **Swipe-Based Matching**: Like/pass on profiles, get notified of mutual matches
- **Smart Chat System**: 1-hour wait after matching OR pay £0.99 to unlock instantly
- **7-Second Snap Videos**: Send disappearing video messages (screenshot blocking attempted)
- **Virtual Roses**: Send roses (£0.10 each) to show extra interest
- **Rose Leaderboard**: See who's most popular in the community
- **Content Moderation**: Report button for manual review (no nudity policy)
- **UK/US Only**: Location-based access control

### Premium Features (£9.99/month or £89.99/year)
- Unlimited swipes
- See who liked you
- Priority in discovery
- Send unlimited messages
- 5 free roses per month
- Exclusive premium badge
- Advanced filters
- No ads

## 🛠 Tech Stack

### Frontend
- **Expo React Native** with TypeScript
- **Expo Router** for file-based navigation
- **Zustand** for state management
- **Axios** for API calls
- **AsyncStorage** for local data persistence

### Backend
- **FastAPI** (Python)
- **MongoDB** for database
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Stripe** for payments (integration ready)

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py          # FastAPI server with all routes
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables (add Stripe keys here)
│
├── frontend/
│   ├── app/
│   │   ├── (tabs)/       # Main app tabs (Discover, Matches, Roses, Profile)
│   │   ├── auth/         # Login & Registration
│   │   ├── profile/      # Profile setup
│   │   ├── chat/         # Chat screens
│   │   └── premium.tsx   # Premium subscription
│   ├── store/            # Zustand state management
│   ├── services/         # API service
│   └── app.json          # Expo configuration
```

## 🚀 Getting Started

### 1. Add Stripe API Keys (Important!)

To enable payments, you need to add your Stripe keys:

1. **Sign up at Stripe**: Go to https://stripe.com and create a free account
2. **Get your API keys**: 
   - Go to Developers → API keys
   - Copy the **Publishable key** (starts with `pk_test_...`)
   - Copy the **Secret key** (starts with `sk_test_...`)
3. **Add keys to backend**:
   - Open `/app/backend/.env`
   - Add your keys:
     ```
     STRIPE_SECRET_KEY=sk_test_your_key_here
     STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
     ```
4. **Restart backend**: `sudo supervisorctl restart backend`

**Note**: Without Stripe keys, the app works in TEST MODE where payments are simulated.

### 2. Test the App

The app is now running and accessible via:
- **Web Preview**: Check your Emergent preview URL
- **Expo Go App**: Scan the QR code with Expo Go app on your phone
- **Backend API**: http://localhost:8001

### 3. User Flow

1. **Registration**: 
   - Create account with email, password, age, location
   - Must be 18+, UK or US only
   
2. **Profile Setup**:
   - Upload 3-10 photos
   - Add bio and interests
   
3. **Discover**:
   - Swipe right to like, left to pass
   - Get matched when both users like each other
   
4. **Matches**:
   - View all your matches
   - Wait 1 hour OR pay £0.99 to chat instantly
   
5. **Chat**:
   - Send text messages
   - Send 7-second snap videos
   - Send roses to show extra interest
   
6. **Premium**:
   - Subscribe for exclusive features

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password

### Profile
- `GET /api/profile/me` - Get current user profile
- `PUT /api/profile/update` - Update profile info
- `POST /api/profile/upload-photos` - Upload profile photos

### Matching
- `GET /api/matches/potential` - Get users to swipe on
- `POST /api/matches/swipe` - Swipe left/right on a user
- `GET /api/matches/my-matches` - Get all matches

### Chat
- `POST /api/chat/unlock-instant` - Pay £0.99 to unlock chat
- `GET /api/chat/messages/:match_id` - Get messages for a match
- `POST /api/chat/send-message` - Send text or snap message

### Roses
- `POST /api/roses/send` - Send a rose (£0.10)
- `GET /api/roses/leaderboard` - Get rose leaderboard

### Premium
- `POST /api/premium/subscribe` - Subscribe to premium
- `GET /api/premium/status` - Check premium status

### Reports
- `POST /api/reports/create` - Report a user
- `GET /api/reports/list` - List all reports (admin)

## 💳 Payment Integration

The app supports three types of payments via Stripe:

1. **Instant Chat Unlock**: £0.99 one-time payment
2. **Virtual Roses**: £0.10 per rose
3. **Premium Subscription**: £9.99/month or £89.99/year

**Test Mode**: Without Stripe keys, payments are simulated and features unlock automatically for testing.

## 📝 Key Implementation Details

### Image Storage
- All images stored as **base64 strings** in MongoDB
- Profile photos: 3-10 required
- Snap videos: base64 encoded, expire after 24 hours

### Security Features
- Passwords hashed with bcrypt
- JWT tokens for authentication (30-day expiry)
- Protected routes require valid token
- No nudity policy enforced via manual moderation

### Match System
- Mutual likes create a match
- Chat locked for 1 hour after match
- Can pay £0.99 to unlock instantly
- Real-time message polling (3-second intervals)

### Premium System
- Monthly or yearly subscriptions
- Auto-renewal supported
- Stripe handles payment processing
- Premium status tracked with expiry date

## 🎨 Design Philosophy

- **Mobile-First**: Optimized for thumb-friendly navigation
- **Native Feel**: React Native components for smooth performance
- **Brand Colors**: 
  - Primary: #FF6B6B (Red/Pink)
  - Accent: #FFD700 (Gold for roses/premium)
  - Background: #F5F5F5 (Light gray)
  - Text: #333 (Dark gray)

## 📱 Device Permissions

The app requests the following permissions:

**iOS**:
- Photos: "Select photos for your profile"
- Camera: "Take photos and videos to share"
- Microphone: "Record audio for video messages"
- Location: "Show nearby matches"

**Android**:
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE
- RECORD_AUDIO
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION

## 🐛 Known Limitations

1. **Screenshot Blocking**: Not fully implemented (complex on mobile)
2. **Real-time Chat**: Currently uses polling, can be upgraded to WebSockets
3. **Video Snap Playback**: Simplified (expires after 24 hours vs. after viewing)
4. **AI Content Moderation**: Manual review only (can add AI service later)
5. **Social Login**: Prepared but not fully implemented
6. **Push Notifications**: Not yet implemented

## 🚀 Future Enhancements

1. **AI Nudity Detection**: Integrate Sightengine or AWS Rekognition
2. **Real-time Chat**: Upgrade to WebSocket/Socket.io
3. **Push Notifications**: Notify users of matches and messages
4. **Video Calls**: Add video/voice calling feature
5. **Advanced Filters**: Filter by age, distance, interests, etc.
6. **Verified Profiles**: Blue checkmark for verified users
7. **Icebreaker Questions**: Conversation starters
8. **Story Features**: 24-hour story posts

## 📞 Support

For issues or questions about WAHALA UK:
- Domain: wahalauk.com (configured)
- Email: support@wahalauk.com (setup required)

## 📄 License & Legal

- Ensure compliance with GDPR (UK/EU) and CCPA (US)
- Terms & Conditions required before launch
- Privacy Policy required before launch
- Age verification (18+) enforced

---

**Made with ❤️ for the Black community**

*WAHALA UK - Find Your Love*
