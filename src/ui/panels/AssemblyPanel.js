// FILE: src/ui/panels/AssemblyPanel.js  (REPLACE — v2: dashboard, peringatan, tenaga kerja, antrean, upgrade)
// Pabrik perakitan akhir. Pekerja = KELOMPOK headcount per peran (bukan individu).
// Aksi lewat atribut data-asm-action (ditangani main.js -> AssemblySystem).
// Navigasi antar bagian lewat data-mf-ui="sec:..." (ManufactureUiState) dan data-nav (main.js).
import { LanguageService } from '../../core/LanguageService.js';
import { ASSEMBLY_ROLES, ASSEMBLY_OPERATE_YEAR, ASSEMBLY_UNLOCK_YEAR, ASSEMBLY_TRAIN_DAYS, ASSEMBLY_OVERTIME_BOOST, getAssemblyLevel } from '../../data/assembly.data.js';
import { isOpen } from './ManufactureUiState.js';
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';

var TX = {
    id: {
        title: 'Assembly', sub: 'Perakitan akhir ponsel: komponen dari pabrik masuk lini rakit, hasilnya jadi stok produk. Pekerja dihitung per kelompok peran.',
        cash: 'Kas', st_locked: 'Terkunci', st_ready: 'Siap dibangun', st_building: 'Dibangun', st_upgrading: 'Upgrade', st_wait: 'Menunggu izin {y}', st_run: 'Beroperasi',
        lock: 'Tersedia mulai tahun {y}.', build: 'Bangun', upgrade: 'Upgrade ke', cancel: 'Batalkan', days: 'hari', short: 'Kurang {v}', maxed: 'Level maksimum tercapai',
        contract: 'Sebelum pabrik beroperasi, produksi berjalan lewat kontrak manufaktur pihak ketiga (tanpa penalti).',
        wait: 'Pabrik sudah berdiri. Izin operasi baru keluar tahun {y}; sampai saat itu produksi tetap lewat kontrak.',
        k_cap: 'Kapasitas/bln', k_util: 'Terpakai (30 hari)', k_crew: 'Pekerja', k_train: 'dilatih', k_defect: 'Tingkat cacat', k_morale: 'Moral', k_cost: 'Gaji + perawatan/bln', k_save: 'Diskon restock',
        k_queue: 'Antrean unit', k_total: 'Total dirakit', k_unpaid: 'Tunggakan', k_saved30: 'Hemat restock 30h', k_net: 'Bersih 30h', k_saved_all: 'Hemat sejak awal',
        g_prod: 'Produksi', g_qual: 'Kualitas', g_fin: 'Keuangan', est: 'perkiraan',
        crew: 'Tenaga kerja', need: 'butuh', wage: 'gaji', hire: 'Rekrut', fire: 'Kurangi', per_head: '/orang', full: 'Isi {n}',
        fill_all: 'Isi semua peran', fill_done: 'Semua peran sudah penuh', fill_cost: 'Biaya rekrut = 1 bulan gaji · pelatihan {n} hari',
        r_operator: 'Operator Perakitan', r_qc: 'Inspektur QC', r_technician: 'Teknisi', r_supervisor: 'Supervisor',
        d_operator: 'Menentukan kapasitas', d_qc: 'Menekan tingkat cacat', d_technician: 'Menjaga mesin tetap jalan', d_supervisor: 'Menjaga moral dan koordinasi',
        ot: 'Lembur', ot_sub_on: 'Aktif: kapasitas +{p}%, moral menurun tiap hari', ot_sub_off: 'Kapasitas +{p}% tetapi moral turun. Pakai saat antrean menumpuk.',
        queue: 'Antrean produksi', queue_none: 'Tidak ada pesanan yang sedang dirakit.', queue_eta: '{d} hari lagi', queue_more: '+{n} pesanan lain', units: 'unit',
        flow: 'Alur produksi', f_comp: 'Pabrik Komponen', f_asm: 'Assembly', f_prod: 'Stok Produk',
        f_comp_v: '{b}/{t} pabrik · stok {s}', f_asm_v: 'Terpakai {u}%', f_prod_v: '{n} pesanan antre', f_open: 'Buka',
        go_plants: 'Pabrik Komponen', go_products: 'Katalog Produk',
        up_title: 'Upgrade', up_now: 'Sekarang', up_next: 'Berikutnya', up_cap: 'Kapasitas/bln', up_disc: 'Diskon restock', up_crew: 'Total pekerja', up_fixed: 'Biaya tetap/bln (staf penuh)',
        up_build: 'Waktu bangun', up_note: 'Selama upgrade, pabrik tetap beroperasi.',
        b_title: 'Bangun pabrik perakitan', b_b1: 'Diskon biaya restock 8% (naik sampai 17%)', b_b2: 'Jeda produksi mengikuti kapasitas, bukan angka tetap', b_b3: 'QC yang baik membuat ponsel lebih awet (klaim servis turun)',
        b_req: 'Syarat', b_cost: 'Biaya', b_time: 'Waktu', b_cap: 'Kapasitas awal',
        help: 'Cara kerja', help_1: 'Diskon restock bergantung pada jumlah operator yang terisi. Kurang staf berarti hemat berkurang.',
        help_2: 'Kapasitas dipengaruhi operator, teknisi, moral, dan lembur. Varian Pro/Pro Max memakan kapasitas lebih besar (beban perakitan).',
        help_3: 'Gaji dan perawatan dipotong harian. Tunggakan lebih dari 14 hari menjatuhkan moral.',
        help_4: 'Hemat 30 hari adalah perkiraan dari tagihan restock dibanding tanpa pabrik.',
        a_unpaid: 'Gaji & perawatan belum terbayar ({v}). Moral terus turun.', a_permit: 'Izin operasi baru keluar tahun {y}. Produksi masih lewat kontrak.',
        a_staff_op: 'Operator baru terisi {p}%. Kapasitas dan diskon restock berkurang.', a_staff_role: '{role} baru terisi {p}%.',
        a_morale: 'Moral rendah ({v}%). Kapasitas ikut turun.', a_ot_morale: 'Lembur aktif saat moral rendah. Pertimbangkan mematikan lembur.',
        a_overload: 'Beban {u}% dari kapasitas: jeda produksi memanjang.', a_defect: 'Tingkat cacat {v}%. Tambah inspektur QC.',
        a_training: '{n} pekerja baru sedang dilatih.', a_roi_neg: 'Biaya tetap lebih besar dari hemat restock 30 hari (selisih {v}). Naikkan volume produksi atau kurangi staf.',
        act_fill: 'Isi tim', act_ot_off: 'Matikan lembur', on: 'Aktif', off: 'Mati',
        lv1: 'Lini Rakit Manual', lv2: 'Lini Semi-Otomatis', lv3: 'Pabrik Otomatis', lv4: 'Smart Factory Robotik', level: 'Level',
        grade_h: 'Kelas produksi', grade_sub: 'Pilih cara setiap batch dirakit. Memengaruhi biaya, kapasitas, dan kualitas ponsel.',
        g_eco: 'Hemat', g_std: 'Standar', g_pre: 'Premium',
        g_eco_d: 'Biaya dan waktu lebih rendah, mutu sedikit di bawah standar.', g_std_d: 'Keseimbangan biaya, waktu, dan mutu.', g_pre_d: 'Mutu lebih baik, tetapi biaya dan waktu lebih besar.',
        grade_cost: 'Biaya', grade_cap: 'Kapasitas', grade_q: 'Kualitas', grade_now: 'Aktif', grade_pick: 'Pilih', grade_locked: 'Butuh otomasi lebih tinggi',
        learn_h: 'Pengalaman lini', learn_sub: 'Makin banyak unit dirakit, makin hemat restock dan makin sedikit cacat.',
        batch_q: 'Bonus kualitas batch', batch_hint: 'dari kelas, QC, dan pengalaman lini'
    },
    en: {
        title: 'Assembly', sub: 'Final phone assembly: plant components feed the lines and finished phones become product stock. Workers are counted as role groups.',
        cash: 'Cash', st_locked: 'Locked', st_ready: 'Ready to build', st_building: 'Building', st_upgrading: 'Upgrade', st_wait: 'Permit in {y}', st_run: 'Operating',
        lock: 'Available from {y}.', build: 'Build', upgrade: 'Upgrade to', cancel: 'Cancel', days: 'days', short: 'Short by {v}', maxed: 'Max level reached',
        contract: 'Until the plant operates, production runs through third-party contract manufacturing (no penalty).',
        wait: 'The plant is built. The operating permit arrives in {y}; until then production keeps using contract manufacturing.',
        k_cap: 'Capacity/mo', k_util: 'Used (30 days)', k_crew: 'Workers', k_train: 'in training', k_defect: 'Defect rate', k_morale: 'Morale', k_cost: 'Wages + upkeep/mo', k_save: 'Restock discount',
        k_queue: 'Queued units', k_total: 'Total assembled', k_unpaid: 'Unpaid', k_saved30: 'Restock savings 30d', k_net: 'Net 30d', k_saved_all: 'Saved to date',
        g_prod: 'Production', g_qual: 'Quality', g_fin: 'Finance', est: 'estimate',
        crew: 'Workforce', need: 'needs', wage: 'wage', hire: 'Hire', fire: 'Reduce', per_head: '/person', full: 'Fill {n}',
        fill_all: 'Fill all roles', fill_done: 'All roles are full', fill_cost: 'Hiring fee = 1 month wage · {n} days training',
        r_operator: 'Assembly Operators', r_qc: 'QC Inspectors', r_technician: 'Technicians', r_supervisor: 'Supervisors',
        d_operator: 'Sets capacity', d_qc: 'Lowers defect rate', d_technician: 'Keeps machines running', d_supervisor: 'Keeps morale and coordination',
        ot: 'Overtime', ot_sub_on: 'On: capacity +{p}%, morale drops daily', ot_sub_off: 'Capacity +{p}% but morale falls. Use it when the queue piles up.',
        queue: 'Production queue', queue_none: 'No orders are being assembled.', queue_eta: '{d} days left', queue_more: '+{n} more orders', units: 'units',
        flow: 'Production flow', f_comp: 'Component Plants', f_asm: 'Assembly', f_prod: 'Product Stock',
        f_comp_v: '{b}/{t} plants · stock {s}', f_asm_v: '{u}% used', f_prod_v: '{n} orders queued', f_open: 'Open',
        go_plants: 'Component Plants', go_products: 'Product Catalog',
        up_title: 'Upgrade', up_now: 'Now', up_next: 'Next', up_cap: 'Capacity/mo', up_disc: 'Restock discount', up_crew: 'Total workers', up_fixed: 'Fixed cost/mo (full crew)',
        up_build: 'Build time', up_note: 'The plant keeps operating during an upgrade.',
        b_title: 'Build the assembly plant', b_b1: '8% off restock costs (rising to 17%)', b_b2: 'Lead time follows capacity instead of a fixed number', b_b3: 'Good QC makes phones last longer (fewer service claims)',
        b_req: 'Requirement', b_cost: 'Cost', b_time: 'Time', b_cap: 'Starting capacity',
        help: 'How it works', help_1: 'The restock discount depends on how many operators are staffed. Understaffing shrinks the savings.',
        help_2: 'Capacity depends on operators, technicians, morale and overtime. Pro/Pro Max variants take more capacity (assembly load).',
        help_3: 'Wages and upkeep are charged daily. Arrears over 14 days crush morale.',
        help_4: '30-day savings is an estimate from restock bills compared with having no plant.',
        a_unpaid: 'Wages & upkeep unpaid ({v}). Morale keeps falling.', a_permit: 'The operating permit arrives in {y}. Production still uses contracts.',
        a_staff_op: 'Operators only {p}% staffed. Capacity and restock discount are reduced.', a_staff_role: '{role} only {p}% staffed.',
        a_morale: 'Morale is low ({v}%). Capacity suffers.', a_ot_morale: 'Overtime is on while morale is low. Consider turning it off.',
        a_overload: 'Load is {u}% of capacity: lead times are growing.', a_defect: 'Defect rate {v}%. Add QC inspectors.',
        a_training: '{n} new workers are in training.', a_roi_neg: 'Fixed costs exceed 30-day restock savings (gap {v}). Raise production volume or trim staff.',
        act_fill: 'Fill crew', act_ot_off: 'Turn off overtime', on: 'On', off: 'Off',
        lv1: 'Manual Assembly Line', lv2: 'Semi-Automatic Line', lv3: 'Automated Factory', lv4: 'Robotic Smart Factory', level: 'Level',
        grade_h: 'Production grade', grade_sub: 'Choose how each batch is assembled. It affects cost, capacity and phone quality.',
        g_eco: 'Economy', g_std: 'Standard', g_pre: 'Premium',
        g_eco_d: 'Lower cost and time, quality slightly below standard.', g_std_d: 'A balance of cost, time and quality.', g_pre_d: 'Better quality, but higher cost and longer time.',
        grade_cost: 'Cost', grade_cap: 'Capacity', grade_q: 'Quality', grade_now: 'Active', grade_pick: 'Select', grade_locked: 'Needs higher automation',
        learn_h: 'Line experience', learn_sub: 'The more units assembled, the cheaper restock gets and the fewer defects.',
        batch_q: 'Batch quality bonus', batch_hint: 'from grade, QC and line experience'
    }
};
function dict() { var l = 'id'; try { l = LanguageService.getLang(); } catch (e) {} return l === 'id' ? TX.id : TX.en; }
export function at(key, vars) {
    var s = dict()[key]; if (s === undefined) s = TX.en[key]; if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return s;
}
export function assemblyLevelName(level) { return at('lv' + level); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function smoney(n) { return (n < 0 ? '−' : '+') + money(Math.abs(n)); }
function num(n) { return Math.round(n || 0).toLocaleString('en-US'); }
function pct(v) { return Math.round((v || 0) * 100) + '%'; }
function tone(ratio) { return ratio >= 0.9 ? 'ok' : (ratio >= 0.6 ? 'warn' : 'bad'); }

// Teks peringatan (id dari AssemblySystem.getAlerts) -> {text, btn}
export function alertText(a) {
    var v = Object.assign({}, a.vars);
    if (a.id === 'staff_role') v.role = at('r_' + v.role);
    return at('a_' + a.id, v);
}
export function alertAction(a) {
    if (a.go === 'fill') return { label: at('act_fill'), attrs: 'data-asm-action="fill"' };
    if (a.go === 'overtime-off') return { label: at('act_ot_off'), attrs: 'data-asm-action="overtime" data-asm-n="0"' };
    return null;
}
export function renderAlerts(alerts) {
    if (!alerts || !alerts.length) return '';
    return '<div class="asm2-alerts">' + alerts.map(function (a) {
        var act = alertAction(a);
        return '<div class="asm2-alert ' + esc(a.level) + '"><span class="asm2-alert-dot"></span><div class="asm2-alert-t">' + esc(alertText(a)) + '</div>' +
            (act ? '<button class="btn-secondary mf-buy-btn asm2-alert-b" ' + act.attrs + '>' + esc(act.label) + '</button>' : '') + '</div>';
    }).join('') + '</div>';
}

var ROLE_ICO = { operator: 'users', qc: 'target', technician: 'bolt', supervisor: 'star' };
var GRADE_ICO = { economy: 'cash', standard: 'check-circle', premium: 'gem-s' };

// Gaya panel (disuntik sekali): memakai variabel tema game, tidak mengubah style.css.
var ASM_STYLE_ID = 'asm2-svg-style';
function ensureAsmStyles() {
    if (typeof document === 'undefined' || document.getElementById(ASM_STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = ASM_STYLE_ID;
    st.textContent =
        '.asm2-grades{display:grid;gap:8px;margin:0 0 8px;}' +
        '.asm2-grade{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px;border-radius:14px;background:var(--mfx-card);border:1px solid var(--border);transition:border-color .15s,box-shadow .15s;}' +
        '.asm2-grade.on{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent);}' +
        '.asm2-grade.lock{opacity:.6;}' +
        '.asm2-grade-ico{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);}' +
        '.asm2-grade.lock .asm2-grade-ico{background:var(--bg-4);color:var(--text-tertiary);}' +
        '.asm2-grade-t{font-weight:700;font-size:13.5px;}' +
        '.asm2-grade-d{font-size:11.5px;color:var(--text-dim);line-height:1.35;margin-top:2px;}' +
        '.asm2-grade-m{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:11px;color:var(--text-dim);}' +
        '.asm2-grade-m b{color:var(--text);font-weight:700;}' +
        '.asm2-grade-m .up{color:var(--mfx-ok);}' +
        '.asm2-grade-m .dn{color:var(--mfx-bad);}' +
        '.asm2-grade-btn{min-width:84px;}' +
        '.asm2-learn{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:var(--mfx-card);margin:0 0 8px;}' +
        '.asm2-ring{flex:0 0 auto;color:var(--text);}' +
        '.asm2-learn-t{font-weight:700;font-size:13.5px;}' +
        '.asm2-learn-s{font-size:11.5px;color:var(--text-dim);line-height:1.35;margin-top:2px;}' +
        '.asm2-learn-q{font-size:12px;margin-top:6px;color:var(--text-dim);}' +
        '.asm2-learn-q b{color:var(--text);}';
    document.head.appendChild(st);
}

// Cincin progres SVG (warna tema, gaya garis sama dengan ikon game).
function asmRing(p, label) {
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - _c01(p));
    return '<svg class="asm2-ring" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">' +
        '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--border-strong, rgba(127,127,127,.25))" stroke-width="6"/>' +
        '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" ' +
        'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 32 32)"/>' +
        '<text x="32" y="36" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">' + esc(label) + '</text></svg>';
}
function _c01(v) { return Math.max(0, Math.min(1, v || 0)); }
function signedPct(f) { var v = Math.round((f - 1) * 100); return v === 0 ? '0%' : (v > 0 ? '+' : '−') + Math.abs(v) + '%'; }

// Pemilih kelas produksi (3 kartu). Kelas terkunci tampil redup dengan alasan.
function gradeSection(s) {
    var grades = s.gradeList || [];
    var html = '<div class="asm2-sec">' + esc(at('grade_h')) + '</div>' +
        '<div class="asm2-note" style="margin:0 0 8px;">' + esc(at('grade_sub')) + '</div><div class="asm2-grades">';
    grades.forEach(function (g) {
        var name = at(g.id === 'economy' ? 'g_eco' : (g.id === 'premium' ? 'g_pre' : 'g_std'));
        var desc = at(g.id === 'economy' ? 'g_eco_d' : (g.id === 'premium' ? 'g_pre_d' : 'g_std_d'));
        var qd = Math.round(g.qualityDelta);
        var qTxt = (qd > 0 ? '+' : (qd < 0 ? '−' : '')) + Math.abs(qd);
        var qCls = qd > 0 ? 'up' : (qd < 0 ? 'dn' : '');
        var btn;
        if (g.selected) btn = '<button class="btn-secondary mf-buy-btn asm2-grade-btn" disabled>' + esc(at('grade_now')) + '</button>';
        else if (!g.unlocked) btn = '<button class="btn-secondary mf-buy-btn asm2-grade-btn" disabled>' + esc(at('grade_locked')) + '</button>';
        else btn = '<button class="btn-primary mf-buy-btn asm2-grade-btn" data-asm-action="grade" data-asm-grade="' + esc(g.id) + '">' + esc(at('grade_pick')) + '</button>';
        html += '<div class="asm2-grade' + (g.selected ? ' on' : '') + (g.unlocked ? '' : ' lock') + '">' +
            '<div class="asm2-grade-ico">' + gIcon(GRADE_ICO[g.id] || 'check-circle', 18) + '</div>' +
            '<div><div class="asm2-grade-t">' + esc(name) + '</div><div class="asm2-grade-d">' + esc(desc) + '</div>' +
            '<div class="asm2-grade-m"><span>' + esc(at('grade_cost')) + ' <b>' + signedPct(g.costMult) + '</b></span>' +
            '<span>' + esc(at('grade_cap')) + ' <b>' + signedPct(g.capMult) + '</b></span>' +
            '<span>' + esc(at('grade_q')) + ' <b class="' + qCls + '">' + qTxt + '</b></span></div></div>' +
            btn + '</div>';
    });
    html += '</div>';
    return html;
}

// Pengalaman lini (cincin SVG) + bonus kualitas batch saat ini.
function learningSection(s) {
    var pctL = Math.round((s.learning || 0) * 100);
    var bq = s.batchQuality || 0;
    return '<div class="asm2-sec">' + esc(at('learn_h')) + '</div>' +
        '<div class="asm2-learn">' + asmRing(s.learning || 0, pctL + '%') +
        '<div style="flex:1 1 auto;min-width:0;"><div class="asm2-learn-t">' + esc(at('learn_h')) + '</div>' +
        '<div class="asm2-learn-s">' + esc(at('learn_sub')) + '</div>' +
        '<div class="asm2-learn-q">' + esc(at('batch_q')) + ' <b>' + (bq > 0 ? '+' : '') + bq + '</b> <span>· ' + esc(at('batch_hint')) + '</span></div></div></div>';
}

function statusOf(s, un) {
    if (s.upgrade) return { tone: 'warn', text: at(s.upgrade.isBuild ? 'st_building' : 'st_upgrading') + ' · ' + Math.round(Math.min(1, s.upgrade.progressDays / s.upgrade.durationDays) * 100) + '%' };
    if (!s.built) return { tone: un.ok ? 'info' : 'mute', text: un.ok ? at('st_ready') : at('st_locked') };
    if (!s.operating) return { tone: 'warn', text: at('st_wait', { y: ASSEMBLY_OPERATE_YEAR }) };
    return { tone: 'ok', text: at('st_run') };
}

export function renderAssemblySection(sys, ctx) {
    if (!sys) return '';
    ctx = ctx || {};
    try { ensureIconStyles(); ensureAsmStyles(); } catch (e) {}
    var data = window.__game.state.get(), cash = data.cash || 0;
    var s = sys.getSnapshot(), un = sys.isUnlocked(), st = statusOf(s, un);

    // ---- hero ----
    var heroSub = s.built ? at('level') + ' ' + s.level + ' · ' + assemblyLevelName(s.level) : at('sub');
    var html = '<div class="asm2-hero">' +
        '<div class="asm2-hero-top"><div class="asm2-hero-ico">' + gIcon('factory', 22) + '</div><div class="asm2-hero-tt"><div class="asm2-hero-name">' + esc(at('title')) + '</div>' +
        '<div class="asm2-hero-sub">' + esc(heroSub) + '</div></div><span class="asm2-chip ' + st.tone + '">' + esc(st.text) + '</span></div>';
    if (s.built && s.operating) {
        var u = s.utilization, uw = Math.min(100, Math.round(u * 100));
        html += '<div class="asm2-gauge ' + (u > 1 ? 'bad' : (u > 0.85 ? 'warn' : 'ok')) + '"><i style="width:' + uw + '%"></i></div>' +
            '<div class="asm2-gauge-l"><span>' + esc(at('k_util')) + ' <b>' + pct(u) + '</b></span><span>' + esc(at('k_cap')) + ' <b>' + num(s.capacity) + '</b></span></div>';
    }
    html += '</div>';

    // ---- belum berdiri: kartu bangun ----
    if (!s.built && !s.upgrade) {
        var l1 = getAssemblyLevel(1), canBuild = un.ok && cash >= l1.cost;
        html += '<div class="asm2-card"><div class="asm2-card-t">' + esc(at('b_title')) + '</div>' +
            '<ul class="asm2-bul"><li>' + esc(at('b_b1')) + '</li><li>' + esc(at('b_b2')) + '</li><li>' + esc(at('b_b3')) + '</li></ul>' +
            '<div class="asm2-facts"><div><span>' + esc(at('b_cost')) + '</span><b>' + money(l1.cost) + '</b></div><div><span>' + esc(at('b_time')) + '</span><b>' + l1.durationDays + ' ' + esc(at('days')) + '</b></div>' +
            '<div><span>' + esc(at('b_cap')) + '</span><b>' + num(l1.capacityMonthly) + '</b></div><div><span>' + esc(at('b_req')) + '</span><b>' + ASSEMBLY_UNLOCK_YEAR + '+</b></div></div>' +
            '<div class="asm2-note">' + esc(at('contract')) + '</div>' +
            (un.ok ? '<button class="btn-primary asm2-wide" data-asm-action="build"' + (canBuild ? '' : ' disabled') + '>' + esc(at('build')) + ' ' + money(l1.cost) + '</button>' +
                (canBuild ? '' : '<div class="mf-short" style="text-align:center;">' + esc(at('short', { v: money(l1.cost - cash) })) + '</div>')
                : '<div class="asm2-note">' + esc(at('lock', { y: ASSEMBLY_UNLOCK_YEAR })) + '</div>') + '</div>';
        return html;
    }

    // ---- sedang dibangun / upgrade ----
    if (s.upgrade) {
        var pr = Math.round(Math.min(1, s.upgrade.progressDays / s.upgrade.durationDays) * 100);
        var dl = Math.max(0, Math.ceil(s.upgrade.durationDays - s.upgrade.progressDays));
        html += '<div class="asm2-card"><div class="asm2-row"><div class="asm2-grow"><div class="asm2-card-t">' + esc(assemblyLevelName(s.upgrade.targetLevel)) + '</div>' +
            '<div class="asm2-gauge ok"><i style="width:' + pr + '%"></i></div><div class="asm2-note">' + pr + '% · ' + dl + ' ' + esc(at('days')) + '</div></div>' +
            '<button class="btn-secondary mf-buy-btn" data-asm-action="cancel">' + esc(at('cancel')) + '</button></div></div>';
    }
    if (!s.built) return html;

    // ---- peringatan ----
    if (!s.operating) html += '<div class="asm2-alerts"><div class="asm2-alert info"><span class="asm2-alert-dot"></span><div class="asm2-alert-t">' + esc(at('wait', { y: ASSEMBLY_OPERATE_YEAR })) + '</div></div></div>';
    html += renderAlerts(sys.getAlerts().filter(function (a) { return a.id !== 'permit'; }));

    // ---- alur produksi (terhubung ke panel lain) ----
    var plantSum = ctx.plantSystem ? ctx.plantSystem.getSummary() : [], built = plantSum.filter(function (p) { return p.built; }).length, stock = 0;
    var inv = (data.componentPlants && data.componentPlants.inventory) || {};
    Object.keys(inv).forEach(function (k) { stock += inv[k] || 0; });
    var orders = sys.getPendingOrders();
    html += '<div class="asm2-flow">' +
        '<button class="asm2-node" data-mf-ui="sec:plants"><span class="asm2-node-t">' + gIcon('bolt', 13) + ' ' + esc(at('f_comp')) + '</span><span class="asm2-node-v">' + esc(at('f_comp_v', { b: built, t: plantSum.length, s: num(stock) })) + '</span></button>' +
        '<span class="asm2-arrow">›</span>' +
        '<div class="asm2-node on"><span class="asm2-node-t">' + gIcon('factory', 13) + ' ' + esc(at('f_asm')) + '</span><span class="asm2-node-v">' + esc(at('f_asm_v', { u: Math.round(s.utilization * 100) })) + '</span></div>' +
        '<span class="asm2-arrow">›</span>' +
        '<button class="asm2-node" data-nav="products" data-nav-sub="catalog"><span class="asm2-node-t">' + gIcon('package', 13) + ' ' + esc(at('f_prod')) + '</span><span class="asm2-node-v">' + esc(at('f_prod_v', { n: orders.length })) + '</span></button></div>';

    // ---- KPI per kelompok ----
    var pj = sys.getProjection();
    function K(label, val, warn, sub) { return '<div class="asm2-kpi' + (warn ? ' warn' : '') + '"><div class="asm2-kv">' + val + '</div><div class="asm2-kl">' + esc(label) + (sub ? ' <em>' + esc(sub) + '</em>' : '') + '</div></div>'; }
    html += '<div class="asm2-groups">' +
        '<div class="asm2-group"><div class="asm2-group-t">' + esc(at('g_prod')) + '</div><div class="asm2-kpis">' +
            K(at('k_cap'), num(s.capacity)) + K(at('k_queue'), num(s.pending)) + K(at('k_total'), num(s.totalAssembled)) +
            K(at('k_crew'), num(s.total) + (s.training ? ' <small>+' + num(s.training) + '</small>' : '')) + '</div></div>' +
        '<div class="asm2-group"><div class="asm2-group-t">' + esc(at('g_qual')) + '</div><div class="asm2-kpis">' +
            K(at('k_defect'), (s.defectRate * 100).toFixed(1) + '%', s.defectRate > 0.045) + K(at('k_morale'), Math.round(s.morale) + '%', s.morale < 50) +
            K(at('k_save'), pct(1 - s.costFactor)) + K(at('batch_q'), (s.batchQuality > 0 ? '+' : '') + s.batchQuality) + '</div></div>' +
        '<div class="asm2-group"><div class="asm2-group-t">' + esc(at('g_fin')) + '</div><div class="asm2-kpis">' +
            K(at('k_cost'), money(s.wages + s.upkeep)) + K(at('k_saved30'), pj.hasData ? money(pj.saved30) : '—', false, at('est')) +
            K(at('k_net'), pj.hasData ? smoney(pj.net30) : '—', pj.hasData && pj.net30 < 0, at('est')) +
            (s.unpaid > 0 ? K(at('k_unpaid'), money(s.unpaid), true) : K(at('k_saved_all'), money(s.savedTotal), false, at('est'))) + '</div></div></div>';

    // ---- kelas produksi & pengalaman lini ----
    html += gradeSection(s) + learningSection(s);

    // ---- antrean produksi ----
    html += '<div class="asm2-sec">' + esc(at('queue')) + (orders.length ? ' <span class="asm2-count">' + orders.length + '</span>' : '') + '</div>';
    if (!orders.length) html += '<div class="asm2-card asm2-empty">' + esc(at('queue_none')) + '</div>';
    else {
        html += '<div class="asm2-card asm2-queue">';
        orders.slice(0, 5).forEach(function (o) {
            html += '<div class="asm2-q"><div class="asm2-q-h"><b>' + esc(o.name) + '</b><span>' + num(o.qty) + ' ' + esc(at('units')) + ' · ' + esc(at('queue_eta', { d: o.daysLeft })) + '</span></div>' +
                '<div class="asm2-gauge ok sm"><i style="width:' + Math.round(o.pct * 100) + '%"></i></div></div>';
        });
        if (orders.length > 5) html += '<div class="asm2-note">' + esc(at('queue_more', { n: orders.length - 5 })) + '</div>';
        html += '</div>';
    }

    // ---- tenaga kerja ----
    var li = s.levelInfo, plan = sys.getFillPlan();
    html += '<div class="asm2-sec asm2-sec-row"><span>' + esc(at('crew')) + '</span>' +
        '<button class="btn-primary mf-buy-btn" data-asm-action="fill"' + (plan.count > 0 ? '' : ' disabled') + '>' +
        esc(plan.count > 0 ? at('fill_all') + ' · ' + money(plan.total) : at('fill_done')) + '</button></div>';
    html += '<div class="asm2-roles">';
    ASSEMBLY_ROLES.forEach(function (r) {
        var need = li.crew[r.id] || 0, have = s.workers[r.id] || 0, tr = sys.getTrainingCount(r.id), room = sys.getHireRoom(r.id);
        var ratio = need ? have / need : 0, fill = Math.min(100, Math.round(ratio * 100));
        var h10 = Math.min(10, room), h50 = Math.min(50, room);
        html += '<div class="asm2-role"><div class="asm2-role-h"><b>' + gIcon(ROLE_ICO[r.id] || 'users', 14) + ' ' + esc(at('r_' + r.id)) + '</b>' +
            '<span class="asm2-role-c ' + tone(ratio) + '">' + num(have) + '/' + num(need) + (tr ? ' <small>(+' + num(tr) + ')</small>' : '') + '</span></div>' +
            '<div class="asm2-gauge ' + tone(ratio) + ' sm"><i style="width:' + fill + '%"></i></div>' +
            '<div class="asm2-role-m">' + esc(at('d_' + r.id)) + ' · ' + esc(at('wage')) + ' ' + money(sys.getRoleWage(r)) + esc(at('per_head')) + '</div>' +
            '<div class="asm2-steps">' +
            '<button class="btn-secondary mf-buy-btn" data-asm-action="fire" data-asm-role="' + r.id + '" data-asm-n="10"' + (have > 0 ? '' : ' disabled') + '>−10</button>' +
            '<button class="btn-primary mf-buy-btn" data-asm-action="hire" data-asm-role="' + r.id + '" data-asm-n="10"' + (h10 > 0 ? '' : ' disabled') + '>+10</button>' +
            '<button class="btn-primary mf-buy-btn" data-asm-action="hire" data-asm-role="' + r.id + '" data-asm-n="50"' + (h50 > 0 ? '' : ' disabled') + '>+50</button>' +
            '<button class="btn-primary mf-buy-btn" data-asm-action="hire" data-asm-role="' + r.id + '" data-asm-n="max"' + (room > 0 ? '' : ' disabled') + '>' + esc(at('full', { n: num(room) })) + '</button>' +
            '</div></div>';
    });
    html += '</div><div class="asm2-note">' + esc(at('fill_cost', { n: ASSEMBLY_TRAIN_DAYS })) + '</div>';

    // ---- lembur ----
    var otp = Math.round((ASSEMBLY_OVERTIME_BOOST - 1) * 100);
    html += '<div class="asm2-card asm2-row"><div class="asm2-grow"><div class="asm2-card-t">' + esc(at('ot')) + '</div><div class="asm2-note" style="margin:2px 0 0;">' +
        esc(s.overtime ? at('ot_sub_on', { p: otp }) : at('ot_sub_off', { p: otp })) + '</div></div>' +
        '<button class="toggle-switch ' + (s.overtime ? 'on' : '') + '" data-asm-action="overtime" data-asm-n="' + (s.overtime ? 0 : 1) + '" aria-pressed="' + !!s.overtime + '" aria-label="' + esc(at('ot')) + '"><span class="toggle-thumb"></span></button></div>';

    // ---- upgrade (perbandingan) ----
    if (!s.upgrade) {
        var pv = sys.getUpgradePreview();
        if (pv) {
            var nx = pv.next, canUp = cash >= nx.cost;
            function R(label, a, b) { return '<div class="asm2-cmp-r"><span>' + esc(label) + '</span><span>' + a + '</span><b>' + b + '</b></div>'; }
            html += '<div class="asm2-sec">' + esc(at('up_title')) + ' · ' + esc(assemblyLevelName(nx.level)) + '</div>' +
                '<div class="asm2-card"><div class="asm2-cmp"><div class="asm2-cmp-h"><span></span><span>' + esc(at('up_now')) + '</span><span>' + esc(at('up_next')) + '</span></div>' +
                R(at('up_cap'), num(pv.capacity[0]), num(pv.capacity[1])) + R(at('up_disc'), pct(pv.discount[0]), pct(pv.discount[1])) +
                R(at('up_crew'), num(pv.crew[0]), num(pv.crew[1])) + R(at('up_fixed'), money(pv.fixed[0]), money(pv.fixed[1])) +
                R(at('up_build'), '—', nx.durationDays + ' ' + esc(at('days'))) + '</div>' +
                '<button class="btn-primary asm2-wide" data-asm-action="upgrade"' + (canUp ? '' : ' disabled') + '>' + esc(at('upgrade')) + ' ' + esc(assemblyLevelName(nx.level)) + ' · ' + money(nx.cost) + '</button>' +
                (canUp ? '' : '<div class="mf-short" style="text-align:center;">' + esc(at('short', { v: money(nx.cost - cash) })) + '</div>') +
                '<div class="asm2-note">' + esc(at('up_note')) + '</div></div>';
        } else html += '<div class="asm2-note">' + esc(at('maxed')) + '</div>';
    }

    // ---- bantuan (bisa dibuka/tutup, tersimpan selama sesi) ----
    var open = isOpen('asm-help', false);
    html += '<button class="asm2-help-b" data-mf-ui="tog:asm-help:0" aria-expanded="' + open + '">' + esc(at('help')) + ' <span>' + (open ? '▾' : '▸') + '</span></button>';
    if (open) html += '<div class="asm2-card asm2-help"><ul class="asm2-bul"><li>' + esc(at('help_1')) + '</li><li>' + esc(at('help_2')) + '</li><li>' + esc(at('help_3')) + '</li><li>' + esc(at('help_4')) + '</li></ul></div>';
    return html;
}
