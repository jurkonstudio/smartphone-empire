// FILE: src/config/constants.js

// 5 tab utama sesuai roadmap Fase 1
export const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'research',  label: 'Riset',     icon: '🔬' },
    { id: 'products',  label: 'Produk',    icon: '📱' },
    { id: 'market',    label: 'Pasar',     icon: '📈' },
    { id: 'settings',  label: 'Setelan',   icon: '⚙️' }
];

export const VIEW_TITLES = {
    dashboard: { title: 'Dashboard' },
    research:  { title: 'Riset' },
    products:  { title: 'Produk' },
    market:    { title: 'Pasar' },
    settings:  { title: 'Pengaturan' }
};

// Semua tab tampil di bottom nav mobile
export const MOBILE_NAV_IDS = NAV_ITEMS.map(i => i.id);
