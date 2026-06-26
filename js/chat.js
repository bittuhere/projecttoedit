// ─── CHAT ───────────────────────────────────────────────────
window.chatInit = false;
window.currentChatFriend = null;
window.currentChatId = null;

window.initChat = function() {
    if (window.chatInit) return;
    window.chatInit = true;
    var myName = localStorage.getItem('playerName');
    if (!myName) return;
    document.getElementById('chat-display-username').innerText = myName;
    window.initNotifToggle(null);
    if (typeof window.LC !== 'undefined') {
        window.LC.fn('section-chat', function() {
            window.chatInit = false;
            window.currentChatFriend = null;
            window.currentChatId = null;
            var mi = document.getElementById('msgInput'),
                sb = document.getElementById('sendBtn');
            if (mi) { mi.disabled = true;
                mi.placeholder = 'Select friend to type...'; }
            if (sb) sb.disabled = true;
            document.body.classList.remove('chatting');
            window._stopPing();
        });
    }
    window._startPing('chat-ping-badge', 'chat-ping-ms');

    var _chatPid = myName.toLowerCase().trim();

    // Friend requests
    var _freqWrap = document.getElementById('freq-incoming-wrap');
    var _freqList = document.getElementById('freq-incoming-list');
    if (typeof window.LC !== 'undefined') {
        window.LC.fb('section-chat', window.db.ref('friend_requests/' + _chatPid), 'value', function(snap) {
            if (!_freqList) return;
            _freqList.innerHTML = '';
            if (!snap.exists()) { if (_freqWrap) _freqWrap.style.display = 'none'; return; }
            if (_freqWrap) _freqWrap.style.display = 'block';
            var _freqCount = 0;
            snap.forEach(function(child) {
                if (_freqCount >= 10) return;
                _freqCount++;
                var fromUser = child.key;
                var div = document.createElement('div');
                div.className = 'freq-item';
                div.innerHTML = '<span class="freq-name">👤 ' + fromUser + '</span>' +
                    '<div class="freq-btns">' +
                    '<button class="freq-accept" onclick="window.acceptFriendRequest(\'' + fromUser + '\')">✓ Accept</button>' +
                    '<button class="freq-reject" onclick="window.rejectFriendRequest(\'' + fromUser + '\')">✕</button>' +
                    '</div>';
                _freqList.appendChild(div);
            });
            if (snap.numChildren() > 10) {
                var moreDiv = document.createElement('div');
                moreDiv.style.cssText = 'font-size:0.72rem;color:rgba(255,255,255,0.3);text-align:center;padding:4px;';
                moreDiv.innerText = '+' + (snap.numChildren() - 10) + ' more requests';
                _freqList.appendChild(moreDiv);
            }
        });
    }

    // Invite listener
    if (typeof window.LC !== 'undefined') {
        window.LC.fb('section-chat', window.db.ref('invites/' + _chatPid), 'child_added', function(snap) {
            var inv = snap.val();
            if (!inv) return;
            window.db.ref('invites/' + _chatPid + '/' + snap.key).remove();
            if (inv.from && inv.from.toLowerCase() === _chatPid) return;
            if (inv.type === 'reject') { window.showNotify('❌ ' + inv.from + ' declined your invite.', 'error'); return; }
            window._handleInviteMessage({ from: inv.from, game: inv.game, code: inv.code });
        });
    }

    // Presence
    var sr = window.db.ref('status/' + myName);
    if (typeof window.LC !== 'undefined') {
        window.LC.fb('section-chat', window.db.ref('.info/connected'), 'value', function(snap) {
            if (!snap.val()) return;
            sr.onDisconnect().set({ state: 'offline', last_changed: firebase.database.ServerValue.TIMESTAMP })
                .then(function() { sr.set({ state: 'online', last_changed: firebase.database.ServerValue.TIMESTAMP }); });
        });
    } else {
        window.db.ref('.info/connected').on('value', function(snap) {
            if (!snap.val()) return;
            sr.onDisconnect().set({ state: 'offline', last_changed: firebase.database.ServerValue.TIMESTAMP })
                .then(function() { sr.set({ state: 'online', last_changed: firebase.database.ServerValue.TIMESTAMP }); });
        });
    }

    // Friends list
    var fl = document.getElementById('friends-list');
    var _pf = [];
    var _dpf = function() { _pf.forEach(function(item) { try { item.sr.off('value'); } catch (e) {} try { item.ur.off('value'); } catch (e) {} });
        _pf = []; };
    if (typeof window.LC !== 'undefined') {
        window.LC.fn('section-chat', _dpf);
    }

    if (typeof window.LC !== 'undefined') {
        window.LC.fb('section-chat', window.db.ref('friends/' + myName), 'value', function(snapshot) {
            _dpf();
            fl.innerHTML = '';
            if (!snapshot.exists()) { fl.innerHTML = '<p style="color:#666;padding:10px;">No friends yet. Add one above!</p>'; return; }
            Object.keys(snapshot.val()).forEach(function(fn) {
                var div = document.createElement('div');
                div.className = 'friend-item';
                div.id = 'friend-' + fn;
                div.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><div style="display:flex;flex-direction:column;"><span>' + fn + '</span><small id="status-' + fn + '" class="status-sub">Checking...</small></div><div id="unread-' + fn + '" class="unread-dot"></div></div><small>></small>';
                div.onclick = function() { window.openChatWith(fn); };
                fl.appendChild(div);
                var sRef = window.db.ref('status/' + fn);
                sRef.on('value', function(ss) {
    if (window.isGameActive()) return;  // <-- ADD THIS LINE
    var st = ss.val(),
        el = document.getElementById('status-' + fn);
    if (!el) return;
    if (st && st.state === 'online') {
        el.innerText = (st.activity && st.activity !== 'online') ? st.activity : 'online';
        el.className = 'status-sub';
    } else if (st && st.last_changed) { el.innerText = 'last seen ' + window.fmtTime(st.last_changed);
        el.className = 'status-sub status-offline'; } else { el.innerText = 'offline';
        el.className = 'status-sub status-orange'; }
});
                var cid = [myName, fn].sort().join('_');
                var uRef = window.db.ref('chats/' + cid);
                uRef.on('value', function(cs) {
                    var msgs = cs.val(),
                        hasU = msgs ? Object.values(msgs).some(function(m) { return m.sender === fn && !m.read; }) : false;
                    var dot = document.getElementById('unread-' + fn);
                    if (dot) dot.style.display = (hasU && window.currentChatFriend !== fn) ? 'block' : 'none';
                });
                _pf.push({ sr: sRef, ur: uRef });
            });
            window.updateChatDot();
        });
    }
};

window.addFriend = function() {
    var input = document.getElementById('friendInput');
    var tu = input.value.trim().toLowerCase();
    var st = document.getElementById('add-status');
    var mn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    if (!tu) return;
    if (tu === mn) { st.innerText = "Can't add yourself.";
        st.style.color = '#ff3366'; return; }
    if (!/^[a-z0-9]+$/.test(tu)) { st.innerText = 'Letters & numbers only.';
        st.style.color = '#ff3366'; return; }
    st.innerText = 'Checking...';
    st.style.color = '#888';
    window.db.ref('friends/' + mn + '/' + tu).once('value').then(function(fs) {
        if (fs.exists()) { st.innerText = 'Already friends!';
            st.style.color = '#2ecc71'; return; }
        window.db.ref('users/' + tu).once('value').then(function(snap) {
            if (!snap.exists()) { st.innerText = 'User not found.';
                st.style.color = '#ff3366'; return; }
            window.db.ref('friend_requests/' + tu + '/' + mn).once('value').then(function(req) {
                if (req.exists()) { st.innerText = 'Request already sent!';
                    st.style.color = '#f1c40f'; return; }
                window.db.ref('friend_requests/' + tu + '/' + mn).set({ from: mn, time: Date.now() })
                    .then(function() { st.innerText = '✓ Request sent to ' + tu + '!';
                        st.style.color = '#00f3ff';
                        input.value = ''; });
            });
        });
    });
};

window.acceptFriendRequest = function(fromUser) {
    var mn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    window.db.ref('friends/' + mn + '/' + fromUser).set(true);
    window.db.ref('friends/' + fromUser + '/' + mn).set(true);
    window.db.ref('friend_requests/' + mn + '/' + fromUser).remove();
    window.showNotify('✅ You and ' + fromUser + ' are now friends!', 'success');
};

window.rejectFriendRequest = function(fromUser) {
    var mn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    window.db.ref('friend_requests/' + mn + '/' + fromUser).remove();
    window.showNotify(fromUser + '\'s request declined.', 'info');
};

window.openChatWith = function(fn) {
    var mn = localStorage.getItem('playerName');
    if (window.currentChatId) window.db.ref('chats/' + window.currentChatId).off();
    window.currentChatFriend = fn;
    localStorage.setItem('lastReadChat', Date.now());
    window.currentChatId = [mn, fn].sort().join('_');
    window.db.ref('chats/' + window.currentChatId).once('value', function(snap) {
        var msgs = snap.val();
        if (msgs) Object.keys(msgs).forEach(function(id) { if (msgs[id].sender === fn && !msgs[id].read) window.db.ref('chats/' + window.currentChatId + '/' + id).update({ read: true }); });
    });
    document.getElementById('chat-title').innerText = 'Chat: ' + fn;
    var mi = document.getElementById('msgInput'),
        sb = document.getElementById('sendBtn');
    mi.disabled = false;
    mi.placeholder = 'Type message...';
    sb.disabled = false;
    requestAnimationFrame(function() { mi.focus(); });
    document.body.classList.add('chatting');
    document.querySelectorAll('.friend-item').forEach(function(el) { el.classList.remove('active'); });
    var fi = document.getElementById('friend-' + fn);
    if (fi) fi.classList.add('active');
    window.initNotifToggle(fn);
    window.loadChatMsgs();
};

window.closeChatPanel = function() {
    document.body.classList.remove('chatting');
    window.currentChatFriend = null;
    document.getElementById('msgInput').disabled = true;
    document.getElementById('sendBtn').disabled = true;
    window.initNotifToggle(null);
};

// ─── CHAT MESSAGES ─────────────────────────────────────────
window.loadChatMsgs = function() {
    var mn = localStorage.getItem('playerName'),
        mc = document.getElementById('chat-messages');
    mc.innerHTML = '';
    var thisChatId = window.currentChatId;
    var _lastMsgDate = '';
    if (typeof window.LC !== 'undefined') {
        window.LC.fb('section-chat', window.db.ref('chats/' + thisChatId), 'child_added', function(snap) {
            if (window.currentChatId !== thisChatId) return;
            var d = snap.val(),
                id = snap.key;
            if (d.timestamp) {
                var msgDate = new Date(d.timestamp).toDateString();
                if (msgDate !== _lastMsgDate) {
                    _lastMsgDate = msgDate;
                    var sep = document.createElement('div');
                    sep.className = 'chat-date-sep';
                    var today = new Date().toDateString(),
                        yesterday = new Date(Date.now() - 86400000).toDateString();
                    var label = msgDate === today ? 'Today' : msgDate === yesterday ? 'Yesterday' : new Date(d.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    sep.innerHTML = '<span>' + label + '</span>';
                    mc.appendChild(sep);
                }
            }
            var div = document.createElement('div');
            div.id = 'msg-' + id;
            var isSystem = d.sender === '_system';
            var isMine = !isSystem && d.sender === mn;
            div.className = 'message ' + (isSystem ? 'msg-system' : isMine ? 'msg-sent' : 'msg-received');
            if (!isSystem && !isMine && !d.read) window.db.ref('chats/' + window.currentChatId + '/' + id).update({ read: true });
            var sh = isMine ? '<span class="msg-status ' + (d.read ? 'tick-read' : 'tick-sent') + '">&#10003;&#10003;</span>' : '';
            function _lfy(t) { var e = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); return e.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#00f3ff;text-decoration:underline;word-break:break-all;">$1</a>'); }
            div.innerHTML = isSystem ?
                '<span style="color:#888;font-style:italic;font-size:0.82rem;">📢 ' + _lfy(d.text) + '</span>' :
                '<span>' + _lfy(d.text) + '</span><span class="msg-time">' + window.fmtTime(d.timestamp) + ' ' + sh + '</span>';
            mc.appendChild(div);
            requestAnimationFrame(function() { mc.scrollTop = mc.scrollHeight; });
            if (!isMine && !isSystem && d.timestamp && (Date.now() - d.timestamp) < 30000) window._sendChatNotif(d.sender, d.text);
        });
    }
    if (typeof window.LC !== 'undefined') {
        window.LC.fb('section-chat', window.db.ref('chats/' + thisChatId), 'child_changed', function(snap) {
            if (window.currentChatId !== thisChatId) return;
            var d = snap.val(),
                el = document.getElementById('msg-' + snap.key);
            if (el && d.read && d.sender === mn) { var t = el.querySelector('.msg-status'); if (t) { t.classList.remove('tick-sent');
                    t.classList.add('tick-read'); } }
        });
    }
};

window.sendMessage = function() {
    var mn = localStorage.getItem('playerName'),
        input = document.getElementById('msgInput'),
        text = input.value.trim();
    if (!text || !window.currentChatId) return;
    window.db.ref('chats/' + window.currentChatId).push({ sender: mn, text: text, timestamp: Date.now(), read: false })
        .then(function() { window._pruneChat(window.currentChatId); });
    input.value = '';
    requestAnimationFrame(function() { input.focus(); });
};

window._pruneChat = function(chatId) {
    if (!chatId) return;
    var cutoff14d = Date.now() - 14 * 24 * 60 * 60 * 1000;
    window.db.ref('chats/' + chatId).orderByChild('timestamp').once('value', function(snap) {
        if (!snap.exists()) return;
        var keys = [],
            toDelete = [];
        snap.forEach(function(child) {
            var d = child.val();
            if (d.timestamp && d.timestamp < cutoff14d) { toDelete.push(child.key); } else { keys.push(child.key); }
        });
        toDelete.forEach(function(k) { window.db.ref('chats/' + chatId + '/' + k).remove(); });
        if (keys.length > 50) {
            var excess = keys.slice(0, keys.length - 50);
            excess.forEach(function(k) { window.db.ref('chats/' + chatId + '/' + k).remove(); });
        }
    });
};

window.fmtTime = function(ts) {
    var d = new Date(ts),
        n = new Date();
    var time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    if (d.toDateString() === n.toDateString()) return time;
    var yesterday = new Date(n);
    yesterday.setDate(n.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday ' + time;
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() + ' ' + time;
};

window.handleChatKey = function(e) {
    if (e.key === 'Enter') window.sendMessage();
};

// ─── NOTIFICATION TOGGLE ───────────────────────────────────
function _notifKey(friend) { return friend ? 'notif_friend_' + friend : 'notif_all'; }

function _notifEnabled(friend) {
    if (!('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;
    var key = localStorage.getItem(_notifKey(friend));
    if (friend && key !== null) return key !== 'false';
    return localStorage.getItem('notif_all') !== 'false';
}

window.initNotifToggle = function(friend) {
    var chk = document.getElementById('notif-master-chk');
    var txt = document.getElementById('notif-bar-text');
    if (!chk || !txt) return;
    chk.dataset.friend = friend || '';
    txt.textContent = friend ?
        'Turn on/off notifications from ' + friend :
        'Turn on/off notifications';
    chk.checked = _notifEnabled(friend);
};

window.handleNotifToggle = function(chk) {
    var friend = chk.dataset.friend || null;
    var wantOn = chk.checked;

    if (!('Notification' in window)) {
        chk.checked = false;
        window.showNotify('❌ Notifications not supported in this browser.', 'error');
        return;
    }

    if (wantOn) {
        if (Notification.permission === 'granted') {
            localStorage.setItem(_notifKey(friend), 'true');
            window.showNotify('🔔 Notifications ' + (friend ? 'from ' + friend + ' ' : '') + 'enabled!', 'success');
        } else if (Notification.permission === 'denied') {
            chk.checked = false;
            window.showConfirm(
                'Notifications are blocked by your browser. To allow them, click the 🔒 icon in your address bar → Site settings → Notifications → Allow.',
                null, '⚠️'
            );
        } else {
            chk.checked = false;
            window.showConfirm(
                'Your browser will show a permission request. Click "Allow" to enable notifications.\n\nIf you cancel and want to allow later, you will need to allow from site permissions (🔒 icon in your browser address bar).',
                function() {
                    Notification.requestPermission().then(function(perm) {
                        if (perm === 'granted') {
                            chk.checked = true;
                            localStorage.setItem(_notifKey(friend), 'true');
                            try {
                                new Notification('🎮 Arcade Hub', {
                                    body: 'Notifications are now ON! You\'ll be notified like this.',
                                    icon: 'https://bittuhere.github.io/favicon.ico',
                                    tag: 'arcade-test',
                                    silent: true
                                });
                            } catch (_) {}
                            window.showNotify('🔔 Notifications enabled!', 'success');
                        } else {
                            chk.checked = false;
                            window.showNotify('❌ Permission denied. Allow from browser site settings.', 'error');
                        }
                    });
                },
                '🔔'
            );
        }
    } else {
        localStorage.setItem(_notifKey(friend), 'false');
        window.showNotify('🔕 Notifications ' + (friend ? 'from ' + friend + ' ' : '') + 'turned off.', 'info');
    }
};

// ─── SEND CHAT NOTIF ──────────────────────────────────────
window._sendChatNotif = function(from, text) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!_notifEnabled(from)) return;
    if (window.currentChatFriend === from && !document.hidden) return;
    try {
        var n = new Notification(from, {
            body: text.length > 80 ? text.slice(0, 77) + '…' : text,
            icon: 'https://bittuhere.github.io/favicon.ico',
            badge: 'https://bittuhere.github.io/favicon.ico',
            tag: 'chat-' + from,
            renotify: true,
            timestamp: Date.now()
        });
        n.onclick = function() {
            window.focus();
            try { window.openChatWith(from); } catch (_) {}
            n.close();
        };
        setTimeout(function() { try { n.close(); } catch (_) {} }, 8000);
    } catch (_) {}
};

// ─── CHAT DOT UPDATE ──────────────────────────────────────
window.updateChatDot = function() {
    var myName = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    var lastRead = parseInt(localStorage.getItem('lastReadChat') || '0');
    var hasUnread = false;
    window.db.ref('friends/' + myName).once('value', function(friendsSnap) {
        if (!friendsSnap.exists()) { _setDot(false); return; }
        var friends = Object.keys(friendsSnap.val());
        var remaining = friends.length;
        if (remaining === 0) { _setDot(false); return; }
        friends.forEach(function(fn) {
            var cid = [myName, fn].sort().join('_');
            window.db.ref('chats/' + cid).limitToLast(1).once('value', function(chatSnap) {
                var msgs = chatSnap.val();
                if (msgs) {
                    Object.values(msgs).forEach(function(msg) {
                        if (msg.sender !== myName && !msg.read && msg.timestamp > lastRead) { hasUnread = true; }
                    });
                }
                remaining--;
                if (remaining === 0) _setDot(hasUnread);
            });
        });
    });

    function _setDot(show) {
        var dot = document.getElementById('chat-notif-dot');
        var btn = document.querySelector('.hub-friends-btn');
        if (dot) dot.style.display = show ? 'block' : 'none';
        if (btn) {
            if (show) btn.classList.add('has-notif');
            else btn.classList.remove('has-notif');
        }
    }
};

// ─── PING ──────────────────────────────────────────────────
window._pingInterval = null;
window._pingHistory = [];

window._startPing = function(badgeId, msId) {
    if (window._pingInterval) clearInterval(window._pingInterval);
    window._pingHistory = [];

    function measure() {
        var t0 = performance.now();
        fetch('https://bittuhere-90415-default-rtdb.asia-southeast1.firebasedatabase.app/.json?shallow=true', { method: 'GET', cache: 'no-store' })
            .then(function() {
                var ping = Math.round(performance.now() - t0);
                window._pingHistory.push(ping);
                if (window._pingHistory.length > 5) window._pingHistory.shift();
                var avg = Math.round(window._pingHistory.reduce(function(a, b) { return a + b; }, 0) / window._pingHistory.length);
                var badge = document.getElementById(badgeId),
                    msEl = document.getElementById(msId);
                if (!badge || !msEl) return;
                msEl.innerText = avg;
                badge.className = 'ping-badge ' + (avg < 80 ? 'ping-good' : avg < 200 ? 'ping-medium' : 'ping-bad');
            }).catch(function() {
                var badge = document.getElementById(badgeId),
                    msEl = document.getElementById(msId);
                if (badge && msEl) { msEl.innerText = '999+';
                    badge.className = 'ping-badge ping-bad'; }
            });
    }
    measure();
    window._pingInterval = setInterval(function() {
        if (document.hidden || (typeof window.currentSection !== 'undefined' && window.currentSection !== 'section-chat')) return;
        measure();
    }, 6000);
};

window._stopPing = function() {
    if (window._pingInterval) { clearInterval(window._pingInterval);
        window._pingInterval = null; }
    window._pingHistory = [];
};
// Expose for TTT iframe
// ─── Expose for TTT invite sidebar ──────────────────────
window.loadFriendsForInvite = function() {
    var myName = localStorage.getItem('playerName');
    if (!myName) return;
    var inviteList = document.getElementById('invite-list');
    if (!inviteList) return;
    inviteList.innerHTML = '<p style="color:#666;">Loading friends...</p>';
    window.db.ref('friends/' + myName).once('value', function(snapshot) {
        inviteList.innerHTML = '';
        if (!snapshot.exists()) {
            inviteList.innerHTML = '<p style="color:#666;">No friends found.</p>';
            return;
        }
        Object.keys(snapshot.val()).forEach(function(friendName) {
            var div = document.createElement('div');
            div.className = 'invite-item';
            div.innerHTML = '<span>' + friendName + '</span><button class="btn-send-invite" onclick="window.sendInvite(\'' + friendName + '\')">SEND CODE</button>';
            inviteList.appendChild(div);
        });
    });
};

window.sendInvite = function(friendName) {
    var roomId = window.roomId;
    if (!roomId) {
        var tttIframe = document.getElementById('iframe-multittt');
        if (tttIframe && tttIframe.contentWindow) {
            roomId = tttIframe.contentWindow.roomId || tttIframe.contentWindow._roomId;
        }
    }
    if (!roomId) return window.showNotify('Create a game first!', 'error');
    window.db.ref('invites/' + friendName.toLowerCase()).push({
        from: localStorage.getItem('playerName'),
        game: 'ttt',
        code: roomId,
        time: Date.now()
    });
    var chatId = [localStorage.getItem('playerName'), friendName].sort().join('_');
    window.db.ref('chats/' + chatId).push({
        sender: localStorage.getItem('playerName'),
        text: '🎮 Join my Tic-Tac-Toe! Code: ' + roomId,
        timestamp: Date.now()
    });
    window.showNotify('✓ Invite sent to ' + friendName + '!', 'invite');
    var sidebar = document.getElementById('inviteSidebar');
    if (sidebar) sidebar.classList.remove('active');
};
console.log('✅ Chat loaded');