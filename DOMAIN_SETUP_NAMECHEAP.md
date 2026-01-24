# 🌐 WAHALA UK - Domain Setup Guide (Namecheap)

## ✅ Website is Built & Running!

Your beautiful marketing website is ready at: **http://localhost:8001**

Now let's connect it to **wahalauk.com** 🎉

---

## 📋 What You Need

1. Your **Namecheap account** login (where you bought wahalauk.com)
2. Your **server IP address** (I'll provide this)
3. 5-10 minutes for DNS propagation

**Note:** You DON'T need to buy hosting from Namecheap - your website is already hosted on your Emergent server!

---

## 🚀 Step-by-Step DNS Setup on Namecheap

### Step 1: Get Your Server IP Address

Your website is hosted on this Emergent server. To connect your domain, you need this server's public IP address.

**Get your IP:**
```bash
curl ifconfig.me
```

Save this IP address (e.g., `123.45.67.89`) - you'll need it in Step 3.

---

### Step 2: Login to Namecheap

1. Go to: **https://www.namecheap.com/myaccount/login/**
2. Enter your username and password
3. Click "Sign In"

---

### Step 3: Access Domain Management

1. From the left sidebar, click **"Domain List"**
2. Find **wahalauk.com** in your list
3. Click the **"Manage"** button next to it

---

### Step 4: Configure DNS Records

1. Find the section called **"Advanced DNS"** (top tabs)
2. Click **"Advanced DNS"**

You'll see a table with DNS records. Now let's add the correct ones:

#### A. Delete Existing Records (if any)
- Look for any existing **A Records** or **CNAME Records**
- Click the trash icon to delete them
- Keep only **URL Redirect Records** if they exist

#### B. Add New A Record for Root Domain

Click **"Add New Record"** and enter:

| Field | Value |
|-------|-------|
| Type | **A Record** |
| Host | **@** |
| Value | **[YOUR_SERVER_IP]** (from Step 1) |
| TTL | **Automatic** |

Click **Save** ✓

#### C. Add New A Record for WWW

Click **"Add New Record"** again and enter:

| Field | Value |
|-------|-------|
| Type | **A Record** |
| Host | **www** |
| Value | **[YOUR_SERVER_IP]** (same IP as above) |
| TTL | **Automatic** |

Click **Save** ✓

---

### Step 5: Verify Your Setup

Your DNS records should now look like this:

```
Type        Host    Value               TTL
──────────────────────────────────────────────
A Record    @       123.45.67.89        Automatic
A Record    www     123.45.67.89        Automatic
```

(Replace `123.45.67.89` with your actual server IP)

Click **"Save All Changes"** (green button at bottom)

---

## ⏱️ DNS Propagation Time

- **Namecheap**: Usually 30 minutes to 2 hours
- **Global**: Can take up to 24-48 hours (rare)
- Most users see changes within 1-2 hours

---

## 🧪 Test Your Domain

### Test Immediately (Skip DNS Cache):
```bash
# Linux/Mac
host wahalauk.com

# Windows PowerShell
nslookup wahalauk.com

# Should show your server IP
```

### Test in Browser:
After 1-2 hours, visit:
- **http://wahalauk.com** - Should show your website!
- **http://www.wahalauk.com** - Should also work!

---

## 🔒 Next Step: Add HTTPS (SSL Certificate)

Once your domain is working with HTTP, you should add HTTPS for security.

**Why HTTPS?**
- Encrypts user data
- Required for mobile app stores
- Better Google ranking
- Shows padlock in browser

**How to Add:**
I can help you set up a free SSL certificate using Let's Encrypt after your domain is pointing correctly.

---

## 🐛 Troubleshooting

### Domain not working after 2 hours?

**Check 1: Verify DNS Records**
```bash
dig wahalauk.com
# Should show A record with your IP
```

**Check 2: Verify Namecheap Settings**
- Login to Namecheap
- Domain List → Manage → Advanced DNS
- Confirm both A records are there
- Make sure "Nameservers" (different tab) is set to "Namecheap BasicDNS" or "Namecheap PremiumDNS"

**Check 3: Server is Running**
```bash
curl http://[YOUR_SERVER_IP]:8001/
# Should return HTML
```

### Seeing Namecheap parking page?

This means DNS hasn't propagated yet. Wait another hour and try again.

### Getting "connection refused"?

Your server might need firewall configuration. Contact Emergent support.

---

## 📊 Current Setup Summary

### What's Hosted Where:

```
wahalauk.com (your domain - Namecheap)
        ↓ (DNS points to)
Your Server IP (Emergent hosting)
        ↓ (serves)
┌─────────────────────────────┐
│  Port 8001: Backend API +   │
│  Marketing Website          │
│  (/app/website)             │
└─────────────────────────────┘
┌─────────────────────────────┐
│  Port 3000: Mobile App      │
│  (Expo preview)             │
└─────────────────────────────┘
```

### URLs After DNS Setup:

- **wahalauk.com** → Marketing website
- **www.wahalauk.com** → Marketing website
- **wahalauk.com/api/health** → Backend API health check
- **[expo-qr-code]** → Mobile app (Expo Go)

---

## 🎨 Website Features

Your marketing site includes:

✅ Hero section with WAHALA logo  
✅ Features showcase (6 key features)  
✅ How it works (3 simple steps)  
✅ Pricing comparison (Free vs Premium)  
✅ Download section (App Store & Google Play)  
✅ Full footer with links  
✅ Responsive design (mobile & desktop)  
✅ Smooth animations & interactions  
✅ SEO optimized meta tags  

---

## 📝 Alternative: If You Want Dedicated Web Hosting

If you prefer to host your website separately (not required):

**Option A: Cloudflare Pages** (Free)
- Upload `/app/website` folder
- Point domain to Cloudflare
- Free SSL included

**Option B: Netlify** (Free)
- Drag & drop `/app/website`
- Automatic deployments
- Free SSL included

**Option C: Vercel** (Free)
- Connect to Git repository
- Automatic previews
- Free SSL included

But **you don't need these** - your current Emergent server hosting works perfectly!

---

## ✅ Quick Checklist

- [ ] Got server IP address (`curl ifconfig.me`)
- [ ] Logged into Namecheap.com
- [ ] Went to Domain List → Manage
- [ ] Clicked "Advanced DNS" tab
- [ ] Added A record: `@` → `[YOUR_IP]`
- [ ] Added A record: `www` → `[YOUR_IP]`
- [ ] Clicked "Save All Changes"
- [ ] Waited 1-2 hours for DNS propagation
- [ ] Tested: http://wahalauk.com
- [ ] Website loads! 🎉

---

## 💡 Pro Tips

1. **Bookmark this guide** - you might need it again
2. **Keep your Namecheap login safe** - you'll need it yearly for renewal
3. **Set domain to auto-renew** - don't lose your domain!
4. **After DNS works, add HTTPS** - I can help with this
5. **Update download links** - when apps are published to stores

---

## 📞 Need Help?

**DNS Issues:**
- Namecheap Support: https://www.namecheap.com/support/
- Live Chat available 24/7

**Server Issues:**
- Check backend logs: `tail /var/log/supervisor/backend.out.log`
- Restart backend: `sudo supervisorctl restart backend`

**Website Issues:**
- Files located at: `/app/website/`
- Edit `index.html` for content changes
- Edit `styles.css` for design changes

---

## 🎉 You're Almost There!

Once DNS propagates (1-2 hours), **wahalauk.com** will show your beautiful marketing website to the world! 🌍

Your WAHALA UK dating app will have:
- ✅ Professional website: **wahalauk.com**
- ✅ Backend API: **wahalauk.com/api/**
- ✅ Mobile apps: Coming soon to App Store & Google Play
- ✅ Brand presence across UK 🇬🇧, US 🇺🇸, Italy 🇮🇹

**Made with ❤️ for the Black community**
