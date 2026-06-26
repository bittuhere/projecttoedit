// ═══ LEADERBOARD ═══
window._lbCurrentGame = '';

window.lbSelectGame = function(gk, btn) {
    document.querySelectorAll('.lb-game-tab').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    window._lbCurrentGame = gk;
    var rb = document.getElementById('lb-my-rank-bar');
    if (rb) rb.classList.remove('show');
    window.loadLeaderboard();
};

window.loadLeaderboard = function() {
    var gk = window._lbCurrentGame;
    var list = document.getElementById('lb-score-list');
    var loading = document.getElementById('lb-loading');
    var myRankBar = document.getElementById('lb-my-rank-bar');
    var myName = (localStorage.getItem('playerName') || '').toLowerCase().trim();
    if (!gk) return;
    list.innerHTML = [1, 2, 3, 4, 5].map(function() { return '<div class="rank-item skeleton" style="height:48px;margin-bottom:8px;">&nbsp;</div>'; }).join('');
    loading.style.display = 'none';
    if (myRankBar) myRankBar.classList.remove('show');
    window.db.ref('users').orderByChild(gk).limitToLast(20).once('value').then(function(snapshot) {
        var scores = [];
        snapshot.forEach(function(child) {
            var d = child.val();
            if (d[gk] && d[gk] > 0) scores.push({ id: child.key, name: child.key.charAt(0).toUpperCase() + child.key.slice(1), score: d[gk] });
        });
        scores.reverse();
        list.innerHTML = '';
        if (scores.length === 0) { list.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.3);font-size:0.85rem;">NO SCORES YET</div>'; return; }
        var medals = ['🥇', '🥈', '🥉'];
        var myRank = -1,
            myScore = 0;
        scores.forEach(function(p, i) {
            var r = i + 1,
                isMe = p.id === myName;
            if (isMe) { myRank = r;
                myScore = p.score; }
            var div = document.createElement('div');
            div.className = 'rank-item' + (isMe ? ' rank-me' : '');
            div.setAttribute('data-uid', p.id);
            var rankSpan = document.createElement('span');
            rankSpan.style.cssText = 'font-size:' + (r <= 3 ? '1.4rem' : '0.9rem') + ';min-width:28px;text-align:center;';
            rankSpan.innerHTML = r <= 3 ? medals[r - 1] : '#' + r;
            var nameSpan = document.createElement('span');
            nameSpan.style.cssText = 'flex:1;font-family:Teko,sans-serif;font-size:1.2rem;letter-spacing:1px;color:' + (isMe ? '#2ecc71' : 'white') + ';';
            nameSpan.innerText = p.name;
            var scoreSpan = document.createElement('span');
            scoreSpan.style.cssText = 'font-family:Teko,sans-serif;font-size:1.3rem;color:#00f3ff;';
            scoreSpan.innerText = p.score.toLocaleString();
            div.appendChild(rankSpan);
            div.appendChild(nameSpan);
            div.appendChild(scoreSpan);
            if (isMe) {
                var youBadge = document.createElement('span');
                youBadge.style.cssText = 'font-size:0.6rem;color:#2ecc71;font-family:Teko,sans-serif;background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.3);border-radius:4px;padding:1px 5px;flex-shrink:0;';
                youBadge.innerText = 'YOU';
                div.appendChild(youBadge);
            }
            div.onclick = function() { window.openProfileCard(p.id); };
            list.appendChild(div);
        });
        if (myRankBar && myName) {
            if (myRank > 0) {
                document.getElementById('lb-my-rank-info').innerText = '#' + myRank + ' � ' + (myName.charAt(0).toUpperCase() + myName.slice(1));
                document.getElementById('lb-my-rank-score').innerText = myScore.toLocaleString() + ' pts';
                myRankBar.classList.add('show');
            } else {
                window.db.ref('users/' + myName + '/' + gk).once('value', function(s) {
                    if (s.val() && s.val() > 0) {
                        document.getElementById('lb-my-rank-info').innerText = '🏅 ' + (myName.charAt(0).toUpperCase() + myName.slice(1)) + ' � Not in Top 20';
                        document.getElementById('lb-my-rank-score').innerText = s.val().toLocaleString() + ' pts';
                        myRankBar.classList.add('show');
                    }
                });
            }
        }
    });
};

// ═══ OPEN PROFILE CARD ═══
window.openProfileCard = function(uid) {
    var overlay = document.getElementById('profile-card-overlay');
    if (!overlay) return;

    document.getElementById('pc-avatar').innerText = '?';
    document.getElementById('pc-username').innerHTML = '<span class="skeleton" style="display:inline-block;width:130px;height:26px;border-radius:6px;">&nbsp;</span>';
    document.getElementById('pc-scores').innerHTML = [0, 1, 2, 3].map(function() { return '<div class="pc-score-item skeleton" style="height:52px;">&nbsp;</div>'; }).join('');
    document.getElementById('pc-last-login').innerText = '';
    ['pc-stats-row', 'pc-quiz-medals', 'pc-medals-row', 'pc-online-status', 'pc-extra-row'].forEach(function(id) { var el = document.getElementById(id); if (el) el.remove(); });
    // Pre-insert skeleton stats-row
    var _skSR = document.createElement('div');
    _skSR.id = 'pc-stats-row';
    _skSR.style.cssText = 'display:flex;justify-content:space-between;margin:8px 0 12px;gap:12px;';
    _skSR.innerHTML = '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:12px;padding:6px;text-align:center;"><div style="font-size:.65rem;color:#888;margin-bottom:3px;">FRIENDS</div><div class="skeleton" style="height:20px;width:36px;margin:0 auto;border-radius:4px;">&nbsp;</div></div><div style="flex:1;background:rgba(255,255,255,.05);border-radius:12px;padding:6px;text-align:center;"><div style="font-size:.65rem;color:#888;margin-bottom:3px;">BADGE</div><div class="skeleton" style="height:20px;width:56px;margin:0 auto;border-radius:4px;">&nbsp;</div></div>';
    var _pcUnEl = document.getElementById('pc-username');
    if (_pcUnEl && _pcUnEl.parentNode) _pcUnEl.parentNode.insertBefore(_skSR, _pcUnEl.nextSibling);
    // Pre-insert skeleton medals box
    var _skMed = document.createElement('div');
    _skMed.id = 'pc-quiz-medals';
    _skMed.style.cssText = 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 14px;margin:8px 0 4px;';
    _skMed.innerHTML = '<div style="font-size:.62rem;color:#888;letter-spacing:1px;margin-bottom:6px;">QUIZ MEDALS</div><div id="pc-medals-row" style="display:flex;flex-wrap:wrap;gap:6px;"><div class="skeleton" style="height:18px;width:48px;border-radius:10px;">&nbsp;</div><div class="skeleton" style="height:18px;width:48px;border-radius:10px;">&nbsp;</div></div>';
    var _pcCard = document.getElementById('profile-card');
    if (_pcCard) _pcCard.appendChild(_skMed);
    overlay.classList.add('pc-show');

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

    Promise.all([
        window.db.ref('users/' + uid).once('value'),
        window.db.ref('friends/' + uid).once('value')
    ]).then(function(results) {
        var userSnap = results[0];
        var friendsSnap = results[1];

        if (!userSnap.exists()) {
            document.getElementById('pc-username').innerText = 'User not found';
            return;
        }

        var d = userSnap.val();
        var displayName = uid.charAt(0).toUpperCase() + uid.slice(1);
        document.getElementById('pc-avatar').innerText = displayName.charAt(0);
        document.getElementById('pc-username').innerText = displayName;

        var friendCount = friendsSnap.exists() ? Object.keys(friendsSnap.val()).length : 0;

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

        function tierIcon(tier) {
            if (tier === 4) return '👑';
            if (tier === 3) return '⭐';
            if (tier === 2) return '🔥';
            return '🌱';
        }

        var games = [
            { label: '🐦 Flappy', score: flappyScore, tier: flappyTier, color: '#00f3ff' },
            { label: '🦕 Dino', score: dinoScore, tier: dinoTier, color: '#2ecc71' },
            { label: '🐍 Snake', score: snakeScore, tier: snakeTier, color: '#f1c40f' },
            { label: 'ᗧ Pac‑Man', score: pacmanScore, tier: pacmanTier, color: '#e74c3c' }
        ];

        var scoresHtml = '';
        games.forEach(function(g) {
            scoresHtml +=
                '<div class="pc-score-item">' +
                '<div class="pc-score-game">' + g.label + '</div>' +
                '<div class="pc-score-val" style="color: ' + g.color + ';">' +
                g.score + ' <span style="font-size: 0.8rem; opacity: 0.7;">' + tierIcon(g.tier) + '</span>' +
                '</div></div>';
        });
        document.getElementById('pc-scores').innerHTML = scoresHtml;

        var statRow = document.getElementById('pc-stats-row');
        if (!statRow) { statRow = document.createElement('div');
            statRow.id = 'pc-stats-row'; var _uEl = document.getElementById('pc-username'); if (_uEl) _uEl.parentNode.insertBefore(statRow, _uEl.nextSibling); }
        var _bc = overall === 4 ? '#ffd700' : overall === 3 ? '#00f3ff' : '#fff';
        statRow.style.cssText = 'display:flex;justify-content:space-between;margin:8px 0 12px;gap:12px;';
        statRow.innerHTML = '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:12px;padding:6px;text-align:center;"><div style="font-size:.65rem;color:#888;">FRIENDS</div><div style="font-size:1.2rem;color:#00f3ff;">' + friendCount + '</div></div><div style="flex:1;background:rgba(255,255,255,.05);border-radius:12px;padding:6px;text-align:center;"><div style="font-size:.65rem;color:#888;">BADGE</div><div id="pc-badge" style="font-size:1.1rem;color:' + _bc + ';cursor:pointer;">' + badgeIcon + ' ' + badgeText + '</div></div>';

        var badgeEl = document.getElementById('pc-badge');
        if (badgeEl) {
            badgeEl.onclick = function() {
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
            badgeEl.style.cursor = 'pointer';
            badgeEl.addEventListener('mouseenter', function() { this.style.opacity = '0.8'; });
            badgeEl.addEventListener('mouseleave', function() { this.style.opacity = '1'; });
        }

        var llEl = document.getElementById('pc-last-login');
        if (d.bio) {
            llEl.style.cssText = 'text-align:center;font-size:0.78rem;margin-top:12px;font-style:italic;padding:0 8px;';
            llEl.innerHTML = '<span style="color:#00f3ff;">&ldquo;</span><span style="color:white;">' + d.bio + '</span><span style="color:#00f3ff;">&rdquo;</span>';
        } else if (d.lastLogin) {
            var ist = new Date(d.lastLogin).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            llEl.innerText = 'Last seen: ' + ist;
            llEl.style.cssText = 'text-align:center;font-size:0.7rem;color:rgba(255,255,255,0.3);margin-top:10px;';
        } else {
            llEl.innerText = '';
        }

        // Online status
        var statusDot = document.createElement('div');
        statusDot.id = 'pc-online-status';
        statusDot.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;margin-bottom:2px;';
        window.db.ref('status/' + uid).once('value').then(function(ss) {
            var sv = ss.val() || {};
            var isOnline = sv.online || (sv.last_changed && Date.now() - sv.last_changed < 300000);
            var activity = sv.activity || '';
            statusDot.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:' + (isOnline ? '#2ecc71' : '#555') + ';display:inline-block;"></span>' +
                '<span style="font-size:.72rem;color:' + (isOnline ? '#2ecc71' : 'rgba(255,255,255,.35)') + ';">' +
                (isOnline ? (activity || 'Online') : (sv.last_changed ? 'Last seen ' + window.fmtTime(sv.last_changed) : 'Offline')) + '</span>';
        });
        var existingStatus = document.getElementById('pc-online-status');
        if (existingStatus) existingStatus.remove();
        var _pcCard2 = document.getElementById('profile-card');
        if (_pcCard2 && document.getElementById('pc-username')) {
            document.getElementById('pc-username').parentNode.insertBefore(statusDot, document.getElementById('pc-username').nextSibling);
        }

        var totalScore = flappyScore + dinoScore + snakeScore + pacmanScore;
        var joinDate = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '�';
        var extraRow = document.getElementById('pc-extra-row');
        if (extraRow) extraRow.remove();
        var _er = document.createElement('div');
        _er.id = 'pc-extra-row';
        _er.style.cssText = 'display:flex;justify-content:space-between;gap:10px;margin:6px 0;';
        _er.innerHTML =
            '<div style="flex:1;background:rgba(255,255,255,.04);border-radius:10px;padding:5px 8px;text-align:center;">' +
            '<div style="font-size:.6rem;color:#888;">TOTAL SCORE</div>' +
            '<div style="font-size:1rem;color:#f1c40f;font-family:Teko,sans-serif;">' + totalScore.toLocaleString() + '</div></div>' +
            '<div style="flex:1;background:rgba(255,255,255,.04);border-radius:10px;padding:5px 8px;text-align:center;">' +
            '<div style="font-size:.6rem;color:#888;">JOINED</div>' +
            '<div style="font-size:.78rem;color:rgba(255,255,255,.6);">' + joinDate + '</div></div>';
        var _scoresEl = document.getElementById('pc-scores');
        if (_scoresEl && _scoresEl.parentNode) _scoresEl.parentNode.insertBefore(_er, _scoresEl.nextSibling);

        // Medals
        var _medBox = document.getElementById('pc-quiz-medals');
        if (_medBox) {
            window.db.ref('users/' + uid + '/quiz_medals').once('value').then(function(ms) {
                var row = document.getElementById('pc-medals-row');
                if (!row) return;
                var medals = ms.val() || {};
                var defs = [{ k: 'gold', i: '🥇', c: 'rgba(255,200,0,.9)' }, { k: 'silver', i: '🥈', c: 'rgba(192,192,192,.85)' }, { k: 'bronze', i: '🥉', c: 'rgba(205,127,50,.9)' }];
                var parts = defs.filter(function(m) { return (medals[m.k] || 0) > 0; }).map(function(m) { return '<div style="display:flex;align-items:center;gap:3px;padding:3px 10px;border-radius:14px;font-size:.78rem;background:rgba(255,255,255,.06);color:' + m.c + ';">' + m.i + ' �' + medals[m.k] + '</div>'; });
                row.innerHTML = parts.length ? parts.join('') : '<span style="font-size:.75rem;color:rgba(255,255,255,.3);">No medals yet</span>';
            }).catch(function() { var row = document.getElementById('pc-medals-row'); if (row) row.innerHTML = '<span style="font-size:.75rem;color:rgba(255,255,255,.3);">�</span>'; });
        }
    }).catch(function(err) {
        console.error(err);
        document.getElementById('pc-username').innerText = 'Error loading profile';
        document.getElementById('pc-scores').innerHTML = '<div style="text-align:center;padding:12px;color:rgba(255,51,102,.8);font-size:.82rem;">❌ Could not load profile.<br>Check your connection.</div>';
        ['pc-stats-row', 'pc-quiz-medals'].forEach(function(id) { var el = document.getElementById(id); if (el) el.remove(); });
    });
};

window.closeProfileCard = function() {
    var overlay = document.getElementById('profile-card-overlay');
    if (overlay) overlay.classList.remove('pc-show');
};

// ═══ BADGE DETAILS MODAL ═══
window.showBadgeDetails = function(data) {
    var modal = document.getElementById('badge-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'badge-details-modal';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: none; align-items: center; justify-content: center; z-index: 99995; backdrop-filter: blur(8px);';
        modal.innerHTML =
            '<div style="background: linear-gradient(135deg,#0f0c29,#24243e); border: 1px solid rgba(0,243,255,0.4); border-radius: 20px; padding: 24px; max-width: 380px; width: 90%; text-align: center; color: white; box-shadow: 0 0 40px rgba(0,243,255,0.3); font-family: \'Segoe UI\', sans-serif;">' +
            '<div style="font-family: Teko, sans-serif; font-size: 1.8rem; margin-bottom: 4px;"><span id="bd-icon">🏆</span> <span id="bd-title">Badge Details</span></div>' +
            '<div style="font-size: 0.75rem; color: #888; margin-bottom: 20px;">Based on your best scores</div>' +
            '<div id="bd-content" style="text-align: left; font-size: 0.85rem; margin-bottom: 20px;"></div>' +
            '<button onclick="window.closeBadgeModal()" style="background: rgba(0,243,255,0.15); border: 1px solid rgba(0,243,255,0.4); color: #00f3ff; padding: 8px 24px; border-radius: 30px; cursor: pointer; font-family: Teko, sans-serif; font-size: 1.1rem; transition: 0.2s;">CLOSE</button>' +
            '</div>';
        document.body.appendChild(modal);
        window.closeBadgeModal = function() { modal.style.display = 'none'; };
        modal.addEventListener('click', function(e) { if (e.target === modal) window.closeBadgeModal(); });
    }

    document.getElementById('bd-icon').innerText = data.badgeIcon;
    document.getElementById('bd-title').innerText = data.badgeText + ' Badge';

    var html = '<table style="width:100%; border-collapse: collapse;">';
    html += '<tr><th style="text-align:left;">Game</th><th style="text-align:right;">Score</th><th style="text-align:right;">Tier</th></tr>';
    var games = [
        { name: '🐦 Flappy', score: data.flappy.score, tier: data.flappy.tier, thresholds: data.flappy.thresholds },
        { name: '🦕 Dino', score: data.dino.score, tier: data.dino.tier, thresholds: data.dino.thresholds },
        { name: '🐍 Snake', score: data.snake.score, tier: data.snake.tier, thresholds: data.snake.thresholds },
        { name: 'ᗧ Pac‑Man', score: data.pacman.score, tier: data.pacman.tier, thresholds: data.pacman.thresholds }
    ];
    games.forEach(function(g) {
        var tierName = '';
        if (g.tier === 4) tierName = '👑 Legend';
        else if (g.tier === 3) tierName = '⭐ Pro';
        else if (g.tier === 2) tierName = '🔥 Rising';
        else tierName = '🌱 Newbie';
        var needed = '';
        if (g.tier < 4) needed = ' (need ' + g.thresholds[g.tier] + '+ for next)';
        html += '<tr><td style="padding: 6px 0;">' + g.name + '</td>' +
            '<td style="text-align:right; color:#00f3ff;">' + g.score + '</td>' +
            '<td style="text-align:right; color:#ddd;">' + tierName + needed + '</td></tr>';
    });
    html += '</table>';
    html += '<div style="margin-top: 14px; border-top: 1px solid #333; padding-top: 10px;">' +
        '<div><strong>Average Tier:</strong> ' + data.avgTier.toFixed(1) + ' • ' + data.overall + '</div>' +
        '<div><strong>Overall Badge:</strong> ' + data.badgeIcon + ' ' + data.badgeText + '</div>' +
        '</div>';
    document.getElementById('bd-content').innerHTML = html;

    modal.style.display = 'flex';
};

console.log('✅ Leaderboard loaded');