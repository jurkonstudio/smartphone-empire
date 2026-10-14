// FILE: src/ui/panels/HomePanel.js
// v2027.17a — 3D map + tab carousel (Focus / News / Activity).
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
// MAIN RENDER
// ============================================================
export function renderHomePanel() {
    const state = (window.__game && window.__game.state) ? window.__game.state.get() : null;
    const research = (window.__game && window.__game.research) ? window.__game.research : null;

    const tabsHtml = TABS.map(function (id) {
        return '<button class="home-tab ' + (id === _activeTab ? 'active' : '') + '" ' +
            'data-home-tab="' + id + '" type="button">' +
            t('home.tab.' + id) +
            '</button>';
    }).join('');

    const slidesHtml = TABS.map(function (id) {
        return _renderSlide(id, state, research);
    }).join('');

    return '<div class="home-wrapper">' +
        '<div id="campus-map" class="card home-map" role="img" aria-label="' + t('home.campus.aria') + '">' +
            renderCampusLoading() +
        '</div>' +
        '<div class="home-tabs" role="tablist">' + tabsHtml + '</div>' +
        '<div class="home-carousel" data-home-carousel>' + slidesHtml + '</div>' +
        '</div>';
}

// ============================================================
// MOUNT — dipanggil main.js setelah render + mountCampusMap
// ============================================================
export function initHomeTabs(rootEl) {
    if (!rootEl) return;
    const carousel = rootEl.querySelector('[data-home-carousel]');
    if (!carousel) return;

    // Bind tab pills
    rootEl.querySelectorAll('[data-home-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _goToTab(carousel, btn.dataset.homeTab, true);
        });
    });

    // Stop propagation supaya SwipeService (yang listen di document)
    // tidak ikut trigger page-change saat user swipe di carousel.
    ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointerup'].forEach(function (ev) {
        carousel.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });

    // Set scroll position ke tab aktif
    requestAnimationFrame(function () {
        const idx = TABS.indexOf(_activeTab);
        if (idx > 0) {
            carousel.scrollLeft = idx * carousel.clientWidth;
        }
        _observeScroll(carousel);
        _updateActivePill(carousel);
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
    _updateActivePill(carousel);
}

function _updateActivePill(carousel) {
    const root = carousel.closest('.home-wrapper');
    if (!root) return;
    root.querySelectorAll('[data-home-tab]').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.homeTab === _activeTab);
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
                    _updateActivePill(carousel);
                }
            }
        });
    }, { root: carousel, threshold: [0.5, 0.75] });

    carousel.querySelectorAll('[data-home-slide]').forEach(function (slide) {
        _intersectionObserver.observe(slide);
    });
}

export function getActiveHomeTab() { return _activeTab; }
