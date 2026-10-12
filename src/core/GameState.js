/**
 * GameState M0 — container minimal dengan data DEMO yang jelas ditandai.
 * Tidak ada logika ekonomi/simulasi. Hanya untuk keperluan render UI.
 */

export function createInitialState() {
  return {
    isDemo: true,
    company: {
      name: 'Nova Mobile',
      initial: 'N',
      founded: 2000,
      hq: 'Bandung, ID',
    },
    time: { year: 2000, month: 3 },
    kpis: {
      cash: 500_000,
      monthlyRevenue: 0,
      reputation: 12,
      employees: 4,
      productsReleased: 0,
      marketShare: 0,
    },
    progress: {
      label: 'Fondasi Sistem',
      current: 25,
      target: 100,
      stages: [
        { id: 'm0', label: 'M0 — Dashboard & Shell',  state: 'done'   },
        { id: 'm1', label: 'M1 — Riset & Tech Tree',  state: 'active' },
        { id: 'm2', label: 'M2 — Desain Produk',       state: 'locked' },
        { id: 'm3', label: 'M3 — Pasar & Penjualan',   state: 'locked' },
      ],
    },
    activity: [
      { at: 'Mar 2000', text: 'Perusahaan didirikan di Bandung.', kind: 'info' },
      { at: 'Mar 2000', text: 'Kantor kecil disewa untuk 4 orang.', kind: 'info' },
      { at: 'Mar 2000', text: 'Perekrutan awal: 2 engineer, 1 desainer, 1 marketer.', kind: 'info' },
      { at: 'Mar 2000', text: 'Riset teknologi GSM dimulai.', kind: 'info' },
    ],
    timeline: [
      { year: 2000, title: 'Awal Mula', desc: 'Smartphone masih barang mewah. Peluang besar terbuka.', state: 'active' },
      { year: 2003, title: 'Era Kamera', desc: 'Kamera mulai menjadi standar pada perangkat mobile.', state: 'locked' },
      { year: 2007, title: 'Revolusi Layar Sentuh', desc: 'Industri berubah total. Fondasi ekosistem baru dimulai.', state: 'locked' },
      { year: 2010, title: 'Era Aplikasi', desc: 'Ekonomi aplikasi meledak. Skala menjadi penentu.', state: 'locked' },
    ],
  };
}

class GameStateStore {
  constructor() {
    this._data = createInitialState();
  }
  get() { return this._data; }
  reset() { this._data = createInitialState(); }
}

export const state = new GameStateStore();
