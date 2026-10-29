// FILE: src/ui/panels/PromotionPanel.js  (BARU)
// Sub-tab "Promosi" di panel Pasar: peta permintaan dunia, brand wilayah, musim promosi,
// paket Global/Asia/Eropa, kampanye aktif, dan hasil penjualan per wilayah.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { REGION_IDS, SCOPE_IDS, REGION_COLORS } from '../../data/region.data.js';
import { getPackageById, getPackagesByScope } from '../../data/promotion.data.js';
import { getSegment } from '../../data/market-nav.data.js';
import { loc } from '../../systems/MarketNavSystem.js';
import { ensureRegionalStyle } from './RegionalStyle.js';

var _productId = null;

function esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function regionName(r) { return t('region.' + r); }
function dot(r) { return '<span class="rg-dot" style="background:' + REGION_COLORS[r] + '"></span>'; }
function pct(v, d) { return (v * 100).toFixed(d == null ? 0 : d) + '%'; }

export function setPromoProduct(id) {
    var cat = (window.__game && window.__game.state.get().products.catalog) || [];
    var found = cat.find(function (p) { return String(p.id) === String(id); });
    _productId = found ? found.id : id;
}
export function getPromoProduct() { return _productId; }

function _selling(data) {
    return (data.products.catalog || []).filter(function (p) { return p.status === 'selling'; });
}

function _pickProduct(list) {
    if (!list.length) return null;
    var found = list.find(function (p) { return p.id === _productId; });
    if (!found) { found = list[0]; _productId = found.id; }
    return found;
}

// ------------------------------------------------------------ sections

function _seasonCard(ps) {
    var info = ps.getSeasonInfo();
    var rows = REGION_IDS.map(function (r) {
        var cur = info[r];
        var label;
        if (cur.key) {
            label = '<span class="rg-tag good">' + esc(t(cur.key)) + ' ×' + cur.mult.toFixed(2) + '</span>';
        } else {
            var nx = ps.getNextSeason(r);
            label = nx
                ? '<span class="rg-tag">' + esc(t('promo.season.next', { event: t(nx.key), n: nx.monthsAway, mult: nx.mult.toFixed(2) })) + '</span>'
                : '<span class="rg-tag">' + esc(t('promo.season.normal')) + '</span>';
        }
        return '<div class="rg-row"><div class="rg-row-name">' + dot(r) + esc(regionName(r)) + '</div>' + label + '</div>';
    }).join('');
    return '<div class="card"><div class="card-title">' + esc(t('promo.section.season')) + '</div>' + rows + '</div>';
}

function _demandCard(ps) {
    var w = ps.getWeights();
    var brand = ps.getBrand();
    var split = '<div class="rg-split">' + REGION_IDS.map(function (r) {
        return '<i style="width:' + (w[r] * 100).toFixed(1) + '%;background:' + REGION_COLORS[r] + '"></i>';
    }).join('') + '</div>';

    var rows = REGION_IDS.map(function (r) {
        var b = brand[r];
        var bonus = Math.round(40 * (b / 100));
        return '<div class="rg-row"><div class="rg-row-main">' +
            '<div class="rg-row-name">' + dot(r) + esc(regionName(r)) + '</div>' +
            '<div class="rg-row-meta">' + esc(t('promo.brand')) + ' ' + Math.round(b) + '/100 · ' +
            esc(t('promo.brand.bonus', { n: bonus })) + '</div>' +
            '<div class="rg-meter"><i style="width:' + Math.round(b) + '%;background:' + REGION_COLORS[r] + '"></i></div>' +
            '</div><div class="rg-val">' + pct(w[r]) + '</div></div>';
    }).join('');

    return '<div class="card"><div class="card-title">' + esc(t('promo.section.demand')) + '</div>' +
        '<div class="rg-row-meta">' + esc(t('promo.demand.share')) + '</div>' + split + rows + '</div>';
}

// Tag segmen target + kecocokan produk (hanya paket segmen).
function _segmentTags(ps, product, pkg) {
    if (!pkg.segment) return '';
    var seg = getSegment(pkg.segment);
    if (!seg) return '';
    var nav = window.__game && window.__game.marketNav;
    var out = '<span class="rg-tag info">' + esc(seg.icon + ' ' + loc(seg.name)) + '</span>';
    if (nav && nav.getSegmentFit) {
        var fit = nav.getSegmentFit(product, pkg.segment);
        var cls = fit >= 1.0 ? 'good' : (fit < 0.75 ? 'warn' : '');
        out += '<span class="rg-tag ' + cls + '">' + esc(t('promo.seg_fit', { n: Math.round(fit * 100) })) + '</span>';
    }
    return out;
}

function _packageRow(ps, product, pkg, recId, activeIds) {
    var pv = ps.previewPackage(product.id, pkg.id);
    if (!pv) return '';
    var isActive = activeIds.indexOf(pkg.id) >= 0;
    var curYear = ps.state.data.time.currentYear;
    var lockedYear = !!(pkg.minYear && curYear < pkg.minYear);
    var badges = '';
    if (recId === pkg.id && !isActive) badges += '<span class="rg-tag info">' + esc(t('promo.badge.rec')) + '</span>';
    if (isActive) badges += '<span class="rg-tag good">' + esc(t('promo.badge.active')) + '</span>';

    var meta =
        '<span class="rg-tag">' + esc(formatCurrency(pv.cost)) + '</span>' +
        '<span class="rg-tag">' + esc(t('promo.days', { n: pv.durationDays })) + '</span>' +
        '<span class="rg-tag good">' + esc(t('promo.est', { n: Math.round(pv.estLift * 100) })) + '</span>' +
        '<span class="rg-tag">' + esc(t('promo.brandgain', { n: pv.brandGain })) + '</span>';
    meta += _segmentTags(ps, product, pkg);

    var btn;
    if (lockedYear) {
        btn = '<button class="btn-secondary rg-btn" disabled>' + esc(t('promo.locked_year', { n: pkg.minYear })) + '</button>';
    } else if (isActive) {
        btn = '<button class="btn-secondary rg-btn" disabled>' + esc(t('promo.badge.active')) + '</button>';
    } else if (pv.affordable) {
        btn = '<button class="btn-primary rg-btn" data-promo-open="' + pkg.id + '">' + esc(t('promo.btn.start')) + '</button>';
    } else {
        btn = '<button class="btn-secondary rg-btn" data-open-bank>' +
            esc(t('promo.btn.short', { n: formatCurrency(pv.shortfall) })) + ' · ' + esc(t('promo.btn.loan')) + '</button>';
    }

    return '<div class="rg-pkg' + (isActive ? ' rg-pkg-active' : '') + '">' +
        '<div class="rg-pkg-head"><div class="rg-pkg-name">' + esc(t('promo.pkg.' + pkg.id + '.name')) + '</div>' + badges + '</div>' +
        '<div class="rg-pkg-desc">' + esc(t('promo.pkg.' + pkg.id + '.desc')) + '</div>' +
        '<div class="rg-pkg-meta">' + meta + '</div>' + btn + '</div>';
}

function _scopeCard(ps, product, scope, recId, activeIds) {
    var title = '<div class="rg-title">' + dot(scope) + esc(regionName(scope)) + '</div>';
    var desc = '<div class="rg-desc">' + esc(t('promo.scope.' + scope + '.desc')) + '</div>';
    var fitHtml = '';
    if (scope === 'asia' || scope === 'europe' || scope === 'rest') {
        var fit = ps.getRegionFit(product, scope);
        var cls = fit >= 1.05 ? 'good' : (fit < 0.9 ? 'warn' : '');
        fitHtml = '<div class="rg-pkg-meta"><span class="rg-tag ' + cls + '">' +
            esc(t('promo.fit', { n: Math.round(fit * 100) })) + '</span>' +
            (scope === 'europe' && ps.state.data.time.currentYear >= 2018
                ? '<span class="rg-tag warn">' + esc(t('promo.note.europe_cost')) + '</span>' : '') +
            '</div>';
    }
    var rows = getPackagesByScope(scope).map(function (pkg) {
        return _packageRow(ps, product, pkg, recId, activeIds);
    }).join('');
    return '<div class="card">' + title + desc + fitHtml + rows + '</div>';
}

function _activeCard(ps, data) {
    var list = ps.getActive();
    var now = data.time.elapsedGameMinutes;
    var body;
    if (!list.length) {
        body = '<div class="rg-row-meta">' + esc(t('promo.active.none')) + '</div>';
    } else {
        body = list.map(function (c) {
            var prod = (data.products.catalog || []).find(function (p) { return p.id === c.productId; });
            var total = Math.max(1, c.endsAtMinute - c.startedAtMinute);
            var done = Math.min(100, Math.max(0, ((now - c.startedAtMinute) / total) * 100));
            var left = Math.max(0, Math.ceil((c.endsAtMinute - now) / 1440));
            return '<div class="rg-row"><div class="rg-row-main">' +
                '<div class="rg-row-name">' + dot(c.scope) + esc(t('promo.pkg.' + c.pkgId + '.name')) + '</div>' +
                '<div class="rg-row-meta">' + esc(prod ? prod.name : '-') + ' · ' + esc(t('promo.days_left', { n: left })) + '</div>' +
                '<div class="rg-meter"><i style="width:' + done.toFixed(0) + '%;background:' + REGION_COLORS[c.scope] + '"></i></div>' +
                '</div></div>';
        }).join('');
    }
    return '<div class="card"><div class="card-title">' + esc(t('promo.section.active')) + '</div>' + body + '</div>';
}

function _resultsCard(ps) {
    var st = ps.getStats();
    var totalUnits = 0;
    REGION_IDS.forEach(function (r) { totalUnits += st.byRegion[r].units; });
    var body;
    if (totalUnits <= 0) {
        body = '<div class="rg-row-meta">' + esc(t('promo.results.none')) + '</div>';
    } else {
        body = REGION_IDS.map(function (r) {
            var s = st.byRegion[r];
            var share = totalUnits > 0 ? s.units / totalUnits : 0;
            return '<div class="rg-row"><div class="rg-row-main">' +
                '<div class="rg-row-name">' + dot(r) + esc(regionName(r)) + '</div>' +
                '<div class="rg-row-meta">' + esc(t('promo.results.month')) + ': ' +
                Math.round(s.mUnits).toLocaleString('en-US') + ' ' + esc(t('promo.results.units')) + ' · ' +
                esc(formatCurrency(s.mRevenue)) + '</div>' +
                '<div class="rg-row-meta">' + esc(t('promo.results.total')) + ': ' +
                Math.round(s.units).toLocaleString('en-US') + ' ' + esc(t('promo.results.units')) + ' · ' +
                esc(formatCurrency(s.revenue)) + '</div>' +
                '<div class="rg-meter"><i style="width:' + (share * 100).toFixed(1) + '%;background:' + REGION_COLORS[r] + '"></i></div>' +
                '</div><div class="rg-val">' + pct(share, 1) + '</div></div>';
        }).join('');
    }
    body += '<div class="rg-sum"><span>' + esc(t('promo.results.spent')) + '</span><b>' +
        esc(formatCurrency(st.spent)) + '</b></div>';
    return '<div class="card"><div class="card-title">' + esc(t('promo.section.results')) + '</div>' + body + '</div>';
}

// ------------------------------------------------------------ panel utama

export function renderPromotionPanel() {
    ensureRegionalStyle();
    var g = window.__game;
    var ps = g.promotion;
    var data = g.state.get();
    var selling = _selling(data);

    var head = '<div class="rg-sub">' + esc(t('promo.sub')) + '</div>';

    if (!selling.length) {
        return head + _seasonCard(ps) + _demandCard(ps) +
            '<div class="card"><div class="empty" style="padding:24px 8px;">' +
            '<div class="empty-title">' + esc(t('promo.empty.title')) + '</div>' +
            '<div class="empty-desc">' + esc(t('promo.empty.desc')) + '</div></div></div>' + _resultsCard(ps);
    }

    var product = _pickProduct(selling);
    var chips = '<div class="card"><div class="card-title">' + esc(t('promo.section.product')) + '</div><div class="rg-chips">' +
        selling.map(function (p) {
            return '<button class="rg-chip' + (p.id === product.id ? ' active' : '') + '" data-promo-product="' + esc(String(p.id)) + '">' + esc(p.name) + '</button>';
        }).join('') + '</div></div>';

    var recId = ps.recommend(product.id);
    var activeIds = ps.getActive(product.id).map(function (c) { return c.pkgId; });

    var scopes = SCOPE_IDS.map(function (s) { return _scopeCard(ps, product, s, recId, activeIds); }).join('');

    return head + chips + _seasonCard(ps) + _demandCard(ps) + scopes + _activeCard(ps, data) + _resultsCard(ps);
}

// ------------------------------------------------------------ modal konfirmasi

function _segmentModalRow(product, pkg) {
    if (!pkg.segment) return '';
    var seg = getSegment(pkg.segment);
    if (!seg) return '';
    var nav = window.__game && window.__game.marketNav;
    var fit = (nav && nav.getSegmentFit) ? nav.getSegmentFit(product, pkg.segment) : 1;
    return '<div class="rg-sum"><span>' + esc(t('promo.modal.segment')) + '</span><b>' + esc(seg.icon + ' ' + loc(seg.name)) + ' · ' +
        esc(t('promo.seg_fit', { n: Math.round(fit * 100) })) + '</b></div>' +
        '<div class="rg-tip">' + esc(t('promo.modal.segment_hint')) + '</div>';
}

export function openPromoConfirmModal(pkgId) {
    ensureRegionalStyle();
    var g = window.__game;
    var ps = g.promotion;
    var pkg = getPackageById(pkgId);
    var data = g.state.get();
    var product = (data.products.catalog || []).find(function (p) { return p.id === _productId; });
    if (!pkg || !product) return;
    var pv = ps.previewPackage(product.id, pkgId);
    if (!pv) return;
    var w = ps.getWeights();
    var info = ps.getSeasonInfo();

    var regionRows = REGION_IDS.map(function (r) {
        var contrib = w[r] * pv.perRegion[r];
        if (contrib <= 0) return '';
        var s = info[r];
        return '<div class="rg-sum"><span>' + dot(r) + esc(regionName(r)) +
            (s.key ? ' <span class="rg-tag good">' + esc(t(s.key)) + '</span>' : '') +
            '</span><b>+' + (contrib * 100).toFixed(1) + '%</b></div>';
    }).join('');

    var html =
        '<div class="modal-title">' + esc(t('promo.modal.title')) + '</div>' +
        '<div class="modal-sub">' + esc(t('promo.pkg.' + pkgId + '.name')) + ' · ' + esc(product.name) + '</div>' +
        '<div class="rg-sum"><span>' + esc(t('promo.modal.cost')) + '</span><b>' + esc(formatCurrency(pv.cost)) + '</b></div>' +
        '<div class="rg-sum"><span>' + esc(t('promo.modal.duration')) + '</span><b>' + esc(t('promo.days', { n: pv.durationDays })) + '</b></div>' +
        '<div class="rg-sum"><span>' + esc(t('promo.modal.est')) + '</span><b style="color:var(--success,#34c759)">+' + (pv.estLift * 100).toFixed(1) + '%</b></div>' +
        '<div class="rg-sum"><span>' + esc(t('promo.brandgain', { n: pv.brandGain })) + '</span><b>' + esc(t('promo.modal.brand_hint')) + '</b></div>' +
        _segmentModalRow(product, pkg) +
        '<div class="card-title" style="margin:12px 0 4px;">' + esc(t('promo.modal.regions')) + '</div>' + regionRows +
        '<button class="btn-primary" data-promo-confirm="' + pkgId + '" style="width:100%;margin-top:14px;">' + esc(t('promo.modal.confirm')) + '</button>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:6px;">' + esc(t('promo.modal.cancel')) + '</button>';

    Modal.open('promo-confirm', html);
}
