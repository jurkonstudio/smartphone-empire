// FILE: src/ui/panels/HomePanel.js
// v2027.42 — Focus tab: live sales chart (30 hari) real-time.
// v2027.41a — Layout Home: peta 3D mengisi layar + dock (tab berlabel & carousel).
//   • Tab diberi label + badge (sebelumnya hanya titik kecil di paling bawah).
//   • Dock bisa diciutkan supaya peta 3D lega penuh.
//   • Carousel tetap native scroll-snap (tanpa JS swipe handler).
import { t } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';
import { TIME_CONFIG } from '../../config/time.config.js';
import { renderCampusLoading } from '../campus/CampusFallback.js';
import { renderNewsListPanel } from './NewsListPanel.js';
import { renderLogPanel } from './LogPanel.js';
// [v2027.42] renderProgressPanel tidak lagi dipakai — focus tab sekarang
// menampilkan chart penjualan live. File ProgressPanel.js tetap ada di repo.
// import { renderProgressPanel } from './ProgressPanel.js';

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

function _fmtMoneyShort(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
    return String(Math.round(v));
}

// ============================================================
// SALES DATA AGGREGATION
// Agregasi dailySales dari semua produk ke bucket per game-day.
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
function _renderFocusSlide(state) {
    const series = _aggregateDailySales(state, 30);
    const today = series[series.length - 1] || { revenue: 0, sold: 0 };
    const yest  = series[series.length - 2] || { revenue: 0, sold: 0 };
    const total30 = series.reduce(function (s, x) { return s + x.revenue; }, 0);
    const units30 = series.reduce(function (s, x) { return s + x.sold; }, 0);

    const delta = today.revenue - yest.revenue;
    let deltaLabel = '—';
    let deltaClass = 'flat';
    let deltaColor = 'var(--text-mute)';
    if (yest.revenue > 0) {
        const pct = (delta / yest.revenue) * 100;
        deltaLabel = (delta >= 0 ? '+' : '') + pct.toFixed(1) + '%';
        deltaClass = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
        deltaColor = delta > 0 ? 'var(--accent)' : delta < 0 ? 'var(--danger)' : 'var(--text-mute)';
    } else if (today.revenue > 0) {
        deltaLabel = 'NEW';
        deltaClass = 'up';
        deltaColor = 'var(--accent)';
    }

    const headBg = 'background:linear-gradient(135deg, rgba(76,175,80,0.10), rgba(76,175,80,0.02));';
    const amtColor = 'var(--accent)';

    return '' +
        '<div class="card" style="' + headBg + '">' +
            '<div class="card-title" style="color:var(--text-secondary);">' + t('home.focus.sales_title') + '</div>' +
            '<div style="display:flex;align-items:baseline;gap:10px;margin-top:2px;">' +
                '<div style="font-size:30px;font-weight:800;color:' + amtColor + ';letter-spacing:-0.02em;line-height:1.1;">' +
                    '$' + Math.round(today.revenue).toLocaleString('en-US') +
                '</div>' +
                '<div style="font-size:13px;font-weight:600;color:' + deltaColor + ';">' + deltaLabel + '</div>' +
            '</div>' +
            '<div style="font-size:11.5px;color:var(--text-mute);margin-top:4px;">' +
                t('home.focus.today') + ' · ' + today.sold.toLocaleString('en-US') + ' ' + t('home.focus.units') +
            '</div>' +
            '<div class="chart-wrap" style="height:160px;position:relative;margin-top:10px;">' +
                '<canvas data-sales-live-canvas style="width:100%;height:160px;display:block;"></canvas>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;gap:10px;margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);">' +
                '<div style="flex:1;">' +
                    '<div style="font-size:10.5px;color:var(--text-mute);letter-spacing:.04em;">' + t('home.focus.total30') + '</div>' +
                    '<div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px;">$' + Math.round(total30).toLocaleString('en-US') + '</div>' +
                '</div>' +
                '<div style="flex:1;text-align:right;">' +
                    '<div style="font-size:10.5px;color:var(--text-mute);letter-spacing:.04em;">' + t('home.focus.units30') + '</div>' +
                    '<div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px;">' + units30.toLocaleString('en-US') + '</div>' +
                '</div>' +
            '</div>' +
            '<button class="btn-secondary" data-nav="research" style="width:100%;margin-top:12px;">' +
                t('home.focus.open_research') +
            '</button>' +
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
    const cssH = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const padL = 42, padR = 8, padT = 12, padB = 16;
    const plotW = Math.max(1, cssW - padL - padR);
    const plotH = Math.max(1, cssH - padT - padB);

    let maxV = 0;
    series.forEach(function (s) { if (s.revenue > maxV) maxV = s.revenue; });
    if (maxV <= 0) maxV = 1;
    maxV *= 1.18;

    const xOf = function (i) { return padL + (plotW * i) / Math.max(1, series.length - 1); };
    const yOf = function (v) { return padT + plotH - (v / maxV) * plotH; };

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = padT + (plotH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(cssW - padR, y);
        ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#6a6a6a';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('$' + _fmtMoneyShort(maxV), padL - 4, padT + 6);
    ctx.fillText('$' + _fmtMoneyShort(maxV / 2), padL - 4, padT + plotH / 2);
    ctx.fillText('$0', padL - 4, padT + plotH);

    // Area gradient under line
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, 'rgba(76,175,80,0.42)');
    grad.addColorStop(1, 'rgba(76,175,80,0.02)');
    ctx.beginPath();
    ctx.moveTo(xOf(0), padT + plotH);
    series.forEach(function (s, i) { ctx.lineTo(xOf(i), yOf(s.revenue)); });
    ctx.lineTo(xOf(series.length - 1), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    series.forEach(function (s, i) {
        const x = xOf(i), y = yOf(s.revenue);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Today dot
    const last = series[series.length - 1];
    const lx = xOf(series.length - 1);
    const ly = yOf(last.revenue);
    if (lx > padL && lx < cssW - padR) {
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76,175,80,0.25)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.4;
        ctx.stroke();
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
    const redraw = function () { _drawSalesChartIfFocus(); };
    bus.on('time:day-changed', redraw);
    bus.on('product:daily-sales-processed', redraw);
    bus.on('product:released', redraw);
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
    _bindHomeEvents();

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

    // [v2027.42] Redraw canvas setelah innerHTML di-replace.
    if (_activeTab === 'focus') requestAnimationFrame(_drawSalesChartIfFocus);
}

export function getActiveHomeTab() { return _activeTab; }
