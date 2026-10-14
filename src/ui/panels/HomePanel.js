// FILE: src/ui/panels/HomePanel.js
// v2027.18a — 3D map + carousel + dots indicator. Tanpa pill text.
import { t } from '../../core/LanguageService.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderNewsListPanel } from './NewsListPanel.js';
import { renderLogPanel } from './LogPanel.js';

const TABS = ['focus', 'news', 'activity'];

let _activeTab = 'focus';
let _observedCarousel = null;
let _intersectionObserver = null;

// ============================================================
// SLIDE RENDER
// ============================================================
function _renderSlide(tabId, state, research) {
    let inner = '';
    try {
        if (tabId === 'focus') {
            inner = renderProgressPanel(state, research);
        } else if (tabId === 'news') {
            inner = renderNewsListPanel(state);
        } else if (tabId === 'activity') {
            inner = renderLogPanel(state, { limit: 8 });
        }
    } catch (e) {
        console.error('[HomePanel] slide error:', tabId, e);
        inner = '<div class="card"><div class="log-empty">Error</div></div>';
    }
    return '<div class="home-slide" data-home-slide="' + tabId + '">' + inner + '</div>';
}

// ============================================================
// DOTS
// ============================================================
function _renderDots() {
    return '<div class="home-dots" role="tablist">' +
        TABS.map(function (id) {
            return '<button class="home-dot ' + (id === _activeTab ? 'active' : '') + '" ' +
                'data-home-dot="' + id + '" type="button" ' +
                'aria-label="' + id + '"></button>';
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

    // Dots: tap untuk pindah tab
    rootEl.querySelectorAll('[data-home-dot]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _goToTab(carousel, btn.dataset.homeDot, true);
        });
    });

    // Stop propagation — supaya SwipeService tidak ikut trigger
    ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointerup'].forEach(function (ev) {
        carousel.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });

    requestAnimationFrame(function () {
        const idx = TABS.indexOf(_activeTab);
        if (idx > 0) carousel.scrollLeft = idx * carousel.clientWidth;
        _observeScroll(carousel);
        _updateDots(carousel);
    });
}

// ============================================================
// HELPERS
// ============================================================
function _goToTab(carousel, tabId, smooth) {
    const idx = TABS.indexOf(tabId);
    if (idx < 0) return;
    _activeTab = tabId;
    try {
        carousel.scrollTo({
            left: idx * carousel.clientWidth,
            behavior: smooth ? 'smooth' : 'auto'
        });
    } catch (e) {
        carousel.scrollLeft = idx * carousel.clientWidth;
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

function _observeScroll(carousel) {
    if (_intersectionObserver && _observedCarousel === carousel) return;
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

export function getActiveHomeTab() { return _activeTab; }
