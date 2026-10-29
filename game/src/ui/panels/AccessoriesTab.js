// FILE: src/ui/panels/AccessoriesTab.js  (BARU — patch 0.2.5)
// Sub-tab Products → Aksesori: mockup visual tiap lini aksesori (earbuds, jam pintar, charger)
// menurut tier dan status terbuka/tertutup. Hanya tampilan: angka diambil dari
// EcosystemSystem.getLinePreview(), tidak ada logika ekonomi di sini. Mengatur tier/harga/buka-tutup
// tetap di Market → Ekosistem (tombol tautan memakai data-nav, ditangani main.js).
import { t } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { ensureRegionalStyle } from './RegionalStyle.js';
import { ECO_LINES, ECO_TIERS, ECO_TIER_META } from '../../data/ecosystem.data.js';
import { renderAccessoryMockup, renderAccessoryThumbnail } from '../phone/AccessoryMockup.js';

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _n(v) { v = Number(v); return isFinite(v) ? v : 0; }
function money(n) { return formatCurrency(Math.round(_n(n))); }
function int(n) { return Math.round(_n(n)).toLocaleString('en-US'); }
function kpi(label, val) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
}

function _tierStrip(line, p) {
    var cells = ECO_TIERS.map(function (tier) {
        var current = p.open && p.tier === tier;
        return '<div style="flex:1;text-align:center;padding:6px 2px;border-radius:10px;' +
            (current ? 'outline:2px solid #0a84ff;' : 'opacity:.8;') + '">' +
            renderAccessoryThumbnail(line.id, tier, 56, p.open) +
            '<div class="rg-row-meta">' + esc(t(ECO_TIER_META[tier].nameKey)) + '</div></div>';
    }).join('');
    return '<div style="display:flex;gap:6px;margin:6px 0">' + cells + '</div>';
}

function _lineCard(sys, line) {
    var p = sys.getLinePreview(line.id);
    if (!p) return '';
    var name = esc(t(line.nameKey));
    var closedLabel = t('eco.prod.closed');
    if (!p.yearOk) {
        return '<div class="card"><div class="card-title">' + name + '</div>' +
            renderAccessoryMockup(line.id, 'basic', { size: 120, open: false, closedLabel: closedLabel }) +
            '<div class="rg-desc">' + esc(t('eco.line.locked', { year: line.minYear })) + '</div></div>';
    }
    var tierName = esc(t(ECO_TIER_META[p.tier].nameKey));
    var title = name + ' · ' + (p.open ? tierName : esc(t('eco.prod.closed')));
    var stats = p.open
        ? '<div class="rg-kpis">' +
            kpi(t('eco.line.price'), money(p.price)) +
            kpi(t('eco.line.units'), int(p.units)) +
            kpi(t('eco.line.revenue'), money(p.revenue)) +
            kpi(t('eco.line.cost'), money(p.cost)) +
          '</div>'
        : '<div class="rg-desc">' + esc(t('eco.prod.closedHint', { price: money(p.setupCost) })) + '</div>';
    return '<div class="card"><div class="card-title">' + title + '</div>' +
        renderAccessoryMockup(line.id, p.tier, { size: 180, open: p.open, closedLabel: closedLabel }) +
        _tierStrip(line, p) + stats +
        '<div class="rg-btn-row"><button class="btn-secondary" data-nav="market" data-nav-sub="ecosystem">' +
        esc(t('eco.prod.manage')) + '</button></div></div>';
}

export function renderAccessoriesTab(params) {
    ensureRegionalStyle();
    var sys = params && params.ecosystemSystem;
    if (!sys) return '';
    var lines = ECO_LINES.map(function (l) { return _lineCard(sys, l); }).join('');
    return '<div class="card"><div class="card-title">' + esc(t('eco.prod.title')) + '</div>' +
        '<div class="rg-desc">' + esc(t('eco.prod.hint')) + '</div></div>' + lines;
}
