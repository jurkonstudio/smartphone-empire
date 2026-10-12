// FILE: src/ui/notifications/NotificationRenderer.js
// ============================================================
// NotificationRenderer — dispatcher + 4 renderer per era.
// Signature: renderNotification(container, { message, type, durationMs })
// type: info | success | error | warning
// ============================================================
import { state } from '../../core/GameState.js';
import { getEraById, getEraForYear, UI_ERAS } from '../../data/ui-era.data.js';

const VALID_RENDERERS = ['classic', 'glossy', 'flat', 'dynamic_island'];

// ============================================================
// UTILITAS
// ============================================================
function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function iconForType(type, eraStyle) {
    if (eraStyle === 'lcd') {
        const map = { info: '■', success: '■', warning: '▲', error: '×' };
        return map[type] || '■';
    }
    const map = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    return map[type] || 'ℹ️';
}

function colorForType(type) {
    const map = {
        info:    '#2196F3',
        success: '#4CAF50',
        warning: '#FF9800',
        error:   '#EF4444'
    };
    return map[type] || '#2196F3';
}

// Ambil renderer aktif — sudah diperkuat guard untuk state.era invalid
function getActiveRendererId() {
    let data;
    try { data = state.get(); }
    catch (e) { return 'classic'; }

    const eraId = (data && data.era) ? data.era : null;

    // Coba cari dari eraId
    if (eraId) {
        const eraDef = UI_ERAS.find(e => e.id === eraId);
        if (eraDef && VALID_RENDERERS.includes(eraDef.renderer)) return eraDef.renderer;
    }

    // Fallback: cari dari tahun
    try {
        const year = data && data.time ? data.time.currentYear : 2000;
        const eraByYear = getEraForYear(year);
        if (eraByYear && VALID_RENDERERS.includes(eraByYear.renderer)) return eraByYear.renderer;
    } catch (e) {}

    return 'classic';
}

function scheduleDismiss(node, durationMs, onEnd) {
    let removed = false;
    const doRemove = () => {
        if (removed) return;
        removed = true;
        if (!node.parentNode) return;
        node.classList.add('notif-out');
        setTimeout(() => {
            if (node.parentNode) node.remove();
            if (typeof onEnd === 'function') onEnd();
        }, 300);
    };
    const t1 = setTimeout(doRemove, durationMs || 2800);
    // Fallback total jika setTimeout di-throttle di background tab
    const t2 = setTimeout(() => {
        if (node.parentNode) node.remove();
    }, (durationMs || 2800) + 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); doRemove(); };
}

// Fallback minimal — tidak bergantung CSS kelas
function renderFallback(container, { message, durationMs }) {
    const node = document.createElement('div');
    node.style.cssText = 'background:#202020;color:#fff;padding:12px 16px;border-radius:8px;border:1px solid #333;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,0.5);max-width:calc(100vw - 40px);word-wrap:break-word;';
    node.textContent = message || '';
    container.appendChild(node);
    scheduleDismiss(node, durationMs || 2800);
}

// ============================================================
// ERA 1 — CLASSIC (LCD MONOKROM)
// ============================================================
function renderClassic(container, { message, type, durationMs }) {
    const node = document.createElement('div');
    node.className = 'notif-classic notif-' + (type || 'info');
    node.innerHTML = `
        <div class="notif-classic-head">
            <span class="notif-classic-ico">${iconForType(type, 'lcd')}</span>
            <span class="notif-classic-title">${escapeHtml((type || 'INFO').toUpperCase())}</span>
        </div>
        <div class="notif-classic-body">${escapeHtml(message)}</div>
        <div class="notif-classic-bar"></div>
    `;
    container.appendChild(node);
    scheduleDismiss(node, durationMs || 2500);
}

// ============================================================
// ERA 2 — GLOSSY (iOS 6 STYLE)
// ============================================================
function renderGlossy(container, { message, type, durationMs }) {
    const accent = colorForType(type);
    const node = document.createElement('div');
    node.className = 'notif-glossy notif-' + (type || 'info');
    node.innerHTML = `
        <div class="notif-glossy-icon" style="background:${accent};">
            <span>${iconForType(type, 'modern')}</span>
        </div>
        <div class="notif-glossy-content">
            <div class="notif-glossy-text">${escapeHtml(message)}</div>
        </div>
    `;
    container.appendChild(node);
    scheduleDismiss(node, durationMs || 3000);
}

// ============================================================
// ERA 3 — FLAT (MATERIAL DESIGN)
// ============================================================
function renderFlat(container, { message, type, durationMs }) {
    const accent = colorForType(type);
    const node = document.createElement('div');
    node.className = 'notif-flat notif-' + (type || 'info');
    node.innerHTML = `
        <div class="notif-flat-accent" style="background:${accent};"></div>
        <div class="notif-flat-icon" style="background:${accent}22;color:${accent};">
            <span>${iconForType(type, 'modern')}</span>
        </div>
        <div class="notif-flat-body">
            <div class="notif-flat-msg">${escapeHtml(message)}</div>
        </div>
    `;
    container.appendChild(node);
    scheduleDismiss(node, durationMs || 3200);
}

// ============================================================
// ERA 4 — DYNAMIC ISLAND
// ============================================================
function renderDynamicIsland(container, { message, type, durationMs }) {
    const accent = colorForType(type);
    const node = document.createElement('div');
    node.className = 'notif-island notif-' + (type || 'info');

    node.innerHTML = `
        <div class="notif-island-compact">
            <span class="notif-island-ico" style="color:${accent};">
                ${iconForType(type, 'modern')}
            </span>
            <span class="notif-island-text-compact">${escapeHtml(message)}</span>
            <span class="notif-island-dot" style="background:${accent};"></span>
        </div>
        <div class="notif-island-expanded">
            <div class="notif-island-expanded-head">
                <span class="notif-island-ico-big" style="color:${accent};">
                    ${iconForType(type, 'modern')}
                </span>
                <span class="notif-island-type">${escapeHtml((type || 'INFO').toUpperCase())}</span>
            </div>
            <div class="notif-island-text-full">${escapeHtml(message)}</div>
        </div>
    `;

    let expanded = false;
    let dismissHandle = null;

    node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!expanded) {
            node.classList.add('expanded');
            expanded = true;
        } else {
            if (dismissHandle) dismissHandle();
        }
    });

    container.appendChild(node);
    dismissHandle = scheduleDismiss(node, durationMs || 5000);
}

// ============================================================
// DISPATCHER
// ============================================================
const RENDERERS = {
    classic:        renderClassic,
    glossy:         renderGlossy,
    flat:           renderFlat,
    dynamic_island: renderDynamicIsland
};

export function renderNotification(container, payload) {
    if (!container) return;
    const rendererId = getActiveRendererId();
    const renderer = RENDERERS[rendererId];
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
