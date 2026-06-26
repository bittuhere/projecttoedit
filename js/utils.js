// ─── ESCAPE HTML ──────────────────────────────────────────
window.escapeHtml = function(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
};

// ─── SHA-1 HASH ───────────────────────────────────────────
window.hashPw = async function(s) {
    var buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(function(b) {
        return b.toString(16).padStart(2, '0');
    }).join('');
};

// ─── SHA-256 HASH ─────────────────────────────────────────
window.sha256 = async function(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(function(b) {
        return b.toString(16).padStart(2, '0');
    }).join('');
};

// ─── GAS CALL ──────────────────────────────────────────────
window.gasCall = async function(payload) {
    try {
        var r = await fetch(window.GAS_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        return await r.json();
    } catch (e) {
        return { ok: false, error: e.message };
    }
};

// ─── NOTIFICATION SYSTEM ──────────────────────────────────
var _ntQueue = [];
window.showNotify = function(msg, type) {
    type = type || 'info';
    var icons = { success: '✅', error: '❌', info: 'ℹ️', invite: '🎮' };
    var cont = document.getElementById('notify-container');
    if (!cont) return;
    var t = document.createElement('div');
    t.className = 'notify-toast nt-' + type;
    t.innerHTML = '<span class="notify-icon">' + (icons[type] || 'ℹ️') + '</span><span class="notify-msg">' + msg + '</span>';
    cont.appendChild(t);
    requestAnimationFrame(function() {
        requestAnimationFrame(function() { t.classList.add('nt-show'); });
    });
    var dur = (type === 'error') ? 4000 : 3000;
    setTimeout(function() {
        t.classList.add('nt-hide');
        t.classList.remove('nt-show');
        setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, dur);
};

// ─── CONFIRM MODAL ─────────────────────────────────────────
var _confCallback = null;
window.showConfirm = function(msg, onYes, icon) {
    document.getElementById('confirm-msg').innerText = msg;
    document.getElementById('confirm-icon').innerText = icon || '⚠️';
    document.getElementById('confirm-overlay').classList.add('conf-show');
    _confCallback = onYes;
};
document.getElementById('conf-yes').onclick = function() {
    document.getElementById('confirm-overlay').classList.remove('conf-show');
    if (_confCallback) { var cb = _confCallback; _confCallback = null; cb(); }
};
document.getElementById('conf-no').onclick = function() {
    document.getElementById('confirm-overlay').classList.remove('conf-show');
    _confCallback = null;
};

// ─── INPUT MODAL ───────────────────────────────────────────
var _admInputCb = null;
window.showInputModal = function(title, placeholder, cb, defaultVal) {
    var ov = document.getElementById('adm-input-overlay');
    var fld = document.getElementById('adm-input-field');
    if (!ov) return;
    document.getElementById('adm-input-title').innerText = title || 'INPUT';
    fld.placeholder = placeholder || '';
    fld.value = defaultVal || '';
    _admInputCb = cb;
    ov.classList.add('adm-show');
    setTimeout(function() { fld.focus(); }, 200);
};
(function() {
    function admOk() {
        var val = document.getElementById('adm-input-field').value;
        document.getElementById('adm-input-overlay').classList.remove('adm-show');
        if (_admInputCb && val.trim()) { var cb = _admInputCb; _admInputCb = null; cb(val.trim()); } else _admInputCb = null;
    }
    document.getElementById('adm-ok-btn').onclick = admOk;
    document.getElementById('adm-cancel-btn').onclick = function() {
        document.getElementById('adm-input-overlay').classList.remove('adm-show');
        _admInputCb = null;
    };
    document.getElementById('adm-input-field').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') admOk();
        if (e.key === 'Escape') { document.getElementById('adm-input-overlay').classList.remove('adm-show');
            _admInputCb = null; }
    });
})();

console.log('✅ Utils loaded');