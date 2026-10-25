// FILE: src/ui/panels/AnnualReviewModal.js  (BARU — Rapor Tahunan + Target Dewan)
// ============================================================
// Tiga layar memakai Modal yang sama dengan EraEventModal:
//   1. Rapor    — nilai, capaian tiap target, statistik tahun lalu, hadiah/hukuman
//   2. Fokus    — target dasar tahun baru + pilihan Fokus Strategis
//   3. Hasil    — fokus terpilih dan target dewan final
// Game dijeda oleh handler di main.js; layar hasil mengembalikannya lewat ctx.resumeIfRunning.
// Juga mengekspor renderBoardTargetsCard(state) untuk kartu progres di Home.
// ============================================================
import { Modal } from '../modal.js';
import { escapeHtml } from '../../utils/html.js';
import { formatCurrency } from '../../utils/format.js';
import { LanguageService } from '../../core/LanguageService.js';
import { WalletService } from '../../systems/WalletService.js';
import { describeEffects } from './EraEventModal.js';
import { getBoardCardData } from '../../systems/AnnualReviewSystem.js';
import { GRADE_TEXT, TARGET_META, TARGET_KEYS, getFocusById } from '../../data/annual-review.data.js';

const REPORT_ID = 'annual-report';
const FOCUS_ID = 'annual-focus';
const RESULT_ID = 'annual-result';

function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_lang()] || o.en || o.id || '')); }
function _t(id, en) { return _lang() === 'id' ? id : en; }

function _gradeColor(g) {
    if (g === 'S' || g === 'A') return 'var(--success)';
    if (g === 'B') return 'var(--accent)';
    if (g === 'C') return 'var(--warning, #f59e0b)';
    return 'var(--danger)';
}

function _toneColor(tone) {
    if (tone === 'good') return 'var(--success)';
    if (tone === 'bad') return 'var(--danger)';
    return 'var(--text-mute)';
}

function _fmtTarget(key, v) {
    if (v == null || !isFinite(v)) return '—';
    var kind = (TARGET_META[key] || {}).kind;
    if (kind === 'percent') return (v * 100).toFixed(2) + '%';
    return formatCurrency(v);
}

function _row(label, value, color) {
    return '<div class="sum-row"><span>' + escapeHtml(label) + '</span><b' + (color ? ' style="color:' + color + ';"' : '') + '>' + escapeHtml(value) + '</b></div>';
}

function _lines(list, size) {
    return list.map(function (l) {
        return '<div style="font-size:' + (size || 12) + 'px;color:' + _toneColor(l.tone) + ';">' + escapeHtml(l.text) + '</div>';
    }).join('');
}

function _resume(ctx) { try { if (ctx && ctx.resumeIfRunning) ctx.resumeIfRunning(); } catch (e) {} }

// ---------------------------------------------------------------- layar 1: rapor

function _rankText(r) {
    var s = '#' + r.rank + ' / ' + r.brands;
    if (r.prevRank != null && r.prevRank !== r.rank) {
        var up = r.rank < r.prevRank;
        s += '  ' + (up ? '▲' : '▼') + Math.abs(r.prevRank - r.rank);
    }
    return s;
}

function _reportHtml(r) {
    var id = _lang() === 'id';
    var head;
    if (r.graded) {
        var col = _gradeColor(r.grade);
        head =
            '<div style="display:flex;align-items:center;gap:14px;margin:6px 0 10px;">' +
                '<div style="flex:0 0 auto;width:64px;height:64px;border-radius:14px;border:2px solid ' + col + ';color:' + col + ';' +
                    'display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;">' + escapeHtml(r.grade) + '</div>' +
                '<div style="font-size:13px;line-height:1.4;">' + escapeHtml(_L(GRADE_TEXT[r.grade])) + '</div>' +
            '</div>';
    } else {
        head = '<div class="modal-sub">' + escapeHtml(_t('Tahun pembuka perusahaanmu. Belum ada target dewan yang dinilai.', 'Your company\'s opening year. No board targets were graded yet.')) + '</div>';
    }

    var targets = '';
    if (r.graded) {
        targets = r.items.map(function (it) {
            var ok = it.passed;
            return '<div class="sum-row"><span>' + (ok ? '✔ ' : '✖ ') + escapeHtml(_L(TARGET_META[it.key].label)) + '</span>' +
                '<b style="color:' + (ok ? 'var(--success)' : 'var(--danger)') + ';">' + escapeHtml(_fmtTarget(it.key, it.actual)) +
                ' <span style="font-weight:400;color:var(--text-mute);">/ ' + escapeHtml(_fmtTarget(it.key, it.target)) + '</span></b></div>';
        }).join('');
    }

    var stats = '';
    if (!r.graded) {
        stats += _row(_t('Omzet', 'Revenue'), formatCurrency(r.revenue));
        stats += _row(_t('Rata-rata pangsa pasar', 'Average market share'), (r.avgShare * 100).toFixed(2) + '%');
        stats += _row(_t('Kekayaan bersih', 'Net worth'), formatCurrency(r.netWorth));
    }
    stats += _row(_t('Peringkat pasar', 'Market rank'), _rankText(r));
    stats += _row(_t('Unit terjual', 'Units sold'), (r.units || 0).toLocaleString('en-US'));
    if (r.bestPhone) stats += _row(_t('Ponsel terlaris', 'Best seller'), r.bestPhone.name + ' (' + r.bestPhone.units.toLocaleString('en-US') + ')');
    if (r.topRival) stats += _row(_t('Pesaing terkuat', 'Top rival'), r.topRival.name + ' ' + (r.topRival.share * 100).toFixed(1) + '%');
    if (r.reputationStart != null) stats += _row(_t('Reputasi', 'Reputation'), Math.round(r.reputationStart) + ' → ' + Math.round(r.reputation));
    if (r.graded) stats += _row(_t('Kekayaan bersih', 'Net worth'), formatCurrency(r.netWorthStart) + ' → ' + formatCurrency(r.netWorth));

    var fx = '';
    if (r.graded && r.effects) {
        var lines = describeEffects({ cost: 0, effects: r.effects });
        fx = '<div style="margin:10px 0 4px;font-size:12px;font-weight:700;">' + escapeHtml(id ? 'Dari dewan' : 'From the board') + '</div>' + _lines(lines);
        if (r.grace) fx += '<div style="font-size:11.5px;color:var(--text-mute);margin-top:4px;">' +
            escapeHtml(_t('Tahun pertama adalah masa percobaan: tidak ada hukuman dari dewan.', 'The first year is a trial period: the board applies no penalties.')) + '</div>';
    }

    return '<div class="modal-title">' + escapeHtml(_t('Rapor Tahun ', 'Annual Report ') + r.year) + '</div>' +
        head + targets + stats + fx +
        '<button class="btn-primary" data-annual-next style="width:100%;margin-top:14px;">' + escapeHtml(_t('Lanjut: pilih fokus', 'Next: choose focus')) + '</button>';
}

// ---------------------------------------------------------------- layar 2: fokus

function _multLines(tm) {
    var out = [];
    ['revenue', 'share', 'netWorth'].forEach(function (k) {
        var m = tm && tm[k];
        if (m && m !== 1) {
            var pct = Math.round((m - 1) * 100);
            out.push({ tone: 'bad', text: _t('Target ', 'Board target: ') + _L(TARGET_META[k].label).toLowerCase() + ' ' + (pct > 0 ? '+' : '') + pct + '%' });
        }
    });
    return out;
}

function _focusBtn(p) {
    var affordable = !(p.cost > 0) || WalletService.canAfford(p.cost);
    var lines = describeEffects({ cost: p.cost, effects: { cash: p.cash, reputation: p.reputation, demand: p.demand } })
        .filter(function (l) { return l.text !== 'Tidak ada perubahan' && l.text !== 'No change'; })
        .concat(_multLines(p.targetMult));
    var warn = affordable ? '' : '<div style="font-size:11.5px;color:var(--danger);margin-top:2px;">' + escapeHtml(_t('Dana tidak cukup', 'Not enough funds')) + '</div>';
    return '<button class="btn-secondary" data-annual-focus="' + escapeHtml(p.def.id) + '"' + (affordable ? '' : ' disabled') +
        ' style="width:100%;text-align:left;margin-top:8px;padding:10px 12px;display:block;' + (affordable ? '' : 'opacity:.55;') + '">' +
        '<div style="font-weight:600;font-size:13px;">' + escapeHtml(_L(p.def.label)) + '</div>' +
        '<div style="font-size:12px;color:var(--text-mute);margin:1px 0 4px;">' + escapeHtml(_L(p.def.tagline)) + '</div>' +
        _lines(lines, 11.5) + warn + '</button>';
}

function _targetsBlock(t) {
    return TARGET_KEYS.map(function (k) {
        return _row(_L(TARGET_META[k].label), _fmtTarget(k, t[k]));
    }).join('');
}

function _focusHtml(r, ctx) {
    var base = ctx.annual.previewBaseTargets();
    var opts = ctx.annual.getFocusPreview(r);
    return '<div class="modal-title">' + escapeHtml(_t('Fokus Strategis ', 'Strategic Focus ') + r.nextYear) + '</div>' +
        '<div class="modal-sub">' + escapeHtml(_t('Dewan menetapkan target dasar berikut. Pilih satu fokus; ada yang menaikkan target.', 'The board sets these base targets. Pick one focus; some raise the targets.')) + '</div>' +
        _targetsBlock(base) +
        '<div style="margin-top:10px;">' + opts.map(_focusBtn).join('') + '</div>';
}

// ---------------------------------------------------------------- layar 3: hasil

function _resultHtml(res) {
    var def = res.focus.def;
    return '<div class="modal-title">' + escapeHtml(_t('Target Dewan ', 'Board Targets ') + res.targets.year) + '</div>' +
        '<div class="modal-sub"><b>' + escapeHtml(_L(def.label)) + '</b><br>' + escapeHtml(res.outcome) + '</div>' +
        _targetsBlock(res.targets) +
        '<button class="btn-primary" data-modal-close style="width:100%;margin-top:14px;">' + escapeHtml(_t('Mulai tahun ', 'Start year ') + res.targets.year) + '</button>';
}

// ---------------------------------------------------------------- alur

// ctx = { annual, resumeIfRunning }
export function openAnnualReviewModal(report, ctx) {
    if (!report || !ctx || !ctx.annual) return false;
    var node = Modal.open(REPORT_ID, _reportHtml(report), { dismissible: false });
    var next = node.querySelector('[data-annual-next]');
    if (next) next.addEventListener('click', function () { _openFocus(report, ctx); });
    return true;
}

function _openFocus(report, ctx) {
    var node = Modal.open(FOCUS_ID, _focusHtml(report, ctx), { dismissible: false });
    node.querySelectorAll('[data-annual-focus]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var res = ctx.annual.chooseFocus(btn.getAttribute('data-annual-focus'));
            if (!res.ok) return;
            _openResult(res, ctx);
        });
    });
}

function _openResult(res, ctx) {
    Modal.open(RESULT_ID, _resultHtml(res), {
        dismissible: false,
        onClose: function () {
            ctx.annual.advance();
            _resume(ctx);
        }
    });
}

// ---------------------------------------------------------------- kartu Home

export function renderBoardTargetsCard(state) {
    var c = getBoardCardData(state);
    if (!c) return '';
    var focus = c.focusId ? getFocusById(c.focusId) : null;
    var sub = _t('Capaian sampai bulan lalu', 'Progress through last month') + ' · ' + c.months + '/12' +
        (focus ? ' · ' + _L(focus.label) : '');
    var rows = c.items.map(function (it) {
        var pct = Math.max(0, Math.min(100, Math.round(it.ratio * 100)));
        var actual = it.hasData ? _fmtTarget(it.key, it.actual) : '—';
        return '<div style="margin-top:8px;">' +
            '<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;">' +
                '<span>' + (it.passed ? '✔ ' : '') + escapeHtml(_L(TARGET_META[it.key].label)) + '</span>' +
                '<span style="color:' + (it.passed ? 'var(--success)' : 'var(--text-mute)') + ';">' + escapeHtml(actual) + ' / ' + escapeHtml(_fmtTarget(it.key, it.target)) + '</span>' +
            '</div>' +
            '<div style="height:5px;border-radius:3px;background:var(--border);margin-top:4px;overflow:hidden;">' +
                '<div style="height:100%;width:' + pct + '%;background:' + (it.passed ? 'var(--success)' : 'var(--accent)') + ';transition:width .3s;"></div>' +
            '</div></div>';
    }).join('');
    return '<div class="card" data-board-card>' +
        '<div class="card-title">' + escapeHtml(_t('Target Dewan ', 'Board Targets ') + c.year) + '</div>' +
        '<div style="font-size:11.5px;color:var(--text-mute);margin-top:2px;">' + escapeHtml(sub) + '</div>' +
        rows + '</div>';
}

// Pembangun HTML tanpa DOM, diekspor agar bisa diuji (tools/annual-review-test.mjs).
export { _reportHtml as buildReportHtml, _focusHtml as buildFocusHtml, _resultHtml as buildResultHtml };
