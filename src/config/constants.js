// FILE: src/config/constants.js

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

export const MOBILE_NAV_IDS = NAV_ITEMS.map(i => i.id);

// Tingkat kesulitan — dipakai di balance.data.js juga
export const DIFFICULTY = {
    santai: 'santai',
    normal: 'normal',
    sulit:  'sulit'
};

// Role tim
export const TEAM_ROLES = {
    engineer: 'engineer',
    designer: 'designer',
    marketer: 'marketer'
};

// Jumlah slot riset paralel (dasar)
export const BASE_RESEARCH_SLOTS = 1;
export const MAX_RESEARCH_SLOTS = 3;

// ID tips kontekstual (dipakai TutorialSystem)
export const TIP_IDS = {
    FIRST_START:     'first_start',
    FIRST_SPEED:     'first_speed',
    FIRST_CASH:      'first_cash',
    FIRST_NAV:       'first_nav',
    FIRST_RECRUIT:   'first_recruit',
    FIRST_CHART:     'first_chart',
    FIRST_SETTINGS:  'first_settings'
};

// Tipe log
export const LOG_TYPES = {
    info:    'info',
    success: 'success',
    warning: 'warning',
    danger:  'danger'
};
