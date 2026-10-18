// FILE: src/ui/components/TechNodeCard.js  (REPLACE)
// ============================================================
// Komponen baris node riset — dipakai ResearchPanel & ChipResearchPanel.
// v2028 — backward compatible: semua opsi baru bersifat opsional.
//
// Struktur DOM (tidak berubah, main.js bergantung pada atribut ini):
//   .node-row-wrap
//     .node-row-content [data-node-detail]   ← klik → buka modal
//     .node-row-actions                       ← klik tombol → start/cancel
//
// Opsi baru (opsional):
//   description   : string  — satu baris deskripsi
//   blocker       : 'slots' | 'cash' | 'year' | 'prereq' | null
//   affordable    : boolean — false → biaya berwarna merah
//   recommended   : boolean — lencana "Disarankan"
//   durationLabel : string  — override teks durasi
// ============================================================
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// t() dengan fallback bila key belum ada di kamus.
function _tf(key, fallback, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fallback;
}

var STAT_KEYS = ['display', 'camera', 'battery', 'performance', 'connectivity', 'design', 'usability'];
var STAT_FALLBACK = {
    display: 'Layar', camera: 'Kamera', battery: 'Baterai',
    performance: 'Performa', connectivity: 'Jaringan',
    design: 'Desain', usability: 'Kemudahan'
};
export function statLabel(k) {
    return STAT_KEYS.indexOf(k) >= 0 ? _tf('rs.stat.' + k, STAT_FALLBACK[k]) : k;
}

var UNLOCK_TYPE_FALLBACK = {
    architecture: 'Arsitektur', node: 'Node', feature: 'Fitur', fab: 'Fab', bonus: 'Bonus'
};

function _formatEffects(node) {
    // Chip node (punya .unlock)
    if (node.unlock && node.unlock.type) {
        var ty = node.unlock.type;
        var id = (node.unlock.id || '').replace(/_/g, ' ');
        var label = _tf('tnc.unlock.' + ty, UNLOCK_TYPE_FALLBACK[ty] || ty);
        return '<span class="node-eff-tag">' + escapeHtml(label) + '</span> ' + escapeHtml(id);
    }
    // Tech node (punya .effects)
    var eff = node.effects || {};
    var sb = eff.statBonuses || {};
    var keys = Object.keys(sb);
    var parts = [];
    if (keys.length) {
        parts.push(keys.map(function (k) {
            return '<b class="node-eff-num">+' + sb[k] + '</b> ' + escapeHtml(statLabel(k));
        }).join('<span class="node-eff-sep"> · </span>'));
    }
    var comps = (eff.unlocksComponents || []).length;
    var feats = (eff.unlocksOsFeatures || []).length;
    if (comps || feats) {
        var tag = '<span class="node-eff-tag">' + escapeHtml(_tf('rs.row.unlock_tag', 'Buka')) + '</span> ';
        var bits = [];
        if (comps) bits.push(_tf('rs.row.component', 'Komponen: ' + comps, { n: comps }));
        if (feats) bits.push(_tf('rs.row.os_feat', 'Fitur OS: ' + feats, { n: feats }));
        parts.push(tag + escapeHtml(bits.join(' · ')));
    }
    return parts.join('<span class="node-eff-sep"> · </span>');
}

function _formatCost(c) {
    if (typeof c !== 'number') return '';
    return '$' + c.toLocaleString('en-US');
}

export function renderTechNodeRow(opts) {
    var node = opts.node;
    if (!node) return '';
    var status = opts.status || 'locked';
    var cat = opts.categoryInfo || { name: node.category || '', icon: '' };
    var detailAttr = opts.detailAttr || 'data-node-detail';
    var actionAttr = opts.actionAttr || 'data-research-action';
    var blocker = opts.blocker || null;
    var held = (status === 'locked' && (blocker === 'slots' || blocker === 'cash'));

    var effects = _formatEffects(node);
    var costStr = _formatCost(node.cost);
    var durStr = opts.durationLabel ||
        _tf('rs.row.days', (node.durationDays || '?') + ' hari', { n: node.durationDays || '?' });
    var showProgress = (status === 'running' && typeof opts.progressPct === 'number');
    var poor = (opts.affordable === false);

    var actionBtn = '';
    if (status === 'available') {
        actionBtn = '<button class="node-row-cta" ' + actionAttr + '="start" data-node-id="' +
            escapeHtml(node.id) + '" aria-label="' + escapeHtml(_tf('rs.row.start', 'Mulai riset')) + '">+</button>';
    } else if (held) {
        // Siap secara prasyarat, tapi slot penuh / kas kurang: tombol tetap bisa diklik
        // (main.js menampilkan toast alasan), hanya dibuat redup.
        actionBtn = '<button class="node-row-cta node-row-cta-held" ' + actionAttr + '="start" data-node-id="' +
            escapeHtml(node.id) + '" aria-label="' + escapeHtml(opts.reason || '') + '">+</button>';
    } else if (status === 'running') {
        actionBtn = '<button class="node-row-cta node-row-cta-danger" ' + actionAttr + '="cancel" data-node-id="' +
            escapeHtml(node.id) + '" aria-label="' + escapeHtml(_tf('rs.row.cancel', 'Batalkan riset')) + '">×</button>';
    } else if (status === 'locked') {
        actionBtn = '<span class="node-row-cta node-row-cta-locked" aria-hidden="true" title="' +
            escapeHtml(_tf('rs.row.locked', 'Terkunci')) + '">🔒</span>';
    } else if (status === 'done') {
        actionBtn = '<span class="node-row-cta node-row-cta-done" aria-hidden="true">✓</span>';
    }

    var yearBadge = node.minYear
        ? '<span class="node-row-year">' + node.minYear + '</span>'
        : '';
    var recBadge = opts.recommended
        ? '<span class="node-row-rec">' + escapeHtml(_tf('rs.row.rec', 'Disarankan')) + '</span>'
        : '';

    var progressHtml = showProgress
        ? '<div class="node-row-progress"><div class="node-row-progress-bar" style="width:' +
          opts.progressPct + '%;"></div></div>'
        : '';

    var footLeft = showProgress
        ? '<span class="node-row-eta">' + escapeHtml(opts.progressEta || '') + '</span>'
        : '<span class="node-row-cost' + (poor ? ' is-poor' : '') + '">' + costStr + '</span>' +
          '<span class="node-row-dot">·</span>' +
          '<span class="node-row-dur">' + escapeHtml(durStr) + '</span>';

    var descHtml = opts.description
        ? '<div class="node-row-desc">' + escapeHtml(opts.description) + '</div>'
        : '';

    var reasonHtml = ((status === 'locked' || held) && opts.reason)
        ? '<div class="node-row-reason' + (held ? ' is-held' : '') + '">' + escapeHtml(opts.reason) + '</div>'
        : '';

    return '' +
        '<div class="node-row-wrap node-' + status + (held ? ' node-held' : '') +
            (opts.recommended ? ' node-recommended' : '') + '" data-node-row="' + escapeHtml(node.id) + '">' +
            '<div class="node-row-content" ' + detailAttr + '="' + escapeHtml(node.id) + '">' +
                '<div class="node-row-head">' +
                    '<span class="node-row-title">' + escapeHtml(node.name) + '</span>' +
                    recBadge + yearBadge +
                '</div>' +
                '<div class="node-row-sub">' +
                    '<span class="node-row-cat">' +
                        (cat.icon ? renderIcon(cat.icon, 11) : '') +
                        '<span>' + escapeHtml(cat.name || '') + ' · T' + (node.tier || '?') + '</span>' +
                    '</span>' +
                    (effects ? '<span class="node-row-effects">' + effects + '</span>' : '') +
                '</div>' +
                descHtml +
                reasonHtml +
                progressHtml +
                '<div class="node-row-foot">' + footLeft + '</div>' +
            '</div>' +
            '<div class="node-row-actions">' + actionBtn + '</div>' +
        '</div>';
}

// ============================================================
// R&D BERKELANJUTAN — komponen bersama (dipakai ResearchPanel & OSPanel)
// v2028.36. Atribut aksi ditentukan pemanggil lewat opts.actionAttr
//   (mis. 'data-rnd-action' / 'data-osp-action') + data-rnd-id.
// ============================================================
function _rndMoney(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

var _rndStylesInjected = false;
export function ensureRndStyles() {
    if (_rndStylesInjected || typeof document === 'undefined') return;
    _rndStylesInjected = true;
    var el = document.createElement('style');
    el.id = 'rnd-styles';
    el.textContent = RND_CSS;
    document.head.appendChild(el);
}

// Ringkasan: level rata-rata vs standar pasar + gaung pasar.
// ov = { avg, benchmark, delta, factor, buzz, buzzFactor, slots, used }
export function renderRndOverview(ov, opts) {
    opts = opts || {};
    var pct = Math.round((ov.factor - 1) * 100);
    var tone = pct > 0 ? 'up' : (pct < 0 ? 'down' : 'flat');
    var verdict = pct > 0
        ? t('tnc.ov.verdict_up', { pct: pct })
        : (pct < 0
            ? t('tnc.ov.verdict_down', { pct: pct })
            : t('tnc.ov.verdict_flat'));
    var buzzPct = Math.round((ov.buzzFactor - 1) * 100);
    var buzzW = Math.max(0, Math.min(100, Math.round(ov.buzz / 60 * 100)));
    return '<div class="rnd-ov" data-rnd-root>' +
        '<div class="rnd-ov-head">' +
            '<div class="rnd-ov-title">' + escapeHtml(opts.title || t('rs.rnd.title')) + '</div>' +
            (ov.slots ? '<div class="rnd-ov-slots">' + escapeHtml(t('tnc.ov.slots', { used: ov.used, slots: ov.slots })) + '</div>' : '') +
        '</div>' +
        '<div class="rnd-ov-grid">' +
            '<div class="rnd-chip"><span>' + escapeHtml(t('tnc.ov.avg')) + '</span><b>' + ov.avg.toFixed(1) + '</b></div>' +
            '<div class="rnd-chip"><span>' + escapeHtml(t('tnc.ov.benchmark')) + '</span><b>' + ov.benchmark.toFixed(1) + '</b></div>' +
            '<div class="rnd-chip rnd-' + tone + '"><span>' + escapeHtml(t('tnc.ov.demand')) + '</span><b>' + (pct > 0 ? '+' : '') + pct + '%</b></div>' +
        '</div>' +
        '<div class="rnd-verdict rnd-' + tone + '">' + escapeHtml(verdict) + '</div>' +
        '<div class="rnd-buzz"><span>' + escapeHtml(t('tnc.ov.buzz')) + '</span>' +
            '<div class="rnd-buzz-bar"><i style="width:' + buzzW + '%"></i></div>' +
            '<b>' + (buzzPct > 0 ? '+' + buzzPct + '%' : '0%') + '</b></div>' +
        '</div>';
}

// Satu baris jalur R&D. info = hasil getRefineInfo / getPlatformInfo.
// opts = { actionAttr, bonusLabel (mis. 'Layar'), benchmark }
export function renderRndRow(info, opts) {
    opts = opts || {};
    var attr = opts.actionAttr || 'data-rnd-action';
    var lvPct = Math.round(info.level / info.maxLevel * 100);
    var capPct = Math.round(info.cap / info.maxLevel * 100);
    var benchPct = (typeof opts.benchmark === 'number')
        ? Math.max(0, Math.min(100, Math.round(opts.benchmark / info.maxLevel * 100))) : null;

    var bonusTxt = '+' + (info.statBonus !== undefined ? info.statBonus : info.bonus).toFixed(1).replace(/\.0$/, '') + ' ' + (opts.bonusLabel || '');

    var action = '';
    if (info.status === 'running' && info.running) {
        var run = info.running;
        var pct = run.durationDays > 0 ? Math.min(100, Math.round(run.progressDays / run.durationDays * 100)) : 0;
        action = '<div class="rnd-run">' +
            '<div class="rnd-run-top"><span>' + escapeHtml(t('tnc.row.to_lv', { lv: run.targetLevel })) + '</span><b data-rnd-pct="' + escapeHtml(info.id) + '">' + pct + '%</b></div>' +
            '<div class="progress"><div class="progress-bar" data-rnd-bar="' + escapeHtml(info.id) + '" style="width:' + pct + '%"></div></div>' +
            '<button class="rnd-cancel" ' + attr + '="cancel" data-rnd-id="' + escapeHtml(info.id) + '">' + escapeHtml(t('tnc.row.cancel_refund')) + '</button>' +
            '</div>';
    } else if (info.status === 'available' || (info.status === 'locked' && info.blocker === 'cash')) {
        var can = info.status === 'available';
        action = '<button class="rnd-btn' + (can ? '' : ' rnd-btn-off') + '" ' + (can ? attr + '="start" data-rnd-id="' + escapeHtml(info.id) + '"' : 'disabled') + '>' +
            '<span>' + escapeHtml(t('tnc.row.upgrade', { lv: info.level + 1 })) + '</span>' +
            '<small>' + _rndMoney(info.cost) + ' · ~' + escapeHtml(t('rs.row.days', { n: info.etaDays })) + ' · +' + (((info.nextStatBonus !== undefined ? info.nextStatBonus : info.nextBonus) - (info.statBonus !== undefined ? info.statBonus : info.bonus))).toFixed(1).replace(/\.0$/, '') + ' ' + escapeHtml(opts.bonusLabel || '') + '</small>' +
            '</button>' +
            (can ? '' : '<div class="rnd-note">' + escapeHtml(info.reason || '') + '</div>');
    } else {
        action = '<div class="rnd-note">' + escapeHtml(info.reason || '') + '</div>';
    }

    return '<div class="rnd-row">' +
        '<div class="rnd-row-top">' +
            '<div class="rnd-row-name">' + escapeHtml(info.name) + '</div>' +
            '<div class="rnd-row-lv">Lv <b>' + info.level + '</b><em>/' + info.cap + '</em></div>' +
        '</div>' +
        '<div class="rnd-row-hint">' + escapeHtml(info.hint) + ' · <span class="rnd-bonus">' + escapeHtml(bonusTxt) + '</span></div>' +
        '<div class="rnd-meter">' +
            '<i class="rnd-meter-cap" style="width:' + capPct + '%"></i>' +
            '<i class="rnd-meter-fill" style="width:' + lvPct + '%"></i>' +
            (benchPct !== null ? '<u class="rnd-meter-bench" style="left:' + benchPct + '%" title="' + escapeHtml(t('tnc.ov.benchmark')) + '"></u>' : '') +
        '</div>' +
        action +
    '</div>';
}

var RND_CSS = `
.rnd-card { margin: 0 0 12px; }
.rnd-ov { background: linear-gradient(135deg, var(--bg-2), var(--bg-3)); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px; margin-bottom: 8px; }
.rnd-ov-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.rnd-ov-title { font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--text-primary); }
.rnd-ov-slots { font-size: var(--fs-xs); color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.rnd-ov-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.rnd-chip { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r); padding: 6px 8px; min-width: 0; }
.rnd-chip span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-tertiary); font-weight: var(--fw-bold); }
.rnd-chip b { display: block; font-size: var(--fs-sm); color: var(--text-primary); font-variant-numeric: tabular-nums; }
.rnd-chip.rnd-up b { color: #2e9f6b; } .rnd-chip.rnd-down b { color: #e5484d; }
.rnd-verdict { font-size: var(--fs-xs); margin: 8px 0 6px; color: var(--text-secondary); }
.rnd-verdict.rnd-up { color: #2e9f6b; } .rnd-verdict.rnd-down { color: #e5484d; }
.rnd-buzz { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); color: var(--text-tertiary); }
.rnd-buzz-bar { flex: 1; height: 6px; background: var(--bg-4); border-radius: 99px; overflow: hidden; }
.rnd-buzz-bar i { display: block; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); border-radius: 99px; transition: width .3s; }
.rnd-buzz b { color: var(--text-primary); font-variant-numeric: tabular-nums; min-width: 34px; text-align: right; }
.rnd-row { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 10px 12px; margin-bottom: 8px; }
.rnd-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.rnd-row-name { font-weight: var(--fw-bold); color: var(--text-primary); font-size: var(--fs-sm); }
.rnd-row-lv { font-size: var(--fs-sm); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.rnd-row-lv b { color: var(--accent); font-size: var(--fs-md); }
.rnd-row-lv em { font-style: normal; color: var(--text-tertiary); font-size: var(--fs-xs); }
.rnd-row-hint { font-size: var(--fs-xs); color: var(--text-tertiary); margin: 2px 0 8px; }
.rnd-bonus { color: #2e9f6b; font-weight: var(--fw-bold); }
.rnd-meter { position: relative; height: 8px; background: var(--bg-4); border-radius: 99px; margin-bottom: 8px; overflow: visible; }
.rnd-meter i { position: absolute; left: 0; top: 0; height: 100%; border-radius: 99px; }
.rnd-meter-cap { background: var(--border); opacity: .8; }
.rnd-meter-fill { background: var(--accent); }
.rnd-meter-bench { position: absolute; top: -3px; width: 2px; height: 14px; background: #f59e0b; border-radius: 2px; text-decoration: none; }
.rnd-btn { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 8px 10px; border: 0; border-radius: var(--r); background: var(--accent); color: #fff; font-weight: var(--fw-bold); font-size: var(--fs-sm); cursor: pointer; }
.rnd-btn small { font-weight: 500; opacity: .9; font-size: 10.5px; }
.rnd-btn-off { background: var(--bg-4); color: var(--text-tertiary); cursor: not-allowed; }
.rnd-note { font-size: var(--fs-xs); color: var(--text-tertiary); margin-top: 6px; text-align: center; }
.rnd-run-top { display: flex; justify-content: space-between; font-size: var(--fs-xs); color: var(--text-secondary); margin-bottom: 4px; }
.rnd-cancel { margin-top: 6px; width: 100%; background: transparent; border: 1px solid var(--border); color: var(--text-tertiary); border-radius: var(--r); padding: 5px; font-size: var(--fs-xs); cursor: pointer; }
`;
