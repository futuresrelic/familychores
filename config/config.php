<?php
// Database configuration
define('DB_PATH', __DIR__ . '/../data/app.sqlite');
define('DATA_DIR', __DIR__ . '/../data');

// Session configuration - EXTENDED LIFETIMES
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_lifetime', 2592000); // 30 days
ini_set('session.gc_maxlifetime', 2592000);  // 30 days
date_default_timezone_set('America/New_York');

// Disable output that breaks JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Create data directory
if (!file_exists(DATA_DIR)) {
    @mkdir(DATA_DIR, 0775, true);
}

// Initialize database if missing
if (!file_exists(DB_PATH)) {
    require_once __DIR__ . '/../api/init_db.php';
}

function runMigrations($db) {
    // Families table (multi-family support)
    $db->exec("CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL DEFAULT 'My Family',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Ensure a default family exists for original users (id=1)
    $count = $db->query("SELECT COUNT(*) FROM families")->fetchColumn();
    if ($count == 0) {
        $db->exec("INSERT INTO families (id, name) VALUES (1, 'Original Family')");
    }

    // Add missing columns to users table
    $cols = array_column($db->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_ASSOC), 'name');
    if (!in_array('settings', $cols))         $db->exec("ALTER TABLE users ADD COLUMN settings TEXT");
    if (!in_array('avatar_photo', $cols))     $db->exec("ALTER TABLE users ADD COLUMN avatar_photo BLOB");
    if (!in_array('is_test_account', $cols))  $db->exec("ALTER TABLE users ADD COLUMN is_test_account INTEGER DEFAULT 0");
    if (!in_array('family_id', $cols))        $db->exec("ALTER TABLE users ADD COLUMN family_id INTEGER DEFAULT 1");
    if (!in_array('google_sub', $cols))       $db->exec("ALTER TABLE users ADD COLUMN google_sub TEXT");

    // Assign all existing users to family 1 if they have no family_id
    $db->exec("UPDATE users SET family_id = 1 WHERE family_id IS NULL");

    // Add missing columns to rewards table
    $rewCols = array_column($db->query("PRAGMA table_info(rewards)")->fetchAll(PDO::FETCH_ASSOC), 'name');
    if (!in_array('created_by', $rewCols))  $db->exec("ALTER TABLE rewards ADD COLUMN created_by INTEGER");
    if (!in_array('family_id', $rewCols))   $db->exec("ALTER TABLE rewards ADD COLUMN family_id INTEGER DEFAULT 1");
    $db->exec("UPDATE rewards SET family_id = 1 WHERE family_id IS NULL");

    // Add family_id to chores and quests tables
    $choreCols = array_column($db->query("PRAGMA table_info(chores)")->fetchAll(PDO::FETCH_ASSOC), 'name');
    if (!in_array('family_id', $choreCols)) $db->exec("ALTER TABLE chores ADD COLUMN family_id INTEGER DEFAULT 1");
    $db->exec("UPDATE chores SET family_id = 1 WHERE family_id IS NULL");

    $questCols = array_column($db->query("PRAGMA table_info(quests)")->fetchAll(PDO::FETCH_ASSOC), 'name');
    if (!in_array('family_id', $questCols)) $db->exec("ALTER TABLE quests ADD COLUMN family_id INTEGER DEFAULT 1");
    $db->exec("UPDATE quests SET family_id = 1 WHERE family_id IS NULL");

    // Migrate chores table: add recurrence_type if it only has the old is_recurring/frequency columns
    if (!in_array('recurrence_type', $choreCols)) {
        $db->exec("ALTER TABLE chores ADD COLUMN recurrence_type TEXT NOT NULL DEFAULT 'daily'");
        if (in_array('frequency', $choreCols)) {
            $db->exec("UPDATE chores SET recurrence_type = CASE WHEN frequency IN ('daily','weekly','monthly','once') THEN frequency ELSE 'daily' END");
        }
    }

    // Add themes table (full schema)
    $db->exec("CREATE TABLE IF NOT EXISTS themes (
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
    )");

    // Add any columns that might be missing from older themes tables
    $themeCols = array_column($db->query("PRAGMA table_info(themes)")->fetchAll(PDO::FETCH_ASSOC), 'name');
    $themeColsNeeded = [
        'card_bg_color'   => "ALTER TABLE themes ADD COLUMN card_bg_color TEXT DEFAULT '#FFFFFF'",
        'card_opacity'    => "ALTER TABLE themes ADD COLUMN card_opacity REAL DEFAULT 0.95",
        'card_blur'       => "ALTER TABLE themes ADD COLUMN card_blur INTEGER DEFAULT 10",
        'card_shadow'     => "ALTER TABLE themes ADD COLUMN card_shadow TEXT DEFAULT '0 8px 32px rgba(0,0,0,0.1)'",
        'header_bg_color' => "ALTER TABLE themes ADD COLUMN header_bg_color TEXT DEFAULT '#FFFFFF'",
        'header_opacity'  => "ALTER TABLE themes ADD COLUMN header_opacity REAL DEFAULT 0.85",
        'header_blur'     => "ALTER TABLE themes ADD COLUMN header_blur INTEGER DEFAULT 20",
        'nav_bg_color'    => "ALTER TABLE themes ADD COLUMN nav_bg_color TEXT DEFAULT '#FFFFFF'",
        'nav_opacity'     => "ALTER TABLE themes ADD COLUMN nav_opacity REAL DEFAULT 0.95",
        'nav_blur'        => "ALTER TABLE themes ADD COLUMN nav_blur INTEGER DEFAULT 20",
        'button_gradient' => "ALTER TABLE themes ADD COLUMN button_gradient TEXT",
        'has_animation'   => "ALTER TABLE themes ADD COLUMN has_animation INTEGER DEFAULT 0",
        'animation_type'  => "ALTER TABLE themes ADD COLUMN animation_type TEXT",
    ];
    foreach ($themeColsNeeded as $col => $sql) {
        if (!in_array($col, $themeCols)) $db->exec($sql);
    }

    // Add game_scores table
    $db->exec("CREATE TABLE IF NOT EXISTS game_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kid_user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        difficulty TEXT,
        game_type TEXT DEFAULT 'star_catcher',
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kid_user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Add game_settings table
    $db->exec("CREATE TABLE IF NOT EXISTS game_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_type TEXT NOT NULL UNIQUE,
        settings_json TEXT NOT NULL,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id)
    )");
}

function getDb() {
    try {
        $db = new PDO('sqlite:' . DB_PATH);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        // CRITICAL: Increase timeout and enable WAL mode
        $db->exec('PRAGMA busy_timeout = 10000');  // 10 seconds
        $db->exec('PRAGMA journal_mode = WAL');    // Write-Ahead Logging (prevents locks)
        $db->exec('PRAGMA synchronous = NORMAL');  // Faster writes

        runMigrations($db);

        return $db;
    } catch (PDOException $e) {
        error_log('Database connection failed: ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['ok' => false, 'error' => 'Database connection failed']);
        exit;
    }
}

function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        // Use a consistent session save path
        $sessionPath = DATA_DIR . '/sessions';
        if (!file_exists($sessionPath)) {
            @mkdir($sessionPath, 0700, true);
        }
        session_save_path($sessionPath);
        session_start();
    }
}

// FIXED: When assigning chores, make them available immediately
// The recurrence interval will be applied AFTER the chore is completed
function calculateNextDue($recurrenceType) {
    // Return current time so chores are available to complete right away
    return date('Y-m-d H:i:s');
}
?>
