// FILE: src/ui/panels/HomePanel.js
// v2027.24a — JUMP mode swipe. Ringan + snap smooth saat lepas jari.
import { t } from '../../core/LanguageService.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderNewsListPanel } from './NewsListPanel.js';
import { renderLogPanel } from './LogPanel.js';

const TABS = ['focus', 'news', 'activity'];
const SWIPE_MIN_PX = 25;
const VELOCITY_MIN = 0.25;   // px/ms — swipes cepat terdeteksi ringan

let _activeTab = 'focus';
let _observedCarousel = null;
let _intersectionObserver = null;
let _swipeBound = null;

// ============================================================
// SLIDE RENDER
// ============================================================
function _renderSlideInner(tabId, state, research) {
    try {
        if (tabId === 'focus')    return renderProgressPanel(state, research);
        if (tabId === 'news')     return renderNewsListPanel(state);
        if (tabId === 'activity') return renderLogPanel(state, { limit: 8 });
    } catch (e) {
        console.error('[HomePanel] slide error:', tabId, e);
        return '<div class="card"><div class="log-empty">Error</div></div>';
    }
    return '';
}

function _renderSlide(tabId, state, research) {
    return '<div class="home-slide" data-home-slide="' + tabId + '">' +
        _renderSlideInner(tabId, state, research) +
        '</div>';
}

function _renderDots() {
    return '<div class="home-dots" role="tablist">' +
        TABS.map(function (id) {
            return '<button class="home-dot ' + (id === _activeTab ? 'active' : '') + '" ' +
                'data-home-dot="' + id + '" type="button" aria-label="' + id + '"></button>';
        }).join('') +
        '</div>';
}

// ============================================================
// MAIN RENDER
// ============================================================
export function renderHomePanel() {
    const state = (window.__game && window.__game.state) ? window.__game.state.get() : null;
    const research = (window.__game && window.__game.research) ? window.__game.research : null;

    const slidesHtml = TABS.map(function (id) {
        return _renderSlide(id, state, research);
    }).join('');

    return '<div class="home-wrapper">' +
        '<div id="campus-map" class="card home-map" role="img" aria-label="' + t('home.campus.aria') + '">' +
            renderCampusLoading() +
        '</div>' +
        '<div class="home-carousel" data-home-carousel>' + slidesHtml + '</div>' +
        _renderDots() +
        '</div>';
}

// ============================================================
// MOUNT
// ============================================================
export function initHomeTabs(rootEl) {
    if (!rootEl) return;
    const carousel = rootEl.querySelector('[data-home-carousel]');
    if (!carousel) return;

    rootEl.querySelectorAll('[data-home-dot]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _goToTab(carousel, btn.dataset.homeDot, true);
        });
    });

    _swipeBound = null;
    _bindSwipe(carousel);
    _bindScrollObserver(carousel);

    requestAnimationFrame(function () {
        const idx = TABS.indexOf(_activeTab);
        if (idx > 0) carousel.scrollLeft = idx * carousel.clientWidth;
        _updateDots(carousel);
    });
}

// ============================================================
// JUMP SWIPE — ringan, tidak drag-follow
// ============================================================
function _bindSwipe(carousel) {
    if (_swipeBound === carousel) return;
    _swipeBound = carousel;

    let startX = 0, startY = 0, startTime = 0;
    let tracking = false;
    let locked = null;      // null | 'h' | 'v'
    let lastX = 0, lastT = 0;
    let velocity = 0;

    function onStart(e) {
        if (!e.touches || !e.touches[0]) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        lastX = startX;
        lastT = startTime;
        velocity = 0;
        tracking = true;
        locked = null;
    }

    function onMove(e) {
        if (!tracking || !e.touches || !e.touches[0]) return;
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const dx = x - startX;
        const dy = y - startY;

        // Tentukan arah sekali saja
        if (locked === null) {
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
                if (locked === 'h' && e.cancelable) {
                    try { e.preventDefault(); } catch (err) {}
                }
            }
        }

        if (locked === 'h') {
            const now = Date.now();
            const dt = now - lastT;
            if (dt > 0) velocity = (x - lastX) / dt;
            lastX = x;
            lastT = now;
            // TIDAK update scrollLeft — biarkan browser native
        }
    }

    function onEnd(e) {
        if (!tracking) return;
        const wasHorizontal = locked === 'h';
        tracking = false;
        locked = null;
        if (!wasHorizontal) return;
        if (!e.changedTouches || !e.changedTouches[0]) return;

        const x = e.changedTouches[0].clientX;
        const dx = x - startX;
        const dt = Date.now() - startTime;
        if (dt > 800) return;

        const idx = TABS.indexOf(_activeTab);
        const fastLeft  = velocity < -VELOCITY_MIN;
        const fastRight = velocity > VELOCITY_MIN;
        const farLeft   = dx < -SWIPE_MIN_PX;
        const farRight  = dx > SWIPE_MIN_PX;

        let next = idx;
        if (fastLeft || farLeft) next = Math.min(TABS.length - 1, idx + 1);
        else if (fastRight || farRight) next = Math.max(0, idx - 1);
        if (next === idx) return;

        _goToTab(carousel, TABS[next], true);
    }

    function onCancel() {
        tracking = false;
        locked = null;
    }

    carousel._seSwipe = { onStart: onStart, onMove: onMove, onEnd: onEnd, onCancel: onCancel };

    // touchmove non-passive agar preventDefault bisa
    carousel.addEventListener('touchstart', onStart, { passive: true });
    carousel.addEventListener('touchmove', onMove, { passive: false });
    carousel.addEventListener('touchend', onEnd, { passive: true });
    carousel.addEventListener('touchcancel', onCancel, { passive: true });
}

// ============================================================
// SCROLL OBSERVER
// ============================================================
function _bindScrollObserver(carousel) {
    if (_intersectionObserver) _intersectionObserver.disconnect();
    _observedCarousel = carousel;

    if (typeof IntersectionObserver === 'undefined') return;

    _intersectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                const id = entry.target.dataset.homeSlide;
                if (id && id !== _activeTab) {
                    _activeTab = id;
                    _updateDots(carousel);
                }
            }
        });
    }, { root: carousel, threshold: [0.6] });

    carousel.querySelectorAll('[data-home-slide]').forEach(function (slide) {
        _intersectionObserver.observe(slide);
    });
}

// ============================================================
// NAVIGATION
// ============================================================
function _goToTab(carousel, tabId, smooth) {
    const idx = TABS.indexOf(tabId);
    if (idx < 0) return;
    _activeTab = tabId;
    const target = idx * carousel.clientWidth;
    try {
        carousel.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
    } catch (e) {
        carousel.scrollLeft = target;
    }
    _updateDots(carousel);
}

function _updateDots(carousel) {
    const root = carousel.closest('.home-wrapper');
    if (!root) return;
    root.querySelectorAll('[data-home-dot]').forEach(function (dot) {
        dot.classList.toggle('active', dot.dataset.homeDot === _activeTab);
    });
}

// ============================================================
// REFRESH
// ============================================================
export function refreshHomeSlides() {
    const root = document.querySelector('.home-wrapper');
    if (!root) return;
    const game = window.__game;
    if (!game || !game.state) return;
    const state = game.state.get();
    const research = game.research || null;

    TABS.forEach(function (id) {
        const slide = root.querySelector('[data-home-slide="' + id + '"]');
        if (!slide) return;
        slide.innerHTML = _renderSlideInner(id, state, research);
    });
}

export function getActiveHomeTab() { return _activeTab; }
