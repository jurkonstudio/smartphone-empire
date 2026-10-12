// FILE: src/ui/notifications/NotificationRenderer.js
// Dispatcher + 4 renderer per era, dengan support action button.
import { state } from '../../core/GameState.js';
import { getEraById, getEraForYear, UI_ERAS } from '../../data/ui-era.data.js';

var VALID_RENDERERS = ['classic', 'glossy', 'flat', 'dynamic_island'];

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function iconForType(type, eraStyle) {
    if (eraStyle === 'lcd') {
        var mapA = { info: '#', success: '#', warning: '!', error: 'x' };
        return mapA[type] || '#';
    }
    var mapB = { info: 'i', success: 'OK', warning: '!', error: 'X' };
    return mapB[type] || 'i';
}

function colorForType(type) {
    var map = {
        info:    '#2196F3',
        success: '#4CAF50',
        warning: '#FF9800',
        error:   '#EF4444',
        news:    '#8b5cf6'
    };
    return map[type] || '#2196F3';
}

function getActiveRendererId() {
    var data;
    try { data = state.get(); }
    catch (e) { return 'classic'; }

    var eraId = (data && data.era) ? data.era : null;

    if (eraId) {
        for (var i = 0; i < UI_ERAS.length; i++) {
            if (UI_ERAS[i].id === eraId && VALID_RENDERERS.indexOf(UI_ERAS[i].renderer) !== -1) {
                return UI_ERAS[i].renderer;
            }
        }
    }

    try {
        var year = data && data.time ? data.time.currentYear : 2000;
        var eraByYear = getEraForYear(year);
        if (eraByYear && VALID_RENDERERS.indexOf(eraByYear.renderer) !== -1) return eraByYear.renderer;
    } catch (e) {}

    return 'classic';
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
    var t1 = setTimeout(doRemove, durationMs || 2800);
    var t2 = setTimeout(function () { if (node.parentNode) node.remove(); }, (durationMs || 2800) + 1500);
    return function () { clearTimeout(t1); clearTimeout(t2); doRemove(); };
}

function renderFallback(container, payload) {
    var node = document.createElement('div');
    node.style.cssText = 'background:#202020;color:#fff;padding:12px 16px;border-radius:8px;border:1px solid #333;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,0.5);max-width:calc(100vw - 40px);word-wrap:break-word;';
    node.textContent = payload.message || '';
    container.appendChild(node);
    scheduleDismiss(node, payload.durationMs || 2800);
}

// ============================================================
// Action Button helper — dipasang di semua renderer
// ============================================================
function attachActionButton(node, container, payload) {
    if (!payload || !payload.action || typeof payload.action.onClick !== 'function') return;
    var btn = document.createElement('button');
    btn.className = 'notif-action-btn';
    btn.textContent = payload.action.label || 'Baca';
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        try { payload.action.onClick(); }
        catch (err) { console.error('[Notif] action error:', err); }
        // dismiss saat diklik
        if (node.parentNode) {
            node.classList.add('notif-out');
            setTimeout(function () { if (node.parentNode) node.remove(); }, 300);
        }
    });
    node.appendChild(btn);
}

// ============================================================
// ERA 1 — CLASSIC
// ============================================================
function renderClassic(container, payload) {
    var node = document.createElement('div');
    node.className = 'notif-classic notif-' + (payload.type || 'info');
    node.innerHTML =
        '<div class="notif-classic-head">' +
        '<span class="notif-classic-ico">' + iconForType(payload.type, 'lcd') + '</span>' +
        '<span class="notif-classic-title">' + escapeHtml((payload.type || 'INFO').toUpperCase()) + '</span>' +
        '</div>' +
        '<div class="notif-classic-body">' + escapeHtml(payload.message) + '</div>' +
        '<div class="notif-classic-bar"></div>';
    container.appendChild(node);
    attachActionButton(node, container, payload);
    scheduleDismiss(node, payload.durationMs || 2500);
}

// ============================================================
// ERA 2 — GLOSSY
// ============================================================
function renderGlossy(container, payload) {
    var accent = colorForType(payload.type);
    var node = document.createElement('div');
    node.className = 'notif-glossy notif-' + (payload.type || 'info');
    node.innerHTML =
        '<div class="notif-glossy-icon" style="background:' + accent + ';">' +
        '<span>' + iconForType(payload.type, 'modern') + '</span>' +
        '</div>' +
        '<div class="notif-glossy-content">' +
        '<div class="notif-glossy-text">' + escapeHtml(payload.message) + '</div>' +
        '</div>';
    container.appendChild(node);
    attachActionButton(node, container, payload);
    scheduleDismiss(node, payload.durationMs || 3000);
}

// ============================================================
// ERA 3 — FLAT
// ============================================================
function renderFlat(container, payload) {
    var accent = colorForType(payload.type);
    var node = document.createElement('div');
    node.className = 'notif-flat notif-' + (payload.type || 'info');
    node.innerHTML =
        '<div class="notif-flat-accent" style="background:' + accent + ';"></div>' +
        '<div class="notif-flat-icon" style="background:' + accent + '22;color:' + accent + ';">' +
        '<span>' + iconForType(payload.type, 'modern') + '</span>' +
        '</div>' +
        '<div class="notif-flat-body">' +
        '<div class="notif-flat-msg">' + escapeHtml(payload.message) + '</div>' +
        '</div>';
    container.appendChild(node);
    attachActionButton(node, container, payload);
    scheduleDismiss(node, payload.durationMs || 3200);
}

// ============================================================
// ERA 4 — DYNAMIC ISLAND
// ============================================================
function renderDynamicIsland(container, payload) {
    var accent = colorForType(payload.type);
    var node = document.createElement('div');
    node.className = 'notif-island notif-' + (payload.type || 'info');

    node.innerHTML =
        '<div class="notif-island-compact">' +
        '<span class="notif-island-ico" style="color:' + accent + ';">' +
        iconForType(payload.type, 'modern') +
        '</span>' +
        '<span class="notif-island-text-compact">' + escapeHtml(payload.message) + '</span>' +
        '<span class="notif-island-dot" style="background:' + accent + ';"></span>' +
        '</div>' +
        '<div class="notif-island-expanded">' +
        '<div class="notif-island-expanded-head">' +
        '<span class="notif-island-ico-big" style="color:' + accent + ';">' +
        iconForType(payload.type, 'modern') +
        '</span>' +
        '<span class="notif-island-type">' + escapeHtml((payload.type || 'INFO').toUpperCase()) + '</span>' +
        '</div>' +
        '<div class="notif-island-text-full">' + escapeHtml(payload.message) + '</div>' +
        '</div>';

    var expanded = false;
    var dismissHandle = null;

    node.addEventListener('click', function (e) {
        // Kalau klik di tombol action, jangan toggle expand
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
    attachActionButton(node, container, payload);
    dismissHandle = scheduleDismiss(node, payload.durationMs || 5000);
}

// ============================================================
// DISPATCHER
// ============================================================
var RENDERERS = {
    classic:        renderClassic,
    glossy:         renderGlossy,
    flat:           renderFlat,
    dynamic_island: renderDynamicIsland
};

export function renderNotification(container, payload) {
    if (!container) return;
    var rendererId = getActiveRendererId();
    var renderer = RENDERERS[rendererId];
    if (!renderer) {
        renderFallback(container, payload);
        return;
    }
    try {
        renderer(container, payload);
    } catch (err) {
        console.error('[NotificationRenderer] gagal render:', err);
        renderFallback(container, payload);
    }
}

export function getActiveRendererIdPublic() {
    return getActiveRendererId();
}
