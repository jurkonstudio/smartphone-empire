import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/components/TechNodeCard.js  (REPLACE)
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';


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
    if (node.unlock && node.unlock.type) {
        var ty = node.unlock.type;
        var id = (node.unlock.id || '').replace(/_/g, ' ');
        var label = _tf('tnc.unlock.' + ty, UNLOCK_TYPE_FALLBACK[ty] || ty);
        return '<span class="node-eff-tag">' + escapeHtml(label) + '</span> ' + escapeHtml(id);
    }
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

    var yearBadge = node.minYear ? '<span class="node-row-year">' + node.minYear + '</span>' : '';
    var recBadge = opts.recommended ? '<span class="node-row-rec">' + escapeHtml(_tf('rs.row.rec', 'Disarankan')) + '</span>' : '';

    var progressHtml = showProgress
        ? '<div class="node-row-progress"><div class="node-row-progress-bar" style="width:' + opts.progressPct + '%;"></div></div>'
        : '';

    var footLeft = showProgress
        ? '<span class="node-row-eta">' + escapeHtml(opts.progressEta || '') + '</span>'
        : '<span class="node-row-cost' + (poor ? ' is-poor' : '') + '">' + costStr + '</span>' +
          '<span class="node-row-dot">·</span>' +
          '<span class="node-row-dur">' + escapeHtml(durStr) + '</span>';

    var descHtml = opts.description ? '<div class="node-row-desc">' + escapeHtml(opts.description) + '</div>' : '';
    var reasonHtml = ((status === 'locked' || held) && opts.reason)
        ? '<div class="node-row-reason' + (held ? ' is-held' : '') + '">' + escapeHtml(opts.reason) + '</div>' : '';

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
                descHtml + reasonHtml + progressHtml +
                '<div class="node-row-foot">' + footLeft + '</div>' +
            '</div>' +
            '<div class="node-row-actions">' + actionBtn + '</div>' +
        '</div>';
}

function _rndMoney(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

var _rndStylesInjected = false;
export function ensureRndStyles() {
    if (_rndStylesInjected || typeof document === 'undefined') return;
    _rndStylesInjected = true;
    
    var el = document.createElement('style');
    el.id = 'rnd-styles';
    el.textContent = RND_CSS;
    document.head.appendChild(el);

    if (!window._rndSwipeFixed) {
        window._rndSwipeFixed = true;
        const stopSwipeBleed = (e) => {
            if (e.target && e.target.closest && e.target.closest('.rnd-carousel-container')) {
                e.stopPropagation();
            }
        };
        document.addEventListener('touchstart', stopSwipeBleed, { capture: true, passive: true });
        document.addEventListener('touchmove', stopSwipeBleed, { capture: true, passive: false });
        document.addEventListener('touchend', stopSwipeBleed, { capture: true, passive: true });
    }
}

export function renderRndOverview(ov, opts) {
    opts = opts || {};
    var pct = Math.round((ov.factor - 1) * 100);
    var tone = pct > 0 ? 'up' : (pct < 0 ? 'down' : 'flat');
    var verdict = pct > 0 ? t('tnc.ov.verdict_up', { pct: pct }) : (pct < 0 ? t('tnc.ov.verdict_down', { pct: pct }) : t('tnc.ov.verdict_flat'));
    var buzzPct = Math.round((ov.buzzFactor - 1) * 100);
    var buzzW = Math.max(0, Math.min(100, Math.round(ov.buzz / 60 * 100)));
    
    var txtTitle = (opts.title !== undefined) ? opts.title : (t('rs.rnd.title') || 'R&D Lanjutan');
    var txtSlots = t('tnc.ov.slots', { used: ov.used, slots: ov.slots }) || ('Slot ' + ov.used + '/' + ov.slots);
    var txtAvg = t('tnc.ov.avg') || 'LEVEL RATA-RATA';
    var txtBench = t('tnc.ov.benchmark') || 'STANDAR PASAR';
    var txtDemand = t('tnc.ov.demand') || 'EFEK PERMINTAAN';
    var txtBuzz = t('tnc.ov.buzz') || 'Gaung pasar';

    var titleHtml = txtTitle ? '<div class="rnd-ov-title">' + escapeHtml(txtTitle) + '</div>' : '';

    return '<div class="rnd-ov" data-rnd-root>' +
        '<div class="rnd-ov-head">' +
            titleHtml +
            (ov.slots ? '<div class="rnd-ov-slots">' + escapeHtml(txtSlots) + '</div>' : '') +
        '</div>' +
        '<div class="rnd-ov-grid">' +
            '<div class="rnd-chip"><span>' + escapeHtml(txtAvg) + '</span><b>' + ov.avg.toFixed(1) + '</b></div>' +
            '<div class="rnd-chip"><span>' + escapeHtml(txtBench) + '</span><b>' + ov.benchmark.toFixed(1) + '</b></div>' +
            '<div class="rnd-chip rnd-' + tone + '"><span>' + escapeHtml(txtDemand) + '</span><b>' + (pct > 0 ? '+' : '') + pct + '%</b></div>' +
        '</div>' +
        '<div class="rnd-verdict rnd-' + tone + '">' + escapeHtml(verdict) + '</div>' +
        '<div class="rnd-buzz"><span>' + escapeHtml(txtBuzz) + '</span>' +
            '<div class="rnd-buzz-bar"><i style="width:' + buzzW + '%"></i></div>' +
            '<b>' + (buzzPct > 0 ? '+' + buzzPct + '%' : '0%') + '</b></div>' +
        '</div>';
}

export function renderRndRow(info, opts) {
    opts = opts || {};
    var attr = opts.actionAttr || 'data-rnd-action';
    
    var maxLv = info.maxLevel || 10;
    var lvPct = Math.round((info.level || 0) / maxLv * 100);
    var capPct = Math.round((info.cap || maxLv) / maxLv * 100);
    var benchPct = (typeof opts.benchmark === 'number') ? Math.max(0, Math.min(100, Math.round(opts.benchmark / maxLv * 100))) : null;

    var currentBonus = (info.statBonus !== undefined ? info.statBonus : info.bonus) || 0;
    var bonusTxt = '+' + currentBonus.toFixed(1).replace(/\.0$/, '') + ' ' + (opts.bonusLabel || '');

    var iconUp = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    var iconLock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    var iconWait = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    var iconPlus = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

    var actionHtml = '';
    if (info.status === 'running' && info.running) {
        var run = info.running;
        var pct = run.durationDays > 0 ? Math.min(100, Math.round(run.progressDays / run.durationDays * 100)) : 0;
        actionHtml = '<div class="rnd-action-box">' +
            '<div class="rnd-progress-head">' +
                '<span>' + escapeHtml(t('osp.rnd.toward_lv', { n: run.targetLevel })) + '</span>' +
                '<b data-rnd-pct="' + escapeHtml(info.id) + '">' + pct + '%</b>' +
            '</div>' +
            '<div class="rnd-bar-bg">' +
                '<div class="rnd-bar-fill active" data-rnd-bar="' + escapeHtml(info.id) + '" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<button class="rnd-btn-cancel" ' + attr + '="cancel" data-rnd-id="' + escapeHtml(info.id) + '">' + escapeHtml(t('osp.rnd.cancel_refund')) + '</button>' +
        '</div>';
    } else if (info.status === 'available' || (info.status === 'locked' && info.blocker === 'cash')) {
        var can = info.status === 'available';
        var btnCls = can ? 'rnd-btn-start' : 'rnd-btn-disabled';
        var btnAttr = can ? attr + '="start" data-rnd-id="' + escapeHtml(info.id) + '"' : 'disabled';
        
        var costStr = _rndMoney(info.cost);
        var etaStr = t('osp.rnd.eta_short', { n: info.etaDays || '?' });
        
        var btnText = can 
            ? '<span>' + iconUp + ' ' + escapeHtml(t('osp.rnd.upgrade_lv', { n: info.level + 1 })) + '</span><small>' + costStr + ' · ' + escapeHtml(etaStr) + '</small>' 
            : iconLock + ' ' + escapeHtml(info.reason || t('osp.rnd.low_cash'));

        actionHtml = '<button class="' + btnCls + '" ' + btnAttr + '>' + btnText + '</button>';
    } else if (info.status === 'locked' && info.blocker === 'slots') {
        var slotCost = info.slotCost !== undefined ? info.slotCost : -1;
        var canAfford = info.canAffordSlot !== false;
        
        if (slotCost === -1) {
            actionHtml = '<button class="rnd-btn-disabled" disabled>' + iconWait + ' ' + escapeHtml(t('osp.rnd.slot_max')) + '</button>';
        } else {
            var bg = canAfford ? 'var(--success-soft)' : 'var(--bg-3)';
            var clr = canAfford ? 'var(--success)' : 'var(--text-tertiary)';
            var brd = canAfford ? '1px solid var(--success)' : '1px solid var(--border)';
            
            actionHtml = '<div style="display:flex; flex-direction:column; gap:6px; margin-top:4px;">' +
                '<div style="font-size:10px; color:var(--warn); text-align:center; font-weight:600;">' + escapeHtml(t('osp.rnd.slots_full')) + '</div>' +
                '<button class="rnd-btn-start" style="background:' + bg + '; color:' + clr + '; border:' + brd + ';" ' +
                    (canAfford ? attr + '="buy-slot"' : 'disabled') + '>' +
                    '<span>' + iconPlus + ' ' + escapeHtml(t('osp.rnd.buy_slot')) + '</span>' +
                    '<small>' + _rndMoney(slotCost) + '</small>' +
                '</button>' +
            '</div>';
        }
    } else {
        actionHtml = '<div class="rnd-note">' + iconLock + ' ' + escapeHtml(info.reason || t('osp.rnd.locked')) + '</div>';
    }

    return '<div class="rnd-row">' +
        '<div class="rnd-row-head">' +
            '<div class="rnd-row-title">' + escapeHtml(info.name.replace('Penyempurnaan ', '')) + '</div>' +
            '<div class="rnd-row-lv">Lv <b>' + (info.level || 0) + '</b>/' + info.cap + '</div>' +
        '</div>' +
        '<div class="rnd-row-sub">' +
            '<span class="rnd-bonus">' + escapeHtml(bonusTxt) + '</span>' +
        '</div>' +
        '<div class="rnd-meter">' +
            '<i class="rnd-meter-cap" style="width:' + capPct + '%"></i>' +
            '<i class="rnd-meter-fill" style="width:' + lvPct + '%"></i>' +
            (benchPct !== null ? '<u class="rnd-meter-bench" style="left:' + benchPct + '%" title="' + escapeHtml(t('osp.rnd.market_std')) + '"></u>' : '') +
        '</div>' +
        actionHtml +
    '</div>';
}

const RND_CSS = `
.rnd-card { margin: 0 0 12px; }
.rnd-ov { background: linear-gradient(135deg, var(--bg-2), var(--bg-3)); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px; margin-bottom: 12px; }
.rnd-ov-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.rnd-ov-title { font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--text-primary); }
.rnd-ov-slots { font-size: var(--fs-xs); color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.rnd-ov-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.rnd-chip { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r); padding: 6px 8px; min-width: 0; }
.rnd-chip span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .6px; color: var(--text-tertiary); font-weight: var(--fw-bold); }
.rnd-chip b { display: block; font-size: var(--fs-sm); color: var(--text-primary); font-variant-numeric: tabular-nums; }
.rnd-chip.rnd-up b { color: #10b981; } .rnd-chip.rnd-down b { color: #ef4444; }
.rnd-verdict { font-size: 11px; margin: 8px 0 6px; color: var(--text-secondary); line-height: 1.4; }
.rnd-verdict.rnd-up { color: #10b981; } .rnd-verdict.rnd-down { color: #ef4444; }
.rnd-buzz { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); color: var(--text-tertiary); margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); }
.rnd-buzz-bar { flex: 1; height: 6px; background: var(--bg-4); border-radius: 99px; overflow: hidden; }
.rnd-buzz-bar i { display: block; height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); border-radius: 99px; transition: width .3s; }
.rnd-buzz b { color: var(--text-primary); font-variant-numeric: tabular-nums; min-width: 34px; text-align: right; }

.rnd-carousel-container { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 12px; padding-bottom: 12px; padding-right: 12px; -webkit-overflow-scrolling: touch; scrollbar-width: none; overscroll-behavior-x: contain; touch-action: pan-x; }
.rnd-carousel-container::-webkit-scrollbar { display: none; }

.rnd-row { flex: 0 0 84%; scroll-snap-align: start; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px; transition: border-color 0.2s; }
.rnd-row:hover { border-color: var(--border-strong); }
.rnd-row-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.rnd-row-title { font-weight: var(--fw-bold); color: var(--text-primary); font-size: var(--fs-base); letter-spacing: -0.01em; }
.rnd-row-lv { font-size: var(--fs-xs); color: var(--text-secondary); font-variant-numeric: tabular-nums; background: var(--bg-3); padding: 2px 8px; border-radius: var(--r-pill); }
.rnd-row-lv b { color: var(--accent); font-size: var(--fs-sm); }
.rnd-row-sub { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--fs-xs); color: var(--text-tertiary); margin-bottom: 8px; }
.rnd-bonus { color: #10b981; font-weight: var(--fw-bold); white-space: nowrap; }

.rnd-meter { position: relative; height: 6px; background: var(--bg-4); border-radius: 99px; margin-bottom: 10px; overflow: visible; }
.rnd-meter i { position: absolute; left: 0; top: 0; height: 100%; border-radius: 99px; }
.rnd-meter-cap { background: var(--border-strong); opacity: .5; }
.rnd-meter-fill { background: var(--accent); transition: width 0.3s ease; }
.rnd-meter-bench { position: absolute; top: -3px; width: 2px; height: 12px; background: var(--warn); border-radius: 2px; text-decoration: none; box-shadow: 0 0 4px var(--warn); }

.rnd-btn-start { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border: 0; border-radius: var(--r); background: var(--accent-soft); color: var(--accent); font-weight: var(--fw-bold); font-size: var(--fs-sm); cursor: pointer; transition: background 0.2s, color 0.2s; }
.rnd-btn-start:hover { background: var(--accent); color: #fff; }
.rnd-btn-start span { display: flex; align-items: center; gap: 6px; }
.rnd-btn-start small { font-weight: var(--fw-semibold); opacity: 0.8; font-size: var(--fs-xs); }

.rnd-btn-disabled { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--r); background: var(--bg-3); color: var(--text-tertiary); font-weight: var(--fw-bold); font-size: var(--fs-sm); cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 6px; }

.rnd-action-box { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
.rnd-progress-head { display: flex; justify-content: space-between; font-size: var(--fs-xs); color: var(--text-secondary); font-weight: var(--fw-semibold); }
.rnd-progress-head b { color: var(--accent); font-variant-numeric: tabular-nums; }
.rnd-bar-bg { height: 4px; background: var(--bg-4); border-radius: 4px; overflow: hidden; }
.rnd-bar-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.3s; }
.rnd-bar-fill.active { background-image: linear-gradient(90deg, var(--accent) 0%, #60a5fa 50%, var(--accent) 100%); background-size: 200% 100%; animation: progressShimmer 2s infinite linear; }
.rnd-btn-cancel { align-self: flex-end; background: transparent; border: none; color: var(--text-tertiary); font-size: 11px; font-weight: var(--fw-bold); cursor: pointer; padding: 0; text-decoration: underline; margin-top: 4px; }
.rnd-btn-cancel:hover { color: var(--danger); }
.rnd-note { font-size: var(--fs-xs); color: var(--text-tertiary); margin-top: 6px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; }
`;
