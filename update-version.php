<?php
/**
 * Version Updater for FamilyChores
 *
 * This tool increments the version number and timestamp in version.json
 * Use this after uploading new files to bust browser caches
 *
 * IMPORTANT: Keep this file in production - it's needed for version management!
 */

// Simple password protection (change this!)
$UPDATE_PASSWORD = 'changeme123';

// Check if password is provided
$providedPassword = $_GET['password'] ?? $_POST['password'] ?? '';

if ($providedPassword !== $UPDATE_PASSWORD) {
    http_response_code(401);
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Version Updater - Password Required</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                max-width: 500px;
                margin: 100px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .box {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { margin-top: 0; color: #333; }
            input {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                border: 2px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
            }
            button {
                width: 100%;
                padding: 12px;
                background: #4F46E5;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
            }
            button:hover { background: #4338CA; }
            .warning {
                background: #FEF3C7;
                border-left: 4px solid #F59E0B;
                padding: 10px;
                margin: 15px 0;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="box">
            <h1>🔒 Version Updater</h1>
            <p>Password required to update version</p>
            <form method="POST">
                <input type="password" name="password" placeholder="Enter password" required autofocus>
                <button type="submit">Unlock</button>
            </form>
            <div class="warning">
                <strong>⚠️ Security Note:</strong> Change the password in update-version.php (line 11)
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Password is correct - proceed with update
$versionFile = __DIR__ . '/version.json';

if (!file_exists($versionFile)) {
    die('Error: version.json not found');
}

$version = json_decode(file_get_contents($versionFile), true);

// Store old version for display
$oldVersion = $version['version'];
$oldTimestamp = $version['timestamp'];

// Increment version
$parts = explode('.', $version['version']);
$parts[2]++; // Increment patch version
$newVersion = implode('.', $parts);

// Update file
$version['version'] = $newVersion;
$version['timestamp'] = time();

file_put_contents($versionFile, json_encode($version, JSON_PRETTY_PRINT));

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Version Updated Successfully</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            max-width: 700px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
            color: #10B981;
            margin-top: 0;
            font-size: 32px;
        }
        .version-box {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #10B981;
        }
        .version-display {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin: 10px 0;
        }
        .old-version {
            color: #6B7280;
            text-decoration: line-through;
            font-size: 18px;
        }
        .info-box {
            background: #EEF2FF;
            border-left: 4px solid #4F46E5;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .info-box h3 {
            margin-top: 0;
            color: #4F46E5;
        }
        .links {
            display: flex;
            gap: 10px;
            margin-top: 30px;
        }
        .btn {
            flex: 1;
            padding: 15px;
            text-align: center;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn-primary {
            background: #4F46E5;
            color: white;
        }
        .btn-primary:hover {
            background: #4338CA;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #E5E7EB;
            color: #374151;
        }
        .btn-secondary:hover {
            background: #D1D5DB;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #E5E7EB;
        }
        td:first-child {
            font-weight: 600;
            color: #6B7280;
            width: 40%;
        }
        .success-icon {
            font-size: 64px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Version Updated Successfully!</h1>

        <div class="version-box">
            <div style="margin-bottom: 10px; color: #6B7280; font-size: 14px;">OLD VERSION:</div>
            <div class="old-version"><?= $oldVersion ?></div>

            <div style="margin: 20px 0; text-align: center; font-size: 32px; color: #10B981;">↓</div>

            <div style="margin-bottom: 10px; color: #10B981; font-size: 14px; font-weight: 600;">NEW VERSION:</div>
            <div class="version-display"><?= $newVersion ?></div>
        </div>

        <table>
            <tr>
                <td>Timestamp</td>
                <td><strong><?= $version['timestamp'] ?></strong></td>
            </tr>
            <tr>
                <td>Date/Time</td>
                <td><strong><?= date('Y-m-d H:i:s', $version['timestamp']) ?></strong></td>
            </tr>
            <tr>
                <td>Previous Timestamp</td>
                <td><?= $oldTimestamp ?> (<?= date('Y-m-d H:i:s', $oldTimestamp) ?>)</td>
            </tr>
        </table>

        <div class="info-box">
            <h3>📱 What happens now?</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>All cached CSS and JavaScript files will be refreshed</li>
                <li>Users will automatically download the latest version</li>
                <li>Service workers will update on next page load</li>
                <li>Admin and Kid panels will load fresh code</li>
            </ul>
        </div>

        <div class="info-box" style="background: #FEF3C7; border-left-color: #F59E0B;">
            <h3 style="color: #D97706;">⚠️ Important</h3>
            <p style="margin: 5px 0;">Users may need to refresh their browser (Ctrl+Shift+R) or clear cache to see changes immediately.</p>
        </div>

        <div class="links">
            <a href="admin/" class="btn btn-primary">Open Admin Panel</a>
            <a href="kid/" class="btn btn-secondary">Open Kid Panel</a>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #6B7280; font-size: 14px;">
            <p>To update version again, <a href="update-version.php?password=<?= urlencode($UPDATE_PASSWORD) ?>" style="color: #4F46E5;">click here</a></p>
        </div>
    </div>
</body>
</html>
