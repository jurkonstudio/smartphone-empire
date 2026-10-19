// FILE: src/systems/WalletService.js  (BARU)
// ============================================================
// WalletService — "Dompet Universal".
// Uang ($) dan Silicon (SIL) bisa dipakai untuk membayar APA SAJA:
//   • Biaya berupa uang ($)  -> boleh ditutup dengan SIL.
//   • Biaya berupa SIL       -> boleh ditutup dengan uang (lihat SiliconService.spend).
// Aturan keamanan: SIL tidak pernah dibuat dari uang. Hanya ada pembayaran langsung,
// sehingga wallet server & ledger (hardening.sql) tetap konsisten.
// ============================================================
import { state } from '../core/GameState.js';
import { bus } from '../core/EventBus.js';
import { SiliconService } from './SiliconService.js';
import { WALLET, getCashPerSil } from '../data/silicon.data.js';

function _d() { return state.data; }

export var WalletService = {
    // ---------- Kurs & mode ----------
    getRate() { return getCashPerSil(_d().time && _d().time.currentYear); },

    // [FIX] Satu sumber kebenaran dengan SiliconService: 'auto' yang belum pernah dipilih pemain = 'strict'.
    getMode() { return SiliconService._payMode(); },
    setMode(mode) {
        if (WALLET.modes.indexOf(mode) < 0) return false;
        var d = _d();
        if (!d.settings || typeof d.settings !== 'object') d.settings = {};
        d.settings.payMode = mode;
        d.settings.payModeChosen = true; // persetujuan eksplisit pemain
        bus.emit('wallet:mode-changed', { mode: mode });
        bus.emit('state:changed', d);
        return true;
    },
    // Auto-bailout: SIL menutup kas yang akan minus saat tutup bulan.
    isRescueOn() { // default MATI: SIL tidak boleh terpakai tanpa persetujuan pemain
        var s = _d().settings;
        return !!(s && s.silRescue === true);
    },
    setRescue(on) {
        var d = _d();
        if (!d.settings || typeof d.settings !== 'object') d.settings = {};
        d.settings.silRescue = !!on;
        bus.emit('state:changed', d);
    },

    // ---------- Daya beli ----------
    // Total nilai (dalam $) yang bisa dipakai sesuai mode.
    getBuyingPower() {
        var cash = Math.max(0, _d().cash || 0);
        if (this.getMode() === 'strict') return cash;
        return cash + SiliconService.getBalance() * this.getRate();
    },

    // ---------- Biaya berupa UANG ($) ----------
    // Rencana bayar: { ok, cash, sil, change }. change = kembalian uang bila SIL dibulatkan ke atas.
    quote(costUSD) {
        costUSD = Math.max(0, Math.round(costUSD || 0));
        var d = _d(), mode = this.getMode(), rate = this.getRate();
        var cash = Math.max(0, d.cash || 0);
        var sil = SiliconService.getBalance();
        var plan = { ok: false, cost: costUSD, cash: 0, sil: 0, change: 0, rate: rate, mode: mode };

        if (costUSD === 0) { plan.ok = true; return plan; }

        // 'auto' untuk item berharga uang = cash_first.
        if (mode === 'auto' || mode === 'cash_first' || mode === 'strict') {
            if (cash >= costUSD) { plan.ok = true; plan.cash = costUSD; return plan; }
            if (mode === 'strict') return plan;
            var short = costUSD - cash;
            var silNeed = Math.ceil(short / rate);
            if (silNeed > sil) return plan;
            plan.ok = true; plan.cash = cash; plan.sil = silNeed;
            plan.change = silNeed * rate - short;
            return plan;
        }
        // sil_first
        var silAll = Math.ceil(costUSD / rate);
        if (silAll <= sil) {
            plan.ok = true; plan.sil = silAll; plan.change = silAll * rate - costUSD; return plan;
        }
        var covered = sil * rate;
        var rest = costUSD - covered;
        if (cash >= rest) { plan.ok = true; plan.sil = sil; plan.cash = rest; }
        return plan;
    },

    canAfford(costUSD) { return this.quote(costUSD).ok; },

    // Bayar biaya uang ($). return { ok, cash, sil, change, reason? }.
    pay(costUSD, reason) {
        var plan = this.quote(costUSD);
        if (!plan.ok) return { ok: false, reason: 'Uang & Silicon tidak cukup.', cash: 0, sil: 0, change: 0 };
        if (plan.sil > 0) {
            var sp = SiliconService.spendRaw(plan.sil, 'wallet:' + (reason || 'pay'));
            if (!sp.ok) return { ok: false, reason: sp.reason, cash: 0, sil: 0, change: 0 };
        }
        var net = plan.cash - plan.change; // uang keluar bersih (kembalian dikembalikan)
        if (net) state.addCash(-net);
        if (plan.sil > 0) bus.emit('wallet:paid-with-sil', { cost: plan.cost, sil: plan.sil, cash: plan.cash, change: plan.change, reason: reason });
        return { ok: true, cash: plan.cash, sil: plan.sil, change: plan.change };
    },

    // Kembalikan pembayaran (mis. aksi gagal setelah bayar).
    refund(result) {
        if (!result || !result.ok) return;
        var net = (result.cash || 0) - (result.change || 0);
        if (net) state.addCash(net);
        if (result.sil) SiliconService._refund(result.sil, 'wallet-refund');
    },

    // Teks bantu untuk UI: "$1,000 (≈ 1 SIL)".
    silEquivalent(costUSD) { return Math.ceil(Math.max(0, costUSD || 0) / this.getRate()); },

    // Pesan gagal standar.
    shortReason(costUSD) {
        var p = this.getBuyingPower();
        return 'Uang tidak cukup. Butuh $' + Math.round(costUSD).toLocaleString('en-US') +
               (this.getMode() === 'strict' ? '.' : ' (uang + SIL setara $' + Math.floor(p).toLocaleString('en-US') + ').');
    },

    // Dana darurat: tutup defisit kas (> 0) dengan SIL. Return jumlah $ yang ditutup.
    rescueDeficit(deficitUSD) {
        if (!this.isRescueOn() || !(deficitUSD > 0)) return 0;
        var rate = this.getRate();
        var need = Math.ceil(deficitUSD / rate);
        var use = Math.min(need, SiliconService.getBalance());
        if (use <= 0) return 0;
        var sp = SiliconService.spendRaw(use, 'wallet:rescue');
        if (!sp.ok) return 0;
        var covered = Math.min(deficitUSD, use * rate);
        // Kelebihan pembulatan dikembalikan sebagai uang oleh pemanggil (nilai penuh use*rate).
        bus.emit('wallet:rescue', { sil: use, covered: use * rate });
        return use * rate;
    }
};
