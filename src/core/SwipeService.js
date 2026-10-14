// FILE: src/core/SwipeService.js
// ============================================================
// SwipeService — swipe horizontal untuk pindah sub-tab.
// View -> daftar sub-tab (urutan sesuai urutan tampil di UI).
//
// CATATAN: research punya chip subtab KONDISIONAL — muncul otomatis
// kalau 'chip_design_tool' sudah ada di research.completed.
// ResearchPanel.js harus support rendering 'chip' sebelum ini aktif
// sepenuhnya. Kalau belum, swipe ke 'chip' akan fallback ke Teknologi.
// ============================================================

var SUBTABS = {
    // research: dinamis, lihat _getSubtabsForView()
    products: ['design', 'catalog', 'sales'],
    market:   ['share', 'competitors', 'trends', 'public'],
    team:     ['active', 'recruit', 'info']
};

var _getView = null;
var _getSubtab = null;
var _setSubtab = null;

var _startX = 0;
var _startY = 0;
var _startTime = 0;
var _tracking = false;
var _ignore = false;
var _running = false;
var _lastTrigger = 0;

var THRESHOLD_PX = 50;
var MAX_DURATION_MS = 900;
var THROTTLE_MS = 220;
var VERTICAL_TOLERANCE = 15;

var BLACKLIST_SELECTORS = [
    '.chip-bar',
    '.wiz-options-row',
    '.subtab-bar',
    '.home-carousel',       
    'canvas',
    'input',
    'textarea',
    'select'
];

// ============================================================
// INIT
// ============================================================
export function initSwipe(callbacks) {
    if (!callbacks) { console.warn('[Swipe] callbacks kosong'); return; }
    _getView    = callbacks.getView || null;
    _getSubtab  = callbacks.getSubtab || null;
    _setSubtab  = callbacks.setSubtab || null;

    if (!_running) {
        document.addEventListener('touchstart', _onStart, { passive: true });
        document.addEventListener('touchmove',  _onMove,  { passive: true });
        document.addEventListener('touchend',   _onEnd,   { passive: true });
        document.addEventListener('touchcancel', _onCancel, { passive: true });
        _running = true;
    }
}

export function stopSwipe() {
    if (!_running) return;
    document.removeEventListener('touchstart', _onStart);
    document.removeEventListener('touchmove',  _onMove);
    document.removeEventListener('touchend',   _onEnd);
    document.removeEventListener('touchcancel', _onCancel);
    _running = false;
}

// ============================================================
// HELPERS
// ============================================================
function _isModalOpen() {
    if (document.querySelector('.modal-backdrop.visible')) return true;
    if (document.querySelector('[data-modal-id="onboarding"]')) return true;
    if (document.querySelector('.tut-root.visible')) return true;
    return false;
}

function _isBlacklisted(target) {
    if (!target) return true;
    for (var i = 0; i < BLACKLIST_SELECTORS.length; i++) {
        try {
            if (target.closest(BLACKLIST_SELECTORS[i])) return true;
        } catch (e) {}
    }
    return false;
}

// Ambil daftar sub-tab untuk view tertentu.
// Research & Products punya item KONDISIONAL yang muncul kalau
// 'chip_design_tool' sudah selesai (chip lab terbuka).
function _getSubtabsForView(view) {
    if (!view) return null;

    var completed = [];
    try {
        var game = window.__game;
        if (game && game.state && game.state.get) {
            var data = game.state.get();
            completed = (data.research && data.research.completed) || [];
        }
    } catch (e) { completed = []; }

    var chipUnlocked = completed.indexOf('chip_design_tool') !== -1;

    if (view === 'research') {
        var rtabs = ['tech', 'os', 'sejarah'];
        if (chipUnlocked) rtabs.push('chip');
        return rtabs;
    }

    if (view === 'products') {
        var ptabs = ['design', 'catalog', 'sales'];
        if (chipUnlocked) ptabs.push('chip');
        return ptabs;
    }

    if (SUBTABS[view]) return SUBTABS[view].slice();
    return null;
}

function _cycleSubtab(direction) {
    var now = Date.now();
    if (now - _lastTrigger < THROTTLE_MS) return;

    var view = _getView ? _getView() : null;
    if (!view) return;

    var tabs = _getSubtabsForView(view);
    if (!tabs || tabs.length < 2) return;

    var currentId = _getSubtab ? _getSubtab() : null;
    var idx = tabs.indexOf(currentId);
    if (idx < 0) idx = 0;

    var nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= tabs.length) return;

    _lastTrigger = now;
    var nextId = tabs[nextIdx];
    if (_setSubtab) _setSubtab(nextId, direction);
}

function _cleanupAnimation() {
    var view = document.getElementById('app-view');
    if (!view) return;
    view.classList.remove('swipe-in-left', 'swipe-in-right');
}

// ============================================================
// TOUCH HANDLERS
// ============================================================
function _onStart(e) {
    _tracking = false;
    _ignore = false;

    if (_isModalOpen()) return;
    if (!e.touches || !e.touches[0]) return;
    if (_isBlacklisted(e.target)) return;

    _startX = e.touches[0].clientX;
    _startY = e.touches[0].clientY;
    _startTime = Date.now();
    _tracking = true;
}

function _onMove(e) {
    if (!_tracking || _ignore) return;
    if (!e.touches || !e.touches[0]) return;

    var dx = e.touches[0].clientX - _startX;
    var dy = e.touches[0].clientY - _startY;

    if (Math.abs(dy) > VERTICAL_TOLERANCE && Math.abs(dy) > Math.abs(dx)) {
        _ignore = true;
    }
}

function _onEnd(e) {
    if (!_tracking || _ignore) { _tracking = false; return; }
    _tracking = false;

    if (!e.changedTouches || !e.changedTouches[0]) return;

    var dx = e.changedTouches[0].clientX - _startX;
    var dy = e.changedTouches[0].clientY - _startY;
    var dt = Date.now() - _startTime;

    if (Math.abs(dx) < THRESHOLD_PX) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dt > MAX_DURATION_MS) return;

    if (dx < 0) _cycleSubtab(1);
    else _cycleSubtab(-1);
}

function _onCancel() {
    _tracking = false;
    _ignore = false;
}

// ============================================================
// PUBLIC
// ============================================================
export function showSwipeAnimation(direction) {
    var view = document.getElementById('app-view');
    if (!view) return;
    _cleanupAnimation();
    void view.offsetWidth;
    if (direction > 0) view.classList.add('swipe-in-left');
    else view.classList.add('swipe-in-right');
    setTimeout(_cleanupAnimation, 280);
}
