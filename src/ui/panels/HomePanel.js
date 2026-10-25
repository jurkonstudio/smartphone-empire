// FILE: src/ui/panels/HomePanel.js  (REPLACE — v2027.66: sakelar Kampus | Manufaktur di atas peta)
// v2027.66 — sakelar Home kini "Kampus | Manufaktur" (Manufaktur = placeholder). Tab "Kantor" dihapus; Office 3D
//   hanya dibuka lewat gedung HQ di peta kampus (logika di campus/CampusOfficeBridge.js). Layout Home lainnya TIDAK berubah.
// v2027.43 — Focus tab: live sales chart (30 hari), gaya selaras CashChart.
// v2027.42 — Focus tab: live sales chart (30 hari) real-time.
// v2027.41a — Layout Home: peta 3D mengisi layar + dock (tab berlabel & carousel).
import { t, LanguageService } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';
import { TIME_CONFIG } from '../../config/time.config.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';
import { isOfficeMode, isManufactureMode, ensureBridgeStyle } from '../campus/CampusOfficeBridge.js';
import { getBridgeStrings } from '../campus/CampusInfo.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { renderNewsListPanel } from './NewsListPanel.js';
import { renderLogPanel } from './LogPanel.js';
import { renderBoardTargetsCard } from './AnnualReviewModal.js';
// [v2027.42] renderProgressPanel tidak dipakai di focus tab.

const TABS = ['focus', 'news', 'activity'];

let _activeTab = 'focus';
let _dockCollapsed = false;
let _intersectionObserver = null;
let _eventsBound = false;

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

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
// SALES DATA AGGREGATION
// dailySales entry: { day: elapsedGameMinutes, sold, revenue }
// ============================================================
function _aggregateDailySales(state, daysBack) {
    const now = (state && state.time && state.time.elapsedGameMinutes) || 0;
    const todayIdx = Math.floor(now / MINUTES_PER_DAY);
    const startIdx = todayIdx - (daysBack - 1);
    const buckets = {};

    const catalog = (state && state.products && state.products.catalog) || [];
    catalog.forEach(function (p) {
        (p.dailySales || []).forEach(function (d) {
            if (!d || typeof d.day !== 'number') return;
            const idx = Math.floor(d.day / MINUTES_PER_DAY);
            if (idx < startIdx || idx > todayIdx) return;
            if (!buckets[idx]) buckets[idx] = { sold: 0, revenue: 0 };
            buckets[idx].sold += d.sold || 0;
            buckets[idx].revenue += d.revenue || 0;
        });
    });

    const out = [];
    for (let i = 0; i < daysBack; i++) {
        const idx = startIdx + i;
        const b = buckets[idx] || { sold: 0, revenue: 0 };
        out.push({ idx: idx, sold: b.sold, revenue: b.revenue });
    }
    return out;
}

// ============================================================
// FOCUS SLIDE — LIVE SALES CHART
// ============================================================

// ============================================================
// KARTU TARGET PERTAMA: "Jual 1.000 ponsel pertama"
// ============================================================
const FIRST_GOAL_UNITS = 1000;

function _gp(id, en) {
    try { return LanguageService.getLang() === 'en' ? en : id; } catch (e) { return id; }
}

function _renderGoalCard(state) {
    if (!state || !state.products) return '';
    const tut = state.tutorial || {};
    const catalog = state.products.catalog || [];
    const sold = catalog.reduce(function (a, p) { return a + (p.totalSold || 0); }, 0);
    if (tut.goalDone || sold >= FIRST_GOAL_UNITS) return '';

    const dev = state.products.development;
    let line;
    if (!catalog.length && !dev) {
        line = _gp('Rancang ponsel pertamamu di tab Produk.', 'Design your first phone in the Products tab.');
    } else if (!catalog.length && dev) {
        const names = { design: _gp('desain', 'design'), prototype: _gp('prototipe', 'prototype'), production: _gp('produksi', 'production') };
        line = _gp('Ponselmu sedang dikembangkan: tahap ', 'Your phone is in development: stage ') + (names[dev.phase] || dev.phase) + '.';
    } else {
        line = sold.toLocaleString('en-US') + ' / ' + FIRST_GOAL_UNITS.toLocaleString('en-US') + ' ' + _gp('unit terjual', 'units sold');
    }
    const pct = Math.max(0, Math.min(100, Math.round((sold / FIRST_GOAL_UNITS) * 100)));

    return '<div class="card" data-goal-card>' +
        '<div class="card-title">' + _gp('Target pertama: jual ', 'First goal: sell ') + FIRST_GOAL_UNITS.toLocaleString('en-US') + _gp(' ponsel', ' phones') + '</div>' +
        '<div style="font-size:12px;color:var(--text-mute);margin-top:2px;">' + line + '</div>' +
        '<div style="height:6px;border-radius:3px;background:var(--border);margin-top:8px;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct + '%;background:var(--accent);transition:width .3s;"></div>' +
        '</div>' +
    '</div>';
}

function _refreshGoalCard() {
    if (_activeTab !== 'focus') return;
    const root = document.querySelector('.home-wrapper');
    if (!root) return;
    const slide = root.querySelector('[data-home-slide="focus"]');
    const game = window.__game;
    if (!slide || !game || !game.state) return;
    const html = _renderGoalCard(game.state.get());
    const old = slide.querySelector('[data-goal-card]');
    if (old) { if (html) old.outerHTML = html; else old.remove(); }
    else if (html) slide.insertAdjacentHTML('afterbegin', html);
}

function _renderFocusSlide(state) {
    const series = _aggregateDailySales(state, 30);
    const today = series[series.length - 1] || { revenue: 0, sold: 0 };
    const yest  = series[series.length - 2] || { revenue: 0, sold: 0 };
    const total30 = series.reduce(function (s, x) { return s + x.revenue; }, 0);
    const units30 = series.reduce(function (s, x) { return s + x.sold; }, 0);

    const delta = today.revenue - yest.revenue;
    let deltaLabel = '—';
    let deltaColor = 'var(--text-mute)';
    if (yest.revenue > 0) {
        const pct = (delta / yest.revenue) * 100;
        deltaLabel = (delta >= 0 ? '+' : '') + pct.toFixed(1) + '%';
        deltaColor = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--danger)' : 'var(--text-mute)';
    } else if (today.revenue > 0) {
        deltaLabel = 'NEW';
        deltaColor = 'var(--accent)';
    }

    return _renderGoalCard(state) + renderBoardTargetsCard(state) +
        '<div class="card">' +
            '<div class="card-title">' + t('home.focus.sales_title') + '</div>' +
            '<div style="display:flex;align-items:baseline;gap:8px;margin-top:2px;">' +
                '<div style="font-size:22px;font-weight:600;color:var(--accent);letter-spacing:-0.01em;line-height:1.15;">' +
                    '$' + Math.round(today.revenue).toLocaleString('en-US') +
                '</div>' +
                '<div style="font-size:12px;font-weight:500;color:' + deltaColor + ';">' + deltaLabel + '</div>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--text-mute);margin-top:2px;">' +
                t('home.focus.today') + ' · ' + today.sold.toLocaleString('en-US') + ' ' + t('home.focus.units') +
            '</div>' +
            '<div class="chart-wrap" style="position:relative;margin-top:8px;">' +
                '<canvas data-sales-live-canvas></canvas>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;gap:10px;margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);">' +
                '<div style="flex:1;">' +
                    '<div style="font-size:10px;color:var(--text-mute);letter-spacing:.04em;">' + t('home.focus.total30') + '</div>' +
                    '<div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px;">$' + Math.round(total30).toLocaleString('en-US') + '</div>' +
                '</div>' +
                '<div style="flex:1;text-align:right;">' +
                    '<div style="font-size:10px;color:var(--text-mute);letter-spacing:.04em;">' + t('home.focus.units30') + '</div>' +
                    '<div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px;">' + units30.toLocaleString('en-US') + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

function _drawSalesLiveChart(canvas) {
    if (!canvas) return;
    const game = window.__game;
    if (!game || !game.state) return;
    const state = game.state.get();
    const series = _aggregateDailySales(state, 30);
    if (!series.length) return;

    const container = canvas.parentElement;
    const cssW = (container && container.clientWidth) || 320;
    const cssH = 120;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const values = series.map(function (s) { return s.revenue; });
    const minV = Math.min.apply(null, values.concat([0]));
    const maxV = Math.max.apply(null, values.concat([1]));
    const range = Math.max(1, maxV - minV);

    // Padding identik CashChart: minim kiri (tanpa label Y panjang).
    const padL = 6, padR = 6, padT = 10, padB = 18;
    const plotW = cssW - padL - padR;
    const plotH = cssH - padT - padB;

    const xOf = function (i) { return padL + (plotW * i) / Math.max(1, series.length - 1); };
    const yOf = function (v) { return padT + plotH - ((v - minV) / range) * plotH; };

    // Grid horizontal (subtle).
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(cssW - padR, y);
        ctx.stroke();
    }

    // Garis data.
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    series.forEach(function (s, i) {
        const x = xOf(i), y = yOf(s.revenue);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area gradient (halus, identik CashChart).
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(76,175,80,0.18)');
    grad.addColorStop(1, 'rgba(76,175,80,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    series.forEach(function (s, i) {
        const x = xOf(i), y = yOf(s.revenue);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(series.length - 1), padT + plotH);
    ctx.lineTo(xOf(0), padT + plotH);
    ctx.closePath();
    ctx.fill();

    // Label Y: hanya max (atas) & min (bawah), font regular (bukan bold).
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('$' + Math.round(maxV).toLocaleString('en-US'), padL + 2, padT + 10);
    if (minV > 0) {
        ctx.fillText('$' + Math.round(minV).toLocaleString('en-US'), padL + 2, padT + plotH - 2);
    }
}

function _drawSalesChartIfFocus() {
    if (_activeTab !== 'focus') return;
    const root = document.querySelector('.home-wrapper');
    if (!root) return;
    const canvas = root.querySelector('[data-sales-live-canvas]');
    if (canvas) _drawSalesLiveChart(canvas);
}

// Bind sekali saja; redraw ringan tanpa render ulang seluruh slide.
function _bindHomeEvents() {
    if (_eventsBound) return;
    _eventsBound = true;
    const redraw = function () { _drawSalesChartIfFocus(); _refreshGoalCard(); };
    bus.on('time:day-changed', redraw);
    bus.on('product:daily-sales-processed', redraw);
    bus.on('product:released', redraw);
    bus.on('product:development-started', redraw);
    bus.on('product:phase-changed', redraw);
}

// ============================================================
// SLIDE RENDER
// ============================================================
function _renderSlideInner(tabId, state, research) {
    try {
        if (tabId === 'focus')    return _renderFocusSlide(state);
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

    ensureBridgeStyle();
    const office = isOfficeMode();
    const manu = isManufactureMode();
    const L = getBridgeStrings();
    const switchHtml =
        '<div class="home-switch" role="tablist">' +
            '<button type="button" role="tab" class="home-switch-btn' + (manu ? '' : ' active') + '" data-home-switch="campus" aria-selected="' + (manu ? 'false' : 'true') + '">' +
                renderIcon('layers', 17) + '<span>' + L.tabCampus + '</span></button>' +
            '<button type="button" role="tab" class="home-switch-btn' + (manu ? ' active' : '') + '" data-home-switch="manufacture" aria-selected="' + (manu ? 'true' : 'false') + '">' +
                renderIcon('factory', 17) + '<span>' + L.tabManufacture + '</span></button>' +
        '</div>';

    return '<div class="home-wrapper">' +
        switchHtml +
        '<div id="campus-map" class="card home-map' + ((office || manu) ? ' office-map' : '') + (manu ? ' manu-map' : '') + '" role="img" aria-label="' + t('home.campus.aria') + '">' +
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
    _bindHomeEvents();

    rootEl.querySelectorAll('[data-home-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (_dockCollapsed) _setCollapsed(rootEl, false);
            _goToTab(carousel, btn.dataset.homeTab);
        });
    });

    const toggle = rootEl.querySelector('[data-home-dock-toggle]');
    if (toggle) {
        toggle.addEventListener('click', function () {
            _setCollapsed(rootEl, !_dockCollapsed);
        });
    }

    _bindScrollObserver(carousel);

    requestAnimationFrame(function () {
        _snapToActive(carousel);
        _drawSalesChartIfFocus();
    });
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
                    if (id === 'focus') requestAnimationFrame(_drawSalesChartIfFocus);
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
    if (tabId === 'focus') requestAnimationFrame(_drawSalesChartIfFocus);
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
    if (!_dockCollapsed) requestAnimationFrame(_drawSalesChartIfFocus);
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

    if (_activeTab === 'focus') requestAnimationFrame(_drawSalesChartIfFocus);
}

export function getActiveHomeTab() { return _activeTab; }
