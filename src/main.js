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

// ============ INSTANCE ============
const timeSystem  = new TimeSystem(state);
const economy     = new EconomySystem(state);
const quests      = new QuestSystem(state);
const tutorial    = new TutorialSystem(state);

let activeView = 'dashboard';
let _burnWarn  = null;

// ============ DOM ============
const els = {
    header:  document.getElementById('app-header'),
    view:    document.getElementById('app-view'),
    nav:     document.getElementById('mobile-nav'),
    loading: document.getElementById('loading-screen'),
    error:   document.getElementById('error-message'),
    toast:   document.getElementById('toast-container')
};

function getTime() { return timeSystem.snapshot(); }

// ============ VIEW ============
const EMPTY_VIEWS = {
    research: { icon: '🔬', title: 'Riset belum aktif',
        description: 'Technology tree, OS, dan ekosistem aplikasi akan dibuka pada Tahap 2.',
        hint: 'Coming in Tahap 2' },
    products: { icon: '📱', title: 'Belum ada produk',
        description: 'Desain ponsel, katalog, dan penjualan akan dibuka pada Tahap 3.',
        hint: 'Coming in Tahap 3' },
    market:   { icon: '📈', title: 'Pasar belum aktif',
        description: 'Kompetitor AI dan tren pasar akan dibuka pada Tahap 4.',
        hint: 'Coming in Tahap 4' }
};

function renderHeaderOnly() {
    if (!els.header) return;
    els.header.innerHTML = renderHeader({
        state: state.get(),
        timeSnapshot: getTime(),
        warning: _burnWarn
    });
}

function renderNavOnly() {
    if (!els.nav) return;
    els.nav.innerHTML = renderMobileNav({ active: activeView });
}

function renderView() {
    if (!els.view) return;
    let html = '';
    switch (activeView) {
        case 'dashboard': html = renderDashboard(state.get(), getTime()); break;
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

function renderAll() {
    renderHeaderOnly();
    renderNavOnly();
    renderView();
}

// ============ CASH ANIMATION ============
let _cashRaf = null;
function animateCash(from, to) {
    if (_cashRaf) { cancelAnimationFrame(_cashRaf); _cashRaf = null; }
    const targets = document.querySelectorAll('[data-cash]');
    if (!targets.length || from === to) return;
    const start = performance.now();
    const DUR = 520;
    const step = (ts) => {
        const p = Math.min(1, (ts - start) / DUR);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = from + (to - from) * eased;
        const text = '$' + Math.round(val).toLocaleString('en-US');
        targets.forEach(el => el.textContent = text);
        if (p < 1) _cashRaf = requestAnimationFrame(step);
        else _cashRaf = null;
    };
    _cashRaf = requestAnimationFrame(step);
}

// ============ NAVIGASI ============
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
    document.title = `${APP_CONFIG.name} — ${meta ? meta.title : 'Dashboard'}`;
}

// ============ VIBRATE ============
function vibrate(ms) {
    const s = state.get();
    if (!s.settings.vibrate) return;
    if (navigator && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(ms); } catch (_) {}
    }
}

// ============ EVENT DELEGATION ============
function bindGlobalClicks() {
    document.body.addEventListener('click', (e) => {
        const navBtn = e.target.closest('[data-nav]');
        if (navBtn) { e.preventDefault(); vibrate(8); navigate(navBtn.dataset.nav); return; }

        const timeBtn = e.target.closest('[data-time-action]');
        if (timeBtn) {
            e.preventDefault(); vibrate(12);
            const a = timeBtn.dataset.timeAction;
            if (a === 'toggle-pause') { timeSystem.togglePause(); bus.emit('tutorial:action', { id: 'action:toggle-pause' }); }
            else if (a === 'cycle-speed') { timeSystem.cycleSpeed(); bus.emit('tutorial:action', { id: 'action:cycle-speed' }); }
            return;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); timeSystem.togglePause(); }
        if (e.key === 'f' || e.key === 'F') timeSystem.cycleSpeed();
    });
}

// ============ TIME EVENTS ============
function bindTimeEvents() {
    bus.on('time:tick', () => {
        const meta = els.header?.querySelector('.header-meta');
        if (!meta) return;
        const t = getTime();
        const hh = String(Math.floor(t.currentHour)).padStart(2, '0');
        const mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
        const d = meta.querySelector('[data-time-date]');
        const c = meta.querySelector('[data-time-clock]');
        const s = meta.querySelector('[data-time-status]');
        if (d) d.textContent = `Hari ${t.currentDay}/${t.currentMonth}/${t.currentYear}`;
        if (c) c.textContent = `${hh}:${mm}`;
        if (s) {
            s.textContent = t.isPaused ? 'Paused' : (t.gameSpeed + 'x');
            s.classList.toggle('running', !t.isPaused);
        }
    });

    bus.on('time:day-changed', () => {
        if (activeView === 'dashboard') renderView();
    });

    bus.on('time:speed-changed', () => renderHeaderOnly());
}

// ============ STATE EVENTS ============
function bindStateEvents() {
    bus.on('state:cash-changed', ({ prev, next }) => animateCash(prev, next));

    bus.on('state:log-changed', () => {
        if (activeView === 'dashboard') renderView();
    });
    bus.on('state:milestone-added', () => {
        if (activeView === 'dashboard') renderView();
    });
    bus.on('quest:completed', ({ title }) => {
        ToastService.success(`Quest selesai: ${title}`);
        vibrate(20);
    });
    bus.on('quest:activated', () => {
        if (activeView === 'dashboard') renderView();
    });

    bus.on('economy:warn-burnrate', ({ monthsLeft }) => {
        _burnWarn = `Sisa ${monthsLeft} bln`;
        renderHeaderOnly();
        ToastService.warning(`Peringatan: sisa uang ~${monthsLeft} bulan biaya!`);
        vibrate(30);
    });

    bus.on('settings:take-loan', ({ loanId }) => {
        const res = economy.takeLoan(loanId);
        if (!res.ok) ToastService.error(res.error);
        else { ToastService.success('Pinjaman diterima.'); renderView(); }
    });

    bus.on('settings:changed', () => {});
    bus.on('tutorial:restart', () => tutorial.restart());
}

// ============ BOOT ============
async function boot() {
    try {
        if (!els.header || !els.view || !els.nav) throw new Error('Elemen HTML utama tidak ditemukan.');

        mountToastContainer(els.toast);
        initTutorialOverlay();
        initMonthlySummary();
        initGameOverScreen();

        if (SaveService.hasSave()) {
            const saved = SaveService.load();
            if (saved) {
                state.hydrate(saved);
                console.info('[boot] Save dimuat.');
            }
        } else {
            const onb = await showOnboarding();
            state.patch({ companyName: onb.companyName, difficulty: onb.difficulty });
            const BAL = (await import('./data/balance.data.js')).BALANCE;
            const starting = BAL.startingCash[onb.difficulty] ?? BAL.startingCash.normal;
            state.setCash(starting);
            state.addMilestone('founded', `Perusahaan ${onb.companyName} didirikan.`);
            state.addLog(`Perusahaan ${onb.companyName} didirikan dengan modal $${starting.toLocaleString('en-US')}.`, 'success');
            SaveService.save(state);
        }

        economy.start();
        quests.start();
        tutorial.start();

        renderAll();
        bindGlobalClicks();
        bindTimeEvents();
        bindStateEvents();
        updateTitle();

        timeSystem.start();
        SaveService.startAutoSave(() => state);

        const cash = state.get().cash;
        if (cash > 0) {
            document.querySelectorAll('[data-cash]').forEach(el => el.textContent = '$0');
            animateCash(0, cash);
        }

        window.__game = {
            state, bus, timeSystem, economy, quests, tutorial, SaveService, ToastService, Modal, navigate,
            cheat: {
                addCash(n) { state.addCash(n); },
                fastForwardDays(n) { return timeSystem.fastForwardDays(n); },
                skipToMonth(n) { timeSystem.fastForwardDays(n * 30); },
                finishTutorial() { tutorial.skip(); }
            }
        };

        els.loading.style.display = 'none';
        console.info(`[${APP_CONFIG.name}] v${APP_CONFIG.version} (${APP_CONFIG.milestone}) siap.`);
    } catch (err) {
        console.error('[boot] gagal:', err);
        if (els.loading) els.loading.style.display = 'none';
        if (els.error) {
            els.error.style.display = 'block';
            els.error.textContent = 'Boot error: ' + err.message;
        }
    }
}

boot();
