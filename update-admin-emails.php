<?php
/**
 * Admin Email Updater
 *
 * SECURITY: Delete this file after use!
 *
 * This updates admin email addresses in the database
 */

require_once __DIR__ . '/config/config.php';

// Simple protection - change this before uploading
$UPDATE_CODE = 'UPDATE2024';

$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $code = $_POST['code'] ?? '';
    $oldEmail = $_POST['old_email'] ?? '';
    $newEmail = $_POST['new_email'] ?? '';

    if ($code !== $UPDATE_CODE) {
        $message = 'Invalid update code!';
    } elseif (empty($newEmail)) {
        $message = 'New email is required!';
    } else {
        try {
            $db = getDb();

            // If old email provided, update that specific admin
            if (!empty($oldEmail)) {
                $stmt = $db->prepare("UPDATE users SET email = ? WHERE email = ? AND role = 'admin'");
                $stmt->execute([$newEmail, $oldEmail]);
                $message = "✅ Updated admin email from $oldEmail to $newEmail";
            } else {
                // Otherwise, update the first admin found
                $stmt = $db->prepare("UPDATE users SET email = ? WHERE role = 'admin' LIMIT 1");
                $stmt->execute([$newEmail]);
                $message = "✅ Updated first admin email to $newEmail";
            }

            $success = true;
        } catch (Exception $e) {
            $message = 'Error: ' . $e->getMessage();
        }
    }
}

// Show current admins
try {
    $db = getDb();
    $stmt = $db->query("SELECT id, email, role FROM users WHERE role = 'admin'");
    $admins = $stmt->fetchAll();
} catch (Exception $e) {
    $admins = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update Admin Emails</title>
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
        .current-admins {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .current-admins h3 {
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .current-admins ul {
            list-style: none;
            padding: 0;
        }
        .current-admins li {
            padding: 8px 0;
            color: #555;
            font-family: monospace;
            font-size: 14px;
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
        <h1>📧 Update Admin Emails</h1>

        <div class="warning">
            <strong>⚠️ SECURITY WARNING</strong><br>
            Delete this file immediately after updating emails!
        </div>

        <?php if (!empty($admins)): ?>
            <div class="current-admins">
                <h3>Current Admin Users:</h3>
                <ul>
                    <?php foreach ($admins as $admin): ?>
                        <li>📧 <?php echo htmlspecialchars($admin['email']); ?> (ID: <?php echo $admin['id']; ?>)</li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if ($message): ?>
            <div class="message <?php echo $success ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <?php if ($success): ?>
            <p style="margin: 20px 0; color: #666;">
                <strong>Next steps:</strong><br>
                1. Test login with the new email<br>
                2. Delete this file: <code>update-admin-emails.php</code><br>
                3. Or update another admin email below
            </p>
        <?php endif; ?>

        <form method="POST">
            <div class="form-group">
                <label>Update Code:</label>
                <input type="text" name="code" required placeholder="Enter update code">
            </div>

            <div class="form-group">
                <label>Old Email (optional):</label>
                <input type="email" name="old_email" placeholder="Leave empty to update first admin">
                <small>Leave blank to update the first admin found, or specify which one to update</small>
            </div>

            <div class="form-group">
                <label>New Email:</label>
                <input type="email" name="new_email" required placeholder="new@email.com">
            </div>

            <button type="submit">Update Admin Email</button>
        </form>

        <div class="help">
            <strong>Need the update code?</strong><br>
            Default code: <code>UPDATE2024</code><br><br>
            <strong>Examples:</strong><br>
            • Update first admin: Leave "Old Email" blank, enter new email<br>
            • Update specific admin: Enter old email and new email<br>
            • Update multiple admins: Run this multiple times
        </div>
    </div>
</body>
</html>
