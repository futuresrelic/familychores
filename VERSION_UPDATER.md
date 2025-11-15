# Version Updater Guide

## What is the Version Updater?

The Version Updater is a simple web tool that increments your app's version number and timestamp. This is **critical** for cache busting - forcing browsers to download fresh CSS and JavaScript files instead of using old cached versions.

## Why You Need This

When you upload new files to your server:
- Browsers cache CSS/JS files for performance
- Without changing the version, users see OLD code
- With version update, users automatically get NEW code

Your app loads files like this:
```html
<script src="kid.js?v=1762931717"></script>
```

When you update the version:
```html
<script src="kid.js?v=1762931999"></script>  ← New timestamp!
```

The browser sees a different URL, so it downloads the fresh file!

## How to Use

### First Time Setup

1. **Change the password** (IMPORTANT!)
   - Open `update-version.php` in a text editor
   - Line 12: Change `'changeme123'` to your own password
   - Upload the modified file

### Every Time You Upload New Code

1. Upload your new files via DreamHost file manager
2. Visit: `https://yourdomain.com/update-version.php`
3. Enter your password
4. Click to update version
5. Done! All users will get fresh files

## What Gets Updated

The tool updates `/version.json`:
```json
{
    "version": "1.0.213",     ← Increments automatically
    "timestamp": 1762931999   ← Current Unix timestamp
}
```

This file is read by:
- `/admin/index.html` - Loads `admin.css?v=timestamp`
- `/kid/index.html` - Loads `kid.css?v=timestamp`
- Service workers for cache management

## Security

The tool is password-protected to prevent unauthorized version bumps.

**Default password**: `changeme123`

**⚠️ CHANGE THIS!** Edit line 12 in `update-version.php`

## When to Update Version

Update the version EVERY time you:
- Fix bugs in CSS or JavaScript
- Add new features
- Change styling
- Modify any frontend code

DON'T need to update if you only:
- Change database data
- Modify PHP backend (unless it affects frontend behavior)

## Troubleshooting

**Users still seeing old version?**
- Make sure you visited update-version.php
- Check version.json was actually updated
- Users may need to hard refresh (Ctrl+Shift+R)
- Close and reopen the app if installed as PWA

**Forgot password?**
- Edit `update-version.php` via file manager
- Change password on line 12
- Save and try again

**Version.json missing?**
- Create it manually:
  ```json
  {
      "version": "1.0.0",
      "timestamp": 1700000000
  }
  ```
- Make sure it's in the root directory

## Manual Version Update

If you prefer, you can edit `version.json` directly:
1. Open `/version.json` via file manager
2. Increment the version number
3. Update timestamp to current time
4. Save

But the web tool is easier! 😊

## Advanced: Bookmarking

You can bookmark the update URL with password:
```
https://yourdomain.com/update-version.php?password=yourpassword
```

This lets you update with one click (keep this bookmark private!)

---

**Remember**: This tool is safe to keep in production. It's password-protected and is essential for managing deployments without SSH access!
