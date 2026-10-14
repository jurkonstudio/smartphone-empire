// FILE: src/core/AudioService.js
// v2027.14a — Web Audio synth tap sounds. Zero asset.
// 5 sounds: tap, select, toggle, success, error.
// Respect settings.sound via setEnabled.
import { bus } from './EventBus.js';

let _ctx = null;
let _masterGain = null;
let _enabled = true;
let _unlocked = false;
let _toastBound = false;

const MASTER_VOLUME = 0.20;

// ============================================================
// CORE
// ============================================================
function _ensureCtx() {
    if (_ctx) return _ctx;
    try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        _ctx = new Ctx();
        _masterGain = _ctx.createGain();
        _masterGain.gain.value = MASTER_VOLUME;
        _masterGain.connect(_ctx.destination);
    } catch (e) {
        console.warn('[AudioService] AudioContext unavailable:', e);
        _ctx = null;
    }
    return _ctx;
}

function _resumeCtx() {
    var ctx = _ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
        try { ctx.resume().catch(function () {}); } catch (e) {}
    }
}

// ============================================================
// PRIMITIVES
// ============================================================
function _tone(opts) {
    var ctx = _ensureCtx();
    if (!ctx || !_masterGain) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, now);
    if (opts.freqEnd) {
        try { osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, now + opts.duration); }
        catch (e) {}
    }
    var attack = opts.attack || 0.001;
    var peak = opts.peak != null ? opts.peak : 0.5;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(now);
    osc.stop(now + opts.duration + 0.02);
}

function _noise(opts) {
    var ctx = _ensureCtx();
    if (!ctx || !_masterGain) return;
    var now = ctx.currentTime;
    var dur = opts.duration || 0.015;
    var bufSize = Math.max(32, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = opts.highpass || 2000;
    var gain = ctx.createGain();
    var peak = opts.peak != null ? opts.peak : 0.15;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(_masterGain);
    src.start(now);
    src.stop(now + dur + 0.02);
}

// ============================================================
// SOUNDS
// ============================================================
function _playTap() {
    // Soft click — 2800 Hz, 40ms
    _tone({ freq: 2800, duration: 0.04, type: 'sine', attack: 0.001, peak: 0.55 });
    _noise({ duration: 0.012, highpass: 2000, peak: 0.13 });
}

function _playSelect() {
    // Crisp pop — 3500→2800 Hz, 30ms
    _tone({ freq: 3500, freqEnd: 2800, duration: 0.03, type: 'triangle', attack: 0.001, peak: 0.45 });
    _noise({ duration: 0.010, highpass: 3000, peak: 0.10 });
}

function _playToggle() {
    // Two ticks: high → low
    _tone({ freq: 3200, duration: 0.02, type: 'sine', attack: 0.001, peak: 0.45 });
    setTimeout(function () {
        _tone({ freq: 2200, duration: 0.022, type: 'sine', attack: 0.001, peak: 0.40 });
    }, 30);
}

function _playSuccess() {
    // Rising chord — 800→1200 Hz, 120ms
    _tone({ freq: 800, freqEnd: 1200, duration: 0.12, type: 'sine', attack: 0.005, peak: 0.5 });
    _tone({ freq: 1600, freqEnd: 2400, duration: 0.12, type: 'sine', attack: 0.005, peak: 0.22 });
}

function _playError() {
    // Low buzz — 420 Hz, 100ms, lowpass
    var ctx = _ensureCtx();
    if (!ctx || !_masterGain) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var filter = ctx.createBiquadFilter();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 6;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(_masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
}

const SOUNDS = {
    tap:     _playTap,
    select:  _playSelect,
    toggle:  _playToggle,
    success: _playSuccess,
    error:   _playError
};

// ============================================================
// TOAST INTEGRATION
// ============================================================
function _bindToastSounds() {
    if (_toastBound) return;
    _toastBound = true;
    try {
        bus.on('toast:show', function (payload) {
            if (!payload || !_enabled) return;
            var kind = payload.type || payload.kind || payload.variant || '';
            if (kind === 'success') _playSuccess();
            else if (kind === 'error' || kind === 'danger') _playError();
        });
    } catch (e) {
        console.warn('[AudioService] toast bind failed:', e);
    }
}

// ============================================================
// PUBLIC API
// ============================================================
export const AudioService = {
    init: function () {
        _ensureCtx();
        _bindToastSounds();

        if (typeof document !== 'undefined') {
            var unlock = function () {
                if (_unlocked) return;
                _unlocked = true;
                _resumeCtx();
                document.removeEventListener('touchstart', unlock);
                document.removeEventListener('mousedown', unlock);
                document.removeEventListener('keydown', unlock);
            };
            document.addEventListener('touchstart', unlock, { once: true, passive: true });
            document.addEventListener('mousedown', unlock, { once: true });
            document.addEventListener('keydown', unlock, { once: true });
        }
    },

    setEnabled: function (on) {
        _enabled = !!on;
        if (_enabled) _resumeCtx();
    },

    isEnabled: function () { return _enabled; },

    play: function (name) {
        if (!_enabled) return;
        var fn = SOUNDS[name];
        if (!fn) return;
        try { fn(); }
        catch (e) { /* silent */ }
    }
};

export default AudioService;
