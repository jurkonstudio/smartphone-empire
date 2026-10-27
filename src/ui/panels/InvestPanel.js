// FILE: src/ui/panels/InvestPanel.js  (v2029.1)
// Tab "Investasi" di HQ: status pasar (plafon, tekanan rival, biaya volume),
// investasi efisiensi pabrik, dan akuisisi merek rival. Logika ada di EconBrakeSystem.
import { LanguageService } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { ensureRegionalStyle } from './RegionalStyle.js';
import { buildCompetitorProducts } from '../../data/competitor-products.model.js';
import { acqContext, acqThumbStripHtml, acqProductionHtml } from './AcquisitionShowcase.js';

function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function L(id, en) { return _en() ? en : id; }
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function money(n) { return formatCurrency(n); }
function pct(x) { return Math.round(x * 100) + '%'; }
function meter(ratio, color) {
    return '<div class="rg-meter"><i style="width:' + Math.round(Math.max(0, Math.min(1, ratio)) * 100) +
        '%;background:' + color + '"></i></div>';
}
function kpi(label, val) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
}

function _marketCard(sum) {
    var u = sum.utilization;
    var color = u < 0.6 ? '#34c759' : (u < 0.95 ? '#ff9f0a' : '#ff453a');
    var verdict = u < 0.6
        ? L('Pasar masih longgar. Penjualan belum terpotong.', 'Market has room. Sales are not being clipped.')
        : (u < 0.95
            ? L('Mendekati plafon pasar. Rival mulai bereaksi.', 'Nearing the market ceiling. Rivals are starting to react.')
            : L('Plafon pasar tercapai. Penjualan terpotong ' + pct(1 - sum.lastFactor) + ' dan rival menekan keras.',
                'Market ceiling reached. Sales are clipped ' + pct(1 - sum.lastFactor) + ' and rivals are pushing hard.'));
    return '<div class="card"><div class="card-title">' + esc(L('Kapasitas Pasar', 'Market Capacity')) + '</div>' +
        '<div class="rg-kpis">' +
            kpi(L('Plafon/hari', 'Ceiling/day'), sum.capacityPerDay.toLocaleString('en-US') + ' unit') +
            kpi(L('Utilisasi', 'Utilization'), pct(u)) +
            kpi(L('Tekanan rival', 'Rival pressure'), 'x' + sum.rivalMult.toFixed(2)) +
            kpi(L('Biaya volume', 'Volume cost'), 'x' + sum.volumeMultNow.toFixed(2)) +
        '</div>' + meter(u, color) +
        '<div class="rg-row-meta" style="margin-top:6px;">' + esc(verdict) + '</div>' +
        '<div class="rg-row-meta" style="margin-top:4px;">' + esc(L(
            'Produksi 30 hari terakhir: ', 'Production, last 30 days: ')) + sum.trailingUnits.toLocaleString('en-US') + ' unit</div></div>';
}

function _efficiencyCard(econ, cash) {
    var info = econ.getEfficiencyInfo();
    var title = L('Investasi Pabrik', 'Factory Investment');
    var desc = L('Pabrik lebih efisien melandaikan kurva biaya volume dan memangkas biaya dasar komponen. Ada biaya pemeliharaan bulanan.',
                 'A more efficient factory flattens the volume cost curve and trims base component cost. Has a monthly upkeep.');
    var now = '<div class="rg-row-meta">' + esc(L('Level ', 'Level ')) + info.level + '/' + info.maxLevel +
        ' · ' + esc(L('kurva volume ', 'volume slope ')) + (info.slopeNow * 100).toFixed(1) + '%' +
        ' · ' + esc(L('potongan komponen ', 'parts discount ')) + pct(info.partsCutNow) +
        (info.upkeep ? ' · ' + esc(L('pemeliharaan ', 'upkeep ')) + money(info.upkeep) + L('/bln', '/mo') : '') + '</div>';
    var action;
    if (!info.nextLevel) {
        action = '<div class="rg-ok">' + esc(L('Level maksimum tercapai.', 'Maximum level reached.')) + '</div>';
    } else {
        var can = cash >= info.nextCost;
        action = '<div class="rg-row-meta" style="margin-top:6px;">' + esc(L('Naik ke level ', 'Upgrade to level ')) + info.nextLevel +
            ': <b>' + money(info.nextCost) + '</b></div>' +
            '<div class="rg-btn-row"><button class="' + (can ? 'btn-primary' : 'btn-secondary') + '" data-econ-eff' +
            (can ? '' : ' disabled') + '>' + esc(can ? L('Investasi', 'Invest') : L('Dana kurang', 'Not enough cash')) + '</button></div>';
    }
    return '<div class="card"><div class="card-title">' + esc(title) + '</div><div class="rg-desc">' + esc(desc) + '</div>' + now + action + '</div>';
}

function _acquisitionCard(econ, cash) {
    var block = econ.acquisitionBlockReason();
    var owned = econ._e().acquired;
    var head = '<div class="card-title">' + esc(L('Akuisisi Merek', 'Brand Acquisition')) + '</div>' +
        '<div class="rg-desc">' + esc(L('Beli merek rival untuk memperluas plafon pasar dan melemahkan tekanannya. Ada biaya integrasi bulanan.',
            'Buy a rival brand to expand your market ceiling and weaken its pressure. Has a monthly integration cost.')) + '</div>';
    var ownedHtml = owned.length
        ? '<div class="rg-row-meta">' + esc(L('Dimiliki: ', 'Owned: ')) + owned.map(function (a) { return esc(a.name); }).join(', ') +
          ' · ' + esc(L('plafon +', 'ceiling +')) + pct(econ.getAcquisitionCapBonus()) + '</div>'
        : '';
    // Setelah diakuisisi: lini produksi merek itu (mockup + volume & margin estimasi).
    var productionHtml = owned.map(function (a) {
        try { return acqProductionHtml(a); } catch (e) { return ''; }
    }).join('');
    var lock = block ? '<div class="rg-lock">' + esc(block) + '</div>' : '';
    var targets = econ.getAcquisitionTargets();
    var rowsAll = targets.map(function (tg) {
        var can = !block && cash >= tg.price;
        // Ringkasan produk & margin rival (estimasi) langsung di baris target,
        // plus deretan mockup produk sebagai pratinjau (tanpa angka produksi).
        var prodLine = '';
        var strip = '';
        try {
            var pd = buildCompetitorProducts(tg.id, acqContext(tg.id));
            if (pd) {
                prodLine = '<div class="rg-row-meta">' + pd.summary.liveCount + esc(L(' produk aktif', ' active products')) +
                    ' \u00b7 ' + esc(L('margin rata-rata ~', 'avg margin ~')) + pct(pd.summary.marginPct) + '</div>';
                strip = acqThumbStripHtml(pd, false);
            }
        } catch (e) { /* ringkasan opsional */ }
        return '<div class="rg-row" style="display:block;padding:8px 0;border-bottom:1px solid var(--border);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<div style="min-width:0;flex:1;"><b>' + esc(tg.name) + '</b><div class="rg-row-meta">' + esc(L('pangsa ', 'share ')) + pct(tg.share) +
            ' \u00b7 ' + esc(L('plafon +', 'ceiling +')) + pct(tg.capBonus) + ' \u00b7 ' + money(tg.price) + '</div>' + prodLine + strip + '</div>' +
            '<button class="' + (can ? 'btn-primary' : 'btn-secondary') + '" data-econ-acq="' + esc(tg.id) + '"' + (can ? '' : ' disabled') + '>' +
            esc(L('Akuisisi', 'Acquire')) + '</button></div>' +
            '<button class="btn-secondary" data-econ-acq-products="' + esc(tg.id) + '" style="width:100%;margin-top:6px;min-height:34px;font-size:12px;">' +
            esc(L('Lihat produk & margin', 'View products & margin')) + '</button></div>';
    });
    var rows = rowsAll.slice(0, 6).join('');
    if (rowsAll.length > 6) {
        rows += '<details><summary class="rg-row-meta" style="cursor:pointer;padding:8px 0;">' +
            esc(L('Tampilkan ' + (rowsAll.length - 6) + ' merek lainnya', 'Show ' + (rowsAll.length - 6) + ' more brands')) +
            '</summary>' + rowsAll.slice(6).join('') + '</details>';
    }
    return '<div class="card">' + head + ownedHtml + productionHtml + lock + rows + '</div>';
}

export function renderInvestPanel() {
    try { ensureRegionalStyle(); } catch (e) {}
    var g = window.__game;
    var econ = g && g.econ;
    if (!econ) return '<div class="card"><div class="rg-row-meta">' + esc(L('Sistem belum siap.', 'System not ready.')) + '</div></div>';
    var cash = 0;
    try { cash = g.state.get().cash || 0; } catch (e) {}
    return _marketCard(econ.getSummary()) + _efficiencyCard(econ, cash) + _acquisitionCard(econ, cash);
}
