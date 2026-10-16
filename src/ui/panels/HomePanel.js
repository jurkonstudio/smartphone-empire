// FILE: src/ui/panels/HomePanel.js
// v2027.41a — Layout Home: peta 3D mengisi layar + dock (tab berlabel & carousel).
//   • Tab diberi label + badge (sebelumnya hanya titik kecil di paling bawah).
//   • Dock bisa diciutkan supaya peta 3D lega penuh.
//   • Carousel tetap native scroll-snap (tanpa JS swipe handler).
import { t } from '../../core/LanguageService.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderNewsListPanel } from './NewsListPanel.js';
import { renderLogPanel } from './LogPanel.js';

const TABS = ['focus', 'news', 'activity'];

let _activeTab = 'focus';
let _dockCollapsed = false;
let _intersectionObserver = null;

const CHEVRON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

// ============================================================
// HELPERS
// ============================================================
function _focusCount(state, research) {
    let n = 0;
    try {
        if (research && typeof research.getProgress === 'function') {
            n += (research.getProgress() || []).length;
        }
        if (state && state.quests && Array.isArray(state.quests.active)) {
            n += state.quests.active.length;
        }
    } catch (e) { /* badge opsional */ }
    return n;
}

function _badgeText(n) { return n > 9 ? '9+' : String(n); }

function _syncBodyClass() {
    document.body.classList.toggle('home-dock-collapsed', _dockCollapsed);
}

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
    return '<div class="home-slide" data-home-slide="' + tabId + '" role="tabpanel">' +
        _renderSlideInner(tabId, state, research) +
        '</div>';
}

function _renderDockBar(state, research) {
    const focusN = _focusCount(state, research);
    const tabs = TABS.map(function (id) {
        const active = id === _activeTab;
        const badge = (id === 'focus')
            ? '<span class="home-tab-badge" data-home-badge="focus"' + (focusN ? '' : ' hidden') + '>' +
                _badgeText(focusN) + '</span>'
            : '';
        return '<button class="home-tab' + (active ? ' active' : '') + '" type="button" role="tab" ' +
            'data-home-tab="' + id + '" aria-selected="' + (active ? 'true' : 'false') + '">' +
            '<span class="home-tab-label">' + t('home.tab.' + id) + '</span>' + badge +
            '</button>';
    }).join('');

    return '<div class="home-dockbar">' +
        '<div class="home-tabs" role="tablist">' + tabs + '</div>' +
        '<button class="home-dock-toggle" type="button" data-home-dock-toggle ' +
            'aria-expanded="' + (_dockCollapsed ? 'false' : 'true') + '" ' +
            'aria-label="' + t(_dockCollapsed ? 'home.dock.expand' : 'home.dock.collapse') + '">' +
            CHEVRON_SVG +
        '</button>' +
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
        '<div class="home-dock' + (_dockCollapsed ? ' collapsed' : '') + '" data-home-dock>' +
            _renderDockBar(state, research) +
            '<div class="home-carousel" data-home-carousel>' + slidesHtml + '</div>' +
        '</div>' +
        '</div>';
}

// ============================================================
// MOUNT
// ============================================================
export function initHomeTabs(rootEl) {
    if (!rootEl) return;
    const carousel = rootEl.querySelector('[data-home-carousel]');
    if (!carousel) return;

    _syncBodyClass();

    // Tap tab → pindah slide (kalau dock sedang diciutkan, bentangkan dulu)
    rootEl.querySelectorAll('[data-home-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (_dockCollapsed) _setCollapsed(rootEl, false);
            _goToTab(carousel, btn.dataset.homeTab);
        });
    });

    // Tombol ciutkan / bentangkan
    const toggle = rootEl.querySelector('[data-home-dock-toggle]');
    if (toggle) {
        toggle.addEventListener('click', function () {
            _setCollapsed(rootEl, !_dockCollapsed);
        });
    }

    // Sinkronkan tab aktif saat user swipe manual
    _bindScrollObserver(carousel);

    // Posisi awal tanpa animasi (mis. setelah render ulang)
    requestAnimationFrame(function () { _snapToActive(carousel); });
}

// ============================================================
// SCROLL OBSERVER
// ============================================================
function _bindScrollObserver(carousel) {
    if (_intersectionObserver) _intersectionObserver.disconnect();
    if (typeof IntersectionObserver === 'undefined') return;

    _intersectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
                const id = entry.target.dataset.homeSlide;
                if (id && id !== _activeTab) {
                    _activeTab = id;
                    _updateTabs(carousel);
                }
            }
        });
    }, { root: carousel, threshold: [0.6] });

    carousel.querySelectorAll('[data-home-slide]').forEach(function (slide) {
        _intersectionObserver.observe(slide);
    });
}

// ============================================================
// NAV
// ============================================================
function _snapToActive(carousel) {
    const idx = TABS.indexOf(_activeTab);
    if (idx > 0) {
        const prev = carousel.style.scrollBehavior;
        carousel.style.scrollBehavior = 'auto';
        carousel.scrollLeft = idx * carousel.clientWidth;
        carousel.style.scrollBehavior = prev || '';
    }
    _updateTabs(carousel);
}

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
    _updateTabs(carousel);
}

function _setCollapsed(rootEl, collapsed) {
    _dockCollapsed = !!collapsed;
    const dock = rootEl.querySelector('[data-home-dock]');
    if (dock) dock.classList.toggle('collapsed', _dockCollapsed);
    const toggle = rootEl.querySelector('[data-home-dock-toggle]');
    if (toggle) {
        toggle.setAttribute('aria-expanded', _dockCollapsed ? 'false' : 'true');
        toggle.setAttribute('aria-label', t(_dockCollapsed ? 'home.dock.expand' : 'home.dock.collapse'));
    }
    _syncBodyClass();
}

function _updateTabs(carousel) {
    const root = carousel.closest('.home-wrapper');
    if (!root) return;
    root.querySelectorAll('[data-home-tab]').forEach(function (tab) {
        const on = tab.dataset.homeTab === _activeTab;
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
}

// ============================================================
// REFRESH — isi slide diperbarui, posisi scroll vertikal dipertahankan
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
        const top = slide.scrollTop;
        slide.innerHTML = _renderSlideInner(id, state, research);
        slide.scrollTop = top;
    });

    const badge = root.querySelector('[data-home-badge="focus"]');
    if (badge) {
        const n = _focusCount(state, research);
        badge.textContent = _badgeText(n);
        badge.hidden = n === 0;
    }
}

export function getActiveHomeTab() { return _activeTab; }
