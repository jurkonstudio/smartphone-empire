// FILE: src/ui/panels/DevPanel.js
// ============================================================
// Dev Panel — floating button + bottom sheet.
// Self-bootstrap: poll window.__game sampai siap, lalu mount.
// Tidak perlu import dari main.js — cukup tambahkan <script> di index.html.
// ============================================================
import { isDevMode, disableDevMode } from '../../config/dev.config.js';

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
    btn.setAttribute('aria-label', 'Dev Panel');
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
}

// ============================================================
// PANEL HTML
// ============================================================
function _panelHtml() {
    return '' +
        '<div class="dev-head">' +
            '<div class="dev-title">🛠 Dev Panel</div>' +
            '<button class="dev-close" type="button" aria-label="Tutup">✕</button>' +
        '</div>' +
        '<div class="dev-body">' +

            '<div class="dev-section">Time & Speed</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="set-year-2000">📅 Set 2000</button>' +
                '<button class="dev-btn" data-dev="set-year-2010">📅 Set 2010</button>' +
                '<button class="dev-btn" data-dev="set-year-2020">📅 Set 2020</button>' +
                '<button class="dev-btn" data-dev="set-year-prompt">📅 Set…</button>' +
            '</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="ff-30">⏩ +30 hari</button>' +
                '<button class="dev-btn" data-dev="ff-365">⏩ +1 tahun</button>' +
                '<button class="dev-btn" data-dev="toggle-pause">⏯ Pause/Play</button>' +
            '</div>' +

            '<div class="dev-section">Ekonomi</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="cash-10k">💰 +$10K</button>' +
                '<button class="dev-btn" data-dev="cash-100k">💰 +$100K</button>' +
                '<button class="dev-btn" data-dev="cash-1m">💰 +$1M</button>' +
            '</div>' +

            '<div class="dev-section">Riset</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="research-all">🔬 Riset Semua</button>' +
                '<button class="dev-btn" data-dev="chip-research-all">🧩 Chip Semua</button>' +
                '<button class="dev-btn" data-dev="unlock-chip-lab">🔓 Chip Lab</button>' +
            '</div>' +

            '<div class="dev-section">Produk</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="quick-release">📱 Rilis Produk</button>' +
                '<button class="dev-btn" data-dev="quick-chip">🔲 Desain Chip</button>' +
                '<button class="dev-btn" data-dev="build-fab">🏭 Bangun Fab</button>' +
            '</div>' +

            '<div class="dev-section">Pasar & Publik</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="competitor-release">🏢 Kompetitor Rilis</button>' +
                '<button class="dev-btn" data-dev="viral-pos">✨ Viral Positif</button>' +
                '<button class="dev-btn" data-dev="viral-neg">⚠ Viral Negatif</button>' +
            '</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="news-test">📰 Berita Test</button>' +
                '<button class="dev-btn" data-dev="bug-spawn">🐛 Spawn Bug</button>' +
            '</div>' +

            '<div class="dev-section">Diagnostik</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn" data-dev="show-state">📋 State JSON</button>' +
                '<button class="dev-btn" data-dev="show-fps">📊 Toggle FPS</button>' +
            '</div>' +

            '<div class="dev-section dev-section-danger">Zona Bahaya</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn dev-btn-danger" data-dev="reset-save">🗑 Hapus Save & Reload</button>' +
            '</div>' +
            '<div class="dev-row">' +
                '<button class="dev-btn dev-btn-ghost" data-dev="disable-dev">🚪 Keluar Dev Mode</button>' +
            '</div>' +

            '<div class="dev-foot">v2027.3a · dev.config.js</div>' +
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
                const y = prompt('Set tahun (2000-2030):', String(game.state.get().time.currentYear));
                if (y) _setYear(parseInt(y, 10));
                break;
            }
            case 'ff-30':  game.cheat.fastForwardDays(30);  _toast('+30 hari'); break;
            case 'ff-365': game.cheat.fastForwardDays(365); _toast('+365 hari'); break;
            case 'toggle-pause': game.timeSystem.togglePause(); _toast('Toggle pause'); break;

            case 'cash-10k':  game.cheat.addCash(10000);  _toast('+$10K'); break;
            case 'cash-100k': game.cheat.addCash(100000); _toast('+$100K'); break;
            case 'cash-1m':   game.cheat.addCash(1000000);_toast('+$1M'); break;

            case 'research-all':      game.cheat.completeAllResearch();      _toast('Riset lengkap'); break;
            case 'chip-research-all': game.cheat.completeAllChipResearch(); _toast('Chip research lengkap'); break;
            case 'unlock-chip-lab':   game.cheat.unlockChipDesign();        _toast('Chip Lab terbuka'); break;

            case 'quick-release': game.cheat.quickRelease(); _toast('Produk dirilis'); break;
            case 'quick-chip':    game.cheat.quickDesignChip({}); _toast('Chip didesain'); break;
            case 'build-fab':     game.cheat.buildFab(1);    _toast('Fab dibangun'); break;

            case 'competitor-release': _competitorRelease(); break;
            case 'viral-pos': game.opinion.forceViral('positive'); _toast('Viral positif'); break;
            case 'viral-neg': game.opinion.forceViral('negative'); _toast('Viral negatif'); break;

            case 'news-test': game.cheat.testNews(); _toast('Berita test'); break;
            case 'bug-spawn': game.os.spawnBug();    _toast('Bug muncul'); break;

            case 'show-state':  _showStateJson(); break;
            case 'show-fps':    _toggleFps(); break;

            case 'reset-save':
                if (confirm('Hapus save & reload? Tidak bisa dibatalkan.')) {
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
                if (confirm('Matikan dev mode? Reload untuk menerapkan.')) {
                    disableDevMode();
                    location.reload();
                }
                break;

            default:
                console.warn('[DevPanel] Unknown action:', action);
        }
    } catch (err) {
        console.error('[DevPanel] Action error:', action, err);
        _toast('Error: ' + (err.message || action), true);
    }
}

function _setYear(year) {
    const game = window.__game;
    if (!game || !game.state) return;
    const cur = game.state.get().time.currentYear;
    if (year === cur) { _toast('Sudah tahun ' + year); return; }
    game.cheat.setYear(year);
    _toast('Tahun ' + year);
}

function _competitorRelease() {
    const game = window.__game;
    if (!game || !game.competitors) return;
    const ids = game.competitors.getActiveIds();
    if (!ids.length) { _toast('Tidak ada kompetitor aktif', true); return; }
    const id = ids[Math.floor(Math.random() * ids.length)];
    game.competitors.forceRelease(id);
    _toast('Rilis: ' + id);
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
            _toast('State JSON → console + clipboard');
        } else {
            _toast('State JSON → console');
        }
    } catch (e) {
        _toast('State JSON → console');
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
        _toast('FPS off');
    } else {
        _fpsEl.style.display = 'block';
        _fpsFrames = 0;
        _fpsLastTime = performance.now();
        _fpsLoop();
        _toast('FPS on');
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
