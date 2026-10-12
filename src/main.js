import { APP_CONFIG } from './config/app.config.js';
import { NAV_ITEMS, VIEW_TITLES, MOBILE_NAV_IDS } from './config/constants.js';
import { bus } from './core/EventBus.js';
import { state } from './core/GameState.js';
import { renderHeader } from './ui/layout/Header.js';
import { renderSidebar } from './ui/layout/Sidebar.js';
import { renderMobileNav } from './ui/layout/MobileNav.js';
import { renderDashboard } from './ui/panels/DashboardPanel.js';
import { renderEmptyState } from './ui/panels/EmptyState.js';

const EMPTY_VIEWS = {
  products: {
    iconName: 'box',
    title: 'Belum ada sistem produk',
    description: 'Sistem desain, peluncuran, dan manajemen produk akan tersedia pada milestone berikutnya.',
    hint: 'Coming in M2',
  },
  research: {
    iconName: 'flask',
    title: 'Belum ada sistem riset',
    description: 'Tech tree, riset komponen, dan progres teknologi akan tersedia pada milestone berikutnya.',
    hint: 'Coming in M1',
  },
  factory: {
    iconName: 'factory',
    title: 'Belum ada sistem produksi',
    description: 'Manajemen pabrik, kapasitas, dan supply chain belum diimplementasikan.',
    hint: 'Belum dijadwalkan',
  },
  finance: {
    iconName: 'dollar',
    title: 'Belum ada sistem keuangan',
    description: 'Laporan laba-rugi, pinjaman, dan investasi belum diimplementasikan.',
    hint: 'Belum dijadwalkan',
  },
  settings: {
    iconName: 'settings',
    title: 'Belum ada pengaturan',
    description: 'Opsi permainan, save/load, dan preferensi akan hadir setelah sistem inti selesai.',
    hint: 'Belum dijadwalkan',
  },
};

const ROUTES = {
  dashboard: () => renderDashboard(state.get()),
  products:  () => renderEmptyState(EMPTY_VIEWS.products),
  research:  () => renderEmptyState(EMPTY_VIEWS.research),
  factory:   () => renderEmptyState(EMPTY_VIEWS.factory),
  finance:   () => renderEmptyState(EMPTY_VIEWS.finance),
  settings:  () => renderEmptyState(EMPTY_VIEWS.settings),
};

const els = {
  header: document.getElementById('app-header'),
  sidebar: document.getElementById('sidebar'),
  mobileNav: document.getElementById('mobile-nav'),
  view: document.getElementById('app-view'),
};

let activeView = 'dashboard';

// FUNGSI BANTUAN: Menghilangkan Layar Loading
function hideLoadingScreen() {
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.style.display = 'none';
  }
}

// FUNGSI BANTUAN: Menampilkan Error di Layar HP
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.style.display = 'block';
    errorDiv.innerHTML = message;
  }
  hideLoadingScreen();
}

function renderShell() {
  els.header.innerHTML = renderHeader({ state: state.get(), activeView });
  els.sidebar.innerHTML = renderSidebar({ active: activeView });
  els.mobileNav.innerHTML = renderMobileNav({ active: activeView });
}

function renderView() {
  const route = ROUTES[activeView] || ROUTES.dashboard;
  els.view.innerHTML = route();
  els.view.scrollTop = 0;
}

function bindNavClicks() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (!btn) return;
    e.preventDefault();
    navigate(btn.dataset.nav);
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

function boot() {
  // BUNGKUS DENGAN TRY-CATCH UNTUK MENANGKAP ERROR
  try {
    // Validasi konfigurasi minimal
    if (!Array.isArray(NAV_ITEMS) || NAV_ITEMS.length === 0) {
      console.error('[boot] NAV_ITEMS kosong.');
    }
    if (!MOBILE_NAV_IDS.length) {
      console.warn('[boot] MOBILE_NAV_IDS kosong — navigasi mobile tidak akan tampil.');
    }

    // Cek apakah elemen HTML utama ada. Jika tidak, lempar error.
    if (!els.header || !els.sidebar || !els.mobileNav || !els.view) {
      throw new Error("Elemen HTML utama (app-header, sidebar, mobile-nav, app-view) tidak ditemukan di index.html");
    }

    // Jalankan Render
    renderShell();
    renderView();
    bindNavClicks();
    setDocumentTitle();

    bus.on('view:changed', setDocumentTitle);
    console.info(`[${APP_CONFIG.name}] v${APP_CONFIG.version} (${APP_CONFIG.milestone}) siap.`);
    
    // JIKA SUKSES, HILANGKAN LAYAR LOADING
    hideLoadingScreen();

  } catch (error) {
    console.error("[boot] Gagal menjalankan aplikasi:", error);
    // TAMPILKAN PESAN ERROR DI LAYAR
    showError("<strong>❌ Terjadi Error saat Memuat Aplikasi:</strong><br><br>" + 
              error.message + "<br><br>" +
              "<i>Buka Console browser (F12) untuk melihat detail baris kodenya.</i>");
  }
}

// Jalankan aplikasi
boot();
