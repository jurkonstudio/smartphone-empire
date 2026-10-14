// FILE: src/ui/panels/TimelinePanel.js
// ============================================================
// TimelinePanel — timeline vertikal ponsel & OS ikonik 2000-2026.
// v2026.2 — header compact, marker garis, no emoji.
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

    const headerHtml =
        '<div class="tl-header">' +
        '<div class="tl-header-row">' +
            '<span class="tl-header-year">' + currentYear + '</span>' +
            '<span class="tl-header-sep">·</span>' +
            '<span class="tl-header-era">' + escapeHtml(currentEra ? currentEra.name : '—') + '</span>' +
        '</div>' +
        '<div class="chip-bar tl-header-chips">' +
            '<button class="chip ' + (_filter === 'all'   ? 'active' : '') + '" data-timeline-filter="all">Semua</button>' +
            '<button class="chip ' + (_filter === 'phone' ? 'active' : '') + '" data-timeline-filter="phone">' +
                renderIcon('phone', 12) + ' Ponsel' +
            '</button>' +
            '<button class="chip ' + (_filter === 'os'    ? 'active' : '') + '" data-timeline-filter="os">' +
                renderIcon('disc', 12) + ' OS' +
            '</button>' +
        '</div>' +
        '</div>';

    const items = buildItems();
    const listHtml = renderTimelineList(items, currentYear);

    return headerHtml + listHtml;
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
        return '<div class="empty">' +
            '<div class="empty-title">Belum ada data timeline</div>' +
            '<div class="empty-desc">Data sejarah akan muncul seiring waktu berjalan.</div>' +
            '</div>';
    }

    let html = '<div class="tl-list">';
    let markerInserted = false;

    for (let i = 0; i < items.length; i++) {
        const it = items[i];

        if (!markerInserted && it.year > currentYear) {
            html += renderNowMarker(currentYear);
            markerInserted = true;
        }

        html += renderTimelineItem(it, currentYear);
    }

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
    return '<div class="tl-now-line">' +
        '<span class="tl-now-line-text">Sekarang · ' + currentYear + '</span>' +
        '<span class="tl-now-line-fill"></span>' +
        '</div>';
}

// ============================================================
// HELPERS
// ============================================================
function safeGetYear() {
    try { return state.get().time.currentYear; }
    catch (e) { return 2000; }
}
