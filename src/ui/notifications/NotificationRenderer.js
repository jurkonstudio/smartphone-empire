// FILE: src/ui/notifications/NotificationRenderer.js
// Gaya tunggal: Dynamic Island iPhone.
// Notifikasi tampil sebagai pill hitam di atas, expand saat diklik.
import { state } from '../../core/GameState.js';

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

function scheduleDismiss(node, durationMs, onEnd) {
    var removed = false;
    function doRemove() {
        if (removed) return;
        removed = true;
        if (!node.parentNode) return;
        node.classList.add('notif-out');
        setTimeout(function () {
            if (node.parentNode) node.remove();
            if (typeof onEnd === 'function') onEnd();
        }, 300);
    }
    var t1 = setTimeout(doRemove, durationMs || 4500);
    var t2 = setTimeout(function () { if (node.parentNode) node.remove(); }, (durationMs || 4500) + 1500);
    return function () { clearTimeout(t1); clearTimeout(t2); doRemove(); };
}

function attachActionButton(node, payload) {
    if (!payload || !payload.action || typeof payload.action.onClick !== 'function') return;
    var btn = document.createElement('button');
    btn.className = 'notif-action-btn';
    btn.textContent = payload.action.label || 'Baca';
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        try { payload.action.onClick(); }
        catch (err) { console.error('[Notif] action error:', err); }
        if (node.parentNode) {
            node.classList.add('notif-out');
            setTimeout(function () { if (node.parentNode) node.remove(); }, 300);
        }
    });
    node.appendChild(btn);
}

export function renderNotification(container, payload) {
    if (!container || !payload) return;

    var type = payload.type || 'info';
    var accent = colorForType(type);
    var icon = iconForType(type);

    var node = document.createElement('div');
    node.className = 'notif-island notif-' + type;

    node.innerHTML =
        '<div class="notif-island-compact">' +
        '<span class="notif-island-ico" style="color:' + accent + ';">' + icon + '</span>' +
        '<span class="notif-island-text-compact">' + escapeHtml(payload.message) + '</span>' +
        '<span class="notif-island-dot" style="background:' + accent + ';"></span>' +
        '</div>' +
        '<div class="notif-island-expanded">' +
        '<div class="notif-island-expanded-head">' +
        '<span class="notif-island-ico-big" style="color:' + accent + ';">' + icon + '</span>' +
        '<span class="notif-island-type">' + escapeHtml(type.toUpperCase()) + '</span>' +
        '</div>' +
        '<div class="notif-island-text-full">' + escapeHtml(payload.message) + '</div>' +
        '</div>';

    var expanded = false;
    var dismissHandle = null;

    node.addEventListener('click', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('notif-action-btn')) return;
        e.stopPropagation();
        if (!expanded) {
            node.classList.add('expanded');
            expanded = true;
        } else {
            if (dismissHandle) dismissHandle();
        }
    });

    container.appendChild(node);
    attachActionButton(node, payload);
    dismissHandle = scheduleDismiss(node, payload.durationMs || 4500);
}

export function getActiveRendererIdPublic() {
    return 'dynamic_island';
}
