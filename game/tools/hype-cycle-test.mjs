// Tes HypeCycleSystem: aturan satu flagship per tahun, antisipasi, peluruhan, teaser, kebocoran.
import { HypeCycleSystem } from '../src/systems/HypeCycleSystem.js';
import { HYPE_BALANCE as H } from '../src/data/hype.data.js';

let fails = 0;
function ok(cond, msg) { console.log((cond ? 'ok: ' : 'GAGAL: ') + msg); if (!cond) fails++; }
function mkState(year, month, rngVal) {
    const logs = [];
    const st = { data: { time: { currentYear: year, currentMonth: month } }, addLog(t) { logs.push(t); } };
    const sys = new HypeCycleSystem(st, () => rngVal);
    return { st, sys, logs };
}
function setTime(st, y, m) { st.data.time.currentYear = y; st.data.time.currentMonth = m; }

// 1. Satu flagship per tahun
{
    const { st, sys } = mkState(2030, 3, 0);
    ok(sys.checkFlagshipSlot().ok, 'awal: slot flagship tersedia');
    sys.onFlagshipReleased(null);
    const c = sys.checkFlagshipSlot();
    ok(!c.ok && c.reason.includes('2031'), 'setelah rilis 2030: tahun yang sama ditolak, pesan menyebut 2031');
    setTime(st, 2031, 1);
    ok(sys.checkFlagshipSlot().ok, 'tahun 2031: slot flagship kembali tersedia');
}

// 2. Peluncuran menaikkan antisipasi dan permintaan
{
    const { sys } = mkState(2030, 9, 0);
    const before = sys.getDemandFactor();
    sys.onFlagshipReleased(null);
    ok(Math.abs(sys.getAnticipation() - H.launchSpike * 0.8) < 1e-9, 'tanpa produk (pihak ketiga): lonjakan 0.8x = ' + H.launchSpike * 0.8);
    ok(sys.getDemandFactor() > before, 'pengali permintaan naik setelah peluncuran');
}

// 3. Batas atas antisipasi dan bonus permintaan
{
    const { sys } = mkState(2030, 9, 0);
    for (let i = 0; i < 20; i++) sys._add(10, '');
    ok(sys.getAnticipation() === H.maxAnticipation, 'antisipasi dibatasi maksimum ' + H.maxAnticipation);
    ok(sys.getDemandFactor() <= 1 + H.maxDemandBonus + 1e-9, 'bonus permintaan dibatasi ' + H.maxDemandBonus);
}

// 4. Peluruhan bulanan dan pembulatan ke nol
{
    const { st, sys } = mkState(2030, 9, 0);
    sys._add(40, '');
    sys._onMonth();
    ok(Math.abs(sys.getAnticipation() - 40 * H.decayPerMonth) < 1e-9, 'antisipasi meluruh ' + H.decayPerMonth + ' per bulan');
    sys._add(-sys.getAnticipation(), '');
    sys._add(0.3, '');
    sys._onMonth();
    ok(sys.getAnticipation() === 0, 'nilai di bawah minKeep dibulatkan ke 0');
}

// 5. Teaser pada bulan ke-6 setelah rilis, kebocoran pada bulan ke-9
{
    const { st, sys, logs } = mkState(2030, 3, 0);
    sys.onFlagshipReleased(null);
    const base = sys.getAnticipation();
    // lewati ke bulan ke-6 (Maret 2030 + 6 = September 2030)
    for (let k = 1; k <= 6; k++) {
        let y = 2030, m = 3 + k; if (m > 12) { m -= 12; y++; }
        setTime(st, y, m); sys._onMonth();
    }
    ok(logs.some(l => l.includes('Teaser')), 'teaser tercatat tepat di bulan ke-6');
    const afterTeaser = sys.getAnticipation();
    ok(afterTeaser > base * Math.pow(H.decayPerMonth, 6) - 1e-9, 'teaser menambah antisipasi di atas peluruhan murni');
}
{
    const { st, sys, logs } = mkState(2030, 3, 0.1); // rng < leakChance → kebocoran positif
    sys.onFlagshipReleased(null);
    for (let k = 1; k <= 9; k++) { let y = 2030, m = 3 + k; if (m > 12) { m -= 12; y++; } setTime(st, y, m); sys._onMonth(); }
    ok(logs.some(l => l.includes('spesifikasi')), 'kebocoran positif tercatat pada bulan ke-9 (rng rendah)');
}
{
    const { st, sys, logs } = mkState(2030, 3, 0.99); // rng tinggi → kebocoran negatif
    sys.onFlagshipReleased(null);
    for (let k = 1; k <= 9; k++) { let y = 2030, m = 3 + k; if (m > 12) { m -= 12; y++; } setTime(st, y, m); sys._onMonth(); }
    ok(logs.some(l => l.includes('spekulasi negatif')), 'kebocoran negatif tercatat pada bulan ke-9 (rng tinggi)');
}

// 6. Simpanan lama tanpa field hype: diisi otomatis
{
    const st = { data: { time: { currentYear: 2030, currentMonth: 1 } }, addLog() {} };
    const sys = new HypeCycleSystem(st, () => 0);
    ok(sys.getAnticipation() === 0 && st.data.hype !== undefined, 'simpanan lama: state hype dibuat otomatis');
}

// 7. v2: kualitas produk memengaruhi lonjakan dan kebocoran
function osStub(stab) { return { getCurrentStats() { return { stability: stab }; } }; }
const OWN = { config: { osOptionId: 'own:v1', chipId: 'cd_x1' }, techSnapshot: { levels: { display: 100, camera: 100, battery: 100, chip: 100, network: 100, performance: 100, software: 100, design: 100 } } };
const THIRD = { config: { osOptionId: 'android', chipId: 'snapdragon' }, techSnapshot: null };
{
    const { st, sys } = mkState(2030, 3, 0);
    sys.setSources({ os: osStub(80), chip: null });
    const a = sys.assessProduct(OWN);
    ok(a.ownOs && a.ownChip, 'produk sendiri dikenali (OS & chip)');
    ok(a.synergy === 0.1, 'sinergi OS + chip sendiri = +0.1');
    const b = sys.assessProduct(THIRD);
    ok(!b.ownOs && !b.ownChip && b.mult < a.mult, 'produk pihak ketiga lebih rendah dari produk sendiri');
    ok(b.mult >= 0.4 - 1e-9, 'pengali lonjakan tidak turun di bawah minimum');
}
{
    const st = { data: { time: { currentYear: 2030, currentMonth: 3 }, os: { bugs: [{ status: 'active' }, { status: 'active' }] } }, addLog() {} };
    const sys = new HypeCycleSystem(st, () => 0);
    sys.setSources({ os: osStub(50), chip: null });
    const withBugs = sys.assessProduct(OWN).mult;
    st.data.os.bugs = [];
    const clean = sys.assessProduct(OWN).mult;
    ok(withBugs < clean, 'bug OS aktif menurunkan pengali lonjakan');
}
{
    const { st, sys, logs } = mkState(2030, 3, 0);
    sys.setSources({ os: osStub(50), chip: null });
    sys.onFlagshipReleased(OWN);
    ok(logs.some(l => l.includes('disambut')) || logs.some(l => l.includes('naik')), 'pesan peluncuran sesuai kualitas produk');
}
{
    const st = { data: { time: { currentYear: 2030, currentMonth: 3 }, products: { development: null } }, addLog() {} };
    const sys = new HypeCycleSystem(st, () => 0);
    sys.onFlagshipReleased(null);
    st.data.time.currentMonth = 9; // teaser bulan ke-6 setelah rilis Maret → September
    sys._onMonth();
    ok(sys.getAnticipation() >= 0, 'teaser tanpa desain berjalan tidak error');
}

console.log(fails === 0 ? 'SEMUA LULUS' : fails + ' GAGAL');
process.exit(fails === 0 ? 0 : 1);
