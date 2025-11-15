# FamilyChores App 🏠✨

A family chore management system with separate Admin and Kid panels. Track chores, earn points, complete quests, and redeem rewards!

## Features

### Admin Panel
- Manage kids and their chore assignments
- Create and manage chores with point values
- Set up quests with multi-step tasks
- Create rewards kids can redeem
- Review and approve chore submissions
- Track family progress with dashboard and leaderboards
- Point economics analysis
- Theme customization
- Setup wizard for quick onboarding

### Kid Panel
- View and complete assigned chores
- Track active quests and progress
- Earn points with streak bonuses
- Redeem rewards from the shop
- Play games (Star Catcher, Math Quest, Beat Master)
- Customize avatar and theme
- View completion history
- Works offline (PWA)

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: PHP (7.4+)
- **Database**: SQLite
- **Architecture**: Progressive Web App (PWA)

## Project Structure

```
familychores/
├── admin/              # Admin panel interface
│   ├── index.html
│   ├── admin.css
│   ├── admin.js
│   ├── manifest.json
│   └── sw.js          # Service worker
├── kid/               # Kid panel interface
│   ├── index.html
│   ├── kid.css
│   ├── kid.js
│   ├── manifest.json
│   └── sw.js
├── api/               # Backend API
│   ├── api.php        # Main API endpoint
│   ├── init_db.php    # Database initialization
│   ├── schema.sql     # Database schema
│   ├── scheduler.php  # Background tasks
│   └── version.php    # Version management
├── config/            # Configuration
│   └── config.php     # Database & session config
├── assets/            # Static assets
│   ├── admin-icon-*.png
│   ├── kid-icon-*.png
│   └── avatars/       # Avatar images
├── data/              # Database storage (auto-created)
│   ├── app.sqlite     # Main database
│   └── sessions/      # PHP sessions
├── index.html         # Landing page
└── chore-presets.json # Preset chore templates
```

## Installation (DreamHost)

### Prerequisites
- DreamHost shared hosting account
- PHP 7.4 or higher
- Web-accessible directory

### Deployment Steps

1. **Clean Up Development Files**
   - See `DELETE_THESE_FILES.txt` for files to remove
   - Delete ALL test/debug/diagnostic files
   - These are for development only and pose security risks

2. **Prepare Files**
   - Download the project as ZIP from GitHub
   - Extract it locally
   - Delete files listed in `DELETE_THESE_FILES.txt`
   - Ensure `.htaccess` files are included

3. **Upload to DreamHost**
   - Via File Manager: Upload all files to your web directory
   - Via FTP: Upload to public_html or your domain folder

4. **Set Permissions** (usually automatic)
   - Folders: 755
   - Files: 644
   - `/data/` folder: 755 (must be writable)

5. **First Login**
   - Navigate to `https://yourdomain.com/admin/`
   - Login with default credentials:
     - Email: `admin@example.com`
     - Password: `changeme`
   - **IMMEDIATELY** change password in Settings

6. **Initial Setup**
   - Go to Setup Wizard tab
   - Add your kids
   - Create chores and rewards using presets
   - Generate pairing codes for kid devices

7. **Pair Kid Devices**
   - On kid's device: Go to `https://yourdomain.com/kid/`
   - Enter pairing code from admin panel
   - Customize avatar and theme

## Security Features

- ✅ Password hashing (bcrypt)
- ✅ Session management with extended lifetime
- ✅ Rate limiting on login attempts
- ✅ CSRF protection via same-origin policy
- ✅ SQL injection prevention (prepared statements)
- ✅ Input sanitization
- ✅ Audit logging
- ✅ .htaccess protection for sensitive directories
- ✅ Database access blocked via web

## Default Admin Credentials

**⚠️ CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN ⚠️**

- Email: `admin@example.com`
- Password: `changeme`

## Database Schema

The app uses SQLite with the following main tables:
- `users` - Admin and kid accounts
- `chores` - Chore definitions
- `kid_chores` - Chore assignments
- `submissions` - Chore completion submissions
- `quests` - Quest definitions
- `quest_tasks` - Quest task items
- `rewards` - Available rewards
- `redemptions` - Reward redemption requests
- `devices` - Kid device pairings
- `audit_log` - System activity log
- `game_scores` - Game leaderboards

## API Endpoints

All API calls go through `/api/api.php` with JSON payloads.

### Admin Actions
- `admin_login` - Admin authentication
- `admin_logout` - End admin session
- `admin_me` - Get current admin info
- `create_kid` / `list_kids` / `delete_kid` - Kid management
- `create_chore` / `list_chores` / `update_chore` - Chore management
- `create_quest` / `list_quests` - Quest management
- `create_reward` / `list_rewards` - Reward management
- `list_submissions` / `review_submission` - Submission review
- And many more...

### Kid Actions
- `pair_device` - Device pairing
- `kid_me` - Get kid info
- `list_kid_chores` - Get assigned chores
- `submit_chore` - Submit chore completion
- `list_kid_quests` - Get active quests
- `redeem_reward` - Request reward redemption
- `save_game_score` - Save game scores

## Features Details

### Chore System
- Daily, weekly, monthly, or one-time chores
- Point values and streak bonuses
- Photo upload for proof
- Admin approval workflow
- Automatic recurrence after completion

### Quest System
- Multi-step tasks
- Progress tracking
- Target reward motivation
- Visual progress indicators

### Reward Shop
- Point-based economy
- Approval workflow
- Purchase history tracking

### Games
- **Star Catcher**: Tap falling stars for points
- **Math Quest**: Solve math problems quickly
- **Beat Master**: Memory pattern game
- Difficulty levels (easy, medium, hard)
- Leaderboards with time filters

### Customization
- Custom avatars (upload or emoji)
- Name styling (font, color, size)
- Themes (12 preset themes)
- Border styles

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS/macOS)
- Firefox
- Mobile browsers (full PWA support)

## PWA Features

- Install as app on any device
- Offline functionality
- Push notifications (when supported)
- App-like experience
- Automatic updates

## Backup & Maintenance

### Backing Up
Download `/data/app.sqlite` regularly via DreamHost file manager.
Keep backups in a safe location.

### Updating
1. Backup database
2. Upload new code files
3. Restore database to `/data/` folder
4. Clear browser cache on all devices

### Database Maintenance
The app automatically:
- Cleans up old pairing codes
- Manages session expiration
- Updates streak counts
- Schedules recurring chores

## Troubleshooting

### Database Connection Issues
- Check `/data/` folder exists and is writable (755)
- Verify `/data/.htaccess` is in place
- Database auto-creates on first access

### Login Issues
- Clear browser cookies/cache
- Try incognito/private mode
- Verify correct credentials
- Check browser console for errors

### Pairing Issues
- Ensure pairing code is exact (case-sensitive)
- Generate new code if expired
- Check that cookies are enabled
- Try different browser

### Display Issues
- Clear browser cache (Ctrl+Shift+R)
- Check for JavaScript errors in console (F12)
- Verify all CSS/JS files uploaded correctly

## Support & Contributing

This is a self-hosted family app. Customize as needed for your family!

## License

Personal/Family use. Not for commercial redistribution.

---

**Need Help?** Check `DEPLOYMENT_CHECKLIST.md` for detailed deployment steps.
