// admin.js - Admin panel functionality

const API_URL = '../api/api.php';
let currentUser = null;
let currentSubmissionsStatus = 'pending';

// Utility functions
async function apiCall(action, data = {}) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...data })
        });
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        return { ok: false, error: 'Network error' };
    }
}

function showError(message) {
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatRelativeTime(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Modal functions
function openModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Tab navigation
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) btn.classList.add('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Load data for the tab
    loadTabData(tabName);
}

async function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'family-board':
            await loadFamilyBoard();
            break;
        case 'point-economics':
            await loadPointEconomics();
            break;
        case 'kids':
            await loadKids();
            await loadPairingCodes();
            await loadDevices();
            break;
        case 'chores':
            await loadChores();
            break;
        case 'quests':
            await loadQuests();
            break;
        case 'collective':
            await loadCollectiveQuests();
            await loadCollectiveSubmissions('pending');
            break;
        case 'rewards':
            await loadRewards();
            break;
        case 'submissions':
            await loadSubmissions('pending');
            break;
        case 'quest-tasks':  // ← ADD THIS
            await loadQuestTaskSubmissions('pending');
            break;
        case 'themes':
            await loadThemes();
            break;
        case 'games':
            await loadGames();
            break;
        case 'redemptions':
            await loadRedemptions('pending');
            break;
        case 'families':
            await loadFamilies();
            break;
        case 'setup-wizard':
            loadWizard();
            break;
    }
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    const result = await apiCall('admin_login', { email, password });
    
    if (result.ok) {
        // Login successful - reload page to show app
        window.location.reload();
    } else {
        alert('Login failed: ' + (result.error || 'Invalid credentials'));
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    await apiCall('admin_logout');
    location.reload();
});

// Check if already logged in
async function checkAuth() {
    const result = await apiCall('admin_me');
    if (result.ok) {
        currentUser = result.data;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('admin-email').textContent = currentUser.email;
        
        // Show version
        fetch('/api/version.php')
            .then(r => r.json())
            .then(data => {
                const versionEl = document.getElementById('app-version');
                if (versionEl) {
                    versionEl.textContent = `v${data.version}`;
                }
            })
            .catch(() => {});
        
        await loadDashboard();
    }
    // If not authenticated, login screen stays visible (default state)
}

// Dashboard
async function loadDashboard() {
    const result = await apiCall('stats_overview');
    if (result.ok) {
        const stats = result.data;
        document.getElementById('stat-submissions').textContent = stats.pending_submissions;
        document.getElementById('stat-redemptions').textContent = stats.pending_redemptions;
        document.getElementById('stat-quests').textContent = stats.pending_quest_tasks;
        document.getElementById('stat-today').textContent = stats.today_completions;
        
        // Streak leaders
        const streakHtml = stats.streak_leaders.length > 0 
            ? stats.streak_leaders.map(s => `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${s.kid_name} - ${s.chore_title}</h4>
                        <p>${s.streak_count} day streak 🔥</p>
                    </div>
                </div>
            `).join('')
            : '<p>No streaks yet</p>';
        document.getElementById('streak-leaders').innerHTML = streakHtml;
        
        // Points leaders
        const pointsHtml = stats.points_leaders.length > 0
            ? stats.points_leaders.map(p => `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${p.kid_name}</h4>
                        <p>${p.total_points} points</p>
                    </div>
                </div>
            `).join('')
            : '<p>No points yet</p>';
        document.getElementById('points-leaders').innerHTML = pointsHtml;
    }
}

// Kids Management
async function loadKids() {
    const result = await apiCall('list_kids');
    if (result.ok) {
        const html = result.data.map(kid => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>
                        ${kid.kid_name} 
                        ${kid.is_test_account ? '<span style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">TEST</span>' : ''}
                    </h4>
                    <p>${kid.total_points} points • ${kid.device_count} device(s) • ${kid.chore_count} chore(s)</p>
                    <p>Created: ${formatDate(kid.created_at)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="secondary-btn small-btn" onclick="manageKid(${kid.id}, '${kid.kid_name}', ${kid.is_test_account})">Manage</button>
                    <button class="secondary-btn small-btn" onclick="generatePairingCode(${kid.id})">Get Code</button>
                    <button class="secondary-btn small-btn" onclick="viewKidChores(${kid.id}, '${kid.kid_name}')">Chores</button>
                    <button class="danger-btn small-btn" onclick="deleteKid(${kid.id})">Delete</button>
                </div>
            </div>
        `).join('');
        document.getElementById('kids-list').innerHTML = html || '<p>No kids added yet</p>';
    }
}

document.getElementById('add-kid-btn').addEventListener('click', () => {
    openModal(`
        <h3>Add Kid</h3>
        <input type="text" id="new-kid-name" placeholder="Kid's Name" required>
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="createKid()">Add Kid</button>
        </div>
    `);
});

async function createKid() {
    const name = document.getElementById('new-kid-name').value.trim();
    if (!name) {
        showError('Name is required');
        return;
    }
    
    const result = await apiCall('create_kid', { name });
    if (result.ok) {
        closeModal();
        showSuccess('Kid added successfully');
        loadKids();
    } else {
        showError(result.error);
    }
}

async function deleteKid(kidId) {
    if (!confirm('Are you sure? This will delete all chores and progress for this kid.')) return;
    
    const result = await apiCall('delete_kid', { kid_id: kidId });
    if (result.ok) {
        showSuccess('Kid deleted');
        loadKids();
    } else {
        showError(result.error);
    }
}

function manageKid(kidId, kidName, isTestAccount) {
    openModal(`
        <h3>Manage: ${kidName}</h3>
        
        <div style="background: #F3F4F6; padding: 15px; border-radius: 12px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">Test Account Mode</h4>
            <p style="font-size: 13px; color: #6B7280; margin-bottom: 15px;">
                Test accounts are excluded from Family Board analytics and statistics.
            </p>
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="test-mode-toggle" ${isTestAccount ? 'checked' : ''} 
                    style="width: 20px; height: 20px;">
                <span style="font-weight: 600;">Mark as Test Account</span>
            </label>
        </div>
        
        <div style="background: #FEF3C7; padding: 15px; border-radius: 12px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #92400E;">⚠️ Reset Points</h4>
            <p style="font-size: 13px; color: #92400E; margin-bottom: 15px;">
                Choose what to reset for this kid:
            </p>
            <button class="secondary-btn" style="width: 100%; margin-bottom: 10px;" 
                onclick="resetKidPoints(${kidId}, '${kidName}', false)">
                Reset Points Only
            </button>
            <button class="danger-btn" style="width: 100%;" 
                onclick="resetKidPoints(${kidId}, '${kidName}', true)">
                Reset Everything (Points + History)
            </button>
        </div>
        
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="saveKidSettings(${kidId})">Save Settings</button>
        </div>
    `);
}

async function saveKidSettings(kidId) {
    const isTest = document.getElementById('test-mode-toggle').checked;
    
    const result = await apiCall('toggle_kid_test_mode', { kid_id: kidId });
    
    if (result.ok) {
        closeModal();
        showSuccess('Settings saved');
        loadKids();
    } else {
        showError(result.error);
    }
}

async function resetKidPoints(kidId, kidName, clearHistory) {
    const message = clearHistory
        ? `Reset ALL data for ${kidName}?\n\nThis will delete:\n• All points\n• Submission history\n• Redemption history\n• Quest progress\n• Streaks\n• Game scores\n\nTHIS CANNOT BE UNDONE!`
        : `Reset points to 0 for ${kidName}?\n\nHistory will be preserved.`;
    
    if (!confirm(message)) return;
    
    const result = await apiCall('reset_kid_points', {
        kid_id: kidId,
        clear_history: clearHistory ? 1 : 0
    });
    
    if (result.ok) {
        closeModal();
        showSuccess(result.data.message);
        loadKids();
        loadDashboard();
    } else {
        showError(result.error);
    }
}

async function generatePairingCode(kidId) {
    const result = await apiCall('generate_pairing_code', { kid_id: kidId });
    if (result.ok) {
        const code = result.data.code;
        const shareUrl = window.location.origin + '/kid/?code=' + code;
        openModal(`
            <h3>Pairing Code Generated</h3>
            <p>Share this code with the kid's device:</p>
            <div style="text-align:center;font-family:monospace;font-size:52px;font-weight:800;letter-spacing:8px;color:var(--primary);margin:16px 0;background:#F3F4F6;padding:16px;border-radius:14px;border:2px dashed #D1D5DB;">${code}</div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0;">
                <button onclick="copyPairingCode('${code}', this)" style="padding:10px 20px;font-size:14px;cursor:pointer;border:2px solid #4F46E5;border-radius:10px;background:#EEF2FF;color:#4F46E5;font-weight:700;">📋 Copy Code</button>
                <button onclick="sharePairingLink('${shareUrl}', this)" style="padding:10px 20px;font-size:14px;cursor:pointer;border:2px solid #10B981;border-radius:10px;background:#D1FAE5;color:#065F46;font-weight:700;">🔗 Share Link</button>
            </div>
            <p style="text-align:center;color:var(--text-light);font-size:12px;margin:0;">Code expires when paired</p>
            <div class="modal-actions" style="margin-top:16px;">
                <button class="primary-btn" onclick="closeModal()">Close</button>
            </div>
        `);
        loadPairingCodes();
    } else {
        showError(result.error);
    }
}

async function loadPairingCodes() {
    const result = await apiCall('list_pairing_codes');
    if (result.ok) {
        const html = result.data.map(code => {
            const shareUrl = window.location.origin + '/kid/?code=' + code.pairing_code;
            return `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${code.kid_name} — Waiting to pair</h4>
                    <div style="display:flex;align-items:center;gap:10px;margin:8px 0;flex-wrap:wrap;">
                        <span style="font-family:monospace;font-size:24px;font-weight:700;letter-spacing:4px;background:#F3F4F6;padding:8px 16px;border-radius:10px;border:2px dashed #D1D5DB;">${code.pairing_code}</span>
                        <button onclick="copyPairingCode('${code.pairing_code}', this)" style="padding:8px 14px;font-size:13px;cursor:pointer;border:2px solid #4F46E5;border-radius:8px;background:#EEF2FF;color:#4F46E5;font-weight:600;">📋 Copy Code</button>
                        <button onclick="sharePairingLink('${shareUrl}', this)" style="padding:8px 14px;font-size:13px;cursor:pointer;border:2px solid #10B981;border-radius:8px;background:#D1FAE5;color:#065F46;font-weight:600;">🔗 Share Link</button>
                    </div>
                    <p style="font-size:12px;color:#9CA3AF;margin:0;">Link: <span style="font-family:monospace;font-size:11px;word-break:break-all;">${shareUrl}</span></p>
                </div>
            </div>`;
        }).join('');
        document.getElementById('pairing-codes-list').innerHTML = html || '<p>No pending pairing codes</p>';
    }
}

function copyPairingCode(code, btn) {
    navigator.clipboard.writeText(code).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.background = '#D1FAE5'; btn.style.borderColor = '#10B981'; btn.style.color = '#065F46';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = '#EEF2FF'; btn.style.borderColor = '#4F46E5'; btn.style.color = '#4F46E5'; }, 2000);
    }).catch(() => { prompt('Copy this code:', code); });
}

function sharePairingLink(url, btn) {
    if (navigator.share) {
        navigator.share({ title: 'Family Chores — Pair Your Device', text: 'Tap this link to connect to Family Chores!', url });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = '✅ Link Copied!';
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
        }).catch(() => { prompt('Share this link:', url); });
    }
}

async function loadDevices() {
    const result = await apiCall('list_devices');
    if (result.ok) {
        const html = result.data.map(device => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${device.kid_name} - ${device.device_label}</h4>
                    <p>Paired: ${formatDate(device.paired_at)} • Last seen: ${formatRelativeTime(device.last_seen_at)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="danger-btn small-btn" onclick="revokeDevice(${device.id})">Revoke</button>
                </div>
            </div>
        `).join('');
        document.getElementById('devices-list').innerHTML = html || '<p>No paired devices</p>';
    }
}

async function revokeDevice(deviceId) {
    if (!confirm('Revoke this device? The kid will need to pair again.')) return;
    
    const result = await apiCall('revoke_device', { device_id: deviceId });
    if (result.ok) {
        showSuccess('Device revoked');
        loadDevices();
    } else {
        showError(result.error);
    }
}

async function clearUnpairedCodes() {
    const result = await apiCall('list_pairing_codes');
    if (!result.ok || result.data.length === 0) {
        alert('No unpaired codes to clear');
        return;
    }
    
    if (!confirm(`Clear ${result.data.length} unpaired pairing code(s)?`)) return;  // ← FIXED: Added opening (
    
    const clearResult = await apiCall('clear_unpaired_codes');
    if (clearResult.ok) {
        showSuccess(clearResult.data.message);
        loadPairingCodes();
    } else {
        showError(clearResult.error);
    }
}

async function clearStaleDevices() {
    console.log('🧹 clearStaleDevices() called');
    
    // Ask how many days
    const days = prompt('Clear devices not seen in how many days?\n\nRecommended: 30 days\n\nEnter number:', '30');
    console.log('User entered days:', days);
    
    if (!days || isNaN(days)) {
        console.log('Invalid days input, aborting');
        return;
    }
    
    const daysNum = parseInt(days);
    if (daysNum < 1) {
        alert('Please enter a valid number of days');
        return;
    }
    
    console.log('Calling API with days:', daysNum);
    
    // Show confirmation
    const message = daysNum === 1 
        ? `Clear devices not seen in the last 24 hours?`
        : `Clear devices not seen in the last ${daysNum} days?`;
    
    if (!confirm(message + '\n\nThis will remove old/unused paired devices.\n\nActive devices will NOT be affected.')) {
        console.log('User cancelled');
        return;
    }
    
    console.log('User confirmed, calling clear_stale_devices API...');
    const result = await apiCall('clear_stale_devices', { days: daysNum });
    console.log('API result:', result);
    
    if (result.ok) {
        if (result.data.count === 0) {
            alert('No stale devices found! All devices are active.');
        } else {
            const deviceList = result.data.devices.map(d => 
                `  • ${d.kid_name} - ${d.device_label} (last seen: ${d.last_seen_at || 'never'})`
            ).join('\n');
            
            alert(`${result.data.message}\n\nRemoved:\n${deviceList}`);  // ← FIXED: Added opening (
        }
        loadDevices();
        loadPairingCodes();
    } else {
        console.error('API error:', result.error);
        alert('Error: ' + (result.error || 'Unknown error'));
    }
}

// Attach button listeners (only once, no duplicates)
document.getElementById('clear-unpaired-btn')?.addEventListener('click', clearUnpairedCodes);
document.getElementById('clear-stale-btn')?.addEventListener('click', clearStaleDevices);

// Chores Management
async function loadChores() {
    const result = await apiCall('list_chores');
    if (result.ok) {
        const html = result.data.map(chore => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${chore.title}</h4>
                    <p>${chore.description || 'No description'}</p>
                    <p>
                        <span class="badge badge-info">${chore.frequency}</span>
                        <span class="badge badge-success">${chore.default_points} pts</span>
                        ${chore.requires_approval ? '<span class="badge badge-warning">Requires Approval</span>' : '<span class="badge badge-success">Auto-approve</span>'}
                        • Assigned to ${chore.assigned_count} kid(s)
                    </p>
                </div>
                <div class="list-item-actions">
                    <button class="secondary-btn small-btn" onclick="assignChore(${chore.id}, '${chore.title}')">Assign</button>
                    <button class="secondary-btn small-btn" onclick="editChore(${chore.id})">Edit</button>
                    <button class="danger-btn small-btn" onclick="deleteChore(${chore.id})">Delete</button>
                </div>
            </div>
        `).join('');
        document.getElementById('chores-list').innerHTML = html || '<p>No chores created yet</p>';
    }
}

document.getElementById('add-chore-btn').addEventListener('click', () => {
    openModal(`
        <h3>Add Chore</h3>
        <input type="text" id="chore-title" placeholder="Title" required>
        <textarea id="chore-description" placeholder="Description"></textarea>
        <select id="chore-frequency">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="once">One-time</option>
        </select>
        <input type="number" id="chore-points" placeholder="Points" value="10" min="1">
        <label>
            <input type="checkbox" id="chore-requires-approval" checked>
            Requires Approval
        </label>
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="createChore()">Add Chore</button>
        </div>
    `);
});

async function createChore() {
    const title = document.getElementById('chore-title').value.trim();
    const description = document.getElementById('chore-description').value.trim();
    const frequency = document.getElementById('chore-frequency').value;
    const points = parseInt(document.getElementById('chore-points').value);
    const requiresApproval = document.getElementById('chore-requires-approval').checked ? 1 : 0;
    
    if (!title) {
        showError('Title is required');
        return;
    }
    
    const result = await apiCall('create_chore', {
        title,
        description,
        frequency,
        default_points: points,
        requires_approval: requiresApproval,
        is_recurring: frequency !== 'once' ? 1 : 0
    });
    
    if (result.ok) {
        closeModal();
        showSuccess('Chore created');
        loadChores();
    } else {
        showError(result.error);
    }
}

async function editChore(choreId) {
    const result = await apiCall('list_chores');
    if (!result.ok) return;
    
    const chore = result.data.find(c => c.id === choreId);
    if (!chore) return;
    
    openModal(`
        <h3>Edit Chore</h3>
        <input type="text" id="chore-title" placeholder="Title" value="${chore.title}" required>
        <textarea id="chore-description" placeholder="Description">${chore.description || ''}</textarea>
        <select id="chore-frequency">
            <option value="daily" ${chore.frequency === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekly" ${chore.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
            <option value="once" ${chore.frequency === 'once' ? 'selected' : ''}>One-time</option>
        </select>
        <input type="number" id="chore-points" placeholder="Points" value="${chore.default_points}" min="1">
        <label>
            <input type="checkbox" id="chore-requires-approval" ${chore.requires_approval ? 'checked' : ''}>
            Requires Approval
        </label>
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="updateChore(${choreId})">Save Changes</button>
        </div>
    `);
}

async function updateChore(choreId) {
    const title = document.getElementById('chore-title').value.trim();
    const description = document.getElementById('chore-description').value.trim();
    const frequency = document.getElementById('chore-frequency').value;
    const points = parseInt(document.getElementById('chore-points').value);
    const requiresApproval = document.getElementById('chore-requires-approval').checked ? 1 : 0;
    
    if (!title) {
        showError('Title is required');
        return;
    }
    
    const result = await apiCall('update_chore', {
        chore_id: choreId,
        title,
        description,
        frequency,
        default_points: points,
        requires_approval: requiresApproval,
        is_recurring: frequency !== 'once' ? 1 : 0
    });
    
    if (result.ok) {
        closeModal();
        showSuccess('Chore updated');
        loadChores();
    } else {
        showError(result.error);
    }
}

async function deleteChore(choreId) {
    if (!confirm('Delete this chore? It will be removed from all kids.')) return;
    
    const result = await apiCall('delete_chore', { chore_id: choreId });
    if (result.ok) {
        showSuccess('Chore deleted');
        loadChores();
    } else {
        showError(result.error);
    }
}

async function editChore(choreId) {
    // Get chore details first
    const result = await apiCall('list_chores');
    if (!result.ok) return;
    
    const chore = result.data.find(c => c.id === choreId);
    if (!chore) return;
    
    openModal(`
        <h3>Edit Chore</h3>
        <input type="text" id="chore-title" placeholder="Title" value="${chore.title}" required>
        <textarea id="chore-description" placeholder="Description">${chore.description || ''}</textarea>
        <select id="chore-frequency">
            <option value="daily" ${chore.frequency === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekly" ${chore.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
            <option value="once" ${chore.frequency === 'once' ? 'selected' : ''}>One-time</option>
        </select>
        <input type="number" id="chore-points" placeholder="Points" value="${chore.default_points}" min="1">
        <label>
            <input type="checkbox" id="chore-requires-approval" ${chore.requires_approval ? 'checked' : ''}>
            Requires Approval
        </label>
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="updateChore(${choreId})">Save Changes</button>
        </div>
    `);
}

async function updateChore(choreId) {
    const title = document.getElementById('chore-title').value.trim();
    const description = document.getElementById('chore-description').value.trim();
    const frequency = document.getElementById('chore-frequency').value;
    const points = parseInt(document.getElementById('chore-points').value);
    const requiresApproval = document.getElementById('chore-requires-approval').checked ? 1 : 0;
    
    if (!title) {
        showError('Title is required');
        return;
    }
    
    const result = await apiCall('update_chore', {
        chore_id: choreId,
        title,
        description,
        frequency,
        default_points: points,
        requires_approval: requiresApproval,
        is_recurring: frequency !== 'once' ? 1 : 0
    });
    
    if (result.ok) {
        closeModal();
        showSuccess('Chore updated');
        loadChores();
    } else {
        showError(result.error);
    }
}

async function assignChore(choreId, choreTitle) {
    const kidsResult = await apiCall('list_kids');
    if (!kidsResult.ok) {
        showError('Failed to load kids');
        return;
    }
    
    const kidsOptions = kidsResult.data.map(kid => 
        `<option value="${kid.id}">${kid.kid_name}</option>`
    ).join('');
    
    openModal(`
        <h3>Assign "${choreTitle}"</h3>
        <select id="assign-kid-id">
            <option value="">Select a kid</option>
            ${kidsOptions}
        </select>
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="submitAssignChore(${choreId})">Assign</button>
        </div>
    `);
}

async function submitAssignChore(choreId) {
    const kidId = document.getElementById('assign-kid-id').value;
    if (!kidId) {
        showError('Please select a kid');
        return;
    }
    
    const result = await apiCall('assign_chore_to_kid', { kid_id: kidId, chore_id: choreId });
    if (result.ok) {
        closeModal();
        showSuccess('Chore assigned');
        loadChores();
    } else {
        showError(result.error);
    }
}

async function viewKidChores(kidId, kidName) {
    const result = await apiCall('list_kid_chores', { kid_id: kidId });
    if (result.ok) {
        const html = result.data.map(kc => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${kc.title}</h4>
                    <p>Streak: ${kc.streak_count} days • Next due: ${formatDate(kc.next_due_at)}</p>
                </div>
                <div class="list-item-actions">
                    <button class="danger-btn small-btn" onclick="unassignChore(${kidId}, ${kc.chore_id})">Unassign</button>
                </div>
            </div>
        `).join('');
        
        openModal(`
            <h3>${kidName}'s Chores</h3>
            <div class="list-container">
                ${html || '<p>No chores assigned</p>'}
            </div>
            <div class="modal-actions">
                <button class="primary-btn" onclick="closeModal()">Close</button>
            </div>
        `);
    }
}

async function unassignChore(kidId, choreId) {
    const result = await apiCall('unassign_chore', { kid_id: kidId, chore_id: choreId });
    if (result.ok) {
        closeModal();
        showSuccess('Chore unassigned');
        loadKids();
    } else {
        showError(result.error);
    }
}

// Submissions
async function loadSubmissions(status) {
    currentSubmissionsStatus = status;
    const result = await apiCall('list_submissions', { status });
    if (result.ok) {
        const html = result.data.map(sub => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${sub.kid_name} - ${sub.chore_title}</h4>
                    <p>Submitted: ${formatDate(sub.submitted_at)}</p>
                    ${sub.note ? `<p><em>"${sub.note}"</em></p>` : ''}
                    ${sub.status !== 'pending' ? `<p>Points: ${sub.points_awarded}</p>` : ''}
                </div>
                <div class="list-item-actions">
                    ${sub.status === 'pending' ? `
                        <button class="success-btn small-btn" onclick="reviewSubmission(${sub.id}, 'approved', ${sub.chore_id})">Approve</button>
                        <button class="danger-btn small-btn" onclick="reviewSubmission(${sub.id}, 'rejected')">Reject</button>
                    ` : `
                        <span class="badge badge-${sub.status === 'approved' ? 'success' : 'danger'}">${sub.status}</span>
                    `}
                </div>
            </div>
        `).join('');
        document.getElementById('submissions-list').innerHTML = html || `<p>No ${status} submissions</p>`;
    }
}

async function reviewSubmission(submissionId, status, choreId = null) {
    let pointsOverride = null;
    if (status === 'approved') {
        const points = prompt('Points to award (leave empty for default):');
        if (points !== null && points !== '') {
            pointsOverride = parseInt(points);
        }
    }
    
    const result = await apiCall('review_submission', {
        submission_id: submissionId,
        status,
        points_override: pointsOverride
    });
    
    if (result.ok) {
        showSuccess(`Submission ${status}`);
        loadSubmissions(currentSubmissionsStatus);
        loadDashboard();
    } else {
        showError(result.error);
    }
}

// Quest title map — avoids apostrophe/special-char issues in onclick attributes
window._questTitles = {};

// Quests
async function loadQuests() {
    const result = await apiCall('list_quests');
    if (result.ok) {
        window._questTitles = {};
        result.data.forEach(q => { window._questTitles[q.id] = q.title; });

        const html = result.data.map(quest => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${quest.title}</h4>
                    <p>${quest.description || 'No description'}</p>
                    <p>Reward: ${quest.target_reward} • ${quest.task_count} task(s) • ${quest.is_active ? '✅ Active' : '❌ Inactive'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="secondary-btn small-btn" onclick="viewQuestTasks(${quest.id})">Tasks</button>
                    <button class="secondary-btn small-btn" onclick="toggleQuest(${quest.id})">${quest.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button class="danger-btn small-btn" onclick="deleteQuest(${quest.id})">Delete</button>
                </div>
            </div>
        `).join('');
        document.getElementById('quests-list').innerHTML = html || '<p>No quests created yet</p>';
    }
}

document.getElementById('add-quest-btn').addEventListener('click', () => {
    openModal(`
        <h3>Add Quest</h3>
        <input type="text" id="quest-title" placeholder="Title" required>
        <textarea id="quest-description" placeholder="Description"></textarea>
        <input type="text" id="quest-reward" placeholder="Target Reward (e.g., Waterpark trip)">
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="createQuest()">Add Quest</button>
        </div>
    `);
});

async function createQuest() {
    const title = document.getElementById('quest-title').value.trim();
    const description = document.getElementById('quest-description').value.trim();
    const targetReward = document.getElementById('quest-reward').value.trim();
    
    if (!title) {
        showError('Title is required');
        return;
    }
    
    const result = await apiCall('create_quest', { title, description, target_reward: targetReward });
    if (result.ok) {
        closeModal();
        showSuccess('Quest created');
        loadQuests();
    } else {
        showError(result.error);
    }
}

async function toggleQuest(questId) {
    const result = await apiCall('toggle_quest', { quest_id: questId });
    if (result.ok) {
        loadQuests();
    }
}

async function deleteQuest(questId) {
    if (!confirm('Delete this quest and all its tasks? This cannot be undone.')) return;
    const result = await apiCall('delete_quest', { quest_id: questId });
    if (result.ok) {
        showSuccess('Quest deleted');
        loadQuests();
    } else {
        showError(result.error);
    }
}

async function viewQuestTasks(questId) {
    const questTitle = window._questTitles[questId] || 'Quest';
    const result = await apiCall('list_quest_tasks', { quest_id: questId });
    if (result.ok) {
        const html = result.data.map((task, index) => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${index + 1}. ${task.title}</h4>
                    <p>${task.description || 'No description'}</p>
                    <p>${task.points} points</p>
                </div>
                <div class="list-item-actions">
                    <button class="danger-btn small-btn" onclick="deleteQuestTask(${task.id}, ${questId})">Delete</button>
                </div>
            </div>
        `).join('');

        openModal(`
            <h3>${questTitle} - Tasks</h3>
            <div class="list-container">
                ${html || '<p>No tasks yet</p>'}
            </div>
            <button class="primary-btn" onclick="addQuestTask(${questId})" style="width: 100%; margin-top: 15px;">Add Task</button>
            <div class="modal-actions">
                <button class="secondary-btn" onclick="closeModal()">Close</button>
            </div>
        `);
    }
}

function addQuestTask(questId) {
    const questTitle = window._questTitles[questId] || 'Quest';
    openModal(`
        <h3>Add Task to "${questTitle}"</h3>
        <input type="text" id="task-title" placeholder="Task Title" required>
        <textarea id="task-description" placeholder="Description"></textarea>
        <input type="number" id="task-points" placeholder="Points" value="10" min="1">
        <div class="modal-actions">
            <button class="secondary-btn" onclick="viewQuestTasks(${questId})">Back</button>
            <button class="primary-btn" onclick="submitQuestTask(${questId})">Add Task</button>
        </div>
    `);
}

async function submitQuestTask(questId) {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const points = parseInt(document.getElementById('task-points').value);

    if (!title) {
        showError('Title is required');
        return;
    }

    const result = await apiCall('create_quest_task', {
        quest_id: questId,
        title,
        description,
        points
    });

    if (result.ok) {
        viewQuestTasks(questId);
    } else {
        showError(result.error);
    }
}

async function deleteQuestTask(taskId, questId) {
    if (!confirm('Delete this task?')) return;

    const result = await apiCall('delete_quest_task', { task_id: taskId });
    if (result.ok) {
        viewQuestTasks(questId);
    } else {
        showError(result.error);
    }
}

// Quest Task Submissions
let currentQuestTaskStatus = 'pending';

async function loadQuestTaskSubmissions(status) {
    console.log('Loading quest task submissions with status:', status);
    currentQuestTaskStatus = status;
    
    const result = await apiCall('list_quest_task_submissions', { status });
    console.log('Quest task submissions API result:', result);
    
    const container = document.getElementById('quest-tasks-list');
    if (!container) {
        console.error('quest-tasks-list container not found!');
        return;
    }
    
    if (result.ok) {
        if (!result.data || result.data.length === 0) {
            container.innerHTML = `<p>No ${status} quest task submissions</p>`;
            return;
        }
        
        const html = result.data.map(task => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${task.kid_name} - ${task.quest_title}</h4>
                    <p><strong>Task:</strong> ${task.task_title} (${task.points} points)</p>
                    ${task.note ? `<p><em>"${task.note}"</em></p>` : ''}
                    <p>Submitted: ${formatDate(task.submitted_at)}</p>
                    ${task.status !== 'pending' ? `<p>Reviewed: ${formatDate(task.reviewed_at)}</p>` : ''}
                </div>
                <div class="list-item-actions">
                    ${task.status === 'pending' ? `
                        <button class="success-btn small-btn" onclick="reviewQuestTask(${task.id}, 'approved')">Approve</button>
                        <button class="danger-btn small-btn" onclick="reviewQuestTask(${task.id}, 'rejected')">Reject</button>
                    ` : `
                        <span class="badge badge-${task.status === 'approved' ? 'success' : 'danger'}">${task.status.toUpperCase()}</span>
                    `}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    } else {
        console.error('Quest task submissions API error:', result.error);
        container.innerHTML = `<p style="color: red;">Error: ${result.error || 'Unknown error'}</p>`;
    }
}

async function reviewQuestTask(statusId, status) {
    if (!confirm(`${status === 'approved' ? 'Approve' : 'Reject'} this quest task?`)) return;
    
    const result = await apiCall('review_quest_task', {
        status_id: statusId,
        status: status
    });
    
    if (result.ok) {
        showSuccess(`Quest task ${status}`);
        loadQuestTaskSubmissions(currentQuestTaskStatus);
        loadDashboard(); // Refresh dashboard stats
    } else {
        showError(result.error);
    }
}

// ============================================================
// COLLECTIVE QUESTS
// ============================================================

const RECUR_LABELS = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 Weeks', triweekly: 'Every 3 Weeks', monthly: 'Monthly', once: 'One-Time' };

async function loadCollectiveQuests() {
    const result = await apiCall('list_collective_quests');
    if (!result.ok) return;

    const html = result.data.map(q => {
        const approved = q.approved_count;
        const total = q.task_count;
        const pct = total > 0 ? Math.round(approved / total * 100) : 0;
        const rewardBadge = q.reward_title ? `<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">🎁 ${q.reward_title}${q.reward_points > 0 ? ' (+'+q.reward_points+'pts each)' : ''}</span>` : '';
        const recurBadge = `<span style="background:#EDE9FE;color:#5B21B6;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;">🔄 ${RECUR_LABELS[q.recurrence_type] || q.recurrence_type}</span>`;
        return `
        <div class="list-item">
            <div class="list-item-info">
                <h4>${q.title} ${q.is_active ? '' : '<span style="color:#9CA3AF;font-size:12px;">(Inactive)</span>'}</h4>
                ${q.description ? `<p>${q.description}</p>` : ''}
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;">${recurBadge} ${rewardBadge}</div>
                <div style="margin-top:6px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:#6B7280;margin-bottom:3px;">
                        <span>This period: ${approved}/${total} tasks done</span><span>${pct}%</span>
                    </div>
                    <div style="background:#E5E7EB;border-radius:6px;height:8px;overflow:hidden;">
                        <div style="background:#7C3AED;height:100%;width:${pct}%;border-radius:6px;transition:width 0.3s;"></div>
                    </div>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="secondary-btn small-btn" onclick="viewCollectiveTasks(${q.id})">Tasks</button>
                <button class="secondary-btn small-btn" onclick="toggleCollectiveQuest(${q.id})">${q.is_active ? 'Deactivate' : 'Activate'}</button>
                <button class="danger-btn small-btn" onclick="deleteCollectiveQuest(${q.id})">Delete</button>
            </div>
        </div>`;
    }).join('');
    document.getElementById('collective-list').innerHTML = html || '<p>No collective quests yet. Add one to get started!</p>';
}

document.getElementById('add-collective-btn').addEventListener('click', () => {
    openModal(`
        <h3>🌟 Add Collective Quest</h3>
        <input type="text" id="cq-title" placeholder="Quest Title" required>
        <textarea id="cq-desc" placeholder="Description (optional)" rows="2"></textarea>
        <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-top:10px;">Recurrence</label>
        <select id="cq-recur" style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;margin-bottom:8px;">
            <option value="daily">Daily</option>
            <option value="weekly" selected>Weekly</option>
            <option value="biweekly">Every 2 Weeks</option>
            <option value="triweekly">Every 3 Weeks</option>
            <option value="monthly">Monthly</option>
            <option value="once">One-Time</option>
        </select>
        <input type="text" id="cq-reward-title" placeholder="Reward (e.g. Pizza night, Movie night)">
        <input type="number" id="cq-reward-points" placeholder="Bonus points per kid when quest is complete (0 = none)" value="0" min="0">
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="createCollectiveQuest()">Create Quest</button>
        </div>
    `);
});

async function createCollectiveQuest() {
    const title = document.getElementById('cq-title').value.trim();
    if (!title) { showError('Title is required'); return; }
    const result = await apiCall('create_collective_quest', {
        title,
        description: document.getElementById('cq-desc').value.trim(),
        recurrence_type: document.getElementById('cq-recur').value,
        reward_title: document.getElementById('cq-reward-title').value.trim(),
        reward_points: parseInt(document.getElementById('cq-reward-points').value) || 0
    });
    if (result.ok) {
        closeModal();
        showSuccess('Collective quest created!');
        loadCollectiveQuests();
    } else {
        showError(result.error);
    }
}

async function toggleCollectiveQuest(questId) {
    const result = await apiCall('toggle_collective_quest', { quest_id: questId });
    if (result.ok) loadCollectiveQuests();
}

async function deleteCollectiveQuest(questId) {
    if (!confirm('Delete this collective quest and all its tasks? This cannot be undone.')) return;
    const result = await apiCall('delete_collective_quest', { quest_id: questId });
    if (result.ok) {
        showSuccess('Deleted');
        loadCollectiveQuests();
    } else {
        showError(result.error);
    }
}

window._collectiveTitles = {};

async function viewCollectiveTasks(questId) {
    const result = await apiCall('list_collective_quests');
    if (!result.ok) return;
    const quest = result.data.find(q => q.id === questId);
    if (!quest) return;
    window._collectiveTitles[questId] = quest.title;

    const kidList = await apiCall('list_kids');
    const kids = kidList.ok ? kidList.data : [];

    const taskHtml = quest.tasks.map((t, i) => {
        const assignee = t.assigned_kid_name ? `👤 ${t.assigned_kid_name}` : '🌐 Any kid';
        const statusBadge = t.completion_status === 'approved' ? '✅' : t.completion_status === 'pending' ? '⏳' : t.completion_status === 'rejected' ? '❌' : '—';
        return `
        <div class="list-item">
            <div class="list-item-info">
                <h4>${i+1}. ${t.title}</h4>
                ${t.description ? `<p>${t.description}</p>` : ''}
                <p style="font-size:12px;color:#6B7280;">${t.points} pts · ${assignee} · ${statusBadge} ${t.completion_status || 'Not submitted'}</p>
            </div>
            <div class="list-item-actions">
                <button class="danger-btn small-btn" onclick="deleteCollectiveTask(${t.task_id}, ${questId})">Delete</button>
            </div>
        </div>`;
    }).join('');

    const kidOptions = kids.map(k => `<option value="${k.id}">${k.kid_name}</option>`).join('');
    openModal(`
        <h3>${quest.title} — Tasks</h3>
        <div class="list-container" style="max-height:280px;overflow-y:auto;">
            ${taskHtml || '<p>No tasks yet</p>'}
        </div>
        <button class="primary-btn" onclick="addCollectiveTask(${questId}, \`${quest.title.replace(/`/g,"'")}\`)" style="width:100%;margin-top:12px;">+ Add Task</button>
        <div class="modal-actions"><button class="secondary-btn" onclick="closeModal()">Close</button></div>
    `);
}

function addCollectiveTask(questId, questTitle) {
    const kidList_promise = apiCall('list_kids');
    kidList_promise.then(kidList => {
        const kids = kidList.ok ? kidList.data : [];
        const kidOptions = `<option value="0">Any kid (open)</option>` + kids.map(k => `<option value="${k.id}">${k.kid_name}</option>`).join('');
        openModal(`
            <h3>Add Task to "${questTitle}"</h3>
            <input type="text" id="ct-title" placeholder="Task title" required>
            <textarea id="ct-desc" placeholder="Description (optional)" rows="2"></textarea>
            <input type="number" id="ct-points" placeholder="Points" value="10" min="1">
            <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-top:10px;">Assign to</label>
            <select id="ct-kid" style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;margin-bottom:8px;">
                ${kidOptions}
            </select>
            <div class="modal-actions">
                <button class="secondary-btn" onclick="viewCollectiveTasks(${questId})">Back</button>
                <button class="primary-btn" onclick="submitCollectiveTask(${questId})">Add Task</button>
            </div>
        `);
    });
}

async function submitCollectiveTask(questId) {
    const title = document.getElementById('ct-title').value.trim();
    if (!title) { showError('Title is required'); return; }
    const assignedKidId = parseInt(document.getElementById('ct-kid').value) || 0;
    const result = await apiCall('add_collective_task', {
        quest_id: questId,
        title,
        description: document.getElementById('ct-desc').value.trim(),
        points: parseInt(document.getElementById('ct-points').value) || 10,
        assigned_kid_id: assignedKidId || null
    });
    if (result.ok) {
        viewCollectiveTasks(questId);
    } else {
        showError(result.error);
    }
}

async function deleteCollectiveTask(taskId, questId) {
    if (!confirm('Delete this task?')) return;
    const result = await apiCall('delete_collective_task', { task_id: taskId });
    if (result.ok) {
        viewCollectiveTasks(questId);
    } else {
        showError(result.error);
    }
}

let currentCollectiveStatus = 'pending';

async function loadCollectiveSubmissions(status) {
    currentCollectiveStatus = status;
    document.querySelectorAll('.filter-btn-collective').forEach(b => {
        b.classList.toggle('active', b.dataset.status === status);
    });
    const result = await apiCall('list_collective_submissions', { status });
    if (!result.ok) return;

    if (result.data.length === 0) {
        document.getElementById('collective-submissions-list').innerHTML = `<p>No ${status} submissions.</p>`;
        return;
    }

    const html = result.data.map(s => `
        <div class="list-item">
            <div class="list-item-info">
                <h4>${s.kid_name} — ${s.task_title}</h4>
                <p style="font-size:13px;color:#6B7280;">Quest: ${s.quest_title} · ${s.points} pts · Period: ${s.period_key}</p>
                ${s.note ? `<p style="font-style:italic;color:#374151;">"${s.note}"</p>` : ''}
                <p style="font-size:12px;color:#9CA3AF;">Submitted: ${new Date(s.submitted_at).toLocaleString()}</p>
            </div>
            <div class="list-item-actions">
                ${status === 'pending' ? `
                <button class="primary-btn small-btn" onclick="reviewCollectiveTask(${s.id}, 'approved')">✅ Approve</button>
                <button class="danger-btn small-btn" onclick="reviewCollectiveTask(${s.id}, 'rejected')">❌ Reject</button>
                ` : `<span style="font-size:13px;font-weight:600;color:${status==='approved'?'#059669':'#DC2626'};">${status==='approved'?'✅ Approved':'❌ Rejected'}</span>`}
            </div>
        </div>
    `).join('');
    document.getElementById('collective-submissions-list').innerHTML = html;
}

async function reviewCollectiveTask(completionId, status) {
    const result = await apiCall('review_collective_task', { completion_id: completionId, status });
    if (result.ok) {
        showSuccess(status === 'approved' ? 'Approved! Points awarded.' : 'Rejected.');
        loadCollectiveSubmissions(currentCollectiveStatus);
        loadCollectiveQuests();
    } else {
        showError(result.error);
    }
}

document.querySelectorAll('.filter-btn-collective').forEach(btn => {
    btn.addEventListener('click', () => loadCollectiveSubmissions(btn.dataset.status));
});

// Themes
async function loadThemes() {
    console.log('Loading themes...');
    const result = await apiCall('list_themes');
    console.log('Themes API result:', result);
    
    if (result.ok) {
        const container = document.getElementById('themes-list');
        if (!container) {
            console.error('themes-list container not found!');
            return;
        }
        
        container.innerHTML = '';
        
        result.data.forEach(theme => {
            const themeCard = document.createElement('div');
            themeCard.className = 'list-item';
            themeCard.style.cssText = `border-left: 5px solid ${theme.accent_color}; background: ${theme.bg_gradient};`;
            
            themeCard.innerHTML = `
                <div class="list-item-info" style="color: ${theme.text_color};">
                    <h4 style="color: ${theme.text_color};">${theme.name}</h4>
                    <p style="color: ${theme.text_color}; opacity: 0.9;">
                        Border: ${theme.border_width} ${theme.border_style} • 
                        Radius: ${theme.border_radius} • 
                        Font: ${theme.font_family}
                    </p>
                </div>
                <div class="list-item-actions">
                    <button class="secondary-btn small-btn edit-theme-btn">Edit</button>
                </div>
            `;
            
            // Attach click handler
            const editBtn = themeCard.querySelector('.edit-theme-btn');
            editBtn.addEventListener('click', () => {
                editTheme(theme.id, theme);
            });
            
            container.appendChild(themeCard);
        });
        
        if (result.data.length === 0) {
            container.innerHTML = '<p>No themes found</p>';
        }
    } else {
        console.error('Themes API error:', result.error);
        const container = document.getElementById('themes-list');
        if (container) {
            container.innerHTML = `<p style="color: red;">Error loading themes: ${result.error || 'Unknown error'}</p>`;
        }
    }
}

function editTheme(themeId, themeData) {
    const theme = typeof themeData === 'string' ? JSON.parse(themeData) : themeData;
    
    // Helper function
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '255, 255, 255';
    }
    
    const cardBgRgb = hexToRgb(theme.card_bg_color || '#FFFFFF');
    const cardOpacity = theme.card_opacity || 0.95;
    
    openModal(`
        <h3>Edit Theme: ${theme.name}</h3>
        <div style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
            
            <!-- Theme Name -->
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Theme Name</label>
                <input type="text" id="theme-name" value="${theme.name}" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            
            <!-- Colors -->
            <h4 style="margin: 20px 0 10px 0;">Colors</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Background</label>
                    <input type="color" id="theme-bg-color" value="${theme.bg_color}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Text Color</label>
                    <input type="color" id="theme-text-color" value="${theme.text_color}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Accent Color</label>
                    <input type="color" id="theme-accent-color" value="${theme.accent_color}" style="width: 100%; height: 40px;">
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Background Gradient (CSS)</label>
                <input type="text" id="theme-gradient" value="${theme.bg_gradient}" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            
            <!-- Card Settings -->
            <h4 style="margin: 20px 0 10px 0;">Card Settings</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Card Color</label>
                    <input type="color" id="theme-card-bg" value="${theme.card_bg_color || '#FFFFFF'}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Opacity</label>
                    <input type="number" id="theme-card-opacity" value="${theme.card_opacity || 0.95}" min="0" max="1" step="0.05" style="width: 100%; padding: 8px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Blur (px)</label>
                    <input type="number" id="theme-card-blur" value="${theme.card_blur || 10}" min="0" max="50" style="width: 100%; padding: 8px;">
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Card Shadow (CSS)</label>
                <input type="text" id="theme-card-shadow" value="${theme.card_shadow || '0 8px 32px rgba(0,0,0,0.1)'}" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            
            <!-- Header Settings -->
            <h4 style="margin: 20px 0 10px 0;">Header Settings</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Header Color</label>
                    <input type="color" id="theme-header-bg" value="${theme.header_bg_color || '#FFFFFF'}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Opacity</label>
                    <input type="number" id="theme-header-opacity" value="${theme.header_opacity || 0.85}" min="0" max="1" step="0.05" style="width: 100%; padding: 8px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Blur (px)</label>
                    <input type="number" id="theme-header-blur" value="${theme.header_blur || 20}" min="0" max="50" style="width: 100%; padding: 8px;">
                </div>
            </div>
            
            <!-- Nav Settings -->
            <h4 style="margin: 20px 0 10px 0;">Navigation Settings</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Nav Color</label>
                    <input type="color" id="theme-nav-bg" value="${theme.nav_bg_color || '#FFFFFF'}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Opacity</label>
                    <input type="number" id="theme-nav-opacity" value="${theme.nav_opacity || 0.95}" min="0" max="1" step="0.05" style="width: 100%; padding: 8px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Blur (px)</label>
                    <input type="number" id="theme-nav-blur" value="${theme.nav_blur || 20}" min="0" max="50" style="width: 100%; padding: 8px;">
                </div>
            </div>
            
            <!-- Border & Font -->
            <h4 style="margin: 20px 0 10px 0;">Border & Typography</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px;">Border Style</label>
                    <select id="theme-border-style" style="width: 100%; padding: 8px;">
                        <option value="solid" ${theme.border_style === 'solid' ? 'selected' : ''}>Solid</option>
                        <option value="dashed" ${theme.border_style === 'dashed' ? 'selected' : ''}>Dashed</option>
                        <option value="dotted" ${theme.border_style === 'dotted' ? 'selected' : ''}>Dotted</option>
                        <option value="double" ${theme.border_style === 'double' ? 'selected' : ''}>Double</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Width</label>
                    <input type="text" id="theme-border-width" value="${theme.border_width}" style="width: 100%; padding: 8px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px;">Radius</label>
                    <input type="text" id="theme-border-radius" value="${theme.border_radius}" style="width: 100%; padding: 8px;">
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Font Family</label>
                <select id="theme-font-family" style="width: 100%; padding: 8px;">
                    <option value="Quicksand" ${theme.font_family === 'Quicksand' ? 'selected' : ''}>Quicksand</option>
                    <option value="Poppins" ${theme.font_family === 'Poppins' ? 'selected' : ''}>Poppins</option>
                    <option value="Nunito" ${theme.font_family === 'Nunito' ? 'selected' : ''}>Nunito</option>
                    <option value="Roboto" ${theme.font_family === 'Roboto' ? 'selected' : ''}>Roboto</option>
                    <option value="Comic Neue" ${theme.font_family === 'Comic Neue' ? 'selected' : ''}>Comic Neue</option>
                    <option value="Russo One" ${theme.font_family === 'Russo One' ? 'selected' : ''}>Russo One</option>
                    <option value="Orbitron" ${theme.font_family === 'Orbitron' ? 'selected' : ''}>Orbitron</option>
                    <option value="Fredoka One" ${theme.font_family === 'Fredoka One' ? 'selected' : ''}>Fredoka One</option>
                    <option value="Press Start 2P" ${theme.font_family === 'Press Start 2P' ? 'selected' : ''}>Press Start 2P</option>
                </select>
            </div>
            
            <!-- Button Gradient -->
            <h4 style="margin: 20px 0 10px 0;">Button Styling</h4>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Button Gradient (CSS) - Optional</label>
                <input type="text" id="theme-button-gradient" value="${theme.button_gradient || ''}" placeholder="linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
            </div>
            
            <!-- Animation -->
            <h4 style="margin: 20px 0 10px 0;">Animation</h4>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center; margin-bottom: 15px;">
                <label>
                    <input type="checkbox" id="theme-has-animation" ${theme.has_animation ? 'checked' : ''}> Enable
                </label>
                <select id="theme-animation-type" style="width: 100%; padding: 8px;" ${!theme.has_animation ? 'disabled' : ''}>
                    <option value="">None</option>
                    <option value="stars" ${theme.animation_type === 'stars' ? 'selected' : ''}>⭐ Stars</option>
                    <option value="bubbles" ${theme.animation_type === 'bubbles' ? 'selected' : ''}>🫧 Bubbles</option>
                    <option value="snowflakes" ${theme.animation_type === 'snowflakes' ? 'selected' : ''}>❄️ Snowflakes</option>
                    <option value="embers" ${theme.animation_type === 'embers' ? 'selected' : ''}>🔥 Embers</option>
                    <option value="sparkles" ${theme.animation_type === 'sparkles' ? 'selected' : ''}>✨ Sparkles</option>
                    <option value="sand" ${theme.animation_type === 'sand' ? 'selected' : ''}>🏜️ Sand Blowing</option>
                    <option value="aurora" ${theme.animation_type === 'aurora' ? 'selected' : ''}>🌌 Aurora Borealis</option>
                    <option value="leaves" ${theme.animation_type === 'leaves' ? 'selected' : ''}>🍃 Falling Leaves</option>
                    <option value="candy" ${theme.animation_type === 'candy' ? 'selected' : ''}>🍬 Candy Sprinkles</option>
                    <option value="retro" ${theme.animation_type === 'retro' ? 'selected' : ''}>👾 8-Bit Sprites</option>
                    <option value="birds" ${theme.animation_type === 'birds' ? 'selected' : ''}>🦅 Flying Birds</option>
                    <option value="mushrooms" ${theme.animation_type === 'mushrooms' ? 'selected' : ''}>🍄 Mushrooms</option>
                    <option value="unicorn" ${theme.animation_type === 'unicorn' ? 'selected' : ''}>🦄 Unicorn Magic</option>
                    <option value="camping" ${theme.animation_type === 'camping' ? 'selected' : ''}>🏕️ Campfire</option>
                    <option value="mountains" ${theme.animation_type === 'mountains' ? 'selected' : ''}>⛰️ Mountain Snow</option>
                    <option value="clouds" ${theme.animation_type === 'clouds' ? 'selected' : ''}>☁️ Drifting Clouds</option>
                </select>
            </div>
            
            <!-- Preview -->
            <h4 style="margin: 20px 0 10px 0;">Preview</h4>
            <div id="theme-preview" style="padding: 20px; background: ${theme.bg_gradient}; border-radius: 12px; margin-bottom: 15px;">
                <div style="background: rgba(${cardBgRgb}, ${cardOpacity}); padding: 15px; border-radius: 12px; backdrop-filter: blur(${theme.card_blur || 10}px);">
                    <h3 style="margin: 0; color: #1F2937;">Sample Card</h3>
                    <p style="margin: 10px 0 0 0; color: #6B7280;">Preview of card styling</p>
                </div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="saveTheme(${themeId})">Save Theme</button>
        </div>
    `);
    
    // Animation checkbox handler
    const animCheckbox = document.getElementById('theme-has-animation');
    const animDropdown = document.getElementById('theme-animation-type');
    if (animCheckbox && animDropdown) {
        animCheckbox.addEventListener('change', () => {
            animDropdown.disabled = !animCheckbox.checked;
        });
    }
    
    // Live preview on any input change
    document.querySelectorAll('#theme-gradient, #theme-card-bg, #theme-card-opacity, #theme-card-blur').forEach(el => {
        if (el) {
            el.addEventListener('input', updateThemePreviewSimple);
        }
    });
}

function updateThemePreviewSimple() {
    const preview = document.getElementById('theme-preview');
    if (!preview) return;
    
    const gradient = document.getElementById('theme-gradient')?.value;
    const cardBg = document.getElementById('theme-card-bg')?.value || '#FFFFFF';
    const cardOpacity = document.getElementById('theme-card-opacity')?.value || 0.95;
    const cardBlur = document.getElementById('theme-card-blur')?.value || 10;
    
    if (gradient) preview.style.background = gradient;
    
    const card = preview.querySelector('div');
    if (card && cardBg) {
        const rgb = cardBg.match(/\w\w/g)?.map(x => parseInt(x, 16)).join(', ') || '255, 255, 255';
        card.style.background = `rgba(${rgb}, ${cardOpacity})`;
        card.style.backdropFilter = `blur(${cardBlur}px)`;
    }
}

async function saveTheme(themeId) {
    const name = document.getElementById('theme-name').value.trim();
    const bgColor = document.getElementById('theme-bg-color').value;
    const bgGradient = document.getElementById('theme-gradient').value.trim();
    const textColor = document.getElementById('theme-text-color').value;
    const accentColor = document.getElementById('theme-accent-color').value;
    const borderStyle = document.getElementById('theme-border-style').value;
    const borderWidth = document.getElementById('theme-border-width').value.trim();
    const borderRadius = document.getElementById('theme-border-radius').value.trim();
    const fontFamily = document.getElementById('theme-font-family').value;
    const hasAnimation = document.getElementById('theme-has-animation').checked ? 1 : 0;
    const animationType = document.getElementById('theme-animation-type').value;
    
    // New CSS controls
    const cardBgColor = document.getElementById('theme-card-bg').value;
    const cardOpacity = parseFloat(document.getElementById('theme-card-opacity').value);
    const cardBlur = parseInt(document.getElementById('theme-card-blur').value);
    const cardShadow = document.getElementById('theme-card-shadow').value.trim();
    const headerBgColor = document.getElementById('theme-header-bg').value;
    const headerOpacity = parseFloat(document.getElementById('theme-header-opacity').value);
    const headerBlur = parseInt(document.getElementById('theme-header-blur').value);
    const navBgColor = document.getElementById('theme-nav-bg').value;
    const navOpacity = parseFloat(document.getElementById('theme-nav-opacity').value);
    const navBlur = parseInt(document.getElementById('theme-nav-blur').value);
    const buttonGradient = document.getElementById('theme-button-gradient').value.trim();
    
    if (!name) {
        showError('Theme name is required');
        return;
    }
    
    const result = await apiCall('update_theme', {
        theme_id: themeId,
        name: name,
        bg_color: bgColor,
        bg_gradient: bgGradient,
        text_color: textColor,
        accent_color: accentColor,
        border_style: borderStyle,
        border_width: borderWidth,
        border_radius: borderRadius,
        font_family: fontFamily,
        has_animation: hasAnimation,
        animation_type: animationType,
        card_bg_color: cardBgColor,
        card_opacity: cardOpacity,
        card_blur: cardBlur,
        card_shadow: cardShadow,
        header_bg_color: headerBgColor,
        header_opacity: headerOpacity,
        header_blur: headerBlur,
        nav_bg_color: navBgColor,
        nav_opacity: navOpacity,
        nav_blur: navBlur,
        button_gradient: buttonGradient
    });
    
    if (result.ok) {
        closeModal();
        showSuccess('Theme updated!');
        loadThemes();
    } else {
        showError(result.error);
    }
}

// Games Configuration
async function loadGames() {
    const [bmRes, pianoRes] = await Promise.all([
        apiCall('get_game_settings', { game_type: 'beat_master' }),
        apiCall('get_game_settings', { game_type: 'piano' }),
    ]);

    const bmPads = (bmRes.ok && bmRes.settings.pads) ? bmRes.settings.pads : [
        { color: 'red',    note: 'C4', frequency: 261.63, waveform: 'sine' },
        { color: 'blue',   note: 'E4', frequency: 329.63, waveform: 'sine' },
        { color: 'green',  note: 'G4', frequency: 392.00, waveform: 'sine' },
        { color: 'yellow', note: 'A4', frequency: 440.00, waveform: 'sine' },
    ];
    const pianoWaveform = (pianoRes.ok && pianoRes.settings.waveform) ? pianoRes.settings.waveform : 'triangle';

    const PAD_COLORS = { red: '#EF4444', blue: '#3B82F6', green: '#10B981', yellow: '#F59E0B' };
    const NOTE_PRESETS = [
        { label: 'C3 (130 Hz)',  freq: 130.81 }, { label: 'D3 (147 Hz)',  freq: 146.83 },
        { label: 'E3 (165 Hz)',  freq: 164.81 }, { label: 'G3 (196 Hz)',  freq: 196.00 },
        { label: 'A3 (220 Hz)',  freq: 220.00 }, { label: 'C4 (262 Hz)',  freq: 261.63 },
        { label: 'D4 (294 Hz)',  freq: 293.66 }, { label: 'E4 (330 Hz)',  freq: 329.63 },
        { label: 'F4 (349 Hz)',  freq: 349.23 }, { label: 'G4 (392 Hz)',  freq: 392.00 },
        { label: 'A4 (440 Hz)',  freq: 440.00 }, { label: 'B4 (494 Hz)',  freq: 493.88 },
        { label: 'C5 (523 Hz)',  freq: 523.25 }, { label: 'D5 (587 Hz)',  freq: 587.33 },
        { label: 'E5 (659 Hz)',  freq: 659.25 }, { label: 'G5 (784 Hz)',  freq: 783.99 },
    ];

    const presetOptions = NOTE_PRESETS.map(p => `<option value="${p.freq}">${p.label}</option>`).join('');

    const padRows = bmPads.map((pad, i) => `
        <div style="display:flex; align-items:center; gap:12px; padding:12px; background:white; border-radius:12px; margin-bottom:8px; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
            <div style="width:36px; height:36px; border-radius:50%; background:${PAD_COLORS[pad.color]}; flex-shrink:0;"></div>
            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; text-transform:capitalize; margin-bottom:6px;">${pad.color} Pad</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <select id="bm-pad-note-${i}" style="flex:1; min-width:120px; padding:6px 8px; border:1px solid #D1D5DB; border-radius:8px; font-size:13px;">
                        ${presetOptions}
                    </select>
                    <input id="bm-pad-freq-${i}" type="number" step="0.01" min="60" max="2000"
                        value="${pad.frequency.toFixed(2)}"
                        style="width:90px; padding:6px 8px; border:1px solid #D1D5DB; border-radius:8px; font-size:13px;"
                        placeholder="Hz" title="Custom frequency (Hz)">
                    <select id="bm-pad-wave-${i}" style="width:110px; padding:6px 8px; border:1px solid #D1D5DB; border-radius:8px; font-size:13px;">
                        <option value="sine"     ${pad.waveform==='sine'     ? 'selected':''}>Sine (soft)</option>
                        <option value="triangle" ${pad.waveform==='triangle' ? 'selected':''}>Triangle</option>
                        <option value="square"   ${pad.waveform==='square'   ? 'selected':''}>Square (retro)</option>
                        <option value="sawtooth" ${pad.waveform==='sawtooth' ? 'selected':''}>Sawtooth</option>
                    </select>
                    <button onclick="previewBeatPad(${i})" style="padding:6px 12px; background:#8B5CF6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px;">▶ Test</button>
                </div>
            </div>
        </div>
    `).join('');

    const container = document.getElementById('games-list');
    if (!container) return;
    container.innerHTML = `
        <div class="card" style="margin-bottom:20px;">
            <h3 style="margin:0 0 4px;">🎵 Beat Master — Pad Notes</h3>
            <p style="color:#6B7280; font-size:14px; margin:0 0 16px;">Customize the note each colored pad plays. Pick from the preset dropdown or type a custom Hz value.</p>
            ${padRows}
            <button onclick="saveBeatMasterSettings()" style="width:100%; padding:14px; background:linear-gradient(135deg,#8B5CF6,#6D28D9); color:white; border:none; border-radius:12px; font-size:16px; font-weight:600; cursor:pointer; margin-top:8px;">
                💾 Save Beat Master Settings
            </button>
        </div>
        <div class="card">
            <h3 style="margin:0 0 4px;">🎹 Piano — Default Sound</h3>
            <p style="color:#6B7280; font-size:14px; margin:0 0 12px;">Choose the default waveform kids hear when opening the Piano.</p>
            <select id="piano-waveform-select" style="width:100%; padding:10px; border:1px solid #D1D5DB; border-radius:8px; font-size:15px; margin-bottom:12px;">
                <option value="triangle" ${pianoWaveform==='triangle' ? 'selected':''}>🎹 Triangle (piano-like)</option>
                <option value="sine"     ${pianoWaveform==='sine'     ? 'selected':''}>🎵 Sine (flute-like)</option>
                <option value="sawtooth" ${pianoWaveform==='sawtooth' ? 'selected':''}>🎸 Sawtooth (guitar-like)</option>
                <option value="square"   ${pianoWaveform==='square'   ? 'selected':''}>🎮 Square (retro)</option>
            </select>
            <button onclick="savePianoSettings()" style="width:100%; padding:14px; background:linear-gradient(135deg,#4F46E5,#3730A3); color:white; border:none; border-radius:12px; font-size:16px; font-weight:600; cursor:pointer;">
                💾 Save Piano Settings
            </button>
        </div>
    `;

    // Sync preset dropdowns to current frequencies
    bmPads.forEach((pad, i) => {
        const sel = document.getElementById(`bm-pad-note-${i}`);
        if (!sel) return;
        // Pre-select the closest preset
        const closest = NOTE_PRESETS.reduce((a, b) =>
            Math.abs(a.freq - pad.frequency) < Math.abs(b.freq - pad.frequency) ? a : b);
        sel.value = closest.freq;
        // When preset changes, update the Hz input
        sel.addEventListener('change', () => {
            const freqInput = document.getElementById(`bm-pad-freq-${i}`);
            if (freqInput) freqInput.value = parseFloat(sel.value).toFixed(2);
        });
    });
}

// Beat Master preview — plays a tone in the admin browser
let _adminAudioCtx = null;
function previewBeatPad(padIndex) {
    try {
        if (!_adminAudioCtx) _adminAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (_adminAudioCtx.state === 'suspended') _adminAudioCtx.resume();
        const freqInput = document.getElementById(`bm-pad-freq-${padIndex}`);
        const waveInput = document.getElementById(`bm-pad-wave-${padIndex}`);
        const freq = parseFloat(freqInput?.value) || 440;
        const wave = waveInput?.value || 'sine';
        const osc = _adminAudioCtx.createOscillator();
        const gain = _adminAudioCtx.createGain();
        osc.connect(gain); gain.connect(_adminAudioCtx.destination);
        osc.type = wave; osc.frequency.value = freq;
        const t = _adminAudioCtx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.start(t); osc.stop(t + 0.5);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (e) { console.warn('Preview audio error:', e); }
}

async function saveBeatMasterSettings() {
    const pads = [];
    const PAD_COLORS = ['red', 'blue', 'green', 'yellow'];
    for (let i = 0; i < 4; i++) {
        const freq = parseFloat(document.getElementById(`bm-pad-freq-${i}`)?.value) || 440;
        const wave = document.getElementById(`bm-pad-wave-${i}`)?.value || 'sine';
        const notePresets = {
            261.63:'C4', 293.66:'D4', 329.63:'E4', 349.23:'F4', 392.00:'G4',
            440.00:'A4', 493.88:'B4', 523.25:'C5', 130.81:'C3', 220.00:'A3',
        };
        const note = notePresets[freq] || `${freq}Hz`;
        pads.push({ color: PAD_COLORS[i], note, frequency: freq, waveform: wave });
    }
    const result = await apiCall('save_game_settings', { game_type: 'beat_master', settings: { pads } });
    if (result.ok) {
        showSuccess('Beat Master settings saved! Kids will hear the new notes next time they open the game.');
    } else {
        showError(result.error || 'Failed to save');
    }
}

async function savePianoSettings() {
    const waveform = document.getElementById('piano-waveform-select')?.value || 'triangle';
    const result = await apiCall('save_game_settings', { game_type: 'piano', settings: { waveform } });
    if (result.ok) {
        showSuccess('Piano settings saved!');
    } else {
        showError(result.error || 'Failed to save');
    }
}

// Rewards
async function loadRewards() {
    const result = await apiCall('list_rewards');
    if (result.ok) {
        const html = result.data.map(reward => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${reward.title}</h4>
                    <p>${reward.description || 'No description'}</p>
                    <p>${reward.cost_points} points • ${reward.is_active ? '✅ Active' : '❌ Inactive'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="secondary-btn small-btn" onclick="toggleReward(${reward.id})">${reward.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button class="secondary-btn small-btn" onclick="editReward(${reward.id})">Edit</button>
                    <button class="danger-btn small-btn" onclick="deleteReward(${reward.id}, '${reward.title.replace(/'/g, "\\'")}')">Delete</button>
                </div>
            </div>
        `).join('');
        document.getElementById('rewards-list').innerHTML = html || '<p>No rewards created yet</p>';
    }
}

async function editReward(rewardId) {
    const result = await apiCall('list_rewards');
    if (!result.ok) return;
    const reward = result.data.find(r => r.id === rewardId);
    if (!reward) return;

    openModal(`
        <h3>Edit Reward</h3>
        <input type="text" id="edit-reward-title" placeholder="Title" value="${reward.title.replace(/"/g, '&quot;')}" required>
        <textarea id="edit-reward-description" placeholder="Description">${reward.description || ''}</textarea>
        <input type="number" id="edit-reward-cost" placeholder="Cost (points)" value="${reward.cost_points}" min="1">
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="saveReward(${rewardId})">Save Changes</button>
        </div>
    `);
}

async function saveReward(rewardId) {
    const title       = document.getElementById('edit-reward-title').value.trim();
    const description = document.getElementById('edit-reward-description').value.trim();
    const cost        = parseInt(document.getElementById('edit-reward-cost').value);

    if (!title) { showError('Title is required'); return; }

    const result = await apiCall('update_reward', { reward_id: rewardId, title, description, cost_points: cost });
    if (result.ok) {
        closeModal();
        showSuccess('Reward updated');
        loadRewards();
    } else {
        showError(result.error);
    }
}

async function deleteReward(rewardId, rewardTitle) {
    if (!confirm(`Delete reward "${rewardTitle}"?\n\nThis cannot be undone.`)) return;
    const result = await apiCall('delete_reward', { reward_id: rewardId });
    if (result.ok) {
        showSuccess('Reward deleted');
        loadRewards();
    } else {
        showError(result.error);
    }
}

document.getElementById('add-reward-btn').addEventListener('click', () => {
    openModal(`
        <h3>Add Reward</h3>
        <input type="text" id="reward-title" placeholder="Title" required>
        <textarea id="reward-description" placeholder="Description"></textarea>
        <input type="number" id="reward-cost" placeholder="Cost (points)" value="50" min="1">
        <div class="modal-actions">
            <button class="secondary-btn" onclick="closeModal()">Cancel</button>
            <button class="primary-btn" onclick="createReward()">Add Reward</button>
        </div>
    `);
});

async function createReward() {
    const title = document.getElementById('reward-title').value.trim();
    const description = document.getElementById('reward-description').value.trim();
    const cost = parseInt(document.getElementById('reward-cost').value);
    
    if (!title) {
        showError('Title is required');
        return;
    }
    
    const result = await apiCall('create_reward', {
        title,
        description,
        cost_points: cost
    });
    
    if (result.ok) {
        closeModal();
        showSuccess('Reward created');
        loadRewards();
    } else {
        showError(result.error);
    }
}

async function toggleReward(rewardId) {
    const result = await apiCall('toggle_reward', { reward_id: rewardId });
    if (result.ok) {
        loadRewards();
    }
}

// Settings
document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    
    if (newPass.length < 8) {
        document.getElementById('password-message').textContent = 'Password must be at least 8 characters';
        document.getElementById('password-message').className = 'message error';
        return;
    }
    
    const result = await apiCall('admin_change_password', {
        current_password: current,
        new_password: newPass
    });
    
    if (result.ok) {
        document.getElementById('password-message').textContent = 'Password changed successfully';
        document.getElementById('password-message').className = 'message success';
        document.getElementById('change-password-form').reset();
    } else {
        document.getElementById('password-message').textContent = result.error;
        document.getElementById('password-message').className = 'message error';
    }
});

// Event Listeners
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadSubmissions(btn.dataset.status);
    });
});

document.querySelector('.close').addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) {
        closeModal();
    }
});

// Add quest task filter buttons
document.querySelectorAll('.filter-btn-quest-task').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn-quest-task').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadQuestTaskSubmissions(btn.dataset.status);
    });
});

// Add this after the submissions filter buttons
document.querySelectorAll('.filter-btn-redemption').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn-redemption').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadRedemptions(btn.dataset.status);
    });
});



// Redemptions
let currentRedemptionsStatus = 'pending';

async function loadRedemptions(status) {
    console.log('Loading redemptions with status:', status);
    currentRedemptionsStatus = status;
    
    const result = await apiCall('list_redemptions', { status });
    
    console.log('Redemptions API result:', result);
    
    if (result.ok) {
        console.log('Redemptions data:', result.data);
        
        if (!result.data || result.data.length === 0) {
            document.getElementById('redemptions-list').innerHTML = `<p>No ${status} redemptions</p>`;
            return;
        }
        
        const html = result.data.map(red => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${red.kid_name} - ${red.reward_title}</h4>
                    <p>Cost: ${red.cost_points} points</p>
                    <p>Requested: ${formatDate(red.requested_at)}</p>
                    ${red.status !== 'pending' ? `<p>Resolved: ${formatDate(red.resolved_at)}</p>` : ''}
                </div>
                <div class="list-item-actions">
                    ${red.status === 'pending' ? `
                        <button class="success-btn small-btn" onclick="reviewRedemption(${red.id}, 'approved')">Approve</button>
                        <button class="danger-btn small-btn" onclick="reviewRedemption(${red.id}, 'rejected')">Reject</button>
                    ` : `
                        <span class="badge badge-${red.status === 'approved' ? 'success' : 'danger'}">${red.status.toUpperCase()}</span>
                    `}
                </div>
            </div>
        `).join('');
        
        document.getElementById('redemptions-list').innerHTML = html;
    } else {
        console.error('Redemptions API error:', result.error);
        document.getElementById('redemptions-list').innerHTML = `<p style="color: red;">Error: ${result.error}</p>`;
    }
}

async function reviewRedemption(redemptionId, status) {
    if (!confirm(`${status === 'approved' ? 'Approve' : 'Reject'} this redemption?`)) return;
    
    const result = await apiCall('review_redemption', {
        redemption_id: redemptionId,
        status
    });
    
    if (result.ok) {
        showSuccess(`Redemption ${status}`);
        loadRedemptions(currentRedemptionsStatus);
        loadDashboard();
    } else {
        showError(result.error);
    }
}

// Family Groups
async function loadFamilies() {
    const container = document.getElementById('families-list');
    if (!container) return;

    // For now, show the current family (single-family mode)
    // Multi-family / SaaS support is planned for a future phase
    const kidsResult = await apiCall('list_kids');
    const kids = kidsResult.ok ? kidsResult.data : [];

    container.innerHTML = `
        <div class="list-item" style="border-left: 4px solid #4f46e5;">
            <div class="list-item-info">
                <h4>Your Family</h4>
                <p>${kids.length} kid(s) registered &nbsp;•&nbsp; Admin: ${document.getElementById('admin-email')?.textContent || 'you'}</p>
                <p style="color:#6B7280; font-size:13px; margin-top:4px;">
                    Kids: ${kids.map(k => k.kid_name || k.name).join(', ') || '—'}
                </p>
            </div>
        </div>
        <div style="margin-top:20px; padding:16px; background:#f0f9ff; border-radius:10px; border:1px solid #bae6fd;">
            <strong>🚀 Multi-Family Support</strong>
            <p style="margin-top:8px; color:#0369a1; font-size:14px;">
                Inviting other families, group management, and Google Sign-In are planned for a future phase.
                Each family admin would register independently and manage their own kids, chores, and rewards.
            </p>
        </div>
    `;
}

function showAddFamilyModal() {
    openModal(`
        <h3>🏠 Add Another Family</h3>
        <p style="color:#6B7280; margin-bottom:16px;">
            Multi-family support is coming in a future update. Each family will be able to sign up
            independently using Google or email, and manage their own kids, chores, and rewards.
        </p>
        <div style="background:#f0f9ff; padding:12px; border-radius:8px; margin-bottom:16px;">
            <strong>Planned features:</strong><br>
            • Google Sign-In for easy onboarding<br>
            • Family admin invites family members<br>
            • Isolated data per family<br>
            • Shared chore template library
        </div>
        <div class="modal-actions">
            <button class="primary-btn" onclick="closeModal()">Got it!</button>
        </div>
    `);
}

// Admin Management
async function loadAdmins() {
    const result = await apiCall('list_admins');
    if (result.ok) {
        const html = result.data.map(admin => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${admin.name || admin.email}</h4>
                    <p>${admin.email}</p>
                    <p>Created: ${formatDate(admin.created_at)}</p>
                </div>
                <div class="list-item-actions">
                    ${admin.id !== currentUser.id ? `
                        <button class="danger-btn small-btn" onclick="deleteAdmin(${admin.id}, '${admin.email}')">Delete</button>
                    ` : `
                        <span class="badge badge-primary">Current User</span>
                    `}
                </div>
            </div>
        `).join('');
        document.getElementById('admins-list').innerHTML = html;
    }
}

function showAddAdminModal() {
    openModal(`
        <h3>Add Admin User</h3>
        <form id="add-admin-form" onsubmit="createAdmin(event); return false;">
            <input type="text" id="admin-name" placeholder="Name (optional)" autocomplete="name">
            <input type="email" id="admin-email" placeholder="Email" required autocomplete="email">
            <input type="password" id="admin-password" placeholder="Password (min 8 chars)" required autocomplete="new-password" minlength="8">
            <div class="modal-actions">
                <button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button>
                <button type="submit" class="primary-btn">Create Admin</button>
            </div>
        </form>
    `);
}

async function createAdmin(event) {
    if (event) event.preventDefault();
    
    const form = document.getElementById('add-admin-form');
    if (!form) {
        console.error('Form not found');
        return;
    }
    
    const nameInput = form.querySelector('#admin-name');
    const emailInput = form.querySelector('#admin-email');
    const passwordInput = form.querySelector('#admin-password');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    
    if (!email || !password) {
        alert('Email and password required');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }
    
    const result = await apiCall('create_admin', { name, email, password });
    
    if (result.ok) {
        closeModal();
        alert(`Admin created: ${email}`);
        loadAdmins();
    } else {
        alert('Error: ' + result.error);
    }
}

async function deleteAdmin(adminId, email) {
    if (!confirm(`Delete admin: ${email}?`)) return;
    
    const result = await apiCall('delete_admin', { admin_id: adminId });
    
    if (result.ok) {
        showSuccess('Admin deleted');
        loadAdmins();
    } else {
        showError(result.error);
    }
}

// Setup Wizard
let wizardPresets = null;
let selectedKidId = null;

async function loadWizard() {
    // Load presets
    const result = await apiCall('load_chore_presets');
    if (result.ok) {
        wizardPresets = result.data;
    }
    
    // Load kids for selection
    const kidsResult = await apiCall('list_kids');
    if (kidsResult.ok && kidsResult.data && kidsResult.data.length > 0) {
        const container = document.getElementById('wizard-kid-selection');
        
        kidsResult.data.forEach(kid => {
            const label = document.createElement('label');
            label.className = 'kid-option';
            label.innerHTML = `
                <input type="radio" name="wizard-kid" value="${kid.id}">
                <span>${kid.kid_name || kid.name || 'Kid #' + kid.id}</span>
            `;
            container.appendChild(label);
        });
    } else {
        console.log('No kids found or empty response:', kidsResult);
    }
}

function wizardNext(step) {
    // Hide current step
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    
    // Show next step
    document.getElementById(`wizard-step-${step}`).classList.add('active');
    
    // Save kid selection on step 1→2
    if (step === 2) {
        const selected = document.querySelector('input[name="wizard-kid"]:checked');
        selectedKidId = selected ? selected.value : null;
    }
}

function wizardBack(step) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`wizard-step-${step}`).classList.add('active');
}

async function installPresets() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Installing...';
    
    try {
        let totalChores = 0;
        
        // Get selected categories
        const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
            .map(cb => cb.value);
        
        // Install each category
        for (const category of selectedCategories) {
            const chores = wizardPresets[category];
            
            const result = await apiCall('install_preset_category', {
                category: category,
                chores: chores,
                kid_id: selectedKidId || null
            });
            
            if (result.ok) {
                totalChores += result.data.installed;
            }
        }
        
        // Install rewards if selected
        let totalRewards = 0;
        if (document.getElementById('install-rewards').checked) {
            const result = await apiCall('install_preset_rewards', {
                rewards: wizardPresets.rewards
            });
            
            if (result.ok) {
                totalRewards = result.data.installed;
            }
        }
        
        // Show success
        document.getElementById('wizard-summary').innerHTML = `
            <strong>Successfully installed:</strong><br>
            ✓ ${totalChores} chores<br>
            ✓ ${totalRewards} rewards<br><br>
            Your family is ready to start earning points!
        `;
        
        wizardNext(4);
        
    } catch (error) {
        alert('Error installing presets: ' + error.message);
        btn.disabled = false;
        btn.textContent = '🚀 Install Everything!';
    }
}

function resetWizard() {
    // Uncheck all
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelector('input[name="wizard-kid"]').checked = true;
    
    // Go back to step 1
    wizardNext(1);
}

// Load wizard when setup tab is clicked
document.querySelector('[data-tab="setup-wizard"]')?.addEventListener('click', loadWizard);

// Family Board
async function loadFamilyBoard() {
    // Load all data
    const kidsResult = await apiCall('list_kids');
    const rewardsResult = await apiCall('list_rewards');
    const questsResult = await apiCall('list_quests');
    const analyticsResult = await apiCall('family_analytics');
    
    if (!analyticsResult.ok || !kidsResult.ok) {
        document.getElementById('family-kids-grid').innerHTML = '<p>Error loading data</p>';
        return;
    }
    
    const analytics = analyticsResult.data;
    const kids = kidsResult.data;
    
    // 1. ECONOMY STATS
    const totalPointsInCirculation = kids.reduce((sum, k) => sum + k.total_points, 0);
    const avgWeeklyEarnings = analytics.kid_stats.length > 0 
        ? Math.round(analytics.kid_stats.reduce((sum, k) => sum + k.week_earned, 0) / analytics.kid_stats.length)
        : 0;
    const avgMonthlyEarnings = analytics.kid_stats.length > 0
        ? Math.round(analytics.kid_stats.reduce((sum, k) => sum + k.month_earned, 0) / analytics.kid_stats.length)
        : 0;
    
    document.getElementById('economy-stats').innerHTML = `
        <div class="economy-stat-card">
            <div class="label">Total Points in System</div>
            <div class="value">${totalPointsInCirculation}</div>
        </div>
        <div class="economy-stat-card">
            <div class="label">Avg Weekly Earnings</div>
            <div class="value">${avgWeeklyEarnings}</div>
        </div>
        <div class="economy-stat-card">
            <div class="label">Avg Monthly Earnings</div>
            <div class="value">${avgMonthlyEarnings}</div>
        </div>
        <div class="economy-stat-card">
            <div class="label">Recent Redemptions (30d)</div>
            <div class="value">${analytics.recent_redemptions.length}</div>
        </div>
    `;
    
    // 2. KIDS CARDS
    const kidsGrid = document.getElementById('family-kids-grid');
    kidsGrid.innerHTML = analytics.kid_stats.map(kid => `
        <div class="family-kid-card">
            <h3>${kid.kid_name}</h3>
            <div class="points">${kid.total_points}</div>
            <div style="font-size: 14px; opacity: 0.9;">current points</div>
            <div style="margin-top: 10px; font-size: 13px; opacity: 0.8;">
                📊 This week: +${kid.week_earned}
            </div>
        </div>
    `).join('');
    
    // 3. EARNINGS CHART
    const maxEarnings = Math.max(...analytics.kid_stats.map(k => k.month_earned), 1);
    document.getElementById('earnings-chart').innerHTML = `
        <div style="margin-bottom: 15px; color: #6B7280; font-size: 14px;">Monthly earnings comparison (last 30 days)</div>
        ${analytics.kid_stats.map(kid => `
            <div class="earnings-bar" style="--bar-width: ${(kid.month_earned / maxEarnings * 100)}%;">
                <span class="name">${kid.kid_name}</span>
                <span class="points">${kid.month_earned} pts</span>
            </div>
        `).join('')}
    `;
    
    // 4. REWARDS WITH ANALYSIS
    if (rewardsResult.ok) {
        const rewardsGrid = document.getElementById('family-rewards-grid');
        rewardsGrid.innerHTML = rewardsResult.data
            .filter(r => r.is_active)
            .sort((a, b) => a.cost_points - b.cost_points)
            .map(reward => {
                const whoCanAfford = kids.filter(k => k.total_points >= reward.cost_points).map(k => k.kid_name);
                
                // Calculate days to earn for EACH kid individually based on monthly rate
                const kidEarningAnalysis = analytics.kid_stats.map(kid => {
                    const monthlyRate = kid.month_earned; // Points earned in last 30 days
                    const dailyRate = monthlyRate / 30;
                    
                    if (dailyRate <= 0) {
                        return { name: kid.kid_name, days: 999, rate: 0 };
                    }
                    
                    const pointsNeeded = Math.max(0, reward.cost_points - kid.total_points);
                    const daysToEarn = Math.ceil(pointsNeeded / dailyRate);
                    
                    return { 
                        name: kid.kid_name, 
                        days: daysToEarn,
                        rate: dailyRate,
                        hasEnough: kid.total_points >= reward.cost_points
                    };
                }).sort((a, b) => a.days - b.days); // Sort by fastest earner first
                
                // Find the fastest active earner
                const fastestEarner = kidEarningAnalysis.find(k => k.rate > 0);
                
                let analysisClass = 'realistic';
                let analysisText = '';
                
                if (whoCanAfford.length > 0) {
                    analysisClass = 'realistic';
                    analysisText = `✅ Available now for ${whoCanAfford.join(', ')}!`;
                } else if (fastestEarner && fastestEarner.days <= 7) {
                    analysisClass = 'realistic';
                    analysisText = `✅ ${fastestEarner.name} can earn this in ~${fastestEarner.days} day${fastestEarner.days === 1 ? '' : 's'}`;
                } else if (fastestEarner && fastestEarner.days <= 30) {
                    analysisClass = 'challenging';
                    analysisText = `⚠️ ${fastestEarner.name} can earn this in ~${fastestEarner.days} days`;
                } else if (fastestEarner) {
                    analysisClass = 'unrealistic';
                    analysisText = `❌ Takes ${fastestEarner.days}+ days - consider lowering cost`;
                } else {
                    analysisClass = 'unrealistic';
                    analysisText = `❌ No active earners - kids need to complete chores!`;
                }
                
                // Build detailed breakdown
                const earnerBreakdown = kidEarningAnalysis
                    .filter(k => k.rate > 0 && !k.hasEnough)
                    .map(k => `${k.name}: ${k.days}d`)
                    .join(' • ');
                
                return `
                    <div class="family-reward-card ${whoCanAfford.length > 0 ? 'affordable' : ''}">
                        <div class="emoji">${getRewardEmoji(reward.title)}</div>
                        <div class="title">${reward.title}</div>
                        <div class="cost">${reward.cost_points} pts</div>
                        ${reward.description ? `<div style="font-size: 13px; color: #6B7280; margin-top: 5px;">${reward.description}</div>` : ''}
                        ${whoCanAfford.length > 0 ? `<div class="can-afford">✓ ${whoCanAfford.join(', ')} can afford!</div>` : ''}
                        <div class="reward-analysis ${analysisClass}">
                            ${analysisText}
                            ${earnerBreakdown && !whoCanAfford.length ? `<div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">${earnerBreakdown}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
    }

    // 5. QUESTS WITH TOTAL VALUE
    if (questsResult.ok) {
        const questsList = document.getElementById('family-quests-list');
        
        const activeQuests = questsResult.data.filter(q => q.is_active);
        
        if (activeQuests.length === 0) {
            questsList.innerHTML = '<p style="color: #6B7280; text-align: center;">No active quests</p>';
        } else {
            questsList.innerHTML = await Promise.all(
                activeQuests.map(async quest => {
                    const tasksResult = await apiCall('list_quest_tasks', { quest_id: quest.id });
                    const totalValue = tasksResult.ok 
                        ? tasksResult.data.reduce((sum, t) => sum + t.points, 0)
                        : 0;
                    
                    const daysToComplete = avgWeeklyEarnings > 0 && totalValue > 0
                        ? Math.ceil((totalValue / avgWeeklyEarnings) * 7)
                        : 0;
                    
                    return `
                        <div class="family-quest-card">
                            <h4>⭐ ${quest.title}</h4>
                            ${quest.description ? `<p style="color: #6B7280; margin: 5px 0 15px 0;">${quest.description}</p>` : ''}
                            ${quest.target_reward ? `<p style="color: #92400E; font-weight: 600; margin-bottom: 15px;">🎯 Goal: ${quest.target_reward}</p>` : ''}
                            
                            ${tasksResult.ok && tasksResult.data.length > 0 ? `
                                <div class="quest-tasks-grid">
                                    ${tasksResult.data.map(task => `
                                        <div class="quest-task-box">
                                            <div style="font-weight: 600; margin-bottom: 5px;">${task.title}</div>
                                            <div style="font-size: 18px; color: #F59E0B; font-weight: bold;">${task.points} pts</div>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="quest-value-box">
                                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                                        Total Quest Value: ${totalValue} points
                                    </div>
                                    <div style="font-size: 13px; color: #92400E;">
                                        ${daysToComplete > 0 ? `Equivalent to ~${daysToComplete} days of regular chores` : 'Complete all tasks to earn!'}
                                    </div>
                                </div>
                            ` : '<p style="color: #6B7280; font-size: 14px;">No tasks yet</p>'}
                        </div>
                    `;
                })
            ).then(html => html.join(''));
        }
    }
}

function getRewardEmoji(title) {
    const lower = title.toLowerCase();
    if (lower.includes('phone') || lower.includes('screen')) return '📱';
    if (lower.includes('game') || lower.includes('play')) return '🎮';
    if (lower.includes('movie') || lower.includes('tv')) return '🎬';
    if (lower.includes('treat') || lower.includes('candy') || lower.includes('ice cream')) return '🍦';
    if (lower.includes('toy')) return '🧸';
    if (lower.includes('money') || lower.includes('cash') || lower.includes('$')) return '💰';
    if (lower.includes('bike')) return '🚲';
    if (lower.includes('book')) return '📚';
    if (lower.includes('pet')) return '🐶';
    if (lower.includes('trip') || lower.includes('outing')) return '🚗';
    return '🎁';
}

// Point Economics
async function loadPointEconomics() {
    const result = await apiCall('point_economics');

    if (!result.ok) {
        document.getElementById('earning-potential-grid').innerHTML = '<p>Error loading data</p>';
        return;
    }

    const { chores, rewards, kid_count, per_kid } = result.data;

    // ── Per-kid actual earning potential ──────────────────────────────────────
    // Each kid row has daily_pts / weekly_pts / monthly_pts / once_pts from the
    // chores *directly assigned* to that kid only (no quest / collective data).
    function kidMonthly(k) {
        return (k.daily_pts * 30) + (k.weekly_pts * 4.3) + k.monthly_pts + k.once_pts;
    }
    function kidWeekly(k) {
        return (k.daily_pts * 7) + k.weekly_pts;
    }

    // Summary totals across all kids (correct: sum of per-kid, not chore×assigned_count)
    const totalDaily   = per_kid.reduce((s, k) => s + Number(k.daily_pts),  0);
    const totalWeekly  = per_kid.reduce((s, k) => s + kidWeekly(k),          0);
    const totalMonthly = per_kid.reduce((s, k) => s + kidMonthly(k),         0);

    const avgDaily   = kid_count > 0 ? Math.round(totalDaily   / kid_count) : 0;
    const avgMonthly = kid_count > 0 ? Math.round(totalMonthly / kid_count) : 0;

    // ── Summary cards ─────────────────────────────────────────────────────────
    document.getElementById('earning-potential-grid').innerHTML = `
        <div class="earning-potential-card">
            <div class="period">Per Kid / Day</div>
            <div class="amount">${avgDaily}</div>
            <div class="label">avg across kids (daily chores)</div>
        </div>
        <div class="earning-potential-card">
            <div class="period">Family / Day</div>
            <div class="amount">${totalDaily}</div>
            <div class="label">all kids combined daily max</div>
        </div>
        <div class="earning-potential-card">
            <div class="period">Family / Week</div>
            <div class="amount">${Math.round(totalWeekly)}</div>
            <div class="label">daily × 7 + weekly chores</div>
        </div>
        <div class="earning-potential-card" style="border-color: #10B981;">
            <div class="period">Per Kid / Month</div>
            <div class="amount" style="color: #10B981;">${avgMonthly}</div>
            <div class="label">avg if all chores done every day</div>
        </div>
    `;

    // ── Per-kid breakdown ─────────────────────────────────────────────────────
    const perKidEl = document.getElementById('per-kid-economics');
    if (perKidEl) {
        if (!per_kid || per_kid.length === 0) {
            perKidEl.innerHTML = '<p style="color:#6B7280;">No kids yet.</p>';
        } else {
            const rows = per_kid.map(k => {
                const wk = kidWeekly(k);
                const mo = kidMonthly(k);
                // Days needed to afford each reward (based on daily earning only)
                const fastestRewardDays = (rewards.length > 0 && k.daily_pts > 0)
                    ? Math.ceil(rewards[0].cost_points / k.daily_pts)
                    : '—';
                return `
                <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                        <div style="font-weight:700;font-size:15px;color:#1F2937;">${k.kid_name}</div>
                        <div style="font-size:12px;color:#6B7280;">${k.chore_count} chore${k.chore_count == 1 ? '' : 's'} assigned</div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;">
                        <div style="text-align:center;background:#EFF6FF;border-radius:8px;padding:8px 4px;">
                            <div style="font-size:20px;font-weight:700;color:#2563EB;">${k.daily_pts}</div>
                            <div style="font-size:11px;color:#3B82F6;">pts / day</div>
                        </div>
                        <div style="text-align:center;background:#F0FDF4;border-radius:8px;padding:8px 4px;">
                            <div style="font-size:20px;font-weight:700;color:#16A34A;">${Math.round(wk)}</div>
                            <div style="font-size:11px;color:#22C55E;">pts / week</div>
                        </div>
                        <div style="text-align:center;background:#FFF7ED;border-radius:8px;padding:8px 4px;">
                            <div style="font-size:20px;font-weight:700;color:#EA580C;">${Math.round(mo)}</div>
                            <div style="font-size:11px;color:#F97316;">pts / month</div>
                        </div>
                    </div>
                    ${k.daily_pts > 0 && rewards.length > 0 ? `
                    <div style="margin-top:8px;font-size:12px;color:#6B7280;">
                        🎁 Cheapest reward (<strong>${rewards[0].title}</strong> · ${rewards[0].cost_points} pts) in
                        <strong>${fastestRewardDays} day${fastestRewardDays == 1 ? '' : 's'}</strong> of daily chores
                    </div>` : (k.daily_pts == 0 ? '<div style="margin-top:8px;font-size:12px;color:#F59E0B;">⚠️ No daily chores assigned — no daily earning</div>' : '')}
                </div>`;
            }).join('');
            perKidEl.innerHTML = rows;
        }
    }

    // ── Chore values list ─────────────────────────────────────────────────────
    const freqOrder = { daily: 0, weekly: 1, monthly: 2, once: 3 };
    const freqLabel = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', once: 'One-time' };
    const sortedChores = [...chores].sort((a, b) =>
        (freqOrder[a.recurrence_type] ?? 9) - (freqOrder[b.recurrence_type] ?? 9) ||
        b.default_points - a.default_points
    );

    const choreValuesHtml = sortedChores.map(chore => {
        const freq = chore.recurrence_type;
        const freqClass = `freq-${freq}`;
        const lbl = freqLabel[freq] || freq;
        // Show what this chore earns per week if done consistently
        const weeklyEarn = freq === 'daily'   ? chore.default_points * 7
                         : freq === 'weekly'  ? chore.default_points
                         : freq === 'monthly' ? Math.round(chore.default_points / 4.3)
                         : 0;
        return `
            <div class="chore-value-row">
                <div class="chore-info">
                    <div class="chore-title">${chore.title}</div>
                    <div class="chore-meta">
                        <span class="frequency-badge ${freqClass}">${lbl}</span>
                        ${chore.assigned_count} kid${chore.assigned_count == 1 ? '' : 's'} assigned
                        ${weeklyEarn > 0 ? `· <strong>${weeklyEarn} pts/wk</strong> per kid` : ''}
                    </div>
                </div>
                <div class="points-badge">${chore.default_points} pts</div>
            </div>`;
    }).join('');

    document.getElementById('chore-values-list').innerHTML =
        choreValuesHtml || '<p style="color: #6B7280;">No chores created yet</p>';

    // ── Chore × Reward matrix ─────────────────────────────────────────────────
    if (chores.length === 0 || rewards.length === 0) {
        document.getElementById('chore-reward-matrix').innerHTML =
            '<p style="color: #6B7280;">Create chores and rewards to see the matrix</p>';
        return;
    }

    let matrixHtml = '<table class="matrix-table"><thead><tr>';
    matrixHtml += '<th class="chore-name-col">Chore</th>';
    rewards.forEach(r => {
        matrixHtml += `<th>${r.title}<br><span style="font-weight:normal;font-size:12px;">${r.cost_points} pts</span></th>`;
    });
    matrixHtml += '</tr></thead><tbody>';

    sortedChores.forEach(chore => {
        matrixHtml += '<tr>';
        matrixHtml += `<td class="chore-name-col">${chore.title} <span style="color:#6B7280;font-weight:normal;">(${chore.default_points} pts · ${freqLabel[chore.recurrence_type] || chore.recurrence_type})</span></td>`;
        rewards.forEach(reward => {
            const timesNeeded = Math.ceil(reward.cost_points / chore.default_points);
            // How many days does this take, given recurrence?
            let cellClass = timesNeeded <= 5 ? 'easy' : timesNeeded <= 15 ? 'medium' : timesNeeded <= 50 ? 'hard' : 'impossible';
            matrixHtml += `<td><span class="matrix-cell ${cellClass}">${timesNeeded}×</span></td>`;
        });
        matrixHtml += '</tr>';
    });

    matrixHtml += '</tbody></table>';
    document.getElementById('chore-reward-matrix').innerHTML = matrixHtml;
}

// Initialize
(async function() {
    // Only check auth on page load, don't auto-login
    const result = await apiCall('admin_me');
    if (result.ok) {
        // Already logged in
        currentUser = result.data;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('admin-email').textContent = currentUser.email;
        
        // Show version
        fetch('/api/version.php')
            .then(r => r.json())
            .then(data => {
                const versionEl = document.getElementById('app-version');
                if (versionEl) versionEl.textContent = `v${data.version}`;
            })
            .catch(() => {});
        
        await loadDashboard();
    }
    // If not logged in, login screen stays visible
})();