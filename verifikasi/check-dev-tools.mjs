// Tes terarah efek Alat Pengembang (dev_tools). Pakai: node verifikasi/check-dev-tools.mjs <root src>
// Mencakup: syarat buka, diskon biaya fitur OS, bonus permintaan (paritas preview vs nyata), dan tidak bentrok dengan F-AI.
import { stubBrowser, load, seedRandom } from '../tools/boot.mjs';
const root = process.argv[2] || new URL('../src', import.meta.url).pathname;
stubBrowser(); seedRandom(11);
const { state } = await load(root, 'core/GameState.js');
const { FUTURE_PANELS, getFuturePanelById } = await load(root, 'data/future-panels.data.js');
const { isDevToolsActive, getOsFeatureCost, getDevToolsDemandMult, DEV_TOOLS_CONFIG } = await load(root, 'systems/FutureEffects.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
console.info = () => {};
let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

const OS_APPSTORE = { id: 'fw_appstore', devCost: 30000 };
const OS_SIGNIN   = { id: 'fw_sign_in', devCost: 18000 };
const OS_GPS      = { id: 'fw_gps', devCost: 15000 };
const OS_AI_AGENT = { id: 'fw_ai_agent', devCost: 110000 };

// Data uji: salin dari state normal lalu atur tahun dan riset.
function dataWith(year, completed) {
    state.reset('normal');
    const d = state.data;
    d.time.currentYear = year;
    d.research.completed = completed.slice();
    d.os = d.os || {};
    return d;
}
const OPEN = ['net_4g'];

// --- 0) definisi panel ---
const panel = getFuturePanelById('dev_tools');
chk(!!panel && panel.unlock.enabled === true, 'panel dev_tools sudah diaktifkan');
chk(panel.unlock.year === 2008 && panel.unlock.research === 'net_4g', 'syarat buka: tahun 2008 + net_4g');
chk(panel.connected.indexOf('os') !== -1 && panel.connected.indexOf('products') !== -1, 'connected memuat os dan products');
chk(FUTURE_PANELS.filter(p => p.id === 'dev_tools').length === 1, 'panel dev_tools hanya terdaftar sekali');

// --- 1) syarat buka ---
chk(isDevToolsActive(dataWith(2008, [])) === false, 'tahun 2008 tanpa riset: terkunci');
chk(isDevToolsActive(dataWith(2007, OPEN)) === false, 'riset ada tapi tahun 2007: terkunci');
chk(isDevToolsActive(dataWith(2008, OPEN)) === true, 'tahun 2008 + net_4g: terbuka');
chk(isDevToolsActive(dataWith(2026, OPEN)) === true, 'tahun 2026 + net_4g: terbuka');

// --- 2) diskon biaya fitur OS ---
chk(getOsFeatureCost(OS_APPSTORE, dataWith(2008, [])) === 30000, 'App Store tanpa Alat Pengembang: biaya normal 30000');
chk(getOsFeatureCost(OS_APPSTORE, dataWith(2008, OPEN)) === 25500, 'App Store saat terbuka: 30000 x 0.85 = 25500');
chk(getOsFeatureCost(OS_SIGNIN, dataWith(2008, OPEN)) === 15300, 'Akun Terpadu saat terbuka: 18000 x 0.85 = 15300 (dibulatkan)');
chk(getOsFeatureCost(OS_GPS, dataWith(2008, OPEN)) === 15000, 'fitur di luar daftar (GPS) tidak kena diskon');
chk(getOsFeatureCost(OS_APPSTORE, dataWith(2007, OPEN)) === 30000, 'tahun 2007: diskon belum berlaku');
chk(getOsFeatureCost(null, dataWith(2008, OPEN)) === 0, 'fitur null tetap 0');

// --- 3) tidak bentrok dengan F-AI ---
const dFai = dataWith(2026, ['chip_npu', 'net_4g']);
chk(getOsFeatureCost(OS_AI_AGENT, dFai) === 88000, 'fitur F-AI (fw_ai_agent) hanya kena diskon F-AI: 110000 x 0.8 = 88000');
chk(getOsFeatureCost(OS_APPSTORE, dFai) === 25500, 'App Store saat F-AI dan Alat Pengembang aktif: hanya diskon Alat Pengembang');

// --- 4) bonus permintaan: helper ---
const dOpen = dataWith(2008, OPEN);
chk(getDevToolsDemandMult('own:v1', dOpen) === 1 + DEV_TOOLS_CONFIG.demandBonus, 'OS milik pemain mendapat x' + (1 + DEV_TOOLS_CONFIG.demandBonus));
chk(getDevToolsDemandMult('license:some_lic', dOpen) === 1, 'OS lisensi tidak mendapat bonus');
chk(getDevToolsDemandMult(null, dOpen) === 1, 'tanpa osOptionId tidak ada bonus');
chk(getDevToolsDemandMult('own:v1', dataWith(2008, [])) === 1, 'panel terkunci: tidak ada bonus');

// --- 5) paritas: _getOsFactor (dipakai preview dan penjualan nyata) ---
const dP = dataWith(2008, []);
dP.os.versions = [{ id: 'v1', stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }];
const ps = new ProductSystem(state);
const fLocked = ps._getOsFactor({ osOptionId: 'own:v1' });
const dOpen2 = dataWith(2008, OPEN);
dOpen2.os.versions = dP.os.versions;
const fOpen = ps._getOsFactor({ osOptionId: 'own:v1' });
chk(fLocked > 0 && Math.abs(fOpen / fLocked - (1 + DEV_TOOLS_CONFIG.demandBonus)) < 1e-9, 'faktor OS own naik tepat x' + (1 + DEV_TOOLS_CONFIG.demandBonus) + ' saat terbuka');
const fLic = ps._getOsFactor({ osOptionId: 'license:none_such' });
chk(Number.isFinite(fLic), 'faktor OS lisensi tetap berhingga (tidak terpengaruh bonus)');
chk(ps._getOsFactor({ osOptionId: 'own:v1' }) === fOpen, 'pemanggilan berulang menghasilkan nilai sama (deterministik)');

console.log(fails === 0 ? '\nSEMUA LULUS' : '\nGAGAL: ' + fails);
process.exit(fails === 0 ? 0 : 1);
