// FILE: src/core/NavSliderDrag.js
// ============================================================
// NavSliderDrag — drag support untuk liquid glass nav slider.
// Drag hanya aktif jika jari mulai di sekitar slider kaca.
// ============================================================

var _nav = null;
var _getActiveView = null;
var _navigate = null;

var DRAG_START_THRESHOLD = 15;
var SLIDER_HIT_PADDING = 10;
var FLICK_VELOCITY = 0.55;
var VELOCITY_WINDOW = 80;
var TAP_MAX_DURATION = 220;
var IGNORE_MOUSE_AFTER_TOUCH = 500;

var _ignoreMouseUntil = 0;

var _state = {
    dragging: false,
    pending: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    startSliderX: 0,
    currentX: 0,
    itemW: 0,
    sliderW: 0,
    baseSliderW: 0,
    count: 0,
    activeIdx: 0,
    minX: 0,
    maxX: 0,
    lastHoverIdx: -1,
    rafId: null,
    pendingX: null,
    lastSampleX: 0,
    lastSampleT: 0,
    velocity: 0
};

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

function _isNearSlider(clientX) {
    var slider = _slider();
    if (!slider) return false;
    var rect = slider.getBoundingClientRect();
    return clientX >= (rect.left - SLIDER_HIT_PADDING) &&
           clientX <= (rect.right + SLIDER_HIT_PADDING);
}

function _highlight(idx) {
    if (idx === _state.lastHoverIdx) return;
    _state.lastHoverIdx = idx;
    var buttons = _buttons();
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle('drag-hover', i === idx);
    }
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

function _hapticSnap() {
    try {
        var s = (window.__game && window.__game.state) ? window.__game.state.get() : null;
        if (s && s.settings && s.settings.vibrate && navigator.vibrate) {
            navigator.vibrate(8);
        }
    } catch (e) {}
}

function _beginDrag(originX) {
    var slider = _slider();
    if (!slider) return false;
    var m = _readMetrics();
    if (m.count < 2) return false;

    var buttons = _buttons();
    var activeIdx = 0;
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].classList.contains('active')) { activeIdx = i; break; }
    }

    _state.dragging = true;
    _state.pending = false;
    _state.startX = originX;
    _state.itemW = m.itemW;
    _state.sliderW = m.sliderW;
    _state.baseSliderW = m.sliderW;
    _state.count = m.count;
    _state.activeIdx = activeIdx;
    _state.startSliderX = _idxToX(activeIdx, m.itemW, m.sliderW);
    _state.currentX = _state.startSliderX;
    _state.minX = _idxToX(0, m.itemW, m.sliderW);
    _state.maxX = _idxToX(m.count - 1, m.itemW, m.sliderW);
    _state.velocity = 0;
    _state.lastSampleX = originX;
    _state.lastSampleT = Date.now();

    slider.style.transition = 'none';
    _nav.dataset.dragging = '1';
    _nav.classList.add('dragging');
    return true;
}

function _sampleVelocity(x) {
    var now = Date.now();
    var dt = now - _state.lastSampleT;
    if (dt < VELOCITY_WINDOW) return;
    var dx = x - _state.lastSampleX;
    var v = dx / dt;
    _state.velocity = _state.velocity * 0.4 + v * 0.6;
    _state.lastSampleX = x;
    _state.lastSampleT = now;
}

function _moveTo(clientX) {
    if (!_state.dragging) return;
    var slider = _slider();
    if (!slider) return;

    _sampleVelocity(clientX);

    var dx = clientX - _state.startX;
    var targetX = _state.startSliderX + dx;

    if (targetX < _state.minX) {
        targetX = _state.minX + (targetX - _state.minX) * 0.32;
    }
    if (targetX > _state.maxX) {
        targetX = _state.maxX + (targetX - _state.maxX) * 0.32;
    }

    _state.currentX = targetX;

    var vAbs = Math.min(Math.abs(_state.velocity), 2);
    var stretch = 1 + Math.min(vAbs * 0.06, 0.12);
    var squashW = _state.baseSliderW * stretch;
    var wDelta = squashW - _state.baseSliderW;
    var squashX = targetX - wDelta / 2;

    slider.style.width = squashW + 'px';
    slider.style.transform = 'translateX(' + squashX + 'px)';

    var nearest = _nearestIdx(squashX + squashW / 2);
    _highlight(nearest);
}

function _flushMove() {
    _state.rafId = null;
    if (_state.pendingX === null) return;
    var x = _state.pendingX;
    _state.pendingX = null;
    _moveTo(x);
}

function _end() {
    if (!_state.dragging) return;
    _state.dragging = false;

    if (_state.rafId !== null) {
        cancelAnimationFrame(_state.rafId);
        _state.rafId = null;
    }
    if (_state.pendingX !== null) {
        _moveTo(_state.pendingX);
        _state.pendingX = null;
    }

    var slider = _slider();
    if (!slider) {
        delete _nav.dataset.dragging;
        _nav.classList.remove('dragging');
        return;
    }

    delete _nav.dataset.dragging;
    _nav.classList.remove('dragging');

    slider.style.transition = '';
    slider.style.width = _state.baseSliderW + 'px';

    var buttons = _buttons();
    var nearestIdx = _nearestIdx(_state.currentX + _state.baseSliderW / 2);

    _clearHighlight();

    var targetIdx = nearestIdx;
    var vAbs = Math.abs(_state.velocity);
    if (vAbs > FLICK_VELOCITY) {
        if (_state.velocity > 0 && nearestIdx < _state.count - 1) {
            targetIdx = Math.max(nearestIdx, _state.activeIdx + 1);
        } else if (_state.velocity < 0 && nearestIdx > 0) {
            targetIdx = Math.min(nearestIdx, _state.activeIdx - 1);
        }
    }

    if (targetIdx === _state.activeIdx) {
        slider.style.transform = 'translateX(' + _idxToX(targetIdx, _state.itemW, _state.baseSliderW) + 'px)';
        return;
    }

    var btn = buttons[targetIdx];
    if (btn && _navigate) {
        _hapticSnap();
        var navId = btn.dataset.nav;
        if (navId) _navigate(navId);
    }
}

function _cancel() {
    _state.dragging = false;
    _state.pending = false;
    if (_state.rafId !== null) {
        cancelAnimationFrame(_state.rafId);
        _state.rafId = null;
    }
    _state.pendingX = null;

    var slider = _slider();
    if (slider) {
        slider.style.transition = '';
        slider.style.width = '';
        slider.style.transform = '';
    }
    delete _nav.dataset.dragging;
    _nav.classList.remove('dragging');
    _clearHighlight();
}

function _onTouchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    if (_state.dragging) return;

    _ignoreMouseUntil = Date.now() + IGNORE_MOUSE_AFTER_TOUCH;

    var x = e.touches[0].clientX;
    var y = e.touches[0].clientY;

    if (!_isNearSlider(x)) {
        _state.pending = false;
        return;
    }

    _state.pending = true;
    _state.startX = x;
    _state.startY = y;
    _state.startTime = Date.now();
}

function _onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    var x = e.touches[0].clientX;
    var y = e.touches[0].clientY;

    if (!_state.dragging && _state.pending) {
        var dx = x - _state.startX;
        var dy = y - _state.startY;
        var dt = Date.now() - _state.startTime;

        if (Math.abs(dy) > DRAG_START_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
            _state.pending = false;
            return;
        }

        var moved = Math.abs(dx) > DRAG_START_THRESHOLD && Math.abs(dx) > Math.abs(dy);
        var longEnough = dt > TAP_MAX_DURATION;

        if (moved && longEnough) {
            if (!_beginDrag(_state.startX)) {
                _state.pending = false;
                return;
            }
            _state.pendingX = x;
            if (_state.rafId === null) {
                _state.rafId = requestAnimationFrame(_flushMove);
            }
        }
        return;
    }

    if (_state.dragging) {
        _state.pendingX = x;
        if (_state.rafId === null) {
            _state.rafId = requestAnimationFrame(_flushMove);
        }
    }
}

function _onTouchEnd(_e) {
    _state.pending = false;
    if (_state.dragging) {
        _end();
    }
}

function _onTouchCancel() {
    _cancel();
}

function _onMouseDown(e) {
    if (e.button !== 0) return;
    if (_state.dragging) return;
    if (Date.now() < _ignoreMouseUntil) return;

    if (!_isNearSlider(e.clientX)) {
        _state.pending = false;
        return;
    }

    _state.pending = true;
    _state.startX = e.clientX;
    _state.startY = e.clientY;
    _state.startTime = Date.now();
}

function _onMouseMove(e) {
    if (!_state.dragging && _state.pending) {
        var dx = e.clientX - _state.startX;
        var dy = e.clientY - _state.startY;
        var dt = Date.now() - _state.startTime;

        if (Math.abs(dy) > DRAG_START_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
            _state.pending = false;
            return;
        }
        if (Math.abs(dx) > DRAG_START_THRESHOLD && Math.abs(dx) > Math.abs(dy) && dt > TAP_MAX_DURATION) {
            if (!_beginDrag(_state.startX)) {
                _state.pending = false;
                return;
            }
        } else {
            return;
        }
    }
    if (_state.dragging) {
        _state.pendingX = e.clientX;
        if (_state.rafId === null) {
            _state.rafId = requestAnimationFrame(_flushMove);
        }
    }
}

function _onMouseUp() {
    _state.pending = false;
    if (_state.dragging) {
        _end();
    }
}

export function isDragging() {
    return _state.dragging;
}
