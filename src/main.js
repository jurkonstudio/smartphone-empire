// FILE: src/main.js
import { APP_CONFIG } from './config/app.config.js';
import { VIEW_TITLES } from './config/constants.js';
import { bus } from './core/EventBus.js';
import { state } from './core/GameState.js';
import { TimeSystem } from './core/TimeSystem.js';
import { SaveService } from './core/SaveService.js';
import { ToastService } from './core/ToastService.js';
import { renderHeader } from './ui/layout/Header.js';
import { renderMobileNav } from './ui/layout/MobileNav.js';
import { renderDashboard } from './ui/panels/DashboardPanel.js';
import { renderEmptyState } from './ui/panels/EmptyState.js';
import { mountToastContainer } from './ui/panels/ToastContainer.js';

// ============ INSTANCE ============
const timeSystem = new TimeSystem(state);
let activeView = 'dashboard';

const els = {
    header: document.getElementById('app-header'),
    view:   document.getElementById('app-view'),
    nav:    document.getElementById('mobile-nav'),
    loading:document.getElementById('loading-screen'),
    error:  document.getElementById('error-message'),
    toast:  document.getElementById('toast-container')
};

function getTimeSnapshot() { return timeSystem.snapshot(); }

// ============ VIEW DEFINITIONS ============
const EMPTY_VIEWS = {
    research: {
        icon: '🔬',
        title: 'Riset belum aktif',
        description: 'Technology tree dengan kategori layar, kamera, baterai, chip, dan jaringan akan dibuka pada Fase 3.',
        hint: 'Coming in Fase 3'
    },
    products: {
        icon: '📱',
        title: 'Belum ada produk',
        description: 'Sistem desain produk, pemilihan komponen, dan produksi massal akan dibuka pada Fase 4.',
        hint: 'Coming in Fase 4'
    },
    market: {
        icon: '📈',
        title: 'Pasar belum aktif',
        description: 'Analisis pasar, kompetitor AI, dan tren era akan dibuka pada Fase 5-6.',
        hint: 'Coming in Fase 5'
    },
    settings: {
        icon: '⚙️',
        title: 'Pengaturan',
        description: 'Save/Load manual, reset game, dan preferensi akan tersedia di update berikutnya.',
        hint: 'Soon'
    }
};

// ============ RENDER ============
function renderHeaderOnly() {
    if (!els.header) return;
    els.header.innerHTML = renderHeader({
        state: state.get(),
        timeSnapshot: getTimeSnapshot()
    });
}

function renderNavOnly() {
    if (!els.nav) return;
    els.nav.innerHTML = renderMobileNav({ active: activeView });
}

function renderView() {
    if (!els.view) return;
    if (activeView === 'dashboard') {
        els.view.innerHTML = renderDashboard(state.get(), getTimeSnapshot());
    } else {
        const cfg = EMPTY_VIEWS[activeView] || {
            icon: '❓', title: 'Halaman tidak ditemukan', description: ''
        };
        els.view.innerHTML = renderEmptyState(cfg);
    }
    els.view.scrollTop = 0;
}

function renderAll() {
    renderHeaderOnly();
    renderNavOnly();
    renderView();
}

// ============ CASH ANIMATION (count up/down) ============
let _cashRaf = null;
function animateCash(from, to) {
    if (_cashRaf) { cancelAnimationFrame(_cashRaf); _cashRaf = null; }
    const targets = document.querySelectorAll('[data-cash]');
    if (!targets.length || from === to) return;

    const startTs = performance.now();
    const DURATION = 520;

    const step = (ts) => {
        const p = Math.min(1, (ts - startTs) / DURATION);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const val = from + (to - from) * eased;
        const text = '$' + Math.round(val).toLocaleString('en-US');
        targets.forEach(el => { el.textContent = text; });
        if (p < 1) _cashRaf = requestAnimationFrame(step);
        else _cashRaf = null;
    };
    _cashRaf = requestAnimationFrame(step);
}

// ============ NAVIGATION ============
function navigate(id) {
    if (!VIEW_TITLES[id] || id === activeView) return;
    activeView = id;
    renderAll();
    updateDocumentTitle();
    bus.emit('view:changed', { id });
}

function updateDocumentTitle() {
    const meta = VIEW_TITLES[activeView];
    document.title = `${APP_CONFIG.name} — ${meta ? meta.title : 'Dashboard'}`;
}

// ============ VIBRATION (opsional, hemat) ============
function vibrate(ms) {
    if (navigator && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(ms); } catch (_) { /* ignore */ }
    }
}

// ============ EVENT DELEGATION ============
// Hanya SATU listener di <body>. Semua tombol memakai data-* attribute.
function bindGlobalClicks() {
    document.body.addEventListener('click', (e) => {
        // Navigasi bottom nav
        const navBtn = e.target.closest('[data-nav]');
        if (navBtn) {
            e.preventDefault();
            vibrate(8);
            navigate(navBtn.dataset.nav);
            return;
        }

        // Kontrol waktu (pause & speed)
        const timeBtn = e.target.closest('[data-time-action]');
        if (timeBtn) {
            e.preventDefault();
            vibrate(12);
            const action = timeBtn.dataset.timeAction;
            if (action === 'toggle-pause') timeSystem.togglePause();
            else if (action === 'cycle-speed') timeSystem.cycleSpeed();
            return;
        }
    });
}

// ============ EVENT: TIME ============
function bindTimeEvents() {
    // Tick throttled: hanya update span jam di header, TIDAK re-render.
    bus.on('time:tick', () => {
        const meta = els.header && els.header.querySelector('.header-meta');
        if (!meta) return;
        const t = getTimeSnapshot();
        const hh = String(Math.floor(t.currentHour)).padStart(2, '0');
        const mm = String(Math.floor(t.currentMinute)).padStart(2, '0');
        const dateEl = meta.querySelector('[data-time-date]');
        const clockEl = meta.querySelector('[data-time-clock]');
        const statusEl = meta.querySelector('[data-time-status]');
        if (dateEl) dateEl.textContent = `Hari ${t.currentDay}/${t.currentMonth}/${t.currentYear}`;
        if (clockEl) clockEl.textContent = `${hh}:${mm}`;
        if (statusEl) {
            statusEl.textContent = t.isPaused ? 'Paused' : (t.gameSpeed + 'x');
            statusEl.classList.toggle('running', !t.isPaused);
        }
    });

    // Perubahan hari: refresh header + (jika di dashboard) view agar "Hari Ke-" akurat.
    bus.on('time:day-changed', () => {
        renderHeaderOnly();
        if (activeView === 'dashboard') renderView();
    });

    bus.on('time:month-changed', () => {
        renderHeaderOnly();
        ToastService.info('Memasuki bulan ' + getTimeSnapshot().currentMonth);
    });

    bus.on('time:year-changed', () => {
        renderHeaderOnly();
        ToastService.success('Selamat tahun baru ' + getTimeSnapshot().currentYear);
    });

    bus.on('time:speed-changed', () => renderHeaderOnly());
}

// ============ EVENT: STATE ============
function bindStateEvents() {
    bus.on('state:cash-changed', ({ prev, next }) => {
        animateCash(prev, next);
    });

    bus.on('save:error', () => {
        ToastService.error('Gagal menyimpan progres.');
    });
}

// ============ BOOT ============
function boot() {
    try {
        if (!els.header || !els.view || !els.nav) {
            throw new Error('Elemen HTML utama (header/view/nav) tidak ditemukan.');
        }

        // Load save jika ada, jika tidak mulai baru
        if (SaveService.hasSave()) {
            const saved = SaveService.load();
            if (saved) {
                state.hydrate(saved);
                console.info('[boot] Save dimuat.');
            }
        }

        // Toast system
        mountToastContainer(els.toast);

        // Render awal
        renderAll();
        bindGlobalClicks();
        bindTimeEvents();
        bindStateEvents();
        updateDocumentTitle();

        // Mulai jam & autosave
        timeSystem.start();
        SaveService.startAutoSave(() => state);

        // Animasi uang awal (count-up dari 0)
        const currentCash = state.get().cash;
        if (currentCash > 0) {
            const targets = document.querySelectorAll('[data-cash]');
            targets.forEach(el => { el.textContent = '$0'; });
            animateCash(0, currentCash);
        }

        // Handle untuk debugging via console
        window.__game = { state, bus, timeSystem, SaveService, ToastService, navigate };

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
