// FILE: src/ui/panels/AfterSalesPanel.js  (BARU — layanan pasca-jual)
// Sub-tab "Servis" di panel Pasar: kepuasan layanan, insiden cacat massal, pusat servis,
// serta garansi & dukungan update OS per produk.
// Logika ada di AfterSalesSystem.js; klik ditangani main.js lewat atribut data-as-*.
import { LanguageService } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { ensureRegionalStyle } from './RegionalStyle.js';
import { WARRANTY_OPTIONS, OS_YEARS_MIN, OS_YEARS_MAX } from '../../data/aftersales.data.js';

function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function L(id, en) { return _en() ? en : id; }
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function T(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_en() ? 'en' : 'id'] || o.en || o.id || '')); }
function money(n) { return formatCurrency(Math.round(n || 0)); }
function int(n) { return Math.round(n || 0).toLocaleString('en-US'); }
function pct(x, d) { return (x * 100).toFixed(d == null ? 0 : d) + '%'; }
function kpi(label, val) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
}

function _satMeta(s) {
    if (s >= 80) return { label: L('Sangat puas', 'Very satisfied'), color: '#34c759' };
    if (s >= 62) return { label: L('Puas', 'Satisfied'), color: '#30d158' };
    if (s >= 45) return { label: L('Biasa saja', 'Mixed'), color: '#ff9f0a' };
    return { label: L('Kecewa', 'Unhappy'), color: '#ff453a' };
}

function _summaryCard(sum) {
    var meta = _satMeta(sum.satisfaction), pv = sum.preview;
    var waitTxt = pv.waitMonths > 0.05 ? (pv.waitMonths.toFixed(1) + L(' bln antre', ' mo wait')) : L('Tanpa antre', 'No queue');
    return '<div class="card"><div class="card-title">' + esc(L('Layanan Pasca-Jual', 'After-Sales Service')) + '</div>' +
        '<div class="rg-desc">' + esc(L(
            'Garansi membuat ponsel lebih laku, tetapi setiap klaim ada biayanya. Pusat servis yang kecil membuat antrean menumpuk dan kepuasan turun. Kepuasan memengaruhi reputasi dan penjualan.',
            'Warranty helps phones sell, but every claim costs money. A small service network builds queues and lowers satisfaction. Satisfaction affects reputation and sales.')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(L('Kepuasan layanan', 'Service satisfaction')) + '</div>' +
        '<div class="rg-meter"><i style="width:' + Math.round(sum.satisfaction) + '%;background:' + meta.color + '"></i></div></div>' +
        '<div class="rg-val" style="color:' + meta.color + '">' + Math.round(sum.satisfaction) + ' · ' + esc(meta.label) + '</div></div>' +
        '<div class="rg-kpis">' +
            kpi(L('Unit dalam garansi', 'Units in warranty'), int(pv.inForce)) +
            kpi(L('Klaim/bln (perkiraan)', 'Claims/mo (est.)'), int(pv.claims)) +
            kpi(L('Kapasitas servis', 'Service capacity'), int(pv.capacity) + L('/bln', '/mo')) +
            kpi(L('Biaya/bln (perkiraan)', 'Cost/mo (est.)'), money(pv.total)) +
        '</div>' +
        '<div class="rg-row-meta">' + esc(waitTxt) + ' · ' + esc(L('antrean ', 'backlog ')) + '<b>' + int(sum.backlog) + '</b>' +
        ' · ' + esc(L('total klaim ditangani ', 'claims handled ')) + '<b>' + int(sum.stats.claims) + '</b></div>' +
        '</div>';
}

function _incidentCard(inc, cash) {
    var sevTxt = [L('Ringan', 'Minor'), L('Sedang', 'Moderate'), L('Parah', 'Severe')][Math.max(0, Math.min(2, inc.sev - 1))];
    function btn(choice, label, cost) {
        var can = cost <= 0 || cash >= cost;
        return '<button class="' + (can ? 'btn-primary' : 'btn-secondary') + '" data-as-incident="' + inc.id + '" data-as-val="' + choice + '"' + (can ? '' : ' disabled') + '>' +
            esc(label) + (cost > 0 ? ' · ' + esc(money(cost)) : '') + '</button>';
    }
    return '<div class="card" style="border:1px solid rgba(255,69,58,.5)"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
        '<div class="card-title" style="margin:0;">' + esc(L('Cacat massal: ', 'Mass defect: ')) + esc(inc.name) + '</div>' +
        '<div class="rg-tag warn">' + esc(sevTxt) + '</div></div>' +
        '<div class="rg-desc">' + esc(L(
            'Perkiraan ' + int(inc.affectedUnits) + ' unit terdampak. Putuskan dalam ' + inc.monthsLeft + ' bulan, atau dianggap diabaikan.',
            'About ' + int(inc.affectedUnits) + ' units affected. Decide within ' + inc.monthsLeft + ' month(s), or it counts as ignored.')) + '</div>' +
        '<div class="rg-row-meta">' + esc(L('Recall: biaya terbesar, masalah selesai, reputasi naik. Servis gratis: separuh biaya, sisa klaim sekitar 40%. Abaikan: gratis di muka, tetapi klaim tetap datang, reputasi dan penjualan turun.',
            'Recall: biggest cost, problem solved, reputation rises. Free service: half the cost, about 40% of claims remain. Ignore: free upfront, but claims still come and reputation and sales drop.')) + '</div>' +
        '<div class="rg-btn-row">' + btn('recall', L('Recall', 'Recall'), inc.recallCost) + btn('campaign', L('Servis gratis', 'Free service'), inc.campaignCost) + '</div>' +
        '<div class="rg-btn-row"><button class="btn-secondary" data-as-incident="' + inc.id + '" data-as-val="ignore">' + esc(L('Abaikan', 'Ignore')) + '</button></div></div>';
}

function _levelCard(lv, cash) {
    var def = lv.def, status, cls;
    if (!lv.unlocked) { status = L('Terbuka tahun ', 'Unlocks in ') + def.unlock; cls = 'rg-lock'; }
    else if (lv.active) { status = L('Aktif', 'Active'); cls = 'rg-ok'; }
    else { status = L('Tersedia', 'Available'); cls = 'rg-row-meta'; }
    var facts = '<div class="rg-row-meta">' + esc(L('Kapasitas ', 'Capacity ')) + '<b>' + pct(def.capacityPct, 1) + '</b>' + esc(L(' unit garansi/bln', ' of warranty units/mo')) +
        ' · ' + esc(L('biaya klaim ', 'claim cost ')) + '<b>×' + def.costMult.toFixed(2) + '</b>' +
        ' · ' + esc(L('kepuasan maks ', 'max satisfaction ')) + '<b>' + def.satCap + '</b></div>' +
        '<div class="rg-row-meta">' + esc(L('Biaya pasang ', 'Setup ')) + '<b>' + money(lv.setupCost) + '</b>' +
        ' · ' + esc(L('tetap ', 'fixed ')) + '<b>' + money(lv.monthlyCost) + L('/bln', '/mo') + '</b></div>';
    var btn;
    if (!lv.unlocked) btn = '<button class="btn-secondary" disabled>' + esc(L('Terkunci', 'Locked')) + '</button>';
    else if (lv.active) btn = '<button class="btn-secondary" disabled>' + esc(L('Sedang dipakai', 'In use')) + '</button>';
    else {
        var can = cash >= lv.setupCost;
        btn = '<button class="' + (can ? 'btn-primary' : 'btn-secondary') + '" data-as-level="' + esc(lv.id) + '"' + (can ? '' : ' disabled') + '>' +
            esc(can ? L('Pakai jaringan ini', 'Switch to this network') : L('Dana kurang', 'Not enough cash')) + '</button>';
    }
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
        '<div class="card-title" style="margin:0;">' + esc(T(def.name)) + '</div><div class="' + cls + '">' + esc(status) + '</div></div>' +
        '<div class="rg-desc">' + esc(T(def.desc)) + '</div>' + facts + '<div class="rg-btn-row">' + btn + '</div></div>';
}

function _productCard(pr) {
    var warrantyChips = WARRANTY_OPTIONS.map(function (o) {
        var active = o.months === pr.warranty;
        return '<button class="rg-chip' + (active ? ' active' : '') + '" data-as-warranty="' + esc(pr.id) + '" data-as-val="' + o.months + '">' + o.months + esc(L(' bln', ' mo')) + '</button>';
    }).join('');
    var osChips = '';
    for (var y = OS_YEARS_MIN; y <= OS_YEARS_MAX; y++) {
        osChips += '<button class="rg-chip' + (y === pr.osYears ? ' active' : '') + '" data-as-os="' + esc(pr.id) + '" data-as-val="' + y + '">' + y + esc(L(' thn', ' yr')) + '</button>';
    }
    var dm = (pr.demandFactor - 1) * 100;
    var dmTxt = (dm >= 0 ? '+' : '') + dm.toFixed(1) + '%';
    var statusTag = pr.status === 'selling' ? '' : '<span class="rg-tag">' + esc(L('Tidak dijual', 'Off sale')) + '</span>';
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
        '<div class="card-title" style="margin:0;">' + esc(pr.name) + '</div>' + statusTag + '</div>' +
        '<div class="rg-row-meta" style="margin:4px 0 8px;">' + esc(L('Kerusakan ', 'Failure rate ')) + '<b>' + pct(pr.annualRate, 1) + esc(L('/thn', '/yr')) + '</b>' +
        ' · ' + esc(L('dalam garansi ', 'in warranty ')) + '<b>' + int(pr.inForce) + '</b>' +
        ' · ' + esc(L('efek permintaan ', 'demand effect ')) + '<b>' + esc(dmTxt) + '</b></div>' +
        '<div class="rg-row-name" style="margin-bottom:5px;">' + esc(L('Garansi (unit yang dijual setelah diubah)', 'Warranty (units sold after the change)')) + '</div>' +
        '<div class="rg-chips">' + warrantyChips + '</div>' +
        (pr.lockLeft > 0 ? '<div class="rg-lock">' + esc(L('Garansi bisa diubah lagi dalam ' + pr.lockLeft + ' bln.', 'Warranty can change again in ' + pr.lockLeft + ' mo.')) + '</div>' : '') +
        '<div class="rg-row-name" style="margin:10px 0 5px;">' + esc(L('Dukungan update OS (janji publik, hanya bisa dinaikkan)', 'OS update support (public promise, can only go up)')) + '</div>' +
        '<div class="rg-chips">' + osChips + '</div>' +
        '<div class="rg-row-meta" style="margin-top:6px;">' + esc(L('Biaya dukungan OS ', 'OS support cost ')) + '<b>' + money(pr.osCost) + esc(L('/bln', '/mo')) + '</b></div></div>';
}

export function renderAfterSalesPanel(params) {
    try { ensureRegionalStyle(); } catch (e) {}
    var sys = params && params.afterSalesSystem;
    if (!sys) return '<div class="card"><div class="rg-row-meta">' + esc(L('Sistem belum siap.', 'System not ready.')) + '</div></div>';
    var cash = 0;
    try { cash = window.__game.state.get().cash || 0; } catch (e) {}
    var sum;
    try { sum = sys.getSummary(); } catch (e) {
        console.warn('[AfterSalesPanel] ringkasan gagal', e);
        return '<div class="card"><div class="rg-row-meta">' + esc(L('Data servis belum bisa ditampilkan.', 'Service data cannot be shown yet.')) + '</div></div>';
    }
    var out = _summaryCard(sum);
    out += sum.incidents.map(function (i) { return _incidentCard(i, cash); }).join('');
    out += sum.levels.map(function (lv) { return _levelCard(lv, cash); }).join('');
    var prods = sum.products.slice().sort(function (a, b) { return (a.status === 'selling' ? 0 : 1) - (b.status === 'selling' ? 0 : 1); });
    if (!prods.length) {
        out += '<div class="card"><div class="rg-row-meta">' + esc(L('Rilis ponsel pertamamu untuk mengatur garansi dan dukungan OS.', 'Release your first phone to set warranty and OS support.')) + '</div></div>';
    } else {
        out += prods.map(_productCard).join('');
    }
    return out;
}
