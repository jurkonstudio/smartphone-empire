// FILE: src/ui/panels/HomePanel.js
// v2027.22a — JS manual swipe untuk carousel (bypass touch-action Chrome).
import { t } from '../../core/LanguageService.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderNewsListPanel } from './NewsListPanel.js';
import { renderLogPanel } from './LogPanel.js';

const TABS = ['focus', 'news', 'activity'];

let _activeTab = 'focus';
let _observedCarousel = null;
let _intersectionObserver = null;
let _swipeBound = null;   // carousel yang sudah di-bind

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

    // Dots
    rootEl.querySelectorAll('[data-home-dot]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _goToTab(carousel, btn.dataset.homeDot, false);
        });
    });

    // Reset swipe binding (carousel baru setelah re-render)
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
// SWIPE HANDLER — JS manual
// ============================================================
function _bindSwipe(carousel) {
    if (_swipeBound === carousel) return;
    _swipeBound = carousel;

    let startX = 0, startY = 0, startTime = 0;
    let tracking = false, locked = null;

    function onStart(e) {
        if (!e.touches || !e.touches[0]) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        tracking = true;
        locked = null;
    }

    function onMove(e) {
        if (!tracking || !e.touches || !e.touches[0]) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (locked === null) {
            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
            }
        }
    }

    function onEnd(e) {
        if (!tracking) return;
        tracking = false;
        if (locked !== 'h') return;
        if (!e.changedTouches || !e.changedTouches[0]) return;

        const dx = e.changedTouches[0].clientX - startX;
        const dt = Date.now() - startTime;
        if (dt > 800) return;
        if (Math.abs(dx) < 40) return;

        const idx = TABS.indexOf(_activeTab);
        let next = idx;
        if (dx < 0) next = Math.min(TABS.length - 1, idx + 1);   // swipe kiri → maju
        else        next = Math.max(0, idx - 1);                  // swipe kanan → mundur
        if (next === idx) return;

        _goToTab(carousel, TABS[next], false);
    }

    // Simpan binding untuk cleanup
    carousel._seSwipe = { onStart: onStart, onMove: onMove, onEnd: onEnd };

    carousel.addEventListener('touchstart', onStart, { passive: true });
    carousel.addEventListener('touchmove', onMove, { passive: true });
    carousel.addEventListener('touchend', onEnd, { passive: true });
    carousel.addEventListener('touchcancel', function () { tracking = false; locked = null; }, { passive: true });
}

// ============================================================
// SCROLL OBSERVER — sinkron dot saat user scroll manual
// ============================================================
function _bindScrollObserver(carousel) {
    if (_intersectionObserver) _intersectionObserver.disconnect();
    _observedCarousel = carousel;

    if (typeof IntersectionObserver === 'undefined') return;

    _intersectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                const id = entry.target.dataset.homeSlide;
                if (id && id !== _activeTab) {
                    _activeTab = id;
                    _updateDots(carousel);
                }
            }
        });
    }, { root: carousel, threshold: [0.5, 0.75] });

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
