import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/MoraleMeter.js
// Komponen moral tim (redesign). Satu sumber untuk label, warna, meter, tren bulanan,
// dan kartu ringkasan moral. Dipakai oleh TeamPanel dan StaffDetailModal.
import { BALANCE } from '../../data/balance.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

function _tf(key, fallback) {
    var v = t(key);
    return (v && v !== key) ? v : fallback;
}

function _clamp(v) {
    v = Number(v);
    if (!isFinite(v)) return 0;
    return Math.max(0, Math.min(100, v));
}

function _hasTrait(s, id) {
    return !!(s && s.traits && s.traits.indexOf(id) !== -1);
}

// Tier moral: Semangat (>=70), Biasa (40-69), Tertekan (<40).
export function moraleTier(morale) {
    var v = _clamp(morale);
    if (v >= 70) return { key: 'high', color: 'var(--success)', label: _tf('team.morale.high', 'Semangat') };
    if (v >= 40) return { key: 'mid',  color: 'var(--warn)',    label: _tf('team.morale.mid', 'Biasa') };
    return { key: 'low', color: 'var(--danger)', label: _tf('team.morale.low', 'Tertekan') };
}

// Perubahan moral per bulan untuk satu staf. Mengikuti logika _tickMonthly di TeamSystem:
// turun tiap bulan (Loyal lebih lambat), dan tiap Team Player menambah +0.5 untuk staf lain.
// Faktor Innovative (peluang +1 acak) tidak dihitung karena tidak pasti.
export function moraleDeltaPerMonth(s, list) {
    var cfg = BALANCE.team || {};
    var delta = -(_hasTrait(s, 'loyal') ? 0.5 : (cfg.moraleDecayPerMonth || 2));
    var all = Array.isArray(list) ? list : [];
    var tpCount = all.filter(function (x) { return _hasTrait(x, 'team_player'); }).length;
    if (tpCount > 0 && !_hasTrait(s, 'team_player')) delta += 0.5 * tpCount;
    return delta;
}

function _fmtDelta(d) {
    var r = Math.round(d * 10) / 10;
    return (r > 0 ? '+' : '') + String(r).replace('.', ',');
}

export function renderMoraleTrend(delta) {
    var r = Math.round(delta * 10) / 10;
    if (Math.abs(r) < 0.05) {
        return '<span class="mm-trend flat">' + escapeHtml(_tf('team.morale.flat', 'stabil')) + '</span>';
    }
    var cls = r > 0 ? 'up' : 'down';
    var arrow = r > 0 ? '▲' : '▼';
    return '<span class="mm-trend ' + cls + '">' + arrow + ' ' + escapeHtml(_fmtDelta(delta)) +
        '<span class="mm-trend-unit">/' + escapeHtml(_tf('team.morale.per_month', 'bln')) + '</span></span>';
}

// Meter 10 segmen + angka + label tier. Dipakai di baris staf dan modal.
export function renderMoraleMeter(morale) {
    var v = _clamp(morale);
    var tier = moraleTier(v);
    var filled = Math.round(v / 10);
    var segs = '';
    for (var i = 0; i < 10; i++) {
        segs += '<span class="mm-seg' + (i < filled ? ' on' : '') + '"' +
            (i < filled ? ' style="background:' + tier.color + ';"' : '') + '></span>';
    }
    return '<div class="mm-meter">' +
        '<div class="mm-segs">' + segs + '</div>' +
        '<span class="mm-val" style="color:' + tier.color + ';">' + Math.round(v) + '</span>' +
        '<span class="mm-tag" style="color:' + tier.color + ';">' + escapeHtml(tier.label) + '</span>' +
    '</div>';
}

// Baris moral kompak untuk kartu staf: meter + tren bulanan.
export function renderMoraleInline(s, list) {
    var morale = (typeof s.morale === 'number') ? s.morale : 75;
    return '<div class="mm-inline">' +
        renderMoraleMeter(morale) +
        renderMoraleTrend(moraleDeltaPerMonth(s, list)) +
    '</div>';
}

// Kartu ringkasan moral tim di atas roster.
export function renderMoraleCard(staff) {
    var list = Array.isArray(staff) ? staff : [];
    if (!list.length) return '';

    var sum = 0, counts = { high: 0, mid: 0, low: 0 }, deltaSum = 0;
    list.forEach(function (s) {
        var m = _clamp(typeof s.morale === 'number' ? s.morale : 75);
        sum += m;
        counts[moraleTier(m).key] += 1;
        deltaSum += moraleDeltaPerMonth(s, list);
    });
    var avg = Math.round(sum / list.length);
    var avgDelta = deltaSum / list.length;
    var tier = moraleTier(avg);

    var dist = [
        { key: 'high', n: counts.high, c: 'var(--success)' },
        { key: 'mid',  n: counts.mid,  c: 'var(--warn)' },
        { key: 'low',  n: counts.low,  c: 'var(--danger)' }
    ].map(function (d) {
        return '<div class="mm-dist-item">' +
            '<span class="mm-dot" style="background:' + d.c + ';"></span>' +
            '<b>' + d.n + '</b>' +
            '<span>' + escapeHtml(moraleTier(d.key === 'high' ? 80 : d.key === 'mid' ? 50 : 10).label) + '</span>' +
        '</div>';
    }).join('');

    var alert = counts.low > 0
        ? '<div class="mm-alert">' + renderIcon('warn', 13) +
            '<span>' + escapeHtml(_tf('team.morale.alert', '{n} staf bermoral tertekan (di bawah 40). Pertimbangkan pemulihan.').replace('{n}', String(counts.low))) + '</span>' +
          '</div>'
        : '';

    var explain = '<div class="mm-explain">' +
        '<div class="mm-explain-title">' + escapeHtml(_tf('team.morale.how_title', 'Cara kerja moral')) + '</div>' +
        '<div class="mm-explain-row">' + escapeHtml(_tf('team.morale.how_decay', 'Turun {n} poin tiap bulan. Staf Loyal hanya turun 0,5.').replace('{n}', String((BALANCE.team && BALANCE.team.moraleDecayPerMonth) || 2))) + '</div>' +
        '<div class="mm-explain-row">' + escapeHtml(_tf('team.morale.how_tp', 'Setiap staf Team Player menambah +0,5 poin tiap bulan untuk staf lain.')) + '</div>' +
        '<div class="mm-explain-row">' + escapeHtml(_tf('team.morale.how_inno', 'Staf Innovative kadang memicu +1 untuk seluruh tim.')) + '</div>' +
        '<div class="mm-explain-row">' + escapeHtml(_tf('team.morale.how_effect', 'Moral ikut menentukan skor kredibilitas perusahaan (bobot 15%).')) + '</div>' +
        '<div class="mm-explain-row">' + escapeHtml(_tf('team.morale.how_restore', 'Pemulihan instan ke 100 tersedia di Toko Silicon.')) + '</div>' +
    '</div>';

    return '<div class="card mm-card">' +
        '<div class="mm-head">' +
            '<div class="mm-title">' + renderIcon('heart', 13) + '<span>' + escapeHtml(_tf('team.morale.title', 'Moral Tim')) + '</span></div>' +
            '<span class="mm-pill" style="color:' + tier.color + ';border-color:' + tier.color + ';">' + escapeHtml(tier.label) + '</span>' +
        '</div>' +
        '<div class="mm-big">' +
            '<span class="mm-big-val" style="color:' + tier.color + ';">' + avg + '</span>' +
            '<span class="mm-big-unit">/100</span>' +
            '<span class="mm-big-trend">' + renderMoraleTrend(avgDelta) + '</span>' +
        '</div>' +
        '<div class="mm-bar">' +
            '<div class="mm-bar-fill" style="width:' + avg + '%;background:' + tier.color + ';"></div>' +
            '<span class="mm-bar-mark" style="left:40%;"></span>' +
            '<span class="mm-bar-mark" style="left:70%;"></span>' +
        '</div>' +
        '<div class="mm-zones">' +
            '<span style="width:40%;">' + escapeHtml(moraleTier(10).label) + '</span>' +
            '<span style="width:30%;">' + escapeHtml(moraleTier(50).label) + '</span>' +
            '<span style="width:30%;text-align:right;">' + escapeHtml(moraleTier(90).label) + '</span>' +
        '</div>' +
        '<div class="mm-dist">' + dist + '</div>' +
        alert +
        explain +
    '</div>';
}

// CSS untuk seluruh komponen moral. Disisipkan oleh panel yang memakainya.
export function moraleStyle() {
    return '<style>' +
        '.mm-card{padding:14px 14px 12px;}' +
        '.mm-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}' +
        '.mm-title{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--text-dim);}' +
        '.mm-pill{font-size:10.5px;font-weight:700;border:1px solid;border-radius:999px;padding:2px 9px;}' +
        '.mm-big{display:flex;align-items:baseline;gap:4px;flex-wrap:wrap;}' +
        '.mm-big-val{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1;}' +
        '.mm-big-unit{font-size:12px;color:var(--text-tertiary);}' +
        '.mm-big-trend{margin-left:auto;}' +
        '.mm-bar{position:relative;height:8px;border-radius:999px;background:var(--bg-3);margin:12px 0 4px;overflow:visible;}' +
        '.mm-bar-fill{height:100%;border-radius:999px;transition:width .4s ease;}' +
        '.mm-bar-mark{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--bg-1,#0b0f14);opacity:.9;}' +
        '.mm-zones{display:flex;font-size:10px;color:var(--text-tertiary);margin-bottom:10px;}' +
        '.mm-zones span{display:block;}' +
        '.mm-dist{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:8px;}' +
        '.mm-dist-item{display:flex;align-items:center;gap:6px;background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:6px 8px;font-size:11px;color:var(--text-secondary);}' +
        '.mm-dist-item b{font-size:15px;color:var(--text);}' +
        '.mm-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}' +
        '.mm-alert{display:flex;gap:6px;align-items:flex-start;font-size:11.5px;color:var(--warn);background:color-mix(in srgb,var(--warn) 10%,transparent);border-radius:10px;padding:7px 9px;margin-bottom:8px;line-height:1.4;}' +
        '.mm-explain{border-top:1px solid var(--border);padding-top:8px;}' +
        '.mm-explain-title{font-size:11px;font-weight:700;color:var(--text-dim);margin-bottom:4px;}' +
        '.mm-explain-row{font-size:11.5px;color:var(--text-secondary);line-height:1.5;padding-left:10px;position:relative;}' +
        '.mm-explain-row::before{content:"";position:absolute;left:0;top:7px;width:4px;height:4px;border-radius:50%;background:var(--text-tertiary);}' +
        '.mm-inline{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;}' +
        '.mm-meter{display:flex;align-items:center;gap:6px;min-width:0;}' +
        '.mm-segs{display:flex;gap:2px;}' +
        '.mm-seg{width:6px;height:10px;border-radius:2px;background:var(--bg-3);}' +
        '.mm-seg.on{opacity:1;}' +
        '.mm-val{font-size:11.5px;font-weight:700;min-width:18px;}' +
        '.mm-tag{font-size:10.5px;font-weight:600;}' +
        '.mm-trend{font-size:10.5px;font-weight:600;white-space:nowrap;}' +
        '.mm-trend.up{color:var(--success);}' +
        '.mm-trend.down{color:var(--danger);}' +
        '.mm-trend.flat{color:var(--text-tertiary);}' +
        '.mm-trend-unit{font-weight:500;color:var(--text-tertiary);}' +
        '.staff-row.mm-row-low{border-left:3px solid var(--danger);}' +
    '</style>';
}
