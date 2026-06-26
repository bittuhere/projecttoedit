// ─── ADMIN ENTRY ────────────────────────────────────────────
window._adminReadOnly = false;
window._adminIsHimanshu = false;
var ADMIN_HASH = '5ddef4a4225fa15393062cd824bc066cf35c653edb5876189879e93d254130a9';

// ─── MATRIX RAIN ────────────────────────────────────────────
var _matrixAF = null;

window.startMatrixRain = function() {
    var overlay = document.getElementById('matrix-overlay');
    var canvas = document.getElementById('matrix-canvas');
    overlay.classList.add('mx-show');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');
    var cols = Math.floor(canvas.width / 14);
    var drops = Array.from({ length: cols }, function() { return Math.random() * canvas.height; });
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,./<>?';

    function frame() {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff41';
        ctx.font = '14px monospace';
        drops.forEach(function(y, i) {
            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 14, y);
            if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i] += 14;
        });
        _matrixAF = requestAnimationFrame(frame);
    }
    frame();
};

window.stopMatrixRain = function() {
    if (_matrixAF) { cancelAnimationFrame(_matrixAF);
        _matrixAF = null; }
    document.getElementById('matrix-overlay').classList.remove('mx-show');
    var ctx = document.getElementById('matrix-canvas').getContext('2d');
    ctx.clearRect(0, 0, 9999, 9999);
};

// ─── ADMIN LOGIN ────────────────────────────────────────────
window.launchAdminEntry = function() {
    var eye = document.getElementById('al-eye');
    if (eye) eye.src = EYEOPEN;
    document.getElementById('al-error').innerText = '';
    document.getElementById('al-pass-input').value = '';
    document.getElementById('al-pass-input').type = 'password';
    window.startMatrixRain();
    setTimeout(function() {
        window.stopMatrixRain();
        document.getElementById('admin-login-overlay').classList.add('al-show');
        setTimeout(function() { document.getElementById('al-pass-input').focus(); }, 200);
    }, 3000);
};

window.alToggleEye = function() {
    var inp = document.getElementById('al-pass-input'),
        eye = document.getElementById('al-eye');
    if (!inp || !eye) return;
    if (inp.type === 'password') { inp.type = 'text';
        eye.src = EYECLOSED; } else { inp.type = 'password';
        eye.src = EYEOPEN; }
};

window.alClose = function() {
    document.getElementById('admin-login-overlay').classList.remove('al-show');
    document.getElementById('al-error').innerText = '';
    document.getElementById('al-pass-input').value = '';
    document.getElementById('admin-login-overlay').style.display = "none";
};

window.alVerify = async function() {
    var pass = document.getElementById('al-pass-input');
    if (!pass || !pass.value) return;
    var passVal = pass.value;
    var eEl = document.getElementById('al-error');
    var loggedUser = (localStorage.getItem('playerName') || '').toLowerCase().trim();

    try {
        var h = await window.sha256(passVal);
        var vh = await window.sha256('himanshuAdmin@mishra');

        function _doOpenAdmin() {
            var alm = document.getElementById('al-modal');
            if (alm) alm.style.display = 'none';
            var overlay = document.getElementById('admin-login-overlay');
            if (overlay) overlay.classList.remove('al-show');
            if (pass) pass.value = '';
            if (eEl) eEl.innerText = '';
            setTimeout(function() {
                window.MapsTo('section-admin', 'right');
                setTimeout(function() {
                    var b = document.querySelector('#section-admin .admin-btn');
                    if (b && typeof window.adminShowSection === 'function') {
                        window.adminShowSection('dashboard', b);
                    }
                }, 250);
            }, 80);
        }

        if (h === ADMIN_HASH) {
            if (loggedUser !== 'anurag') {
                eEl.innerText = '⛔ Access denied — wrong account.';
                return;
            }
            window._adminIsHimanshu = false;
            _doOpenAdmin();
            return;
        }
        if (h === vh) {
            window._adminIsHimanshu = true;
            _doOpenAdmin();
            return;
        }
        eEl.innerText = '❌ Wrong key. Try again.';
    } catch (err) {
        if (eEl) eEl.innerText = '❌ Error: ' + err.message;
    }
};

// ─── ADMIN SECTION FUNCTIONS ──────────────────────────────
window.adminShowSection = function(name, btn) {
    document.querySelectorAll('.admin-section').forEach(function(s) { s.style.display = 'none'; });
    document.querySelectorAll('.admin-btn').forEach(function(b) { b.classList.remove('active'); });
    var el = document.getElementById('admin-section-' + name);
    if (el) el.style.display = 'block';
    if (btn) btn.classList.add('active');
    var loaders = {
        dashboard: window.adminLoadDashboard,
        users: window.adminLoadUsers,
        rooms: window.adminLoadRooms,
        scores: window.adminLoadUserInfo,
        online: window.adminLoadOnline,
        quiz: window.adminLoadQuizLb,
        global: window.adminLoadGlobalMessages
    };
    if (loaders[name]) loaders[name]();
    setTimeout(function() {
        var badge = document.getElementById('adm-ro-badge');
        if (badge) badge.remove();
        document.querySelectorAll('.adm-action-btn, .mini-btn').forEach(function(b) {
            b.disabled = false;
            b.style.opacity = '';
            b.title = '';
        });
        document.querySelectorAll('.admin-btn').forEach(function(b) {
            b.style.display = '';
        });
    }, 80);
};

// ─── DASHBOARD ──────────────────────────────────────────────
window.adminLoadDashboard = function() {
    var grid = document.getElementById('adm-stats-grid');
    var recent = document.getElementById('adm-recent');
    if (!grid) return;
    if (typeof window.db === 'undefined' || !window.db) { grid.innerHTML = '<div style="color:#e74c3c;font-size:.8rem;padding:8px;">Database not ready</div>'; return; }
    grid.innerHTML = '<div style="grid-column:span 2;color:#888;font-size:.8rem;padding:8px;">Loading...</div>';
    var weekNum = Math.floor((Date.now() - new Date(2024, 0, 1)) / (7 * 864e5));
    Promise.all([
        window.db.ref('users').once('value'),
        window.db.ref('status').once('value'),
        window.db.ref('car_world').once('value'),
        window.db.ref('quiz/week_' + weekNum + '/lb').once('value')
    ]).then(function(r) {
        var users = r[0].val() || {},
            statuses = r[1].val() || {},
            rooms = r[2].val() || {};
        var now = Date.now();
        var total = 0,
            blocked = 0,
            online = 0;
        Object.entries(users).forEach(function(e) {
            if (e[1]._deleted) return;
            total++;
            if (e[1].blocked) blocked++;
        });
        Object.values(statuses).forEach(function(s) {
            if (s.online || (s.last_changed && now - s.last_changed < 300000)) online++;
        });
        var activeRooms = Object.keys(rooms).length;
        var quizP = r[3].exists() ? Object.keys(r[3].val()).length : 0;
        var stats = [
            { l: 'TOTAL USERS', v: total, c: '#00f3ff' },
            { l: 'ONLINE NOW', v: online, c: '#2ecc71' },
            { l: 'BLOCKED', v: blocked, c: '#e74c3c' },
            { l: 'CAR ROOMS', v: activeRooms, c: '#f1c40f' },
            { l: 'QUIZ PLAYERS', v: quizP, c: '#8e44ad' },
            { l: 'WEEK', v: weekNum, c: '#888' }
        ];
        grid.innerHTML = stats.map(function(s) {
            return '<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 8px;text-align:center;"><div style="font-size:1.7rem;color:' + s.c + ';font-family:Teko,sans-serif;">' + s.v + '</div><div style="font-size:.6rem;color:#888;letter-spacing:1px;">' + s.l + '</div></div>';
        }).join('');
        if (recent) {
            var r2 = Object.entries(users).filter(function(e) { return e[1].lastLogin && !e[1]._deleted; })
                .sort(function(a, b) { return (b[1].lastLogin || 0) - (a[1].lastLogin || 0); }).slice(0, 5);
            recent.innerHTML = '<div style="font-size:.72rem;color:#888;letter-spacing:1px;margin-bottom:6px;font-family:Teko,sans-serif;">RECENT LOGINS</div>' +
                r2.map(function(e) {
                    var t = new Date(e[1].lastLogin).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                    return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:.8rem;"><span style="color:' + (e[1].blocked ? '#e74c3c' : 'white') + ';">' + e[0] + '</span><span style="color:#888;">' + t + '</span></div>';
                }).join('');
        }
    }).catch(function(e) { if (grid) grid.innerHTML = '<div style="color:#e74c3c;font-size:.8rem;">' + e.message + '</div>'; });
};

// ─── GLOBAL ANNOUNCE ────────────────────────────────────────
var ADMIN_KEY = 'anuragAdmin@123';

window.adminSendGlobal = function() {
    if (!window._isRealAdmin()) return;
    var text = document.getElementById('adminGlobalText').value.trim();
    if (!text) return window.showNotify('Enter a message!', 'error');
    window.showConfirm('📢 Publish this message to ALL players?', function() {
        var key = window.db.ref('notifications/global').push().key;
        window.db.ref('notifications/global/' + key).set({ message: text, time: Date.now(), _k: ADMIN_KEY })
            .then(function() { window.showNotify('✅ Published!', 'success');
                document.getElementById('adminGlobalText').value = '';
                window.adminLoadGlobalMessages(); })
            .catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
    }, '📢');
};

window.adminLoadGlobalMessages = function() {
    var list = document.getElementById('adminGlobalMsgList');
    if (!list) return;
    window.db.ref('notifications/global').orderByChild('time').limitToLast(10).once('value').then(function(snap) {
        var msgs = [];
        snap.forEach(function(ch) { msgs.unshift({ id: ch.key, text: ch.val().message || ch.val().text || '' }); });
        if (!msgs.length) { list.innerHTML = '<div style="color:#888;font-size:.8rem;padding:8px;">No announcements yet.</div>'; return; }
        list.innerHTML = '';
        msgs.forEach(function(m) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;gap:6px;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);';
            var preview = document.createElement('span');
            preview.style.cssText = 'font-size:.83rem;color:white;flex:1;word-break:break-word;';
            preview.textContent = m.text.length > 120 ? m.text.slice(0, 120) + '...' : m.text;
            var btns = document.createElement('div');
            btns.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';
            var editBtn = document.createElement('button');
            editBtn.textContent = 'EDIT';
            editBtn.className = 'mini-btn';
            editBtn.style.cssText = 'background:#3498db;color:#fff;';
            editBtn.onclick = (function(id) { return function() { window.adminEditMsg('global', id); }; })(m.id);
            btns.appendChild(editBtn);
            row.appendChild(preview);
            row.appendChild(btns);
            list.appendChild(row);
        });
    }).catch(function(e) { if (list) list.innerHTML = '<div style="color:#e74c3c;font-size:.8rem;">' + e.message + '</div>'; });
};

window.adminEditMsg = function(path, key) {
    if (!window._isRealAdmin()) return;
    window.db.ref('notifications/' + path + '/' + key).once('value').then(function(snap) {
        var currentText = snap.val() ? (snap.val().message || snap.val().text || '') : '';
        window.showInputModal('EDIT MESSAGE', 'New text...', function(newText) {
            if (!newText || newText === currentText) return;
            var ak = ADMIN_KEY || 'anuragAdmin@123';
            window.db.ref('notifications/' + path + '/' + key).update({ message: newText, _k: ak })
                .then(function() { window.showNotify('✅ Message updated!', 'success'); if (path === 'global') window.adminLoadGlobalMessages();
                    else window.adminLoadPrivateMsgs(); })
                .catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
        }, currentText);
    }).catch(function(e) { window.showNotify('❌ Could not load: ' + e.message, 'error'); });
};

window.adminDeleteMsg = function(path, key) {
    if (!window._isRealAdmin()) return;
    window.showConfirm('🗑️ Delete this message permanently?', function() {
        window.db.ref('notifications/' + path + '/' + key).remove()
            .then(function() {
                window.showNotify('✅ Deleted', 'success');
                if (path === 'global') window.adminLoadGlobalMessages();
                else window.adminLoadPrivateMsgs();
            })
            .catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
    }, '🗑️');
};

// ─── PRIVATE DM ────────────────────────────────────────────
window.adminSendSpecific = function() {
    if (!window._isRealAdmin()) return;
    var target = document.getElementById('adminTargetUser').value.toLowerCase().trim();
    var text = document.getElementById('adminSpecificText').value.trim();
    if (!target || !text) return window.showNotify('Fill both fields!', 'error');
    window.showConfirm('✉️ Send private message to "' + target + '"?', function() {
        var key = window.db.ref('notifications/private/' + target).push().key;
        window.db.ref('notifications/private/' + target + '/' + key).set({ message: text, time: Date.now(), _k: ADMIN_KEY })
            .then(function() { window.showNotify('✅ Sent to ' + target, 'success');
                document.getElementById('adminSpecificText').value = '';
                window.adminLoadPrivateMsgs(); })
            .catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
    }, '✉️');
};

window.adminLoadPrivateMsgs = function() {
    var target = document.getElementById('adminTargetUser').value.toLowerCase().trim();
    var list = document.getElementById('adminPrivateMsgList');
    if (!list) return;
    if (!target) { list.innerHTML = '<div style="color:#888;font-size:.8rem;">Enter a username above.</div>'; return; }
    window.db.ref('notifications/private/' + target).orderByChild('time').limitToLast(10).once('value').then(function(snap) {
        var msgs = [];
        snap.forEach(function(ch) { msgs.unshift({ id: ch.key, text: ch.val().message || ch.val().text || '' }); });
        if (!msgs.length) { list.innerHTML = '<div style="color:#888;font-size:.8rem;padding:8px;">No messages for ' + target + '.</div>'; return; }
        list.innerHTML = '';
        msgs.forEach(function(m) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;gap:6px;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);';
            var preview = document.createElement('span');
            preview.style.cssText = 'font-size:.83rem;color:white;flex:1;word-break:break-word;';
            preview.textContent = m.text.length > 120 ? m.text.slice(0, 120) + '...' : m.text;
            var btns = document.createElement('div');
            btns.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';
            var editBtn = document.createElement('button');
            editBtn.textContent = 'EDIT';
            editBtn.className = 'mini-btn';
            editBtn.style.cssText = 'background:#3498db;color:#fff;';
            editBtn.onclick = (function(id) { return function() { window.adminEditMsg('private/' + target, id); }; })(m.id);
            btns.appendChild(editBtn);
            row.appendChild(preview);
            row.appendChild(btns);
            list.appendChild(row);
        });
    }).catch(function(e) { list.innerHTML = '<div style="color:#e74c3c;font-size:.8rem;">' + e.message + '</div>'; });
};

// ─── USERS ──────────────────────────────────────────────────
window._adminAllUsers = [];

window.adminLoadUsers = function() {
    if (typeof window.db === 'undefined' || !window.db) return window.showNotify('Database not ready', 'error');
    window.db.ref('users').once('value').then(function(snap) {
        window._adminAllUsers = [];
        snap.forEach(function(c) { var d = c.val(); if (!d._deleted) window._adminAllUsers.push(Object.assign({ id: c.key }, d)); });
        window._adminAllUsers.sort(function(a, b) { return (b.lastLogin || 0) - (a.lastLogin || 0); });
        window.adminRenderUserTable(window._adminAllUsers);
    }).catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
};

window.adminRenderUserTable = function(users) {
    var tbody = document.getElementById('adminUserTableBody');
    if (!tbody) return;
    var filteredUsers = window._adminReadOnly ?
        users.filter(function(u) { return u.id.toLowerCase().startsWith('example'); }) :
        users;
    if (window._adminReadOnly && filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:14px;color:#888;">No "example" users found.</td></tr>';
        return;
    }
    tbody.innerHTML = filteredUsers.map(function(u) {
        var bl = !!u.blocked;
        var evOff = u.email_verification === false;
        var j = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—';
        var emailBadge = u.email ?
            '<span style="font-size:.65rem;padding:1px 5px;border-radius:8px;background:' + (u.emailVerified ? 'rgba(46,204,113,.2)' : 'rgba(241,196,15,.2)') + ';color:' + (u.emailVerified ? '#2ecc71' : '#f1c40f') + ';margin-left:3px;">' + (u.emailVerified ? '&#10003;' : 'pending') + '</span>' :
            '<span style="font-size:.65rem;padding:1px 5px;border-radius:8px;background:rgba(231,76,60,.15);color:#e74c3c;margin-left:3px;">no email</span>';
        return '<tr><td style="color:' + (bl ? '#e74c3c' : 'white') + ';">' + u.id + emailBadge + '</td>' +
            '<td style="text-align:center;"><span style="font-size:.7rem;padding:2px 7px;border-radius:10px;background:' + (bl ? 'rgba(231,76,60,.2)' : 'rgba(46,204,113,.2)') + ';color:' + (bl ? '#e74c3c' : '#2ecc71') + '">' + (bl ? 'BLOCKED' : 'ACTIVE') + '</span></td>' +
            '<td style="font-size:.74rem;color:#888;">' + j + '</td>' +
            '<td style="white-space:nowrap;">' +
            '<button onclick="window.adminToggleBlock(\'' + u.id + '\',' + (bl ? 'false' : 'true') + ')" style="background:' + (bl ? '#2ecc71' : '#e74c3c') + ';border:none;color:' + (bl ? '#000' : '#fff') + ';padding:4px 8px;border-radius:4px;cursor:pointer;font-size:.74rem;margin:2px;">' + (bl ? 'UNBLOCK' : 'BLOCK') + '</button>' +
            '<button onclick="window.adminResetPass(\'' + u.id + '\')" style="background:#3498db;border:none;color:#fff;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:.74rem;margin:2px;">RESET PW</button>' +
            '<button onclick="window.adminToggleEmailVerif(\'' + u.id + '\',' + (evOff ? 'true' : 'false') + ')" style="background:' + (evOff ? '#8e44ad' : '#2c3e50') + ';border:none;color:#fff;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:.74rem;margin:2px;" title="' + (evOff ? 'Email verif disabled' : 'Email verif required') + '">[E]' + (evOff ? 'ON' : 'OFF') + '</button>' +
            '<button onclick="window.adminStrictVerify(\'' + u.id + '\')" style="background:#e67e22;border:none;color:#fff;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:.74rem;margin:2px;" title="Force user to re-verify email on next login. No skip allowed.">FORCE VERIFY</button>' +
            '</td></tr>';
    }).join('') || '<tr><td colspan="4" style="text-align:center;padding:14px;color:#888;">No users.</td></tr>';
};

window.adminFilterUsers = function() {
    var q = document.getElementById('adminUserSearch').value.toLowerCase();
    window.adminRenderUserTable(q ? window._adminAllUsers.filter(function(u) { return u.id.includes(q); }) : window._adminAllUsers);
};

window.adminToggleBlock = function(uid, state) {
    if (!window._isRealAdmin()) return;
    state = (state === 'true' || state === true);
    window.showConfirm((state ? 'BLOCK' : 'UNBLOCK') + ' user "' + uid + '"?', function() {
        window.db.ref('users/' + uid).update({ blocked: state, _admin: true, _adminKey: ADMIN_KEY })
            .then(function() { window.showNotify((state ? 'Blocked: ' : 'Unblocked: ') + uid, state ? 'error' : 'success');
                window.adminLoadUsers(); })
            .catch(function(e) { window.showNotify('Error: ' + e.message, 'error'); });
    }, state ? 'X' : 'OK');
};

window.adminToggleEmailVerif = function(uid, enable) {
    if (!window._isRealAdmin()) return;
    enable = (enable === 'true' || enable === true);
    var label = enable ? 'Re-enable email verification' : 'Disable email verification';
    window.showConfirm(label + ' for "' + uid + '"?', function() {
        var upd = enable ? { email_verification: null } : { email_verification: false };
        window.db.ref('users/' + uid).update(upd)
            .then(function() { window.showNotify('Email verification ' + (enable ? 'ON' : 'OFF') + ': ' + uid, 'success');
                window.adminLoadUsers(); })
            .catch(function(e) { window.showNotify('Error: ' + e.message, 'error'); });
    }, '[E]');
};

window.adminStrictVerify = function(uid) {
    if (!window._isRealAdmin()) return;
    window.showConfirm('Force "' + uid + '" to verify email on next login? They will NOT be able to skip.', function() {
        window.db.ref('users/' + uid).update({ emailVerified: false, email_verification: null, forceVerify: true })
            .then(function() { window.showNotify('Force verify set for: ' + uid, 'success');
                window.adminLoadUsers(); })
            .catch(function(e) { window.showNotify('Error: ' + e.message, 'error'); });
    }, '!');
};

window.adminResetPass = function(uid) {
    if (!window._isRealAdmin()) return;
    window.showInputModal('RESET PASSWORD — ' + uid.toUpperCase(), 'New password (min 3 chars)...', function(newPass) {
        if (!newPass || newPass.length < 3) { window.showNotify('Min 3 chars!', 'error'); return; }
        crypto.subtle.digest('SHA-1', new TextEncoder().encode(newPass)).then(function(buf) {
            var hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
            window.db.ref('users/' + uid).update({ password: hash, _admin: true, _adminKey: ADMIN_KEY })
                .then(function() { window.showNotify('✅ Password reset: ' + uid, 'success'); })
                .catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
        });
    });
};

// ─── RENAME ──────────────────────────────────────────────────
window.adminRenameUser = async function() {
    if (!window._isRealAdmin()) return;
    var oldN = document.getElementById('adminOldName').value.toLowerCase().trim();
    var newN = document.getElementById('adminNewName').value.toLowerCase().trim();
    var st = document.getElementById('adminRenameStatus');
    if (!oldN || !newN) return window.showNotify('Fill both fields!', 'error');
    if (oldN === newN) return window.showNotify('Names are identical!', 'error');
    if (!/^[a-z0-9]+$/.test(newN)) return window.showNotify('New name: letters & numbers only!', 'error');
    window.showConfirm('Rename "' + oldN + '" → "' + newN + '"?\nThis migrates ALL data and removes the old username.', function() {
        _doAdminRename(oldN, newN);
    }, '✏️');
};

async function _doAdminRename(oldN, newN) {
    var st = document.getElementById('adminRenameStatus');
    var S = function(msg, c) { st.style.color = c || '#888';
        st.innerHTML = msg; };
    S('🔍 Step 1/8: Validating...');
    try {
        var [newSnap, oldSnap] = await Promise.all([window.db.ref('users/' + newN).once('value'), window.db.ref('users/' + oldN).once('value')]);
        if (newSnap.exists()) return S('❌ "' + newN + '" is already taken!', '#ff3366');
        if (!oldSnap.exists()) return S('❌ User "' + oldN + '" not found!', '#ff3366');

        var userData = Object.assign({}, oldSnap.val());
        delete userData._admin;
        delete userData._adminKey;
        delete userData._deleted;
        delete userData._deletedAt;
        delete userData._renamedTo;

        S('📋 Step 2/8: Copying profile...');
        await window.db.ref('users/' + newN).set(userData);

        S('👥 Step 3/8: Migrating friends...');
        var fSnap = await window.db.ref('friends/' + oldN).once('value');
        var friends = fSnap.val() || {};
        var fKeys = Object.keys(friends);
        if (fKeys.length) {
            await window.db.ref('friends/' + newN).set(friends);
            await Promise.all(fKeys.flatMap(function(fid) {
                return [window.db.ref('friends/' + fid + '/' + newN).set(true), window.db.ref('friends/' + fid + '/' + oldN).remove()];
            }));
        }

        S('💬 Step 4/8: Migrating chats...');
        var chatOps = [];
        for (var fid of fKeys) {
            var oldCid = [oldN, fid].sort().join('_'),
                newCid = [newN, fid].sort().join('_');
            var cSnap = await window.db.ref('chats/' + oldCid).once('value');
            if (cSnap.exists()) {
                var msgs = cSnap.val();
                Object.keys(msgs).forEach(function(k) { if (msgs[k].sender === oldN) msgs[k].sender = newN; });
                chatOps.push(window.db.ref('chats/' + newCid).set(msgs));
                chatOps.push(window.db.ref('chats/' + oldCid).remove());
            }
        }
        await Promise.all(chatOps);

        S('📨 Step 5/8: Migrating requests...');
        var frSnap = await window.db.ref('friend_requests/' + oldN).once('value');
        if (frSnap.exists()) await window.db.ref('friend_requests/' + newN).set(frSnap.val());

        S('🟢 Step 6/8: Status & invites...');
        var [stSnap, invSnap] = await Promise.all([window.db.ref('status/' + oldN).once('value'), window.db.ref('invites/' + oldN).once('value')]);
        var ops6 = [];
        if (stSnap.exists()) { ops6.push(window.db.ref('status/' + newN).set(stSnap.val()));
            ops6.push(window.db.ref('status/' + oldN).remove()); }
        if (invSnap.exists()) { ops6.push(window.db.ref('invites/' + newN).set(invSnap.val()));
            ops6.push(window.db.ref('invites/' + oldN).remove()); }
        await Promise.all(ops6);

        S('🏅 Step 7/8: Quiz data...');
        var wn = Math.floor((Date.now() - new Date(2024, 0, 1)) / (7 * 864e5));
        var qSnap = await window.db.ref('quiz/week_' + wn + '/lb/' + oldN).once('value');
        if (qSnap.exists()) { await window.db.ref('quiz/week_' + wn + '/lb/' + newN).set(qSnap.val());
            await window.db.ref('quiz/week_' + wn + '/lb/' + oldN).remove(); }

        S('🗑️ Step 8/8: Removing old data...');
        await window.db.ref('users/' + oldN).set({ _admin: true, _adminKey: ADMIN_KEY, _deleted: true, _renamedTo: newN, _ts: Date.now() });
        await Promise.all([window.db.ref('friends/' + oldN).remove(), window.db.ref('friend_requests/' + oldN).remove()]);
        try {
            await window.db.ref('users/' + oldN).remove();
        } catch (delErr) {
            console.warn('Tombstone left (add deletion rule to Firebase):', delErr.message);
        }

        S('✅ Renamed <b>' + oldN + '</b> → <b>' + newN + '</b><br><span style="font-size:.75rem;color:#888;">' + fKeys.length + ' friend(s) migrated, all data moved</span>', '#2ecc71');
        document.getElementById('adminOldName').value = '';
        document.getElementById('adminNewName').value = '';
        window.showNotify('✅ Renamed: ' + oldN + ' → ' + newN, 'success');
        window.adminLoadUsers();
    } catch (err) {
        S('❌ ' + err.message, '#ff3366');
        window.showNotify('❌ Rename failed: ' + err.message, 'error');
    }
}

// ─── DELETE ──────────────────────────────────────────────────
window.adminDeleteUser = async function() {
    if (!window._isRealAdmin()) return;
    var uid = document.getElementById('adminDeleteName').value.toLowerCase().trim();
    var st = document.getElementById('adminDeleteStatus');
    if (!uid) return window.showNotify('Enter a username!', 'error');
    window.showConfirm('🗑️ Permanently delete "' + uid + '"? Cannot be undone.', async function() {
        st.style.color = '#888';
        st.innerText = 'Deleting...';
        try {
            var snap = await window.db.ref('users/' + uid).once('value');
            if (!snap.exists()) return (st.style.color = '#ff3366', st.innerText = '❌ User not found!');
            var frSnap = await window.db.ref('friends/' + uid).once('value');
            var friends = frSnap.val() ? Object.keys(frSnap.val()) : [];
            await Promise.all(friends.map(function(fid) { return window.db.ref('friends/' + fid + '/' + uid).remove(); }));
            await Promise.all([window.db.ref('friends/' + uid).remove(), window.db.ref('status/' + uid).remove(), window.db.ref('invites/' + uid).remove(), window.db.ref('friend_requests/' + uid).remove()]);
            await window.db.ref('users/' + uid).set({ _admin: true, _adminKey: ADMIN_KEY, _deleted: true, _ts: Date.now() });
            try { await window.db.ref('users/' + uid).remove(); } catch (e) {}
            st.style.color = '#2ecc71';
            st.innerText = '✅ Deleted: ' + uid;
            document.getElementById('adminDeleteName').value = '';
            window.showNotify('🗑️ Deleted: ' + uid, 'success');
            window.adminLoadUsers();
        } catch (err) { st.style.color = '#ff3366';
            st.innerText = '❌ ' + err.message; }
    }, '🗑️');
};

// ─── SCORES ──────────────────────────────────────────────────
window.adminLoadUserInfo = function() {
    window.db.ref('users').once('value').then(function(snap) {
        var tbody = document.getElementById('adminInfoTableBody');
        if (!tbody) return;
        var rows = [];
        snap.forEach(function(c) { var d = c.val(); if (d._deleted) return;
            rows.push('<tr><td style="color:white;">' + c.key + '</td><td style="text-align:center;color:#00f3ff;">' + (d.flappy_highscore || 0) + '</td><td style="text-align:center;color:#2ecc71;">' + (d.dino_highscore || 0) + '</td><td style="text-align:center;color:#f1c40f;">' + (d.snake_highscore || 0) + '</td><td style="text-align:center;color:#e74c3c;">' + (d.pacman_highscore || 0) + '</td></tr>'); });
        tbody.innerHTML = rows.join('') || '<tr><td colspan="5" style="text-align:center;padding:14px;color:#888;">No data.</td></tr>';
    });
};

window.adminViewScore = function() {
    var uid = document.getElementById('adminScoreUser').value.toLowerCase().trim();
    var game = document.getElementById('adminScoreGame').value;
    var st = document.getElementById('adminScoreStatus');
    if (!uid) return (st.innerText = '❌ Enter username');
    if (window._adminReadOnly && !uid.startsWith('example')) {
        st.style.color = '#ff3366';
        st.innerText = '❌ Viewer limited to "example..." users only';
        return;
    }
    (game ? window.db.ref('users/' + uid + '/' + game) : window.db.ref('users/' + uid)).once('value').then(function(s) {
        if (!s.exists()) return (st.style.color = '#ff3366', st.innerText = '❌ Not found');
        if (game) { st.style.color = '#00f3ff';
            st.innerText = uid + ' → ' + game + ': ' + s.val(); } else { var d = s.val();
            st.style.color = '#00f3ff';
            st.innerText = uid + ' — Flappy:' + d.flappy_highscore + ' Dino:' + d.dino_highscore + ' Snake:' + d.snake_highscore + ' PacMan:' + d.pacman_highscore; }
    }).catch(function(e) { st.style.color = '#ff3366';
        st.innerText = '❌ ' + e.message; });
};

window.adminResetScore = function() {
    if (!window._isRealAdmin()) return;
    var uid = document.getElementById('adminScoreUser').value.toLowerCase().trim();
    var game = document.getElementById('adminScoreGame').value;
    var st = document.getElementById('adminScoreStatus');
    if (!uid) return (st.innerText = '❌ Enter username');
    window.db.ref('users/' + uid).once('value').then(function(snap) {
        if (!snap.exists() || snap.val()._deleted) {
            st.style.color = '#ff3366';
            st.innerText = '❌ User "' + uid + '" not found!';
            window.showNotify('❌ User not found: ' + uid, 'error');
            return;
        }
        window.showConfirm('Reset ' + (game || 'ALL scores') + ' for "' + uid + '"?', function() {
            var upd = game ? { [game]: 0, _admin: true, _adminKey: ADMIN_KEY } : { flappy_highscore: 0, dino_highscore: 0, snake_highscore: 0, pacman_highscore: 0, _admin: true, _adminKey: ADMIN_KEY };
            window.db.ref('users/' + uid).update(upd)
                .then(function() { st.style.color = '#2ecc71';
                    st.innerText = '✅ Reset: ' + uid;
                    window.showNotify('✅ Scores reset', 'success');
                    window.adminLoadUserInfo(); })
                .catch(function(e) { st.style.color = '#ff3366';
                    st.innerText = '❌ ' + e.message; });
        }, '🗑️');
    }).catch(function(e) { st.style.color = '#ff3366';
        st.innerText = '❌ ' + e.message; });
};

window.adminSetScore = function() {
    if (!window._isRealAdmin()) return;
    var uid = document.getElementById('adminScoreUser').value.toLowerCase().trim();
    var game = document.getElementById('adminScoreGame').value;
    var st = document.getElementById('adminScoreStatus');
    if (!uid || !game) return (st.innerText = '❌ Enter username and select a game');
    window.showInputModal('SET SCORE — ' + uid + ' / ' + game, 'New score value (number)...', function(val) {
        var score = parseInt(val);
        if (isNaN(score) || score < 0) { window.showNotify('Invalid number', 'error'); return; }
        st.style.color = '#888';
        st.innerText = 'Checking user...';
        window.db.ref('users/' + uid).once('value').then(function(snap) {
            if (!snap.exists() || snap.val()._deleted) {
                st.style.color = '#ff3366';
                st.innerText = '❌ User "' + uid + '" does not exist!';
                window.showNotify('❌ User not found: ' + uid, 'error');
                return;
            }
            window.showConfirm('Set ' + game + ' = ' + score + ' for "' + uid + '"?', function() {
                window.db.ref('users/' + uid).update({ [game]: score, _admin: true, _adminKey: ADMIN_KEY })
                    .then(function() { st.style.color = '#2ecc71';
                        st.innerText = '✅ Set ' + uid + ' ' + game + '=' + score;
                        window.showNotify('✅ Score updated', 'success');
                        window.adminLoadUserInfo(); })
                    .catch(function(e) { st.style.color = '#ff3366';
                        st.innerText = '❌ ' + e.message; });
            }, '✏️');
        }).catch(function(e) { st.style.color = '#ff3366';
            st.innerText = '❌ ' + e.message; });
    });
};

// ─── ROOMS ──────────────────────────────────────────────────
window.adminLoadRooms = function() {
    if (typeof window.db === 'undefined' || !window.db) return;
    var tbody = document.getElementById('adminRoomTableBody');
    var rst = document.getElementById('adminRoomStatus');
    if (!tbody) return;
    window.db.ref('car_world').once('value').then(function(snap) {
        var rows = [],
            count = 0;
        snap.forEach(function(c) {
            count++;
            var v = c.val() || {};
            var pls = v.players ? Object.values(v.players).filter(function(p) { return p && p.n; }).map(function(p) { return p.n; }).join(', ') : '—';
            var pN = v.players ? Object.keys(v.players).length : 0;
            var ago = v.lastActivity ? Math.floor((Date.now() - v.lastActivity) / 60000) + 'm ago' : '—';
            rows.push('<tr><td style="color:#f1c40f;font-family:Teko,sans-serif;font-size:1rem;">' + c.key + '</td><td style="font-size:.78rem;">' + pls + ' <span style="color:#888;">(' + pN + ')</span></td><td style="font-size:.74rem;color:#888;">' + ago + '</td><td><button onclick="window.adminDeleteRoom(\'' + c.key + '\')" style="background:#e74c3c;border:none;color:#fff;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:.74rem;">DEL</button></td></tr>');
        });
        tbody.innerHTML = rows.join('') || '<tr><td colspan="4" style="text-align:center;padding:14px;color:#888;">No active rooms.</td></tr>';
        if (rst) rst.innerText = count + ' room(s)';
    }).catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
};

window.adminDeleteRoom = function(roomId) {
    if (!window._isRealAdmin()) return;
    window.showConfirm('Delete room "' + roomId + '"?', function() {
        window.db.ref('car_world/' + roomId).remove().then(function() { window.showNotify('🗑️ Room deleted', 'success');
            window.adminLoadRooms(); }).catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); });
    }, '🗑️');
};

window.adminCleanRooms = function() {
    if (!window._isRealAdmin()) return;
    window.showConfirm('Delete all rooms with 0 players?', function() {
        window.db.ref('car_world').once('value').then(function(snap) {
            var ops = [];
            snap.forEach(function(c) { var v = c.val() || {}; if (!v.players || Object.keys(v.players).length === 0) ops.push(window.db.ref('car_world/' + c.key).remove()); });
            Promise.all(ops).then(function() { window.showNotify('✅ Cleaned ' + ops.length + ' room(s)', 'success');
                window.adminLoadRooms(); });
        });
    }, '🗑️');
};

// ─── QUIZ ────────────────────────────────────────────────────
window.adminLoadQuizLb = function() {
    var el = document.getElementById('adminQuizLb');
    var st = document.getElementById('adminQuizStatus');
    if (!el) return;
    var wn = Math.floor((Date.now() - new Date(2024, 0, 1)) / (7 * 864e5));
    el.innerHTML = '<div style="color:#888;font-size:.8rem;padding:8px;">Loading...</div>';
    window.db.ref('quiz/week_' + wn + '/lb').once('value').then(function(snap) {
        var entries = [];
        snap.forEach(function(c) { entries.push(Object.assign({ id: c.key }, c.val())); });
        entries.sort(function(a, b) { return b.correct !== a.correct ? b.correct - a.correct : a.time - b.time; });
        var meds = ['🥇', '🥈', '🥉'];
        var fmt = function(ms) { var s = Math.floor(ms / 1000),
                m = Math.floor(s / 60); return (m > 0 ? m + 'm ' : '') + s % 60 + 's'; };
        el.innerHTML = entries.length ? entries.map(function(e, i) {
            return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:.82rem;"><span style="min-width:26px;text-align:center;">' + (i < 3 ? meds[i] : '#' + (i + 1)) + '</span><span style="flex:1;color:white;">' + e.id + '</span><span style="color:#00f3ff;">' + fmt(e.time) + '</span><span style="color:#888;margin-left:6px;">' + e.correct + '/20</span><button onclick="window.adminClearQuizEntry(\'week_' + wn + '\',\'' + e.id + '\')" style="background:#e74c3c;border:none;color:#fff;padding:2px 7px;border-radius:4px;cursor:pointer;font-size:.7rem;margin-left:4px;">DEL</button></div>';
        }).join('') : '<div style="color:#888;font-size:.8rem;padding:8px;">No entries this week.</div>';
        if (st) st.innerText = 'Week ' + wn + ' — ' + entries.length + ' player(s)';
    });
};

window.adminClearQuizEntry = function(wk, uid) {
    if (!window._isRealAdmin()) return;
    window.showConfirm('Remove quiz entry for "' + uid + '"?', function() { window.db.ref('quiz/' + wk + '/lb/' + uid).remove().then(function() { window.showNotify('✅ Removed', 'success');
            window.adminLoadQuizLb(); }).catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); }); }, '🗑️');
};

window.adminResetQuizWeek = function() {
    if (!window._isRealAdmin()) return;
    var wn = Math.floor((Date.now() - new Date(2024, 0, 1)) / (7 * 864e5));
    window.showConfirm('Reset quiz data for Week ' + wn + '? This clears the leaderboard.', function() { window.db.ref('quiz/week_' + wn).remove().then(function() { window.showNotify('✅ Quiz week reset', 'success');
            window.adminLoadQuizLb(); }).catch(function(e) { window.showNotify('❌ ' + e.message, 'error'); }); }, '⚠️');
};

window.adminSetAiQuestion = function() {
    var s = document.getElementById('aqSubject').value.trim();
    var q = document.getElementById('aqQuestion').value.trim();
    var opts = [0, 1, 2, 3].map(function(i) { return document.getElementById('aqOpt' + i).value.trim(); });
    var ans = parseInt(document.getElementById('aqAns').value);
    var st = document.getElementById('adminQuizStatus');
    if (!s || !q || opts.some(function(o) { return !o; })) { st.style.color = '#ff3366';
        st.innerText = '❌ Fill all fields!'; return; }
    var wn = Math.floor((Date.now() - new Date(2024, 0, 1)) / (7 * 864e5));
    window.showConfirm('Set special question for Week ' + wn + '?', function() {
        window.db.ref('quiz/week_' + wn + '/ai_question').set({ id: 'ai_w' + wn, s: s, q: q, o: opts, a: ans, d: 2, _k: ADMIN_KEY })
            .then(function() { st.style.color = '#2ecc71';
                st.innerText = '✅ Special question set for Week ' + wn;
                window.showNotify('✅ AI question set', 'success'); })
            .catch(function(e) { st.style.color = '#ff3366';
                st.innerText = '❌ ' + e.message; });
    }, '🧠');
};

// ─── ONLINE ──────────────────────────────────────────────────
window.adminLoadOnline = function() {
    var el = document.getElementById('adminOnlineList');
    if (!el) return;
    el.innerHTML = '<div style="color:#888;font-size:.8rem;padding:8px;">Loading...</div>';
    window.db.ref('status').once('value').then(function(snap) {
        var now = Date.now(),
            users = [];
        snap.forEach(function(c) { var v = c.val() || {}; var ls = v.last_changed || 0; var on = v.online || (now - ls < 300000); users.push({ id: c.key, activity: v.activity || '—', lastSeen: ls, online: on }); });
        users.sort(function(a, b) { return Number(b.online) - Number(a.online) || b.lastSeen - a.lastSeen; });
        el.innerHTML = users.length ? users.map(function(u) {
            var ms = now - u.lastSeen;
            var ago = u.lastSeen ? (ms < 60000 ? 'just now' : Math.floor(ms / 60000) + 'm ago') : '—';
            return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06);"><span style="width:8px;height:8px;border-radius:50%;background:' + (u.online ? '#2ecc71' : '#555') + ';flex-shrink:0;"></span><span style="flex:1;color:white;font-size:.84rem;">' + u.id + '</span><span style="font-size:.74rem;color:#888;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + u.activity + '</span><span style="font-size:.7rem;color:#555;flex-shrink:0;margin-left:6px;">' + ago + '</span></div>';
        }).join('') : '<div style="color:#888;font-size:.8rem;padding:8px;">No status data.</div>';
    }).catch(function(e) { el.innerHTML = '<div style="color:#e74c3c;font-size:.8rem;">' + e.message + '</div>'; });
};

// ─── REAL ADMIN CHECK ──────────────────────────────────────
window._isRealAdmin = function() {
    var loggedUser = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    if (loggedUser !== 'anurag') {
        window.showNotify('⛔ You are not the real admin!', 'error');
        return false;
    }
    return true;
};

console.log('✅ Admin loaded');