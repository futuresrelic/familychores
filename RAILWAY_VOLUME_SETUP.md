# 🗄️ Railway Volume Setup (Web Interface)

How to add a persistent volume for your database through Railway's web interface.

---

## Why Do We Need a Volume?

Without a volume, your SQLite database gets **deleted on every deploy**! 😱

A volume ensures:
- ✅ Database persists across deployments
- ✅ User data is never lost
- ✅ Chores, points, and progress are saved

---

## 🖱️ Setup Steps (Point & Click)

### 1. Go to Your Railway Project

1. Visit [railway.app](https://railway.app)
2. Click on **"prolific-blessing"** (your project)
3. Click on **"familychores"** service

### 2. Add a Volume

1. Click the **"Settings"** tab
2. Scroll down to **"Volumes"** section
3. Click **"+ Add Volume"** or **"New Volume"**

### 3. Configure the Volume

Fill in:
- **Mount Path:** `/var/www/html/data`
- **Name:** (leave default or name it "familychores-data")
- **Size:** 1 GB (more than enough for database)

Click **"Add"** or **"Create"**

### 4. Redeploy

Railway will automatically redeploy your service with the volume attached.

Wait ~2 minutes for the new deployment to finish.

---

## ✅ Verify It's Working

1. Go to your app URL
2. Create a test chore
3. In Railway, click **"Deployments"**
4. Click **"Redeploy"** (to force a new deployment)
5. Wait for it to finish
6. Check your app - **the test chore should still be there!** ✅

If the chore is still there, your volume is working perfectly!

---

## 🔍 Alternative: Check via Railway Shell

If you're comfortable with terminal commands:

1. In Railway dashboard, go to your service
2. Click **"Deployments"** tab
3. Click the **three dots (•••)** on the latest deployment
4. Click **"Shell"**
5. Run: `ls -la /var/www/html/data`

You should see:
- `app.sqlite` - Your database
- `sessions/` - Session directory

---

## 📊 Volume Size Guidelines

| Families | Chores/Day | Database Size | Recommended Volume |
|----------|------------|---------------|-------------------|
| 1-10 | 50 | ~10 MB | 1 GB |
| 10-100 | 500 | ~100 MB | 2 GB |
| 100-1000 | 5000 | ~1 GB | 5 GB |
| 1000+ | - | Switch to PostgreSQL! | - |

**For SaaS:** Once you hit 100+ families, migrate to PostgreSQL (see SAAS_ROADMAP.md)

---

## 🔄 Backup Strategy

### Automatic Backups (Railway Pro)
- Railway Pro plans include automatic backups
- Restore with one click

### Manual Backups (Free Tier)

**Option 1: Download via Railway Shell**
```bash
# In Railway Shell:
cp /var/www/html/data/app.sqlite /tmp/backup.sqlite

# Then download from Railway volume browser (if available)
```

**Option 2: Add Backup Endpoint** (Recommended)
I can create a `/api/backup.php` that:
- Requires admin authentication
- Exports database as SQL dump
- Downloads it to your computer
- Run this weekly for peace of mind

---

## ⚠️ Important Notes

1. **Volume is per-service** - If you create a new service, add a new volume
2. **Mount path must match** - Use `/var/www/html/data` exactly
3. **Railway automatically persists** - No cron jobs needed
4. **Don't delete the volume** - All data will be lost!

---

## 🚨 If Your Database Gets Deleted

Don't panic! Here's how to recover:

### If You Have a Backup:
1. Upload `app.sqlite` via Railway Shell:
   ```bash
   # Use file upload feature in Shell
   # Or use curl to download from external source
   ```

### If No Backup (Fresh Start):
1. The app will auto-create a new database
2. Default admin credentials will work
3. Data is lost, but app functions normally

**This is why backups are important!** 📦

---

## 🎉 Success!

Once the volume is added:
- ✅ Database persists forever
- ✅ Deploys don't lose data
- ✅ Ready for multi-tenant SaaS

**Next step:** Fix the Apache crash, then we're live! 🚀
