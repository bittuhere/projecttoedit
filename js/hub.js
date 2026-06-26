// ─── HUB ────────────────────────────────────────────────────
window.hubInit = false;

window.initHub = function() {
    if (window.hubInit) return;
    var pn = localStorage.getItem('playerName');
    if (!pn || localStorage.getItem('isLoggedIn') !== 'true') { window.MapsTo('section-login', 'left'); return; }
    window.hubInit = true;
    window.LC.fn('section-hub', function() { window.hubInit = false; });
    var pid = pn.toLowerCase().trim();
    document.getElementById('hub-greeting').innerHTML = 'Hi, ' + pn;

    // Last login
    window.db.ref('users/' + pid + '/lastLogin').once('value', function(snap) {
        if (snap.val()) {
            var ist = new Date(snap.val()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            var el = document.getElementById('hub-last-login');
            if (el) el.innerText = 'Last login: ' + ist;
        }
    });

    // Security watcher
    window.LC.fb('section-hub', window.db.ref('users/' + pid), 'value', function(snap) {
        var d = snap.val();
        if (!snap.exists() || (d && d.blocked)) {
            window.showNotify(d && d.blocked ? 'Account BLOCKED by Admin!' : 'Access Denied!', 'error');
            localStorage.clear();
            window.LC.leave('section-hub');
            window.MapsTo('section-login', 'left');
        }
    });

    // Presence
    var sr = window.db.ref('status/' + pid);
    window.LC.fb('section-hub', window.db.ref('.info/connected'), 'value', function(snap) {
        if (!snap.val()) return;
        sr.onDisconnect().set({ state: 'offline', last_changed: firebase.database.ServerValue.TIMESTAMP })
            .then(function() { sr.set({ state: 'online', last_changed: firebase.database.ServerValue.TIMESTAMP }); });
    });

    // Optimized chat unread dot
    var _hubChatRefs = [];
    window.LC.fn('section-hub', function() {
        _hubChatRefs.forEach(function(r) { try { r.off(); } catch(e) {} });
        _hubChatRefs = [];
    });

    window.LC.fb('section-hub', window.db.ref('friends/' + pn), 'value', function(friendsSnap) {
        _hubChatRefs.forEach(function(r) { try { r.off(); } catch(e) {} });
        _hubChatRefs = [];
        if (!friendsSnap.exists()) return;
        if (window.isGameActive()) return;

        var friends = Object.keys(friendsSnap.val());
        friends.forEach(function(f) {
            var cid = [pn, f].sort().join('_');
            var ref = window.db.ref('chats/' + cid).limitToLast(1);
            ref.on('value', function(chatSnap) {
                if (window.isGameActive()) return;
                var msgs = chatSnap.val();
                if (!msgs) return;
                var lr = parseInt(localStorage.getItem('lastReadChat') || '0');
                var unread = false;
                Object.values(msgs).forEach(function(m) {
                    if (m.sender !== pn && m.sender !== '_system' && m.timestamp > lr) unread = true;
                });

                var dot = document.getElementById('chat-notif-dot');
                if (dot) {
                    if (unread) dot.style.display = 'block';
                    // Note: We don't hide it here because other friends might have unread messages.
                    // Instead, we'll run a more comprehensive check if needed,
                    // or just rely on the fact that opening chat updates lastReadChat.
                }
                if (unread) {
                    window._showInGameNotif('💬 New message from ' + f);
                    var fb = document.querySelector('.hub-friends-btn');
                    if (fb) fb.classList.add('has-notif');
                }
            });
            _hubChatRefs.push(ref);
        });
    });

    // Notification dot – SKIP during game
    var dotNotif = document.getElementById('notif-dot');
    window.LC.fb('section-hub', window.db.ref('notifications/global'), 'value', function(snap) {
        if (window.isGameActive()) return;
        var lastRead = localStorage.getItem('lastReadNotif') || 0;
        var d = snap.val(); var hasNew = false;
        if (d) Object.values(d).forEach(function(n) { if (n.time > lastRead) hasNew = true; });
        if (hasNew) {
            dotNotif.style.display = 'block';
            var nb3 = document.querySelector('.notif-btn');
            if (nb3) { nb3.style.animation = ''; void nb3.offsetWidth; nb3.style.animation = 'friendBtnShake 0.5s ease 3'; }
        }
    });
    window.LC.fb('section-hub', window.db.ref('notifications/private/' + pid), 'value', function(snap) {
        if (window.isGameActive()) return;
        var lastRead = localStorage.getItem('lastReadNotif') || 0;
        var d = snap.val(); if (d) Object.values(d).forEach(function(n) { if (n.time > lastRead) dotNotif.style.display = 'block'; });
    });

    // Invite listener – keep active (not a UI update, so it's fine)
    window.LC.fb('section-hub', window.db.ref('invites/' + pid), 'child_added', function(snap) {
        if (window.isGameActive()) return;
        var inv = snap.val();
        if (!inv) return;
        window.db.ref('invites/' + pid + '/' + snap.key).remove();
        if (inv.from && inv.from.toLowerCase() === pid) return;
        if (inv.type === 'reject') { window.showNotify('❌ ' + inv.from + ' declined your invite.', 'error'); return; }
        window._handleInviteMessage({ from: inv.from, game: inv.game, code: inv.code });
    });
};

// ─── HUB SECTION TOGGLES ──────────────────────────────────
window.showHubSection = function(s) {
    document.getElementById('hub-main').classList.add('hub-hidden');
    ['study', 'multi', 'single', 'contact'].forEach(function(x) { document.getElementById('hub-' + x).classList.add('hub-hidden'); });
    document.getElementById('hub-' + s).classList.remove('hub-hidden');
    var st = { study: 'Study Mode', multi: 'Multiplayer Arena', single: 'Solo Arcade', contact: 'Contact Support' };
    document.getElementById('hub-subtitle').innerText = st[s] || 'Select a Category';
    if (s === 'contact') {
        var m = document.getElementById('contactMsg'), pn = localStorage.getItem('playerName') || 'Gamer';
        if (m.value === '') m.value = 'Username: ' + pn + '\n------------------------\nMy Question is: ';
        var sb = document.getElementById('contact-send-btn');
        if (sb) { sb.disabled = false; sb.innerText = 'SEND MESSAGE'; }
        var st_el = document.getElementById('contact-status');
        if (st_el) st_el.innerText = '';
    }
};

window.goHubBack = function() {
    if (localStorage.getItem('isLoggedIn') !== 'true' || !localStorage.getItem('isLoggedIn')) {
        if (window.currentSection !== 'section-login') {
            window.MapsTo('section-login', 'left');
            history.replaceState(null, '', '#section-login');
        }
        return;
    }
    ['study', 'multi', 'single', 'contact'].forEach(function(x) { document.getElementById('hub-' + x).classList.add('hub-hidden'); });
    document.getElementById('hub-main').classList.remove('hub-hidden');
    document.getElementById('hub-subtitle').innerText = 'Select a Category';
};

// ─── OPEN GAME ─────────────────────────────────────────────
window.gameMap = {
    quiz: 'section-quiz',
    dino: 'section-game-dino',
    flappy: 'section-game-flappy',
    pacman: 'section-game-pacman',
    car: 'section-game-car',
    snake: 'section-game-snake',
    fair: 'section-game-fair',
    rps: 'section-game-rps',
    rpsrand: 'section-game-rpsrand',
    ttt: 'section-game-ttt',
    multittt: 'section-game-multittt',
    multicar: 'section-game-multicar',
    arcadecraft: 'section-game-arcadecraft'
};

window.openGame = function(k) {
    var s = window.gameMap[k];
    if (!s) return;
    if (k === 'arcadecraft') {
        // Fix: Use MapsTo instead of location.href to keep SPA context
        window._setUserStatus('⛏️ Playing ArcadeCraft');
        window.MapsTo(s, 'right');
        return;
    }
    if (k === 'quiz') {
        if (typeof window.quizOpenRulesModal === 'function') window.quizOpenRulesModal();
        else window.MapsTo(s, 'right');
        return;
    }
    var iid = 'iframe-' + k;
    var fr = document.getElementById(iid);
    if (!fr) return;

    // Directly set the src – no more _mountGame
    fr.src = 'games/' + k + '.html';
    fr.dataset.mounted = '1';

    window._setUserStatus(window._gameStatusNames[k] || '🎮 In Game');
    setTimeout(function() { window.MapsTo(s, 'right'); }, 30);
};

// ─── CONTACT FORM ──────────────────────────────────────────
var _contactFile = null;

window.submitContactForm = async function(e) {
    e.preventDefault();
    var email = document.getElementById('contact-email').value.trim();
    var subject = document.getElementById('contact-subject').value.trim();
    var rawMsg = document.getElementById('contactMsg').value.trim();
    var statusEl = document.getElementById('contact-status');
    var btn = document.getElementById('contact-send-btn');
    var fileInput = document.getElementById('contact-file-input');
    var file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;

    var MAX_TEXT_BYTES = 80 * 1024;
    var MAX_FILE_BYTES = 5 * 1024 * 1024;

    var textBytes = new TextEncoder().encode(rawMsg + subject + email).length;
    if (textBytes > MAX_TEXT_BYTES) {
        statusEl.style.color = '#ff3366';
        statusEl.innerText = '❌ Message too long! Reduce text to under ~80 KB. Currently: ' + (textBytes / 1024).toFixed(1) + ' KB';
        return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
        statusEl.style.color = '#ff3366';
        statusEl.innerText = '❌ File too large! Max 5 MB allowed. Your file: ' + (file.size / 1024 / 1024).toFixed(2) + ' MB. Please remove it.';
        window.contactFileRemove();
        return;
    }

    btn.disabled = true; btn.innerText = 'Sending...';
    statusEl.style.color = '#00f3ff'; statusEl.innerText = 'Connecting to mail server...';

    var istTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    var userMatch = rawMsg.match(/Username:\s*([^\n]+)/);
    var username = userMatch ? userMatch[1].trim() : (localStorage.getItem('playerName') || 'Unknown');
    var cleanMsg = rawMsg.replace(/Username:[^\n]*\n[-]+\n?/, '').replace('My Question is:', '').trim();

    var formattedMsg =
        '════════════════════════════════\n' +
        '  🎮  ARCADE HUB — Contact Form  \n' +
        '════════════════════════════════\n\n' +
        '👤 Username  : ' + username + '\n' +
        '📧 Email     : ' + email + '\n' +
        '📋 Subject   : ' + (subject || 'General Inquiry') + '\n' +
        '📎 File      : ' + (file ? file.name + ' (' + (file.size/1024).toFixed(1) + ' KB)' : 'None') + '\n' +
        '🕐 Time (IST): ' + istTime + '\n\n' +
        '──────────────────────────────────\n' +
        '💬 MESSAGE:\n' +
        '──────────────────────────────────\n' +
        cleanMsg + '\n\n' +
        '──────────────────────────────────\n' +
        '🌐 bittuhere.github.io';

    var prettySubject = '🎮 [Arcade Hub] ' + (subject || 'New Message') +
        ' — from ' + username + ' | IST: ' + istTime;

    try {
        var sent = false;
        if (!file) {
            try {
                statusEl.innerText = 'Sending via mail server...';
                var gasRes = await window.gasCall({
                    action: 'send-contact',
                    fromEmail: email,
                    username: username,
                    subject: subject || 'General Inquiry',
                    message: cleanMsg
                });
                if (gasRes.ok) sent = true;
            } catch (gasErr) {}
        }
        if (!sent) {
            var res;
            if (file) {
                statusEl.innerText = 'Uploading file...';
                var fd = new FormData();
                fd.append('email', email);
                fd.append('_subject', prettySubject);
                fd.append('message', formattedMsg);
                fd.append('_captcha', 'false');
                fd.append('_template', 'table');
                fd.append('attachment', file, file.name);
                res = await fetch('https://formsubmit.co/anurag670singh@gmail.com', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: fd
                });
            } else {
                statusEl.innerText = 'Trying backup server...';
                res = await fetch('https://formsubmit.co/ajax/anurag670singh@gmail.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email, _subject: prettySubject, message: formattedMsg, _captcha: 'false' })
                });
            }
            var data = await res.json().catch(function() { return { success: res.ok ? 'true' : 'false' }; });
            if (data.success === 'true' || data.success === true) sent = true;
            else throw new Error('Send failed');
        }

        if (sent) {
            statusEl.style.color = '#00ff88';
            statusEl.innerText = '✅ Message sent!' + (file ? ' (with attachment)' : '');
            document.getElementById('contact-form').reset();
            window.contactFileRemove();
            window.contactCheckSize();
            setTimeout(function() { window.startTyCountdown(); window.MapsTo('section-thankyou', 'right'); }, 600);
        } else { throw new Error('Send failed'); }
    } catch (err) {
        statusEl.style.color = '#ff3366';
        statusEl.innerText = '❌ Send failed. Please try again.';
        btn.disabled = false; btn.innerText = 'SEND MESSAGE';
    }
};

window.contactFileChosen = function(file) {
    if (!file) return;
    var MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
        window.showNotify('❌ File too large! Max 5 MB. Your file: ' + (file.size/1024/1024).toFixed(2) + ' MB', 'error');
        var inp = document.getElementById('contact-file-input');
        if (inp) inp.value = '';
        return;
    }
    _contactFile = file;
    var prev = document.getElementById('contact-file-preview');
    var nm = document.getElementById('contact-file-name');
    var sz = document.getElementById('contact-file-size');
    var zone = document.getElementById('contact-file-zone');
    if (nm) nm.textContent = file.name;
    if (sz) sz.textContent = '(' + (file.size < 1024 ? file.size + ' B' : file.size < 1048576 ? (file.size/1024).toFixed(1) + ' KB' : (file.size/1048576).toFixed(2) + ' MB') + ')';
    if (prev) prev.style.display = 'flex';
    if (zone) zone.style.display = 'none';
    window.contactCheckSize();
};

window.contactFileRemove = function() {
    _contactFile = null;
    var inp = document.getElementById('contact-file-input');
    var prev = document.getElementById('contact-file-preview');
    var zone = document.getElementById('contact-file-zone');
    if (inp) inp.value = '';
    if (prev) prev.style.display = 'none';
    if (zone) zone.style.display = 'block';
    window.contactCheckSize();
};

window.contactDragOver = function(e) {
    e.preventDefault();
    var z = document.getElementById('contact-file-zone');
    if (z) z.classList.add('drag-over');
};

window.contactDragLeave = function(e) {
    var z = document.getElementById('contact-file-zone');
    if (z) z.classList.remove('drag-over');
};

window.contactDrop = function(e) {
    e.preventDefault();
    var z = document.getElementById('contact-file-zone');
    if (z) z.classList.remove('drag-over');
    var file = e.dataTransfer && e.dataTransfer.files[0];
    if (file) window.contactFileChosen(file);
};

window.contactCheckSize = function() {
    var msg = document.getElementById('contactMsg');
    var fill = document.getElementById('contact-size-fill');
    var info = document.getElementById('contact-size-info');
    var MAX = 80 * 1024;
    if (!msg || !fill || !info) return;
    var bytes = new TextEncoder().encode(msg.value).length;
    var pct = Math.min(100, (bytes / MAX) * 100);
    fill.style.width = pct + '%';
    fill.style.background = pct < 60 ? 'linear-gradient(90deg,#2ecc71,#00f3ff)' : pct < 85 ? 'linear-gradient(90deg,#f1c40f,#e67e22)' : 'linear-gradient(90deg,#ff3366,#e74c3c)';
    if (bytes < 1024) { info.textContent = bytes + ' B / 80 KB'; } else { info.textContent = (bytes/1024).toFixed(1) + ' KB / 80 KB'; }
    info.style.color = pct >= 85 ? '#ff3366' : 'rgba(255,255,255,.4)';
};

// ─── THANK YOU ─────────────────────────────────────────────
window.tyTimer = null;
window.startTyCountdown = function() {
    document.getElementById('ty-status').style.color = '#ff0055';
    document.getElementById('ty-status').innerText = 'Sending...';
    document.getElementById('ty-msg').innerText = 'Your message is sending...';
    var t = 10; document.getElementById('ty-seconds').innerText = t;
    if (window.tyTimer) clearInterval(window.tyTimer);
    setTimeout(function() {
        document.getElementById('ty-status').style.color = '#00f3ff';
        document.getElementById('ty-status').innerText = 'Sent!';
        document.getElementById('ty-msg').innerText = 'Your message was sent successfully! You will get your answer as soon as possible!';
    }, 0);
    window.tyTimer = setInterval(function() {
        t--; document.getElementById('ty-seconds').innerText = t;
        if (t <= 0) { clearInterval(window.tyTimer); window.tyTimer = null; window.tyGoHome(); }
    }, 1000);
};

window.tyGoHome = function() {
    if (window.tyTimer) { clearInterval(window.tyTimer); window.tyTimer = null; }
    window.MapsTo('section-hub', 'left');
    window.goHubBack();
};

// ─── NOTIFICATIONS ─────────────────────────────────────────
window.openNotifications = function() {
    var modal = document.getElementById('notif-modal');
    if (!modal) return;
    modal.classList.add('show');
    modal.style.display = 'flex';
    localStorage.setItem('lastReadNotif', Date.now());
    var dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = 'none';
    window.renderHubNotifs();
};

window.closeNotifications = function() {
    var modal = document.getElementById('notif-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(function() {
        if (!modal.classList.contains('show')) {
            modal.style.display = 'none';
        }
    }, 300);
};

window.switchNotifTab = function(tab) {
    window.currentNotifTab = tab;
    document.getElementById('notif-tab-global').classList.toggle('active', tab === 'global');
    document.getElementById('notif-tab-private').classList.toggle('active', tab === 'private');
    window.renderHubNotifs();
};
window.currentNotifTab = 'global';

window.renderHubNotifs = function() {
    var list = document.getElementById('notif-messages');
    var mn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    var lastRead = parseInt(localStorage.getItem('lastReadNotif') || '0');
    list.innerHTML = '<div class="notif-empty"><div class="notif-empty-icon">⏳</div><div class="notif-empty-text">Loading…</div></div>';

    function _fmtAgo(ts) {
        if (!ts) return '';
        var diff = Date.now() - ts;
        var m = Math.floor(diff / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return m + 'm ago';
        var h = Math.floor(m / 60);
        if (h < 24) return h + 'h ago';
        var d = Math.floor(h / 24);
        return d + 'd ago';
    }

    function _buildItem(msg, type) {
        var isNew = msg.time && msg.time > lastRead;
        var div = document.createElement('div');
        div.className = 'notif-item' + (type === 'private' ? ' private' : '');
        if (isNew) div.style.background = type === 'private' ? 'rgba(168,85,247,0.08)' : 'rgba(46,204,113,0.06)';
        div.innerHTML = `
            <div class="notif-item-header">
                <span class="notif-item-badge ${type === 'global' ? 'global-badge' : 'private-badge'}">
                    ${type === 'global' ? '📢 GLOBAL' : '🔒 PRIVATE'}
                </span>
                ${isNew ? '<span style="font-size:.6rem;background:linear-gradient(90deg,#ff3366,#ff6b35);color:white;padding:1px 6px;border-radius:10px;font-family:Segoe UI,sans-serif;font-weight:700;">NEW</span>' : ''}
            </div>
            <div class="notif-item-msg">${msg.message || ''}</div>
            <div class="notif-time">${_fmtAgo(msg.time)}</div>
        `;
        return div;
    }

    if (window.currentNotifTab === 'global') {
        window.db.ref('notifications/global').once('value', function(snap) {
            var all = snap.val();
            if (!all || Object.keys(all).length === 0) {
                list.innerHTML = '<div class="notif-empty"><div class="notif-empty-icon">📭</div><div class="notif-empty-text">No announcements yet</div></div>';
                return;
            }
            var msgs = Object.values(all).sort(function(a, b) { return b.time - a.time; });
            list.innerHTML = '';
            msgs.forEach(function(msg) { list.appendChild(_buildItem(msg, 'global')); });
        });
    } else {
        window.db.ref('notifications/private/' + mn).once('value', function(snap) {
            var all = snap.val();
            if (!all || Object.keys(all).length === 0) {
                list.innerHTML = '<div class="notif-empty"><div class="notif-empty-icon">🔐</div><div class="notif-empty-text">No private messages</div></div>';
                return;
            }
            var msgs = Object.values(all).sort(function(a, b) { return b.time - a.time; });
            list.innerHTML = '';
            msgs.forEach(function(msg) { list.appendChild(_buildItem(msg, 'private')); });
        });
    }
};

console.log('✅ Hub loaded');