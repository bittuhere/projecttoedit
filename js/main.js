// ─── LIFECYCLE MANAGEMENT (LC) ─────────────────────────────
window.LC = {
    _r: {},
    _e(id) { if (!this._r[id]) this._r[id] = { t: [], f: [], c: [] }; },
    timer(id, tid) { this._e(id); this._r[id].t.push(tid); return tid; },
    fb(id, ref, ev, fn) { this._e(id); ref.on(ev, fn); this._r[id].f.push({ ref, ev, fn }); },
    fn(id, fn) { this._e(id); this._r[id].c.push(fn); },
    leave(id) {
        const r = this._r[id]; if (!r) return;
        r.t.forEach(t => { clearTimeout(t); clearInterval(t); });
        r.f.forEach(({ ref, ev, fn }) => { try { ref.off(ev, fn); } catch (e) { } });
        r.c.forEach(fn => { try { fn(); } catch (e) { } });
        delete this._r[id];
    },
    leaveAll() { Object.keys(this._r).forEach(id => this.leave(id)); }
};

// ─── HELPER: Check if user is in a game ────────────────────
window.isGameActive = function() {
    return window.currentSection && window.currentSection.startsWith('section-game-');
};

// ─── SPA NAVIGATION ────────────────────────────────────────
window.spaHistory = [];
window.currentSection = 'section-login';
window._navLock = false;

// ─── GAME IFRAME MAP ──────────────────────────────────────
window._gameIframeMap = {
    'section-game-dino': 'iframe-dino',
    'section-game-flappy': 'iframe-flappy',
    'section-game-pacman': 'iframe-pacman',
    'section-game-car': 'iframe-car',
    'section-game-snake': 'iframe-snake',
    'section-game-fair': 'iframe-fair',
    'section-game-rps': 'iframe-rps',
    'section-game-rpsrand': 'iframe-rpsrand',
    'section-game-ttt': 'iframe-ttt',
    'section-game-multittt': 'iframe-multittt',
    'section-game-multicar': 'iframe-multicar',
    'section-game-arcadecraft': 'iframe-arcadecraft'
};

// ─── MAPS TO ───────────────────────────────────────────────
window.MapsTo = function(targetId, direction) {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        var _done = false;
        function _afterFS() { if (_done) return; _done = true; clearTimeout(_tm); window.MapsTo(targetId, direction); }
        var _tm = setTimeout(_afterFS, 450);
        document.addEventListener('fullscreenchange', _afterFS, { once: true });
        document.addEventListener('webkitfullscreenchange', _afterFS, { once: true });
        try { document.exitFullscreen(); } catch (e1) { try { document.webkitExitFullscreen(); } catch (e2) {} }
        return;
    }
    if (targetId === window.currentSection || window._navLock) return;
    var cur = document.getElementById(window.currentSection);
    var tgt = document.getElementById(targetId);
    if (!cur || !tgt) return;

    window._navLock = true;
    window.showLoader();
    cur.scrollTop = 0;

    window.LC.leave(window.currentSection);
    window._clearMemory && window._clearMemory();
    var _pcov = document.getElementById('profile-card-overlay');
    if (_pcov) _pcov.classList.remove('pc-show');
    var iframeId = window._gameIframeMap[window.currentSection];
    if (iframeId) window._unmountGame(iframeId);
    var _acb = document.getElementById('arcadecraft-back-btn');
    if (_acb && window.currentSection !== 'section-game-arcadecraft') _acb.style.display = 'none';
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (_) {}

    tgt.classList.remove('hidden-left', 'hidden-right', 'active');
    tgt.classList.add(direction === 'right' ? 'hidden-right' : 'hidden-left');
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            cur.classList.remove('active');
            cur.classList.add(direction === 'right' ? 'hidden-left' : 'hidden-right');
            tgt.classList.remove('hidden-right', 'hidden-left');
            tgt.classList.add('active');
            if (targetId === 'section-game-fair') {
                if (typeof window.checkAndLoadFair === 'function') window.checkAndLoadFair();
            }
            window.LC.timer('__nav', setTimeout(function() { window._navLock = false; }, 370));
        });
    });

    window.spaHistory.push(window.currentSection);
    window.currentSection = targetId;
    history.pushState({ spa: targetId }, '', '#' + targetId);

    if (targetId === 'section-chat') {
        window.LC.timer('section-chat', setTimeout(window.initChat, 300));
    }
    if (targetId === 'section-admin') {
        window.LC.timer('section-admin', setTimeout(function() {
            var b = document.querySelector('#section-admin .admin-btn');
            if (b && typeof window.adminShowSection === 'function') window.adminShowSection('dashboard', b);
        }, 200));
    }
    if (targetId === 'section-leaderboard') {
        window.LC.timer('section-leaderboard', setTimeout(function() {
            var active = document.querySelector('.lb-game-tab.active');
            if (active) { window.loadLeaderboard(); }
            else {
                var first = document.querySelector('.lb-game-tab');
                if (first) {
                    var m = first.getAttribute('onclick').match(/'([^']+)'/);
                    if (m) window.lbSelectGame(m[1], first);
                }
            }
        }, 320));
    }
    var _lbar = document.getElementById('lb-my-rank-bar');
    if (_lbar && targetId !== 'section-leaderboard') _lbar.classList.remove('show');
    if (targetId === 'section-hub') {
        window.LC.timer('section-hub', setTimeout(window.initHub, 300));
        if (window.currentSection && window.currentSection.startsWith('section-game')) window._setUserStatus('online');
        setTimeout(window._checkInviteQueue, 800);
    }
    window.hideLoader();
    setTimeout(window._updateRotateOverlay, 370);
};

// ─── SPA GO BACK ──────────────────────────────────────────
window.spaGoBack = function() {
    var _acBtn = document.getElementById('arcadecraft-back-btn');
    if (_acBtn) _acBtn.style.display = 'none';
    if (!window.spaHistory.length || window._navLock) return;
    var prev = window.spaHistory.pop();
    var cur = document.getElementById(window.currentSection);
    var tgt = document.getElementById(prev);
    if (!cur || !tgt) return;

    window._navLock = true;
    cur.scrollTop = 0;
    window.LC.leave(window.currentSection);
    window._clearMemory && window._clearMemory();
    var iframeId = window._gameIframeMap[window.currentSection];
    if (iframeId) window._unmountGame(iframeId);

    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            cur.classList.remove('active');
            cur.classList.add('hidden-right');
            tgt.classList.remove('hidden-left', 'hidden-right');
            tgt.classList.add('active');
            window.LC.timer('__nav', setTimeout(function() { window._navLock = false; }, 370));
        });
    });

    window.currentSection = prev;
    if (prev === 'section-hub') {
        window.LC.timer('section-hub', setTimeout(window.initHub, 300));
        window._setUserStatus('online');
        setTimeout(window._checkInviteQueue, 800);
    }
    setTimeout(window._updateRotateOverlay, 370);
};

// ─── LOADER ─────────────────────────────────────────────────
window.showLoader = function() {
    var ol = document.getElementById('loading-overlay');
    ol.style.display = 'flex';
    ol.classList.remove('fade-out');
};

window.hideLoader = function() {
    setTimeout(function() {
        var ol = document.getElementById('loading-overlay');
        ol.classList.add('fade-out');
        setTimeout(function() { ol.style.display = 'none'; ol.classList.remove('fade-out'); }, 400);
    }, 200);
};

// ─── GAME IFRAME HELPERS ──────────────────────────────────
// _gameSrc and _mountGame removed – games use src directly.
window._unmountGame = function(iid) {
    var fr = document.getElementById(iid);
    if (!fr) return;
    delete fr.dataset.mounted;
    if (iid !== 'iframe-arcadecraft') {
        fr.src = 'about:blank';
    }
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (_) {}
};

// ─── ROTATE OVERLAY ────────────────────────────────────────
window._fsActive = false;
var _GAME_SECTIONS = new Set(['section-game-dino', 'section-game-multicar', 'section-game-car', 'section-game-arcadecraft']);

window._isMobilePortrait = function() {
    return window.innerWidth < window.innerHeight && Math.min(window.screen.width, window.screen.height) <= 900;
};

window._updateRotateOverlay = function() {
    var fv = document.getElementById('fair-viewer');
    if (fv && fv.classList.contains('open')) return;
    var el = document.getElementById('rotate-overlay');
    if (!el) return;
    if (_GAME_SECTIONS.has(window.currentSection) && !window._fsActive && window._isMobilePortrait()) {
        el.classList.add('rotate-show');
    } else {
        el.classList.remove('rotate-show');
    }
};

window.addEventListener('resize', function() { window._updateRotateOverlay(); }, { passive: true });
if (screen.orientation) {
    screen.orientation.addEventListener('change', window._updateRotateOverlay);
} else {
    window.addEventListener('orientationchange', window._updateRotateOverlay);
}

// ─── OFFLINE DETECTION ─────────────────────────────────────
(function setupOfflineDetection() {
    var banner = document.getElementById('offline-banner');
    function updateBannerHeight() {
        if (banner && banner.style.display !== 'none') {
            document.body.style.setProperty('--banner-height', banner.offsetHeight + 'px');
            document.body.classList.add('offline');
        } else {
            document.body.classList.remove('offline');
        }
    }
    function setOnline() { if (banner) { banner.style.display = 'none'; updateBannerHeight(); } }
    function setOfflineDelayed() {
        if (!navigator.onLine && banner) { banner.style.display = 'block'; updateBannerHeight(); }
    }
    window.addEventListener('online', setOnline, { passive: true });
    window.addEventListener('offline', function() {
        if (banner) { banner.style.display = 'block'; updateBannerHeight(); }
    }, { passive: true });
    if (typeof window.db !== 'undefined') {
        var _firstFired = false;
        window.db.ref('.info/connected').on('value', function(snap) {
            if (!_firstFired) { _firstFired = true; return; }
            if (snap.val() === false) setOfflineDelayed(); else setOnline();
        });
    }
    window.addEventListener('resize', function() {
        if (banner && banner.style.display !== 'none') { updateBannerHeight(); }
    });
})();

// ─── POPSTATE ──────────────────────────────────────────────
window.addEventListener('popstate', function(e) {
    e.preventDefault();
    window.spaGoBack();
    // history.pushState REMOVED to fix back-navigation loop
});

// ─── POSTMESSAGE ───────────────────────────────────────────
window.addEventListener('message', function(e) {
    if (e.data === 'spa-back') {
        if (localStorage.getItem('isLoggedIn') !== 'true') return;
        var isGame = window.currentSection && window.currentSection.startsWith('section-game');
        if (isGame) { window._setUserStatus('online'); window.MapsTo('section-hub', 'left'); }
        else { window.spaGoBack(); }
        history.pushState({ spa: window.currentSection }, '', '#' + window.currentSection);
    }
    if (e.data === 'spa-leaderboard') { window.MapsTo('section-leaderboard', 'right'); }
    if (e.data === 'score-saved' || e.data === 'score-syncing') { window._showScoreSync(e.data); }
    if (e.data === 'fs-entered') { window._fsActive = true; window._updateRotateOverlay(); }
    if (e.data === 'fs-exited') { window._fsActive = false; try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (_) {} window._updateRotateOverlay(); }
    if (e.data && typeof e.data === 'object' && e.data.type === 'notify') { window.showNotify(e.data.msg, e.data.nt || 'info'); }
    if (e.data && typeof e.data === 'object' && e.data.type === 'confirm') {
        var _confSrc = e.source;
        window.showConfirm(e.data.msg, function() {
            try { _confSrc.postMessage({ type: 'confirm-yes', action: e.data.action }, '*'); } catch (ex) {}
        }, e.data.icon);
    }
    if (e.data && typeof e.data === 'object' && e.data.type === 'confirm-yes') {
        if (e.data.action === 'reset-snake' && typeof window._doResetControls === 'function') {
            window._doResetControls();
        }
        if (e.data.action === 'reset-pacman' && typeof window._doResetControls === 'function') {
            window._doResetControls();
        }
    }
});

// ─── SCORE SYNC TOAST ──────────────────────────────────────
window._showScoreSync = function(status) {
    if (status === 'score-saved') {
        window.showNotify('🏆 Score Synced Successfully!', 'success');
    } else {
        window.showNotify('Syncing score...', 'info');
    }
};

// ─── USER STATUS ───────────────────────────────────────────
window._gameStatusNames = {
    'dino': '🦕 Playing Dino Game',
    'flappy': '🐦 Playing Flappy Bird',
    'pacman': 'ᗧ Playing Pac-Man',
    'car': '🚗 Playing Car Game',
    'snake': '🐍 Playing Snake',
    'fair': '📝 Viewing Fair Copies',
    'rps': '✊ Playing Rock Paper Scissors',
    'rpsrand': '✊ Playing RPS vs AI',
    'ttt': '❌⭕ Playing Tic-Tac-Toe',
    'multittt': '🎮 Playing TTT Online',
    'multicar': '🏎️ Playing Car Multiplayer',
    'arcadecraft': '⛏️ Playing ArcadeCraft',
    'quiz': '🧠 Taking Weekly Quiz'
};

window._setUserStatus = function(statusVal) {
    var pn = localStorage.getItem('playerName');
    if (!pn || typeof window.db === 'undefined') return;
    window.db.ref('status/' + pn).update({ activity: statusVal, last_changed: firebase.database.ServerValue.TIMESTAMP });
};

// ─── INVITE QUEUE ──────────────────────────────────────────
window._inviteQueue = [];
window._inviteCurrent = null;
window._inviteTimer = null;

window._handleInviteMessage = function(invData) {
    var busySections = ['section-game-', 'section-leaderboard'];
    var isBusy = busySections.some(function(s) { return window.currentSection.startsWith(s); });
    if (isBusy) {
        window._inviteQueue.push(invData);
        window.showNotify('📬 Invite from ' + invData.from + ' queued!', 'invite');
    } else {
        if (typeof window._showInvitePopup === 'function') {
            window._showInvitePopup(invData);
        }
    }
};

window._checkInviteQueue = function() {
    if (window._inviteQueue.length > 0 && window.currentSection === 'section-hub') {
        window.showNotify('📬 You have ' + window._inviteQueue.length + ' pending invite(s)!', 'invite');
        setTimeout(function() {
            if (window._inviteQueue.length > 0 && typeof window._showInvitePopup === 'function') {
                window._showInvitePopup(window._inviteQueue.shift());
            }
        }, 500);
    }
};

window._showInvitePopup = function(inv) {
    window._inviteCurrent = inv;
    var icon = inv.game === 'ttt' ? '❌' : inv.game === 'chess' ? '♟️' : '🏎️';
    var gameName = inv.game === 'ttt' ? 'Tic-Tac-Toe Online' : inv.game === 'chess' ? 'Chess Online' : 'Car Multiplayer';
    document.getElementById('inv-icon').innerText = icon;
    document.getElementById('inv-title').innerText = gameName.toUpperCase();
    document.getElementById('inv-msg').innerText = '👤 ' + inv.from + ' invited you!\n🎮 Code: ' + inv.code;
    var popup = document.getElementById('invite-popup');
    popup.classList.add('inv-show');
    var bar = document.getElementById('inv-progress-bar');
    if (bar) {
        bar.classList.remove('running');
        bar.style.width = '100%';
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { bar.classList.add('running'); });
        });
    }
    if (window._inviteTimer) clearTimeout(window._inviteTimer);
    window._inviteTimer = setTimeout(function() { window._dismissInvitePopup(false); }, 15000);
};

window._dismissInvitePopup = function(accepted) {
    var popup = document.getElementById('invite-popup');
    popup.classList.remove('inv-show');
    var bar = document.getElementById('inv-progress-bar');
    if (bar) { bar.classList.remove('running'); bar.style.width = '100%'; }
    if (window._inviteTimer) { clearTimeout(window._inviteTimer); window._inviteTimer = null; }
    if (!accepted && window._inviteCurrent) {
        var me = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        var senderName = (window._inviteCurrent.from || '').toLowerCase();
        if (typeof window.db !== 'undefined' && me && senderName) {
            var chatId = [me, senderName].sort().join('_');
            window.db.ref('chats/' + chatId).push({
                sender: '_system',
                text: '❌ ' + me + ' declined your game invite.',
                timestamp: Date.now(),
                read: false
            });
            window.db.ref('invites/' + senderName).push({
                type: 'reject',
                from: me,
                game: window._inviteCurrent.game,
                time: Date.now()
            });
        }
    }
    window._inviteCurrent = null;
    setTimeout(function() {
        if (window._inviteQueue.length > 0) {
            window._showInvitePopup(window._inviteQueue.shift());
        }
    }, 600);
};

document.addEventListener('DOMContentLoaded', function() {
    var acceptBtn = document.getElementById('inv-accept');
    var rejectBtn = document.getElementById('inv-reject');
    if (acceptBtn) {
        acceptBtn.onclick = function() {
            if (!window._inviteCurrent) return;
            var inv = window._inviteCurrent;
            window._dismissInvitePopup(true);
            var gameKey = inv.game === 'ttt' ? 'multittt' : inv.game === 'chess' ? 'chess' : 'multicar';
            window.openGame(gameKey);
            var delay = (inv.game === 'multicar') ? 1400 : 600;
            setTimeout(function() {
                var fr = document.getElementById('iframe-' + gameKey);
                if (fr && fr.contentWindow) {
                    fr.contentWindow.postMessage({ type: 'auto-join', code: inv.code }, '*');
                }
            }, delay);
        };
    }
    if (rejectBtn) {
        rejectBtn.onclick = function() {
            window._dismissInvitePopup(false);
        };
    }
});

// ─── IN-GAME NOTIF ─────────────────────────────────────────
window._inGameNotifCount = 0;
window._showInGameNotif = function(text) {
    if (!window.currentSection || !window.currentSection.startsWith('section-game-')) return;
    var badge = document.getElementById('in-game-notif-badge');
    var textEl = document.getElementById('in-game-notif-text');
    if (badge && textEl) {
        textEl.innerText = text || 'New notification!';
        badge.classList.add('show');
        clearTimeout(badge._hideTimer);
        badge._hideTimer = setTimeout(function() { badge.classList.remove('show'); }, 8000);
    }
};
window._goBackFromGameNotif = function() {
    var badge = document.getElementById('in-game-notif-badge');
    if (badge) badge.classList.remove('show');
    window._setUserStatus('online');
    window.MapsTo('section-hub', 'left');
};

// ─── CHAT NOTIF BG ─────────────────────────────────────────
window._bgChatRefs = [];
window._startBgChatNotifListener = function(myName) {
    window._bgChatRefs.forEach(function(r) { try { r.off(); } catch (e) {} });
    window._bgChatRefs = [];
    window.db.ref('friends/' + myName).once('value', function(snap) {
        if (!snap.exists()) return;
        Object.keys(snap.val()).forEach(function(friend) {
            var cid = [myName, friend].sort().join('_');
            var ref = window.db.ref('chats/' + cid).limitToLast(1);
            ref.on('child_added', function(msgSnap) {
                var d = msgSnap.val();
                if (!d || d.sender === myName) return;
                if (!d.timestamp || (Date.now() - d.timestamp) > 30000) return;
                if (typeof window._sendChatNotif === 'function') {
                    window._sendChatNotif(d.sender, d.text);
                }
            });
            window._bgChatRefs.push(ref);
        });
    });
};

// ─── MEMORY CLEANUP ────────────────────────────────────────
window._clearMemory = function() {
    if (window.gc) { try { window.gc(); } catch (e) {} }
};

// ─── RESET CONTROLS ────────────────────────────────────────
window._doResetControls = function() {
    var controlButtons = document.querySelectorAll('.ctrl-btn');
    controlButtons.forEach(function(btn) {
        localStorage.removeItem('pos_' + btn.id);
    });
    var def = {
        'btn-up': ['50%', '90px', 'translateX(-50%)'],
        'btn-left': ['calc(50% - 109px)', '20px', ''],
        'btn-down': ['50%', '20px', 'translateX(-50%)'],
        'btn-right': ['calc(50% + 44px)', '20px', '']
    };
    controlButtons.forEach(function(btn) {
        var d = def[btn.id];
        if (d) {
            btn.style.left = d[0];
            btn.style.bottom = d[1];
            btn.style.transform = d[2];
        }
    });
};

// ─── INIT APP ──────────────────────────────────────────────
// ─── LANDSCAPE / ROTATION ──────────────────────────────────
window.handleMobileRotation = async function() {
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;
    try {
        const de = document.documentElement;
        if (de.requestFullscreen) await de.requestFullscreen();
        else if (de.webkitRequestFullscreen) await de.webkitRequestFullscreen();
        else if (de.msRequestFullscreen) await de.msRequestFullscreen();

        if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape').catch(e => console.warn('Orientation lock failed:', e));
        }
    } catch (err) { console.warn('Rotation/FS failed:', err); }
};
window.forcelandscape = window.handleMobileRotation;

window.exitLandscapeAndRelease = async function() {
    try {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        }
    } catch (err) { console.warn('Exit FS/Orientation failed:', err); }
};
window.exitlandscape = window.exitLandscapeAndRelease;

window.initApp = function() {
    console.log('✅ Arcade Hub initialized.');
    var li = localStorage.getItem('isLoggedIn') === 'true';
    var pn = localStorage.getItem('playerName');
    if (li && pn) {
        window.db.ref('users/' + pn.toLowerCase().trim()).once('value').then(function(snap) {
            if (snap.exists() && !(snap.val() && snap.val().blocked)) {
                window.initHub();
                window.MapsTo('section-hub', 'right');
            } else {
                localStorage.clear();
                window.MapsTo('section-login', 'left');
            }
        }).catch(function() {
            window.MapsTo('section-login', 'left');
        });
    } else {
        window.MapsTo('section-login', 'left');
    }
    setTimeout(window._updateRotateOverlay, 500);
};

console.log('✅ Main loaded');