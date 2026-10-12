// FILE: src/core/NavSliderDrag.js
// ============================================================
// NavSliderDrag — drag support untuk liquid glass nav slider.
// Sentuh & geser slider, lepas → snap ke tab terdekat.
// ============================================================

var _nav = null;
var _getActiveView = null;
var _navigate = null;

var _state = {
    dragging: false,
    moved: false,
    startX: 0,
    startSliderX: 0,
    itemW: 0,
    sliderW: 0,
    count: 0,
    activeIdx: 0,
    minX: 0,
    maxX: 0,
    lastHoverIdx: -1
};

// ============================================================
// INIT
// ============================================================
export function initNavSliderDrag(opts) {
    if (!opts) return;
    _nav = opts.nav || null;
    _getActiveView = opts.getActiveView || null;
    _navigate = opts.navigate || null;
    if (!_nav) return;

    _nav.addEventListener('touchstart', _onTouchStart, { passive: true });
    _nav.addEventListener('touchmove',  _onTouchMove,  { passive: true });
    _nav.addEventListener('touchend',   _onTouchEnd,   { passive: true });
    _nav.addEventListener('touchcancel', _onTouchCancel, { passive: true });

    _nav.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mouseup', _onMouseUp);

    console.info('[NavSliderDrag] siap.');
}

// ============================================================
// HELPERS
// ============================================================
function _slider() { return _nav ? _nav.querySelector('.nav-slider') : null; }
function _buttons() { return _nav ? _nav.querySelectorAll('.nav-btn') : []; }

function _readMetrics() {
    var buttons = _buttons();
    var navW = _nav.clientWidth;
    var count = buttons.length;
    var itemW = navW / count;
    var sliderW = Math.max(56, Math.min(itemW * 0.88, 80));
    return { navW: navW, count: count, itemW: itemW, sliderW: sliderW };
}

function _idxToX(idx, itemW, sliderW) {
    return idx * itemW + (itemW - sliderW) / 2;
}

function _nearestIdx(centerX) {
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < _state.count; i++) {
        var itemCenter = i * _state.itemW + _state.itemW / 2;
        var d = Math.abs(itemCenter - centerX);
        if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
}

function _highlight(idx) {
    if (idx === _state.lastHoverIdx) return;
    _state.lastHoverIdx = idx;
    var buttons = _buttons();
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle('drag-hover', i === idx);
    }
    // Haptic ringan saat melewati tab
    try {
        var s = (window.__game && window.__game.state) ? window.__game.state.get() : null;
        if (s && s.settings && s.settings.vibrate && navigator.vibrate) {
            navigator.vibrate(4);
        }
    } catch (e) {}
}

function _clearHighlight() {
    _state.lastHoverIdx = -1;
    var buttons = _buttons();
    for (var i = 0; i < buttons.length; i++) buttons[i].classList.remove('drag-hover');
}

// ============================================================
// DRAG START
// ============================================================
function _startAt(clientX) {
    var slider = _slider();
    if (!slider) return;
    var m = _readMetrics();
    if (m.count < 2) return;

    var buttons = _buttons();
    var activeIdx = 0;
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].classList.contains('active')) { activeIdx = i; break; }
    }

    _state.dragging = true;
    _state.moved = false;
    _state.startX = clientX;
    _state.itemW = m.itemW;
    _state.sliderW = m.sliderW;
    _state.count = m.count;
    _state.activeIdx = activeIdx;
    _state.startSliderX = _idxToX(activeIdx, m.itemW, m.sliderW);
    _state.minX = _idxToX(0, m.itemW, m.sliderW);
    _state.maxX = _idxToX(m.count - 1, m.itemW, m.sliderW);

    // Matikan transisi & tandai sedang drag
    slider.style.transition = 'none';
    _nav.dataset.dragging = '1';
    _nav.classList.add('dragging');
}

// ============================================================
// DRAG MOVE
// ============================================================
function _moveTo(clientX) {
    if (!_state.dragging) return;
    var slider = _slider();
    if (!slider) return;

    var dx = clientX - _state.startX;
    if (Math.abs(dx) > 6) _state.moved = true;

    var targetX = _state.startSliderX + dx;

    // Soft resistance di ujung
    if (targetX < _state.minX) {
        targetX = _state.minX + (targetX - _state.minX) * 0.32;
    }
    if (targetX > _state.maxX) {
        targetX = _state.maxX + (targetX - _state.maxX) * 0.32;
    }

    slider.style.transform = 'translateX(' + targetX + 'px) scale(1.03)';

    // Highlight tab terdekat
    var nearest = _nearestIdx(targetX + _state.sliderW / 2);
    _highlight(nearest);
}

// ============================================================
// DRAG END
// ============================================================
function _end() {
    if (!_state.dragging) return;
    _state.dragging = false;

    var slider = _slider();
    if (!slider) {
        delete _nav.dataset.dragging;
        _nav.classList.remove('dragging');
        return;
    }

    // Hapus tanda drag
    delete _nav.dataset.dragging;
    _nav.classList.remove('dragging');

    // Aktifkan kembali transisi spring
    slider.style.transition = '';
    slider.style.transform = '';

    if (!_state.moved) {
        // Tap biasa — biarkan handler click yang jalan
        _clearHighlight();
        return;
    }

    // Snap ke tab terdekat
    var transform = slider.style.transform;
    var curX = _state.startSliderX;
    // Ambil posisi terakhir dari inline style sebelum direset
    var lastTransform = slider.getAttribute('data-last-x');
    if (lastTransform) {
        curX = parseFloat(lastTransform) || _state.startSliderX;
    }

    var buttons = _buttons();
    var targetIdx = _nearestIdx(curX + _state.sliderW / 2);
    var snapX = _idxToX(targetIdx, _state.itemW, _state.sliderW);

    slider.style.transform = 'translateX(' + snapX + 'px)';

    _clearHighlight();

    // Navigate ke tab baru
    var btn = buttons[targetIdx];
    if (btn && _navigate) {
        var navId = btn.dataset.nav;
        if (navId) _navigate(navId);
    }
}

function _cancel() {
    _state.dragging = false;
    var slider = _slider();
    if (slider) {
        slider.style.transition = '';
        slider.style.transform = '';
    }
    delete _nav.dataset.dragging;
    _nav.classList.remove('dragging');
    _clearHighlight();
}

// ============================================================
// TOUCH
// ============================================================
function _onTouchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    _startAt(e.touches[0].clientX);
}

function _onTouchMove(e) {
    if (!_state.dragging) return;
    if (!e.touches || !e.touches[0]) return;
    // Simpan posisi terakhir di dataset untuk snap
    var slider = _slider();
    if (slider) {
        var tr = slider.style.transform;
        var m = tr.match(/translateX\(([\-\d.]+)px\)/);
        if (m) slider.setAttribute('data-last-x', m[1]);
    }
    _moveTo(e.touches[0].clientX);
}

function _onTouchEnd(_e) {
    _end();
}

function _onTouchCancel() {
    _cancel();
}

// ============================================================
// MOUSE (untuk desktop preview)
// ============================================================
function _onMouseDown(e) {
    if (e.button !== 0) return;
    _startAt(e.clientX);
}

function _onMouseMove(e) {
    if (!_state.dragging) return;
    var slider = _slider();
    if (slider) {
        var tr = slider.style.transform;
        var m = tr.match(/translateX\(([\-\d.]+)px\)/);
        if (m) slider.setAttribute('data-last-x', m[1]);
    }
    _moveTo(e.clientX);
}

function _onMouseUp() {
    _end();
}

export function isDragging() {
    return _state.dragging;
    }
