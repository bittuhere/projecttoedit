// ─── PROFILE ────────────────────────────────────────────────
window.openMyProfile = function() {
    var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    if (!pn) return;
    window.MapsTo('section-profile', 'right');
    window._loadMyProfile(pn);
    window._checkUnameCooldown(pn);
};

window._loadMyProfile = function(pid) {
    var avatarEl = document.getElementById('my-prof-avatar');
    var nameEl = document.getElementById('my-prof-name');
    var loginEl = document.getElementById('my-prof-lastlogin');
    var statsEl = document.getElementById('my-prof-stats');
    if (!avatarEl) return;
    if (statsEl) statsEl.innerHTML = '';
    avatarEl.innerText = pid.charAt(0).toUpperCase();
    nameEl.innerText = pid.charAt(0).toUpperCase() + pid.slice(1);
    window.db.ref('friends/' + pid).once('value', function(fSnap) {
        var fc = document.getElementById('my-friends-count');
        var fcount = fSnap.exists() ? Object.keys(fSnap.val()).length : 0;
        if (fc) fc.innerText = fcount;

        var lb = document.getElementById('my-level-badge');
        if (!lb) return;

        function getTier(score, thresholds) {
            if (score >= thresholds[3]) return 4;
            if (score >= thresholds[2]) return 3;
            if (score >= thresholds[1]) return 2;
            return 1;
        }

        var flappyThresh = [10, 50, 200, 500];
        var dinoThresh = [200, 800, 2000, 5000];
        var snakeThresh = [50, 150, 300, 600];
        var pacmanThresh = [2000, 5000, 10000, 20000];

        window.db.ref('users/' + pid).once('value', function(userSnap) {
            if (!userSnap.exists()) return;
            var d = userSnap.val();

            var flappyScore = d.flappy_highscore || 0;
            var dinoScore = d.dino_highscore || 0;
            var snakeScore = d.snake_highscore || 0;
            var pacmanScore = d.pacman_highscore || 0;

            var flappyTier = getTier(flappyScore, flappyThresh);
            var dinoTier = getTier(dinoScore, dinoThresh);
            var snakeTier = getTier(snakeScore, snakeThresh);
            var pacmanTier = getTier(pacmanScore, pacmanThresh);

            var avgTier = (flappyTier + dinoTier + snakeTier + pacmanTier) / 4;
            var overall = Math.round(avgTier);

            var badgeIcon = '',
                badgeText = '';
            switch (overall) {
                case 4:
                    badgeIcon = '👑';
                    badgeText = 'Legend';
                    break;
                case 3:
                    badgeIcon = '⭐';
                    badgeText = 'Pro';
                    break;
                case 2:
                    badgeIcon = '🔥';
                    badgeText = 'Rising';
                    break;
                default:
                    badgeIcon = '🌱';
                    badgeText = 'Newbie';
            }
            lb.innerText = badgeIcon + ' ' + badgeText;
            lb.style.cursor = 'pointer';
            lb.style.transition = 'opacity 0.2s';
            lb.onmouseenter = function() { lb.style.opacity = '0.8'; };
            lb.onmouseleave = function() { lb.style.opacity = '1'; };
            lb.onclick = function() {
                window.showBadgeDetails({
                    flappy: { score: flappyScore, tier: flappyTier, thresholds: flappyThresh },
                    dino: { score: dinoScore, tier: dinoTier, thresholds: dinoThresh },
                    snake: { score: snakeScore, tier: snakeTier, thresholds: snakeThresh },
                    pacman: { score: pacmanScore, tier: pacmanTier, thresholds: pacmanThresh },
                    avgTier: avgTier,
                    overall: overall,
                    badgeIcon: badgeIcon,
                    badgeText: badgeText
                });
            };
        });
    });
    window.db.ref('users/' + pid).once('value', function(snap) {
        if (!snap.exists()) return;
        var d = snap.val();
        if (d.lastLogin && loginEl) {
            var ist = new Date(d.lastLogin).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            loginEl.innerText = 'Last active: ' + ist;
        }
        var bioDisplay = document.getElementById('my-bio-display');
        var bioInput = document.getElementById('my-bio-input');
        var bioCtrls = document.getElementById('my-bio-controls');
        if (bioDisplay) {
            if (d.bio) { bioDisplay.innerText = d.bio;
                bioDisplay.className = 'prof-bio-text'; } else { bioDisplay.innerText = 'Tap to add a bio...';
                bioDisplay.className = 'prof-bio-text empty'; }
            bioDisplay.onclick = function() {
                bioDisplay.style.display = 'none';
                if (bioInput) { bioInput.value = d.bio || '';
                    bioInput.style.display = 'block';
                    bioInput.focus();
                    window.updateBioCount(); }
                if (bioCtrls) bioCtrls.style.display = 'flex';
            };
        }
        var games = [
            { key: 'flappy_highscore', icon: '🐦', label: 'Flappy', color: '#00f3ff' },
            { key: 'dino_highscore', icon: '🦕', label: 'Dino', color: '#2ecc71' },
            { key: 'snake_highscore', icon: '🐍', label: 'Snake', color: '#f1c40f' },
            { key: 'pacman_highscore', icon: 'ᗧ', label: 'Pac-Man', color: '#e74c3c' }
        ];
        if (statsEl) {
            statsEl.innerHTML = '';
            games.forEach(function(g) {
                var val = d[g.key] || 0;
                var card = document.createElement('div');
                card.className = 'prof-stat-card';
                card.innerHTML = '<div class="prof-stat-icon">' + g.icon + '</div><div class="prof-stat-label">' + g.label + '</div><div class="prof-stat-val" style="color:' + g.color + ';">' + (val > 0 ? val.toLocaleString() : '—') + '</div>';
                statsEl.appendChild(card);
            });
        }
        var rankEl = document.getElementById('my-rank-display');
        if (rankEl) {
            var best = Math.max(d.flappy_highscore || 0, d.dino_highscore || 0, d.snake_highscore || 0, d.pacman_highscore || 0);
            rankEl.innerText = best > 0 ? best.toLocaleString() : '—';
        }
        var gpEl = document.getElementById('my-games-played');
        if (gpEl) {
            var played = [d.flappy_highscore, d.dino_highscore, d.snake_highscore, d.pacman_highscore].filter(function(s) { return s && s > 0; }).length;
            gpEl.innerText = played > 0 ? played + '/4' : '—';
        }
    });
};

window.updateBioCount = function() {
    var inp = document.getElementById('my-bio-input');
    var countEl = document.getElementById('my-bio-wordcount');
    if (!inp || !countEl) return;
    var wc = inp.value.length;
    countEl.innerText = wc;
    countEl.style.color = wc > 100 ? '#ff3366' : 'rgba(255,255,255,0.3)';
    var errEl = document.getElementById('my-bio-error');
    if (errEl) errEl.innerText = '';
};

window.saveBio = function() {
    var pid = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    var inp = document.getElementById('my-bio-input');
    var bioDisplay = document.getElementById('my-bio-display');
    var bioCtrls = document.getElementById('my-bio-controls');
    var errEl = document.getElementById('my-bio-error');
    if (!inp || !pid) return;
    var text = inp.value.trim();
    if (text.length > 100) { if (errEl) errEl.innerText = '❌ Max 100 characters!'; return; }
    if (window._containsBadWords(text)) { if (errEl) errEl.innerText = '❌ Abusive words found! Keep it clean.'; return; }
    window.db.ref('users/' + pid).update({ bio: text || null }, function(err) {
        if (err) { if (errEl) errEl.innerText = '❌ Error saving.'; return; }
        if (bioDisplay) {
            bioDisplay.style.display = 'block';
            if (text) { bioDisplay.innerText = text;
                bioDisplay.className = 'prof-bio-text'; } else { bioDisplay.innerText = 'Tap to add a bio...';
                bioDisplay.className = 'prof-bio-text empty'; }
        }
        if (inp) inp.style.display = 'none';
        if (bioCtrls) bioCtrls.style.display = 'none';
        window.showNotify('✅ Bio saved!', 'success');
    });
};

window._badWords = ['fuck', 'shit', 'bitch', 'cunt', 'bastard', 'whore', 'slut', 'nigger', 'faggot', 'retard', 'motherfucker', 'asshole', 'dickhead', 'bullshit'];

window._containsBadWords = function(text) {
    var lower = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
    return window._badWords.some(function(w) { return lower.indexOf(w) >= 0; });
};

// ─── SEARCH USER PROFILE ────────────────────────────────────
window.searchUserProfile = function() {
    var raw = document.getElementById('prof-search-input').value.trim().toLowerCase();
    var result = document.getElementById('prof-search-result');
    if (!raw) { result.innerHTML = ''; return; }
    if (raw.length < 2) { result.innerHTML = '<p style="font-size:0.8rem;color:rgba(255,255,255,0.3);margin-top:8px;">Type at least 2 characters...</p>'; return; }
    if (!/^[a-z0-9]+$/.test(raw)) { result.innerHTML = '<p style="font-size:0.8rem;color:rgba(255,51,102,0.7);margin-top:8px;">Letters & numbers only.</p>'; return; }
    result.innerHTML = '<p style="font-size:0.8rem;color:rgba(255,255,255,0.3);margin-top:8px;letter-spacing:1px;">Searching...</p>';
    var myName = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    window.db.ref('users').orderByKey().startAt(raw).endAt(raw + '\uf8ff').limitToFirst(10).once('value', function(snap) {
        result.innerHTML = '';
        if (!snap.exists()) { result.innerHTML = '<p style="font-size:0.82rem;color:rgba(255,51,102,0.7);margin-top:10px;text-align:center;">No players found for "' + raw + '"</p>'; return; }
        var count = 0;
        snap.forEach(function(child) {
            count++;
            var uid = child.key;
            if (uid === myName) return;
            var d = child.val();
            var displayName = uid.charAt(0).toUpperCase() + uid.slice(1);
            var scoreStr = '🐦' + (d.flappy_highscore || 0) + '  🦕' + (d.dino_highscore || 0) + '  🐍' + (d.snake_highscore || 0);
            window.db.ref('friends/' + myName + '/' + uid).once('value', function(fSnap) {
                window.db.ref('friend_requests/' + uid + '/' + myName).once('value', function(rSnap) {
                    var isFriend = fSnap.exists(),
                        reqSent = rSnap.exists();
                    var btnLabel = isFriend ? '✓ Friends' : reqSent ? '⏳ Sent' : '+ Add';
                    var btnClass = isFriend ? 'added' : reqSent ? 'sent' : '';
                    var row = document.createElement('div');
                    row.className = 'prof-search-result-item';
                    row.innerHTML = '<div class="psri-avatar">' + displayName.charAt(0) + '</div>' +
                        '<div class="psri-info"><div class="psri-name">' + displayName + '</div>' +
                        '<div class="psri-sub">' + scoreStr + (d.bio ? '  ·  ' + d.bio.slice(0, 30) : '') + '</div></div>';
                    if (!isFriend) {
                        var addBtn = document.createElement('button');
                        addBtn.className = 'psri-add-btn ' + btnClass;
                        addBtn.innerText = btnLabel;
                        if (!reqSent) {
                            addBtn.onclick = function(e) {
                                e.stopPropagation();
                                window.db.ref('friend_requests/' + uid + '/' + myName).set({ from: myName, time: Date.now() })
                                    .then(function() { addBtn.innerText = '⏳ Sent';
                                        addBtn.className = 'psri-add-btn sent';
                                        window.showNotify('✓ Request sent to ' + displayName + '!', 'success'); });
                            };
                        }
                        row.appendChild(addBtn);
                    }
                    row.onclick = function() { window.openProfileCard(uid); };
                    result.appendChild(row);
                });
            });
        });
        if (count === 0 || result.children.length === 0) {
            setTimeout(function() {
                if (result.children.length === 0) result.innerHTML = '<p style="font-size:0.82rem;color:rgba(255,51,102,0.7);margin-top:10px;text-align:center;">No other players found for "' + raw + '"</p>';
            }, 1500);
        }
    });
};

// ─── USERNAME CHANGE ──────────────────────────────────────
window._checkUnameCooldown = function(pid) {
    var msgEl = document.getElementById('prof-cooldown-msg');
    if (!msgEl) return;
    window.db.ref('users/' + pid + '/lastUnameRequest').once('value', function(snap) {
        if (!snap.val()) { msgEl.innerHTML = ''; return; }
        var diff = Date.now() - snap.val(),
            days7 = 7 * 24 * 60 * 60 * 1000;
        if (diff < days7) {
            var rem = Math.ceil((days7 - diff) / (24 * 60 * 60 * 1000));
            msgEl.innerHTML = '<div class="prof-cooldown">⏳ Next request in ' + rem + ' day' + (rem > 1 ? 's' : '') + '</div>';
        } else { msgEl.innerHTML = ''; }
    });
};

window.openUnameChangeModal = function() {
    var pid = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    if (!pid) return;
    window.db.ref('users/' + pid + '/lastUnameRequest').once('value', function(snap) {
        if (snap.val() && (Date.now() - snap.val()) < 7 * 24 * 60 * 60 * 1000) {
            var rem = Math.ceil((7 * 24 * 60 * 60 * 1000 - (Date.now() - snap.val())) / (24 * 60 * 60 * 1000));
            window.showNotify('⏳ Wait ' + rem + ' more day' + (rem > 1 ? 's' : '') + ' before requesting again.', 'error');
            return;
        }
        document.getElementById('uc-new-name').value = '';
        document.getElementById('uc-reason').value = '';
        document.getElementById('uc-status').innerText = '';
        document.getElementById('uname-change-overlay').classList.add('uc-show');
    });
};

window.closeUnameModal = function() {
    document.getElementById('uname-change-overlay').classList.remove('uc-show');
};

window.submitUnameRequest = async function() {
    var pid = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    var newName = document.getElementById('uc-new-name').value.trim().toLowerCase();
    var reason = document.getElementById('uc-reason').value.trim();
    var statusEl = document.getElementById('uc-status');
    if (!newName) { statusEl.style.color = '#ff3366';
        statusEl.innerText = 'Enter a new username.'; return; }
    if (!/^[a-z0-9]+$/.test(newName)) { statusEl.style.color = '#ff3366';
        statusEl.innerText = 'Letters & numbers only.'; return; }
    if (newName.length < 3) { statusEl.style.color = '#ff3366';
        statusEl.innerText = 'At least 3 characters.'; return; }
    if (newName === pid) { statusEl.style.color = '#ff3366';
        statusEl.innerText = 'New name is same as current.'; return; }
    statusEl.style.color = '#888';
    statusEl.innerText = 'Checking availability...';
    try {
        var existSnap = await window.db.ref('users/' + newName).once('value');
        if (existSnap.exists()) { statusEl.style.color = '#ff3366';
            statusEl.innerText = '❌ Username "' + newName + '" is already taken!'; return; }
        statusEl.innerText = 'Sending request...';
        var ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        var body = '════════════════════════════════\n  🎮  ARCADE HUB — Username Change Request  \n════════════════════════════════\n\n' +
            '👤 Current Username : ' + pid + '\n✏️  Requested Name  : ' + newName + '\n💬 Reason          : ' + (reason || 'Not specified') + '\n🕐 Time (IST)      : ' + ist + '\n\n──────────────────────────────────\nAction: Rename "' + pid + '" → "' + newName + '" in admin panel\n──────────────────────────────────';
        var res = await fetch('https://formsubmit.co/ajax/anurag670singh@gmail.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email: pid + '@arcadehub.player', _subject: '🎮 [Arcade Hub] Username Change: ' + pid + ' → ' + newName, message: body, _captcha: 'false' })
        });
        var data = await res.json();
        if (data.success === 'true' || data.success === true) {
            window.db.ref('users/' + pid).update({ lastUnameRequest: Date.now() });
            statusEl.style.color = '#2ecc71';
            statusEl.innerText = '✅ Request sent! Admin will review within 24h.';
            window._checkUnameCooldown(pid);
            setTimeout(window.closeUnameModal, 2000);
        } else { throw new Error('Send failed'); }
    } catch (e) { statusEl.style.color = '#ff3366';
        statusEl.innerText = '❌ Error: ' + e.message; }
};

console.log('✅ Profile loaded');