<?php
/**
 * Admin Password Reset Utility
 *
 * SECURITY: Delete this file after use!
 *
 * Usage:
 * 1. Upload to your web server
 * 2. Visit in browser: https://yourdomain.com/reset-admin-password.php
 * 3. Enter new password
 * 4. DELETE THIS FILE immediately after resetting
 */

require_once __DIR__ . '/config/config.php';

// Simple protection - change this to something random before uploading
$RESET_CODE = 'RESET2024';

$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $code = $_POST['code'] ?? '';
    $email = $_POST['email'] ?? '';
    $newPassword = $_POST['password'] ?? '';

    if ($code !== $RESET_CODE) {
        $message = 'Invalid reset code!';
    } elseif (empty($email) || empty($newPassword)) {
        $message = 'Email and password are required!';
    } else {
        try {
            $db = getDb();

            // Check if admin exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'admin'");
            $stmt->execute([$email]);
            $admin = $stmt->fetch();

            if (!$admin) {
                $message = 'Admin user not found with that email!';
            } else {
                // Update password
                $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
                $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->execute([$hashedPassword, $admin['id']]);

                $message = '✅ Password reset successful! You can now log in with your new password.';
                $success = true;
            }
        } catch (Exception $e) {
            $message = 'Error: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Admin Password</title>
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
            max-width: 500px;
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
        .help strong {
            color: #333;
            display: block;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Reset Admin Password</h1>

        <div class="warning">
            <strong>⚠️ SECURITY WARNING</strong><br>
            Delete this file immediately after resetting your password!
        </div>

        <?php if ($message): ?>
            <div class="message <?php echo $success ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <?php if ($success): ?>
            <p style="margin: 20px 0; color: #666;">
                <strong>Next steps:</strong><br>
                1. Log in with your new password<br>
                2. Delete this file: <code>reset-admin-password.php</code>
            </p>
        <?php else: ?>
            <form method="POST">
                <div class="form-group">
                    <label>Reset Code:</label>
                    <input type="text" name="code" required placeholder="Enter reset code">
                </div>

                <div class="form-group">
                    <label>Admin Email:</label>
                    <input type="email" name="email" required placeholder="your@email.com">
                </div>

                <div class="form-group">
                    <label>New Password:</label>
                    <input type="password" name="password" required placeholder="Enter new password" minlength="6">
                </div>

                <button type="submit">Reset Password</button>
            </form>

            <div class="help">
                <strong>Need the reset code?</strong>
                Open this file in a text editor and find the $RESET_CODE variable at the top.
                Default is: <code>RESET2024</code>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
