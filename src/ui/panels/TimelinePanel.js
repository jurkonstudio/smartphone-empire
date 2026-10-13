// FILE: src/ui/panels/TimelinePanel.js
// ============================================================
// TimelinePanel — timeline vertikal ponsel & OS ikonik 2000-2026.
// Menampilkan milestone dari historical-timeline.data.js.
// Highlight posisi pemain saat ini + era aktif.
// ============================================================
import {
    TIMELINE_ERAS,
    ICONIC_PHONES,
    OS_HISTORY,
    getEraForYear
} from '../../data/historical-timeline.data.js';
import { state } from '../../core/GameState.js';
import { renderIcon } from '../icons/FeatureIcons.js';

let _filter = 'all'; // 'all' | 'phone' | 'os'

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function getTimelineFilter() { return _filter; }
export function setTimelineFilter(f) { _filter = f; }

// ============================================================
// MAIN RENDER
// ============================================================
export function renderTimelinePanel() {
    const currentYear = safeGetYear();
    const currentEra = getEraForYear(currentYear);

    const headerHtml = `
        <div class="card" style="padding:12px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <div>
                    <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Tahun Saat Ini</div>
                    <div style="font-size:22px;font-weight:800;color:var(--accent);letter-spacing:-0.02em;line-height:1.1;margin-top:2px;">${currentYear}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Era</div>
                    <div style="font-size:13px;font-weight:700;margin-top:2px;">${escapeHtml(currentEra ? currentEra.name : '—')}</div>
                </div>
            </div>
        </div>
    `;

    const filterHtml = `
        <div class="chip-bar" style="margin-top:8px;">
            <button class="chip ${_filter === 'all'   ? 'active' : ''}" data-timeline-filter="all">Semua</button>
            <button class="chip ${_filter === 'phone' ? 'active' : ''}" data-timeline-filter="phone">
                ${renderIcon('phone', 12, 'style="vertical-align:middle;margin-right:4px;"')} Ponsel
            </button>
            <button class="chip ${_filter === 'os'    ? 'active' : ''}" data-timeline-filter="os">
                ${renderIcon('disc', 12, 'style="vertical-align:middle;margin-right:4px;"')} OS
            </button>
        </div>
    `;

    const items = buildItems();
    const listHtml = renderTimelineList(items, currentYear);

    return headerHtml + filterHtml + listHtml;
}

// ============================================================
// BUILD ITEMS
// ============================================================
function buildItems() {
    const items = [];

    if (_filter === 'all' || _filter === 'phone') {
        ICONIC_PHONES.forEach(function (p) {
            items.push({
                kind: 'phone',
                year: p.year,
                title: p.model,
                subtitle: p.maker,
                text: p.feature,
                tags: p.tags || [],
                speculative: !!p.speculative
            });
        });
    }

    if (_filter === 'all' || _filter === 'os') {
        OS_HISTORY.forEach(function (o) {
            items.push({
                kind: 'os',
                year: o.year,
                title: o.os,
                subtitle: o.dev,
                text: o.feature,
                tags: o.tags || [],
                speculative: !!o.speculative
            });
        });
    }

    items.sort(function (a, b) {
        if (a.year !== b.year) return a.year - b.year;
        // phone dulu, lalu os
        if (a.kind !== b.kind) return a.kind === 'phone' ? -1 : 1;
        return 0;
    });

    return items;
}

// ============================================================
// TIMELINE LIST
// ============================================================
function renderTimelineList(items, currentYear) {
    if (!items.length) {
        return '<div class="empty"><div class="empty-ico">📅</div><div class="empty-title">Belum ada data</div></div>';
    }

    let html = '<div class="tl-list">';
    let markerInserted = false;

    for (let i = 0; i < items.length; i++) {
        const it = items[i];

        // Sisipkan marker "sekarang" tepat sebelum item pertama yang tahunnya > currentYear
        if (!markerInserted && it.year > currentYear) {
            html += renderNowMarker(currentYear);
            markerInserted = true;
        }

        html += renderTimelineItem(it, currentYear);
    }

    // Kalau semua item sudah lewat, marker di akhir
    if (!markerInserted) {
        html += renderNowMarker(currentYear);
    }

    html += '</div>';
    return html;
}

function renderTimelineItem(it, currentYear) {
    const isPast = it.year <= currentYear;
    const isCurrent = it.year === currentYear;
    const iconId = it.kind === 'phone' ? 'phone' : 'disc';
    const kindLabel = it.kind === 'phone' ? 'Ponsel' : 'OS';

    const stateClass = isCurrent ? 'tl-current' : (isPast ? 'tl-past' : 'tl-future');

    const tagsHtml = it.tags && it.tags.length
        ? '<div class="tl-tags">' + it.tags.map(function (t) {
            return '<span class="tl-tag">' + escapeHtml(t) + '</span>';
        }).join('') + '</div>'
        : '';

    const specBadge = it.speculative
        ? '<span class="tl-spec-badge">Spekulatif</span>'
        : '';

    return `
        <div class="tl-item ${stateClass} tl-kind-${it.kind}">
            <div class="tl-marker">
                <span class="tl-marker-icon">${renderIcon(iconId, 12)}</span>
            </div>
            <div class="tl-content">
                <div class="tl-top">
                    <span class="tl-year">${it.year}</span>
                    <span class="tl-kind-label">${kindLabel}</span>
                    ${specBadge}
                </div>
                <div class="tl-title">${escapeHtml(it.title)}</div>
                <div class="tl-subtitle">${escapeHtml(it.subtitle)}</div>
                <div class="tl-text">${escapeHtml(it.text)}</div>
                ${tagsHtml}
            </div>
        </div>
    `;
}

function renderNowMarker(currentYear) {
    return `
        <div class="tl-now-marker">
            <div class="tl-now-dot"></div>
            <div class="tl-now-label">
                <span class="tl-now-text">Posisi Anda Saat Ini</span>
                <span class="tl-now-year">${currentYear}</span>
            </div>
        </div>
    `;
}

// ============================================================
// HELPERS
// ============================================================
function safeGetYear() {
    try { return state.get().time.currentYear; }
    catch (e) { return 2000; }
}
