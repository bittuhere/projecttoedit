// ─── QUIZ SYSTEM ─────────────────────────────────────────────
// Weekly MCQ quiz with anti-cheat, leaderboard, and medals.

(function() {
    'use strict';

    // ── CONFIG ─────────────────────────────────────────────────────────
    var QUIZ_JSON_URL = 'https://raw.githubusercontent.com/bittuhere/bittuhere.github.io/refs/heads/main/quiz_questions.json';
    var QUIZ_PER_WEEK = 20;
    var TIME_PER_Q   = 60;
    var BAN_BASE_MS  = 2 * 60 * 60 * 1000;   // 2 hrs
    var BAN_EXTRA_MS = 60 * 1000;            // +1 min per extra ban
    var ABSENT_GRACE = 60 * 1000;             // 60s grace — no ban if back within this
    var LETTERS      = ['A', 'B', 'C', 'D'];

    // ── STATE ──────────────────────────────────────────────────────────
    var _allQ       = [];
    var _weekNum    = 0;
    var _weekKey    = '';
    var _qList      = [];
    var _qIdx       = 0;
    var _qCorrect   = 0;
    var _qAnswered  = false;
    var _qTimerInt  = null;
    var _qTimeLeft  = TIME_PER_Q;
    var _qQStart    = 0;
    var _qTotalTime = 0;
    var _qRunning   = false;
    var _qCheatCount= 0;
    var _qBannedUntil = 0;
    var _qCheatActive = false;
    var _qAbsentSince = 0;
    var _qAbsentTimer = null;
    var _rulesCountdown = null;
    var _awardedWeeks = new Set();
    var _qzResetInt = null;

    // ── SEEDED RNG ────────────────────────────────────────────────────
    function _rng(seed) {
        return function() {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function _shuffle(arr, seed) {
        var a = arr.slice(),
            r = _rng(seed);
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(r() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    // ── WEEK ───────────────────────────────────────────────────────────
    function _calcWeek() {
        return Math.floor((Date.now() - new Date(2024, 0, 1)) / (7 * 864e5));
    }

    // ── LOAD QUESTIONS ────────────────────────────────────────────────
    function _loadQuestions(cb) {
        if (_allQ && _allQ.length > 10) { cb(_allQ); return; }
        var cacheKey = 'quiz_q_w' + _weekNum;
        try {
            var c = sessionStorage.getItem(cacheKey);
            if (c) {
                var p = JSON.parse(c);
                if (p && p.length > 10) { _allQ = p;
                    cb(_allQ); return; }
            }
        } catch (e) {}
        var url = QUIZ_JSON_URL + '?w=' + _weekNum;

        function doFetch(attempt) {
            fetch(url, { cache: attempt === 0 ? 'default' : 'no-cache' })
                .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(function(d) {
                    var qs = (d && Array.isArray(d.questions)) ? d.questions : [];
                    if (qs.length === 0 && attempt < 3) { setTimeout(function() { doFetch(attempt + 1); }, 700 * (attempt + 1)); return; }
                    _allQ = qs;
                    if (_allQ.length > 0) { try { sessionStorage.setItem(cacheKey, JSON.stringify(_allQ)); } catch (e) {} }
                    cb(_allQ);
                })
                .catch(function(err) {
                    if (attempt < 3) { setTimeout(function() { doFetch(attempt + 1); }, 1000 * (attempt + 1)); } else { cb([]); }
                });
        }
        doFetch(0);
    }

    // ── BUILD WEEK QUESTIONS ──────────────────────────────────────────
    function _buildWeekQuestions(all, weekN) {
        var base = _shuffle(all, weekN * 31337);
        var picked = base.slice(0, QUIZ_PER_WEEK);
        picked = _shuffle(picked, weekN * 99991);

        return picked.map(function(q) {
            var optSeed = weekN * 7 + q.id.charCodeAt(0) * 13;
            var indices = _shuffle([0, 1, 2, 3], optSeed);
            var newOpts = indices.map(function(i) { return q.o[i]; });
            var newAns = indices.indexOf(q.a);
            return Object.assign({}, q, { o: newOpts, a: newAns });
        });
    }

    // ── BAN ────────────────────────────────────────────────────────────
    function _checkBan(cb) {
        var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        if (!pn) { cb(false); return; }
        window.db.ref('users/' + pn + '/quiz_ban').once('value').then(function(s) {
            var b = s.val() || {};
            _qCheatCount = b.count || 0;
            _qBannedUntil = b.until || 0;
            cb(Date.now() < _qBannedUntil);
        }).catch(function() { cb(false); });
    }

    function _applyBan() {
        var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        if (!pn) return;
        _qCheatCount++;
        _qBannedUntil = Date.now() + BAN_BASE_MS + (_qCheatCount - 1) * BAN_EXTRA_MS;
        window.db.ref('users/' + pn + '/quiz_ban').set({ until: _qBannedUntil, count: _qCheatCount });
    }

    function _fmtBan(ms) {
        if (ms <= 0) return '00:00';
        var s = Math.ceil(ms / 1000),
            h = Math.floor(s / 3600);
        s %= 3600;
        var m = Math.floor(s / 60);
        s %= 60;
        return h > 0 ? h + 'h ' + m + 'm ' + s + 's' : ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
    }

    function _fmtMs(ms) {
        var s = Math.floor(ms / 1000),
            m = Math.floor(s / 60);
        s %= 60;
        return (m > 0 ? m + 'm ' : '') + s + 's';
    }

    // ── ANTI-CHEAT ────────────────────────────────────────────────────
    var _vis = null,
        _blr = null,
        _pha = null;

    function _attachCheat() {
        _vis = function() {
            if (!_qRunning) return;
            if (document.hidden) {
                _qAbsentSince = Date.now();
                _qAbsentTimer = setTimeout(function() {
                    if (_qRunning && document.hidden) _triggerCheat();
                }, ABSENT_GRACE);
            } else {
                if (_qAbsentTimer) { clearTimeout(_qAbsentTimer);
                    _qAbsentTimer = null; }
                _qAbsentSince = 0;
            }
        };
        _blr = function() {
            if (!_qRunning) return;
            _qAbsentSince = Date.now();
            _qAbsentTimer = setTimeout(function() {
                if (_qRunning) _triggerCheat();
            }, ABSENT_GRACE);
        };
        _pha = function() {
            if (!_qRunning) return;
            _qAbsentSince = Date.now();
            _qAbsentTimer = setTimeout(function() {
                if (_qRunning) _triggerCheat();
            }, ABSENT_GRACE);
        };
        document.addEventListener('visibilitychange', _vis);
        window.addEventListener('blur', _blr);
        window.addEventListener('pagehide', _pha);
        // DevTools detection
        window.addEventListener('keydown', _devToolsBlock, true);
        document.addEventListener('contextmenu', _rcBlock, true);
    }

    function _detachCheat() {
        if (_vis) document.removeEventListener('visibilitychange', _vis);
        if (_blr) window.removeEventListener('blur', _blr);
        if (_pha) window.removeEventListener('pagehide', _pha);
        window.removeEventListener('keydown', _devToolsBlock, true);
        document.removeEventListener('contextmenu', _rcBlock, true);
        if (_qAbsentTimer) { clearTimeout(_qAbsentTimer);
            _qAbsentTimer = null; }
    }

    function _devToolsBlock(e) {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
            (e.ctrlKey && e.key.toUpperCase() === 'U')) {
            e.preventDefault();
            e.stopPropagation();
            if (_qRunning) _triggerCheat();
            return false;
        }
    }

    function _rcBlock(e) {
        if (_qRunning) { e.preventDefault(); return false; }
    }

    function _triggerCheat() {
        if (!_qRunning || _qCheatActive) return;
        _qRunning = false;
        _qCheatActive = true;
        _stopTimer();
        _detachCheat();
        _applyBan();
        var ov = document.getElementById('quiz-cheat-overlay');
        var info = document.getElementById('qco-ban-info');
        var sub = document.getElementById('qco-sub');
        if (sub) sub.innerText = 'You left the quiz tab/window. Quiz cancelled.';
        if (info) info.innerText = '⏳ Ban: ' + _fmtBan(BAN_BASE_MS + (_qCheatCount - 1) * BAN_EXTRA_MS) + ' (Ban #' + _qCheatCount + ')';
        if (ov) ov.classList.add('show');
        var btn = document.getElementById('qco-btn');
        var sec = document.getElementById('qco-sec');
        var cnt = 3;
        if (btn) btn.disabled = true;
        var t = setInterval(function() {
            cnt--;
            if (sec) sec.innerText = cnt;
            if (cnt <= 0) {
                clearInterval(t);
                if (btn) { btn.disabled = false;
                    btn.innerText = 'OK, I UNDERSTAND'; }
            }
        }, 1000);
    }

    window.quizDismissCheat = function() {
        _qCheatActive = false;
        var ov = document.getElementById('quiz-cheat-overlay');
        if (ov) ov.classList.remove('show');
        window.quizShowLobby();
    };

    // ── RULES MODAL ───────────────────────────────────────────────────
    window.quizCloseModal = function() {
        var modal = document.getElementById('quiz-rules-modal');
        if (modal) modal.classList.remove('show');
        if (_rulesCountdown) { clearInterval(_rulesCountdown);
            _rulesCountdown = null; }
    };

    window.quizOpenRulesModal = function() {
        _checkBan(function(banned) {
            if (banned) {
                window.MapsTo('section-quiz', 'right');
                setTimeout(function() { window.initQuizSection && window.initQuizSection(); }, 380);
                return;
            }
            var modal = document.getElementById('quiz-rules-modal');
            var btn = document.getElementById('qrm-ok-btn');
            var cdEl = document.getElementById('qrm-countdown');
            if (!modal) return;
            if (_rulesCountdown) { clearInterval(_rulesCountdown);
                _rulesCountdown = null; }
            if (btn) btn.disabled = true;
            if (cdEl) cdEl.innerHTML = 'Please read the rules... <span id="qrm-sec">5</span>s';
            modal.classList.add('show');
            var sec = 5;
            _rulesCountdown = setInterval(function() {
                sec--;
                var s = document.getElementById('qrm-sec');
                if (s) s.innerText = sec;
                if (sec <= 0) {
                    clearInterval(_rulesCountdown);
                    _rulesCountdown = null;
                    if (btn) btn.disabled = false;
                    if (cdEl) cdEl.innerText = '✅ You may now proceed';
                }
            }, 1000);
        });
    };

    window.quizStartFromModal = function() {
        var modal = document.getElementById('quiz-rules-modal');
        if (modal) modal.classList.remove('show');
        if (typeof window.currentSection !== 'undefined' && window.currentSection !== 'section-quiz') {
            window.MapsTo('section-quiz', 'right');
            setTimeout(function() {
                window.initQuizSection && window.initQuizSection(true);
            }, 380);
        } else {
            window.initQuizSection && window.initQuizSection(true);
        }
    };

    // ── TIMER ─────────────────────────────────────────────────────────
    function _startTimer() {
        _qTimeLeft = TIME_PER_Q;
        _qQStart = Date.now();
        _updTimer();
        _qTimerInt = setInterval(function() {
            _qTimeLeft--;
            _updTimer();
            if (_qTimeLeft <= 0) { _stopTimer();
                _autoSkip(); }
        }, 1000);
    }

    function _stopTimer() {
        if (_qTimerInt) { clearInterval(_qTimerInt);
            _qTimerInt = null; }
    }

    function _updTimer() {
        var n = document.getElementById('quiz-timer-num');
        var c = document.getElementById('quiz-timer-circle');
        if (n) n.innerText = _qTimeLeft;
        var pct = _qTimeLeft / TIME_PER_Q;
        if (c) {
            c.style.strokeDashoffset = 138.2 * (1 - pct);
            c.style.stroke = _qTimeLeft > 20 ? '#00f3ff' : _qTimeLeft > 10 ? '#f39c12' : '#e74c3c';
        }
        if (n) n.style.color = _qTimeLeft > 10 ? 'white' : '#e74c3c';
    }

    function _autoSkip() {
        var q = _qList[_qIdx];
        _revealAnswer(-1, q.a);
        var nb = document.getElementById('quiz-next-btn');
        if (nb) nb.style.display = 'block';
        _qAnswered = true;
    }

    // ── RENDER QUESTION ──────────────────────────────────────────────
    function _renderQ() {
        var q = _qList[_qIdx];
        _qAnswered = false;
        document.getElementById('quiz-prog-fill').style.width = ((_qIdx / QUIZ_PER_WEEK) * 100) + '%';
        document.getElementById('quiz-q-counter').innerText = (_qIdx + 1) + '/' + QUIZ_PER_WEEK;
        var tag = document.getElementById('quiz-subject-tag');
        if (tag) {
            tag.innerText = (q.s || 'Science').toUpperCase();
            var isM = q.s === 'Maths';
            tag.style.background = isM ? 'rgba(0,102,255,.2)' : 'rgba(46,204,113,.15)';
            tag.style.borderColor = isM ? 'rgba(0,102,255,.4)' : 'rgba(46,204,113,.3)';
            tag.style.color = isM ? '#00f3ff' : '#2ecc71';
        }
        document.getElementById('quiz-q-text').innerText = q.q;
        var optsEl = document.getElementById('quiz-opts');
        optsEl.innerHTML = '';
        q.o.forEach(function(opt, i) {
            var btn = document.createElement('div');
            btn.className = 'quiz-opt';
            btn.innerHTML = '<span class="quiz-opt-letter">' + LETTERS[i] + '</span><span>' + opt + '</span>';
            btn.onclick = function() { if (!_qAnswered) _selectAns(i); };
            optsEl.appendChild(btn);
        });
        document.getElementById('quiz-next-btn').style.display = 'none';
        _startTimer();
    }

    function _selectAns(idx) {
        if (_qAnswered) return;
        _qAnswered = true;
        _stopTimer();
        var elapsed = Date.now() - _qQStart;
        var q = _qList[_qIdx];
        if (idx === q.a) { _qCorrect++;
            _qTotalTime += elapsed; }
        _revealAnswer(idx, q.a);
        document.getElementById('quiz-next-btn').style.display = 'block';
    }

    function _revealAnswer(selected, correct) {
        document.querySelectorAll('.quiz-opt').forEach(function(btn, i) {
            btn.onclick = null;
            btn.setAttribute('data-locked', '1');
            if (i === correct) {
                btn.classList.add(selected === i ? 'correct' : 'reveal-correct');
            } else if (i === selected) {
                btn.classList.add('wrong');
            }
        });
    }

    // ── NEXT / FINISH ────────────────────────────────────────────────
    window.quizNext = function() {
        _qIdx++;
        if (_qIdx >= _qList.length) { _finishQuiz(); } else { _renderQ(); }
    };

    function _finishQuiz() {
        _stopTimer();
        _qRunning = false;
        _detachCheat();
        var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        try { window._setUserStatus('online'); } catch (e) {}
        document.getElementById('quiz-game').style.display = 'none';
        var res = document.getElementById('quiz-result');
        res.style.display = 'flex';
        res.style.flexDirection = 'column';
        var icons = ['📚', '😊', '🎉', '🏆'];
        document.getElementById('quiz-res-icon').innerText = icons[Math.min(3, Math.floor(_qCorrect / 6))];
        document.getElementById('quiz-res-score').innerText = _qCorrect + '/20';
        var avgMs = _qCorrect > 0 ? Math.round(_qTotalTime / _qCorrect) : 0;
        document.getElementById('quiz-res-time').innerText = _fmtMs(_qTotalTime);
        document.getElementById('quiz-res-avg').innerText = _fmtMs(avgMs);
        if (!pn) { document.getElementById('quiz-res-rank').innerText = '—'; return; }
        var entry = { score: _qCorrect, time: _qTotalTime, correct: _qCorrect, ts: Date.now() };
        window.db.ref('quiz/' + _weekKey + '/lb/' + pn).transaction(function(cur) {
            if (!cur) return entry;
            if (_qCorrect > cur.correct) return entry;
            if (_qCorrect === cur.correct && _qTotalTime < cur.time) return entry;
            return cur;
        }).then(function() {
            window.db.ref('users/' + pn + '/quiz_played/' + _weekKey).set(true);
            _loadLb('quiz-result-lb', function(rank) {
                document.getElementById('quiz-res-rank').innerText = rank > 0 ? '#' + rank : '—';
            });
        });
    }

    // ── MEDAL AWARD ──────────────────────────────────────────────────
    function _awardPrevWeek() {
        var prevKey = 'week_' + (_weekNum - 1);
        if (_awardedWeeks.has(prevKey)) return;
        _awardedWeeks.add(prevKey);
        window.db.ref('quiz/' + prevKey + '/awarded').transaction(function(current) {
            if (current === true) return; // abort
            return true;
        }, function(err, committed, snap) {
            if (err || !committed) {
                _awardedWeeks.delete(prevKey);
                return;
            }
            window.db.ref('quiz/' + prevKey + '/lb').once('value').then(function(snap) {
                var entries = _sortEntries(snap);
                if (!entries.length) return;
                var meds = ['gold', 'silver', 'bronze'];
                var awarded = new Set();
                var rank = 0;
                entries.forEach(function(e) {
                    if (rank >= 3 || awarded.has(e.id)) return;
                    awarded.add(e.id);
                    window.db.ref('users/' + e.id + '/quiz_medals/' + meds[rank]).transaction(function(v) { return (v || 0) + 1; });
                    rank++;
                });
            });
        });
    }

    // ── LEADERBOARD ──────────────────────────────────────────────────
    function _sortEntries(snap) {
        var entries = [];
        snap.forEach(function(c) { entries.push({ id: c.key, d: c.val() }); });
        entries.sort(function(a, b) {
            if (b.d.correct !== a.d.correct) return b.d.correct - a.d.correct;
            return a.d.time - b.d.time;
        });
        return entries;
    }

    function _loadLb(targetId, cb) {
        var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        var el = document.getElementById(targetId);
        if (!el) { if (cb) cb(0); return; }
        el.innerHTML = '<div style="text-align:center;padding:10px;color:rgba(255,255,255,.3);font-size:.8rem;">Loading...</div>';
        window.db.ref('quiz/' + _weekKey + '/lb').once('value').then(function(snap) {
            var entries = _sortEntries(snap);
            if (!entries.length) {
                el.innerHTML = '<div style="text-align:center;padding:14px;color:rgba(255,255,255,.3);font-size:.82rem;">No entries yet this week!</div>';
                if (cb) cb(0);
                return;
            }
            var meds = ['🥇', '🥈', '🥉'];
            var myRank = 0;
            el.innerHTML = '';
            entries.forEach(function(e, i) {
                var isMe = e.id === pn;
                if (isMe) myRank = i + 1;
                var row = document.createElement('div');
                row.className = 'quiz-lb-item' + (isMe ? ' lb-me' : '');
                row.innerHTML = '<span class="quiz-lb-rank">' + (i < 3 ? meds[i] : '#' + (i + 1)) + '</span>' +
                    '<span class="quiz-lb-name">' + e.id.charAt(0).toUpperCase() + e.id.slice(1) + (isMe ? ' <span style="color:#2ecc71;font-size:.65rem;">YOU</span>' : '') + '</span>' +
                    '<div><div class="quiz-lb-time">' + _fmtMs(e.d.time) + '</div><div style="font-size:.68rem;color:rgba(255,255,255,.4);">' + e.d.correct + '/20</div></div>';
                row.onclick = function() { window.openProfileCard && window.openProfileCard(e.id); };
                el.appendChild(row);
            });
            if (cb) cb(myRank);
        }).catch(function() { if (cb) cb(0); });
    }

    // ─── RESET COUNTDOWN ────────────────────────────────────────────
    function _updateReset() {
        var el = document.getElementById('quiz-reset-info');
        if (!el) return;
        var now = new Date(),
            day = now.getDay();
        var daysToMon = (8 - day) % 7 || 7;
        var nextMon = new Date(now);
        nextMon.setDate(now.getDate() + daysToMon);
        nextMon.setHours(0, 0, 0, 0);
        var diff = nextMon - now,
            h = Math.floor(diff / 3600000);
        diff %= 3600000;
        var m = Math.floor(diff / 60000);
        el.innerText = '🔄 Resets in ' + h + 'h ' + m + 'm (Monday midnight)';
    }

    // ── PUBLIC INIT ──────────────────────────────────────────────────
    window.initQuizSection = function(autoStart) {
        _weekNum = _calcWeek();
        _weekKey = 'week_' + _weekNum;
        var badge = document.getElementById('quiz-week-badge');
        if (badge) badge.innerText = '📅 Week ' + _weekNum;
        var wi = document.getElementById('quiz-week-info');
        if (wi) wi.innerText = 'WEEK ' + _weekNum;
        _updateReset();
        if (!_qzResetInt) {
            _qzResetInt = setInterval(_updateReset, 60000);
        }
        _awardPrevWeek();
        _checkBan(function(banned) {
            if (banned) { _showBanUI(); return; }
            var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
            if (pn) {
                window.db.ref('users/' + pn + '/quiz_played/' + _weekKey).once('value').then(function(s) {
                    var alreadyPlayed = !!s.val();
                    _showLobbyUI(alreadyPlayed);
                    if (autoStart && !alreadyPlayed) {
                        setTimeout(function() { _doStart(); }, 200);
                    }
                });
            } else {
                _showLobbyUI(false);
            }
        });
    };

    function _showBanUI() {
        var bc = document.getElementById('quiz-ban-card');
        var sb = document.getElementById('quiz-start-btn');
        if (bc) bc.style.display = 'block';
        if (sb) sb.disabled = true;
        var _bi = setInterval(function() {
            var rem = _qBannedUntil - Date.now();
            var et = document.getElementById('quiz-ban-timer');
            if (et) et.innerText = _fmtBan(rem);
            if (rem <= 0) {
                clearInterval(_bi);
                if (bc) bc.style.display = 'none';
                if (sb) sb.disabled = false;
            }
        }, 1000);
        var et = document.getElementById('quiz-ban-timer');
        if (et) et.innerText = _fmtBan(_qBannedUntil - Date.now());
    }

    function _showLobbyUI(alreadyPlayed) {
        _loadLb('quiz-lb-list', null);
        var apEl = document.getElementById('quiz-already-played');
        var sb = document.getElementById('quiz-start-btn');
        if (alreadyPlayed) {
            if (apEl) apEl.style.display = 'block';
        }
        var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        if (pn) {
            window.db.ref('quiz/' + _weekKey + '/lb/' + pn).once('value').then(function(s) {
                var d = s.val();
                if (d) {
                    var be = document.getElementById('quiz-lobby-best');
                    if (be) be.innerText = _fmtMs(d.time);
                }
            });
            window.db.ref('quiz/' + _weekKey + '/lb').once('value').then(function(snap) {
                var entries = _sortEntries(snap);
                var idx = entries.findIndex(function(e) { return e.id === pn; });
                var rkEl = document.getElementById('quiz-lobby-rank');
                if (rkEl) rkEl.innerText = idx >= 0 ? '#' + (idx + 1) : '—';
            });
        }
        var _lqSb = document.getElementById('quiz-start-btn');
        if (_lqSb && !_qList.length) { _lqSb.disabled = true;
            _lqSb.innerHTML = '⏳ Loading questions...'; }
        _loadQuestions(function(all) {
            if (_lqSb) { _lqSb.disabled = false;
                _lqSb.innerHTML = '🚀 START QUIZ'; }
            if (!all || !all.length) { if (_lqSb) _lqSb.innerHTML = '⚠️ Load failed — tap to retry'; return; }
            window.db.ref('quiz/' + _weekKey + '/ai_question').once('value').then(function(s) {
                _qList = _buildWeekQuestions(s.val() ? all.concat([s.val()]) : all, _weekNum);
            }).catch(function() { _qList = _buildWeekQuestions(all, _weekNum); });
        });
    }

    function _doStart() {
        _checkBan(function(banned) {
            if (banned) { _showBanUI(); return; }
            if (!_qList || _qList.length === 0) {
                var sb = document.getElementById('quiz-start-btn');
                if (sb) { sb.disabled = true;
                    sb.innerHTML = '⏳ Loading...'; }
                _loadQuestions(function(all) {
                    if (sb) { sb.disabled = false;
                        sb.innerHTML = '🚀 START QUIZ'; }
                    if (!all || all.length === 0) { try { window.showNotify('❌ Questions unavailable — check internet', 'error'); } catch (e) {} return; }
                    window.db.ref('quiz/' + _weekKey + '/ai_question').once('value').then(function(s) {
                        _qList = _buildWeekQuestions(s.val() ? all.concat([s.val()]) : all, _weekNum);
                        _doStart();
                    }).catch(function() { _qList = _buildWeekQuestions(all, _weekNum);
                        _doStart(); });
                });
                return;
            }
            try { window._setUserStatus('🧠 Taking Weekly Quiz'); } catch (e) {}
            _qIdx = 0;
            _qCorrect = 0;
            _qTotalTime = 0;
            _qAnswered = false;
            _qCheatActive = false;
            document.getElementById('quiz-lobby').style.display = 'none';
            document.getElementById('quiz-result').style.display = 'none';
            var g = document.getElementById('quiz-game');
            g.style.display = 'flex';
            g.style.flexDirection = 'column';
            _qRunning = true;
            _attachCheat();
            _renderQ();
        });
    }

    window.quizShowLobby = function() {
        _qRunning = false;
        _stopTimer();
        _detachCheat();
        try { window._setUserStatus('online'); } catch (e) {}
        document.getElementById('quiz-game').style.display = 'none';
        document.getElementById('quiz-result').style.display = 'none';
        var lb = document.getElementById('quiz-lobby');
        lb.style.display = 'flex';
        lb.style.flexDirection = 'column';
        _showLobbyUI(false);
    };

    // ─── PROFILE MEDALS ──────────────────────────────────────────────
    // This function is called from profile.js when viewing a user profile.
    window._loadQuizMedals = function(pn, cardId, rowId) {
        if (!pn) return;
        window.db.ref('users/' + pn.toLowerCase() + '/quiz_medals').once('value').then(function(s) {
            var medals = s.val() || {};
            var card = document.getElementById(cardId),
                row = document.getElementById(rowId);
            if (!card || !row) return;
            var defs = [{ k: 'gold', i: '🥇' }, { k: 'silver', i: '🥈' }, { k: 'bronze', i: '🥉' }];
            row.innerHTML = '';
            var any = false;
            defs.forEach(function(m) {
                var cnt = medals[m.k] || 0;
                if (cnt > 0) {
                    any = true;
                    var el = document.createElement('div');
                    el.className = 'prof-medal-item';
                    el.innerHTML = '<span class="prof-medal-icon">' + m.i + '</span><span class="prof-medal-count">×' + cnt + '</span><span class="prof-medal-label">' + m.k.toUpperCase() + '</span>';
                    row.appendChild(el);
                }
            });
            if (!any) { row.innerHTML = '<div class="prof-medals-empty">No quiz medals yet — play the weekly quiz!</div>';
                any = true; }
            card.style.display = any ? 'block' : 'none';
        });
    };

    // ─── PATCH LB SELECT FOR QUIZ ──────────────────────────────────
    // This is called from leaderboard.js
    (function patchLbSelect() {
        var orig = window.lbSelectGame;
        if (typeof orig === 'function') {
            window.lbSelectGame = function(gk, btn) {
                if (gk === '__quiz__') {
                    document.querySelectorAll('.lb-game-tab').forEach(function(b) { b.classList.remove('active'); });
                    if (btn) btn.classList.add('active');
                    var list = document.getElementById('lb-score-list');
                    var loading = document.getElementById('lb-loading');
                    if (loading) loading.style.display = 'none';
                    if (!list) return;
                    list.innerHTML = [1, 2, 3].map(function() { return '<div class="rank-item skeleton" style="height:48px;margin-bottom:8px;">&nbsp;</div>'; }).join('');
                    var wn = _calcWeek();
                    var pn = (localStorage.getItem('playerName') || '').toLowerCase().trim();
                    window.db.ref('quiz/week_' + wn + '/lb').once('value').then(function(snap) {
                        var entries = _sortEntries(snap);
                        list.innerHTML = '<div style="text-align:center;padding:10px;color:rgba(255,255,255,.4);font-size:.75rem;letter-spacing:1px;">🧠 QUIZ · WEEK ' + wn + '</div>';
                        if (!entries.length) { list.innerHTML += '<div style="text-align:center;padding:16px;color:rgba(255,255,255,.3);font-size:.82rem;">No quiz entries yet this week</div>'; return; }
                        var meds = ['🥇', '🥈', '🥉'];
                        var myRankBar = document.getElementById('lb-my-rank-bar');
                        entries.forEach(function(e, i) {
                            var isMe = e.id === pn;
                            var div = document.createElement('div');
                            div.className = 'rank-item' + (isMe ? ' rank-me' : '');
                            div.innerHTML = '<span style="font-size:' + (i < 3 ? '1.4rem' : '.9rem') + ';min-width:28px;text-align:center;">' + (i < 3 ? meds[i] : '#' + (i + 1)) + '</span>' +
                                '<span style="flex:1;font-family:Teko,sans-serif;font-size:1.2rem;letter-spacing:1px;color:' + (isMe ? '#2ecc71' : 'white') + ';">' + e.id.charAt(0).toUpperCase() + e.id.slice(1) + '</span>' +
                                '<div style="text-align:right;"><div style="font-family:Teko,sans-serif;color:#00f3ff;">' + _fmtMs(e.d.time) + '</div><div style="font-size:.7rem;color:rgba(255,255,255,.4);">' + e.d.correct + '/20</div></div>';
                            if (isMe) {
                                if (myRankBar) {
                                    document.getElementById('lb-my-rank-info').innerText = '#' + (i + 1) + ' · ' + (pn.charAt(0).toUpperCase() + pn.slice(1));
                                    document.getElementById('lb-my-rank-score').innerText = e.d.correct + '/20 · ' + _fmtMs(e.d.time);
                                    myRankBar.classList.add('show');
                                }
                            }
                            div.onclick = function() { window.openProfileCard && window.openProfileCard(e.id); };
                            list.appendChild(div);
                        });
                    });
                    return;
                }
                orig(gk, btn);
            };
        }
    })();

    // ─── PATCH MAPSTO FOR QUIZ ──────────────────────────────────────
    (function patchMapsTo() {
        var orig = window.MapsTo;
        if (typeof orig === 'function') {
            window.MapsTo = function(targetId, direction) {
                if (typeof window.currentSection !== 'undefined' && window.currentSection === 'section-quiz' && targetId !== 'section-quiz') {
                    try { window._setUserStatus('online'); } catch (e) {}
                }
                orig.apply(this, arguments);
                if (targetId === 'section-quiz') {
                    setTimeout(function() { window.initQuizSection && window.initQuizSection(); }, 380);
                    try { window._setUserStatus('🧠 Taking Weekly Quiz'); } catch (e) {}
                }
            };
        }
    })();

    // ─── PATCH OPEN PROFILE CARD FOR MEDALS ────────────────────────
    (function patchProfileCard() {
        var orig = window.openProfileCard;
        if (typeof orig === 'function') {
            window.openProfileCard = function(uid) {
                orig(uid);
                // After card loads, load medals
                setTimeout(function() {
                    var card = document.getElementById('pc-quiz-medals');
                    var row = document.getElementById('pc-medals-row');
                    if (card && row) {
                        window._loadQuizMedals(uid, 'pc-quiz-medals', 'pc-medals-row');
                    }
                }, 400);
            };
        }
    })();

    console.log('✅ Quiz loaded');
})();