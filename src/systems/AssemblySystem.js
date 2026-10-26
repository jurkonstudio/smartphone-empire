// FILE: src/systems/AssemblySystem.js  (REPLACE — v2: kelas produksi, kurva belajar, bonus kualitas batch)
// ============================================================
// State: data.assembly
//   { built, level, upgrade, workers{role:n}, training[], overtime, morale, unpaid,
//     recent[], totalAssembled, defectUnits, wagesPaid, orders, savedTotal, grade }
// Terhubung ke:
//   - ProductSystem   : biaya restock (getCostFactor), jeda produksi (getLeadDays),
//                       kelas batch (recordOrder), bonus kualitas (return recordOrder).
//                       Bobot tier (Pro/Pro Max) ikut memakan kapasitas perakitan.
//   - WalletService   : bangun/upgrade, gaji dan perawatan harian.
//   - Peta 3D & panel : getSnapshot().
// Kompatibel mundur: recordOrder(qty, effort, paid) tanpa kelas memakai 'standard'.
// Sebelum pabrik beroperasi (belum dibangun / belum 2002) produksi tetap berjalan
// seperti biasa lewat kontrak manufaktur, tanpa penalti.
// ============================================================
import { bus } from '../core/EventBus.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { WalletService } from './WalletService.js';
import {
    ASSEMBLY_UNLOCK_YEAR, ASSEMBLY_OPERATE_YEAR, ASSEMBLY_TRAIN_DAYS, ASSEMBLY_REFUND_UPGRADE,
    ASSEMBLY_OVERTIME_BOOST, ASSEMBLY_RECENT_DAYS, ASSEMBLY_MAX_LEAD_DAYS,
    ASSEMBLY_LEARNING_UNITS, ASSEMBLY_LEARNING_COST_MAX, ASSEMBLY_LEARNING_DEFECT_MAX, ASSEMBLY_DEFECT_FLOOR,
    ASSEMBLY_ROLES, ASSEMBLY_LEVELS, ASSEMBLY_GRADES, ASSEMBLY_DEFAULT_GRADE,
    getAssemblyLevel, getAssemblyGrade, getAssemblyWageMonthly,
    getAssemblyWageIndex, getAssemblyRoleWage
} from '../data/assembly.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const DAYS_PER_MONTH = 30;

function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export function emptyAssembly() {
    return {
        built: false, level: 0, upgrade: null,
        workers: { operator: 0, qc: 0, technician: 0, supervisor: 0 },
        training: [], overtime: false, morale: 75, unpaid: 0,
        recent: [], totalAssembled: 0, defectUnits: 0, wagesPaid: 0, orders: 0, savedTotal: 0,
        grade: ASSEMBLY_DEFAULT_GRADE
    };
}

export class AssemblySystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed', () => this._tickDaily()));
        this._unsubs.push(bus.on('state:hydrated', () => this._onHydrated()));
        this._onHydrated();
        console.info('[AssemblySystem] siap.');
    }
    stop() { this._unsubs.forEach(u => u()); this._unsubs = []; }

    _onHydrated() { this._raw(); }

    _raw() {
        const data = this.state.data;
        const base = emptyAssembly();
        if (!data.assembly || typeof data.assembly !== 'object') data.assembly = base;
        const a = data.assembly;
        Object.keys(base).forEach(k => { if (a[k] === undefined) a[k] = base[k]; });
        if (!a.workers || typeof a.workers !== 'object') a.workers = base.workers;
        ASSEMBLY_ROLES.forEach(r => { if (typeof a.workers[r.id] !== 'number') a.workers[r.id] = 0; });
        if (!Array.isArray(a.training)) a.training = [];
        if (!Array.isArray(a.recent)) a.recent = [];
        if (typeof a.grade !== 'string' || !getAssemblyGrade(a.grade) || getAssemblyGrade(a.grade).id !== a.grade) {
            a.grade = ASSEMBLY_DEFAULT_GRADE;
        }
        return a;
    }

    _year() { const t = this.state.data.time; return (t && t.currentYear) || 0; }
    _now() { return this.state.data.time.elapsedGameMinutes || 0; }

    // ------------------------------------------------------------
    // STATUS
    // ------------------------------------------------------------
    isUnlocked() {
        if (this._year() < ASSEMBLY_UNLOCK_YEAR) return { ok: false, reason: 'Tersedia mulai tahun ' + ASSEMBLY_UNLOCK_YEAR + '.' };
        return { ok: true };
    }
    isBuilt() { const a = this._raw(); return !!(a.built && a.level > 0); }
    isOperating() { return this.isBuilt() && this._year() >= ASSEMBLY_OPERATE_YEAR; }
    getLevelInfo() { return getAssemblyLevel(this._raw().level); }

    getTrainingCount(role) {
        return this._raw().training.reduce((n, t) => (!role || t.role === role) ? n + t.n : n, 0);
    }
    getWorkerTotal() {
        const w = this._raw().workers;
        return ASSEMBLY_ROLES.reduce((n, r) => n + (w[r.id] || 0), 0);
    }
    // Rasio staf terhadap kebutuhan level sekarang (0..1) per peran.
    getStaffing() {
        const a = this._raw(), li = getAssemblyLevel(a.level), out = {};
        ASSEMBLY_ROLES.forEach(r => {
            const need = li ? (li.crew[r.id] || 0) : 0;
            out[r.id] = need > 0 ? _clamp((a.workers[r.id] || 0) / need, 0, 1) : 0;
        });
        return out;
    }
    getMoraleFactor() { return 0.85 + 0.15 * (_clamp(this._raw().morale, 0, 100) / 100); }

    // ------------------------------------------------------------
    // KELAS PRODUKSI & KURVA BELAJAR (v2)
    // ------------------------------------------------------------
    getGrade() { return getAssemblyGrade(this._raw().grade); }
    // Kelas tersedia bila level otomasi lini sekarang cukup.
    isGradeUnlocked(id) {
        const g = getAssemblyGrade(id), li = this.getLevelInfo();
        if (!li) return g.minAutomation <= 0;
        return li.automation >= g.minAutomation;
    }
    getGradeList() {
        return ASSEMBLY_GRADES.map(g => ({
            id: g.id, name: g.name, costMult: g.costMult, capMult: g.capMult, qualityDelta: g.qualityDelta,
            unlocked: this.isGradeUnlocked(g.id), selected: g.id === this._raw().grade
        }));
    }
    setGrade(id) {
        const data = this.state.data, a = this._raw();
        const g = ASSEMBLY_GRADES.find(x => x.id === id);
        if (!g) return { ok: false, reason: 'Kelas produksi tidak dikenal.' };
        if (!this.isGradeUnlocked(id)) return { ok: false, reason: 'Kelas ' + g.name + ' butuh lini otomasi lebih tinggi.' };
        if (a.grade === id) return { ok: true, grade: id, changed: false };
        a.grade = id;
        this.state.addLog('Kelas produksi pabrik diubah ke ' + g.name + '.', LOG_TYPES.info);
        bus.emit('assembly:grade-changed', { grade: id });
        bus.emit('state:changed', data);
        return { ok: true, grade: id, changed: true };
    }
    // Pengalaman lini 0..1 dari total unit yang sudah dirakit.
    getLearning() {
        return _clamp(this._raw().totalAssembled / ASSEMBLY_LEARNING_UNITS, 0, 1);
    }
    // Tingkat cacat: staf QC menurunkan, kurva belajar menurunkan, dengan lantai minimum.
    getDefectRate() {
        const s = this.getStaffing();
        const base = 0.06 - 0.04 * s.qc;                     // 2%..6%
        const learned = ASSEMBLY_LEARNING_DEFECT_MAX * this.getLearning();
        return Math.max(ASSEMBLY_DEFECT_FLOOR, base - learned);
    }
    // Bonus kualitas (poin 0..100) yang dibawa setiap batch. Dipakai ProductSystem nanti.
    //   kelas + staf QC + pengalaman lini - cacat (dibulatkan).
    getBatchQuality(gradeId) {
        const g = getAssemblyGrade(gradeId || this._raw().grade);
        const s = this.getStaffing();
        const raw = g.qualityDelta + s.qc * 3 + this.getLearning() * 6 - this.getDefectRate() * 50;
        return Math.round(_clamp(raw, -6, 10));
    }
    getCapacityMonthly() {
        const a = this._raw(), li = getAssemblyLevel(a.level);
        if (!li || !this.isOperating()) return 0;
        const s = this.getStaffing();
        const g = this.getGrade();
        let cap = li.capacityMonthly * g.capMult * s.operator * (0.7 + 0.3 * s.technician) * this.getMoraleFactor();
        if (a.overtime) cap *= ASSEMBLY_OVERTIME_BOOST;
        return Math.round(cap);
    }
    getUtilization() {
        const cap = this.getCapacityMonthly();
        if (cap <= 0) return 0;
        const cut = this._now() - ASSEMBLY_RECENT_DAYS * MINUTES_PER_DAY;
        const used = this._raw().recent.reduce((n, r) => r.minute >= cut ? n + r.qty : n, 0);
        return used / cap;
    }
    getWageIndex() { return getAssemblyWageIndex(this._year()); }
    getRoleWage(role) { return getAssemblyRoleWage(role, this._year()); }
    getMonthlyWages() { return Math.round(getAssemblyWageMonthly(this._raw().workers) * this.getWageIndex()); }
    getMonthlyUpkeep() { const li = this.getLevelInfo(); return li ? Math.round(li.maintenanceMonthly * this.getWageIndex()) : 0; }

    // ------------------------------------------------------------
    // HUBUNGAN KE PRODUKSI PRODUK
    // ------------------------------------------------------------
    // Pengali biaya pesanan restock (1 = tanpa pabrik). Sudah memperhitungkan kurva belajar.
    getCostFactor() {
        if (!this.isOperating()) return 1;
        const li = this.getLevelInfo();
        if (!li) return 1;
        const staffed = this.getStaffing().operator;
        const discount = li.discount * (0.4 + 0.6 * staffed);      // kurang staf, hemat berkurang
        const learnedCut = 1 - ASSEMBLY_LEARNING_COST_MAX * this.getLearning();
        return (1 - discount) * learnedCut * (1 + this.getDefectRate() * 0.5);
    }
    // Pengali biaya khusus kelas batch (dipakai bila kelas dipilih).
    getGradeCostFactor(gradeId) {
        return getAssemblyGrade(gradeId || this._raw().grade).costMult;
    }
    // Jeda hari untuk pesanan qty, termasuk antrean unit yang sedang diproses.
    getLeadDays(qty, pendingUnits) {
        const cap = this.getCapacityMonthly();
        if (cap <= 0) return null;
        const perDay = cap / DAYS_PER_MONTH;
        return _clamp(Math.ceil(((qty || 0) + (pendingUnits || 0)) / perDay), 1, ASSEMBLY_MAX_LEAD_DAYS);
    }
    // Unit tertunda, dihitung setara Basic (varian Pro/Pro Max bobotnya lebih besar).
    getPendingUnits() {
        const cat = (this.state.data.products && this.state.data.products.catalog) || [];
        let n = 0;
        cat.forEach(p => (p.pendingProduction || []).forEach(o => { n += (o.qty || 0) * (o.effort > 0 ? o.effort : 1); }));
        return n;
    }
    // effort: bobot perakitan tier (1 = Basic). Memakan kapasitas sebesar qty x effort.
    // paid (opsional): total tagihan pesanan. Dipakai memperkirakan hemat restock vs tanpa pabrik.
    // gradeId (opsional): kelas batch; default = kelas aktif pabrik.
    // Mengembalikan { ok, grade, qualityBonus } agar ProductSystem bisa menerapkan bonus kualitas.
    recordOrder(qty, effort, paid, gradeId) {
        if (!this.isOperating() || !(qty > 0)) return { ok: false, grade: null, qualityBonus: 0 };
        const a = this._raw();
        const gid = (gradeId && this.isGradeUnlocked(gradeId)) ? gradeId : a.grade;
        const g = getAssemblyGrade(gid);
        const w = effort > 0 ? effort : 1;
        const f = this.getCostFactor() * g.costMult;
        const saved = (paid > 0 && f > 0) ? Math.round(paid / f - paid) : 0;
        const qualityBonus = this.getBatchQuality(gid);
        a.recent.push({ minute: this._now(), qty: qty * w, paid: paid > 0 ? Math.round(paid) : 0, saved: saved, grade: gid, q: qualityBonus });
        a.totalAssembled += qty;
        a.defectUnits += Math.round(qty * this.getDefectRate());
        a.savedTotal = (a.savedTotal || 0) + saved;
        a.orders += 1;
        return { ok: true, grade: gid, qualityBonus: qualityBonus };
    }

    // ------------------------------------------------------------
    // PANTAUAN (dipakai panel Assembly & ringkasan Manufaktur)
    // ------------------------------------------------------------
    // Pesanan produksi produk yang sedang antre di pabrik perakitan.
    getPendingOrders() {
        const cat = (this.state.data.products && this.state.data.products.catalog) || [];
        const now = this._now(), out = [];
        cat.forEach(p => (p.pendingProduction || []).forEach(o => {
            const total = Math.max(1, (o.readyAtMinute || 0) - (o.orderedAtMinute || 0));
            const pct = _clamp((now - (o.orderedAtMinute || now)) / total, 0, 1);
            out.push({
                productId: p.id, name: p.name || (p.config && p.config.name) || '—',
                qty: o.qty || 0, effort: o.effort > 0 ? o.effort : 1,
                daysLeft: Math.max(0, Math.ceil(((o.readyAtMinute || now) - now) / MINUTES_PER_DAY)), pct: pct
            });
        }));
        return out.sort((x, y) => x.daysLeft - y.daysLeft);
    }
    // Hemat restock 30 hari terakhir (perkiraan) dan biaya tetap bulanan -> selisih bersih.
    getProjection() {
        const a = this._raw(), cut = this._now() - ASSEMBLY_RECENT_DAYS * MINUTES_PER_DAY;
        let saved = 0, paid = 0, units = 0;
        a.recent.forEach(r => { if (r.minute >= cut) { saved += r.saved || 0; paid += r.paid || 0; units += r.qty || 0; } });
        const fixed = this.getMonthlyWages() + this.getMonthlyUpkeep();
        return { saved30: saved, paid30: paid, units30: units, fixed: fixed, net30: saved - fixed, hasData: a.recent.length > 0 };
    }
    // Biaya gaji bulanan jika semua peran terisi penuh pada level tertentu.
    getFullWages(level) {
        const li = getAssemblyLevel(level);
        if (!li) return 0;
        return Math.round(ASSEMBLY_ROLES.reduce((n, r) => n + (li.crew[r.id] || 0) * r.wage, 0) * this.getWageIndex());
    }
    // Perbandingan level sekarang vs berikutnya (untuk kartu upgrade).
    getUpgradePreview() {
        const a = this._raw(), cur = getAssemblyLevel(a.level), nx = getAssemblyLevel(a.level + 1);
        if (!cur || !nx) return null;
        const idx = this.getWageIndex();
        return {
            cur: cur, next: nx,
            capacity: [cur.capacityMonthly, nx.capacityMonthly],
            discount: [cur.discount, nx.discount],
            crew: [ASSEMBLY_ROLES.reduce((n, r) => n + (cur.crew[r.id] || 0), 0), ASSEMBLY_ROLES.reduce((n, r) => n + (nx.crew[r.id] || 0), 0)],
            fixed: [this.getFullWages(cur.level) + Math.round(cur.maintenanceMonthly * idx), this.getFullWages(nx.level) + Math.round(nx.maintenanceMonthly * idx)]
        };
    }
    // Rencana mengisi semua peran sampai kebutuhan level (biaya = 1 bulan gaji per orang).
    getFillPlan() {
        const out = { roles: {}, total: 0, count: 0 };
        if (!this.isBuilt()) return out;
        ASSEMBLY_ROLES.forEach(r => {
            const n = this.getHireRoom(r.id), cost = n * this.getRoleWage(r);
            out.roles[r.id] = { n: n, cost: cost };
            out.total += cost; out.count += n;
        });
        return out;
    }
    // Peringatan terurut (danger > warn > info). id dipetakan ke teks oleh panel.
    getAlerts() {
        const a = this._raw(), out = [];
        if (!this.isBuilt()) return out;
        const L = { danger: 0, warn: 1, info: 2 };
        const add = (id, level, vars, go) => out.push({ id: id, level: level, vars: vars || {}, go: go || null });
        if (a.unpaid > 0) add('unpaid', 'danger', { v: _money(a.unpaid) });
        if (!this.isOperating()) {
            add('permit', 'info', { y: ASSEMBLY_OPERATE_YEAR });
        } else {
            const s = this.getStaffing();
            if (s.operator < 0.5) add('staff_op', 'danger', { p: Math.round(s.operator * 100) }, 'fill');
            else if (s.operator < 0.9) add('staff_op', 'warn', { p: Math.round(s.operator * 100) }, 'fill');
            ASSEMBLY_ROLES.forEach(r => {
                if (r.id !== 'operator' && this.getHireCap(r.id) > 0 && s[r.id] < 0.6) add('staff_role', 'warn', { role: r.id, p: Math.round(s[r.id] * 100) }, 'fill');
            });
            if (a.morale < 40) add('morale', 'danger', { v: Math.round(a.morale) });
            else if (a.morale < 55) add('morale', 'warn', { v: Math.round(a.morale) });
            if (a.overtime && a.morale < 60) add('ot_morale', 'warn', {}, 'overtime-off');
            if (this.getUtilization() > 1) add('overload', 'warn', { u: Math.round(this.getUtilization() * 100) });
            if (this.getDefectRate() > 0.045) add('defect', 'warn', { v: Math.round(this.getDefectRate() * 1000) / 10 });
            if (this.getTrainingCount() > 0) add('training', 'info', { n: this.getTrainingCount() });
            const pr = this.getProjection();
            if (pr.hasData && pr.net30 < 0) add('roi_neg', 'info', { v: _money(-pr.net30) });
        }
        return out.sort((x, y) => L[x.level] - L[y.level]);
    }

    // ------------------------------------------------------------
    // BANGUN / UPGRADE
    // ------------------------------------------------------------
    build() {
        const data = this.state.data, a = this._raw();
        if (a.built) return { ok: false, reason: 'Pabrik perakitan sudah dibangun.' };
        if (a.upgrade) return { ok: false, reason: 'Pabrik perakitan sedang dibangun.' };
        const un = this.isUnlocked();
        if (!un.ok) return un;
        const info = getAssemblyLevel(1);
        if (!WalletService.canAfford(info.cost)) return { ok: false, reason: 'Uang tidak cukup. Butuh ' + _money(info.cost) + '.' };
        WalletService.pay(info.cost, 'assembly-build');
        a.upgrade = { targetLevel: 1, isBuild: true, progressDays: 0, durationDays: info.durationDays, cost: info.cost,
            startedAtMinute: this._now(), lastProcessedMinute: this._now() };
        this.state.addLog('Mulai bangun Pabrik Perakitan (' + info.name + ', ' + _money(info.cost) + ', ' + info.durationDays + ' hari).', LOG_TYPES.info);
        ToastService.success('Pembangunan Pabrik Perakitan dimulai!');
        bus.emit('assembly:build-started', { level: 1 });
        bus.emit('state:changed', data);
        return { ok: true, level: 1 };
    }

    upgrade() {
        const data = this.state.data, a = this._raw();
        if (!a.built) return { ok: false, reason: 'Bangun pabrik perakitan dulu.' };
        if (a.upgrade) return { ok: false, reason: 'Sedang ada pembangunan.' };
        const next = getAssemblyLevel(a.level + 1);
        if (!next) return { ok: false, reason: 'Sudah level maksimum.' };
        if (!WalletService.canAfford(next.cost)) return { ok: false, reason: 'Uang tidak cukup. Butuh ' + _money(next.cost) + '.' };
        WalletService.pay(next.cost, 'assembly-upgrade');
        a.upgrade = { targetLevel: next.level, isBuild: false, progressDays: 0, durationDays: next.durationDays, cost: next.cost,
            startedAtMinute: this._now(), lastProcessedMinute: this._now() };
        this.state.addLog('Mulai upgrade Pabrik Perakitan ke ' + next.name + ' (' + _money(next.cost) + ').', LOG_TYPES.info);
        ToastService.success('Upgrade Pabrik Perakitan dimulai!');
        bus.emit('assembly:upgrade-started', { level: next.level });
        bus.emit('state:changed', data);
        return { ok: true, level: next.level };
    }

    cancelUpgrade() {
        const data = this.state.data, a = this._raw();
        if (!a.upgrade) return { ok: false, reason: 'Tidak ada pembangunan.' };
        const refund = Math.floor((a.upgrade.cost || 0) * ASSEMBLY_REFUND_UPGRADE);
        this.state.setCash(data.cash + refund);
        a.upgrade = null;
        this.state.addLog('Pembangunan Pabrik Perakitan dibatalkan. Refund ' + _money(refund) + '.', LOG_TYPES.warning);
        bus.emit('state:changed', data);
        return { ok: true, refund: refund };
    }

    // ------------------------------------------------------------
    // TENAGA KERJA
    // ------------------------------------------------------------
    getHireCap(role) {
        const li = this.getLevelInfo();
        return li ? (li.crew[role] || 0) : 0;
    }
    getHireRoom(role) {
        const a = this._raw();
        return Math.max(0, this.getHireCap(role) - (a.workers[role] || 0) - this.getTrainingCount(role));
    }
    hire(role, n) {
        const data = this.state.data, a = this._raw();
        const r = ASSEMBLY_ROLES.find(x => x.id === role);
        if (!r) return { ok: false, reason: 'Peran tidak dikenal.' };
        if (!this.isBuilt()) return { ok: false, reason: 'Pabrik perakitan belum berdiri.' };
        const room = this.getHireRoom(role);
        const want = (n === 'max' || n === Infinity) ? room : Math.floor(n || 0);
        const cnt = Math.min(Math.max(0, want), room);
        if (cnt <= 0) return { ok: false, reason: 'Kuota perekrutan peran ini sudah penuh.' };
        const fee = cnt * this.getRoleWage(r);                        // biaya rekrut = 1 bulan gaji
        if (!WalletService.canAfford(fee)) return { ok: false, reason: 'Uang tidak cukup. Butuh ' + _money(fee) + '.' };
        WalletService.pay(fee, 'assembly-hire');
        a.training.push({ role: role, n: cnt, readyAtMinute: this._now() + ASSEMBLY_TRAIN_DAYS * MINUTES_PER_DAY });
        this.state.addLog('Merekrut ' + cnt + ' ' + role + ' untuk Pabrik Perakitan (pelatihan ' + ASSEMBLY_TRAIN_DAYS + ' hari).', LOG_TYPES.info);
        bus.emit('assembly:hired', { role: role, n: cnt });
        bus.emit('state:changed', data);
        return { ok: true, n: cnt, fee: fee };
    }
    // Isi semua peran sesuai kebutuhan; prioritas operator > teknisi > QC > supervisor, dibatasi kas.
    hireFill() {
        if (!this.isBuilt()) return { ok: false, reason: 'Pabrik perakitan belum berdiri.' };
        const order = ['operator', 'technician', 'qc', 'supervisor'], done = {};
        let fee = 0, total = 0;
        order.forEach(id => {
            const r = ASSEMBLY_ROLES.find(x => x.id === id), wage = this.getRoleWage(r);
            const room = this.getHireRoom(id);
            if (room <= 0 || wage <= 0) return;
            const n = Math.min(room, Math.floor((this.state.data.cash || 0) / wage));
            if (n <= 0) return;
            const res = this.hire(id, n);
            if (res.ok) { done[id] = res.n; fee += res.fee; total += res.n; }
        });
        if (total <= 0) {
            const plan = this.getFillPlan();
            return { ok: false, reason: plan.count > 0 ? 'Uang tidak cukup. Butuh ' + _money(plan.total) + '.' : 'Semua peran sudah terisi penuh.' };
        }
        return { ok: true, n: total, fee: fee, hired: done };
    }
    fire(role, n) {
        const data = this.state.data, a = this._raw();
        if (!ASSEMBLY_ROLES.find(x => x.id === role)) return { ok: false, reason: 'Peran tidak dikenal.' };
        const cnt = Math.min(Math.max(0, Math.floor(n || 0)), a.workers[role] || 0);
        if (cnt <= 0) return { ok: false, reason: 'Tidak ada pekerja untuk dikurangi.' };
        a.workers[role] -= cnt;
        a.morale = _clamp(a.morale - Math.min(10, cnt / 10), 0, 100);
        this.state.addLog('Mengurangi ' + cnt + ' ' + role + ' di Pabrik Perakitan.', LOG_TYPES.warning);
        bus.emit('state:changed', data);
        return { ok: true, n: cnt };
    }
    setOvertime(on) {
        const a = this._raw();
        a.overtime = !!on;
        bus.emit('state:changed', this.state.data);
        return { ok: true, overtime: a.overtime };
    }

    // ------------------------------------------------------------
    // TICK HARIAN
    // ------------------------------------------------------------
    _tickDaily() {
        const data = this.state.data, a = this._raw();
        let changed = false;
        if (a.upgrade) { this._tickBuild(); changed = true; }
        // pelatihan selesai
        if (a.training.length) {
            const now = this._now(), still = [];
            a.training.forEach(t => {
                if (t.readyAtMinute <= now) { a.workers[t.role] = (a.workers[t.role] || 0) + t.n; changed = true; }
                else still.push(t);
            });
            a.training = still;
        }
        const cut = this._now() - ASSEMBLY_RECENT_DAYS * MINUTES_PER_DAY;
        if (a.recent.length && a.recent[0].minute < cut) a.recent = a.recent.filter(r => r.minute >= cut);

        if (a.built && a.level) {
            // gaji + perawatan harian (hanya setelah beroperasi: sebelum itu tak ada pekerja)
            const daily = Math.round((this.getMonthlyWages() + this.getMonthlyUpkeep()) / DAYS_PER_MONTH);
            if (daily > 0) {
                a.unpaid += daily;
                if (WalletService.canAfford(a.unpaid)) {
                    WalletService.pay(a.unpaid, 'assembly-wages');
                    a.wagesPaid += a.unpaid;
                    a.unpaid = 0;
                } else if (Math.floor(a.unpaid / daily) === 7) {
                    ToastService.warning('Gaji & perawatan Pabrik Perakitan belum terbayar (' + _money(a.unpaid) + ').');
                }
            }
            // moral: menuju target
            const s = this.getStaffing();
            let target = 75 + (s.supervisor >= 0.8 ? 5 : -10) - (a.overtime ? 20 : 0) - (daily > 0 && a.unpaid > daily * 14 ? 30 : 0);
            target = _clamp(target, 0, 100);
            a.morale = _clamp(a.morale + (target - a.morale) * 0.05, 0, 100);
            changed = true;
        }
        if (changed) bus.emit('state:changed', data);
    }

    _tickBuild() {
        const data = this.state.data, a = this._raw(), u = a.upgrade;
        const last = u.lastProcessedMinute || u.startedAtMinute;
        const delta = this._now() - last;
        if (delta <= 0) return;
        u.progressDays += delta / MINUTES_PER_DAY;
        u.lastProcessedMinute = this._now();
        bus.emit('assembly:progress', { percent: Math.min(1, u.progressDays / u.durationDays), isBuild: u.isBuild, targetLevel: u.targetLevel });
        if (u.progressDays >= u.durationDays) {
            const info = getAssemblyLevel(u.targetLevel);
            a.built = true; a.level = u.targetLevel;
            if (u.isBuild) {
                this.state.addMilestone && this.state.addMilestone('first_assembly', 'Pabrik Perakitan pertama dibangun');
                ToastService.success('🏭 Pabrik Perakitan selesai dibangun!');
                this.state.addLog('Pabrik Perakitan selesai dibangun (' + info.name + ').' +
                    (this._year() < ASSEMBLY_OPERATE_YEAR ? ' Mulai beroperasi tahun ' + ASSEMBLY_OPERATE_YEAR + '.' : ''), LOG_TYPES.success);
                bus.emit('assembly:built', { level: u.targetLevel });
            } else {
                ToastService.success('🏭 Pabrik Perakitan di-upgrade ke ' + info.name + '!');
                this.state.addLog('Pabrik Perakitan di-upgrade ke ' + info.name + '.', LOG_TYPES.success);
                bus.emit('assembly:upgraded', { level: u.targetLevel });
            }
            a.upgrade = null;
            bus.emit('state:changed', data);
        }
    }

    // Ringkasan untuk panel & peta 3D.
    getSnapshot() {
        const a = this._raw(), li = getAssemblyLevel(a.level), g = this.getGrade();
        return {
            built: this.isBuilt(), operating: this.isOperating(), level: a.level, levelInfo: li,
            upgrade: a.upgrade, workers: Object.assign({}, a.workers), training: this.getTrainingCount(),
            total: this.getWorkerTotal(), staffing: this.getStaffing(), morale: a.morale, overtime: a.overtime,
            capacity: this.getCapacityMonthly(), utilization: this.getUtilization(), defectRate: this.getDefectRate(),
            wageIndex: this.getWageIndex(), wages: this.getMonthlyWages(), upkeep: this.getMonthlyUpkeep(), unpaid: a.unpaid,
            totalAssembled: a.totalAssembled, defectUnits: a.defectUnits, pending: this.getPendingUnits(),
            costFactor: this.getCostFactor(), savedTotal: a.savedTotal || 0,
            grade: g.id, gradeName: g.name, gradeList: this.getGradeList(),
            learning: this.getLearning(), batchQuality: this.getBatchQuality()
        };
    }
}
