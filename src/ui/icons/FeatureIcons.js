// FILE: src/ui/icons/FeatureIcons.js
// ============================================================
// Duotone SVG Icon Library — 80+ outline icons.
// + Filled versions (batch 1: 10 icons).
// Style: outline stroke 1.75px | filled = solid currentColor.
// Compatible dengan Lucide/Feather design language.
// ============================================================

export var FEATURE_ICONS = {
    // ==================== COMMUNICATION ====================
    message:        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    contacts:       '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3M15 12h3M15 16h3M5 20c0-2 2-3 4-3s4 1 4 3"/>',
    "message-square":'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    mail:           '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone:          '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "video-call":   '<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',

    // ==================== MEDIA ====================
    camera:         '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    image:          '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    video:          '<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    music:          '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    "music-note":   '<circle cx="8" cy="18" r="3"/><path d="M21 3v12"/><circle cx="18" cy="15" r="3"/><path d="M8 18V5l13-3"/>',
    headphones:     '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2" y="14" width="4" height="7" rx="1"/><rect x="18" y="14" width="4" height="7" rx="1"/>',
    mic:            '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"/>',
    gallery:        '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',

    // ==================== SYSTEM ====================
    settings:       '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    sliders:        '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    "sliders-horizontal":'<line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>',
    bell:           '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    cloud:          '<path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.26A7 7 0 1 0 6 18"/>',
    folder:         '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>',
    "folder-open":  '<path d="M6 14 7.5 11.1A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6A2 2 0 0 1 18.45 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
    file:           '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    lock:           '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "lock-open":    '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    shield:         '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    "shield-check": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    "shield-lock":  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9a2 2 0 0 1 4 0v2"/>',
    clipboard:      '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',

    // ==================== NAVIGATION ====================
    globe:          '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    compass:        '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    "map-pin":      '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    move:           '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
    radio:          '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',

    // ==================== INTERACTION ====================
    finger:         '<path d="M12 11V6a2 2 0 0 1 4 0v8"/><path d="M16 14v-3a2 2 0 0 1 4 0v4a8 8 0 0 1-16 0v-4a2 2 0 0 1 4 0v3a2 2 0 0 0 4 0v-5a2 2 0 0 1 4 0"/>',
    touch:          '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>',
    hand:           '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 1 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    pointer:        '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>',

    // ==================== SECURITY ====================
    fingerprint:    '<path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
    "scan-face":    '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',

    // ==================== AI / COMPUTE ====================
    brain:          '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>',
    cpu:            '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M9 2v2M9 20v2M20 15h2M20 9h2M2 15h2M2 9h2"/>',
    gpu:            '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><path d="M22 10h-2M22 14h-2"/>',
    bot:            '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
    sparkles:       '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    waveform:       '<path d="M2 12h2M6 8v8M10 4v16M14 6v12M18 9v6M22 12h-2"/>',
    "brain-circuit":'<path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M16 8V5a2 2 0 0 1 2-2"/>',
    "brain-cog":    '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><circle cx="12" cy="12" r="3"/>',
    thermometer:    '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    leaf:           '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    plug:           '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6v4a6 6 0 0 0 12 0z"/>',
    battery:        '<rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/>',
    database:       '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    memory:         '<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v8M10 8v8M14 8v8M18 8v8"/>',
    zap:            '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    blocks:         '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
    code:           '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    "git-branch":   '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    satellite:      '<path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/>',
    signal:         '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
    wifi:           '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',

    // ==================== BUSINESS ====================
building:       '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
briefcase:      '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13a18.15 18.15 0 0 0 20 0"/>',
factory:        '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M17 18h1M12 18h1M7 18h1"/>',
store:          '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>...    "credit-card":  '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    gift:           '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',

    // ==================== DESIGN ====================
    palette:        '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    "layout-grid":  '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    columns:        '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
    droplet:        '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    layers:         '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    monitor:        '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    aperture:       '<circle cx="12" cy="12" r="10"/><line x1="14.31" x2="20.05" y1="8" y2="17.94"/><line x1="9.69" x2="21.17" y1="8" y2="8"/><line x1="7.38" x2="13.12" y1="12" y2="2.06"/><line x1="9.69" x2="3.95" y1="16" y2="6.06"/><line x1="14.31" x2="2.83" y1="16" y2="16"/><line x1="16.62" x2="10.88" y1="12" y2="21.94"/>',
    library:        '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',

    // ==================== MISC ====================
    sun:            '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon:           '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    target:         '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    activity:       '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    link:           '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    cube:           '<path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="M3 8l9 5 9-5"/><path d="M12 21V13"/>',
    "picture-in-picture":'<path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/>',
    "scan-text":    '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8h8"/><path d="M7 12h10"/><path d="M7 16h6"/>',
    pill:           '<rect x="2" y="8" width="20" height="8" rx="4"/>',
    clock:          '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    heart:          '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    grid:           '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    portrait:       '<rect width="14" height="20" x="5" y="2" rx="2"/>',
    smile:          '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    "question":     '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    calendar:       '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    gamepad:        '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/>',
    film:           '<rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',

    // ==================== V0.5 — NEW OUTLINE ICONS ====================
    coin:           '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15 9.5a3 3 0 0 0-6 0c0 3 6 3 6 6a3 3 0 0 1-6 0"/>',
    check:          '<polyline points="20 6 9 17 4 12"/>',
    hourglass:      '<path d="M5 3h14M5 21h14M7 3v3l5 5 5-5V3M7 21v-3l5-5 5 5v3"/>',
    plus:           '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    disc:           '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    warn:           '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
};

// ============================================================
// FILLED ICONS — batch 1 (10 ikon).
// Fill currentColor. Jangan pakai stroke kecuali perlu.
// ============================================================
export var FEATURE_ICONS_FILLED = {
    // CPU / chip silikon dengan pin
    cpu:      '<path fill-rule="evenodd" d="M5 5h14v14H5V5zm4 4v6h6V9H9z"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',

    // Speech bubble solid
    message:  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',

    // Amplop solid dengan lipatan V cut-out
    mail:     '<path fill-rule="evenodd" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 3v11h16V7l-8 5-8-5z"/>',

    // Kamera solid + lensa cut-out
    camera:   '<path fill-rule="evenodd" d="M4 7h3l2.5-3h5L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>',

    // Baterai solid + kontak
    battery:  '<rect x="2" y="7" width="18" height="10" rx="2"/><rect x="21" y="11" width="2" height="2" rx="0.5"/>',

    // Database silinder solid (top ellipse sebagai cut-out)
    database: '<path fill-rule="evenodd" d="M12 2C6.48 2 3 3.34 3 5v14c0 1.66 3.48 3 9 3s9-1.34 9-3V5c0-1.66-3.48-3-9-3zm0 2c3.87 0 7 .9 7 1s-3.13 1-7 1-7-.9-7-1 3.13-1 7-1z"/>',

    // Shield solid
    shield:   '<path d="M12 2 4 5v7c0 5.55 8 10 8 10s8-4.45 8-10V5l-8-3z"/>',

    // Gembok solid + shackle stroke
    lock:     '<path fill-rule="evenodd" d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2-3v3h6V7a3 3 0 0 0-6 0z"/>',

    // Cloud solid
    cloud:    '<path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97 6 6 0 0 0-11.6 1.6A4 4 0 0 0 7 19h10.5z"/>',

    // Heart solid
    heart:    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>'
};

// ============================================================
// PUBLIC API
// ============================================================
export function getIconContent(id, filled) {
    if (!id) return null;
    if (filled && FEATURE_ICONS_FILLED[id]) return FEATURE_ICONS_FILLED[id];
    return FEATURE_ICONS[id] || null;
}

export function getAvailableIconIds() {
    var out = [];
    for (var k in FEATURE_ICONS) out.push(k);
    return out;
}

export function hasIcon(id) {
    return !!FEATURE_ICONS[id];
}

export function hasFilledIcon(id) {
    return !!FEATURE_ICONS_FILLED[id];
}

// ============================================================
// renderIcon — bungkus konten ikon dalam SVG.
// options.filled = true → pakai versi filled kalau tersedia.
// Kalau tidak tersedia, fallback ke outline (tidak error).
// ============================================================
export function renderIcon(id, size, extraAttrs, options) {
    if (!id) return '';

    const wantFilled = !!(options && options.filled);
    const filled = wantFilled && !!FEATURE_ICONS_FILLED[id];
    const content = filled ? FEATURE_ICONS_FILLED[id] : FEATURE_ICONS[id];

    if (!content) {
        if (typeof console !== 'undefined') {
            console.warn('[renderIcon] Ikon tidak dikenal: "' + id + '"');
        }
        return '';
    }

    const s = size || 16;
    const extra = extraAttrs || '';
    const cls = filled ? 'icon icon-filled' : 'icon';

    if (filled) {
        return '<svg class="' + cls + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" stroke="none" stroke-linecap="round" stroke-linejoin="round" ' + extra + ' aria-hidden="true">' + content + '</svg>';
    }

    return '<svg class="' + cls + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ' + extra + ' aria-hidden="true">' + content + '</svg>';
}
