// FILE: src/ui/components/TechNodeCard.js
// ============================================================
// Komponen baris node riset — dipakai ResearchPanel & ChipResearchPanel.
// Gaya Sim Companies: row padat, angka rata kanan, ikon fungsional.
//
// Struktur DOM:
//   .node-row-wrap
//     .node-row-content [data-node-detail]   ← klik → buka modal
//     .node-row-actions                       ← klik tombol → start/cancel
// ============================================================
import { renderIcon } from '../icons/FeatureIcons.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

var STAT_LABEL = {
    display: 'Layar', camera: 'Kamera', battery: 'Baterai',
    performance: 'Performa', connectivity: 'Jaringan',
    design: 'Desain', usability: 'Kemudahan'
};

var UNLOCK_TYPE_LABEL = {
    architecture: 'Arsitektur',
    node: 'Node',
    feature: 'Fitur',
    fab: 'Fab',
    bonus: 'Bonus'
};

function _formatEffects(node) {
    // Chip node (punya .unlock)
    if (node.unlock && node.unlock.type) {
        var t = node.unlock.type;
        var id = (node.unlock.id || '').replace(/_/g, ' ');
        var label = UNLOCK_TYPE_LABEL[t] || t;
        return '<span class="node-eff-tag">' + escapeHtml(label) + '</span> ' + escapeHtml(id);
    }
    // Tech node (punya .effects.statBonuses)
    var eff = node.effects || {};
    var sb = eff.statBonuses || {};
    var keys = Object.keys(sb);
    if (keys.length) {
        return keys.map(function (k) {
            var lbl = STAT_LABEL[k] || k;
            return '<b class="node-eff-num">+' + sb[k] + '</b> ' + escapeHtml(lbl);
        }).join('<span class="node-eff-sep"> · </span>');
    }
    var unlocks = eff.unlocksComponents || [];
    if (unlocks.length) {
        return '<span class="node-eff-tag">Unlock</span> ' + unlocks.length + ' komponen';
    }
    return '';
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

    var effects = _formatEffects(node);
    var costStr = _formatCost(node.cost);
    var durStr = (node.durationDays || '?') + ' hari';
    var showProgress = (status === 'running' && typeof opts.progressPct === 'number');

    var actionBtn = '';
    if (status === 'available') {
        actionBtn = '<button class="node-row-cta" ' + actionAttr + '="start" data-node-id="' +
            escapeHtml(node.id) + '" aria-label="Mulai riset">+</button>';
    } else if (status === 'running') {
        actionBtn = '<button class="node-row-cta node-row-cta-danger" ' + actionAttr + '="cancel" data-node-id="' +
            escapeHtml(node.id) + '" aria-label="Batalkan riset">×</button>';
    } else if (status === 'locked') {
        actionBtn = '<span class="node-row-cta node-row-cta-locked" aria-hidden="true">🔒</span>';
    }

    var yearBadge = node.minYear
        ? '<span class="node-row-year">' + node.minYear + '</span>'
        : '';

    var progressHtml = showProgress
        ? '<div class="node-row-progress"><div class="node-row-progress-bar" style="width:' +
          opts.progressPct + '%;"></div></div>'
        : '';

    var footLeft = showProgress
        ? '<span class="node-row-eta">' + escapeHtml(opts.progressEta || '') + '</span>'
        : '<span class="node-row-cost">' + costStr + '</span>' +
          '<span class="node-row-dot">·</span>' +
          '<span class="node-row-dur">' + escapeHtml(durStr) + '</span>';

    return '' +
        '<div class="node-row-wrap node-' + status + '">' +
            '<div class="node-row-content" ' + detailAttr + '="' + escapeHtml(node.id) + '">' +
                '<div class="node-row-head">' +
                    '<span class="node-row-title">' + escapeHtml(node.name) + '</span>' +
                    yearBadge +
                '</div>' +
                '<div class="node-row-sub">' +
                    '<span class="node-row-cat">' +
                        (cat.icon ? renderIcon(cat.icon, 11) : '') +
                        '<span>' + escapeHtml(cat.name || '') + ' · T' + (node.tier || '?') + '</span>' +
                    '</span>' +
                    (effects ? '<span class="node-row-effects">' + effects + '</span>' : '') +
                '</div>' +
                progressHtml +
                '<div class="node-row-foot">' + footLeft + '</div>' +
            '</div>' +
            '<div class="node-row-actions">' + actionBtn + '</div>' +
        '</div>';
}
