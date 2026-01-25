from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING
from bson import ObjectId
import os
import bcrypt
import jwt
import stripe
import base64
import random
import string
import hashlib

load_dotenv()

# Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
SECRET_KEY = os.getenv("SECRET_KEY", "wahala-uk-secret-key-change-in-production")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")

# Initialize Stripe
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# MongoDB setup
client = MongoClient(MONGO_URL)
db = client["wahala_uk"]
users_collection = db["users"]
matches_collection = db["matches"]
messages_collection = db["messages"]
transactions_collection = db["transactions"]
reports_collection = db["reports"]
roses_collection = db["roses"]
swipes_collection = db["swipes"]

# Create indexes
users_collection.create_index("email", unique=True)
matches_collection.create_index([("user1_id", 1), ("user2_id", 1)])
roses_collection.create_index("receiver_id")

# New collections for donations and affiliates
donations_collection = db["donations"]
affiliates_collection = db["affiliates"]
affiliate_subscriptions_collection = db["affiliate_subscriptions"]
otp_collection = db["otp_codes"]  # For 2FA
blocked_users_collection = db["blocked_users"]
user_settings_collection = db["user_settings"]
referrals_collection = db["referrals"]  # For referral tracking

# Create referral indexes
users_collection.create_index("referral_code", unique=True, sparse=True)
referrals_collection.create_index("referrer_id")
referrals_collection.create_index("referred_id", unique=True)

app = FastAPI(title="WAHALA UK API")
security = HTTPBearer()

# Mount website static files
app.mount("/static", StaticFiles(directory="/app/website"), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= MODELS =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int
    gender: str  # male, female, other
    location_city: str
    location_country: str  # UK, US or Italy
    bio: Optional[str] = ""
    interests: Optional[List[str]] = []
    height: Optional[str] = ""
    education: Optional[str] = ""
    job: Optional[str] = ""
    instagram: Optional[str] = ""
    looking_for: Optional[str] = "see_where_it_goes"  # fun, see_where_it_goes, marry
    referred_by_code: Optional[str] = None  # Referral code used during signup
    
    @validator('age')
    def age_must_be_valid(cls, v):
        if v < 18 or v > 100:
            raise ValueError('Age must be between 18 and 100')
        return v
    
    @validator('location_country')
    def country_must_be_valid(cls, v):
        if v not in ['UK', 'US', 'Italy']:
            raise ValueError('Only UK, US and Italy are supported')
        return v
    
    @validator('looking_for')
    def looking_for_must_be_valid(cls, v):
        if v and v not in ['fun', 'see_where_it_goes', 'marry']:
            raise ValueError('Invalid looking_for value')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    interests: Optional[List[str]] = None
    height: Optional[str] = None
    education: Optional[str] = None
    job: Optional[str] = None
    instagram: Optional[str] = None
    looking_for: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None

class PhotosUpdate(BaseModel):
    photos: List[str]  # base64 encoded photos
    
    @validator('photos')
    def validate_photos(cls, v):
        if len(v) < 3:
            raise ValueError('Minimum 3 photos required')
        if len(v) > 10:
            raise ValueError('Maximum 10 photos allowed')
        return v

class SwipeAction(BaseModel):
    target_user_id: str
    direction: str  # left (pass) or right (like)

class MessageSend(BaseModel):
    match_id: str
    content: str
    message_type: str = "text"  # text or snap

class RoseSend(BaseModel):
    receiver_id: str

class ReportCreate(BaseModel):
    reported_user_id: str
    reason: str

class PaymentIntent(BaseModel):
    payment_type: str  # instant_chat, rose, premium_monthly, premium_yearly
    match_id: Optional[str] = None
    receiver_id: Optional[str] = None

# ============= 2FA & SETTINGS MODELS =============

class TwoFactorSetup(BaseModel):
    """Enable/disable 2FA"""
    enable: bool

class TwoFactorVerify(BaseModel):
    """Verify 2FA code"""
    code: str
    email: Optional[EmailStr] = None  # For login verification

class UserSettings(BaseModel):
    """User settings/preferences"""
    notifications_matches: Optional[bool] = True
    notifications_messages: Optional[bool] = True
    notifications_roses: Optional[bool] = True
    notifications_promotions: Optional[bool] = False
    show_online_status: Optional[bool] = True
    show_read_receipts: Optional[bool] = True
    show_distance: Optional[bool] = True
    discovery_enabled: Optional[bool] = True
    age_min: Optional[int] = 18
    age_max: Optional[int] = 100
    distance_max: Optional[int] = 100  # km
    gender_preference: Optional[str] = "all"  # male, female, all

class BlockUserRequest(BaseModel):
    """Block a user"""
    user_id: str
    reason: Optional[str] = ""

class DeactivateAccount(BaseModel):
    """Deactivate account temporarily"""
    duration_days: Optional[int] = 30  # 0 = until manual reactivation

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = users_collection.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============= HELPER FUNCTIONS =============

def serialize_doc(doc):
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

def get_payment_amount(payment_type: str) -> int:
    """Returns amount in cents"""
    amounts = {
        "instant_chat": 99,  # £0.99
        "rose": 10,  # £0.10
        "premium_monthly": 999,  # £9.99
        "premium_yearly": 8999  # £89.99
    }
    return amounts.get(payment_type, 0)

# ============= 2FA HELPER FUNCTIONS =============

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP code"""
    return ''.join(random.choices(string.digits, k=length))

def hash_otp(otp: str) -> str:
    """Hash OTP for secure storage"""
    return hashlib.sha256(otp.encode()).hexdigest()

def verify_otp(otp: str, hashed: str) -> bool:
    """Verify OTP against hash"""
    return hash_otp(otp) == hashed

def get_default_settings() -> dict:
    """Get default user settings"""
    return {
        "notifications_matches": True,
        "notifications_messages": True,
        "notifications_roses": True,
        "notifications_promotions": False,
        "show_online_status": True,
        "show_read_receipts": True,
        "show_distance": True,
        "discovery_enabled": True,
        "age_min": 18,
        "age_max": 100,
        "distance_max": 100,
        "gender_preference": "all"
    }

def generate_referral_code(name: str) -> str:
    """Generate a unique referral code for a user"""
    # Clean name and take first part
    clean_name = ''.join(c for c in name.upper() if c.isalpha())[:6]
    if len(clean_name) < 3:
        clean_name = "WAHALA"
    
    # Add random alphanumeric suffix
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    code = f"WAHALA-{clean_name}{suffix}"
    
    # Ensure uniqueness
    while users_collection.find_one({"referral_code": code}):
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        code = f"WAHALA-{clean_name}{suffix}"
    
    return code

def check_referral_abuse(referrer_id: str, ip_address: str = None) -> dict:
    """Check if referral might be abusive"""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    
    # Count referrals this week
    weekly_count = referrals_collection.count_documents({
        "referrer_id": referrer_id,
        "created_at": {"$gte": week_ago}
    })
    
    # Count lifetime referrals
    lifetime_count = referrals_collection.count_documents({
        "referrer_id": referrer_id
    })
    
    # Check for same IP abuse (if provided)
    same_ip_count = 0
    if ip_address:
        same_ip_count = referrals_collection.count_documents({
            "referrer_id": referrer_id,
            "referred_ip": ip_address,
            "created_at": {"$gte": week_ago}
        })
    
    return {
        "weekly_count": weekly_count,
        "lifetime_count": lifetime_count,
        "same_ip_count": same_ip_count,
        "weekly_limit_reached": weekly_count >= 20,
        "lifetime_limit_reached": lifetime_count >= 500,
        "suspicious_ip": same_ip_count >= 3
    }

# ============= ROUTES =============

@app.get("/test")
async def test_page():
    """Simple test page"""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>WAHALA UK Test</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
            }
            h1 { color: #FF6B6B; font-size: 48px; }
            p { font-size: 20px; color: #333; }
            .success { color: #4CAF50; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>🎉 WAHALA UK Website is Working!</h1>
        <p class="success">✅ Backend is running correctly!</p>
        <p>Your marketing website is ready at the root URL (/).</p>
        <p>If you see this page, everything is working!</p>
        <hr>
        <p><a href="/" style="color: #FF6B6B; font-size: 24px;">→ View Full Website</a></p>
    </body>
    </html>
    """)

@app.get("/")
async def root():
    """Serve the marketing website"""
    return FileResponse(
        "/app/website/index.html",
        media_type="text/html",
        headers={
            "Cache-Control": "no-cache",
            "Content-Type": "text/html; charset=utf-8"
        }
    )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "WAHALA UK", "version": "1.0.0"}

# ============= AUTH ROUTES =============

@app.post("/api/auth/register")
async def register(user_data: UserRegister, request: Request = None):
    # Check if user exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique referral code for new user
    referral_code = generate_referral_code(user_data.name)
    
    # Check if referred by someone
    referred_by_user = None
    if user_data.referred_by_code:
        referred_by_user = users_collection.find_one({"referral_code": user_data.referred_by_code})
    
    # Create user
    user_doc = {
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "age": user_data.age,
        "gender": user_data.gender,
        "location_city": user_data.location_city,
        "location_country": user_data.location_country,
        "height": user_data.height,
        "instagram": user_data.instagram,
        "looking_for": user_data.looking_for,
        "photos": [],
        "premium_status": "free",
        "is_premium": False,
        "premium_expiry": None,
        "roses_received": 5 if referred_by_user else 0,  # 5 bonus roses if referred
        "swipes_today": 0,
        "last_swipe_reset": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "last_active": datetime.utcnow(),
        "profile_complete": False,
        "referral_code": referral_code,
        "referred_by_code": user_data.referred_by_code,
        "referred_by_user_id": str(referred_by_user["_id"]) if referred_by_user else None,
        "referral_reward_pending": True if referred_by_user else False,  # Reward pending until criteria met
        "referral_criteria_met": {
            "photos_uploaded": False,
            "first_swipe": False,
            "hours_active_24": False
        },
        "total_referrals": 0,
        "total_roses_from_referrals": 0
    }
    
    result = users_collection.insert_one(user_doc)
    new_user_id = str(result.inserted_id)
    
    # Create referral record if referred
    if referred_by_user:
        referral_record = {
            "referrer_id": str(referred_by_user["_id"]),
            "referred_id": new_user_id,
            "referred_email": user_data.email,
            "referral_code_used": user_data.referred_by_code,
            "status": "pending",  # pending, completed, clawback
            "reward_amount": 20,
            "created_at": datetime.utcnow(),
            "completed_at": None,
            "criteria_met": {
                "photos_uploaded": False,
                "first_swipe": False,
                "hours_active_24": False
            }
        }
        referrals_collection.insert_one(referral_record)
    
    token = create_token(new_user_id)
    
    user_doc["_id"] = new_user_id
    user_doc.pop("password")
    
    return {
        "user": user_doc,
        "token": token,
        "message": "Registration successful",
        "bonus_roses": 5 if referred_by_user else 0,
        "referred_by": referred_by_user["name"] if referred_by_user else None
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    user = users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update last active
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active": datetime.utcnow()}}
    )
    
    token = create_token(str(user["_id"]))
    user = serialize_doc(user)
    user.pop("password")
    
    return {
        "user": user,
        "token": token,
        "message": "Login successful"
    }

# ============= PROFILE ROUTES =============

@app.get("/api/profile/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user = serialize_doc(current_user)
    user.pop("password", None)
    return user

@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = serialize_doc(user)
    user.pop("password", None)
    user.pop("email", None)  # Hide email from other users
    
    return user

@app.put("/api/profile/update")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if update_data:
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    
    updated_user = users_collection.find_one({"_id": current_user["_id"]})
    updated_user = serialize_doc(updated_user)
    updated_user.pop("password")
    
    return {"user": updated_user, "message": "Profile updated successfully"}

@app.post("/api/profile/upload-photos")
async def upload_photos(photos_data: PhotosUpdate, current_user: dict = Depends(get_current_user)):
    # Update photos and mark profile as complete
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "photos": photos_data.photos,
                "profile_complete": True
            }
        }
    )
    
    return {"message": f"{len(photos_data.photos)} photos uploaded successfully"}

# ============= MATCHING ROUTES =============

@app.get("/api/matches/potential")
async def get_potential_matches(current_user: dict = Depends(get_current_user)):
    """Get users to swipe on"""
    user_id = current_user["_id"]
    
    # Get users already swiped
    swiped_users = swipes_collection.find({"swiper_id": str(user_id)})
    swiped_ids = [ObjectId(s["swiped_user_id"]) for s in swiped_users]
    swiped_ids.append(user_id)  # Exclude self
    
    # Find potential matches (opposite gender, same country, not swiped, profile complete)
    opposite_gender = "female" if current_user["gender"] == "male" else "male"
    
    potential_users = list(users_collection.find({
        "_id": {"$nin": swiped_ids},
        "gender": opposite_gender,
        "location_country": current_user["location_country"],
        "profile_complete": True
    }).limit(50))
    
    # Serialize and clean
    result = []
    for user in potential_users:
        user = serialize_doc(user)
        user.pop("password", None)
        user.pop("email", None)
        result.append(user)
    
    return {"users": result}

@app.post("/api/matches/swipe")
async def swipe(swipe_data: SwipeAction, current_user: dict = Depends(get_current_user)):
    """Swipe left (pass) or right (like)"""
    user_id = str(current_user["_id"])
    target_id = swipe_data.target_user_id
    
    # Check if user is premium
    is_premium = current_user.get("premium_status") == "premium"
    
    if not is_premium:
        # Check swipe limit for free users (20 per day)
        last_reset = current_user.get("last_swipe_reset", datetime.utcnow())
        swipes_today = current_user.get("swipes_today", 0)
        
        # Reset counter if it's a new day
        if datetime.utcnow().date() > last_reset.date():
            swipes_today = 0
            users_collection.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"swipes_today": 0, "last_swipe_reset": datetime.utcnow()}}
            )
        
        # Check if limit reached
        if swipes_today >= 20:
            raise HTTPException(
                status_code=403,
                detail="Daily swipe limit reached. Upgrade to Premium for unlimited swipes!"
            )
        
        # Increment swipe counter
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$inc": {"swipes_today": 1}}
        )
    
    # Record the swipe
    swipes_collection.insert_one({
        "swiper_id": user_id,
        "swiped_user_id": target_id,
        "direction": swipe_data.direction,
        "created_at": datetime.utcnow()
    })
    
    # Calculate remaining swipes for response
    remaining_swipes = None
    if not is_premium:
        remaining_swipes = 20 - (swipes_today + 1)
    
    # If right swipe, check for match
    if swipe_data.direction == "right":
        # Check if other user also swiped right
        mutual_swipe = swipes_collection.find_one({
            "swiper_id": target_id,
            "swiped_user_id": user_id,
            "direction": "right"
        })
        
        if mutual_swipe:
            # It's a match!
            match_doc = {
                "user1_id": user_id,
                "user2_id": target_id,
                "matched_at": datetime.utcnow(),
                "chat_unlocked": False,
                "unlock_time": datetime.utcnow() + timedelta(hours=1),
                "unlock_method": None,
                "user1_free_snap_used": False,
                "user2_free_snap_used": False
            }
            matches_collection.insert_one(match_doc)
            
            return {
                "matched": True,
                "message": "It's a match!",
                "match_id": str(match_doc["_id"]) if "_id" in match_doc else None,
                "remaining_swipes": remaining_swipes
            }
    
    return {
        "matched": False,
        "message": "Swipe recorded",
        "remaining_swipes": remaining_swipes
    }

@app.get("/api/matches/my-matches")
async def get_my_matches(current_user: dict = Depends(get_current_user)):
    """Get all matches for current user"""
    user_id = str(current_user["_id"])
    
    # Find matches
    matches = list(matches_collection.find({
        "$or": [
            {"user1_id": user_id},
            {"user2_id": user_id}
        ]
    }).sort("matched_at", DESCENDING))
    
    result = []
    for match in matches:
        # Get the other user
        other_user_id = match["user2_id"] if match["user1_id"] == user_id else match["user1_id"]
        other_user = users_collection.find_one({"_id": ObjectId(other_user_id)})
        
        if other_user:
            other_user = serialize_doc(other_user)
            other_user.pop("password", None)
            other_user.pop("email", None)
            
            match_data = serialize_doc(match)
            match_data["other_user"] = other_user
            
            # Check if chat is available (unlocked or time passed)
            if not match_data["chat_unlocked"]:
                if datetime.utcnow() >= match_data["unlock_time"]:
                    # Auto-unlock after 1 hour
                    matches_collection.update_one(
                        {"_id": match["_id"]},
                        {"$set": {"chat_unlocked": True, "unlock_method": "time"}}
                    )
                    match_data["chat_unlocked"] = True
            
            result.append(match_data)
    
    return {"matches": result}

# ============= CHAT ROUTES =============

@app.post("/api/chat/unlock-instant")
async def unlock_instant_chat(payment_data: PaymentIntent, current_user: dict = Depends(get_current_user)):
    """Unlock chat instantly for £0.99"""
    match_id = payment_data.match_id
    
    # Verify match exists and user is part of it
    match = matches_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    user_id = str(current_user["_id"])
    if user_id not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if already unlocked
    if match["chat_unlocked"]:
        return {"message": "Chat already unlocked"}
    
    # Create payment intent (Stripe integration)
    if not STRIPE_SECRET_KEY:
        # For testing without Stripe keys
        matches_collection.update_one(
            {"_id": match["_id"]},
            {"$set": {"chat_unlocked": True, "unlock_method": "payment"}}
        )
        return {"message": "Chat unlocked (test mode)", "payment_required": False}
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=99,  # £0.99
            currency="gbp",
            metadata={
                "type": "instant_chat",
                "match_id": match_id,
                "user_id": user_id
            }
        )
        
        return {
            "client_secret": intent.client_secret,
            "payment_required": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@app.get("/api/chat/messages/{match_id}")
async def get_messages(match_id: str, current_user: dict = Depends(get_current_user)):
    """Get all messages for a match"""
    # Verify user is part of match
    match = matches_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    user_id = str(current_user["_id"])
    if user_id not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if chat is unlocked
    if not match["chat_unlocked"] and datetime.utcnow() < match["unlock_time"]:
        raise HTTPException(status_code=403, detail="Chat not unlocked yet")
    
    # Get messages
    messages = list(messages_collection.find({"match_id": match_id}).sort("created_at", 1))
    
    # Filter expired/viewed snaps
    result = []
    for msg in messages:
        msg = serialize_doc(msg)
        if msg["message_type"] == "snap":
            # Check if expired
            if msg.get("expires_at") and datetime.utcnow() > msg["expires_at"]:
                msg["content"] = "[Snap expired]"
                msg["expired"] = True
            # Check if already viewed (one-time view)
            elif msg.get("viewed") and msg.get("one_time_view"):
                msg["content"] = "[Snap already viewed]"
                msg["expired"] = True
            # If receiver is viewing, mark as viewed
            elif msg["receiver_id"] == user_id and not msg.get("viewed"):
                messages_collection.update_one(
                    {"_id": ObjectId(msg["_id"])},
                    {"$set": {"viewed": True, "viewed_at": datetime.utcnow()}}
                )
        result.append(msg)
    
    return {"messages": result}

@app.post("/api/chat/send-message")
async def send_message(message_data: MessageSend, current_user: dict = Depends(get_current_user)):
    """Send a text or snap message"""
    match_id = message_data.match_id
    
    # Verify match and authorization
    match = matches_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    user_id = str(current_user["_id"])
    if user_id not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if chat is unlocked
    if not match["chat_unlocked"] and datetime.utcnow() < match["unlock_time"]:
        raise HTTPException(status_code=403, detail="Chat not unlocked yet")
    
    # Special handling for snap videos
    if message_data.message_type == "snap":
        is_premium = current_user.get("premium_status") == "premium"
        
        # Determine which user is sending
        user_snap_field = "user1_free_snap_used" if match["user1_id"] == user_id else "user2_free_snap_used"
        has_used_free_snap = match.get(user_snap_field, False)
        
        # Check if user can send snap
        if not is_premium and has_used_free_snap:
            raise HTTPException(
                status_code=403, 
                detail="Free snap already used. Upgrade to Premium for unlimited snaps!"
            )
        
        # Mark free snap as used if not premium
        if not is_premium and not has_used_free_snap:
            matches_collection.update_one(
                {"_id": match["_id"]},
                {"$set": {user_snap_field: True}}
            )
    
    # Get receiver ID
    receiver_id = match["user2_id"] if match["user1_id"] == user_id else match["user1_id"]
    
    # Create message
    message_doc = {
        "match_id": match_id,
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "message_type": message_data.message_type,
        "content": message_data.content,
        "created_at": datetime.utcnow(),
        "viewed": False
    }
    
    # If snap, set expiry and one-time view
    if message_data.message_type == "snap":
        message_doc["expires_at"] = datetime.utcnow() + timedelta(hours=24)
        message_doc["one_time_view"] = True
        message_doc["duration_seconds"] = 9
    
    result = messages_collection.insert_one(message_doc)
    message_doc["_id"] = str(result.inserted_id)
    
    return {"message": message_doc, "status": "sent"}

# ============= ROSES ROUTES =============

@app.post("/api/roses/send")
async def send_rose(rose_data: RoseSend, current_user: dict = Depends(get_current_user)):
    """Send a virtual rose for £0.10"""
    receiver_id = rose_data.receiver_id
    sender_id = str(current_user["_id"])
    
    # Verify receiver exists
    receiver = users_collection.find_one({"_id": ObjectId(receiver_id)})
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create payment intent (Stripe)
    if not STRIPE_SECRET_KEY:
        # Test mode
        roses_collection.insert_one({
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "created_at": datetime.utcnow()
        })
        users_collection.update_one(
            {"_id": ObjectId(receiver_id)},
            {"$inc": {"roses_received": 1}}
        )
        return {"message": "Rose sent (test mode)", "payment_required": False}
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=10,  # £0.10
            currency="gbp",
            metadata={
                "type": "rose",
                "sender_id": sender_id,
                "receiver_id": receiver_id
            }
        )
        
        return {
            "client_secret": intent.client_secret,
            "payment_required": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@app.get("/api/roses/leaderboard")
async def get_rose_leaderboard(limit: int = 50):
    """Get top users by roses received"""
    top_users = list(users_collection.find(
        {"roses_received": {"$gt": 0}},
        {"name": 1, "photos": 1, "roses_received": 1, "location_city": 1}
    ).sort("roses_received", DESCENDING).limit(limit))
    
    result = [serialize_doc(user) for user in top_users]
    return {"leaderboard": result}

# ============= PREMIUM ROUTES =============

@app.post("/api/premium/subscribe")
async def subscribe_premium(payment_data: PaymentIntent, current_user: dict = Depends(get_current_user)):
    """Subscribe to premium (monthly or yearly)"""
    payment_type = payment_data.payment_type
    
    if payment_type not in ["premium_monthly", "premium_yearly"]:
        raise HTTPException(status_code=400, detail="Invalid subscription type")
    
    # Create Stripe Checkout Session
    if not STRIPE_SECRET_KEY:
        # Test mode
        duration = 30 if payment_type == "premium_monthly" else 365
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "is_premium": True,
                    "premium_status": "premium",
                    "premium_expiry": datetime.utcnow() + timedelta(days=duration)
                }
            }
        )
        return {"message": "Premium activated (test mode)", "payment_required": False}
    
    try:
        amount = 999 if payment_type == "premium_monthly" else 8999
        plan_name = "WAHALA UK Premium Monthly" if payment_type == "premium_monthly" else "WAHALA UK Premium Yearly"
        
        # Create Checkout Session with Apple Pay and Card support
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],  # Cards include Apple Pay, Google Pay when enabled
            line_items=[{
                'price_data': {
                    'currency': 'gbp',
                    'product_data': {
                        'name': plan_name,
                        'description': 'Unlimited swipes, see who likes you, priority discovery, and more!',
                    },
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'https://wahaladating.preview.emergentagent.com/payment-success?session_id={{CHECKOUT_SESSION_ID}}&type={payment_type}',
            cancel_url='https://wahaladating.preview.emergentagent.com/premium',
            metadata={
                'type': payment_type,
                'user_id': str(current_user["_id"])
            },
            customer_email=current_user.get("email"),
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "payment_required": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@app.post("/api/payment/create-checkout")
async def create_checkout_session(
    payment_type: str = Body(...),
    match_id: Optional[str] = Body(None),
    receiver_id: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe Checkout Session for any payment type"""
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe not configured")
    
    user_id = str(current_user["_id"])
    
    # Define payment configurations
    payment_configs = {
        "premium_monthly": {"amount": 999, "name": "WAHALA UK Premium Monthly", "desc": "1 month of unlimited features"},
        "premium_yearly": {"amount": 8999, "name": "WAHALA UK Premium Yearly", "desc": "12 months of unlimited features - Best Value!"},
        "instant_chat": {"amount": 99, "name": "Instant Chat Unlock", "desc": "Skip the 1-hour wait and chat now!"},
        "rose": {"amount": 10, "name": "Virtual Rose", "desc": "Send a special rose to show your interest"},
        "donation": {"amount": 500, "name": "Support WAHALA UK", "desc": "Help us improve the app"},
    }
    
    if payment_type not in payment_configs:
        raise HTTPException(status_code=400, detail="Invalid payment type")
    
    config = payment_configs[payment_type]
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'gbp',
                    'product_data': {
                        'name': config["name"],
                        'description': config["desc"],
                    },
                    'unit_amount': config["amount"],
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'https://wahaladating.preview.emergentagent.com/payment-success?session_id={{CHECKOUT_SESSION_ID}}&type={payment_type}',
            cancel_url='https://wahaladating.preview.emergentagent.com/',
            metadata={
                'type': payment_type,
                'user_id': user_id,
                'match_id': match_id or '',
                'receiver_id': receiver_id or ''
            },
            customer_email=current_user.get("email"),
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@app.post("/api/payment/verify-session")
async def verify_payment_session(
    session_id: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """Verify a completed Stripe Checkout Session and apply benefits"""
    
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe not configured")
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Payment not completed")
        
        user_id = str(current_user["_id"])
        payment_type = session.metadata.get("type")
        
        # Apply benefits based on payment type
        if payment_type in ["premium_monthly", "premium_yearly"]:
            duration = 30 if payment_type == "premium_monthly" else 365
            users_collection.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "is_premium": True,
                        "premium_status": "premium",
                        "premium_expiry": datetime.utcnow() + timedelta(days=duration)
                    }
                }
            )
            return {"success": True, "message": "Premium activated!", "type": payment_type}
        
        elif payment_type == "instant_chat":
            match_id = session.metadata.get("match_id")
            if match_id:
                matches_collection.update_one(
                    {"_id": ObjectId(match_id)},
                    {"$set": {"chat_unlocked": True, "unlock_method": "payment"}}
                )
            return {"success": True, "message": "Chat unlocked!", "type": payment_type}
        
        elif payment_type == "rose":
            receiver_id = session.metadata.get("receiver_id")
            if receiver_id:
                roses_collection.insert_one({
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "created_at": datetime.utcnow()
                })
                users_collection.update_one(
                    {"_id": ObjectId(receiver_id)},
                    {"$inc": {"roses_received": 1}}
                )
            return {"success": True, "message": "Rose sent!", "type": payment_type}
        
        elif payment_type == "donation":
            donations_collection.insert_one({
                "user_id": user_id,
                "amount": session.amount_total,
                "session_id": session_id,
                "created_at": datetime.utcnow()
            })
            return {"success": True, "message": "Thank you for your donation!", "type": payment_type}
        
        return {"success": True, "message": "Payment processed", "type": payment_type}
        
    except stripe.error.InvalidRequestError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

@app.get("/api/premium/status")
async def get_premium_status(current_user: dict = Depends(get_current_user)):
    """Check premium status"""
    is_premium = current_user.get("premium_status") == "premium"
    expiry = current_user.get("premium_expiry")
    
    if is_premium and expiry:
        if datetime.utcnow() > expiry:
            # Expired
            users_collection.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"premium_status": "free", "premium_expiry": None}}
            )
            is_premium = False
    
    return {
        "is_premium": is_premium,
        "expiry": expiry.isoformat() if expiry else None
    }

@app.get("/api/swipes/remaining")
async def get_remaining_swipes(current_user: dict = Depends(get_current_user)):
    """Get remaining swipes for today"""
    is_premium = current_user.get("premium_status") == "premium"
    
    if is_premium:
        return {
            "unlimited": True,
            "remaining": None
        }
    
    last_reset = current_user.get("last_swipe_reset", datetime.utcnow())
    swipes_today = current_user.get("swipes_today", 0)
    
    # Reset if new day
    if datetime.utcnow().date() > last_reset.date():
        swipes_today = 0
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"swipes_today": 0, "last_swipe_reset": datetime.utcnow()}}
        )
    
    remaining = 20 - swipes_today
    
    return {
        "unlimited": False,
        "remaining": max(0, remaining),
        "limit": 20
    }

@app.get("/api/chat/snap-status/{match_id}")
async def get_snap_status(match_id: str, current_user: dict = Depends(get_current_user)):
    """Check if user can send free snap"""
    match = matches_collection.find_one({"_id": ObjectId(match_id)})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    user_id = str(current_user["_id"])
    if user_id not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    is_premium = current_user.get("premium_status") == "premium"
    user_snap_field = "user1_free_snap_used" if match["user1_id"] == user_id else "user2_free_snap_used"
    has_used_free_snap = match.get(user_snap_field, False)
    
    return {
        "can_send_snap": is_premium or not has_used_free_snap,
        "is_premium": is_premium,
        "free_snap_used": has_used_free_snap,
        "requires_premium": not is_premium and has_used_free_snap
    }

@app.delete("/api/auth/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Permanently delete user account - NO RECOVERY"""
    user_id = current_user["_id"]
    user_id_str = str(user_id)
    
    try:
        # Delete all user data permanently
        # 1. Delete all swipes by this user
        swipes_collection.delete_many({"swiper_id": user_id_str})
        
        # 2. Delete all swipes on this user
        swipes_collection.delete_many({"swiped_user_id": user_id_str})
        
        # 3. Delete all messages sent by user
        messages_collection.delete_many({"sender_id": user_id_str})
        
        # 4. Delete all messages received by user
        messages_collection.delete_many({"receiver_id": user_id_str})
        
        # 5. Delete all roses sent by user
        roses_collection.delete_many({"sender_id": user_id_str})
        
        # 6. Delete all roses received by user
        roses_collection.delete_many({"receiver_id": user_id_str})
        
        # 7. Delete all matches involving user
        matches_collection.delete_many({"$or": [
            {"user1_id": user_id_str},
            {"user2_id": user_id_str}
        ]})
        
        # 8. Delete all reports made by user
        reports_collection.delete_many({"reporter_id": user_id_str})
        
        # 9. Delete all reports about user
        reports_collection.delete_many({"reported_user_id": user_id_str})
        
        # 10. Delete all transactions by user
        transactions_collection.delete_many({"user_id": user_id_str})
        
        # 11. Finally, delete the user account itself
        users_collection.delete_one({"_id": user_id})
        
        return {
            "message": "Account permanently deleted",
            "deleted": True,
            "note": "All your data has been permanently erased. This action cannot be undone."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")

# ============= 2FA ROUTES =============

@app.post("/api/auth/2fa/setup")
async def setup_2fa(data: TwoFactorSetup, current_user: dict = Depends(get_current_user)):
    """Enable or disable 2FA for user account"""
    user_id = str(current_user["_id"])
    
    if data.enable:
        # Generate OTP and send to user's email (simulated)
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        
        # Store OTP with expiry
        otp_collection.update_one(
            {"user_id": user_id, "type": "2fa_setup"},
            {
                "$set": {
                    "otp_hash": otp_hash,
                    "expires_at": datetime.utcnow() + timedelta(minutes=10),
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        # In production, send email with OTP
        # For now, return OTP in response (only for testing)
        return {
            "message": "Verification code sent to your email",
            "otp_for_testing": otp,  # Remove in production
            "expires_in_minutes": 10
        }
    else:
        # Disable 2FA
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"two_factor_enabled": False, "two_factor_secret": None}}
        )
        otp_collection.delete_many({"user_id": user_id})
        
        return {"message": "Two-factor authentication disabled"}

@app.post("/api/auth/2fa/verify")
async def verify_2fa(data: TwoFactorVerify, current_user: dict = Depends(get_current_user)):
    """Verify 2FA code to complete setup"""
    user_id = str(current_user["_id"])
    
    # Find OTP record
    otp_record = otp_collection.find_one({
        "user_id": user_id,
        "type": "2fa_setup",
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="No valid verification code found. Please request a new one.")
    
    if not verify_otp(data.code, otp_record["otp_hash"]):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Enable 2FA for user
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"two_factor_enabled": True}}
    )
    
    # Delete used OTP
    otp_collection.delete_one({"_id": otp_record["_id"]})
    
    return {"message": "Two-factor authentication enabled successfully"}

@app.post("/api/auth/2fa/send-login-code")
async def send_login_code(email: EmailStr = Body(..., embed=True)):
    """Send 2FA code for login (for users with 2FA enabled)"""
    user = users_collection.find_one({"email": email})
    
    if not user:
        # Don't reveal if user exists
        return {"message": "If your account exists, a verification code has been sent"}
    
    if not user.get("two_factor_enabled"):
        return {"message": "2FA not enabled for this account", "requires_2fa": False}
    
    # Generate and store OTP
    otp = generate_otp()
    otp_hash = hash_otp(otp)
    
    otp_collection.update_one(
        {"user_id": str(user["_id"]), "type": "login"},
        {
            "$set": {
                "otp_hash": otp_hash,
                "expires_at": datetime.utcnow() + timedelta(minutes=5),
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # In production, send email
    return {
        "message": "Verification code sent to your email",
        "requires_2fa": True,
        "otp_for_testing": otp  # Remove in production
    }

@app.post("/api/auth/2fa/verify-login")
async def verify_login_2fa(data: TwoFactorVerify):
    """Verify 2FA code during login"""
    if not data.email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Find OTP record
    otp_record = otp_collection.find_one({
        "user_id": str(user["_id"]),
        "type": "login",
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="No valid verification code found")
    
    if not verify_otp(data.code, otp_record["otp_hash"]):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Delete used OTP
    otp_collection.delete_one({"_id": otp_record["_id"]})
    
    # Generate auth token
    token = create_token(str(user["_id"]))
    user = serialize_doc(user)
    user.pop("password", None)
    
    return {
        "user": user,
        "token": token,
        "message": "Login successful"
    }

@app.get("/api/auth/2fa/status")
async def get_2fa_status(current_user: dict = Depends(get_current_user)):
    """Get current 2FA status"""
    return {
        "two_factor_enabled": current_user.get("two_factor_enabled", False)
    }

# ============= SETTINGS ROUTES =============

@app.get("/api/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Get user settings"""
    user_id = str(current_user["_id"])
    
    settings = user_settings_collection.find_one({"user_id": user_id})
    if not settings:
        # Return default settings
        return get_default_settings()
    
    settings = serialize_doc(settings)
    settings.pop("user_id", None)
    return settings

@app.put("/api/settings")
async def update_settings(settings_data: UserSettings, current_user: dict = Depends(get_current_user)):
    """Update user settings"""
    user_id = str(current_user["_id"])
    
    update_data = {k: v for k, v in settings_data.dict().items() if v is not None}
    update_data["user_id"] = user_id
    update_data["updated_at"] = datetime.utcnow()
    
    user_settings_collection.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully", "settings": update_data}

# ============= BLOCKED USERS ROUTES =============

@app.get("/api/blocked-users")
async def get_blocked_users(current_user: dict = Depends(get_current_user)):
    """Get list of blocked users"""
    user_id = str(current_user["_id"])
    
    blocked = list(blocked_users_collection.find({"blocker_id": user_id}))
    
    result = []
    for block in blocked:
        blocked_user = users_collection.find_one({"_id": ObjectId(block["blocked_id"])})
        if blocked_user:
            result.append({
                "_id": block["blocked_id"],
                "name": blocked_user.get("name", "Unknown"),
                "photo": blocked_user.get("photos", [None])[0],
                "blocked_at": block.get("created_at", datetime.utcnow()).isoformat()
            })
    
    return {"blocked_users": result, "count": len(result)}

@app.post("/api/blocked-users/block")
async def block_user(data: BlockUserRequest, current_user: dict = Depends(get_current_user)):
    """Block a user"""
    user_id = str(current_user["_id"])
    
    if data.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    # Check if user exists
    target_user = users_collection.find_one({"_id": ObjectId(data.user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already blocked
    existing = blocked_users_collection.find_one({
        "blocker_id": user_id,
        "blocked_id": data.user_id
    })
    
    if existing:
        return {"message": "User is already blocked"}
    
    # Block user
    blocked_users_collection.insert_one({
        "blocker_id": user_id,
        "blocked_id": data.user_id,
        "reason": data.reason,
        "created_at": datetime.utcnow()
    })
    
    # Remove any existing matches
    matches_collection.delete_many({
        "$or": [
            {"user1_id": user_id, "user2_id": data.user_id},
            {"user1_id": data.user_id, "user2_id": user_id}
        ]
    })
    
    return {"message": "User blocked successfully"}

@app.delete("/api/blocked-users/unblock/{user_id}")
async def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Unblock a user"""
    blocker_id = str(current_user["_id"])
    
    result = blocked_users_collection.delete_one({
        "blocker_id": blocker_id,
        "blocked_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User was not blocked")
    
    return {"message": "User unblocked successfully"}

# ============= ACCOUNT DEACTIVATION ROUTES =============

@app.post("/api/account/deactivate")
async def deactivate_account(data: DeactivateAccount, current_user: dict = Depends(get_current_user)):
    """Temporarily deactivate account"""
    reactivate_date = None
    if data.duration_days > 0:
        reactivate_date = datetime.utcnow() + timedelta(days=data.duration_days)
    
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "is_deactivated": True,
                "deactivated_at": datetime.utcnow(),
                "reactivate_at": reactivate_date,
                "discovery_enabled": False
            }
        }
    )
    
    return {
        "message": "Account deactivated",
        "reactivate_at": reactivate_date.isoformat() if reactivate_date else None
    }

@app.post("/api/account/reactivate")
async def reactivate_account(current_user: dict = Depends(get_current_user)):
    """Reactivate deactivated account"""
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "is_deactivated": False,
                "deactivated_at": None,
                "reactivate_at": None,
                "discovery_enabled": True
            }
        }
    )
    
    return {"message": "Account reactivated successfully"}

# ============= REPORTS ROUTES =============

@app.post("/api/reports/create")
async def create_report(report_data: ReportCreate, current_user: dict = Depends(get_current_user)):
    """Report a user for violation"""
    report_doc = {
        "reporter_id": str(current_user["_id"]),
        "reported_user_id": report_data.reported_user_id,
        "reason": report_data.reason,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    reports_collection.insert_one(report_doc)
    
    return {"message": "Report submitted successfully"}

@app.get("/api/reports/list")
async def list_reports(current_user: dict = Depends(get_current_user)):
    """List all reports (admin only - simplified for now)"""
    reports = list(reports_collection.find().sort("created_at", DESCENDING).limit(100))
    
    result = []
    for report in reports:
        report = serialize_doc(report)
        # Get reported user info
        reported_user = users_collection.find_one({"_id": ObjectId(report["reported_user_id"])})
        if reported_user:
            report["reported_user_name"] = reported_user["name"]
            report["reported_user_email"] = reported_user["email"]
        result.append(report)
    
    return {"reports": result}

# ============= PAYMENT WEBHOOK =============

@app.post("/api/payments/webhook")
async def stripe_webhook(payload: dict = Body(...)):
    """Handle Stripe webhook events"""
    # In production, verify webhook signature
    event_type = payload.get("type")
    
    if event_type == "payment_intent.succeeded":
        payment_intent = payload.get("data", {}).get("object", {})
        metadata = payment_intent.get("metadata", {})
        payment_type = metadata.get("type")
        
        if payment_type == "instant_chat":
            # Unlock chat
            match_id = metadata.get("match_id")
            matches_collection.update_one(
                {"_id": ObjectId(match_id)},
                {"$set": {"chat_unlocked": True, "unlock_method": "payment"}}
            )
        
        elif payment_type == "rose":
            # Record rose
            sender_id = metadata.get("sender_id")
            receiver_id = metadata.get("receiver_id")
            roses_collection.insert_one({
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "created_at": datetime.utcnow()
            })
            users_collection.update_one(
                {"_id": ObjectId(receiver_id)},
                {"$inc": {"roses_received": 1}}
            )
        
        elif payment_type in ["premium_monthly", "premium_yearly"]:
            # Activate premium
            user_id = metadata.get("user_id")
            duration = 30 if payment_type == "premium_monthly" else 365
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "premium_status": "premium",
                        "premium_expiry": datetime.utcnow() + timedelta(days=duration)
                    }
                }
            )
    
    return {"status": "success"}

@app.get("/api/logo")
async def get_logo():
    """Serve the WAHALA logo"""
    logo_path = "/app/frontend/assets/images/wahala-logo.png"
    if os.path.exists(logo_path):
        return FileResponse(logo_path)
    else:
        raise HTTPException(status_code=404, detail="Logo not found")

@app.get("/api/config/stripe")
async def get_stripe_config():
    """Get Stripe publishable key"""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "stripe_enabled": bool(STRIPE_SECRET_KEY)
    }

# ============= SEED TEST USERS =============

@app.post("/api/seed/test-users")
async def seed_test_users():
    """Create 4 test users (2 male, 2 female) for testing"""
    test_users = [
        {
            "email": "marcus@test.com",
            "password": hash_password("Test1234!"),
            "name": "Marcus Johnson",
            "age": 32,
            "gender": "male",
            "location_city": "London",
            "location_country": "UK",
            "height": "183 cm",
            "instagram": "marcus_j",
            "looking_for": "marry",
            "bio": "Software engineer with a passion for travel and good food. Looking for someone to build a future with.",
            "job": "Software Engineer",
            "education": "Imperial College London",
            "photos": [
                "https://images.unsplash.com/photo-1570158268183-d296b2892211?w=400&h=600&fit=crop"
            ],
            "profile_complete": True,
            "is_premium": False,
            "roses_received": 5,
            "created_at": datetime.utcnow(),
        },
        {
            "email": "david@test.com",
            "password": hash_password("Test1234!"),
            "name": "David Williams",
            "age": 28,
            "gender": "male",
            "location_city": "Manchester",
            "location_country": "UK",
            "height": "178 cm",
            "instagram": "david_w",
            "looking_for": "see_where_it_goes",
            "bio": "Finance professional who loves football and cooking. Let's grab coffee and see where it goes!",
            "job": "Investment Banker",
            "education": "University of Manchester",
            "photos": [
                "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=600&fit=crop"
            ],
            "profile_complete": True,
            "is_premium": True,
            "roses_received": 12,
            "created_at": datetime.utcnow(),
        },
        {
            "email": "amara@test.com",
            "password": hash_password("Test1234!"),
            "name": "Amara Okonkwo",
            "age": 29,
            "gender": "female",
            "location_city": "Birmingham",
            "location_country": "UK",
            "height": "168 cm",
            "instagram": "amara_ok",
            "looking_for": "marry",
            "bio": "Medical doctor with a love for art and culture. Faith and family are important to me.",
            "job": "Doctor",
            "education": "University of Birmingham",
            "photos": [
                "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop"
            ],
            "profile_complete": True,
            "is_premium": False,
            "roses_received": 24,
            "created_at": datetime.utcnow(),
        },
        {
            "email": "zara@test.com",
            "password": hash_password("Test1234!"),
            "name": "Zara Thompson",
            "age": 26,
            "gender": "female",
            "location_city": "London",
            "location_country": "UK",
            "height": "165 cm",
            "instagram": "zara_t",
            "looking_for": "see_where_it_goes",
            "bio": "Marketing manager who loves fitness and travel. Looking for genuine connections and good vibes.",
            "job": "Marketing Manager",
            "education": "King's College London",
            "photos": [
                "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=600&fit=crop"
            ],
            "profile_complete": True,
            "is_premium": True,
            "roses_received": 31,
            "created_at": datetime.utcnow(),
        },
    ]
    
    created_users = []
    for user_data in test_users:
        # Check if user already exists
        existing = users_collection.find_one({"email": user_data["email"]})
        if existing:
            created_users.append({"email": user_data["email"], "status": "already exists"})
            continue
        
        # Insert new user
        result = users_collection.insert_one(user_data)
        created_users.append({
            "email": user_data["email"],
            "name": user_data["name"],
            "gender": user_data["gender"],
            "status": "created",
            "id": str(result.inserted_id)
        })
    
    return {
        "message": "Test users seeded successfully",
        "users": created_users
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
