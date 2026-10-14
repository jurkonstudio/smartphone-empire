// FILE: src/ui/panels/HomePanel.js
// v2027.30a — Native scroll-snap. Hapus JS swipe handler.
import { t } from '../../core/LanguageService.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderNewsListPanel } from './NewsListPanel.js';
import { renderLogPanel } from './LogPanel.js';

const TABS = ['focus', 'news', 'activity'];

let _activeTab = 'focus';
let _intersectionObserver = null;
let _observedCarousel = null;

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
// MOUNT — hanya untuk dots sync, tidak intervensi scroll
// ============================================================
export function initHomeTabs(rootEl) {
    if (!rootEl) return;
    const carousel = rootEl.querySelector('[data-home-carousel]');
    if (!carousel) return;

    // Tap dot → scroll ke slide
    rootEl.querySelectorAll('[data-home-dot]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _goToTab(carousel, btn.dataset.homeDot);
        });
    });

    // Observer untuk sync dot aktif saat user scroll manual
    _bindScrollObserver(carousel);

    // Set posisi awal tanpa animation
    requestAnimationFrame(function () {
        const idx = TABS.indexOf(_activeTab);
        if (idx > 0) {
            const prev = carousel.style.scrollBehavior;
            carousel.style.scrollBehavior = 'auto';
            carousel.scrollLeft = idx * carousel.clientWidth;
            carousel.style.scrollBehavior = prev || '';
        }
        _updateDots(carousel);
    });
}

// ============================================================
// SCROLL OBSERVER — deteksi slide aktif
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
    }, {
        root: carousel,
        threshold: [0.6]
    });

    carousel.querySelectorAll('[data-home-slide]').forEach(function (slide) {
        _intersectionObserver.observe(slide);
    });
}

// ============================================================
// NAV
// ============================================================
function _goToTab(carousel, tabId) {
    const idx = TABS.indexOf(tabId);
    if (idx < 0) return;
    _activeTab = tabId;
    const target = idx * carousel.clientWidth;
    try {
        carousel.scrollTo({ left: target, behavior: 'smooth' });
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
