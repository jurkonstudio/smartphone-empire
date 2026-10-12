// FILE: src/core/SwipeService.js
// ============================================================
// SwipeService — deteksi swipe horizontal untuk ganti sub-tab.
// Fitur: throttle, no wrap-around, blacklist elemen, cleanup animasi.
// ============================================================

var SUBTABS = {
    research: ['tech', 'os'],
    products: ['design', 'catalog', 'sales'],
    market:   ['share', 'competitors', 'trends', 'public'],
    team:     ['active', 'recruit', 'info']
};

// State
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

// Konfigurasi
var THRESHOLD_PX = 60;        // minimum jarak horizontal
var MAX_DURATION_MS = 800;    // swipe terlalu lama = bukan swipe
var THROTTLE_MS = 250;        // jeda minimum antar trigger
var VERTICAL_TOLERANCE = 12;  // toleransi gerakan vertikal sebelum ignore
var ANIM_MS = 240;            // durasi animasi (harus sinkron dengan CSS)

// Elemen yang tidak boleh jadi starting point swipe
var BLACKLIST_SELECTORS = [
    '[data-no-swipe]',
    '.chip-bar',
    '.wiz-options-row',
    '.subtab-bar',
    'canvas',
    'input',
    'textarea',
    'select',
    'button',
    'a',
    'label'
];

// ============================================================
// INIT / STOP
// ============================================================
export function initSwipe(callbacks) {
    if (!callbacks) return;
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
    // Modal apapun yang visible
    if (document.querySelector('.modal-backdrop.visible')) return true;
    // Onboarding pakai modal juga
    if (document.querySelector('[data-modal-id="onboarding"]')) return true;
    // Tutorial overlay
    var tut = document.querySelector('.tut-root.visible');
    if (tut) return true;
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

function _getSubtabsForView(view) {
    if (!view) return null;
    if (view === 'products') {
        var tabs = ['design', 'catalog', 'sales'];
        try {
            var game = window.__game;
            if (game && game.state && game.state.get) {
                var data = game.state.get();
                var completed = (data.research && data.research.completed) || [];
                if (completed.indexOf('chip_design_tool') !== -1) tabs.push('chip');
            }
        } catch (e) {}
        return tabs;
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

    // No wrap-around: berhenti di ujung
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

    var target = e.target;
    if (_isBlacklisted(target)) return;

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

    // Kalau jelas scroll vertikal, tandai ignore
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

    // Batas minimum horizontal
    if (Math.abs(dx) < THRESHOLD_PX) return;

    // Bukan vertical
    if (Math.abs(dy) > Math.abs(dx)) return;

    // Terlalu lama? Bukan swipe
    if (dt > MAX_DURATION_MS) return;

    if (dx < 0) _cycleSubtab(1);
    else _cycleSubtab(-1);
}

function _onCancel() {
    _tracking = false;
    _ignore = false;
}

// ============================================================
// PUBLIC — helper untuk main.js
// ============================================================
export function showSwipeAnimation(direction) {
    var view = document.getElementById('app-view');
    if (!view) return;
    _cleanupAnimation();
    // Force reflow agar animasi bisa re-trigger
    void view.offsetWidth;
    if (direction > 0) view.classList.add('swipe-in-left');
    else view.classList.add('swipe-in-right');
    setTimeout(_cleanupAnimation, ANIM_MS + 40);
}
