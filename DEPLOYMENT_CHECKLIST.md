# FamilyChores - DreamHost Deployment Checklist

## BEFORE YOU UPLOAD TO DREAMHOST

### ✅ Step 1: Delete ALL Debug/Test Files
**CRITICAL**: These files MUST be deleted before uploading to production:

```bash
# Delete these files from your local copy before uploading:
api-debug.php
backup-db.php
check-endpoints.php
check-errors.php
check-syntax.php
check-users-table.php
cleanup-test-data.php
debug-redemptions.php
diagnose-admin-error.php
diagnose-completion.php
diagnose-list-chores.php
direct-api-test.php
direct-test-install.php
direct-test.php
find-missing-breaks.php
fix-chore-availability.php
fix-everything.php
fix-rewards-now.php
fix-rewards-schema.php
generate-icons.php
generate-icons-from-png.php
reset-game-scores.php
setup-new-family.php
setup-themes-table.php
syntax-check.php
test-api-call.php
test-api-login.php
test-complete.php
test-game-db.php
test-presets-api.php
test-session.php
test-wizard-api.php
unlock-database.php
update-schema.php
update-themes-advanced-css.php
update-themes-with-animations.php
api/test.php
```

### ✅ Step 2: Change Default Admin Password

1. After first deployment, immediately login with:
   - Email: `admin@example.com`
   - Password: `changeme`

2. Go to Settings → Change Password
3. Set a STRONG password (at least 12 characters, mix of letters, numbers, symbols)

### ✅ Step 3: File Structure to Upload

Your production server should only have these folders/files:

```
/
├── admin/              ✅ (Admin panel)
├── api/                ✅ (API files - but DELETE api/test.php)
├── assets/             ✅ (Images, icons)
├── config/             ✅ (Configuration)
│   └── .htaccess       ✅ (NEW - blocks web access)
├── data/               ✅ (Database - will be auto-created)
│   └── .htaccess       ✅ (NEW - blocks web access)
├── kid/                ✅ (Kid panel)
├── .htaccess           ✅ (NEW - security settings)
├── chore-presets.json  ✅ (Chore templates)
├── index.html          ✅ (Landing page)
```

### ✅ Step 4: Set Permissions on DreamHost

After uploading via their file manager:

1. **Folders**: Set to `755` (usually default)
   - `/data/` folder
   - `/config/` folder
   - All other folders

2. **Files**: Set to `644` (usually default)
   - All PHP files
   - All HTML files
   - All CSS/JS files

3. **Database**: The `/data/app.sqlite` file will be created automatically
   - If you need to set it manually: `666` or `664`

### ✅ Step 5: Verify Security

After deployment, test these URLs (they should all be BLOCKED):

- `https://yourdomain.com/data/app.sqlite` ❌ Should show 403 Forbidden
- `https://yourdomain.com/config/config.php` ❌ Should show 403 Forbidden
- `https://yourdomain.com/api-debug.php` ❌ Should show 404 (file deleted)
- `https://yourdomain.com/test-anything.php` ❌ Should show 404 (files deleted)

These should work:
- `https://yourdomain.com/` ✅ Landing page
- `https://yourdomain.com/admin/` ✅ Admin login
- `https://yourdomain.com/kid/` ✅ Kid pairing screen

### ✅ Step 6: First Time Setup

1. Login to admin panel
2. Change admin password (Settings tab)
3. Go to Setup Wizard tab
4. Add your kids
5. Generate pairing codes for their devices
6. Set up chores and rewards

## DreamHost Specific Notes

### Upload Method
Since you're using the DreamHost file manager:
1. Download this project as a ZIP from GitHub
2. Extract it on your computer
3. **DELETE all the test/debug files listed above**
4. **ADD the new .htaccess files** (they're in this repo now)
5. ZIP it back up (or upload files directly)
6. Upload to your DreamHost public folder

### Database Location
- SQLite database will be created at `/data/app.sqlite`
- This folder is protected by .htaccess
- DreamHost supports SQLite on shared hosting ✅

### PHP Version
- Make sure DreamHost is using PHP 7.4 or higher
- Check in DreamHost panel: Websites → Manage → PHP Version

### HTTPS
- Enable "Secure Hosting" (free Let's Encrypt SSL) in DreamHost panel
- Your app should always use HTTPS

## Troubleshooting

### "Database connection failed"
- Check that `/data/` folder has write permissions (755)
- The database will be auto-created on first access

### Admin login not working
- Clear your browser cookies
- Make sure you're using the correct default credentials
- Check browser console for errors

### Kid pairing not working
- Check that cookies are enabled
- Try in a private/incognito window first
- Make sure the pairing code is correct (case-sensitive)

## Maintenance

### Backing Up Your Database
You can download `/data/app.sqlite` through DreamHost file manager
- Do this regularly (weekly recommended)
- Keep backups in a safe place

### Updating the App
When you update code:
1. **Download current `/data/app.sqlite`** (backup!)
2. **Upload new files** via DreamHost file manager
3. **⚠️ CRITICAL: Update version**
   - Visit `https://yourdomain.com/update-version.php`
   - Enter password (default: `changeme123` - change this!)
   - This forces browsers to download fresh code
4. **Put back the `/data/` folder** with your database if needed
5. **Test** the app to verify changes loaded

**Why update version?** Without it, users see old cached files and won't get your updates!

See `VERSION_UPDATER.md` for detailed instructions.

## Security Best Practices

1. ✅ Never upload debug/test files to production
2. ✅ Use strong admin passwords
3. ✅ Regularly backup your database
4. ✅ Keep DreamHost PHP version up to date
5. ✅ Monitor the audit log in the app
6. ✅ Revoke old pairing codes you're not using

## Support

If you run into issues:
1. Check the browser console (F12) for JavaScript errors
2. Check DreamHost error logs (in their panel)
3. Make sure all .htaccess files are uploaded
4. Verify file permissions are correct

---

**REMEMBER**: Delete all test/debug files BEFORE uploading to production! 🔒
