// FILE: src/systems/RegistrarSystem.js  (BARU)
// ============================================================
// Registrar (panel Future): jalur reseller -> registrar terakreditasi ICANN -> penjualan domain.
// Semua angka ada di src/data/registrar.data.js. Semua teks ada di i18n (key "registrar.*"), bukan di sini.
//
// Alur (mengikuti proses ICANN yang sebenarnya):
//   kirim berkas + bayar  ->  review 1-3 bulan  ->  surat ICANN di Pesan: diterima / diminta melengkapi / ditolak
//   diterima  -> halaman Terima Kontrak (RAA + escrow data + biaya tahunan), tawaran kedaluwarsa 30 hari
//   lalu hubungi registry (mis. .com): onboarding 1 bulan + deposit grosir  ->  mulai menjual.
//
// State baru (otomatis, save lama aman): data.registrar.
// Pemain TIDAK melihat peluang dalam persen. getOutlook() hanya mengembalikan tingkat (low/medium/high) + alasan.
// ============================================================
import { bus } from '../core/EventBus.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { t } from '../core/LanguageService.js';
import {
    REGISTRAR_CONFIG as C, REGISTRIES, getWholesalePrice, getTotalDomainsMillions
} from '../data/registrar.data.js';

function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function _num(v) { v = Number(v); return isFinite(v) ? v : 0; }
function _usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

export function absMonth(data) {
    var tm = (data && data.time) || {};
    return (tm.currentYear || 0) * 12 + (tm.currentMonth || 1);
}
// Nomor hari absolut (monoton). Memakai menit game bila ada, supaya melompati beberapa hari sekaligus tetap akurat.
function _dayNow(data) {
    var tm = (data && data.time) || {};
    if (isFinite(tm.elapsedGameMinutes) && tm.elapsedGameMinutes > 0) return Math.floor(tm.elapsedGameMinutes / 1440);
    return (tm.currentYear || 0) * 372 + ((tm.currentMonth || 1) - 1) * 31 + (tm.currentDay || 1);   // cadangan (tes)
}
function _year(data) { return (data && data.time && data.time.currentYear) || 0; }

// ---------- State ----------
export function ensureRegistrarState(data) {
    if (!data.registrar || typeof data.registrar !== 'object') data.registrar = {};
    var r = data.registrar;
    if (r.stage !== 'reseller' && r.stage !== 'registrar') r.stage = 'none';
    r.reseller = r.reseller === true;             // pernah/masih berjualan sebagai reseller
    r.share = _clamp(_num(r.share), 0, 1);
    r.priceMult = _clamp(_num(r.priceMult) || 1, C.priceMultMin, C.priceMultMax);
    r.priceRef = _num(r.priceRef);               // harga grosir saat harga jual terakhir diatur (0 = belum diatur)
    r.priceChangedAbs = _num(r.priceChangedAbs);
    r.cooldownUntil = _num(r.cooldownUntil);      // tidak bisa mengajukan ulang sebelum bulan absolut ini
    r.violations = _num(r.violations);            // jumlah pencabutan/penolakan karena pelanggaran (catatan)
    r.earned = _num(r.earned);
    r.last = r.last && typeof r.last === 'object' ? r.last : { revenue: 0, profit: 0, domains: 0 };
    if (!r.app || typeof r.app !== 'object') r.app = null;
    if (!r.acc || typeof r.acc !== 'object') r.acc = null;
    if (!r.registries || typeof r.registries !== 'object') r.registries = {};
    REGISTRIES.forEach(function (g) {
        var x = r.registries[g.id];
        if (!x || typeof x !== 'object') x = r.registries[g.id] = {};
        if (['none', 'onboarding', 'active'].indexOf(x.state) === -1) x.state = 'none';
        x.monthsLeft = _num(x.monthsLeft);
    });
    if (!Array.isArray(r.letters)) r.letters = [];
    r.letterSeq = _num(r.letterSeq);
    return r;
}

// ---------- Pembukaan ----------
export function isResellerOpen(data) { return _year(data) >= C.resellerYear; }
export function isRegistrarOpen(data) {
    var u = C.registrarUnlock, done = (data && data.research && data.research.completed) || [];
    return _year(data) >= u.year && (!u.research || done.indexOf(u.research) !== -1);
}

// Skala perusahaan (sama rumus EcosystemSystem): rata-rata pendapatan ponsel 3 bulan terakhir.
export function companyScale(data) {
    var rh = (data && data.market && data.market.revenueHistory) || [], sum = 0, n = 0;
    for (var i = 0; i < Math.min(3, rh.length); i++) { sum += _num(rh[i] && rh[i].playerRevenue); n++; }
    return _clamp((n ? sum / n : 0) / C.scaleBase, 1, C.scaleMax);
}

// ---------- Berkas & peluang (disembunyikan dari pemain) ----------
export function getRequirements(data, insurance) {
    var need = C.workingCapital + C.applicationFee + (insurance ? C.insurancePremium : 0);
    var cash = _num(data.cash);
    return { fee: C.applicationFee, capital: C.workingCapital, premium: C.insurancePremium, need: need, cash: cash, cashOk: cash >= need };
}

// Peluang ditolak (0..cap) + alasan. Hanya dipakai sistem; UI memakai getOutlook().
export function computeRejectChance(data) {
    var r = ensureRegistrarState(data), reasons = [];
    var p = C.rejectBase;
    var cash = _num(data.cash);
    if (cash < (C.workingCapital + C.applicationFee) * C.thinCashMult) { p += C.rejectThinCash; reasons.push('cash'); }
    if (r.violations > 0) { p += C.rejectViolation; reasons.push('record'); }
    var rep = _num(data.market && data.market.reputation);
    if (rep < C.lowRepBelow) { p += C.rejectLowRep; reasons.push('rep'); }
    return { p: Math.min(C.rejectCap, p), reasons: reasons };
}

// Tingkat peluang untuk Asisten Bisnis: 'high' | 'medium' | 'low' + alasan (kode).
export function getOutlook(data) {
    var c = computeRejectChance(data), ok = 1 - c.p;
    var level = ok >= 0.85 ? 'high' : (ok >= 0.65 ? 'medium' : 'low');
    return { level: level, reasons: c.reasons };
}

// ---------- Harga & pasar ----------
export function defaultRetail(wholesale) { return (wholesale + C.perTxFee) * C.markup; }

export function getRetailPrice(data) {
    var r = ensureRegistrarState(data), tm = data.time || {};
    var ref = r.priceRef > 0 ? r.priceRef : getWholesalePrice(_year(data), tm.currentMonth);
    return defaultRetail(ref) * r.priceMult;
}

export function sellingMode(data) {
    var r = ensureRegistrarState(data);
    if (r.acc && r.acc.status === 'revoked') return null;
    var hasActive = REGISTRIES.some(function (g) { return r.registries[g.id].state === 'active'; });
    if (r.acc && hasActive) return 'registrar';
    if (r.reseller) return 'reseller';
    return null;
}

// Porsi pasar domain yang bisa dijual: reseller menjual semua registry yang ada; registrar hanya registry yang sudah aktif.
export function coverage(data) {
    var r = ensureRegistrarState(data), mode = sellingMode(data), cov = 0;
    REGISTRIES.forEach(function (g) {
        if (mode === 'reseller' || (mode === 'registrar' && r.registries[g.id].state === 'active')) cov += g.share;
    });
    return cov;
}

export function getHeldCapital(data) {
    var r = ensureRegistrarState(data), held = 0;
    if (r.acc && r.acc.status !== 'revoked') held += C.workingCapital;
    REGISTRIES.forEach(function (g) { if (r.registries[g.id].state === 'active') held += C.registryDeposit; });
    return held;
}

// Ringkasan angka untuk panel dan perhitungan bulanan. Tidak mengubah state.
export function describeRegistrar(data) {
    var r = ensureRegistrarState(data), tm = data.time || {};
    var mode = sellingMode(data);
    var wholesale = getWholesalePrice(_year(data), tm.currentMonth);
    var retail = getRetailPrice(data);
    var cost = wholesale + C.perTxFee;
    var unitCost = mode === 'reseller' ? cost * C.resellerCostMult : cost;
    var cap = mode === 'registrar' ? C.registrarShareCap : C.resellerShareCap;
    var pool = getTotalDomainsMillions(_year(data), tm.currentMonth) * 1e6 * coverage(data);
    var domains = Math.round(r.share * pool * C.economyScale);
    var margin = retail - unitCost;
    var scale = companyScale(data);
    var fixed = (mode === 'registrar' || (r.acc && r.acc.status !== 'revoked')) ? Math.round(C.fixedMonthly * Math.pow(scale, C.fixedScaleExp)) : 0;
    var staff = r.acc ? r.acc.staff || 0 : 0;
    var staffCost = staff * C.staffCost;
    var gross = domains * retail / 12;
    var cogs = domains * unitCost / 12;
    var net = gross - cogs - fixed - staffCost;
    return {
        state: r, mode: mode, wholesale: wholesale, retail: retail, unitCost: unitCost, margin: margin,
        marginPct: retail > 0 ? margin / retail : 0, cap: cap, pool: pool, domains: domains, share: r.share,
        fixed: fixed, staffCost: staffCost, gross: gross, cogs: cogs, net: net, held: getHeldCapital(data), scale: scale
    };
}

// ---------- Aksi pemain ----------
function _log(state, msg, type) { try { state.addLog(msg, type || LOG_TYPES.info); } catch (e) {} }

function _newLetter(r, code, vars, act) {
    r.letterSeq += 1;
    var item = { id: -(100000 + r.letterSeq), kind: 'icann', code: code, vars: vars || {}, act: act || null, created_at: new Date().toISOString(), read_at: null, local: true };
    r.letters.unshift(item);
    if (r.letters.length > 20) r.letters.length = 20;
    return item;
}

// Kirim satu surat ICANN ke Pesan. Impor dinamis supaya sistem tetap bisa dites tanpa DOM/cloud.
function _sendLetter(data, code, vars, act) {
    var r = ensureRegistrarState(data);
    var item = _newLetter(r, code, vars, act);
    try {
        import('../services/InboxService.js').then(function (mod) {
            if (mod && mod.InboxService && mod.InboxService.notifyLocal) mod.InboxService.notifyLocal(item);
        }).catch(function () {});
    } catch (e) {}
    return item;
}

export function joinReseller(state) {
    var data = state.data, r = ensureRegistrarState(data);
    if (!isResellerOpen(data) || r.reseller || r.stage !== 'none') return { ok: false, reason: 'unavailable' };
    r.stage = 'reseller'; r.reseller = true;
    r.priceRef = getWholesalePrice(_year(data), (data.time || {}).currentMonth);
    return { ok: true };
}

export function canSubmit(data, insurance) {
    var r = ensureRegistrarState(data);
    if (!isRegistrarOpen(data)) return { ok: false, reason: 'locked' };
    if (r.app) return { ok: false, reason: 'busy' };
    if (r.acc && r.acc.status !== 'revoked') return { ok: false, reason: 'accredited' };
    if (absMonth(data) < r.cooldownUntil) return { ok: false, reason: 'cooldown', months: r.cooldownUntil - absMonth(data) };
    if (!insurance) return { ok: false, reason: 'insurance' };
    if (!getRequirements(data, insurance).cashOk) return { ok: false, reason: 'cash' };
    return { ok: true };
}

export function submitApplication(state, insurance) {
    var data = state.data, r = ensureRegistrarState(data);
    var chk = canSubmit(data, !!insurance);
    if (!chk.ok) return chk;
    state.addCash(-(C.applicationFee + C.insurancePremium));
    var months = _clamp(C.reviewMonths + Math.round((Math.random() * 2 - 1) * C.reviewJitter), 1, C.reviewMonths + C.reviewJitter);
    r.app = { phase: 'review', monthsLeft: months, revised: false, daysLeft: 0, deadline: 0 };
    return { ok: true };
}

// "Diminta melengkapi": pemain mengirim berkas tambahan (gratis), review berlanjut +1 bulan.
export function sendSupplement(state) {
    var r = ensureRegistrarState(state.data);
    if (!r.app || r.app.phase !== 'revise') return { ok: false, reason: 'unavailable' };
    r.app = { phase: 'review', monthsLeft: C.reviseExtraMonths, revised: true, daysLeft: 0, deadline: 0 };
    return { ok: true };
}

export function canAcceptContract(data) {
    var r = ensureRegistrarState(data);
    if (!r.app || r.app.phase !== 'offer') return { ok: false, reason: 'unavailable' };
    var need = C.annualFee + C.workingCapital;
    if (_num(data.cash) < need) return { ok: false, reason: 'cash', need: need };
    return { ok: true };
}

// Tanda tangan RAA + perjanjian escrow data, bayar biaya tahunan. Memulai akreditasi 5 tahun.
export function acceptContract(state, signedRaa, signedEscrow) {
    var data = state.data, r = ensureRegistrarState(data);
    if (!signedRaa || !signedEscrow) return { ok: false, reason: 'sign' };
    var chk = canAcceptContract(data);
    if (!chk.ok) return chk;
    state.addCash(-C.annualFee);
    var now = absMonth(data);
    r.acc = { status: 'active', sinceAbs: now, expiresAbs: now + C.termYears * 12, points: 0, cleanMonths: 0, openAbuse: 0, staff: 0, warnings: 0 };
    r.stage = 'registrar';
    r.app = null;
    r.priceRef = getWholesalePrice(_year(data), (data.time || {}).currentMonth);
    _sendLetter(data, 'contract_signed', { years: C.termYears }, null);
    return { ok: true };
}

export function joinRegistry(state, id) {
    var data = state.data, r = ensureRegistrarState(data), x = r.registries[id];
    if (!x) return { ok: false, reason: 'unknown' };
    if (!r.acc || r.acc.status === 'revoked') return { ok: false, reason: 'accreditation' };
    if (x.state !== 'none') return { ok: false, reason: 'busy' };
    if (_num(data.cash) < getHeldCapital(data) + C.registryDeposit) return { ok: false, reason: 'cash', need: getHeldCapital(data) + C.registryDeposit };
    x.state = 'onboarding'; x.monthsLeft = C.registryOnboardMonths;
    return { ok: true };
}

export function setRetailMult(state, mult) {
    var data = state.data, r = ensureRegistrarState(data);
    if (r.stage === 'none') return { ok: false, reason: 'unavailable' };
    var left = r.priceChangedAbs + C.priceCooldownMonths - absMonth(data);
    if (r.priceChangedAbs && left > 0) return { ok: false, reason: 'cooldown', months: left };
    var m = Math.round(_clamp(_num(mult), C.priceMultMin, C.priceMultMax) / C.priceMultStep) * C.priceMultStep;
    r.priceMult = Math.round(m * 100) / 100;
    r.priceRef = getWholesalePrice(_year(data), (data.time || {}).currentMonth);
    r.priceChangedAbs = absMonth(data);
    return { ok: true };
}

export function setComplianceStaff(state, n) {
    var r = ensureRegistrarState(state.data);
    if (!r.acc || r.acc.status === 'revoked') return { ok: false, reason: 'unavailable' };
    r.acc.staff = _clamp(Math.round(_num(n)), 0, C.staffMax);
    return { ok: true };
}

export function handleAbuse(state) {
    var data = state.data, r = ensureRegistrarState(data);
    if (!r.acc || !(r.acc.openAbuse > 0)) return { ok: false, reason: 'unavailable' };
    var cost = r.acc.openAbuse * C.abuseHandleCost;
    state.addCash(-cost);
    r.acc.openAbuse = 0;
    return { ok: true, cost: cost };
}

// ---------- Sistem bulanan / harian ----------
export class RegistrarSystem {
    constructor(state) {
        this.state = state;
        this._unsubs = [
            bus.on('time:month-changed', () => this._onMonth()),
            bus.on('time:day-changed', () => this._onDay())
        ];
    }

    destroy() { this._unsubs.forEach(function (u) { try { u(); } catch (e) {} }); this._unsubs = []; }

    // --- aksi (dipanggil UI; semuanya meneruskan ke fungsi murni di atas) ---
    joinReseller() { return joinReseller(this.state); }
    submit(insurance) { return submitApplication(this.state, insurance); }
    supplement() { return sendSupplement(this.state); }
    accept(raa, escrow) { return acceptContract(this.state, raa, escrow); }
    joinRegistry(id) { return joinRegistry(this.state, id); }
    setPrice(mult) { return setRetailMult(this.state, mult); }
    setStaff(n) { return setComplianceStaff(this.state, n); }
    handleAbuse() { return handleAbuse(this.state); }

    _onDay() {
        var data = this.state.data;
        if (!data) return;
        var r = ensureRegistrarState(data);
        if (!r.app || !(r.app.deadline > 0)) return;
        r.app.daysLeft = Math.max(0, r.app.deadline - _dayNow(data));
        if (r.app.daysLeft > 0) return;
        // Batas waktu habis (juga bila waktu melompat beberapa hari sekaligus).
        if (r.app.phase === 'offer') {
            r.app = null;
            _sendLetter(data, 'offer_expired', {}, null);
        } else if (r.app.phase === 'revise') {
            r.app = null;
            _sendLetter(data, 'revise_lapsed', {}, null);
        }
    }

    _onMonth() {
        var data = this.state.data;
        if (!data) return;
        ensureRegistrarState(data);
        try { this._review(data); } catch (e) {}
        try { this._registries(data); } catch (e) {}
        try { this._compliance(data); } catch (e) {}
        try { this._sales(data); } catch (e) {}
        try { this._yearly(data); } catch (e) {}
    }

    _review(data) {
        var r = data.registrar;
        if (!r.app || r.app.phase !== 'review') return;
        r.app.monthsLeft -= 1;
        if (r.app.monthsLeft > 0) return;
        var rej = computeRejectChance(data);
        var u = Math.random();
        if (!r.app.revised && u < rej.p) {
            r.app = null;
            r.cooldownUntil = absMonth(data) + C.reapplyAfterMonths;
            _sendLetter(data, 'review_rejected', { months: C.reapplyAfterMonths, fee: _usd(C.applicationFee) }, null);
            return;
        }
        // Setelah melengkapi dokumen, hasilnya pasti diterima (revisi hanya menunda 1 bulan). Peluang akhir diterima = 1 - peluang ditolak.
        if (!r.app.revised && u < rej.p + C.reviseChance) {
            r.app = { phase: 'revise', monthsLeft: 0, revised: false, daysLeft: C.reviseDeadlineDays, deadline: _dayNow(data) + C.reviseDeadlineDays };
            _sendLetter(data, 'review_revise', { days: C.reviseDeadlineDays }, 'revise');
            return;
        }
        r.app = { phase: 'offer', monthsLeft: 0, revised: r.app.revised, daysLeft: C.offerDays, deadline: _dayNow(data) + C.offerDays };
        _sendLetter(data, 'review_accepted', { days: C.offerDays, fee: _usd(C.annualFee) }, 'contract');
    }

    _registries(data) {
        var r = data.registrar;
        REGISTRIES.forEach((g) => {
            var x = r.registries[g.id];
            if (x.state === 'onboarding') {
                if (!r.acc || r.acc.status === 'revoked') { x.state = 'none'; return; }
                x.monthsLeft -= 1;
                if (x.monthsLeft <= 0) {
                    x.state = 'active';
                    _sendLetter(data, 'registry_ready', { ext: g.ext }, null);
                }
            }
        });
    }

    _compliance(data) {
        var r = data.registrar, a = r.acc;
        if (!a || a.status === 'revoked') return;
        var gained = 0;
        var red = 1 - C.staffReduction * _clamp(a.staff || 0, 0, C.staffMax);

        // Laporan penyalahgunaan baru
        var polMult = 1;
        try {
            var pol = data.userControl && data.userControl.policy;
            if (C.abusePolicyMult[pol]) polMult = C.abusePolicyMult[pol];
        } catch (e) {}
        var chance = C.abuseChance * polMult * (1 + Math.min(2, r.share * 20));
        if (sellingMode(data) === 'registrar' && Math.random() < chance) {
            a.openAbuse += 1;
            try { this.state.addSentiment(-C.sentimentHitAbuse); } catch (e) {}
            _log(this.state, t('registrar.log.abuse'), LOG_TYPES.warning);
            try { ToastService.warning(t('registrar.log.abuse')); } catch (e) {}
        }
        // Laporan yang dibiarkan sepanjang bulan menambah poin
        if (a.openAbuse > 0) gained += red;
        // Modal kerja tertahan tidak boleh turun
        if (_num(data.cash) < getHeldCapital(data)) gained += C.capitalShortfallPoints * red;

        if (gained > 0) { a.points += gained; a.cleanMonths = 0; }
        else {
            a.cleanMonths += 1;
            if (a.cleanMonths >= C.pointDecayMonths && a.points > 0) { a.points = Math.max(0, a.points - 1); a.cleanMonths = 0; }
        }

        if (a.status === 'active' && a.points >= C.pointsAudit) {
            a.status = 'warning'; a.warnings += 1;
            try { this.state.addReputation(-C.repHitAudit); } catch (e) {}
            _sendLetter(data, 'audit', {}, null);
        } else if (a.status === 'warning' && a.points <= 1) {
            a.status = 'active';
        }
        if (a.status !== 'revoked' && a.points >= C.pointsRevoke) this._revoke(data, 'revoked');
    }

    _revoke(data, code) {
        var r = data.registrar, a = r.acc;
        a.status = 'revoked'; a.openAbuse = 0; a.staff = 0;
        r.violations += 1;
        r.cooldownUntil = absMonth(data) + C.reapplyAfterMonths;
        REGISTRIES.forEach(function (g) { r.registries[g.id].state = 'none'; });
        try { this.state.addReputation(-C.repHitRevoked); } catch (e) {}
        _sendLetter(data, code, { months: C.reapplyAfterMonths }, null);
    }

    _sales(data) {
        var r = data.registrar;
        var mode = sellingMode(data);
        r.last = { revenue: 0, profit: 0, domains: 0 };
        if (!mode) {
            // Dicabut / belum berjualan: pelanggan pindah pelan-pelan.
            if (r.share > 0 && r.acc && r.acc.status === 'revoked') r.share = r.share * 0.75 < 0.0005 ? 0 : r.share * 0.75;
            return;
        }
        var d = describeRegistrar(data);
        // Pertumbuhan pangsa: reputasi dan harga memengaruhi; status Peringatan melambatkan.
        var rep = _clamp(_num(data.market && data.market.reputation), 0, 100);
        var grow = (mode === 'registrar' ? C.registrarShareGrow : C.resellerShareGrow) / 100;
        grow *= 0.7 + 0.6 * rep / 100;
        grow *= _clamp(1 + C.priceElasticity * (1 - r.priceMult), 0.4, 1.3);
        if (r.acc && r.acc.status === 'warning') grow *= 0.5;
        r.share = Math.min(d.cap, r.share + grow);
        if (r.share > d.cap) r.share = d.cap;

        d = describeRegistrar(data);
        var cashNet = Math.round(d.net);
        if (cashNet) this.state.addCash(cashNet);
        r.earned += cashNet;
        r.last = { revenue: Math.round(d.gross), profit: cashNet, domains: d.domains };
        try {
            bus.emit('economy:add-revenue', { amount: Math.round(d.gross) });
            bus.emit('economy:add-cogs', { amount: Math.round(d.cogs + d.fixed + d.staffCost) });
        } catch (e) {}
    }

    _yearly(data) {
        var r = data.registrar, a = r.acc, now = absMonth(data);
        if (!a || a.status === 'revoked') return;
        // Biaya tahunan + premi asuransi tiap ulang tahun akreditasi (selain tahun pertama, sudah dibayar saat kontrak).
        if (now > a.sinceAbs && (now - a.sinceAbs) % 12 === 0 && now < a.expiresAbs) {
            this.state.addCash(-(C.annualFee + C.insurancePremium));
        }
        // Perpanjangan tiap 5 tahun.
        if (now >= a.expiresAbs) {
            var p = C.renewRejectBase + C.renewRejectPerWarning * (a.status === 'warning' ? 1 : 0);
            if (Math.random() < p) { this._revoke(data, 'renew_denied'); }
            else {
                a.expiresAbs += C.termYears * 12;
                this.state.addCash(-(C.annualFee + C.insurancePremium));
                _sendLetter(data, 'renew_ok', { years: C.termYears }, null);
            }
        }
    }
}
