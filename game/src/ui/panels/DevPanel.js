// FILE: src/ui/panels/DevPanel.js
// ============================================================
// Dev Panel — floating button + bottom sheet.
// Self-bootstrap: poll window.__game sampai siap, lalu mount.
// Tidak perlu import dari main.js — cukup tambahkan <script> di index.html.
// v2027.3b — i18n: semua teks lewat _tf(); panel dirender ulang saat lang:changed.
// ============================================================
import { isDevMode, disableDevMode } from '../../config/dev.config.js';
import { bus } from '../../core/EventBus.js';
import { LanguageService, t } from '../../core/LanguageService.js';

// t(key); jika key belum ada di kamus, pakai fallback sesuai bahasa aktif. Vars diinterpolasi {n}.
function _tf(key, fbId, fbEn, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    var lang = 'id';
    try { lang = LanguageService.getLang(); } catch (e) {}
    var out = (lang === 'en') ? fbEn : fbId;
    if (vars) {
        for (var k in vars) {
            if (Object.prototype.hasOwnProperty.call(vars, k)) out = out.split('{' + k + '}').join(String(vars[k]));
        }
    }
    return out;
}

// Guard: kalau bukan dev mode, keluar tanpa melakukan apa pun.
if (!isDevMode()) {
    console.info('[DevPanel] Non-dev mode. Skip.');
} else {
    _bootstrap();
}

function _bootstrap() {
    if (typeof window === 'undefined') return;

    let attempts = 0;
    const MAX_ATTEMPTS = 100; // ~20 detik
    const POLL_MS = 200;

    const interval = setInterval(function () {
        attempts++;
        if (window.__game && window.__game.state && window.__game.cheat) {
            clearInterval(interval);
            _mount();
        } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(interval);
            console.warn('[DevPanel] Timeout menunggu window.__game.');
        }
    }, POLL_MS);
}

function _mount() {
    console.info('[DevPanel] Mounted.');

    // Inject styles sekali.
    _injectStyles();

    // Tombol floating.
    const btn = document.createElement('button');
    btn.id = 'dev-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', _tf('dev.fab_aria', 'Dev Panel', 'Dev Panel'));
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    document.body.appendChild(btn);

    // Backdrop.
    const backdrop = document.createElement('div');
    backdrop.id = 'dev-backdrop';
    backdrop.addEventListener('click', _closePanel);
    document.body.appendChild(backdrop);

    // Panel.
    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    panel.innerHTML = _panelHtml();
    document.body.appendChild(panel);

    // Bind tombol buka/tutup.
    btn.addEventListener('click', _openPanel);

    // Bind actions di dalam panel.
    _bindPanelActions(panel);

    // Start FPS counter kalau toggle on.
    _initFpsCounter();

    // Panel ini permanen (tidak pernah dilepas dari DOM) dan bukan bagian renderAll(),
    // jadi cukup satu listener untuk render ulang label saat bahasa berganti.
    bus.on('lang:changed', function () { _relabel(); });
}

function _relabel() {
    const panel = document.getElementById('dev-panel');
    if (!panel || !panel.isConnected) return;
    panel.innerHTML = _panelHtml();
    _bindPanelActions(panel);
    const btn = document.getElementById('dev-fab');
    if (btn) btn.setAttribute('aria-label', _tf('dev.fab_aria', 'Dev Panel', 'Dev Panel'));
}

// ============================================================
// PANEL HTML
// ============================================================
function _panelHtml() {
    function sec(label, cls) { return '<div class="dev-section' + (cls ? ' ' + cls : '') + '">' + label + '</div>'; }
    function btn(action, label, cls) {
        return '<button class="dev-btn' + (cls ? ' ' + cls : '') + '" data-dev="' + action + '">' + label + '</button>';
    }
    function row() {
        return '<div class="dev-row">' + Array.prototype.join.call(arguments, '') + '</div>';
    }

    return '' +
        '<div class="dev-head">' +
            '<div class="dev-title">🛠 ' + _tf('dev.title', 'Dev Panel', 'Dev Panel') + '</div>' +
            '<button class="dev-close" type="button" aria-label="' + _tf('dev.close_aria', 'Tutup', 'Close') + '">✕</button>' +
        '</div>' +
        '<div class="dev-body">' +

            sec(_tf('dev.sec.time', 'Waktu & Kecepatan', 'Time & Speed')) +
            row(
                btn('set-year-2000', '📅 ' + _tf('dev.btn.set_year', 'Atur {y}', 'Set {y}', { y: 2000 })),
                btn('set-year-2010', '📅 ' + _tf('dev.btn.set_year', 'Atur {y}', 'Set {y}', { y: 2010 })),
                btn('set-year-2020', '📅 ' + _tf('dev.btn.set_year', 'Atur {y}', 'Set {y}', { y: 2020 })),
                btn('set-year-prompt', '📅 ' + _tf('dev.btn.set_year_other', 'Atur…', 'Set…'))
            ) +
            row(
                btn('ff-30', '⏩ ' + _tf('dev.btn.ff_30', '+30 hari', '+30 days')),
                btn('ff-365', '⏩ ' + _tf('dev.btn.ff_365', '+1 tahun', '+1 year')),
                btn('toggle-pause', '⏯ ' + _tf('dev.btn.pause', 'Pause/Play', 'Pause/Play'))
            ) +

            sec(_tf('dev.sec.economy', 'Ekonomi', 'Economy')) +
            row(
                btn('cash-10k', '💰 +$10K'),
                btn('cash-100k', '💰 +$100K'),
                btn('cash-1m', '💰 +$1M')
            ) +

            sec(_tf('dev.sec.research', 'Riset', 'Research')) +
            row(
                btn('research-all', '🔬 ' + _tf('dev.btn.research_all', 'Riset Semua', 'Research All')),
                btn('chip-research-all', '🧩 ' + _tf('dev.btn.chip_all', 'Chip Semua', 'All Chips')),
                btn('unlock-chip-lab', '🔓 ' + _tf('dev.btn.chip_lab', 'Chip Lab', 'Chip Lab'))
            ) +

            sec(_tf('dev.sec.product', 'Produk', 'Product')) +
            row(
                btn('quick-release', '📱 ' + _tf('dev.btn.release', 'Rilis Produk', 'Release Product')),
                btn('quick-chip', '🔲 ' + _tf('dev.btn.design_chip', 'Desain Chip', 'Design Chip')),
                btn('build-fab', '🏭 ' + _tf('dev.btn.build_fab', 'Bangun Fab', 'Build Fab'))
            ) +

            sec(_tf('dev.sec.market', 'Pasar & Publik', 'Market & Public')) +
            row(
                btn('competitor-release', '🏢 ' + _tf('dev.btn.comp_release', 'Kompetitor Rilis', 'Competitor Release')),
                btn('viral-pos', '✨ ' + _tf('dev.btn.viral_pos', 'Viral Positif', 'Positive Viral')),
                btn('viral-neg', '⚠ ' + _tf('dev.btn.viral_neg', 'Viral Negatif', 'Negative Viral'))
            ) +
            row(
                btn('news-test', '📰 ' + _tf('dev.btn.news_test', 'Berita Test', 'Test News')),
                btn('bug-spawn', '🐛 ' + _tf('dev.btn.bug_spawn', 'Spawn Bug', 'Spawn Bug'))
            ) +

            sec(_tf('dev.sec.diag', 'Diagnostik', 'Diagnostics')) +
            row(
                btn('show-state', '📋 ' + _tf('dev.btn.state_json', 'State JSON', 'State JSON')),
                btn('show-fps', '📊 ' + _tf('dev.btn.fps', 'Toggle FPS', 'Toggle FPS'))
            ) +

            sec(_tf('dev.sec.danger', 'Zona Bahaya', 'Danger Zone'), 'dev-section-danger') +
            row(
                btn('reset-save', '🗑 ' + _tf('dev.btn.reset_save', 'Hapus Save & Reload', 'Delete Save & Reload'), 'dev-btn-danger')
            ) +
            row(
                btn('disable-dev', '🚪 ' + _tf('dev.btn.exit_dev', 'Keluar Dev Mode', 'Exit Dev Mode'), 'dev-btn-ghost')
            ) +

            '<div class="dev-foot">v2027.3b · dev.config.js</div>' +
        '</div>';
}

// ============================================================
// ACTIONS
// ============================================================
function _bindPanelActions(panel) {
    panel.querySelector('.dev-close').addEventListener('click', _closePanel);

    panel.querySelectorAll('[data-dev]').forEach(function (el) {
        el.addEventListener('click', function () {
            const action = el.getAttribute('data-dev');
            _runAction(action);
        });
    });
}

function _runAction(action) {
    const game = window.__game;
    if (!game) return;

    try {
        switch (action) {
            case 'set-year-2000': _setYear(2000); break;
            case 'set-year-2010': _setYear(2010); break;
            case 'set-year-2020': _setYear(2020); break;
            case 'set-year-prompt': {
                const y = prompt(_tf('dev.prompt.year', 'Set tahun (2000-2030):', 'Set year (2000-2030):'), String(game.state.get().time.currentYear));
                if (y) _setYear(parseInt(y, 10));
                break;
            }
            case 'ff-30':  game.cheat.fastForwardDays(30);  _toast(_tf('dev.t.ff_30', '+30 hari', '+30 days')); break;
            case 'ff-365': game.cheat.fastForwardDays(365); _toast(_tf('dev.t.ff_365', '+365 hari', '+365 days')); break;
            case 'toggle-pause': game.timeSystem.togglePause(); _toast(_tf('dev.t.pause', 'Toggle pause', 'Pause toggled')); break;

            case 'cash-10k':  game.cheat.addCash(10000);  _toast('+$10K'); break;
            case 'cash-100k': game.cheat.addCash(100000); _toast('+$100K'); break;
            case 'cash-1m':   game.cheat.addCash(1000000);_toast('+$1M'); break;

            case 'research-all':      game.cheat.completeAllResearch();      _toast(_tf('dev.t.research_done', 'Riset lengkap', 'Research complete')); break;
            case 'chip-research-all': game.cheat.completeAllChipResearch(); _toast(_tf('dev.t.chip_research_done', 'Chip research lengkap', 'Chip research complete')); break;
            case 'unlock-chip-lab':   game.cheat.unlockChipDesign();        _toast(_tf('dev.t.chip_lab_open', 'Chip Lab terbuka', 'Chip Lab unlocked')); break;

            case 'quick-release': game.cheat.quickRelease(); _toast(_tf('dev.t.released', 'Produk dirilis', 'Product released')); break;
            case 'quick-chip':    game.cheat.quickDesignChip({}); _toast(_tf('dev.t.chip_designed', 'Chip didesain', 'Chip designed')); break;
            case 'build-fab':     game.cheat.buildFab(1);    _toast(_tf('dev.t.fab_built', 'Fab dibangun', 'Fab built')); break;

            case 'competitor-release': _competitorRelease(); break;
            case 'viral-pos': game.opinion.forceViral('positive'); _toast(_tf('dev.t.viral_pos', 'Viral positif', 'Positive viral')); break;
            case 'viral-neg': game.opinion.forceViral('negative'); _toast(_tf('dev.t.viral_neg', 'Viral negatif', 'Negative viral')); break;

            case 'news-test': game.cheat.testNews(); _toast(_tf('dev.t.news_test', 'Berita test', 'Test news')); break;
            case 'bug-spawn': game.os.spawnBug();    _toast(_tf('dev.t.bug_spawned', 'Bug muncul', 'Bug spawned')); break;

            case 'show-state':  _showStateJson(); break;
            case 'show-fps':    _toggleFps(); break;

            case 'reset-save':
                if (confirm(_tf('dev.confirm.reset', 'Hapus save & reload? Tidak bisa dibatalkan.', 'Delete save & reload? This cannot be undone.'))) {
                    try {
                        // Hapus semua localStorage terkait game.
                        Object.keys(localStorage).forEach(function (k) {
                            if (k.indexOf('se_') === 0 || k.indexOf('smartphone') === 0) {
                                localStorage.removeItem(k);
                            }
                        });
                    } catch (e) {}
                    location.reload();
                }
                break;

            case 'disable-dev':
                if (confirm(_tf('dev.confirm.disable', 'Matikan dev mode? Reload untuk menerapkan.', 'Disable dev mode? Reload to apply.'))) {
                    disableDevMode();
                    location.reload();
                }
                break;

            default:
                console.warn('[DevPanel] Unknown action:', action);
        }
    } catch (err) {
        console.error('[DevPanel] Action error:', action, err);
        _toast(_tf('dev.t.error', 'Error: {msg}', 'Error: {msg}', { msg: (err.message || action) }), true);
    }
}

function _setYear(year) {
    const game = window.__game;
    if (!game || !game.state) return;
    const cur = game.state.get().time.currentYear;
    if (year === cur) { _toast(_tf('dev.t.year_same', 'Sudah tahun {y}', 'Already year {y}', { y: year })); return; }
    game.cheat.setYear(year);
    _toast(_tf('dev.t.year_set', 'Tahun {y}', 'Year {y}', { y: year }));
}

function _competitorRelease() {
    const game = window.__game;
    if (!game || !game.competitors) return;
    const ids = game.competitors.getActiveIds();
    if (!ids.length) { _toast(_tf('dev.t.no_competitor', 'Tidak ada kompetitor aktif', 'No active competitors'), true); return; }
    const id = ids[Math.floor(Math.random() * ids.length)];
    game.competitors.forceRelease(id);
    _toast(_tf('dev.t.comp_released', 'Rilis: {id}', 'Released: {id}', { id: id }));
}

function _showStateJson() {
    const game = window.__game;
    if (!game || !game.state) return;
    const json = JSON.stringify(game.state.get(), null, 2);
    console.log('[DevPanel] State JSON:');
    console.log(json);
    // Copy ke clipboard (best effort)
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(json);
            _toast(_tf('dev.t.state_both', 'State JSON → console + clipboard', 'State JSON → console + clipboard'));
        } else {
            _toast(_tf('dev.t.state_console', 'State JSON → console', 'State JSON → console'));
        }
    } catch (e) {
        _toast(_tf('dev.t.state_console', 'State JSON → console', 'State JSON → console'));
    }
}

// ============================================================
// FPS COUNTER
// ============================================================
let _fpsRaf = null;
let _fpsFrames = 0;
let _fpsLastTime = 0;
let _fpsEl = null;

function _initFpsCounter() {
    _fpsEl = document.createElement('div');
    _fpsEl.id = 'dev-fps';
    _fpsEl.style.display = 'none';
    _fpsEl.textContent = '-- FPS';
    document.body.appendChild(_fpsEl);
}

function _toggleFps() {
    if (!_fpsEl) return;
    const visible = _fpsEl.style.display !== 'none';
    if (visible) {
        _fpsEl.style.display = 'none';
        if (_fpsRaf) { cancelAnimationFrame(_fpsRaf); _fpsRaf = null; }
        _toast(_tf('dev.t.fps_off', 'FPS mati', 'FPS off'));
    } else {
        _fpsEl.style.display = 'block';
        _fpsFrames = 0;
        _fpsLastTime = performance.now();
        _fpsLoop();
        _toast(_tf('dev.t.fps_on', 'FPS hidup', 'FPS on'));
    }
}

function _fpsLoop() {
    _fpsFrames++;
    const now = performance.now();
    const delta = now - _fpsLastTime;
    if (delta >= 500) {
        const fps = Math.round((_fpsFrames * 1000) / delta);
        if (_fpsEl) _fpsEl.textContent = fps + ' FPS';
        _fpsFrames = 0;
        _fpsLastTime = now;
    }
    _fpsRaf = requestAnimationFrame(_fpsLoop);
}

// ============================================================
// TOAST + UI HELPERS
// ============================================================
function _toast(msg, isError) {
    try {
        const game = window.__game;
        if (game && game.ToastService) {
            if (isError && game.ToastService.error) game.ToastService.error(msg);
            else if (game.ToastService.info) game.ToastService.info(msg);
            return;
        }
    } catch (e) {}
    // Fallback: console
    console.log('[DevPanel]', msg);
}

function _openPanel() {
    const panel = document.getElementById('dev-panel');
    const backdrop = document.getElementById('dev-backdrop');
    const btn = document.getElementById('dev-fab');
    if (panel) panel.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (btn) btn.classList.add('hidden');
}

function _closePanel() {
    const panel = document.getElementById('dev-panel');
    const backdrop = document.getElementById('dev-backdrop');
    const btn = document.getElementById('dev-fab');
    if (panel) panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (btn) btn.classList.remove('hidden');
}

// ============================================================
// STYLES (inline, tidak menyentuh style.css)
// ============================================================
function _injectStyles() {
    if (document.getElementById('dev-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'dev-panel-styles';
    style.textContent = `
        #dev-fab {
            position: fixed;
            right: 14px;
            bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            z-index: 9000;
            width: 44px; height: 44px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.15);
            background: linear-gradient(135deg, #1a1a2a, #0a0a15);
            color: #7af;
            box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 0 1px rgba(122,170,255,0.15);
            cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
            transition: transform 0.15s, opacity 0.15s;
            font-family: inherit;
        }
        #dev-fab:hover { transform: scale(1.08); }
        #dev-fab:active { transform: scale(0.94); }
        #dev-fab.hidden { opacity: 0; pointer-events: none; transform: scale(0.8); }

        #dev-backdrop {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.55);
            opacity: 0; pointer-events: none;
            transition: opacity 0.22s;
            z-index: 9001;
        }
        #dev-backdrop.open { opacity: 1; pointer-events: auto; }

        #dev-panel {
            position: fixed;
            left: 0; right: 0; bottom: 0;
            max-height: 85vh;
            background: #0f1218;
            color: #e8eaee;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            border: 1px solid rgba(255,255,255,0.1);
            border-bottom: none;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.6);
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
            z-index: 9002;
            display: flex; flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            overflow: hidden;
            padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        #dev-panel.open { transform: translateY(0); }

        .dev-head {
            display: flex; justify-content: space-between; align-items: center;
            padding: 14px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            flex-shrink: 0;
        }
        .dev-title {
            font-size: 15px; font-weight: 700;
            letter-spacing: -0.01em;
        }
        .dev-close {
            background: transparent; border: none;
            color: #8a92a0; font-size: 16px;
            cursor: pointer; padding: 4px 8px;
            border-radius: 6px;
            font-family: inherit;
            transition: background 0.15s;
        }
        .dev-close:hover { background: rgba(255,255,255,0.06); color: #e8eaee; }

        .dev-body {
            flex: 1;
            overflow-y: auto;
            padding: 8px 14px 20px;
            -webkit-overflow-scrolling: touch;
        }

        .dev-section {
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #6a7280;
            margin: 14px 4px 6px;
        }
        .dev-section-danger { color: #ef4444; }

        .dev-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 6px;
        }

        .dev-btn {
            padding: 10px 12px;
            background: #1e2530;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            color: #e8eaee;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            text-align: left;
            font-family: inherit;
            transition: background 0.12s, border-color 0.12s, transform 0.06s;
            min-height: 40px;
            line-height: 1.3;
        }
        .dev-btn:hover { background: #2a3341; border-color: rgba(255,255,255,0.15); }
        .dev-btn:active { transform: scale(0.97); }
        .dev-btn-danger {
            background: rgba(239,68,68,0.14);
            border-color: rgba(239,68,68,0.28);
            color: #ef4444;
        }
        .dev-btn-danger:hover { background: rgba(239,68,68,0.22); }
        .dev-btn-ghost {
            background: transparent;
            color: #8a92a0;
            grid-column: 1 / -1;
        }
        .dev-btn-ghost:hover { background: rgba(255,255,255,0.04); color: #e8eaee; }

        .dev-foot {
            text-align: center;
            font-size: 10px;
            color: #4a5260;
            padding-top: 14px;
            margin-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.06);
        }

        #dev-fps {
            position: fixed;
            top: 8px; right: 8px;
            z-index: 8999;
            background: rgba(0,0,0,0.75);
            color: #7af;
            font-family: ui-monospace, monospace;
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 4px;
            pointer-events: none;
            font-variant-numeric: tabular-nums;
        }

        @media (min-width: 600px) {
            #dev-panel { max-width: 480px; left: auto; right: 16px; bottom: 16px; border-radius: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        }
    `;
    document.head.appendChild(style);
      }
