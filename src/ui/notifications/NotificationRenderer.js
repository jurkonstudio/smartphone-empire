// FILE: src/ui/notifications/NotificationRenderer.js
// Gaya tunggal: Dynamic Island iPhone.
// Anti-duplikat + auto-collapse expanded + cap max 3 notifikasi aktif.

var _activeNodes = [];
var _recentMessages = {};
var MAX_ACTIVE = 1;          // ubah ke 1 kalau mau super simple
var DEDUPE_WINDOW = 800;     // ms — jendela dedupe by message

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function iconForType(type) {
    var map = { info: 'i', success: '✓', warning: '!', error: '✕', news: '📰' };
    return map[type] || 'i';
}

function colorForType(type) {
    var map = {
        info:    '#0a84ff',
        success: '#34c759',
        warning: '#ff9f0a',
        error:   '#ff453a',
        news:    '#a855f7'
    };
    return map[type] || '#0a84ff';
}

function _removeNode(node) {
    if (!node || !node.parentNode) return;
    var idx = _activeNodes.indexOf(node);
    if (idx >= 0) _activeNodes.splice(idx, 1);
    node.classList.add('notif-out');
    setTimeout(function () {
        if (node.parentNode) node.remove();
    }, 320);
}

function _scheduleDismiss(node, durationMs) {
    var removed = false;
    function doRemove() {
        if (removed) return;
        removed = true;
        _removeNode(node);
    }
    var t = setTimeout(doRemove, durationMs || 4500);
    return function () {
        if (removed) return;
        removed = true;
        clearTimeout(t);
        _removeNode(node);
    };
}

function _attachActionButton(node, payload, dismiss) {
    if (!payload || !payload.action || typeof payload.action.onClick !== 'function') return;
    var btn = document.createElement('button');
    btn.className = 'notif-action-btn';
    btn.textContent = payload.action.label || 'Baca';
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        try { payload.action.onClick(); }
        catch (err) { console.error('[Notif] action error:', err); }
        dismiss();
    });
    var target = node.querySelector('.notif-island-expanded') || node;
    target.appendChild(btn);
}

export function renderNotification(container, payload) {
    if (!container || !payload) return;

    var type = payload.type || 'info';
    var msg = payload.message || '';

    // Dedupe by message dalam jendela singkat
    var now = Date.now();
    var last = _recentMessages[msg];
    if (last && (now - last) < DEDUPE_WINDOW) return;
    _recentMessages[msg] = now;

    // Bersihkan timestamp lama
    for (var k in _recentMessages) {
        if ((now - _recentMessages[k]) > 5000) delete _recentMessages[k];
    }

    // Cap jumlah notifikasi aktif
    while (_activeNodes.length >= MAX_ACTIVE) {
        var oldest = _activeNodes[0];
        if (oldest && oldest.parentNode) oldest.parentNode.removeChild(oldest);
        _activeNodes.shift();
    }

    var accent = colorForType(type);
    var icon = iconForType(type);

    var node = document.createElement('div');
    node.className = 'notif-island notif-' + type;

    node.innerHTML =
        '<div class="notif-island-compact">' +
        '<span class="notif-island-ico" style="color:' + accent + ';">' + icon + '</span>' +
        '<span class="notif-island-text-compact">' + escapeHtml(msg) + '</span>' +
        '<span class="notif-island-dot" style="background:' + accent + ';"></span>' +
        '</div>' +
        '<div class="notif-island-expanded">' +
        '<div class="notif-island-expanded-head">' +
        '<span class="notif-island-ico-big" style="color:' + accent + ';">' + icon + '</span>' +
        '<span class="notif-island-type">' + escapeHtml(type.toUpperCase()) + '</span>' +
        '</div>' +
        '<div class="notif-island-text-full">' + escapeHtml(msg) + '</div>' +
        '</div>';

    var expanded = false;
    var autoCollapseTimer = null;
    var dismiss = _scheduleDismiss(node, payload.durationMs || 4500);

    node.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('.notif-action-btn')) return;
        e.stopPropagation();
        if (!expanded) {
            node.classList.add('expanded');
            expanded = true;
            if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
            autoCollapseTimer = setTimeout(function () {
                if (node.parentNode) {
                    node.classList.remove('expanded');
                    expanded = false;
                }
            }, 6000);
        } else {
            if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
            dismiss();
        }
    });

    container.appendChild(node);
    _activeNodes.push(node);

    _attachActionButton(node, payload, dismiss);
}

export function getActiveRendererIdPublic() {
    return 'dynamic_island';
}
