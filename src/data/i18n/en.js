// FILE: src/data/i18n/en.js
// English dictionary. Flat keys with category prefix.

export const en = {
    // ============================================================
    // NAVIGATION
    // ============================================================
    'nav.home':     'Home',
    'nav.team':     'HQ',
    'nav.research': 'Research',
    'nav.products': 'Products',
    'nav.market':   'Market',
    'nav.settings': 'Settings',

    // ============================================================
    // HEADER
    // ============================================================
    'header.company_aria': 'Company profile',
    'header.pause_aria':   'Pause',
    'header.play_aria':    'Play',
    'header.speed_aria':   'Speed',
    'header.paused':       'Paused',

    // ============================================================
    // SETTINGS
    // ============================================================
    'settings.tab.general':    'General',
    'settings.tab.appearance': 'Appearance',
    'settings.tab.audio':      'Audio',
    'settings.tab.finance':    'Finance',
    'settings.tab.language':   'Language',
    'settings.tab.data':       'Data',

    'settings.section.company':       'Company',
    'settings.section.help':          'Help',
    'settings.section.theme':         'Theme',
    'settings.section.accent':        'Accent Color',
    'settings.section.audio_haptic':  'Sound & Haptics',
    'settings.section.loans_active':  'Active Loans',
    'settings.section.loans_take':    'Take Loan',
    'settings.section.storage':       'Storage',
    'settings.section.danger':        'Danger Zone',
    'settings.section.language':      'Language',

    'settings.row.name':        'Name',
    'settings.row.difficulty':  'Difficulty',
    'settings.row.founded':     'Founded',
    'settings.row.guide':       'Guide',
    'settings.row.guide_hint':  'How to play & tips',
    'settings.row.tutorial':    'Restart Tutorial',
    'settings.row.tutorial_hint': 'Start from the first step',

    'settings.row.sound':       'Sound',
    'settings.row.vibrate':     'Vibration',
    'settings.sound_on':        'Sound effects active',
    'settings.sound_off':       'Sound effects off',
    'settings.vibrate_on':      'Haptic feedback active',
    'settings.vibrate_off':     'Haptic feedback off',

    'settings.row.save':        'Save Now',
    'settings.row.save_hint':   'Save progress right now',
    'settings.row.load':        'Load Save',
    'settings.row.load_hint':   'Return to last save',
    'settings.row.export':      'Export JSON',
    'settings.row.export_hint': 'Copy data as text',
    'settings.row.import':      'Import JSON',
    'settings.row.import_hint': 'Paste backup to load',
    'settings.row.reset':       'Reset Company',
    'settings.row.reset_hint':  'Delete all progress, start fresh',

    'settings.empty.loans':     'No active loans.',
    'settings.hint.accent':     'Primary color for buttons & highlights.',

    'settings.lang.title':      'App Language',
    'settings.lang.hint':       'Change the interface language. Technical component names (mAh, GHz, MP) stay universal.',
    'settings.lang.indonesian': 'Bahasa Indonesia',
    'settings.lang.english':    'English',
    'settings.lang.active':     'Active',

    'settings.edit_name.title':    'Change Company Name',
    'settings.edit_name.sub':      'This name appears in the header and monthly reports.',
    'settings.edit_name.label':    'Company Name',
    'settings.edit_name.placeholder': 'E.g. Nova Tech',
    'settings.edit_name.save':     'Save',
    'settings.edit_name.error_empty': 'Name cannot be empty.',
    'settings.edit_name.error_long':  'Maximum 32 characters.',
    'settings.edit_name.success':  'Name updated.',

    'settings.difficulty.santai': 'Relaxed',
    'settings.difficulty.normal': 'Normal',
    'settings.difficulty.sulit':  'Hard',

    'common.cancel':  'Cancel',
    'common.save':    'Save',
    'common.tutup':   'Close',
    'common.reset':   'Reset',
    'common.load':    'Load',
    'common.import':  'Import',
    'common.export':  'Export',

    'toast.theme_changed':   'Theme: {value}',
    'toast.accent_changed':  'Accent color updated.',
    'toast.lang_changed':    'Language: {value}',
    'toast.save_ok':         'Save stored.',
    'toast.save_fail':       'Save failed.',
    'toast.no_save':         'No save found.',
    'toast.reset_confirm':   'All progress will be lost.',

    // ============================================================
    // HQ — Sub-tabs & Home placeholder
    // ============================================================
    'hq.tab.overview': 'Overview',
    'hq.tab.campus':   'Campus',
    'hq.tab.team':     'Team',
    'home.placeholder.title': 'Campus Map',
    'home.placeholder.body':  'The 3D headquarters map will appear here. For now, open the HQ tab to manage your company.',
    'campus.placeholder.title': 'Campus 3D Map',
    'campus.placeholder.body':  'The 3D headquarters map and building upgrade system will be available in a future update.',

    // ============================================================
    // TEAM — dropdown, roster, recruit, info
    // ============================================================
    'team.mode.roster':  'Roster',
    'team.mode.recruit': 'Recruit',
    'team.mode.info':    'Info',

    'team.kpi.salary':   'Salary/Mo',

    'team.roster.empty_title': 'No staff yet',
    'team.roster.empty_desc':  'Open the Recruit menu above to find candidates.',
    'team.roster.unnamed':     'Unnamed',
    'team.roster.morale':      'Morale',
    'team.roster.corrupt':     'Corrupt staff data',
    'team.roster.error':       'Error',

    'team.recruit.candidates_avail': 'candidates available',
    'team.recruit.refresh_in':       'refresh in {n} days',
    'team.recruit.filter_all':       'All',
    'team.recruit.empty_title':      'No candidates',
    'team.recruit.empty_hint_filter':'Try another role filter.',
    'team.recruit.empty_hint_wait':  'Wait a few days or refresh the pool.',
    'team.recruit.refresh_btn':      'Refresh Pool Now',
    'team.recruit.per_month':        '/mo',
    'team.recruit.total':            'Total',
    'team.recruit.pool_refreshed':   'Pool refreshed.',

    'team.modal.traits':        'Traits',
    'team.modal.traits_empty':  'No special traits.',
    'team.modal.detail':        'Details',
    'team.modal.detail_specialty': 'Specialty',
    'team.modal.detail_exp':    'Experience',
    'team.modal.detail_age':    'Age',
    'team.modal.detail_bg':     'Background',
    'team.modal.detail_limit':  'Limited profile — this candidate lacks complete data. Full profiles appear after the pool refreshes.',
    'team.modal.years':         'years',
    'team.modal.cost':          'Cost',
    'team.modal.cost_salary':   'Monthly salary',
    'team.modal.cost_signing':  'Signing bonus',
    'team.modal.cost_total':    'First month total',
    'team.modal.btn_cancel':    'Cancel',
    'team.modal.btn_hire':      'Recruit',
    'team.modal.aria_hire':     'Recruit',

    'team.info.system_not_ready': 'TeamSystem not ready',
    'team.info.eng_section':      'Engineer Bonus',
    'team.info.eng_count':        'Engineer count',
    'team.info.research_speed':   'Research Speed',
    'team.info.extra_res_slots':  'Extra Research Slots',
    'team.info.os_speed':         'OS Dev Speed',
    'team.info.extra_os_slots':   'Extra OS Feature Slots',

    'team.info.des_section':      'Designer Bonus',
    'team.info.des_count':        'Designer count',
    'team.info.product_speed':    'Product Design Speed',
    'team.info.quality_bonus':    'Product Quality Bonus',

    'team.info.mkt_section':      'Marketer Bonus',
    'team.info.mkt_count':        'Marketer count',
    'team.info.campaign_bonus':   'Campaign Effectiveness',

    'team.info.summary_section':  'Team Summary',
    'team.info.total_staff':      'Total Staff',
    'team.info.total_salary':     'Total Salary / Month',
    'team.info.avg_morale':       'Average Morale',
    'team.info.points_unit':      'pts',

    'team.tips.title': 'TIPS',
    'team.tips.l1':    'Higher tier staff give bigger bonuses but cost more.',
    'team.tips.l2':    'Fast Learner trait speeds up tier progression.',
    'team.tips.l3':    'Specialist trait gives +25% bonus in its field.',
    'team.tips.l4':    'Low morale reduces productivity.',
};
