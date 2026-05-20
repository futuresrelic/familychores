-- Family groups
CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'My Family',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table (admin and kids)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'kid')),
    kid_name TEXT,
    total_points INTEGER DEFAULT 0,
    settings TEXT,
    avatar_photo BLOB,
    is_test_account INTEGER DEFAULT 0,
    family_id INTEGER,
    google_sub TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id)
);

-- Devices for kid pairing
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid_user_id INTEGER NOT NULL,
    device_label TEXT,
    pairing_code TEXT UNIQUE,
    device_token TEXT UNIQUE,
    paired_at DATETIME,
    last_seen_at DATETIME,
    FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chores definition
CREATE TABLE IF NOT EXISTS chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    recurrence_type TEXT NOT NULL DEFAULT 'daily' CHECK(recurrence_type IN ('once', 'daily', 'weekly', 'monthly')),
    default_points INTEGER DEFAULT 10,
    requires_approval INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Kid chore assignments
CREATE TABLE IF NOT EXISTS kid_chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid_user_id INTEGER NOT NULL,
    chore_id INTEGER NOT NULL,
    next_due_at DATETIME,
    streak_count INTEGER DEFAULT 0,
    last_completed_at DATETIME,
    FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
    UNIQUE(kid_user_id, chore_id)
);

-- Chore submissions
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid_user_id INTEGER NOT NULL,
    chore_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    note TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    reviewer_id INTEGER,
    points_awarded INTEGER DEFAULT 0,
    FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Quests
CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    target_reward TEXT,
    created_by INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Quest tasks
CREATE TABLE IF NOT EXISTS quest_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quest_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

-- Kid quest progress
CREATE TABLE IF NOT EXISTS kid_quest_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid_user_id INTEGER NOT NULL,
    quest_id INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
    UNIQUE(kid_user_id, quest_id)
);

-- Kid quest task status
CREATE TABLE IF NOT EXISTS kid_quest_task_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid_user_id INTEGER NOT NULL,
    quest_task_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    note TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_task_id) REFERENCES quest_tasks(id) ON DELETE CASCADE
);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    cost_points INTEGER DEFAULT 100,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid_user_id INTEGER NOT NULL,
    reward_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    resolver_id INTEGER,
    FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    FOREIGN KEY (resolver_id) REFERENCES users(id)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER,
    action TEXT NOT NULL,
    meta_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    action TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ip_address, action)
);

-- Themes table (full schema including CSS and animation columns)
CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bg_color TEXT DEFAULT '#4F46E5',
    bg_gradient TEXT DEFAULT 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
    text_color TEXT DEFAULT '#FFFFFF',
    accent_color TEXT DEFAULT '#818CF8',
    border_style TEXT DEFAULT 'solid',
    border_width TEXT DEFAULT '3px',
    border_radius TEXT DEFAULT '15px',
    font_family TEXT DEFAULT 'Quicksand',
    card_bg_color TEXT DEFAULT '#FFFFFF',
    card_opacity REAL DEFAULT 0.95,
    card_blur INTEGER DEFAULT 10,
    card_shadow TEXT DEFAULT '0 8px 32px rgba(0,0,0,0.1)',
    header_bg_color TEXT DEFAULT '#FFFFFF',
    header_opacity REAL DEFAULT 0.85,
    header_blur INTEGER DEFAULT 20,
    nav_bg_color TEXT DEFAULT '#FFFFFF',
    nav_opacity REAL DEFAULT 0.95,
    nav_blur INTEGER DEFAULT 20,
    button_gradient TEXT,
    has_animation INTEGER DEFAULT 0,
    animation_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game configuration (Beat Master notes, Piano waveform, etc.)
CREATE TABLE IF NOT EXISTS game_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type TEXT NOT NULL UNIQUE,
    settings_json TEXT NOT NULL,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Game scores leaderboard
CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kid_user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    difficulty TEXT,
    game_type TEXT DEFAULT 'star_catcher',
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed data: Admin password is 'changeme'
INSERT INTO users (email, password_hash, role, kid_name) VALUES
('admin@example.com', '$2y$10$5K8ljYqgLmgvKKn1lIwuIuTgPxPmR9lVLTWQ5hJKfQVzPfV4FqmXK', 'admin', NULL),
('kid', NULL, 'kid', 'Alex');

INSERT INTO chores (title, description, recurrence_type, default_points, requires_approval, created_by) VALUES
('Make Bed', 'Make your bed neatly every morning', 'daily', 5, 0, 1),
('Clean Room', 'Clean and organize your entire room', 'weekly', 20, 1, 1),
('Do Homework', 'Complete all homework assignments', 'daily', 10, 1, 1);

INSERT INTO kid_chores (kid_user_id, chore_id, next_due_at) VALUES
(2, 1, datetime('now')),
(2, 2, datetime('now')),
(2, 3, datetime('now'));

INSERT INTO quests (title, description, target_reward, created_by, is_active) VALUES
('Waterpark Trip', 'Complete all tasks to earn a trip to the waterpark!', 'Family waterpark visit', 1, 1);

INSERT INTO quest_tasks (quest_id, title, description, points, order_index) VALUES
(1, 'One Week Perfect Attendance', 'Make your bed every day for a week', 30, 1),
(1, 'Help with Dishes', 'Help with dishes 5 times', 20, 2),
(1, 'Read 3 Books', 'Read and report on 3 books', 50, 3);

INSERT INTO rewards (title, description, cost_points, is_active) VALUES
('1 Hour Phone Time', 'Get 1 extra hour of phone/tablet time', 50, 1),
('Choose Dinner', 'Pick what we have for dinner', 30, 1),
('Movie Night', 'Family movie night with your choice', 75, 1);
