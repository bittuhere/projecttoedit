// ─── AUTH STATE ────────────────────────────────────────────
window.isSignup = false;

// ─── TOGGLE MODE ───────────────────────────────────────────
window.toggleMode = function() {
    window.isSignup = !window.isSignup;
    document.getElementById('login-header').innerText = window.isSignup ? 'SIGN UP' : 'LOGIN';
    document.getElementById('login-sub').innerText = window.isSignup ? 'Claim your Unique ID' : 'Enter the Arcade World';
    document.getElementById('submit-btn').innerText = window.isSignup ? 'CREATE ACCOUNT' : 'ENTER';
    document.getElementById('switch-btn').innerText = window.isSignup ? 'Have an account? Login' : 'New here? Create ID';
    document.getElementById('login-username').placeholder = window.isSignup ? 'Username (a-z 0-9)' : 'Username or Email';
    document.getElementById('login-status').innerText = '';
    document.getElementById('trouble-link').style.display = 'none';
    document.getElementById('login-email').style.display = window.isSignup ? 'block' : 'none';
    document.getElementById('forgot-link').style.display = window.isSignup ? 'none' : 'block';
    document.getElementById('google-btn-text').innerText = window.isSignup ? 'SIGN UP WITH GOOGLE' : 'CONTINUE WITH GOOGLE';
};

// ─── TOGGLE PASSWORD VISIBILITY ──────────────────────────
var EYEOPEN = 'data:image/png;base64,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';
var EYECLOSED = 'data:image/png;base64,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';

window.togglePass = function() {
    var p = document.getElementById('login-password'),
        icon = document.getElementById('eye-icon');
    if (!p || !icon) return;
    if (p.type === 'password') { p.type = 'text';
        icon.src = EYECLOSED; } else { p.type = 'password';
        icon.src = EYEOPEN; }
};

// ─── LOGIN SUCCESS ────────────────────────────────────────
window.loginSuccess = function(u, userData) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('playerName', u);
    try {
        window.db.ref('users/' + u).update({ lastLogin: firebase.database.ServerValue.TIMESTAMP });
    } catch (e) { console.warn('Login lastLogin update failed:', e); }
    setTimeout(function() { window._startBgChatNotifListener(u); }, 2500);
    setTimeout(function() {
        ['login-username', 'login-password'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
        var st = document.getElementById('login-status');
        if (st) st.innerText = '';
    }, 3000);
    var d = userData || {};
    var needsVerify = (d.forceVerify === true) || (d.emailVerified === false && d.email_verification !== false && !!d.email);
    if (needsVerify) {
        window._verifyMode = 'existing';
        setTimeout(async function() {
            var res = await window.gasCall({ action: 'send-code', email: d.email, username: u, purpose: 'verify' }).catch(function() { return { ok: false }; });
            if (res.ok) window._openVerifyPage(d.email);
            else window.MapsTo('section-hub', 'right');
        }, 500);
    } else {
        setTimeout(function() { window.MapsTo('section-hub', 'right'); }, 800);
    }
};

// ─── PROCESS AUTH ──────────────────────────────────────────
var _pendingReg = null;
var _verifyMode = '';

window.processAuth = async function(e) {
    if (e) e.preventDefault();
    var rawInput = document.getElementById('login-username').value.trim();
    var rawPass = document.getElementById('login-password').value;
    var status = document.getElementById('login-status');
    var loader = document.getElementById('login-loader');
    var showT = function() { document.getElementById('trouble-link').style.display = 'block'; };
    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInput);
    var user = isEmail ? null : rawInput.toLowerCase();

    if (rawPass.length < 3) { status.innerText = 'Password too short.';
        status.className = 'status-msg l-error';
        showT(); return; }

    if (window.isSignup) {
        if (!user) { status.innerText = 'Username must be letters & numbers, not an email.';
            status.className = 'status-msg l-error'; return; }
        if (user.length < 3) { status.innerText = 'Username too short (min 3 chars).';
            status.className = 'status-msg l-error'; return; }
        if (!/^[a-z0-9]+$/.test(user)) { status.innerText = 'Username: Letters & Numbers only.';
            status.className = 'status-msg l-error';
            showT(); return; }
        var emailVal = (document.getElementById('login-email').value || '').trim().toLowerCase();
        if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            status.innerText = 'Please enter a valid email address.';
            status.className = 'status-msg l-error';
            return;
        }
        loader.style.display = 'block';
        status.innerText = 'Checking availability...';
        try {
            var userSnap = await window.db.ref('users/' + user).once('value');
            var emailSnap = await window.db.ref('users').orderByChild('email').equalTo(emailVal).once('value');
            if (userSnap.exists()) { loader.style.display = 'none';
                status.innerText = 'Username taken! Choose another.';
                status.className = 'status-msg l-error';
                showT(); return; }
            if (emailSnap.exists()) { loader.style.display = 'none';
                status.innerText = 'Email already registered! Try logging in.';
                status.className = 'status-msg l-error'; return; }
            status.innerText = 'Sending verification code...';
            var res = await window.gasCall({ action: 'send-code', email: emailVal, username: user, purpose: 'verify' });
            loader.style.display = 'none';
            if (!res.ok) { status.innerText = 'Failed to send code: ' + (res.error || 'Try again.');
                status.className = 'status-msg l-error'; return; }
            _pendingReg = { username: user, email: emailVal, passwordHash: await window.hashPw(rawPass) };
            _verifyMode = 'new-reg';
            window._openVerifyPage(emailVal);
        } catch (err) { loader.style.display = 'none';
            status.innerText = 'Error: ' + err.message;
            status.className = 'status-msg l-error';
            showT(); }
    } else {
        loader.style.display = 'block';
        status.innerText = '';
        if (isEmail) {
            window.db.ref('users').orderByChild('email').equalTo(rawInput.toLowerCase()).once('value').then(function(snap) {
                loader.style.display = 'none';
                if (!snap.exists()) { status.innerText = 'No account with this email.';
                    status.className = 'status-msg l-error';
                    showT(); return; }
                var foundUser = null,
                    foundData = null;
                snap.forEach(function(c) { foundUser = c.key;
                    foundData = c.val(); });
                window.hashPw(rawPass).then(function(pass) {
                    if (foundData.password !== pass) { status.innerText = 'Wrong Password.';
                        status.className = 'status-msg l-error';
                        showT(); return; }
                    if (foundData.blocked) { status.innerText = 'Access Denied: Account is BLOCKED!';
                        status.className = 'status-msg l-error'; return; }
                    status.innerText = 'Success!';
                    status.className = 'status-msg l-success';
                    window.loginSuccess(foundUser, foundData);
                });
            }).catch(function() { loader.style.display = 'none';
                status.innerText = 'Connection Error.';
                showT(); });
        } else {
            if (!user || user.length < 3) { loader.style.display = 'none';
                status.innerText = 'Username too short.';
                status.className = 'status-msg l-error';
                showT(); return; }
            if (!/^[a-z0-9]+$/.test(user)) { loader.style.display = 'none';
                status.innerText = 'Username: Letters & Numbers only.';
                status.className = 'status-msg l-error';
                showT(); return; }
            var pass = await window.hashPw(rawPass);
            window.db.ref('users/' + user).once('value').then(function(snap) {
                loader.style.display = 'none';
                if (!snap.exists()) { status.innerText = 'User not found.';
                    status.className = 'status-msg l-error';
                    showT(); return; }
                var d = snap.val();
                if (d.password !== pass) { status.innerText = 'Wrong Password.';
                    status.className = 'status-msg l-error';
                    showT(); return; }
                if (d.blocked) { status.innerText = 'Access Denied: Account is BLOCKED!';
                    status.className = 'status-msg l-error'; return; }
                status.innerText = 'Success!';
                status.className = 'status-msg l-success';
                window.loginSuccess(user, d);
            }).catch(function() { loader.style.display = 'none';
                status.innerText = 'Connection Error.';
                showT(); });
        }
    }
};

// ─── EMAIL VERIFY ──────────────────────────────────────────
var _verifyEmailAddr = '';

window._openVerifyPage = function(email) {
    _verifyEmailAddr = email;
    document.getElementById('verify-code-input').value = '';
    document.getElementById('verify-status').innerText = '';
    document.getElementById('verify-page-desc').innerHTML =
        'A 6-digit code was sent to:<br><strong style="color:#00f3ff;">' + email + '</strong><br>Enter it below to continue.';
    window.MapsTo('section-verify-email', 'right');
};

window.verifyConfirmCode = async function() {
    var code = document.getElementById('verify-code-input').value.trim();
    var st = document.getElementById('verify-status');
    if (!code || code.length !== 6) { st.style.color = '#ff3366';
        st.innerText = 'Enter the 6-digit code.'; return; }
    st.style.color = '#00f3ff';
    st.innerText = 'Verifying...';
    var res = await window.gasCall({ action: 'verify-code', email: _verifyEmailAddr, code: code });
    if (!res.ok) { st.style.color = '#ff3366';
        st.innerText = res.error || 'Wrong code. Try again.'; return; }
    if (_verifyMode === 'new-reg' && _pendingReg) {
        st.innerText = 'Creating account...';
        var p = _pendingReg;
        var userData = { password: p.passwordHash, score: 0, dino_highscore: 0, flappy_highscore: 0, snake_highscore: 0, pacman_highscore: 0, createdAt: Date.now(), email: p.email, emailVerified: true };
        await window.db.ref('users/' + p.username).set(userData);
        window.gasCall({ action: 'send-welcome', email: p.email, username: p.username }).catch(function() {});
        _pendingReg = null;
        st.style.color = '#00ff88';
        st.innerText = 'Account created! Welcome!';
        setTimeout(function() { window.loginSuccess(p.username, userData); }, 900);
    } else if (_verifyMode === 'existing') {
        var u = localStorage.getItem('playerName');
        if (u) await window.db.ref('users/' + u).update({ emailVerified: true, forceVerify: null });
        st.style.color = '#00ff88';
        st.innerText = 'Email verified!';
        setTimeout(function() { window.MapsTo('section-hub', 'right'); }, 900);
    }
};

window.verifyResendCode = async function() {
    var st = document.getElementById('verify-status');
    st.style.color = '#00f3ff';
    st.innerText = 'Resending...';
    var username = (_pendingReg && _pendingReg.username) || localStorage.getItem('playerName') || '';
    var res = await window.gasCall({ action: 'send-code', email: _verifyEmailAddr, username: username, purpose: 'verify' }).catch(function() { return { ok: false }; });
    st.style.color = res.ok ? '#00ff88' : '#ff3366';
    st.innerText = res.ok ? 'New code sent!' : (res.error || 'Failed to resend.');
};

window.verifyCancel = function() {
    _pendingReg = null;
    _verifyMode = '';
    localStorage.clear();
    window.MapsTo('section-login', 'left');
};

// ─── GOOGLE SIGN IN ────────────────────────────────────────
var _pendingGoogle = null;

window.googleSignIn = async function() {
    var btn = document.getElementById('google-btn');
    btn.disabled = true;
    btn.style.opacity = '0.6';
    try {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        try {
            var result = await firebase.auth().signInWithPopup(provider);
            await window._handleGoogleUser(result.user.email.toLowerCase());
        } catch (popErr) {
            if (popErr.code === 'auth/popup-blocked' || popErr.code === 'auth/cancelled-popup-request' || popErr.code === 'auth/operation-not-supported-in-this-environment') {
                await firebase.auth().signInWithRedirect(provider);
            } else if (popErr.code !== 'auth/popup-closed-by-user') {
                throw popErr;
            }
        }
    } catch (err) {
        window.showNotify('Google Sign In failed: ' + (err.message || err.code), 'error');
    } finally {
        btn.disabled = false;
        btn.style.opacity = '1';
    }
};

window._handleGoogleUser = async function(gEmail) {
    var found = null;
    var snap1 = await window.db.ref('users').orderByChild('googleEmail').equalTo(gEmail).once('value');
    if (snap1.exists()) { snap1.forEach(function(c) { found = { key: c.key, val: c.val() }; }); }
    if (!found) {
        var snap2 = await window.db.ref('users').orderByChild('email').equalTo(gEmail).once('value');
        if (snap2.exists()) { snap2.forEach(function(c) { found = { key: c.key, val: c.val() }; }); }
    }
    if (found) {
        if (!found.val.googleEmail) await window.db.ref('users/' + found.key).update({ googleEmail: gEmail, emailVerified: true });
        if (found.val.blocked) { window.showNotify('Account is BLOCKED.', 'error'); return; }
        window.loginSuccess(found.key, Object.assign({}, found.val, { emailVerified: true }));
    } else {
        _pendingGoogle = { email: gEmail };
        document.getElementById('google-setup-email-label').innerText = gEmail;
        document.getElementById('gsetup-username').value = '';
        document.getElementById('gsetup-password').value = '';
        document.getElementById('gsetup-confirm').value = '';
        document.getElementById('gsetup-status').innerText = '';
        window.MapsTo('section-google-setup', 'right');
    }
};

window.googleSetupComplete = async function() {
    var uname = document.getElementById('gsetup-username').value.trim().toLowerCase();
    var pass = document.getElementById('gsetup-password').value;
    var confirm = document.getElementById('gsetup-confirm').value;
    var st = document.getElementById('gsetup-status');
    var loader = document.getElementById('gsetup-loader');
    st.style.color = '#ff3366';
    if (uname.length < 3 || !/^[a-z0-9]+$/.test(uname)) { st.innerText = 'Username: min 3 chars, letters & numbers only.'; return; }
    if (pass.length < 3) { st.innerText = 'Password: min 3 chars.'; return; }
    if (pass !== confirm) { st.innerText = 'Passwords do not match.'; return; }
    if (!_pendingGoogle) { st.innerText = 'Session expired. Please try again.'; return; }
    loader.style.display = 'block';
    st.innerText = '';
    try {
        var userSnap2 = await window.db.ref('users/' + uname).once('value');
        var emailSnap2 = await window.db.ref('users').orderByChild('email').equalTo(_pendingGoogle.email).once('value');
        if (userSnap2.exists()) { loader.style.display = 'none';
            st.innerText = 'Username taken! Choose another.'; return; }
        if (emailSnap2.exists()) { loader.style.display = 'none';
            st.innerText = 'This Google email is already registered.'; return; }
        var passwordHash = await window.hashPw(pass);
        var userData = { password: passwordHash, score: 0, dino_highscore: 0, flappy_highscore: 0, snake_highscore: 0, pacman_highscore: 0, createdAt: Date.now(), email: _pendingGoogle.email, emailVerified: true, googleEmail: _pendingGoogle.email };
        await window.db.ref('users/' + uname).set(userData);
        window.gasCall({ action: 'send-welcome', email: _pendingGoogle.email, username: uname }).catch(function() {});
        _pendingGoogle = null;
        loader.style.display = 'none';
        st.style.color = '#00ff88';
        st.innerText = 'Account created!';
        setTimeout(function() { window.loginSuccess(uname, userData); }, 700);
    } catch (err) { loader.style.display = 'none';
        st.innerText = 'Error: ' + err.message; }
};

window.googleSetupCancel = function() {
    _pendingGoogle = null;
    window.MapsTo('section-login', 'left');
};

// ─── FORGOT PASSWORD ──────────────────────────────────────
var _forgotEmail = '';

window.openForgotPassword = function() {
    _forgotEmail = '';
    document.getElementById('forgot-step1').style.display = 'block';
    document.getElementById('forgot-step2').style.display = 'none';
    document.getElementById('forgot-step-desc').innerText = 'Enter your registered email.';
    document.getElementById('forgot-status').innerText = '';
    document.getElementById('forgot-email').value = '';
    document.getElementById('forgot-code').value = '';
    document.getElementById('forgot-newpass').value = '';
    document.getElementById('forgot-modal').style.display = 'flex';
};

window.closeForgotPassword = function() {
    document.getElementById('forgot-modal').style.display = 'none';
};

window.forgotSendCode = async function() {
    var email = document.getElementById('forgot-email').value.trim().toLowerCase();
    var st = document.getElementById('forgot-status');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { st.style.color = '#ff3366';
        st.innerText = 'Enter a valid email.'; return; }
    st.style.color = '#00f3ff';
    st.innerText = 'Searching account...';
    var snap = await window.db.ref('users').orderByChild('email').equalTo(email).once('value');
    if (!snap.exists()) { st.style.color = '#ff3366';
        st.innerText = 'No account found with this email.'; return; }
    var foundUser = '',
        foundData = {};
    snap.forEach(function(c) { foundUser = c.key;
        foundData = c.val(); });
    if (foundData.emailVerified !== true) {
        st.style.color = '#ff3366';
        st.innerText = 'Email not verified. Verify your email first before resetting password.';
        return;
    }
    st.innerText = 'Sending code...';
    var res = await window.gasCall({ action: 'send-code', email: email, username: foundUser, purpose: 'reset' });
    if (res.ok) {
        _forgotEmail = email;
        document.getElementById('forgot-step1').style.display = 'none';
        document.getElementById('forgot-step2').style.display = 'block';
        document.getElementById('forgot-step-desc').innerText = 'Code sent! Check your inbox.';
        st.style.color = '#00ff88';
        st.innerText = 'Code sent to ' + email;
    } else { st.style.color = '#ff3366';
        st.innerText = res.error || 'Failed to send code.'; }
};

window.forgotVerifyCode = async function() {
    var code = document.getElementById('forgot-code').value.trim();
    var newPass = document.getElementById('forgot-newpass').value;
    var st = document.getElementById('forgot-status');
    if (!code || code.length !== 6) { st.style.color = '#ff3366';
        st.innerText = 'Enter the 6-digit code.'; return; }
    if (newPass.length < 3) { st.style.color = '#ff3366';
        st.innerText = 'Password too short (min 3 chars).'; return; }
    st.style.color = '#00f3ff';
    st.innerText = 'Verifying...';
    var res = await window.gasCall({ action: 'verify-code', email: _forgotEmail, code: code });
    if (!res.ok) { st.style.color = '#ff3366';
        st.innerText = res.error || 'Wrong code.'; return; }
    var snap2 = await window.db.ref('users').orderByChild('email').equalTo(_forgotEmail).once('value');
    var foundUser2 = '';
    snap2.forEach(function(c) { foundUser2 = c.key; });
    await window.db.ref('users/' + foundUser2).update({ password: await window.hashPw(newPass) });
    st.style.color = '#00ff88';
    st.innerText = 'Password reset! You can now login.';
    setTimeout(window.closeForgotPassword, 2000);
};

// ─── TROUBLESHOOT ──────────────────────────────────────────
window.goToTroubleshoot = function() {
    var user = document.getElementById('login-username').value;
    var err = document.getElementById('login-status').innerText;
    window.runTsAnalysis(user, err);
    window.MapsTo('section-troubleshoot', 'right');
};

window.runTsAnalysis = function(user, errorMsg) {
    document.getElementById('ts-user').innerText = user || 'None Provided';
    var ua = document.getElementById('ts-username-analysis'),
        pa = document.getElementById('ts-password-analysis'),
        sa = document.getElementById('ts-suggestion-area');
    ua.innerHTML = '';
    pa.innerHTML = '';
    sa.innerHTML = '';
    var ue = [],
        pe = [];
    if (errorMsg.includes('Letters & Numbers') || errorMsg.includes('short') || errorMsg.includes('BLOCKED') || errorMsg.includes('taken') || errorMsg.includes('not found')) {
        ua.innerHTML = '<div class="section-title">USERNAME &amp; ACCESS ANALYSIS</div>';
        if (errorMsg.includes('BLOCKED')) ue.push('<b>Account Blocked:</b> Admin has restricted this ID.');
        if (/\s/.test(user) && !errorMsg.includes('BLOCKED')) ue.push('<b>Spaces Detected:</b> Usernames cannot have spaces.');
        if (/[A-Z]/.test(user) && !errorMsg.includes('BLOCKED')) ue.push('<b>Capital Letters:</b> Only lowercase (a-z) allowed.');
        if (/[^a-zA-Z0-9]/.test(user) && !errorMsg.includes('BLOCKED')) ue.push('<b>Invalid Characters:</b> Symbols like @,#,$ not permitted.');
        if (user.length > 0 && user.length < 3 && !errorMsg.includes('BLOCKED')) ue.push('<b>Length Error:</b> Username must be at least 3 characters.');
        if (errorMsg.includes('taken') && !errorMsg.includes('BLOCKED')) ue.push('<b>Name Conflict:</b> This username is already registered.');
        if (errorMsg.includes('not found') && !errorMsg.includes('BLOCKED')) ue.push("<b>ID Not Found:</b> This username doesn't exist. Did you forget to 'Create ID'?");
        ue.forEach(function(e) { ua.innerHTML += '<div class="error-item">' + e + '</div>'; });
        if (ue.length > 0 && !errorMsg.includes('BLOCKED')) window.genTsSuggestion(user);
    }
    if (errorMsg.includes('Password') || errorMsg.includes('short')) {
        pa.innerHTML = '<div class="section-title">PASSWORD SECURITY CHECK</div>';
        if (errorMsg.includes('short')) pe.push('<b>Weak Password:</b> Password must be at least 3 characters.');
        if (errorMsg.includes('Wrong Password')) pe.push('<b>Mismatch Error:</b> Password does not match records for this user.');
        pe.forEach(function(e) { pa.innerHTML += '<div class="error-item">' + e + '</div>'; });
    }
    if (ue.length === 0 && pe.length === 0) ua.innerHTML = '<div class="error-item" style="border-left-color:#00f3ff"><b>System Note:</b> Please ensure your internet is stable.</div>';
};

window.genTsSuggestion = function(input) {
    var s = input.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s.length < 3) s = 'player' + Math.floor(100 + Math.random() * 899);
    else s += Math.floor(10 + Math.random() * 89);
    if (/^[a-z0-9]{3,}$/.test(s)) document.getElementById('ts-suggestion-area').innerHTML =
        '<div class="suggestion-box"><p style="margin:0;color:#00f3ff;font-size:.9rem;">RE-VALIDATED SUGGESTION:</p><div class="suggested-name">' +
        s + '</div><p style="margin:5px 0 0;font-size:.75rem;color:#888;">(This name follows all security protocols)</p></div>';
};

// ─── AUTH INIT ─────────────────────────────────────────────
firebase.auth().getRedirectResult().then(function(result) {
    if (result && result.user) window._handleGoogleUser(result.user.email.toLowerCase());
}).catch(function(err) {
    if (err.code && err.code !== 'auth/no-current-user' && err.code !== 'auth/null-user')
        console.warn('Google redirect result:', err.message);
});

document.getElementById('login-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') window.processAuth(e);
});

// ─── LOGOUT ─────────────────────────────────────────────────
window.logout = function() {
    console.log('Logging out...');
    var _logoutUser = localStorage.getItem('playerName');

    if (_logoutUser && typeof window.db !== 'undefined') {
        try {
            var _sr = window.db.ref('status/' + _logoutUser.toLowerCase().trim());
            _sr.onDisconnect().cancel();
            _sr.set({ state: 'offline', last_changed: firebase.database.ServerValue.TIMESTAMP })
                .catch(function(e) { console.warn('Status update failed:', e); });
        } catch (e) { console.warn('Logout status update failed:', e); }
    }

    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().catch(function(e) { console.warn('Firebase signOut failed:', e); });
    }

    if (window.LC) {
        window.LC.leaveAll();
    }

    window.spaHistory = [];
    localStorage.clear();
    try { sessionStorage.clear(); } catch (e) {}

    window.location.replace('#section-login');
    setTimeout(function() {
        window.currentSection = 'section-login';
        var sections = document.querySelectorAll('.spa-section');
        sections.forEach(function(s) {
            s.classList.remove('active', 'hidden-left', 'hidden-right');
            if (s.id !== 'section-login') s.classList.add('hidden-right');
        });
        var loginSec = document.getElementById('section-login');
        if (loginSec) loginSec.classList.add('active');
    }, 50);
};
// ─── CHANGE PASSWORD ────────────────────────────────────────
var _cpStep = 1;

window.openChangePass = function() {
    _cpStep = 1;
    document.getElementById('cp-error').innerText = '';
    document.getElementById('cp-step1-fields').style.display = 'block';
    document.getElementById('cp-step2-fields').style.display = 'none';
    document.getElementById('cp-confirm-btn').innerText = 'Verify →';
    document.getElementById('cp-step-indicator').innerText = 'STEP 1 OF 2 — VERIFY IDENTITY';
    document.getElementById('cp-old-input').value = '';
    document.getElementById('cp-new-input').value = '';
    document.getElementById('cp-conf-input').value = '';
    document.getElementById('chgpass-overlay').classList.add('cp-show');
    setTimeout(function() { document.getElementById('cp-old-input').focus(); }, 300);
};

window.closeChangePass = function() {
    document.getElementById('chgpass-overlay').classList.remove('cp-show');
};

window.cpToggleEye = function(inputId, eyeId) {
    var inp = document.getElementById(inputId);
    var eye = document.getElementById(eyeId);
    if (!inp || !eye) return;
    if (inp.type === 'password') { inp.type = 'text';
        eye.src = EYECLOSED; } else { inp.type = 'password';
        eye.src = EYEOPEN; }
};

window.cpHandleStep = async function() {
    var errEl = document.getElementById('cp-error');
    errEl.innerText = '';
    if (_cpStep === 1) {
        var oldVal = document.getElementById('cp-old-input').value;
        if (!oldVal) { errEl.innerText = 'Please enter your current password.'; return; }
        var uid = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        var oldH = await window.hashPw(oldVal);
        document.getElementById('cp-confirm-btn').disabled = true;
        document.getElementById('cp-confirm-btn').innerText = 'Verifying...';
        window.db.ref('users/' + uid).once('value', function(snap) {
            document.getElementById('cp-confirm-btn').disabled = false;
            if (!snap.exists()) { errEl.innerText = 'User not found!'; document.getElementById('cp-confirm-btn').innerText = 'Verify →'; return; }
            if (snap.val().password !== oldH) {
                errEl.style.color = '#ff3366';
                errEl.innerText = '❌ Incorrect Password. Please try again.';
                document.getElementById('cp-old-input').value = '';
                document.getElementById('cp-old-input').focus();
                document.getElementById('cp-confirm-btn').innerText = 'Verify →';
            } else {
                _cpStep = 2;
                document.getElementById('cp-step1-fields').style.display = 'none';
                document.getElementById('cp-step2-fields').style.display = 'block';
                document.getElementById('cp-confirm-btn').innerText = 'Change Password ✓';
                document.getElementById('cp-step-indicator').innerText = 'STEP 2 OF 2 — SET NEW PASSWORD';
                errEl.style.color = '#00ff88';
                errEl.innerText = '✅ Identity verified!';
                setTimeout(function() { document.getElementById('cp-new-input').focus(); }, 100);
            }
        });
    } else {
        var nwVal = document.getElementById('cp-new-input').value;
        var cfVal = document.getElementById('cp-conf-input').value;
        errEl.style.color = '#ff3366';
        if (nwVal.length < 4) { errEl.innerText = '❌ New password must be at least 4 characters.'; return; }
        if (nwVal !== cfVal) { errEl.innerText = '❌ Passwords do not match!'; document.getElementById('cp-conf-input').value = ''; document.getElementById('cp-conf-input').focus(); return; }
        var uid = (localStorage.getItem('playerName') || '').toLowerCase().trim();
        var nwH = await window.hashPw(nwVal);
        document.getElementById('cp-confirm-btn').disabled = true;
        document.getElementById('cp-confirm-btn').innerText = 'Saving...';
        window.db.ref('users/' + uid).update({ password: nwH }).then(function() {
            window.closeChangePass();
            _cpStep = 1;
            window.showNotify('🔐 Password changed successfully! Logging out...', 'success');
            setTimeout(window.logout, 1500);
        }).catch(function(err) {
            document.getElementById('cp-confirm-btn').disabled = false;
            document.getElementById('cp-confirm-btn').innerText = 'Change Password ✓';
            errEl.innerText = '❌ Error saving password. Try again.';
            console.error('Change password error:', err);
        });
    }
};

console.log('✅ Auth loaded');