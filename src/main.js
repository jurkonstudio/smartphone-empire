import { APP_CONFIG } from './config/app.config.js';
import { NAV_ITEMS, VIEW_TITLES, MOBILE_NAV_IDS } from './config/constants.js';
import { bus } from './core/EventBus.js';
import { state } from './core/GameState.js';
import { TimeSystem } from './core/TimeSystem.js';
import { renderHeader } from './ui/layout/Header.js';
import { renderSidebar } from './ui/layout/Sidebar.js';
import { renderMobileNav } from './ui/layout/MobileNav.js';
import { renderDashboard } from './ui/panels/DashboardPanel.js';
import { renderEmptyState } from './ui/panels/EmptyState.js';

// ============================================================
// Inisialisasi TimeSystem (sumber waktu global tunggal)
// ============================================================
const timeSystem = new TimeSystem(state);

const EMPTY_VIEWS = {
    products: { title: 'Belum ada sistem produk', description: 'Sistem desain, peluncuran, dan manajemen produk akan tersedia pada milestone berikutnya.', hint: 'Coming in M2' },
    research: { title: 'Belum ada sistem riset', description: 'Tech tree, riset komponen, dan progres teknologi akan tersedia pada milestone berikutnya.', hint: 'Coming in M1' },
    factory:  { title: 'Belum ada sistem produksi', description: 'Manajemen pabrik, kapasitas, dan supply chain belum diimplementasikan.', hint: 'Belum dijadwalkan' },
    finance:  { title: 'Belum ada sistem keuangan', description: 'Laporan laba-rugi, pinjaman, dan investasi belum diimplementasikan.', hint: 'Belum dijadwalkan' },
    settings: { title: 'Belum ada pengaturan', description: 'Opsi permainan, save/load, dan preferensi akan hadir setelah sistem inti selesai.', hint: 'Belum dijadwalkan' }
};

const ROUTES = {
    dashboard: () => renderDashboard(state.get(), timeSystem.getSnapshot()),
    products:  () => renderEmptyState(EMPTY_VIEWS.products),
    research:  () => renderEmptyState(EMPTY_VIEWS.research),
    factory:   () => renderEmptyState(EMPTY_VIEWS.factory),
    finance:   () => renderEmptyState(EMPTY_VIEWS.finance),
    settings:  () => renderEmptyState(EMPTY_VIEWS.settings)
};

const els = {
    header: document.getElementById('app-header'),
    sidebar: document.getElementById('sidebar'),
    mobileNav: document.getElementById('mobile-nav'),
    view: document.getElementById('app-view')
};

let activeView = 'dashboard';

function hideLoadingScreen() {
    const loading = document.getElementById('loading-screen');
    if (loading) loading.style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = message;
    }
    hideLoadingScreen();
}

function renderShell() {
    if (!els.header || !els.sidebar || !els.mobileNav) return;
    els.header.innerHTML = renderHeader({
        state: state.get(),
        activeView,
        timeSnapshot: timeSystem.getSnapshot()
    });
    els.sidebar.innerHTML = renderSidebar({ active: activeView });
    els.mobileNav.innerHTML = renderMobileNav({ active: activeView });
}

function renderView() {
    if (!els.view) return;
    const route = ROUTES[activeView] || ROUTES.dashboard;
    els.view.innerHTML = route();
    els.view.scrollTop = 0;
}

// ============================================================
// Event delegation tunggal di <body> untuk semua tombol.
// Tidak ada listener yang dipasang berulang.
// ============================================================
function bindGlobalClicks() {
    document.body.addEventListener('click', (e) => {
        // Navigasi
        const navBtn = e.target.closest('[data-nav]');
        if (navBtn) {
            e.preventDefault();
            navigate(navBtn.dataset.nav);
            return;
        }

        // Kontrol waktu
        const timeBtn = e.target.closest('[data-time-action]');
        if (timeBtn) {
            e.preventDefault();
            const action = timeBtn.dataset.timeAction;
            if (action === 'toggle-pause') timeSystem.togglePause();
            else if (action === 'cycle-speed') timeSystem.cycleSpeed();
            return;
        }
    });
}

function navigate(id) {
    if (!ROUTES[id] || id === activeView) return;
    activeView = id;
    renderShell();
    renderView();
    bus.emit('view:changed', { id });
}

function setDocumentTitle() {
    const meta = VIEW_TITLES[activeView];
    document.title = `${APP_CONFIG.name} — ${meta ? meta.title : 'Dashboard'}`;
}

// ============================================================
// Subscriber untuk event waktu.
// Re-render header saat hari/bulan/tahun/speed berubah.
// ============================================================
function bindTimeEvents() {
    bus.on('time:day-changed',   () => renderShell());
    bus.on('time:month-changed', () => renderShell());
    bus.on('time:year-changed',  () => {
        renderShell();
        console.info('[TimeSystem] Tahun berganti:', timeSystem.getSnapshot().currentYear);
    });
    bus.on('time:speed-changed', () => renderShell());
}

function boot() {
    try {
        if (!els.header || !els.sidebar || !els.mobileNav || !els.view) {
            throw new Error('Elemen HTML utama tidak ditemukan di index.html');
        }
        if (!Array.isArray(NAV_ITEMS) || NAV_ITEMS.length === 0) {
            console.error('[boot] NAV_ITEMS kosong.');
        }
        if (!MOBILE_NAV_IDS.length) {
            console.warn('[boot] MOBILE_NAV_IDS kosong.');
        }

        renderShell();
        renderView();
        bindGlobalClicks();
        bindTimeEvents();
        setDocumentTitle();

        bus.on('view:changed', setDocumentTitle);

        // Jalankan TimeSystem
        timeSystem.start();

        // Expose untuk debugging & tes manual dari console
        window.__game = { timeSystem, state, bus };
        console.info(`[${APP_CONFIG.name}] v${APP_CONFIG.version} (${APP_CONFIG.milestone}) siap.`);
        console.info('Gunakan window.__game.timeSystem untuk tes waktu.');

        hideLoadingScreen();
    } catch (error) {
        console.error('[boot] Gagal:', error);
        showError('<strong>❌ Terjadi Error:</strong><br><br>' + error.message);
    }
}

boot();
