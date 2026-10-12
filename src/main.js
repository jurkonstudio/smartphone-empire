// FILE: src/main.js
import { APP_CONFIG } from './config/app.config.js';
import { VIEW_TITLES } from './config/constants.js';
import { bus } from './core/EventBus.js';
import { state } from './core/GameState.js';
import { TimeSystem } from './core/TimeSystem.js';
import { SaveService } from './core/SaveService.js';
import { ToastService } from './core/ToastService.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import { ResearchSystem } from './systems/ResearchSystem.js';
import { OSSystem } from './systems/OSSystem.js';
import { renderHeader } from './ui/layout/Header.js';
import { renderMobileNav } from './ui/layout/MobileNav.js';
import { renderDashboard } from './ui/panels/DashboardPanel.js';
import { renderEmptyState } from './ui/panels/EmptyState.js';
import { renderSettingsPanel, bindSettingsActions } from './ui/panels/SettingsPanel.js';
import { renderGuidePanel } from './ui/panels/GuidePanel.js';
import { mountToastContainer } from './ui/panels/ToastContainer.js';
import { drawCashChart } from './ui/panels/CashChart.js';
import { initTutorialOverlay } from './ui/panels/TutorialOverlay.js';
import { showOnboarding } from './ui/panels/OnboardingModal.js';
import { initMonthlySummary } from './ui/panels/MonthlySummaryModal.js';
import { initGameOverScreen } from './ui/panels/GameOverScreen.js';
import { Modal } from './ui/modal.js';
import {
    renderResearchPanel,
    setFilterCategory,
    openNodeDetailModal,
    openOsWizardModal,
    openCreateOsModal,
    openFeatureDetailModal
} from './ui/panels/ResearchPanel.js';

const timeSystem = new TimeSystem(state);
const economy = new EconomySystem(state);
const quests = new QuestSystem(state);
const tutorial = new TutorialSystem(state);
const research = new ResearchSystem(state);
const os = new OSSystem(state);

let activeView = 'dashboard';
let activeSubtab = 'tech';
let _burnWarn = null;

const els = {
    header:  document.getElementById('app-header'),
    view:    document.getElementById('app-view'),
    nav:     document.getElementById('mobile-nav'),
    loading: document.getElementById('loading-screen'),
    error:   document.getElementById('error-message'),
    toast:   document.getElementById('toast-container')
};

function getTime() { return timeSystem.snapshot(); }

const EMPTY_VIEWS = {
    products: { icon: '📱', title: 'Belum ada produk', description: 'Desain ponsel, katalog, dan penjualan akan dibuka pada Batch B.', hint: 'Coming in Batch B' },
    market:   { icon: '📈', title: 'Pasar belum aktif', description: 'Kompetitor dan tren pasar akan dibuka pada Batch C.', hint: 'Coming in Batch C' }
};

function hideLoading() { if (els.loading) els.loading.style.display = 'none'; }

function renderHeaderOnly() {
    if (!els.header) return;
    els.header.innerHTML = renderHeader({ state: state.get(), timeSnapshot: getTime(), warning: _burnWarn });
}

function renderNavOnly() {
    if (!els.nav) return;
    els.nav.innerHTML = renderMobileNav({ active: activeView });
}

function renderView() {
    if (!els.view) return;
    let html = '';
    switch (activeView) {
        case 'dashboard': html = renderDashboard(state.get(), getTime(), research); break;
        case 'research':  html = renderResearchPanel({ subtab: activeSubtab, researchSystem: research, osSystem: os }); break;
        case 'settings':  html = renderSettingsPanel(); break;
        case 'guide':     html = renderGuidePanel(); break;
        default:
            html = renderEmptyState(EMPTY_VIEWS[activeView] || { icon: '❓', title: 'Tidak ditemukan' });
    }
    els.view.innerHTML = html;
    els.view.scrollTop = 0;

    if (activeView === 'dashboard') {
        const chart = els.view.querySelector('.chart-wrap');
        if (chart) drawCashChart(chart);
    }
    if (activeView === 'settings') {
        bindSettingsActions(els.view);
    }
}

// Global re-render entry (dipakai modal untuk refresh setelah aksi)
function render() { renderAll(); }

function renderAll() {
    renderHeaderOnly();
    renderNavOnly();
    renderView();
}

let _cashRaf = null;
function animateCash(from, to) {
    if (_cashRaf) { cancelAnimationFrame(_cashRaf); _cashRaf = null; }
    const targets = document.querySelectorAll('[data-cash]');
    if (!targets.length || from === to) return;
    const start = performance.now();
    const DUR = 520;
    const step = function (ts) {
        const p = Math.min(1, (ts - start) / DUR);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = from + (to - from) * eased;
        const text = '$' + Math.round(val).toLocaleString('en-US');
        targets.forEach(function (el) { el.textContent = text; });
        if (p < 1) _cashRaf = requestAnimationFrame(step);
        else _cashRaf = null;
    };
    _cashRaf = requestAnimationFrame(step);
}

function navigate(id) {
    if (id === activeView) return;
    activeView = id;
    renderAll();
    updateTitle();
    bus.emit('view:changed', { id });
    bus.emit('tutorial:action', { id: 'nav:' + id });
}

function updateTitle() {
    const meta = VIEW_TITLES[activeView];
    document.title = APP_CONFIG.name + ' — ' + (meta ? meta.title : 'Dashboard');
}

function vibrate(ms) {
    const s = state.get();
    if (!s.settings.vibrate) return;
    if (navigator && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(ms); } catch (e) {}
    }
}

// ============================================================
// EVENT DELEGATION TUNGGAL — semua tombol di sini
// ============================================================
function bindGlobalClicks() {
    document.body.addEventListener('click', function (e) {
        // 1. Navigasi bottom nav
        const navBtn = e.target.closest('[data-nav]');
        if (navBtn) { e.preventDefault(); vibrate(8); navigate(navBtn.dataset.nav); return; }

        // 2. Kontrol waktu
        const timeBtn = e.target.closest('[data-time-action]');
        if (timeBtn) {
            e.preventDefault(); vibrate(12);
            const a = timeBtn.dataset.timeAction;
            if (a === 'toggle-pause') { timeSystem.togglePause(); bus.emit('tutorial:action', { id: 'action:toggle-pause' }); }
            else if (a === 'cycle-speed') { timeSystem.cycleSpeed(); bus.emit('tutorial:action', { id: 'action:cycle-speed' }); }
            return;
        }

        // 3. Sub-tab Riset
        const subBtn = e.target.closest('[data-subtab]');
        if (subBtn) {
            e.preventDefault(); vibrate(6);
            activeSubtab = subBtn.dataset.subtab;
            renderView();
            return;
        }

        // 4. Filter kategori node riset
        const chip = e.target.closest('[data-filter-cat]');
        if (chip) {
            e.preventDefault();
            setFilterCategory(chip.dataset.filterCat);
            renderView();
            return;
        }

        // 5. Detail node riset (klik kartu)
        const nodeCard = e.target.closest('[data-node-detail]');
        if (nodeCard) {
            e.preventDefault();
            openNodeDetailModal({ nodeId: nodeCard.dataset.nodeDetail, researchSystem: research });
            return;
        }

        // 6. Action di modal node detail
        const rAction = e.target.closest('[data-research-action]');
        if (rAction) {
            e.preventDefault();
            const act = rAction.dataset.researchAction;
            const nodeId = rAction.dataset.nodeId;
            if (act === 'start') {
                const res = research.startResearch(nodeId);
                if (!res.ok) ToastService.error(res.reason || 'Gagal.');
                else { ToastService.success('Riset dimulai!'); Modal.close('node-detail', true); renderAll(); }
            } else if (act === 'cancel') {
                const res = research.cancelResearch(nodeId);
                if (!res.ok) ToastService.error(res.reason || 'Gagal.');
                else { ToastService.info('Riset dibatalkan.'); Modal.close('node-detail', true); renderAll(); }
            }
            return;
        }

        // 7. Aksi OS
        const osAction = e.target.closest('[data-os-action]');
        if (osAction) {
            e.preventDefault();
            const act = osAction.dataset.osAction;
            if (act === 'create')        { openCreateOsModal({ osSystem: os }); return; }
            if (act === 'wizard')        { openOsWizardModal({ osSystem: os }); return; }
            if (act === 'cancel-deving') {
                const res = os.cancelVersion();
                if (res.ok) { ToastService.info('Pengembangan dibatalkan (refund $' + res.refund.toLocaleString('en-US') + ').'); renderAll(); }
                else ToastService.error(res.reason);
                return;
            }
            if (act === 'patch-bug') {
                const res = os.patchBug(osAction.dataset.bugId);
                if (!res.ok) ToastService.error(res.reason);
                else { ToastService.success('Patch dimulai.'); renderAll(); }
                return;
            }
            if (act === 'ignore-bug') {
                const res = os.ignoreBug(osAction.dataset.bugId);
                if (!res.ok) ToastService.error(res.reason);
                else { ToastService.warning('Bug diabaikan.'); renderAll(); }
                return;
            }
            if (act === 'start-app') {
                const res = os.startApp(osAction.dataset.appId);
                if (!res.ok) ToastService.error(res.reason);
                else { ToastService.success('Aplikasi dirilis.'); renderAll(); }
                return;
            }
            if (act === 'invite-devs') {
                const res = os.inviteDevelopers();
                if (!res.ok) ToastService.error(res.reason);
                else { ToastService.success('+' + res.bonus + ' developer!'); renderAll(); }
                return;
            }
            if (act === 'feature-detail') {
                openFeatureDetailModal({ osSystem: os, featureId: osAction.dataset.featureId });
                return;
            }
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); timeSystem.togglePause(); }
        if (e.key === 'f' || e.key === 'F') timeSystem.cycleSpeed();
    });
}

// ============================================================
// Update progress live tanpa re-render
// ============================================================
function bindProgressEvents() {
    bus.on('research:progress', (data) => {
        if (activeView !== 'research' || activeSubtab !== 'tech') return;
        // Update header slot count
        const slotsEl = els.view.querySelector('[data-research-slots]');
        if (slotsEl) slotsEl.textContent = data.active.length + '/' + data.maxSlots;

        data.active.forEach(r => {
            const pct = Math.round(r.percent * 100);
            const bar = els.view.querySelector('[data-research-bar="' + r.nodeId + '"]');
            if (bar) bar.style.width = pct + '%';
            const pctEl = els.view.querySelector('[data-research-pct="' + r.nodeId + '"]');
            if (pctEl) pctEl.textContent = pct + '%';
            const etaEl = els.view.querySelector('[data-research-eta="' + r.nodeId + '"]');
            if (etaEl) etaEl.textContent = 'Sisa ~' + Math.ceil(r.remainingDays) + ' hari • ' + r.progressDays.toFixed(1) + '/' + r.durationDays + ' hari';
        });
    });

    bus.on('os:progress', (data) => {
        if (activeView !== 'research' || activeSubtab !== 'os') return;
        const pct = Math.round(data.percent * 100);
        const bar = els.view.querySelector('[data-os-dev-bar]');
        if (bar) bar.style.width = pct + '%';
        const pctEl = els.view.querySelector('[data-os-dev-pct]');
        if (pctEl) pctEl.textContent = pct + '%';
        const eta = els.view.querySelector('[data-os-dev-eta]');
        if (eta) eta.textContent = 'Sisa ~' + Math.ceil(data.remainingDays) + ' hari • ' + data.progressDays.toFixed(1) + '/' + data.durationDays + ' hari';
    });

    // Saat hari berubah & di tab Riset, re-render agar daftar bug & fitur update
    bus.on('time:day-changed', () => {
        if (activeView === 'research') renderView();
    });
}

// ============================================================
// EVENT LAMA (dipertahankan)
// ============================================================
function bindTimeEvents() {
    bus.on('time:tick', function () {
        const meta = els.header && els.header.querySelector('.header-meta');
        if (!meta) return;
        const t = getTime();
        const hh = String(Math.floor(t.currentHour)).padStart(2, '0');
        const mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
        const d = meta.querySelector('[data-time-date]');
        const c = meta.querySelector('[data-time-clock]');
        const s = meta.querySelector('[data-time-status]');
        if (d) d.textContent = 'Hari ' + t.currentDay + '/' + t.currentMonth + '/' + t.currentYear;
        if (c) c.textContent = hh + ':' + mm;
        if (s) {
            s.textContent = t.isPaused ? 'Paused' : (t.gameSpeed + 'x');
            s.classList.toggle('running', !t.isPaused);
        }
    });
    bus.on('time:day-changed', function () {
        if (activeView === 'dashboard') renderView();
    });
    bus.on('time:speed-changed', function () { renderHeaderOnly(); });
}

function bindStateEvents() {
    bus.on('state:cash-changed', function (data) { animateCash(data.prev, data.next); });
    bus.on('state:log-changed', function () {
        if (activeView === 'dashboard') renderView();
    });
    bus.on('state:milestone-added', function () {
        if (activeView === 'dashboard') renderView();
    });
    bus.on('quest:completed', function (data) {
        ToastService.success('Quest selesai: ' + data.title);
        vibrate(20);
    });
    bus.on('quest:activated', function () {
        if (activeView === 'dashboard') renderView();
    });
    bus.on('economy:warn-burnrate', function (data) {
        _burnWarn = 'Sisa ' + data.monthsLeft + ' bln';
        renderHeaderOnly();
        ToastService.warning('Peringatan: sisa uang ~' + data.monthsLeft + ' bulan biaya!');
        vibrate(30);
    });
    bus.on('settings:take-loan', function (data) {
        const res = economy.takeLoan(data.loanId);
        if (!res.ok) ToastService.error(res.error);
        else { ToastService.success('Pinjaman diterima.'); renderView(); }
    });
    bus.on('settings:changed', function () {});
    bus.on('tutorial:restart', function () { tutorial.restart(); });
}

async function boot() {
    try {
        if (!els.header || !els.view || !els.nav) throw new Error('Elemen HTML utama tidak ditemukan.');

        mountToastContainer(els.toast);
        initTutorialOverlay();
        initMonthlySummary();
        initGameOverScreen();
        hideLoading();

        if (SaveService.hasSave()) {
            const saved = SaveService.load();
            if (saved) { state.hydrate(saved); console.info('[boot] Save dimuat.'); }
        } else {
            const onb = await showOnboarding();
            state.patch({ companyName: onb.companyName, difficulty: onb.difficulty });
            const mod = await import('./data/balance.data.js');
            const starting = mod.BALANCE.startingCash[onb.difficulty] || mod.BALANCE.startingCash.normal;
            state.setCash(starting);
            state.addMilestone('founded', 'Perusahaan ' + onb.companyName + ' didirikan.');
            state.addLog('Perusahaan ' + onb.companyName + ' didirikan dengan modal $' + starting.toLocaleString('en-US') + '.', 'success');
            SaveService.save(state);
        }

        economy.start();
        quests.start();
        tutorial.start();
        research.start();
        os.start();

        renderAll();
        bindGlobalClicks();
        bindTimeEvents();
        bindStateEvents();
        bindProgressEvents();
        updateTitle();

        timeSystem.start();
        SaveService.startAutoSave(function () { return state; });

        const cash = state.get().cash;
        if (cash > 0) {
            document.querySelectorAll('[data-cash]').forEach(function (el) { el.textContent = '$0'; });
            animateCash(0, cash);
        }

        window.__game = {
            state, bus, timeSystem, economy, quests, tutorial, research, os,
            SaveService, ToastService, Modal, navigate, render: renderAll,
            cheat: {
                addCash: function (n) { state.addCash(n); },
                fastForwardDays: function (n) { return timeSystem.fastForwardDays(n); },
                skipDays: function (n) { return timeSystem.fastForwardDays(n); },
                skipToMonth: function (n) { timeSystem.fastForwardDays(n * 30); },
                finishTutorial: function () { tutorial.skip(); },
                addEngineers: function (n) { state.setTeam({ engineers: (state.get().team.engineers || 0) + n }); },
                completeAllResearch: function () { return research.completeAllResearch(); },
                completeResearch: function (id) { return research.completeResearch(id); },
                startOsWith: function (featureIds) { return os.quickSetup(featureIds); },
                spawnOsBug: function () { return os.spawnBug(); }
            }
        };

        console.info('[' + APP_CONFIG.name + '] siap.');
    } catch (err) {
        console.error('[boot] gagal:', err);
        hideLoading();
        if (els.error) {
            els.error.style.display = 'block';
            els.error.textContent = 'Boot error: ' + err.message;
        }
    }
}

boot();
