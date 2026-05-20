<?php
// New family registration page
// Requires GOOGLE_CLIENT_ID environment variable to be set in Railway
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join FamilyChores — Start Your Family</title>
    <meta name="description" content="Create a free FamilyChores account and start turning chores into adventures for your kids.">

    <meta property="og:title"       content="Join FamilyChores — Make Chores Fun!">
    <meta property="og:description" content="Create a free family account. Kids earn points, complete quests, and redeem rewards.">
    <meta property="og:image"       content="https://chores.futuresrelic.com/assets/kid-icon-512.png">
    <meta property="og:url"         content="https://chores.futuresrelic.com/join">
    <meta property="og:type"        content="website">

    <!-- Google Identity Services -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>

    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .card {
            background: white;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25);
            padding: 48px 40px;
            max-width: 460px;
            width: 100%;
            text-align: center;
        }

        .logo { font-size: 64px; margin-bottom: 16px; }

        h1 {
            font-size: 28px;
            color: #1a202c;
            margin-bottom: 8px;
            font-weight: 800;
        }

        .subtitle {
            color: #718096;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 36px;
        }

        .features {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 36px;
            text-align: left;
        }

        .feature {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: #f7f7ff;
            border-radius: 12px;
            font-size: 15px;
            color: #4a5568;
        }

        .feature-icon { font-size: 22px; flex-shrink: 0; }

        #google-btn-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }

        #not-configured {
            display: none;
            padding: 16px;
            background: #FEF3C7;
            border-radius: 12px;
            color: #92400E;
            font-size: 14px;
            line-height: 1.5;
        }

        #error-msg {
            display: none;
            padding: 12px 16px;
            background: #FEE2E2;
            border-radius: 12px;
            color: #991B1B;
            font-size: 14px;
        }

        #loading-msg {
            display: none;
            padding: 16px;
            color: #667eea;
            font-size: 16px;
            font-weight: 600;
        }

        .signin-note {
            margin-top: 20px;
            font-size: 13px;
            color: #a0aec0;
            line-height: 1.5;
        }

        .back-link {
            display: block;
            margin-top: 24px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }

        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
<div class="card">
    <div class="logo">🏠</div>
    <h1>Start Your Family</h1>
    <p class="subtitle">Create your free FamilyChores account.<br>Turn chores into adventures your kids actually love.</p>

    <div class="features">
        <div class="feature"><span class="feature-icon">⭐</span> Kids earn points for completing chores</div>
        <div class="feature"><span class="feature-icon">🎁</span> Redeem points for custom rewards</div>
        <div class="feature"><span class="feature-icon">🗺️</span> Epic quests keep kids motivated</div>
        <div class="feature"><span class="feature-icon">🎮</span> Built-in games as a fun bonus</div>
    </div>

    <div id="google-btn-wrapper">
        <div id="not-configured">
            <strong>⚙️ Google login not configured yet.</strong><br>
            The admin needs to set the <code>GOOGLE_CLIENT_ID</code> environment variable in Railway.
        </div>
        <div id="loading-msg">🚀 Setting up your family...</div>
        <div id="error-msg"></div>
        <!-- Google Sign-In button rendered here by GSI library -->
        <div id="g_id_signin_btn"></div>
    </div>

    <p class="signin-note">
        Already have an account?
        <a href="/admin/">Sign in to your admin panel →</a>
    </p>

    <a href="/" class="back-link">← Back to home</a>
</div>

<script>
(async function init() {
    // Fetch the client ID from the server (avoids hardcoding in HTML)
    let clientId = '';
    try {
        const res = await fetch('/api/api.php?action=get_google_client_id');
        const data = await res.json();
        clientId = data.client_id || '';
    } catch (e) {}

    if (!clientId) {
        document.getElementById('not-configured').style.display = 'block';
        return;
    }

    // Initialize Google Identity Services
    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
    });

    // Render a styled button
    google.accounts.id.renderButton(
        document.getElementById('g_id_signin_btn'),
        {
            theme:  'outline',
            size:   'large',
            text:   'continue_with',
            shape:  'rectangular',
            width:  320,
        }
    );
})();

async function handleCredentialResponse(response) {
    document.getElementById('loading-msg').style.display = 'block';
    document.getElementById('g_id_signin_btn').style.display = 'none';
    document.getElementById('error-msg').style.display = 'none';

    try {
        const res = await fetch('/api/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'google_auth', credential: response.credential }),
        });
        const data = await res.json();

        if (data.ok) {
            if (data.new_family) {
                // New family — redirect to admin panel with wizard flag
                window.location.href = '/admin/?welcome=new';
            } else {
                // Returning user
                window.location.href = '/admin/';
            }
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (e) {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('g_id_signin_btn').style.display = 'block';
        const errEl = document.getElementById('error-msg');
        errEl.textContent = '❌ ' + e.message;
        errEl.style.display = 'block';
    }
}
</script>
</body>
</html>
