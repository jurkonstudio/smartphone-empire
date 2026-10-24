// FILE: src/ui/panels/AssemblyPanel.js  (BARU — panel Assembly di sub-tab Manufaktur)
// Pabrik perakitan akhir. Pekerja = KELOMPOK headcount per peran (bukan individu).
// Aksi lewat atribut data-asm-action (ditangani main.js -> AssemblySystem).
import { LanguageService } from '../../core/LanguageService.js';
import { ASSEMBLY_ROLES, ASSEMBLY_LEVELS, ASSEMBLY_OPERATE_YEAR, ASSEMBLY_UNLOCK_YEAR, ASSEMBLY_TRAIN_DAYS, getAssemblyLevel } from '../../data/assembly.data.js';

var TX = {
    id: {
        title: 'Assembly', sub: 'Perakitan akhir ponsel. Komponen dari pabrik masuk lini rakit, hasilnya masuk stok produk. Pekerja dihitung per kelompok peran.',
        cash: 'Kas', st_locked: 'Terkunci', st_ready: 'Siap dibangun', st_building: 'Dibangun', st_upgrading: 'Upgrade', st_wait: 'Menunggu izin operasi {y}', st_run: 'Beroperasi',
        lock: 'Tersedia mulai tahun {y}.', build: 'Bangun', upgrade: 'Upgrade ke', cancel: 'Batalkan', days: 'hari', short: 'Kurang {v}', maxed: 'Level maksimum tercapai',
        contract: 'Sebelum pabrik beroperasi, produksi berjalan lewat kontrak manufaktur pihak ketiga (tanpa penalti). Setelah beroperasi: biaya restock lebih murah dan jeda produksi mengikuti kapasitas.',
        wait: 'Pabrik sudah berdiri. Izin operasi baru keluar tahun {y}.',
        k_cap: 'Kapasitas/bln', k_util: 'Utilisasi', k_crew: 'Pekerja', k_train: 'dilatih', k_defect: 'Cacat', k_morale: 'Moral', k_cost: 'Gaji + perawatan/bln', k_save: 'Hemat restock',
        k_queue: 'Antrean unit', k_total: 'Total dirakit', k_unpaid: 'Tunggakan',
        crew: 'Tenaga kerja', need: 'butuh', wage: 'gaji', hire: 'Rekrut', fire: 'Kurangi', hireNote: 'Biaya rekrut = 1 bulan gaji · pelatihan {n} hari',
        r_operator: 'Operator Perakitan', r_qc: 'Inspektur QC', r_technician: 'Teknisi', r_supervisor: 'Supervisor',
        d_operator: 'Menentukan kapasitas', d_qc: 'Menekan tingkat cacat', d_technician: 'Menjaga mesin tetap jalan', d_supervisor: 'Menjaga moral dan koordinasi',
        ot: 'Lembur', ot_on: 'Lembur aktif: kapasitas +20%, moral turun', ot_off: 'Lembur mati', on: 'Hidupkan', off: 'Matikan',
        flow: 'Alur: Pabrik Komponen → Assembly → Stok Produk',
        lv1: 'Lini Rakit Manual', lv2: 'Lini Semi-Otomatis', lv3: 'Pabrik Otomatis', lv4: 'Smart Factory Robotik', level: 'Level'
    },
    en: {
        title: 'Assembly', sub: 'Final phone assembly. Components from the plants feed the lines and finished phones go to product stock. Workers are counted as role groups.',
        cash: 'Cash', st_locked: 'Locked', st_ready: 'Ready to build', st_building: 'Building', st_upgrading: 'Upgrade', st_wait: 'Awaiting operating permit {y}', st_run: 'Operating',
        lock: 'Available from {y}.', build: 'Build', upgrade: 'Upgrade to', cancel: 'Cancel', days: 'days', short: 'Short by {v}', maxed: 'Max level reached',
        contract: 'Until the plant operates, production runs through third-party contract manufacturing (no penalty). Once operating: cheaper restocks and lead times that follow capacity.',
        wait: 'The plant is built. The operating permit arrives in {y}.',
        k_cap: 'Capacity/mo', k_util: 'Utilization', k_crew: 'Workers', k_train: 'in training', k_defect: 'Defects', k_morale: 'Morale', k_cost: 'Wages + upkeep/mo', k_save: 'Restock savings',
        k_queue: 'Queued units', k_total: 'Total assembled', k_unpaid: 'Unpaid',
        crew: 'Workforce', need: 'needs', wage: 'wage', hire: 'Hire', fire: 'Reduce', hireNote: 'Hiring fee = 1 month wage · {n} days training',
        r_operator: 'Assembly Operators', r_qc: 'QC Inspectors', r_technician: 'Technicians', r_supervisor: 'Supervisors',
        d_operator: 'Sets capacity', d_qc: 'Lowers defect rate', d_technician: 'Keeps machines running', d_supervisor: 'Keeps morale and coordination',
        ot: 'Overtime', ot_on: 'Overtime on: capacity +20%, morale drops', ot_off: 'Overtime off', on: 'Turn on', off: 'Turn off',
        flow: 'Flow: Component Plants → Assembly → Product Stock',
        lv1: 'Manual Assembly Line', lv2: 'Semi-Automatic Line', lv3: 'Automated Factory', lv4: 'Robotic Smart Factory', level: 'Level'
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
function num(n) { return Math.round(n || 0).toLocaleString('en-US'); }
function pct(v) { return Math.round((v || 0) * 100) + '%'; }

export function renderAssemblySection(sys) {
    if (!sys) return '';
    var data = window.__game.state.get(), cash = data.cash || 0, year = (data.time && data.time.currentYear) || 0;
    var s = sys.getSnapshot(), un = sys.isUnlocked();

    var status;
    if (s.upgrade) status = at(s.upgrade.isBuild ? 'st_building' : 'st_upgrading') + ' · ' + Math.round(Math.min(1, s.upgrade.progressDays / s.upgrade.durationDays) * 100) + '%';
    else if (!s.built) status = un.ok ? at('st_ready') : at('st_locked');
    else if (!s.operating) status = at('st_wait', { y: ASSEMBLY_OPERATE_YEAR });
    else status = at('st_run') + ' · ' + at('level') + ' ' + s.level + ' · ' + assemblyLevelName(s.level);

    var html = '<div class="mf-hero asm-hero">' +
        '<div class="mf-hero-title">' + esc(at('title')) + ' <span class="asm-badge">' + esc(status) + '</span></div>' +
        '<div class="mf-hero-sub">' + esc(at('sub')) + '</div>' +
        '<div class="mf-hero-stats"><span>' + esc(at('cash')) + ' <b>' + money(cash) + '</b></span></div></div>';

    // ---- belum berdiri: kartu bangun ----
    if (!s.built && !s.upgrade) {
        var l1 = getAssemblyLevel(1), canBuild = un.ok && cash >= l1.cost;
        html += '<div class="mf-list"><div class="mf-row"><div class="mf-main">' +
            '<div class="mf-name">' + esc(assemblyLevelName(1)) + '</div>' +
            '<div class="mf-desc">' + esc(at('contract')) + '</div>' +
            '<div class="mf-reason">' + esc(un.ok ? (money(l1.cost) + ' · ' + l1.durationDays + ' ' + at('days') + ' · ' + at('k_cap') + ' ' + num(l1.capacityMonthly)) : at('lock', { y: ASSEMBLY_UNLOCK_YEAR })) + '</div>' +
            '</div><div class="mf-buy">' + (un.ok ? '<button class="btn-primary mf-buy-btn" data-asm-action="build"' + (canBuild ? '' : ' disabled') + '>' + esc(at('build')) + ' ' + money(l1.cost) + '</button>' +
                (canBuild ? '' : '<div class="mf-short">' + esc(at('short', { v: money(l1.cost - cash) })) + '</div>') : '') + '</div></div></div>';
        return html;
    }

    // ---- sedang dibangun / upgrade ----
    if (s.upgrade) {
        var dl = Math.max(0, Math.ceil(s.upgrade.durationDays - s.upgrade.progressDays));
        html += '<div class="mf-list"><div class="mf-row"><div class="mf-main"><div class="mf-name">' + esc(assemblyLevelName(s.upgrade.targetLevel)) + '</div>' +
            '<div class="mf-reason">' + dl + ' ' + esc(at('days')) + '</div></div>' +
            '<div class="mf-buy"><button class="btn-secondary mf-buy-btn" data-asm-action="cancel">' + esc(at('cancel')) + '</button></div></div></div>';
    }
    if (!s.built) return html;

    // ---- KPI ----
    var kp = [];
    function K(label, val, warn) { kp.push('<div class="asm-kpi' + (warn ? ' asm-warn' : '') + '"><div class="asm-kv">' + val + '</div><div class="asm-kl">' + esc(label) + '</div></div>'); }
    K(at('k_cap'), num(s.capacity));
    K(at('k_util'), pct(s.utilization), s.utilization > 1);
    K(at('k_crew'), num(s.total) + (s.training ? ' <small>+' + num(s.training) + ' ' + esc(at('k_train')) + '</small>' : ''));
    K(at('k_defect'), pct(s.defectRate), s.defectRate > 0.045);
    K(at('k_morale'), Math.round(s.morale) + '%', s.morale < 50);
    K(at('k_cost'), money(s.wages + s.upkeep));
    K(at('k_save'), pct(1 - s.costFactor));
    K(at('k_queue'), num(s.pending));
    K(at('k_total'), num(s.totalAssembled));
    if (s.unpaid > 0) K(at('k_unpaid'), money(s.unpaid), true);
    html += '<div class="asm-kpis">' + kp.join('') + '</div>';
    if (!s.operating) html += '<div class="mf-reason asm-note">' + esc(at('wait', { y: ASSEMBLY_OPERATE_YEAR })) + '</div>';

    // ---- tenaga kerja ----
    var li = s.levelInfo;
    html += '<div class="mf-hero-title asm-sec">' + esc(at('crew')) + '</div><div class="mf-list">';
    ASSEMBLY_ROLES.forEach(function (r) {
        var need = li.crew[r.id] || 0, have = s.workers[r.id] || 0, tr = sys.getTrainingCount(r.id), room = sys.getHireRoom(r.id);
        var fill = need ? Math.min(100, Math.round(have / need * 100)) : 0;
        var h10 = Math.min(10, room), h50 = Math.min(50, room);
        html += '<div class="mf-row asm-role"><div class="mf-main">' +
            '<div class="mf-name">' + esc(at('r_' + r.id)) + ' <span class="asm-count">' + num(have) + '/' + num(need) + (tr ? ' (+' + num(tr) + ')' : '') + '</span></div>' +
            '<div class="asm-bar"><i style="width:' + fill + '%"></i></div>' +
            '<div class="mf-reason">' + esc(at('d_' + r.id)) + ' · ' + esc(at('wage')) + ' ' + money(sys.getRoleWage(r)) + '</div></div>' +
            '<div class="mf-buy asm-btns">' +
            '<button class="btn-primary mf-buy-btn" data-asm-action="hire" data-asm-role="' + r.id + '" data-asm-n="10"' + (h10 > 0 ? '' : ' disabled') + '>+10</button>' +
            '<button class="btn-primary mf-buy-btn" data-asm-action="hire" data-asm-role="' + r.id + '" data-asm-n="50"' + (h50 > 0 ? '' : ' disabled') + '>+50</button>' +
            '<button class="btn-secondary mf-buy-btn" data-asm-action="fire" data-asm-role="' + r.id + '" data-asm-n="10"' + (have > 0 ? '' : ' disabled') + '>−10</button>' +
            '</div></div>';
    });
    html += '</div><div class="mf-reason asm-note">' + esc(at('hireNote', { n: ASSEMBLY_TRAIN_DAYS })) + '</div>';

    // ---- lembur ----
    html += '<div class="mf-row"><div class="mf-main"><div class="mf-name">' + esc(at('ot')) + '</div><div class="mf-reason">' +
        esc(s.overtime ? at('ot_on') : at('ot_off')) + '</div></div><div class="mf-buy"><button class="btn-secondary mf-buy-btn" data-asm-action="overtime" data-asm-n="' + (s.overtime ? 0 : 1) + '">' +
        esc(s.overtime ? at('off') : at('on')) + '</button></div></div>';

    // ---- upgrade ----
    if (!s.upgrade) {
        var nx = getAssemblyLevel(s.level + 1);
        if (nx) {
            var canUp = cash >= nx.cost;
            html += '<div class="mf-row"><div class="mf-main"><div class="mf-name">' + esc(at('upgrade')) + ' ' + esc(assemblyLevelName(nx.level)) + '</div>' +
                '<div class="mf-reason">' + money(nx.cost) + ' · ' + nx.durationDays + ' ' + esc(at('days')) + ' · ' + esc(at('k_cap')) + ' ' + num(nx.capacityMonthly) + '</div></div>' +
                '<div class="mf-buy"><button class="btn-primary mf-buy-btn" data-asm-action="upgrade"' + (canUp ? '' : ' disabled') + '>' + money(nx.cost) + '</button>' +
                (canUp ? '' : '<div class="mf-short">' + esc(at('short', { v: money(nx.cost - cash) })) + '</div>') + '</div></div>';
        } else html += '<div class="mf-reason asm-note">' + esc(at('maxed')) + '</div>';
    }
    html += '<div class="mf-reason asm-note">' + esc(at('flow')) + '</div>';
    return html;
}
