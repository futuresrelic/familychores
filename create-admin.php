<?php
/**
 * Create Admin User
 *
 * SECURITY: Delete this file after creating your admin accounts!
 *
 * This creates new admin users in the database
 */

require_once __DIR__ . '/config/config.php';

// Simple protection
$CREATE_CODE = 'CREATE2024';

$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $code = $_POST['code'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $name = $_POST['name'] ?? '';

    if ($code !== $CREATE_CODE) {
        $message = 'Invalid create code!';
    } elseif (empty($email) || empty($password)) {
        $message = 'Email and password are required!';
    } else {
        try {
            $db = getDb();

            // Check if email already exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $existing = $stmt->fetch();

            if ($existing) {
                $message = "User with email $email already exists! Use the update tool instead.";
            } else {
                // Create new admin user
                $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

                $stmt = $db->prepare("
                    INSERT INTO users (email, password, role, kid_name, total_points, created_at)
                    VALUES (?, ?, 'admin', ?, 0, datetime('now'))
                ");
                $stmt->execute([$email, $hashedPassword, $name ?: 'Admin']);

                $userId = $db->lastInsertId();
                $message = "✅ Admin user created successfully!<br>Email: $email<br>User ID: $userId<br><br>You can now log in!";
                $success = true;
            }
        } catch (Exception $e) {
            $message = 'Error: ' . $e->getMessage();
        }
    }
}

// Show current users
try {
    $db = getDb();
    $stmt = $db->query("SELECT id, email, role, kid_name FROM users ORDER BY role DESC, id ASC");
    $users = $stmt->fetchAll();
} catch (Exception $e) {
    $users = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Admin User</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }
        .info {
            background: #d1ecf1;
            border-left: 4px solid #0dcaf0;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #055160;
        }
        .current-users {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
        }
        .current-users h3 {
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .current-users ul {
            list-style: none;
            padding: 0;
        }
        .current-users li {
            padding: 8px 0;
            color: #555;
            font-size: 14px;
            border-bottom: 1px solid #bbdefb;
        }
        .current-users li:last-child {
            border-bottom: none;
        }
        .admin-badge {
            background: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 8px;
        }
        .kid-badge {
            background: #ff9800;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 8px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .message {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .help {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 14px;
            color: #666;
        }
        small {
            color: #999;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>👤 Create Admin User</h1>

        <div class="warning">
            <strong>⚠️ SECURITY WARNING</strong><br>
            Delete this file immediately after creating your admin accounts!
        </div>

        <?php if (empty($users)): ?>
            <div class="info">
                <strong>ℹ️ No users found!</strong><br>
                Create your first admin account below to get started.
            </div>
        <?php else: ?>
            <div class="current-users">
                <h3>Current Users (<?php echo count($users); ?>):</h3>
                <ul>
                    <?php foreach ($users as $user): ?>
                        <li>
                            📧 <?php echo htmlspecialchars($user['email']); ?>
                            <?php if ($user['role'] === 'admin'): ?>
                                <span class="admin-badge">ADMIN</span>
                            <?php else: ?>
                                <span class="kid-badge">KID</span>
                            <?php endif; ?>
                            <br>
                            <small>Name: <?php echo htmlspecialchars($user['kid_name'] ?: 'N/A'); ?> | ID: <?php echo $user['id']; ?></small>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if ($message): ?>
            <div class="message <?php echo $success ? 'success' : 'error'; ?>">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>

        <form method="POST">
            <div class="form-group">
                <label>Create Code:</label>
                <input type="text" name="code" required placeholder="Enter create code" value="CREATE2024">
            </div>

            <div class="form-group">
                <label>Email Address:</label>
                <input type="email" name="email" required placeholder="admin@example.com">
            </div>

            <div class="form-group">
                <label>Password:</label>
                <input type="password" name="password" required placeholder="Choose a secure password" minlength="6">
                <small>Minimum 6 characters</small>
            </div>

            <div class="form-group">
                <label>Name (optional):</label>
                <input type="text" name="name" placeholder="Your Name">
                <small>Display name for the admin account</small>
            </div>

            <button type="submit">Create Admin Account</button>
        </form>

        <div class="help">
            <strong>Create Code:</strong> <code>CREATE2024</code><br><br>
            <strong>Steps:</strong><br>
            1. Create admin for: <code>futuresrelic@gmail.com</code><br>
            2. Create admin for: <code>jaghri@gmail.com</code><br>
            3. Test login to admin panel<br>
            4. Delete this file!<br><br>
            <strong>After creating admins:</strong><br>
            • You can log in at <code>/admin/</code><br>
            • Add kids through the admin panel<br>
            • Set up chores and rewards
        </div>
    </div>
</body>
</html>
