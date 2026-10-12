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

export const MOBILE_NAV_IDS = NAV_ITEMS.map(function (i) { return i.id; });

export const DIFFICULTY = {
    santai: 'santai',
    normal: 'normal',
    sulit:  'sulit'
};

export const TEAM_ROLES = {
    engineer: 'engineer',
    designer: 'designer',
    marketer: 'marketer'
};

export const BASE_RESEARCH_SLOTS = 1;
export const MAX_RESEARCH_SLOTS = 3;

export const TIP_IDS = {
    FIRST_START:     'first_start',
    FIRST_SPEED:     'first_speed',
    FIRST_CASH:      'first_cash',
    FIRST_NAV:       'first_nav',
    FIRST_RECRUIT:   'first_recruit',
    FIRST_CHART:     'first_chart',
    FIRST_SETTINGS:  'first_settings'
};

export const LOG_TYPES = {
    info:    'info',
    success: 'success',
    warning: 'warning',
    danger:  'danger'
};
// ============================================================
// TIP IDs baru (Batch A)
// ============================================================
export const TIP_IDS_EXTRA = {
    RESEARCH_INTRO: 'research_intro',
    OS_INTRO:       'os_intro',
    OS_BUG:         'os_bug',
    OS_APPSTORE:    'os_appstore'
};

// Merge ke TIP_IDS lama tanpa menimpa
// (jika TIP_IDS di constants.js lama sudah object, tambahkan manual 4 entri di atas ke object tersebut)

// ============================================================
// RESEARCH — konstanta UI & logic
// ============================================================
export const RESEARCH_STATUS = {
    LOCKED:    'locked',
    AVAILABLE: 'available',
    RUNNING:   'running',
    DONE:      'done'
};

export const OS_VERSION_STATUS = {
    DEVELOPING: 'developing',
    RELEASED:   'released',
    FAILED:     'failed'
};
