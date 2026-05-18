# 🚂 Railway Deployment Guide for FamilyChores

Quick and easy deployment to Railway - your app will be live in minutes!

## Prerequisites

- Railway account (free tier available at [railway.app](https://railway.app))
- GitHub account (to connect your repo)
- This repository pushed to GitHub

---

## 🚀 Deployment Steps

### 1. Push to GitHub (if not done already)

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose `futuresrelic/familychores`**
5. **Railway will automatically:**
   - Detect the Dockerfile
   - Build the container
   - Deploy your app
   - Give you a URL like `https://familychores-production.up.railway.app`

### 3. Configure Your Domain (Optional)

Railway provides a free subdomain, but you can add your own:

1. Go to your Railway project
2. Click **Settings** → **Domains**
3. Add custom domain: `tasks.futuresrelic.com` (or any subdomain you want)
4. Railway will show you DNS records to add:
   - Type: `CNAME`
   - Name: `tasks` (or your subdomain)
   - Value: `your-app.up.railway.app`

### 4. Update DNS at Your Domain Provider

Add the CNAME record Railway provides. For DreamHost:

1. Go to **Manage Domains** → **DNS**
2. **Add Record**:
   - Type: `CNAME`
   - Host: `tasks`
   - Points to: `[your-railway-url].up.railway.app`
   - TTL: `Auto` or `14400`

⏱️ DNS changes take 5-60 minutes to propagate.

---

## 🔐 Reset Admin Password (Immediate Fix)

Your wife can't log in? Here's how to reset:

### Option 1: Use the Reset Utility (Easiest)

1. **Visit:** `https://your-railway-url.up.railway.app/reset-admin-password.php`
2. **Enter:**
   - Reset Code: `RESET2024` (default, or check the file)
   - Email: Admin email address
   - New Password: Choose a new password
3. **Click "Reset Password"**
4. **Important:** Delete the `reset-admin-password.php` file after use (see below)

### Option 2: Use Railway Shell

1. In Railway dashboard, click your service
2. Go to **Settings** → **Deployments**
3. Click **Shell** on your latest deployment
4. Run:
```bash
sqlite3 /var/www/html/data/app.sqlite
UPDATE users SET password = '$2y$10$abcd...' WHERE role = 'admin';
.quit
```

---

## 📊 Railway Dashboard Features

### Monitor Your App
- **Metrics:** View CPU, memory, network usage
- **Logs:** See real-time application logs
- **Deployments:** View deployment history and rollback if needed

### Environment Variables (if needed later)
- Go to **Variables** tab
- Add any environment-specific settings
- Example: `PHP_TIMEZONE=America/New_York`

### Volume (Database Persistence)

Railway automatically persists `/var/www/html/data/` which contains:
- `app.sqlite` - Your database
- `sessions/` - User sessions

**No additional volume configuration needed!** The Dockerfile handles this.

---

## 🔄 Updating Your App

Railway auto-deploys when you push to GitHub:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```
3. Railway automatically:
   - Detects the push
   - Rebuilds the container
   - Deploys the new version
   - Zero downtime!

---

## 🛠️ Post-Deployment Tasks

### 1. Delete the Password Reset File

Once you've reset the password:

**Option A - Via Railway Shell:**
```bash
rm /var/www/html/reset-admin-password.php
```

**Option B - From Git (recommended):**
```bash
git rm reset-admin-password.php
git commit -m "Remove password reset utility"
git push
```

### 2. Test the App

- [ ] Visit your Railway URL
- [ ] Log in with admin credentials
- [ ] Create a test chore
- [ ] Test kid panel with pairing
- [ ] Verify themes work
- [ ] Check mobile responsiveness

### 3. Set Up Monitoring (Optional)

Railway provides built-in monitoring, but you can also:
- Add UptimeRobot for external monitoring
- Set up Railway webhooks for deploy notifications

---

## 🐛 Troubleshooting

### Build Failed
- Check **Logs** in Railway dashboard
- Common issues:
  - Syntax error in PHP files
  - Missing dependencies in Dockerfile

### Database Not Persisting
- Check `/var/www/html/data/` permissions
- Railway should auto-persist this directory
- Check logs for SQLite errors

### 404 Errors
- Make sure `.htaccess` is being processed
- Check Apache `rewrite` module is enabled (it is in our Dockerfile)
- Verify file paths are correct

### App is Slow
- Check **Metrics** tab for resource usage
- Free tier has limits; upgrade if needed
- SQLite performs well for small families

### Can't Access Admin Panel
- Clear browser cache/cookies
- Try incognito mode
- Check if cookies are being set (look at Application tab in DevTools)

---

## 💰 Pricing

**Free Tier** (Perfect for family use):
- 500 hours/month (enough for 24/7 operation of 1 service)
- Shared resources
- Automatic SSL
- Custom domains

**Hobby Plan** ($5/month):
- Unlimited hours
- Better performance
- Multiple services
- Priority support

---

## 🎉 Benefits of Railway vs DreamHost

✅ **Automatic Deployments** - Push to GitHub, it deploys  
✅ **Free SSL** - Automatic HTTPS  
✅ **No File Manager** - Git-based workflow  
✅ **Built-in Logs** - Easy debugging  
✅ **Zero Downtime** - Seamless updates  
✅ **Better Performance** - Optimized containers  
✅ **Rollback Support** - Revert to any previous deploy  
✅ **Environment Variables** - Secure config management  

---

## 📞 Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Railway Discord:** Join for community help
- **This Project Issues:** GitHub issues for app-specific questions

---

## 🔒 Security Notes

1. **Delete `reset-admin-password.php` after use!**
2. Keep your Railway account secure (2FA recommended)
3. Don't commit sensitive data to GitHub
4. Railway provides automatic SSL (HTTPS)
5. Database is not exposed to the web (Docker internal filesystem)

---

## Summary

1. Push code to GitHub ✅
2. Deploy to Railway (5 minutes) ✅
3. Reset password via utility ✅
4. Delete reset file ✅
5. Configure custom domain (optional) ✅
6. Share URL with family! 🎉

**Your app will be live at:** `https://[your-project].up.railway.app`

Enjoy your hassle-free deployment! 🚂✨
