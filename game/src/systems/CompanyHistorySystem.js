// FILE: src/systems/CompanyHistorySystem.js  (BARU)
// ============================================================
// CompanyHistorySystem — catatan sejarah perusahaan, tahun demi tahun.
//
// Tidak membuat aksi baru. Sistem ini hanya MENDENGARKAN event yang
// sudah dikirim sistem lain (produk, riset, OS, pabrik, fab, pinjaman,
// viral, milestone), sehingga semua yang dikerjakan pemain tercatat.
//
// Dua lapis data di data.history:
//   1. chronicle : daftar peristiwa detail (dibatasi CHRONICLE_MAX, yang terlama dipangkas).
//   2. years     : ringkasan per tahun (kecil, tidak dipangkas). Nilai akhir
//                  tahun dikunci saat tahun berganti.
// Milestone yang sudah ada di save lama dimasukkan ke chronicle sekali saja.
// ============================================================
import { bus } from '../core/EventBus.js';
import { computeOsAdoption } from './OsAdoptionModel.js';
import { PLANT_TYPES } from '../data/material-plants.data.js';

export const CHRONICLE_MAX = 1200;

export const HISTORY_CATEGORIES = [
    { id: 'product',   label: 'Produk' },
    { id: 'research',  label: 'Riset' },
    { id: 'chip',      label: 'Chip' },
    { id: 'os',        label: 'OS' },
    { id: 'infra',     label: 'Pabrik & Fab' },
    { id: 'finance',   label: 'Keuangan' },
    { id: 'public',    label: 'Publik' },
    { id: 'industry',  label: 'Industri' },
    { id: 'milestone', label: 'Milestone' }
];

function _emptyYear() {
    return {
        revenue: 0, net: 0, unitsSold: 0,
        launched: 0, discontinued: 0,
        researchDone: 0, chipDone: 0,
        osVersions: 0, infra: 0,
        loans: 0, viral: 0, milestones: 0,
        closed: false,
        endCash: null, endReputation: null, endOsUsers: null, endProducts: null
    };
}

function _emptyHistory() {
    return { startYear: null, chronicle: [], years: {}, seq: 0, legacyImported: false };
}

export class CompanyHistorySystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('state:hydrated', () => this._onHydrated()));
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('product:released', (p) => this._onProductReleased(p)));
        this._unsubs.push(bus.on('product:discontinued', (p) => this._onProductDiscontinued(p)));
        this._unsubs.push(bus.on('product:development-started', (p) => this._add('product', 'Mulai kembangkan: ' + (p.name || '-'))));
        this._unsubs.push(bus.on('product:milestone-sales', (p) => this._add('product', (p.productName || 'Produk') + ': ' + (p.milestone || 'milestone penjualan'))));
        this._unsubs.push(bus.on('product:sale', (p) => this._onSale(p)));
        this._unsubs.push(bus.on('economy:month-processed', (e) => this._onMonthProcessed(e)));
        this._unsubs.push(bus.on('research:completed', (p) => this._onResearch(p)));
        this._unsubs.push(bus.on('chip-research:completed', (p) => this._onChipResearch(p)));
        this._unsubs.push(bus.on('chip:released', (p) => this._add('chip', 'Chip dirilis: ' + (p.name || '-'))));
        this._unsubs.push(bus.on('os:created', (p) => this._add('os', 'OS ' + (p.name || '') + ' didirikan')));
        this._unsubs.push(bus.on('os:version-released', (p) => this._onOsVersion(p)));
        this._unsubs.push(bus.on('os:app-released', (p) => this._add('os', 'Aplikasi dirilis: ' + (p.name || '-'))));
        this._unsubs.push(bus.on('os:bug-appeared', (p) => this._add('os', 'Bug terdeteksi: ' + ((p.bug && p.bug.name) || '-'), p.bug && p.bug.severity ? 'Severity ' + p.bug.severity : '')));
        this._unsubs.push(bus.on('os:bug-patched', (p) => this._add('os', 'Bug diperbaiki: ' + (p.name || '-'))));
        this._unsubs.push(bus.on('plant:built', (p) => this._onInfra('Pabrik ' + _plantName(p.typeId) + ' dibangun', p.level)));
        this._unsubs.push(bus.on('plant:upgraded', (p) => this._onInfra('Pabrik ' + _plantName(p.typeId) + ' di-upgrade', p.level)));
        this._unsubs.push(bus.on('fab:built', (p) => this._onInfra('Fab chip dibangun', p.level)));
        this._unsubs.push(bus.on('fab:upgraded', (p) => this._onInfra('Fab chip di-upgrade', p.level)));
        this._unsubs.push(bus.on('economy:loan-taken', (p) => this._onLoan(p)));
        this._unsubs.push(bus.on('feedback:viral-started', (p) => this._onViral(p)));
        this._unsubs.push(bus.on('competitor:life-event', (p) => this._add('industry', (p.competitorName || 'Kompetitor') + ': ' + (p.text || ''))));
        this._unsubs.push(bus.on('state:milestone-added', (p) => this._onMilestone(p)));
        console.info('[CompanyHistorySystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    // ============================================================
    // DATA
    // ============================================================
    _h() {
        const data = this.state.data;
        if (!data.history || typeof data.history !== 'object') data.history = _emptyHistory();
        return data.history;
    }

    _yr(year) {
        const h = this._h();
        const key = String(year);
        if (!h.years[key]) h.years[key] = _emptyYear();
        return h.years[key];
    }

    _onHydrated() {
        const data = this.state.data;
        const h = this._h();
        if (!Array.isArray(h.chronicle)) h.chronicle = [];
        if (!h.years || typeof h.years !== 'object') h.years = {};
        if (typeof h.seq !== 'number') h.seq = 0;
        if (h.startYear == null) h.startYear = data.time.currentYear;
        this._yr(data.time.currentYear);

        // Save lama: masukkan milestone yang sudah ada, sekali saja.
        if (!h.legacyImported) {
            (data.milestones || []).forEach(m => {
                h.chronicle.push({
                    id: ++h.seq, year: m.year, month: m.month, day: m.day || 1,
                    cat: 'milestone', title: m.text || '', detail: ''
                });
            });
            h.chronicle.sort((a, b) => (a.year - b.year) || (a.month - b.month) || (a.day - b.day) || (a.id - b.id));
            if (h.chronicle.length > CHRONICLE_MAX) h.chronicle.splice(0, h.chronicle.length - CHRONICLE_MAX);
            h.legacyImported = true;
        }
    }

    _add(cat, title, detail) {
        const data = this.state.data;
        const h = this._h();
        const t = data.time;
        h.chronicle.push({
            id: ++h.seq, year: t.currentYear, month: t.currentMonth, day: t.currentDay,
            cat: cat, title: String(title || ''), detail: String(detail || '')
        });
        if (h.chronicle.length > CHRONICLE_MAX) h.chronicle.splice(0, h.chronicle.length - CHRONICLE_MAX);
    }

    // ============================================================
    // HANDLERS
    // ============================================================
    _onMonthChanged(snap) {
        if (!snap || snap.currentMonth !== 1) return;
        // Awal tahun baru: kunci nilai akhir tahun sebelumnya.
        const closing = snap.currentYear - 1;
        const data = this.state.data;
        const y = this._yr(closing);
        if (y.closed) return;
        const adoption = computeOsAdoption(data);
        y.closed = true;
        y.endCash = Math.round(data.cash || 0);
        y.endReputation = Math.round((data.market && data.market.reputation) || 0);
        y.endOsUsers = Math.round(adoption.activeUsers || 0);
        y.endProducts = (data.products.catalog || []).filter(p => p.status === 'selling').length;
        this._yr(snap.currentYear);
    }

    _onSale(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.revenue += p.revenue || 0;
        y.unitsSold += p.sold || 0;
    }

    _onMonthProcessed(e) {
        const y = this._yr(this.state.data.time.currentYear);
        y.net += e.net || 0;
    }

    _onProductReleased(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.launched += 1;
        this._add('product', 'Rilis produk: ' + (p.name || '-'), typeof p.score === 'number' ? 'Skor ulasan ' + Math.round(p.score) : '');
    }

    _onProductDiscontinued(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.discontinued += 1;
        const prod = (this.state.data.products.catalog || []).find(x => x.id === p.productId);
        this._add('product', 'Produk dihentikan: ' + (prod ? prod.name : '-'), p.fireSale ? 'Obral stok' : '');
    }

    _onResearch(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.researchDone += 1;
        this._add('research', 'Riset selesai: ' + (p.name || '-'));
    }

    _onChipResearch(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.chipDone += 1;
        this._add('chip', 'Riset chip selesai: ' + (p.name || '-'));
    }

    _onOsVersion(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.osVersions += 1;
        const n = (p.features && p.features.length) || 0;
        this._add('os', 'Rilis ' + (p.versionString || 'versi baru'), n + ' fitur');
    }

    _onInfra(title, level) {
        const y = this._yr(this.state.data.time.currentYear);
        y.infra += 1;
        this._add('infra', title, level ? 'Level ' + level : '');
    }

    _onLoan(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.loans += 1;
        const rate = typeof p.interestRate === 'number' ? (p.interestRate * 100).toFixed(1) + '%/bulan' : '';
        this._add('finance', 'Pinjaman $' + Math.round(p.amount || 0).toLocaleString('en-US'), rate);
    }

    _onViral(p) {
        const y = this._yr(this.state.data.time.currentYear);
        y.viral += 1;
        const v = p.viral || {};
        this._add('public', 'Isu viral: ' + (v.title || 'tanpa judul'), v.text || '');
    }

    _onMilestone(p) {
        const m = p.milestone || {};
        const y = this._yr(this.state.data.time.currentYear);
        y.milestones += 1;
        this._add('milestone', m.text || 'Milestone');
    }
}

function _plantName(typeId) {
    const pt = PLANT_TYPES.find(p => p.id === typeId);
    return pt ? pt.name.replace(/^Pabrik\s+/, '') : '';
}
