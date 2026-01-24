# 🌐 Connect wahalauk.com to Your Website - STEP BY STEP

## ✅ Your Server IP Address
```
104.198.214.223
```
**Copy this number - you'll need it!**

---

## 📝 SIMPLE STEPS (10 Minutes)

### Step 1: Login to Namecheap
1. Go to: **www.namecheap.com**
2. Click **"Sign In"** (top right)
3. Enter your username and password
4. Click **"Sign In"**

---

### Step 2: Find Your Domain
1. After login, you'll see a menu on the left
2. Click **"Domain List"**
3. You'll see **wahalauk.com** in the list
4. Click the **"MANAGE"** button next to wahalauk.com

---

### Step 3: Go to DNS Settings
1. You'll see tabs at the top of the page
2. Click the **"Advanced DNS"** tab
3. You'll see a section called **"Host Records"**

---

### Step 4: Delete Old Records (If Any)
Look at the **"Host Records"** section.

**If you see any A Records or CNAME Records already there:**
- Click the **trash can icon** next to each one
- Delete them all
- Don't worry - we're adding new ones!

**Keep any URL Redirect Records** - don't delete those.

---

### Step 5: Add First A Record
1. Click **"ADD NEW RECORD"** button
2. A form will appear - fill it in EXACTLY like this:

```
Type:    A Record          (select from dropdown)
Host:    @                 (type this symbol)
Value:   104.198.214.223   (paste your IP)
TTL:     Automatic         (select from dropdown)
```

3. Click **"Save"** or the green checkmark ✓

---

### Step 6: Add Second A Record
1. Click **"ADD NEW RECORD"** button again
2. Fill in EXACTLY like this:

```
Type:    A Record          (select from dropdown)
Host:    www               (type www)
Value:   104.198.214.223   (paste your IP - same as before)
TTL:     Automatic         (select from dropdown)
```

3. Click **"Save"** or the green checkmark ✓

---

### Step 7: Save All Changes
1. Scroll to the bottom of the page
2. Click the **BIG GREEN "SAVE ALL CHANGES"** button
3. Wait for confirmation message

---

## ✅ DONE! Your Records Should Look Like This:

```
Type        Host    Value               TTL
─────────────────────────────────────────────
A Record    @       104.198.214.223    Automatic
A Record    www     104.198.214.223    Automatic
```

---

## ⏱️ Wait Time

**Your domain will start working in:**
- **30 minutes to 2 hours** (most common)
- Up to 24 hours (rare)

**Most people see it working within 1 hour!**

---

## 🧪 Test Your Domain

### After 1-2 Hours, Test:

**Open your browser and go to:**
- http://wahalauk.com
- http://www.wahalauk.com

**You should see:**
- Your beautiful WAHALA UK website! 🎉
- Hero section with "Find Your Love"
- Features, pricing, download section

---

## 🐛 If It's Not Working After 2 Hours

### Check 1: Did you save?
- Go back to Namecheap
- Advanced DNS tab
- Make sure both A Records are still there

### Check 2: Test DNS
Open Command Prompt (Windows) or Terminal (Mac) and type:
```
nslookup wahalauk.com
```

**Should show:** 104.198.214.223

### Check 3: Still stuck?
- Clear your browser cache
- Try on your phone (different network)
- Try incognito/private mode

---

## 📞 Need Help During Setup?

**Stuck on Namecheap?**
- Namecheap Support: Live chat 24/7
- Go to: namecheap.com/support

**Can't find something?**
- Tell me which step you're on
- I'll help you!

---

## 🎉 What Happens Next

Once DNS is working:
- **wahalauk.com** = Your marketing website
- **www.wahalauk.com** = Same website
- People can visit and see your app!

---

## ⚡ Quick Checklist

- [ ] Login to Namecheap.com
- [ ] Go to Domain List
- [ ] Click "MANAGE" on wahalauk.com
- [ ] Click "Advanced DNS" tab
- [ ] Delete old A Records (if any)
- [ ] Add A Record: @ → 104.198.214.223
- [ ] Add A Record: www → 104.198.214.223
- [ ] Click "SAVE ALL CHANGES"
- [ ] Wait 1-2 hours
- [ ] Visit wahalauk.com
- [ ] See your website! 🎉

---

## 💡 Remember

**Your IP:** 104.198.214.223
**Your Domain:** wahalauk.com
**Time to Work:** 1-2 hours after setup

**You've got this!** Just follow the steps one by one. 🚀
