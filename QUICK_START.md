# ⚡ Quick Start - Railway Deployment

## 🎯 Your Mission: Get FamilyChores live in 10 minutes

---

## Step 1: Commit & Push (2 minutes)

```bash
cd /path/to/familychores
git add .
git commit -m "Add Railway deployment config"
git push origin main
```

---

## Step 2: Deploy to Railway (3 minutes)

1. Go to **[railway.app](https://railway.app)** → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select **`familychores`**
4. Wait for build to complete (~2 min)
5. Click on your service → **"Generate Domain"** (under Settings → Networking)

✅ **Your app is now live!** Copy the URL (something like `https://familychores-production-xxxx.up.railway.app`)

---

## Step 3: Reset Your Wife's Password (2 minutes)

1. Visit: `https://[your-railway-url]/reset-admin-password.php`
2. Enter:
   - **Reset Code:** `RESET2024`
   - **Email:** Her admin email
   - **New Password:** Choose something memorable
3. Click **"Reset Password"**
4. ✅ She can now log in!

---

## Step 4: Delete the Reset File (1 minute)

**Important security step!**

```bash
git rm reset-admin-password.php
git commit -m "Remove password reset utility after use"
git push
```

Railway will auto-deploy and remove the file.

---

## Step 5: Add Custom Domain (Optional - 5 minutes)

Want to use `tasks.futuresrelic.com` instead of the Railway URL?

### In Railway:
1. Go to your project → **Settings** → **Networking** → **Custom Domain**
2. Enter: `tasks.futuresrelic.com`
3. Railway will show you a CNAME target like: `your-project.up.railway.app`

### In Your DNS (DreamHost, Cloudflare, etc):
Add a CNAME record:
- **Type:** CNAME
- **Name:** tasks (or whatever subdomain you want)
- **Target:** `your-project.up.railway.app`
- **TTL:** Auto/14400

Wait 5-10 minutes for DNS to propagate.

✅ **Done!** Visit `https://tasks.futuresrelic.com`

---

## 🎉 That's It!

Your FamilyChores app is now:
- ✅ Live 24/7
- ✅ Auto-deploys on git push
- ✅ Free SSL (HTTPS)
- ✅ Automatic backups
- ✅ No more manual file uploads!

---

## 📱 Share With Family

Send them the link:
- **Admin Panel:** `https://your-url.railway.app/admin/`
- **Kid Panel:** `https://your-url.railway.app/kid/`

Kids pair their devices using the QR code from admin panel.

---

## 🔄 Future Updates

Whenever you want to update the app:

```bash
# Make changes, then:
git add .
git commit -m "Description of changes"
git push
```

Railway automatically rebuilds and deploys. Zero downtime! 🚀

---

## 🆘 Need Help?

Check **RAILWAY_DEPLOYMENT.md** for detailed troubleshooting and advanced features.

---

**Estimated total time: 10-15 minutes** ⏱️  
**Complexity: Easy** 👍  
**Cost: Free** (Railway free tier) 💰
