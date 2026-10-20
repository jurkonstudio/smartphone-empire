// FILE: src/systems/SiliconService.js
// ============================================================
// SiliconService — premium currency "Silicon" (SIL).
// v2027.5a — tambah applyServerBalance() untuk sinkronisasi cloud.
// v2027.40 — unlock riset & boost riset pakai SIL (tech + chip), fix boost dev.
// v2027.41 — percepatan waktu 2x/5x/10x berbayar SIL (batas waktu per 10 SIL); hapus skip7/skip30.
// v2028.3  — Menambahkan dukungan percepatan OS (kind === 'os').
// v2029.3  — [AUDIT] boost OS tidak lagi ditagih harga 'selesai'; guard Infinity/NaN; buySpeed aman bila
//            aktivasi gagal (SIL dikembalikan); refund memberi tahu CloudSync (refund server).
// v2029.4  — [CLOUD-ONLY] SIL hanya aktif saat login cloud (dapat, belanja, dan bayar). Offline: saldo
//            hanya tampil, tidak bisa dipakai/ditambah. Hadiah yang terlewat diklaim server saat login.
// v2028.41 — [FIX SIL HILANG]
//   • Mode bayar 'auto' tanpa persetujuan eksplisit pemain dianggap 'strict' (SIL tidak lagi
//     terpotong diam-diam untuk menutup biaya uang; notifikasi default MATI sehingga tak terlihat).
//   • Event silicon:changed membawa `reason` (+ `refund`) agar CloudSync bisa membatalkan belanja
//     tertunda saat refund & mengirim reward quest ke server.
//   • Hadiah harian di mode cloud ditentukan server (via CloudSync), bukan lagi ditimpa mentah.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { t } from '../core/LanguageService.js';
import { SILICON_COSTS } from '../data/silicon.data.js';
import { DEV_BUILD } from '../config/dev.config.js';
import { CloudService } from '../services/CloudService.js';
import { SaveService } from '../core/SaveService.js';
import { WALLET, getCashPerSil } from '../data/silicon.data.js';

// [HARDENING] Kredit SIL hanya sah dari sumber ini (produksi). 'cheat' & lainnya ditolak.
var ALLOWED_CREDIT = /^(topup:|daily-login$|quest:|refund:|server-sync$)/;
import { getNodeById } from '../data/research.data.js';
import { getChipResearchById } from '../data/chip-research.data.js';

var MAX_HISTORY = 20;

// [CLOUD-ONLY] SIL hanya sah saat akun cloud tersambung (server = sumber kebenaran saldo).
// DEV_BUILD dikecualikan agar sandbox tetap bisa diuji tanpa server.
var CLOUD_ONLY = true;
var CLOUD_REQUIRED = { ok: false, cloudRequired: true, reason: 'Login ke Cloud dulu untuk memakai Silicon.' };
function _cloudOn() {
    if (!CLOUD_ONLY || DEV_BUILD) return true;
    try { return CloudService.getStatus() === 'connected' && !!CloudService.getUserId(); } catch (e) { return false; }
}

// [FIX] true = SIL hanya boleh menutup biaya uang bila pemain MEMILIH mode bayar sendiri
// (Setelan -> Keuangan). Set false untuk mengembalikan perilaku lama ('auto' aktif otomatis).
var WALLET_REQUIRE_CONSENT = true;

// [FIX SALDO] Saldo yang DITAMPILKAN harus sama dengan server (Supabase).
// _serverConfirmed = true setelah saldo server berhasil dibaca pada sesi cloud ini.
// _serverFailed    = true bila pembacaan server gagal/timeout (jatuh ke saldo lokal agar tidak '…' selamanya).
var _serverConfirmed = false;
var _serverFailed = false;

// [FIX SALDO BALIK KE 10] Penghitung perubahan saldo. CloudSync membandingkannya sebelum/sesudah menarik
// saldo dari server: bila berubah di tengah jalan (belanja/penukaran), hasil tarikan dianggap basi & dibuang.
var _epoch = 0;

// [FIX SALDO BALIK KE 10] Saldo server HARUS ikut tersimpan ke save lokal segera. Dulu save lokal hanya
// diperbarui autosave 30 dtk (dan dilewati saat tab di latar belakang), sehingga saat tab dimuat ulang
// Chrome Android memakai save lama (saldo lama / default 10) dan Tab Tukar membaca angka itu.
var _persistTimer = null;
function _persistSoon() {
    if (_persistTimer) clearTimeout(_persistTimer);
    _persistTimer = setTimeout(function () {
        _persistTimer = null;
        try { SaveService.save(state, { silent: true }); } catch (e) {}
    }, 400);
}

export var SILICON_ACTIONS = [
    { id: 'research', group: 'research',     cost: 20, icon: '🔬', ready: true },
    { id: 'chipResearch', group: 'research', cost: 20, icon: '💠', ready: true },
    { id: 'dev', group: 'production',          cost: 30, icon: '📱', ready: true },
    { id: 'fabBuild', group: 'production',     cost: 30, icon: '🏗️', ready: true },
    { id: 'fabProd', group: 'production',      cost: 20, icon: '🏭', ready: true },
    { id: 'osBugs', group: 'team',       cost: 10, icon: '🐞', ready: true },
    { id: 'morale', group: 'team',       cost: 15, icon: '😊', ready: true },
    { id: 'rep', group: 'team',          cost: 25, icon: '⭐', ready: true }
];


// ---------- Helper riset (tech 'tech' | chip 'chip') ----------
function _sys(kind) {
    var g = window.__game;
    if (!g) return null;
    return kind === 'chip' ? g.chipResearch : g.research;
}
function _node(kind, id) {
    return kind === 'chip' ? getChipResearchById(id) : getNodeById(id);
}
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function _pushHistory(type, delta, reason) {
    var d = state.data;
    if (!Array.isArray(d.siliconHistory)) d.siliconHistory = [];
    d.siliconHistory.unshift({
        type: type,
        delta: delta,
        reason: reason,
        balanceAfter: d.silicon,
        at: Date.now(),
        year: d.time.currentYear,
        month: d.time.currentMonth,
        day: d.time.currentDay
    });
    if (d.siliconHistory.length > MAX_HISTORY) d.siliconHistory.length = MAX_HISTORY;
}

export var SiliconService = {
    getBalance() {
        return state.data.silicon || 0;
    },

    // Teks saldo untuk UI. Mode cloud: '…' sampai saldo server terkonfirmasi.
    // Offline / DEV_BUILD / server gagal dibaca: tampilkan saldo lokal.
    getDisplayBalance() {
        var bal = state.data.silicon || 0;
        if (DEV_BUILD || !CLOUD_ONLY) return bal;
        if (!_cloudOn()) return bal;
        if (_serverConfirmed || _serverFailed) return bal;
        return '…';
    },

    isServerConfirmed() { return _serverConfirmed; },

    getEpoch() { return _epoch; },

    // true bila saldo yang tampil BOLEH dipercaya untuk keputusan UI (aktif/nonaktif tombol).
    // Mode cloud: hanya setelah saldo server terbaca pada sesi ini. DEV/offline: selalu true.
    isReady() {
        if (DEV_BUILD || !CLOUD_ONLY) return true;
        if (!_cloudOn()) return true;
        return _serverConfirmed;
    },

    // Dipanggil CloudSync: true = saldo server sudah dibaca, false = gagal membaca.
    markServerSync(ok) {
        var was = _serverConfirmed || _serverFailed;
        if (ok) { _serverConfirmed = true; _serverFailed = false; }
        else if (!_serverConfirmed) { _serverFailed = true; }
        if (!was || ok) bus.emit('silicon:display', { confirmed: _serverConfirmed });
    },

    // Panggil saat logout / ganti akun agar saldo lama tidak tampil sebagai saldo server.
    resetServerSync() { _serverConfirmed = false; _serverFailed = false; },

    // true bila SIL boleh dipakai/ditambah (login cloud aktif).
    isActive() { return _cloudOn(); },

    // ---------- Dompet Universal: biaya berupa SIL boleh ditutup uang ($) ----------
    _payMode() {
        if (!_cloudOn()) return 'strict';   // offline: uang & SIL dipisah total
        var s = state.data.settings || {};
        var m = WALLET.modes.indexOf(s.payMode) >= 0 ? s.payMode : WALLET.defaultMode;
        // 'auto' bawaan (belum pernah dipilih pemain) = 'strict': SIL tidak terpakai tanpa persetujuan.
        if (WALLET_REQUIRE_CONSENT && m === 'auto' && s.payModeChosen !== true) return 'strict';
        return m;
    },
    cashPerSil() { return getCashPerSil(state.data.time && state.data.time.currentYear); },

    // Rencana bayar untuk biaya `cost` SIL: { ok, sil, units, cash } (units = SIL yang dibayar dengan uang).
    quote(cost) {
        cost = Math.floor(cost);
        var plan = { ok: false, cost: cost, sil: 0, units: 0, cash: 0 };
        if (!(cost > 0) || !isFinite(cost)) return plan;
        if (!_cloudOn()) { plan.cloudRequired = true; return plan; }
        var bal = state.data.silicon || 0, mode = this._payMode(), rate = this.cashPerSil();
        var cashUnits = Math.floor(Math.max(0, state.data.cash || 0) / rate);
        if (mode === 'strict') {
            if (bal >= cost) { plan.ok = true; plan.sil = cost; }
            return plan;
        }
        if (mode === 'cash_first') {
            plan.units = Math.min(cost, cashUnits);
            plan.sil = cost - plan.units;
        } else { // auto & sil_first: SIL dulu
            plan.sil = Math.min(cost, bal);
            plan.units = cost - plan.sil;
        }
        plan.cash = plan.units * rate;
        plan.ok = plan.sil <= bal && plan.units <= cashUnits;
        return plan;
    },

    canAffordRaw(cost) { return _cloudOn() && (state.data.silicon || 0) >= cost; },

    // Mampu bayar `cost` SIL, termasuk lewat uang ($) sesuai mode dompet.
    canAfford(cost) { return this.quote(cost).ok; },

    // Daya beli total dalam satuan SIL (SIL + uang / kurs).
    getPurchasingPowerSil() {
        var bal = state.data.silicon || 0;
        if (!_cloudOn()) return 0;
        if (this._payMode() === 'strict') return bal;
        return bal + Math.floor(Math.max(0, state.data.cash || 0) / this.cashPerSil());
    },

    add(amount, reason) {
        amount = Math.floor(amount);
        if (!amount || amount <= 0 || !isFinite(amount)) return { ok: false, reason: 'Jumlah tidak valid.' };
        if (!DEV_BUILD && !ALLOWED_CREDIT.test(String(reason || ''))) return { ok: false, reason: 'Sumber kredit tidak sah.' };
        if (!_cloudOn()) return CLOUD_REQUIRED;
        _epoch++;
        state.data.silicon = (state.data.silicon || 0) + amount;
        _pushHistory('earn', amount, reason || 'reward');
        bus.emit('silicon:changed', { balance: state.data.silicon, delta: amount, reason: String(reason || 'reward') });
        bus.emit('state:changed', state.data);
        return { ok: true, balance: state.data.silicon };
    },

    // Potong SIL murni (tanpa uang). Dipakai Dompet Universal & penukaran SIL->uang.
    spendRaw(amount, reason) {
        amount = Math.floor(amount);
        if (!amount || amount <= 0 || !isFinite(amount)) return { ok: false, reason: 'Jumlah tidak valid.' };
        if (!_cloudOn()) return CLOUD_REQUIRED;
        if (!this.canAffordRaw(amount)) return { ok: false, reason: 'Silicon tidak cukup.' };
        _epoch++;
        state.data.silicon = (state.data.silicon || 0) - amount;
        _pushHistory('spend', -amount, reason || 'spend');
        bus.emit('silicon:changed', { balance: state.data.silicon, delta: -amount, reason: String(reason || 'spend') });
        bus.emit('state:changed', state.data);
        return { ok: true, balance: state.data.silicon };
    },

    // [FIX TUKAR SIL] Potong SIL SERVER-DULU (tanpa potong optimistis lokal).
    // Hadiah (mis. uang tunai) hanya boleh diberikan SETELAH fungsi ini mengembalikan ok:true.
    // Tidak ada potong-lokal -> tidak ada refund -> saldo tidak naik-turun, dan uang tidak bisa dobel.
    // request_id yang sama dipakai ulang saat retry (server idempoten: tidak memotong dua kali).
    async spendServer(amount, reason) {
        amount = Math.floor(amount);
        if (!amount || amount <= 0 || !isFinite(amount)) return { ok: false, reason: 'Jumlah tidak valid.' };
        if (!_cloudOn()) return CLOUD_REQUIRED;
        var BUSINESS = /insufficient_silicon|invalid_amount|invalid_request|not_authenticated|not_signed_in/i;
        var reqId = 'sp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        _epoch++;
        try {
            var res = null;
            for (var i = 0; i < 3; i++) {
                try { res = await CloudService.spendSiliconServer(amount, reqId, reason || 'spend'); }
                catch (e) { res = { ok: false, reason: (e && e.message) || 'network' }; }
                if (res && res.ok) break;
                if (res && BUSINESS.test(String(res.reason || '') + ' ' + String(res.code || ''))) break;
                await new Promise(function (r) { setTimeout(r, 700 * (i + 1)); });
            }
            if (!res || !res.ok) {
                var msg = String((res && res.reason) || '');
                if (/insufficient_silicon/i.test(msg)) return { ok: false, reason: 'Silicon tidak cukup.' };
                return { ok: false, reason: 'Koneksi ke server gagal. SIL tidak dipotong, coba lagi.' };
            }
            if (typeof res.balance === 'number') this.applyServerBalance(res.balance);
            return { ok: true, balance: state.data.silicon || 0, spent: amount };
        } finally {
            _epoch++;
        }
    },

    // Bayar biaya `amount` SIL. Sesuai mode dompet, sebagian/semua boleh dibayar dengan uang ($).
    // Hasil: { ok, balance, silSpent, cashSpent }.
    spend(amount, reason) {
        amount = Math.floor(amount);
        if (!amount || amount <= 0 || !isFinite(amount)) return { ok: false, reason: 'Jumlah tidak valid.' };
        if (!_cloudOn()) return CLOUD_REQUIRED;
        var plan = this.quote(amount);
        if (!plan.ok) return { ok: false, reason: 'Silicon & uang tidak cukup.' };
        if (plan.sil > 0) {
            var r = this.spendRaw(plan.sil, reason);
            if (!r.ok) return r;
        }
        if (plan.cash > 0) {
            state.addCash(-plan.cash);
            if (plan.sil === 0) _pushHistory('cashpay', 0, (reason || 'spend') + ' [$' + plan.cash + ']');
            bus.emit('wallet:paid-with-cash', { sil: amount, cash: plan.cash, reason: reason });
        }
        return { ok: true, balance: state.data.silicon || 0, silSpent: plan.sil, cashSpent: plan.cash };
    },

    // [v2027.5a] Set saldo dari server (dipakai CloudSync pull).
    applyServerBalance(newBalance) {
        newBalance = Math.max(0, Math.floor(newBalance || 0));
        var old = state.data.silicon || 0;
        var firstConfirm = !_serverConfirmed;
        _serverConfirmed = true; _serverFailed = false;
        if (old === newBalance) {
            if (firstConfirm) { bus.emit('silicon:changed', { balance: newBalance, delta: 0, fromServer: true }); }
            _persistSoon();
            return { ok: true, balance: newBalance, changed: false };
        }
        var delta = newBalance - old;
        _epoch++;
        state.data.silicon = newBalance;
        _persistSoon();
        _pushHistory('sync', delta, 'server-sync');
        bus.emit('silicon:changed', { balance: newBalance, delta: delta, fromServer: true });
        bus.emit('state:changed', state.data);
        return { ok: true, balance: newBalance, changed: true };
    },


    // ============================================================
    // RISET — unlock & boost pakai SIL
    // ============================================================
    // Harga bayar SIL sebagai pengganti uang tunai.
    researchUnlockCost(node) {
        var c = SILICON_COSTS.research;
        return Math.round(_clamp((node.durationDays || 0) * c.unlockPerDay, c.unlockMin, c.unlockMax));
    },
    // Harga menyelesaikan riset aktif sekarang (berdasar sisa hari-progress).
    researchFinishCost(entry) {
        var c = SILICON_COSTS.research;
        var remaining = Math.max(0, (entry.durationDays || 0) - (entry.progressDays || 0));
        return Math.round(_clamp(Math.ceil(remaining * c.finishPerDay), c.finishMin, c.finishMax));
    },
    // Harga satu paket boost (+N hari progress).
    researchBoostCost() {
        var c = SILICON_COSTS.research;
        return Math.max(c.boostMin, Math.ceil(c.boostDays * c.boostPerDay));
    },

    // Ringkasan opsi SIL untuk satu node (dipakai UI modal detail).
    // return { state:'startable'|'running'|'done'|'blocked', reason?, unlockCost, instantCost, finishCost, boostCost, boostDays, canBoost }
    getResearchOptions(kind, nodeId) {
        var sys = _sys(kind), node = _node(kind, nodeId);
        var out = { state: 'blocked', reason: '', unlockCost: 0, instantCost: 0, finishCost: 0,
                    boostCost: this.researchBoostCost(), boostDays: SILICON_COSTS.research.boostDays, canBoost: false };
        if (!sys || !node) { out.reason = 'Node tidak ditemukan.'; return out; }

        out.unlockCost = this.researchUnlockCost(node);
        var st = sys.getNodeStatus(nodeId, { ignoreCash: true });

        if (st.status === 'done') { out.state = 'done'; return out; }
        if (st.status === 'running') {
            var list = (kind === 'chip' ? state.data.chipResearch : state.data.research).active;
            var entry = list.find(function (e) { return e.nodeId === nodeId; });
            out.state = 'running';
            if (entry) {
                out.finishCost = this.researchFinishCost(entry);
                var remaining = entry.durationDays - entry.progressDays;
                out.canBoost = remaining > SILICON_COSTS.research.boostDays;
            }
            return out;
        }
        if (st.status === 'available') {
            out.state = 'startable';
            // Unlock instan = bayar unlock + selesaikan penuh (progress 0).
            var c = SILICON_COSTS.research;
            out.instantCost = out.unlockCost + Math.round(_clamp(Math.ceil((node.durationDays || 0) * c.finishPerDay), c.finishMin, c.finishMax));
            return out;
        }
        out.reason = st.reason || '';
        return out;
    },

    // Mulai riset dengan SIL (tanpa uang tunai). instant=true → langsung selesai.
    unlockResearch(kind, nodeId, instant) {
        var sys = _sys(kind);
        if (!sys) return { ok: false, reason: 'Game belum siap.' };
        var opt = this.getResearchOptions(kind, nodeId);
        if (opt.state !== 'startable') return { ok: false, reason: opt.reason || 'Belum bisa dimulai.' };

        var cost = instant ? opt.instantCost : opt.unlockCost;
        if (!this.canAfford(cost)) return { ok: false, reason: 'Silicon tidak cukup (' + cost + ' SIL).', need: cost };

        var sp = this.spend(cost, (instant ? 'unlock-instant:' : 'unlock:') + nodeId);
        if (!sp.ok) return sp;

        var res = sys.startResearch(nodeId, { paidWithSilicon: true });
        if (!res.ok) { this._refundPay(sp, 'unlock:' + nodeId); return res; }
        if (instant) sys.boostResearch(nodeId, Infinity);
        bus.emit('silicon:action-done', { id: 'unlock', cost: cost });
        return { ok: true, spent: cost, instant: !!instant };
    },

    // mode: 'boost' (+N hari) | 'finish' (selesai sekarang)
    boostResearch(kind, nodeId, mode) {
        var g = window.__game;
        if (!g) return { ok: false, reason: 'Game belum siap.' };

        // === [TAMBAHAN v2028.3] DUKUNGAN PERCEPATAN OS ===
        if (kind === 'os') {
            var d = state.data.os.developing;
            if (!d || d.versionString !== nodeId) return { ok: false, reason: 'Pengembangan OS tidak ditemukan.' };
            
            // [FIX] Sama dengan riset tech/chip: 'boost' hanya ditagih harga satu paket boost; harga
            // 'selesai' hanya bila diminta atau sisa waktu <= satu paket boost.
            var osRemaining = Math.max(0, (d.durationDays || 0) - (d.progressDays || 0));
            var finish = (mode === 'finish') || (mode === 'instant') || osRemaining <= SILICON_COSTS.research.boostDays;
            var cost = finish ? this.researchFinishCost(d) : this.researchBoostCost();

            if (!this.canAfford(cost)) return { ok: false, reason: 'Silicon tidak cukup (' + cost + ' SIL).', need: cost };

            var sp = this.spend(cost, (finish ? 'finish-os:' : 'boost-os:') + nodeId);
            if (!sp.ok) return sp;
            
            var res = g.os.boostResearch(nodeId, finish ? Infinity : SILICON_COSTS.research.boostDays);
            if (!res.ok) { this._refundPay(sp, 'boost-os:' + nodeId); return res; }
            
            bus.emit('silicon:action-done', { id: 'boost', cost: cost });
            return { ok: true, spent: cost, completed: !!res.completed };
        }
        // =================================================

        var sys = _sys(kind);
        if (!sys) return { ok: false, reason: 'Game belum siap.' };
        var opt = this.getResearchOptions(kind, nodeId);
        if (opt.state !== 'running') return { ok: false, reason: 'Riset tidak sedang berjalan.' };

        var finishTech = (mode === 'finish') || !opt.canBoost;
        var costTech = finishTech ? opt.finishCost : opt.boostCost;
        if (!this.canAfford(costTech)) return { ok: false, reason: 'Silicon tidak cukup (' + costTech + ' SIL).', need: costTech };

        var spTech = this.spend(costTech, (finishTech ? 'finish:' : 'boost:') + nodeId);
        if (!spTech.ok) return spTech;

        var resTech = sys.boostResearch(nodeId, finishTech ? Infinity : opt.boostDays);
        if (!resTech.ok) { this._refundPay(spTech, 'boost:' + nodeId); return resTech; }
        bus.emit('silicon:action-done', { id: 'boost', cost: costTech });
        return { ok: true, spent: costTech, completed: !!resTech.completed };
    },

    // Kembalikan pembayaran gabungan (SIL + uang) dari hasil spend().
    _refundPay(sp, reason) {
        if (!sp) return;
        if (sp.cashSpent) state.addCash(sp.cashSpent);
        if (sp.silSpent) this._refund(sp.silSpent, reason);
    },

    _refund(amount, reason) {
        _epoch++;
        state.data.silicon = (state.data.silicon || 0) + amount;
        _pushHistory('earn', amount, 'refund:' + reason);
        // [FIX] refund:true -> CloudSync membatalkan belanja yang belum terkirim ke server.
        bus.emit('silicon:changed', { balance: state.data.silicon, delta: amount, reason: 'refund:' + reason, refund: true, amount: amount });
        bus.emit('state:changed', state.data);
    },

    // ============================================================
    // PERCEPATAN WAKTU (2x / 5x / 10x) — bayar SIL, ada batas waktu
    // ============================================================
    speedPack(speed) {
        var cfg = SILICON_COSTS.speed;
        var p = cfg.packs[speed];
        return p ? { speed: speed, cost: cfg.cost, seconds: p.seconds } : null;
    },

    getSpeedBoost() {
        var g = window.__game;
        return (g && g.timeSystem) ? g.timeSystem.getBoost() : null;
    },

    // [FREE BOOST] Info jatah gratis. Window 24 jam NYATA dimulai dari pemakaian gratis pertama.
    // Bila jam perangkat dimundurkan (windowStart di masa depan), window dianggap baru mulai sekarang.
    getFreeSpeedInfo() {
        var cfg = SILICON_COSTS.speed;
        var max = cfg.freePerWindow || 0;
        var winMs = (cfg.freeWindowHours || 24) * 3600 * 1000;
        var d = state.data;
        if (!d.freeSpeed || typeof d.freeSpeed !== 'object') d.freeSpeed = { used: 0, windowStart: 0 };
        var fs = d.freeSpeed, now = Date.now();
        if (fs.windowStart > now) fs.windowStart = now;
        if (fs.used > 0 && now - fs.windowStart >= winMs) { fs.used = 0; fs.windowStart = 0; }
        var used = Math.max(0, Math.min(max, fs.used | 0));
        return {
            max: max, used: used, left: Math.max(0, max - used),
            resetInMs: (used > 0 && fs.windowStart) ? Math.max(0, fs.windowStart + winMs - now) : 0
        };
    },

    // Beli / perpanjang boost. Kecepatan beda → sisa waktu dikonversi (nilai hari-game tetap).
    buySpeed(speed) {
        var cfg = SILICON_COSTS.speed;
        var pack = this.speedPack(speed);
        if (!pack) return { ok: false, reason: 'Kecepatan tidak valid.' };
        var g = window.__game;
        if (!g || !g.timeSystem) return { ok: false, reason: 'Game belum siap.' };

        var cur = g.timeSystem.getBoost();
        var carry = cur ? (cur.remainingSec * cur.speed / speed) : 0;
        var total = carry + pack.seconds;
        if (total > cfg.maxSeconds) {
            return { ok: false, reason: 'limit', maxSeconds: cfg.maxSeconds };
        }

        // [FREE BOOST] Pakai jatah gratis dulu; bila habis baru bayar SIL.
        var free = this.getFreeSpeedInfo();
        if (free.left > 0) {
            try {
                g.timeSystem.activateBoost(speed, total);
            } catch (err) {
                console.error('[SiliconService] activateBoost gagal:', err);
                return { ok: false, reason: 'Boost gagal diaktifkan.' };
            }
            var fs = state.data.freeSpeed;
            if (!fs.used) fs.windowStart = Date.now();
            fs.used = (fs.used | 0) + 1;
            bus.emit('silicon:action-done', { id: 'speed', cost: 0, free: true });
            bus.emit('state:changed', state.data);
            return { ok: true, free: true, spent: 0, speed: speed, remainingSec: total, freeLeft: free.left - 1 };
        }

        if (!this.canAfford(pack.cost)) {
            return { ok: false, reason: 'Silicon tidak cukup (' + pack.cost + ' SIL).', need: pack.cost };
        }
        var sp = this.spend(pack.cost, 'speed:' + speed + 'x');
        if (!sp.ok) return sp;

        try {
            g.timeSystem.activateBoost(speed, total);
        } catch (err) {
            console.error('[SiliconService] activateBoost gagal:', err);
            this._refundPay(sp, 'speed:' + speed + 'x');
            return { ok: false, reason: 'Boost gagal diaktifkan, pembayaran dikembalikan.' };
        }
        bus.emit('silicon:action-done', { id: 'speed', cost: pack.cost });
        return { ok: true, spent: pack.cost, speed: speed, remainingSec: total };
    },

    getHistory() {
        return (state.data.siliconHistory || []).slice();
    },

    claimDailyLogin() {
        if (!_cloudOn()) return { ok: false, reason: 'cloud_required' };   // server mengklaim saat login
        var d = state.data;
        if (!d.dailyLogin || typeof d.dailyLogin !== 'object') {
            d.dailyLogin = { lastClaimDate: null, streak: 0 };
        }
        var today = new Date().toISOString().slice(0, 10);
        if (d.dailyLogin.lastClaimDate === today) {
            return { ok: false, reason: 'already_claimed' };
        }
        var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        var streak = (d.dailyLogin.lastClaimDate === yesterday) ? (d.dailyLogin.streak + 1) : 1;
        var reward = Math.min(streak, 7);
        d.dailyLogin.lastClaimDate = today;
        d.dailyLogin.streak = streak;
        // Optimistis lokal. Saat login cloud, CloudSync mendengar reason 'daily-login' lalu meminta
        // SERVER mengklaim hadiah (tanggal & streak dihitung server) dan saldo ditarik lewat jalur sinkron
        // yang aman terhadap belanja tertunda. (Dulu: klaim server memakai window.__game yang belum ada
        // saat boot -> hadiah hilang saat sinkron, dan tanggal lokal mengunci klaim ulang.)
        this.add(reward, 'daily-login');
        return { ok: true, amount: reward, streak: streak };
    },

    runAction(actionId) {
        var def = SILICON_ACTIONS.find(function (a) { return a.id === actionId; });
        if (!def) return { ok: false, reason: 'Aksi tidak dikenal.' };
        if (!def.ready) return { ok: false, reason: 'Aksi belum tersedia.' };
        if (!this.canAfford(def.cost)) return { ok: false, reason: 'Silicon & uang tidak cukup (' + def.cost + ' SIL).' };

        var game = window.__game;
        if (!game) return { ok: false, reason: 'Game belum siap.' };

        // ---------- Validasi spesifik ----------
        if (actionId === 'research') {
            if (!(state.data.research.active || []).length) return { ok: false, reason: 'Tidak ada riset berjalan.' };
        }
        if (actionId === 'chipResearch') {
            if (!(state.data.chipResearch.active || []).length) return { ok: false, reason: 'Tidak ada riset chip berjalan.' };
        }
        if (actionId === 'dev') {
            if (!state.data.products.development) return { ok: false, reason: 'Tidak ada produk sedang dikembangkan.' };
        }
        if (actionId === 'fabBuild') {
            if (!state.data.fab || !state.data.fab.upgrade) return { ok: false, reason: 'Tidak ada build/upgrade fab.' };
        }
        if (actionId === 'fabProd') {
            if (!state.data.fab || !state.data.fab.producing) return { ok: false, reason: 'Tidak ada produksi fab.' };
        }
        if (actionId === 'osBugs') {
            var bugs = (state.data.os && state.data.os.bugs) || [];
            if (!bugs.length) return { ok: false, reason: 'Tidak ada bug OS.' };
        }
        if (actionId === 'morale') {
            var staff = state.data.staff || [];
            if (!staff.length) return { ok: false, reason: 'Belum ada staff.' };
            var need = staff.some(function (s) { return (s.morale || 0) < 100; });
            if (!need) return { ok: false, reason: 'Semua staff sudah morale penuh.' };
        }
        if (actionId === 'rep') {
            var rep = state.data.market.reputation || 0;
            if (rep >= 100) return { ok: false, reason: 'Reputasi sudah maksimal.' };
        }

        // ---------- Charge SIL ----------
        var spendRes = this.spend(def.cost, actionId);
        if (!spendRes.ok) return spendRes;

        // ---------- Eksekusi ----------
        try {
            if (actionId === 'research') {
                var nodes = (state.data.research.active || []).map(function (r) { return r.nodeId; });
                nodes.forEach(function (nodeId) {
                    if (game.research) game.research.boostResearch(nodeId, Infinity);
                });
                ToastService.success(t('silicon.msg.research') || 'Research completed instantly.');
            } else if (actionId === 'chipResearch') {
                var chipNodes = (state.data.chipResearch.active || []).map(function (r) { return r.nodeId; });
                chipNodes.forEach(function (nodeId) {
                    if (game.chipResearch) game.chipResearch.boostResearch(nodeId, Infinity);
                });
                ToastService.success(t('silicon.msg.chipResearch') || 'Chip research completed instantly.');
            } else if (actionId === 'dev') {
                // Selesaikan sisa pengembangan: majukan tiap fase lewat jalur tick normal
                var guard = 0;
                while (state.data.products.development && guard++ < 6) {
                    var dv = state.data.products.development;
                    dv.phaseProgressDays = dv.phaseDurationDays;
                    dv.lastProcessedMinute = state.data.time.elapsedGameMinutes - 60;
                    game.products._tickDevelopment();
                }
                ToastService.success(t('silicon.msg.dev') || 'Product development accelerated.');
            } else if (actionId === 'fabBuild') {
                var u = state.data.fab.upgrade;
                if (u) {
                    u.progressDays = u.durationDays;
                    u.lastProcessedMinute = state.data.time.elapsedGameMinutes - 60;
                    if (game.fab && typeof game.fab._tickBuildUpgrade === 'function') {
                        game.fab._tickBuildUpgrade();
                    }
                }
                ToastService.success(t('silicon.msg.fabBuild') || 'Fab build/upgrade completed instantly.');
            } else if (actionId === 'fabProd') {
                var p = state.data.fab.producing;
                if (p) {
                    p.progressUnits = p.totalUnits;
                    p.lastProcessedMinute = state.data.time.elapsedGameMinutes - 60;
                    if (game.fab && typeof game.fab._tickProduction === 'function') {
                        game.fab._tickProduction();
                    }
                }
                ToastService.success(t('silicon.msg.fabProd') || 'Fab production completed instantly.');
            } else if (actionId === 'osBugs') {
                var before = (state.data.os.bugs || []).length;
                state.data.os.bugs = [];
                bus.emit('state:changed', state.data);
                ToastService.success(t('silicon.msg.osBugs', { n: before }) || ('Fixed ' + before + ' bugs.'));
            } else if (actionId === 'morale') {
                (state.data.staff || []).forEach(function (s) { s.morale = 100; });
                bus.emit('state:changed', state.data);
                ToastService.success(t('silicon.msg.morale') || 'Staff morale restored.');
            } else if (actionId === 'rep') {
                state.addReputation(20);
                ToastService.success(t('silicon.msg.rep') || 'Reputation +20.');
            }
        } catch (err) {
            console.error('[SiliconService] Aksi gagal:', actionId, err);
            this._refundPay(spendRes, actionId);
            return { ok: false, reason: 'Aksi gagal, pembayaran dikembalikan.' };
        }

        bus.emit('silicon:action-done', { id: actionId, cost: def.cost });
        return { ok: true, spent: def.cost };
    }
};
