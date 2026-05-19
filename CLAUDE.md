# FamilyChores — Claude Code Handoff Document

This file gives any new Claude session full context on the project so we don't repeat history.

---

## Project Overview

**FamilyChores** is a family chore-tracking web app with:
- **Admin panel** (`/admin/`) — parent/admin manages kids, chores, quests, rewards, themes, submissions
- **Kid panel** (`/kid/`) — kids log in via a pairing code on their device, complete chores, play games, earn points
- **API** (`/api/api.php`) — single PHP file handling all JSON API calls via an `action` parameter
- **Database** — SQLite at `/data/app.sqlite`, managed via PDO in `config/config.php`

**Live deployment:** Railway (Docker/PHP 8.2+Apache), branch `claude/complete-railway-migration-CraiD`

**Owner:** futuresrelic@gmail.com (admin), jaghri@gmail.com (second admin)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.2, PDO SQLite |
| Frontend | Vanilla JS (no framework), CSS |
| Database | SQLite 3 (WAL mode) |
| Hosting | Railway (Docker) |
| Container | php:8.2-apache, custom Dockerfile |
| Version control | GitHub: `futuresrelic/familychores` |

---

## Repository Branches

| Branch | Purpose |
|--------|---------|
| `main` | Original code (DreamHost era, do NOT deploy Railway from this) |
| `claude/familychores-setup-018zyGX7YhS791TNkmV4SdKw` | First Railway migration branch (superseded) |
| `claude/complete-railway-migration-CraiD` | **Active Railway branch — always work here** |

Railway is configured to deploy from `claude/complete-railway-migration-CraiD`. Push to this branch to deploy.

---

## File Structure

```
/
├── Dockerfile                  # Railway build — php:8.2-apache
├── docker-entrypoint.sh        # Startup: sets permissions, fixes Apache port, starts server
├── railway.json                # Railway deploy config
├── health.php                  # Health check endpoint
├── version.json                # App version (bumped by update-version.php)
├── update-version.php          # Web UI to bump cache-busting version number
├── create-admin.php            # One-time: create admin user (delete after use)
├── reset-admin-password.php    # One-time: reset forgotten password (delete after use)
│
├── config/
│   └── config.php              # DB path, session config, getDb(), runMigrations()
│
├── api/
│   ├── api.php                 # All API actions (single file, ~2200 lines)
│   ├── schema.sql              # DB schema for fresh databases
│   └── init_db.php             # Creates DB from schema.sql if missing
│
├── admin/
│   ├── index.html              # Admin panel SPA
│   ├── admin.js                # All admin JS logic (~2200 lines)
│   └── admin.css               # Admin styles
│
├── kid/
│   ├── index.html              # Kid panel SPA
│   ├── kid.js                  # All kid JS logic (~5600 lines)
│   └── kid.css                 # Kid styles
│
├── data/
│   ├── app.sqlite              # SQLite database (committed; Railway volume may override)
│   └── sessions/               # PHP session files
│
└── chore-presets.json          # Preset chore/reward packages for the Setup Wizard
```

---

## Database Schema

Tables in `api/schema.sql` (always keep this in sync with `runMigrations()`):

| Table | Purpose |
|-------|---------|
| `users` | Admins and kids. Columns: `id, email, password_hash, role, kid_name, total_points, settings, avatar_photo, is_test_account` |
| `devices` | Kid device pairing tokens |
| `chores` | Chore definitions. Key column: `recurrence_type` (not the old `is_recurring`/`frequency`) |
| `kid_chores` | Which chores are assigned to which kids |
| `submissions` | Kid chore completion submissions awaiting admin approval |
| `quests` | Multi-task quest definitions |
| `quest_tasks` | Individual tasks within a quest |
| `kid_quest_progress` | Quest progress per kid |
| `kid_quest_task_status` | Individual task submission statuses |
| `rewards` | Redeemable rewards. Columns: `id, title, description, cost_points, is_active, created_by` |
| `redemptions` | Reward redemption requests |
| `themes` | Visual themes for kid panel (full CSS columns + animation) |
| `game_scores` | Leaderboard scores from kid mini-games |
| `audit_log` | Admin action log |
| `rate_limits` | Login brute-force protection |

### Auto-Migration (IMPORTANT)
`config/config.php` has a `runMigrations($db)` function that runs on every `getDb()` call. It safely adds any missing tables/columns with `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN`. **When you add a new column to schema.sql, also add it to `runMigrations()`.**

---

## API Design

All requests go to `POST /api/api.php` with JSON body `{ "action": "...", ...params }`.  
Some read-only actions also accept `GET` with `?action=...`.

Key actions:

| Action | Who | Description |
|--------|-----|-------------|
| `admin_login` | Admin | Email + password login |
| `admin_logout` | Admin | Clear session |
| `admin_change_password` | Admin | Change own password |
| `list_kids` | Admin | Returns `[{id, kid_name, total_points, ...}]` |
| `list_chores` | Admin | All chores with assignment count |
| `create_chore` | Admin | Fields: `title, description, recurrence_type, default_points, requires_approval` |
| `list_submissions` | Admin | Pending/approved/rejected chore submissions |
| `approve_submission` | Admin | Awards points, resets due date |
| `list_quests` | Admin | Quests with task count |
| `create_quest_task` | Admin | Add task to quest |
| `list_rewards` | Admin/Kid | Active rewards list |
| `create_reward` | Admin | Fields: `title, description, cost_points` |
| `point_economics` | Admin | Stats: chore earning potential vs reward costs |
| `kid_pair` | Kid | Pair device with pairing code |
| `kid_me` | Kid | Get kid profile and points |
| `kid_list_chores` | Kid | Chores available for completion |
| `kid_complete_chore` | Kid | Submit chore for approval (or auto-approve) |
| `save_kid_settings` | Kid | Save theme, avatar, font preferences |
| `submit_game_score` | Kid | Record game score |

---

## Authentication

- **Admin:** Email + bcrypt password, PHP session (`$_SESSION['admin_id']`)
- **Kid:** Pairing code → device token stored in cookie (`kid_token`), referenced via `devices` table

---

## Railway Deployment

### How it works
1. Railway watches `claude/complete-railway-migration-CraiD` branch
2. On push → builds Docker image from `Dockerfile`
3. Container starts via `docker-entrypoint.sh`
4. A **persistent volume** is mounted at `/var/www/html/data` to keep the SQLite DB across deploys
5. On first request, if DB doesn't exist, `config.php` creates it from `schema.sql`

### To deploy a fix
```bash
git add <files>
git commit -m "description"
git push -u origin claude/complete-railway-migration-CraiD
```
Railway auto-redeploys within ~2 minutes.

### Environment
- Port: Railway sets `$PORT` env var; `docker-entrypoint.sh` configures Apache to use it
- PHP session path: `/var/www/html/data/sessions/`
- No environment variables required for basic operation (SQLite is self-contained)

### Utility pages (deploy, use once, ideally remove after)
- `/create-admin.php` — create admin account (code: `CREATE2024`)
- `/reset-admin-password.php` — reset forgotten password (code: `RESET2024`)
- `/update-version.php` — bump version number to bust browser caches (password-protected)

---

## Known Architecture Decisions

1. **Single-file API** — `api/api.php` handles everything in one switch/case block. It's long but simple.
2. **No framework** — vanilla PHP and vanilla JS intentionally, for simplicity and easy DreamHost compatibility.
3. **SQLite** — chosen for zero-config hosting. Migration path to PostgreSQL is in `SAAS_ROADMAP.md` if traffic grows.
4. **Version busting** — all JS/CSS files have `?v=TIMESTAMP` appended (see `version.json`). Use `/update-version.php` after deploying new code.
5. **Chore recurrence** — the old schema used `is_recurring + frequency`; the current code uses `recurrence_type` (`daily/weekly/monthly/once`). Migration handled in `runMigrations()`.

---

## Bugs Fixed (Session History)

| Date | Bug | Fix |
|------|-----|-----|
| 2026-05 | `create-admin.php` and `reset-admin-password.php` used wrong column name `password` instead of `password_hash` | Fixed both files |
| 2026-05 | `themes` table missing from schema (created via one-off script on DreamHost) | Added to `schema.sql` + `runMigrations()` |
| 2026-05 | `game_scores` table missing from schema | Added to `schema.sql` + `runMigrations()` |
| 2026-05 | `users` missing `settings`, `avatar_photo`, `is_test_account` columns | Added to migration |
| 2026-05 | `rewards` missing `created_by` column | Added to schema + migration |
| 2026-05 | Quest titles with apostrophes (e.g. "Wendy's") broke `onclick` JS — SyntaxError | Replaced inline string passing with `window._questTitles` id→title map |
| 2026-05 | Setup Wizard showed "Kid #2" instead of real names | `kid.name` → `kid.kid_name` (API returns `kid_name`) |
| 2026-05 | Families tab had no handler, `showAddFamilyModal()` undefined | Added `loadFamilies()`, `showAddFamilyModal()`, and `'families'` case in `loadTabData()` |
| 2026-05 | Double chore/quest submission (success + "already completed") | Removed duplicate `.onclick` event binding (`{ once: true }` added) |
| 2026-05 | Theme save error `theme is not defined` at kid.js:1192 | `theme.animationType` → `selectedTheme.animationType` |

---

## Planned Next Phases (from SAAS_ROADMAP.md)

| Phase | Feature |
|-------|---------|
| Phase 2 | Family Groups — multi-family support, each family manages their own data |
| Phase 3 | Google Sign-In for admin and family onboarding |
| Phase 4 | Stripe billing for SaaS model |
| Phase 5 | Push notifications |
| Phase 6 | PostgreSQL migration for scale |

---

## Admin Panel Tabs (current)

Dashboard → Family Board → Point Economics → Kids → Chores → Quests → Rewards → Submissions → Quest Tasks → Themes → Redemptions → Families → Settings → Admins → Setup Wizard

---

## Kid Panel Features

- Chore list with completion button
- Quest progress tracking
- Rewards redemption store
- Three mini-games: Star Catcher, Math Quest, Beat Master
- Leaderboard
- Themes (visual customization)
- Settings (avatar, font, name color)
- PWA (installable, offline support via service worker)

---

## Important Notes for Future Claude Sessions

- **Never push to `main`** — Railway deploys from `claude/complete-railway-migration-CraiD`
- **Always update both** `schema.sql` AND `runMigrations()` when adding DB columns
- **Quest task functions** use ID-only signatures — titles come from `window._questTitles` map to avoid apostrophe injection
- **Kid name field** in API responses is `kid_name`, not `name`
- **Chore recurrence** field is `recurrence_type`, not `is_recurring` or `frequency`
- The `data/app.sqlite` committed in git is the DreamHost production database. Railway uses the volume instead when attached.
