# 💳 SUPER SIMPLE STRIPE SETUP (Non-Technical!)

## What is Stripe?
Stripe lets you accept payments in your app. Think of it like PayPal - it's how people will pay for premium, roses, etc.

## ✅ Step 1: Create Stripe Account (5 Minutes)

1. **Open your web browser**
2. **Go to:** www.stripe.com
3. **Click the BIG BLUE "Sign up" button** (top right corner)
4. **Fill in:**
   - Your email address
   - Create a password
   - Your name
   - Your country
5. **Click "Create account"**
6. **Check your email** and click the verification link
7. **Done!** You now have a Stripe account!

---

## ✅ Step 2: Get Your Keys (2 Minutes)

After you login to Stripe, you'll see a dashboard.

1. **Look at the LEFT side menu**
2. **Find and click "Developers"** (it has a </> symbol)
3. **Click "API keys"** (in the left menu under Developers)

You'll now see a page with a table that looks like this:

```
Standard keys
┌─────────────────────────────────────────┐
│ Publishable key                         │
│ pk_test_51abc...                  [Copy]│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Secret key                              │
│ •••••••••••••••     [Reveal test key]  │
└─────────────────────────────────────────┘
```

4. **For the PUBLISHABLE KEY:**
   - Click the **[Copy]** button
   - Paste it somewhere safe (like a Notes app)
   - It starts with: `pk_test_`

5. **For the SECRET KEY:**
   - Click **"Reveal test key"** button
   - A key will appear (starts with `sk_test_`)
   - Click **[Copy]** next to it
   - Paste it somewhere safe

**YOU NOW HAVE TWO KEYS!** They look like:
- `pk_test_51Hxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- `sk_test_51Hxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## ✅ Step 3: Give Keys to Me

Since you have the keys now, **just tell me:**

**"I have my Stripe keys"**

And I'll help you add them OR you can run this command:

```
bash /app/add-stripe-keys.sh
```

It will ask you to:
1. Paste your Publishable key (the pk_test one)
2. Paste your Secret key (the sk_test one)

**That's it!** Done! ✅

---

## 🎉 What Happens Next?

Once your keys are added:
- ✅ Your app can accept REAL payments
- ✅ People can buy premium (£9.99/month)
- ✅ People can unlock chat instantly (£0.99)
- ✅ People can send roses (£0.10)
- ✅ You get the money in your Stripe account!

---

## 💰 How Do You Get Your Money?

Stripe holds the money and pays you:
- **In UK:** To your bank account (free)
- **In US:** To your bank account (free)
- Usually within 2-7 business days

You set up your bank account details in Stripe settings later (they'll guide you).

---

## ✅ Test vs Real Money

**Test Mode** (what you have now):
- Keys start with `pk_test_` and `sk_test_`
- NO REAL MONEY moves
- Use card: 4242 4242 4242 4242 to test
- Perfect for trying things out!

**Live Mode** (when you're ready to launch):
- You switch to "Live" keys in Stripe
- Keys start with `pk_live_` and `sk_live_`
- REAL MONEY is charged
- You need to verify your business info first

**Start with TEST mode!** You can switch to Live later when you're ready.

---

## 🐛 Common Questions

**Q: Do I need to pay Stripe?**
A: Stripe takes a small fee (2.9% + 30p per transaction). You don't pay upfront.

**Q: Is it safe?**
A: Yes! Stripe is used by millions of businesses worldwide. Very secure.

**Q: What if I mess up?**
A: You can't mess up! Test mode uses fake money. Nothing real happens.

**Q: Can I change keys later?**
A: Yes! Anytime. Just run the script again or tell me.

**Q: Do I need a business?**
A: Not for test mode! For live mode, Stripe will ask for some details.

---

## 📞 Need Help?

**Can't find the Developers button?**
- It's on the left side menu in Stripe
- Look for a symbol that looks like this: </>
- If you can't find it, click your name (top right) → Dashboard

**Keys not working?**
- Make sure you copied the FULL key (all the random letters/numbers)
- Check there are no spaces at the start or end
- Try copying again

**Still stuck?**
- Just tell me: "I'm stuck on Stripe"
- Or email Stripe support (they're very helpful!)

---

## ✅ Quick Summary

1. Go to www.stripe.com
2. Sign up (free!)
3. Click Developers → API keys
4. Copy both keys (pk_test and sk_test)
5. Tell me you have them OR run: `bash /app/add-stripe-keys.sh`
6. Done! 🎉

**Total time: About 10 minutes**

Your app will then be able to accept payments! 💰
