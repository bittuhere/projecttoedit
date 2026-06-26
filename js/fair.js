// ─── FAIR COPIES ─────────────────────────────────────────────
// This module handles the Google Drive file browser for Fair Copies.

const FAIR_API_KEY = 'AIzaSyAiGpkif9bDi5zq29vztuE3-A5iypkHa4w';
const FAIR_ROOT_ID = '1vGp2vyRvAAFxzF4cfrA4qHtGTjLlDrS9';

window.fairHistory = [];

window.fairEscape = function(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

window.setFairProgress = function(pct, label) {
    var fg = document.getElementById('fair-ring-fg');
    var pt = document.getElementById('fair-pct-text');
    var lb = document.getElementById('fair-load-label');
    var p = Math.max(0, Math.min(100, Math.round(pct)));
    if (fg) fg.style.strokeDashoffset = String(264 - (264 * p / 100));
    if (pt) pt.textContent = p + '%';
    if (lb && label) lb.textContent = label;
};

// ─── PDF.JS LOADER ──────────────────────────────────────────
window._loadPDFJS = function() {
    return new Promise(function(resolve, reject) {
        if (window.pdfjsLib) { resolve(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
        s.onload = function() {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            resolve();
        };
        s.onerror = function() { reject(new Error('PDF.js failed to load')); };
        document.head.appendChild(s);
    });
};

// ─── FETCH WITH PROGRESS ────────────────────────────────────
window._fetchProgress = function(url, onPct) {
    return new Promise(function(resolve, reject) {
        fetch(url).then(function(resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status + ': ' + resp.statusText);
            var total = parseInt(resp.headers.get('content-length') || '0');
            var reader = resp.body.getReader();
            var chunks = [],
                loaded = 0;
            var fakeTimer = null;
            if (!total) {
                var fakePct = 0;
                fakeTimer = setInterval(function() {
                    fakePct = Math.min(85, fakePct + 3);
                    onPct(fakePct);
                }, 180);
            }
            function read() {
                reader.read().then(function(_ref) {
                    var done = _ref.done,
                        value = _ref.value;
                    if (done) {
                        if (fakeTimer) clearInterval(fakeTimer);
                        onPct(100);
                        var totalLen = chunks.reduce(function(s, c) { return s + c.length; }, 0);
                        var buf = new Uint8Array(totalLen);
                        var off = 0;
                        for (var i = 0; i < chunks.length; i++) { buf.set(chunks[i], off);
                            off += chunks[i].length; }
                        resolve(buf.buffer);
                        return;
                    }
                    chunks.push(value);
                    loaded += value.length;
                    if (total) onPct(Math.round(loaded / total * 95));
                    read();
                }).catch(reject);
            }
            read();
        }).catch(reject);
    });
};

// ─── VIEWER SETUP ────────────────────────────────────────────
window._fairEnsureViewer = function() {
    if (document.getElementById('fair-viewer')) return;
    var div = document.createElement('div');
    div.id = 'fair-viewer';
    div.innerHTML =
        '<div id="fair-viewer-bar">' +
        '<span id="fair-viewer-title">Loading...</span>' +
        '<button class="fair-viewer-btn" id="fair-viewer-dl">📥 Download</button>' +
        '<button class="fair-viewer-btn" id="fair-viewer-close" style="color:#ff3366;">✕</button>' +
        '</div>' +
        '<div id="fair-viewer-progress">' +
        '<div class="fair-ring-wrap">' +
        '<svg viewBox="0 0 100 100" class="fair-ring">' +
        '<circle cx="50" cy="50" r="42" class="fair-ring-bg"/>' +
        '<circle cx="50" cy="50" r="42" class="fair-ring-fg" id="fv-ring-fg"/>' +
        '</svg>' +
        '<div class="fair-ring-pct" id="fv-pct-text">0%</div>' +
        '</div>' +
        '<p class="fair-load-label" id="fv-load-label">Loading file...</p>' +
        '</div>' +
        '<div id="fair-viewer-content"></div>';
    document.body.appendChild(div);

    document.getElementById('fair-viewer-close').onclick = function() {
        document.getElementById('fair-viewer').classList.remove('open');
        document.getElementById('fair-viewer-content').innerHTML = '';
        document.getElementById('fair-viewer-content').style.display = 'none';
        document.getElementById('fair-viewer-progress').style.display = 'flex';
        try { window.disableGlobalZoom(); } catch (e) {}
    };

    div.addEventListener('click', function(e) {
        if (e.target === div) {
            div.classList.remove('open');
            document.getElementById('fair-viewer-content').innerHTML = '';
            document.getElementById('fair-viewer-content').style.display = 'none';
            document.getElementById('fair-viewer-progress').style.display = 'flex';
            try { window.disableGlobalZoom(); } catch (e) {}
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && div.classList.contains('open')) {
            div.classList.remove('open');
            document.getElementById('fair-viewer-content').innerHTML = '';
            document.getElementById('fair-viewer-content').style.display = 'none';
            document.getElementById('fair-viewer-progress').style.display = 'flex';
            try { window.disableGlobalZoom(); } catch (e) {}
        }
    });
};

window._setViewerProgress = function(pct, label) {
    var fg = document.getElementById('fv-ring-fg');
    var pt = document.getElementById('fv-pct-text');
    var lb = document.getElementById('fv-load-label');
    var p = Math.max(0, Math.min(100, Math.round(pct)));
    if (fg) fg.style.strokeDashoffset = String(264 - (264 * p / 100));
    if (pt) pt.textContent = p + '%';
    if (lb && label) lb.textContent = label;
};

window._viewerShowContent = function() {
    document.getElementById('fair-viewer-progress').style.display = 'none';
    document.getElementById('fair-viewer-content').style.display = 'block';
};

window._fairGetType = function(mime) {
    if (!mime) return 'other';
    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'text/plain' || mime === 'text/csv' || mime === 'application/json' || mime.startsWith('text/')) return 'text';
    if (mime === 'application/vnd.google-apps.document') return 'gdoc';
    if (mime === 'application/vnd.google-apps.spreadsheet') return 'gsheet';
    if (mime === 'application/vnd.google-apps.presentation') return 'gslide';
    if (mime === 'application/vnd.google-apps.folder') return 'folder';
    return 'other';
};

window.fairLoadFile = async function(fileId, fileName, mimeType) {
    window._fairEnsureViewer();
    var viewer = document.getElementById('fair-viewer');
    var content = document.getElementById('fair-viewer-content');
    var title = document.getElementById('fair-viewer-title');
    var dlBtn = document.getElementById('fair-viewer-dl');

    viewer.classList.add('open');
    try { window.enableGlobalZoom(); } catch (e) {}

    content.innerHTML = '';
    content.style.display = 'none';
    document.getElementById('fair-viewer-progress').style.display = 'flex';
    title.textContent = fileName;
    window._setViewerProgress(0, 'Preparing...');

    var type = window._fairGetType(mimeType);
    var dlUrl = '';

    try {
        if (type === 'pdf') {
            dlUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
            dlBtn.onclick = function() { window.open(dlUrl, '_blank'); };
            window._setViewerProgress(5, 'Loading PDF.js...');
            await window._loadPDFJS();
            window._setViewerProgress(15, 'Fetching PDF...');
            var mediaUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&key=' + FAIR_API_KEY;
            var buf = await window._fetchProgress(mediaUrl, function(p) { window._setViewerProgress(15 + p * 0.6, 'Downloading (' + p + '%)...'); });
            window._setViewerProgress(80, 'Rendering pages...');
            var pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
            var numPages = pdfDoc.numPages;
            for (var pg = 1; pg <= numPages; pg++) {
                var page = await pdfDoc.getPage(pg);
                var vp = page.getViewport({ scale: 2.0 });
                var canvas = document.createElement('canvas');
                canvas.width = vp.width;
                canvas.height = vp.height;
                canvas.style.cssText = 'display:block;margin:0 auto 8px;max-width:100%;will-change:transform;transform:translateZ(0);';
                content.appendChild(canvas);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
                window._setViewerProgress(80 + (pg / numPages) * 18, 'Rendering page ' + pg + '/' + numPages);
            }
            window._setViewerProgress(100, 'Done!');
            window._viewerShowContent();
            // Resize handler
            (function() {
                var _pdfDocRef = pdfDoc;
                var _resizeTimer = null;

                function _reRender() {
                    if (_resizeTimer) clearTimeout(_resizeTimer);
                    _resizeTimer = setTimeout(function() {
                        var cont = document.getElementById('fair-viewer-content');
                        if (!_pdfDocRef || !cont || cont.style.display === 'none') return;
                        cont.innerHTML = '';
                        var nP = _pdfDocRef.numPages;
                        (function rp(pg) {
                            if (pg > nP) return;
                            _pdfDocRef.getPage(pg).then(function(page) {
                                var cw = cont.clientWidth - 16;
                                var scale = Math.min(1.5, cw > 0 ? cw / page.getViewport({ scale: 1 }).width : 1.5);
                                var vp = page.getViewport({ scale: Math.max(0.8, scale) });
                                var cv = document.createElement('canvas');
                                cv.width = vp.width;
                                cv.height = vp.height;
                                cv.style.marginBottom = '6px';
                                cv.style.maxWidth = '100%';
                                cont.appendChild(cv);
                                page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function() { rp(pg + 1); });
                            });
                        })(1);
                    }, 400);
                }
                window.addEventListener('resize', _reRender);
            })();

        } else if (type === 'image') {
            dlUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
            dlBtn.onclick = function() { window.open(dlUrl, '_blank'); };
            window._setViewerProgress(5, 'Fetching image...');
            var mediaUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&key=' + FAIR_API_KEY;
            var buf = await window._fetchProgress(mediaUrl, function(p) { window._setViewerProgress(5 + p * 0.9, 'Downloading (' + p + '%)...'); });
            var blob = new Blob([buf], { type: mimeType });
            var url = URL.createObjectURL(blob);
            var img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'display:block;margin:auto;max-width:100%;max-height:90vh;padding:16px;';
            img.onload = function() { URL.revokeObjectURL(url); };
            content.appendChild(img);
            window._setViewerProgress(100, 'Done!');
            window._viewerShowContent();

        } else if (type === 'text') {
            dlUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
            dlBtn.onclick = function() { window.open(dlUrl, '_blank'); };
            window._setViewerProgress(5, 'Fetching text...');
            var mediaUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&key=' + FAIR_API_KEY;
            var buf = await window._fetchProgress(mediaUrl, function(p) { window._setViewerProgress(5 + p * 0.9, 'Downloading (' + p + '%)...'); });
            var text = new TextDecoder().decode(buf);
            var pre = document.createElement('pre');
            pre.textContent = text;
            content.appendChild(pre);
            window._setViewerProgress(100, 'Done!');
            window._viewerShowContent();

        } else if (type === 'gdoc' || type === 'gsheet' || type === 'gslide') {
            dlUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/export?mimeType=application%2Fpdf&key=' + FAIR_API_KEY;
            dlBtn.onclick = function() { window.open(dlUrl, '_blank'); };
            window._setViewerProgress(5, 'Loading PDF.js...');
            await window._loadPDFJS();
            window._setViewerProgress(15, 'Exporting as PDF...');
            var buf = await window._fetchProgress(dlUrl, function(p) { window._setViewerProgress(15 + p * 0.6, 'Exporting (' + p + '%)...'); });
            window._setViewerProgress(80, 'Rendering...');
            var pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
            var numPages = pdfDoc.numPages;
            for (var pg = 1; pg <= numPages; pg++) {
                var page = await pdfDoc.getPage(pg);
                var vp = page.getViewport({ scale: 2.0 });
                var canvas = document.createElement('canvas');
                canvas.width = vp.width;
                canvas.height = vp.height;
                canvas.style.cssText = 'display:block;margin:0 auto 8px;max-width:100%;will-change:transform;transform:translateZ(0);';
                content.appendChild(canvas);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
                window._setViewerProgress(80 + (pg / numPages) * 18, 'Rendering page ' + pg + '/' + numPages);
            }
            window._setViewerProgress(100, 'Done!');
            window._viewerShowContent();

        } else {
            dlUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
            dlBtn.onclick = function() { window.open(dlUrl, '_blank'); };
            window._setViewerProgress(100, 'Preview not available');
            var msg = document.createElement('div');
            msg.className = 'fair-viewer-unsupported';
            msg.innerHTML = '<div style="font-size:3rem;margin-bottom:16px;">📄</div>' +
                '<div style="color:#fff;margin-bottom:12px;">' + window.fairEscape(fileName) + '</div>' +
                '<div style="color:rgba(255,255,255,.4);font-size:.85rem;margin-bottom:24px;">This file type cannot be previewed here.</div>' +
                '<button onclick="window.open(\'' + dlUrl + '\',\'_blank\')" style="background:linear-gradient(135deg,#00f3ff,#0066ff);color:#000;border:none;border-radius:10px;padding:12px 28px;cursor:pointer;font-size:1rem;font-weight:bold;">📥 Download File</button>';
            content.appendChild(msg);
            window._viewerShowContent();
        }
    } catch (err) {
        window._setViewerProgress(0, 'Error!');
        var msg = document.createElement('div');
        msg.className = 'fair-viewer-unsupported';
        msg.innerHTML = '<div style="font-size:2rem;margin-bottom:12px;">❌</div>' +
            '<div style="color:#ff3366;">' + window.fairEscape(err.message) + '</div>' +
            '<div style="color:rgba(255,255,255,.4);font-size:.8rem;margin-top:8px;">Try downloading instead.</div>';
        content.appendChild(msg);
        window._viewerShowContent();
    }
};

// ─── OPTIONS POPUP ───────────────────────────────────────────
window._fairEnsureOptsPopup = function() {
    if (document.getElementById('fair-opts-popup')) return;
    var div = document.createElement('div');
    div.id = 'fair-opts-popup';
    div.innerHTML =
        '<div class="fair-opt-name" id="fair-opt-name">file.pdf</div>' +
        '<button class="fair-opt-btn fair-opt-load" id="fair-opt-load">👁️ Load File Here</button>' +
        '<button class="fair-opt-btn fair-opt-dl" id="fair-opt-dl">📥 Download File</button>' +
        '<button class="fair-opt-btn fair-opt-cancel" id="fair-opt-cancel">Cancel</button>';
    document.body.appendChild(div);
    document.getElementById('fair-opt-cancel').onclick = function() {
        document.getElementById('fair-opts-popup').style.display = 'none';
    };
    document.addEventListener('click', function(e) {
        var pop = document.getElementById('fair-opts-popup');
        if (pop && pop.style.display === 'block' && !pop.contains(e.target)) {
            pop.style.display = 'none';
        }
    }, true);
};

window.fairShowOptions = function(fileId, fileName, mimeType, event) {
    window._fairEnsureOptsPopup();
    var pop = document.getElementById('fair-opts-popup');
    document.getElementById('fair-opt-name').textContent = fileName;

    var dlUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
    document.getElementById('fair-opt-dl').onclick = function() {
        pop.style.display = 'none';
        window.open(dlUrl, '_blank');
    };
    document.getElementById('fair-opt-load').onclick = function() {
        pop.style.display = 'none';
        window.fairLoadFile(fileId, fileName, mimeType);
    };

    var x = event.clientX || window.innerWidth / 2;
    var y = event.clientY || window.innerHeight / 2;
    pop.style.display = 'block';
    var pw = pop.offsetWidth || 240,
        ph = pop.offsetHeight || 180;
    pop.style.left = Math.min(x, window.innerWidth - pw - 12) + 'px';
    pop.style.top = Math.min(y, window.innerHeight - ph - 12) + 'px';
    event.stopPropagation();
};

// ─── LOAD FOLDER ─────────────────────────────────────────────
window.fairLoadFolder = async function(folderId, folderName, addToHistory) {
    if (addToHistory === undefined) addToHistory = true;
    var loader = document.getElementById('fair-loader');
    var listDiv = document.getElementById('fair-file-list');
    var errDiv = document.getElementById('fair-error');
    if (!loader) return;

    loader.style.display = 'flex';
    listDiv.style.display = 'none';
    errDiv.style.display = 'none';
    window.setFairProgress(0, 'Connecting...');

    var fakePct = 0;
    var fakeTimer = setInterval(function() {
        fakePct = Math.min(30, fakePct + 2);
        window.setFairProgress(fakePct, 'Loading files...');
    }, 120);

    try {
        var url = 'https://www.googleapis.com/drive/v3/files?q=\'' + folderId +
            '\' in parents and trashed=false&key=' + FAIR_API_KEY +
            '&fields=files(id,name,mimeType,size),nextPageToken&orderBy=folder%2Cname&pageSize=50';
        var res = await fetch(url);
        clearInterval(fakeTimer);
        window.setFairProgress(60, 'Processing...');
        var data = await res.json();
        if (data.error) throw new Error(data.error.message);
        var files = data.files || [];
        var nextPageToken = data.nextPageToken || null;
        window.setFairProgress(80, 'Rendering...');

        if (addToHistory) window.fairHistory.push({ id: folderId, name: folderName });

        var html = '';

        if (window.fairHistory.length > 1) {
            html += '<div style="margin-bottom:16px;">' +
                '<button id="fairBackBtn" style="background:rgba(0,243,255,0.15);border:1px solid #00f3ff;color:#00f3ff;padding:6px 16px;border-radius:20px;cursor:pointer;">← Back</button>' +
                '</div>';
        }

        if (window.fairHistory.length > 0) {
            html += '<div style="margin-bottom:14px;font-size:.82rem;color:#aaa;">📍 ' +
                window.fairHistory.map(function(f) { return '<span style="color:#00f3ff;">' + window.fairEscape(f.name) + '</span>'; }).join(' › ') +
                '</div>';
        }

        if (files.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:#aaa;">📭 This folder is empty.</div>';
        } else {
            html += '<div class="fair-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">';
            files.forEach(function(file) {
                var isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                var icon = isFolder ? '📁' : '📄';
                if (file.mimeType.includes('pdf')) icon = '📑';
                else if (file.mimeType.includes('image')) icon = '🖼️';
                else if (file.mimeType.includes('spreadsheet') || file.mimeType.includes('sheet')) icon = '📊';
                else if (file.mimeType.includes('document')) icon = '📝';
                else if (file.mimeType.includes('presentation')) icon = '📽️';
                var sz = file.size ? (parseInt(file.size) < 1048576 ? (parseInt(file.size) / 1024).toFixed(1) + ' KB' : (parseInt(file.size) / 1048576).toFixed(2) + ' MB') : '';
                html += '<div class="fair-item" data-id="' + file.id + '" ' +
                    'data-name="' + window.fairEscape(file.name) + '" data-mime="' + file.mimeType + '" ' +
                    'style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);' +
                    'border-radius:12px;padding:14px;cursor:pointer;transition:border-color .2s,background .2s;">' +
                    '<div style="display:flex;align-items:center;gap:12px;">' +
                    '<span style="font-size:2rem;">' + icon + '</span>' +
                    '<div style="flex:1;min-width:0;">' +
                    '<div style="font-weight:bold;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + window.fairEscape(file.name) + '</div>' +
                    '<div style="font-size:.7rem;color:#aaa;margin-top:2px;">' + sz + '</div>' +
                    '</div></div></div>';
            });
            html += '</div>';
            if (nextPageToken) {
                html += '<div style="text-align:center;margin-top:20px;">' +
                    '<button class="fair-load-more" data-folder="' + folderId + '" data-token="' + nextPageToken + '" ' +
                    'style="background:rgba(0,243,255,.1);border:1px solid #00f3ff;color:#00f3ff;padding:8px 24px;border-radius:30px;cursor:pointer;">🔄 Load More</button>' +
                    '</div>';
            }
        }

        listDiv.innerHTML = html;
        listDiv.style.display = 'block';
        window.setFairProgress(100, 'Done!');
        loader.style.display = 'none';

        var backBtn = document.getElementById('fairBackBtn');
        if (backBtn) {
            backBtn.onclick = function() {
                if (window.fairHistory.length >= 2) {
                    window.fairHistory.pop();
                    var prev = window.fairHistory[window.fairHistory.length - 1];
                    window.fairLoadFolder(prev.id, prev.name, false);
                }
            };
        }

        listDiv.querySelectorAll('.fair-item').forEach(function(el) {
            el.addEventListener('mouseenter', function() {
                el.style.borderColor = 'rgba(0,243,255,0.4)';
                el.style.background = 'rgba(0,243,255,0.05)';
            });
            el.addEventListener('mouseleave', function() {
                el.style.borderColor = 'rgba(255,255,255,0.1)';
                el.style.background = 'rgba(255,255,255,0.05)';
            });
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                var id = el.dataset.id;
                var name = el.dataset.name;
                var mime = el.dataset.mime;
                if (mime === 'application/vnd.google-apps.folder') {
                    window.fairLoadFolder(id, name, true);
                } else {
                    window.fairShowOptions(id, name, mime, e);
                }
            });
        });

        listDiv.querySelectorAll('.fair-load-more').forEach(function(btn) {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                btn.disabled = true;
                btn.textContent = '⏳ Loading...';
                try {
                    var folder = btn.dataset.folder,
                        token = btn.dataset.token;
                    var url2 = 'https://www.googleapis.com/drive/v3/files?q=\'' + folder +
                        '\' in parents and trashed=false&key=' + FAIR_API_KEY +
                        '&fields=files(id,name,mimeType,size),nextPageToken&orderBy=folder%2Cname&pageSize=50&pageToken=' + token;
                    var res2 = await fetch(url2);
                    var data2 = await res2.json();
                    if (data2.error) throw new Error(data2.error.message);
                    var grid = listDiv.querySelector('.fair-grid');
                    if (grid) {
                        (data2.files || []).forEach(function(file) {
                            var isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                            var icon = isFolder ? '📁' : '📄';
                            if (file.mimeType.includes('pdf')) icon = '📑';
                            else if (file.mimeType.includes('image')) icon = '🖼️';
                            else if (file.mimeType.includes('spreadsheet')) icon = '📊';
                            else if (file.mimeType.includes('document')) icon = '📝';
                            var sz = file.size ? (parseInt(file.size) < 1048576 ? (parseInt(file.size) / 1024).toFixed(1) + ' KB' : (parseInt(file.size) / 1048576).toFixed(2) + ' MB') : '';
                            var item = document.createElement('div');
                            item.className = 'fair-item';
                            item.dataset.id = file.id;
                            item.dataset.name = window.fairEscape(file.name);
                            item.dataset.mime = file.mimeType;
                            item.style.cssText = 'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px;cursor:pointer;transition:border-color .2s,background .2s;';
                            item.innerHTML = '<div style="display:flex;align-items:center;gap:12px;">' +
                                '<span style="font-size:2rem;">' + icon + '</span>' +
                                '<div style="flex:1;min-width:0;">' +
                                '<div style="font-weight:bold;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + window.fairEscape(file.name) + '</div>' +
                                '<div style="font-size:.7rem;color:#aaa;margin-top:2px;">' + sz + '</div>' +
                                '</div></div>';
                            item.addEventListener('mouseenter', function() { item.style.borderColor = 'rgba(0,243,255,.4)';
                                item.style.background = 'rgba(0,243,255,.05)'; });
                            item.addEventListener('mouseleave', function() { item.style.borderColor = 'rgba(255,255,255,.1)';
                                item.style.background = 'rgba(255,255,255,.05)'; });
                            item.addEventListener('click', function(ev) {
                                ev.stopPropagation();
                                if (file.mimeType === 'application/vnd.google-apps.folder') {
                                    window.fairLoadFolder(file.id, file.name, true);
                                } else {
                                    window.fairShowOptions(file.id, file.name, file.mimeType, ev);
                                }
                            });
                            grid.appendChild(item);
                        });
                        if (data2.nextPageToken) {
                            btn.dataset.token = data2.nextPageToken;
                            btn.disabled = false;
                            btn.textContent = '🔄 Load More';
                        } else {
                            btn.remove();
                        }
                    }
                } catch (err2) {
                    btn.disabled = false;
                    btn.textContent = '⚠️ Retry';
                    alert('Error loading more: ' + err2.message);
                }
            });
        });

    } catch (err) {
        clearInterval(fakeTimer);
        loader.style.display = 'none';
        errDiv.style.display = 'block';
        errDiv.innerHTML = '<div style="font-size:2rem;margin-bottom:8px;">❌</div>' +
            '<div>' + window.fairEscape(err.message) + '</div>' +
            '<button onclick="window.fairLoadFolder(\'' + folderId + '\',\'' + window.fairEscape(folderName || 'Root') + '\',false)" ' +
            'style="margin-top:14px;background:rgba(0,243,255,.1);border:1px solid #00f3ff;color:#00f3ff;padding:7px 20px;border-radius:20px;cursor:pointer;">🔄 Retry</button>';
    }
};

// ─── LOAD MAIN ──────────────────────────────────────────────
window.loadFairCopies = function() {
    window.fairHistory = [];
    window.fairLoadFolder(FAIR_ROOT_ID, 'Fair Copies', true);
};

window.checkAndLoadFair = function() {
    if (window.currentSection === 'section-game-fair') {
        // Ensure not already loaded
        if (document.getElementById('fair-file-list').children.length === 0) {
            window.loadFairCopies();
        }
    }
};

// ─── GLOBAL ZOOM TOGGLE ────────────────────────────────────
window.enableGlobalZoom = function() {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
        vp.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes, maximum-scale=5.0');
    } else {
        var newMeta = document.createElement('meta');
        newMeta.name = 'viewport';
        newMeta.content = 'width=device-width, initial-scale=1.0, user-scalable=yes, maximum-scale=5.0';
        document.head.appendChild(newMeta);
    }
};

window.disableGlobalZoom = function() {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
        vp.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no');
    }
};

console.log('✅ Fair loaded');