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
        var label = UNLOCK_TYPE_FALLBACK[ty] || ty;
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
