// Tes terarah efek Mesin Game (game_engine). Pakai: node verifikasi/check-game-engine.mjs <root src>
// Mencakup: syarat buka (riset chip_octa), bonus sebanding performa chip, syarat App Store di OS milik pemain,
// dan paritas lewat ProductSystem.computeStats.
import { stubBrowser, load, seedRandom } from '../tools/boot.mjs';
const root = process.argv[2] || new URL('../src', import.meta.url).pathname;
stubBrowser(); seedRandom(11);
const { state } = await load(root, 'core/GameState.js');
const { isGameEngineActive, osOptionHasFeature, getGameEnginePerfBonus, GAME_ENGINE_CONFIG } = await load(root, 'systems/FutureEffects.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { getFuturePanelById } = await load(root, 'data/future-panels.data.js');
console.info = () => {};
let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

// Data uji: state normal + riset dan OS yang diatur.
function dataWith(completed, versions) {
    state.reset('normal');
    const d = state.data;
    d.research.completed = completed.slice();
    d.os = d.os || {};
    d.os.versions = versions || [];
    return d;
}
const OPEN = ['chip_octa'];
const V_WITH_STORE = [{ id: 'v1', features: ['fw_appstore'], stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }];
const V_NO_STORE   = [{ id: 'v1', features: [], stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }];
const PERF = 72; // performa chip_octa dari components.data.js
const BONUS = PERF * GAME_ENGINE_CONFIG.perfPerChipPoint;

// --- 0) definisi panel ---
const panel = getFuturePanelById('game_engine');
chk(!!panel && panel.unlock.enabled === true, 'panel game_engine sudah diaktifkan');
chk(panel.unlock.research === 'chip_octa' && panel.unlock.year === null, 'syarat buka: riset chip_octa, tanpa syarat tahun');
chk(panel.connected.indexOf('products') !== -1, 'connected memuat products');

// --- 1) syarat buka ---
chk(isGameEngineActive(dataWith([], V_WITH_STORE)) === false, 'tanpa riset chip_octa: terkunci');
chk(isGameEngineActive(dataWith(OPEN, V_WITH_STORE)) === true, 'riset chip_octa selesai: terbuka');

// --- 2) bonus performa: helper ---
const dOpenStore = dataWith(OPEN, V_WITH_STORE);
chk(Math.abs(getGameEnginePerfBonus(PERF, 'own:v1', dOpenStore) - BONUS) < 1e-9, 'chip performa 72 + App Store: bonus ' + BONUS.toFixed(2));
chk(Math.abs(getGameEnginePerfBonus(8, 'own:v1', dOpenStore) - 8 * GAME_ENGINE_CONFIG.perfPerChipPoint) < 1e-9, 'bonus sebanding: chip performa 8 mendapat bonus lebih kecil');
chk(getGameEnginePerfBonus(PERF, 'own:v1', dataWith([], V_WITH_STORE)) === 0, 'panel terkunci: bonus 0');
chk(getGameEnginePerfBonus(0, 'own:v1', dOpenStore) === 0, 'tanpa chip (performa 0): bonus 0');
chk(getGameEnginePerfBonus(PERF, null, dOpenStore) === 0, 'tanpa osOptionId: bonus 0');

// --- 3) syarat App Store ---
chk(osOptionHasFeature('own:v1', 'fw_appstore', dataWith(OPEN, V_WITH_STORE)) === true, 'OS milik pemain yang punya App Store: lolos');
chk(osOptionHasFeature('own:v1', 'fw_appstore', dataWith(OPEN, V_NO_STORE)) === false, 'OS milik pemain tanpa App Store: tidak lolos');
chk(getGameEnginePerfBonus(PERF, 'own:v1', dataWith(OPEN, V_NO_STORE)) === 0, 'OS tanpa App Store: bonus 0');
chk(getGameEnginePerfBonus(PERF, 'license:lic_android', dOpenStore) === 0, 'OS lisensi: bonus 0 (tidak punya daftar fitur)');
chk(osOptionHasFeature('own:tidak_ada', 'fw_appstore', dOpenStore) === false, 'versi OS yang tidak ada: tidak lolos');

// --- 4) paritas lewat computeStats (dipakai preview desain dan produk nyata) ---
const cfg = (osOptionId) => ({
    chipId: 'chip_octa', osOptionId,
    displayId: null, cameraId: null, batteryId: null, networkId: null,
    bodyId: null, ramId: null, formFactorId: null, bodyColorId: null
});
const dLocked = dataWith([], V_WITH_STORE);
const psLocked = new ProductSystem(state);
const perfLocked = psLocked.computeStats(cfg('own:v1')).performance;

const dActive = dataWith(OPEN, V_WITH_STORE);
const psActive = new ProductSystem(state);
const perfActive = psActive.computeStats(cfg('own:v1')).performance;
const delta = perfActive - perfLocked;
chk(delta > BONUS - 1 && delta < BONUS + 1, 'computeStats: performa naik sekitar ' + BONUS.toFixed(2) + ' (naik ' + delta + ' setelah pembulatan)');

const dNoStore = dataWith(OPEN, V_NO_STORE);
const perfNoStore = new ProductSystem(state).computeStats(cfg('own:v1')).performance;
chk(perfNoStore === perfLocked, 'computeStats: tanpa App Store performa sama dengan panel terkunci');

console.log(fails === 0 ? '\nSEMUA LULUS' : '\nGAGAL: ' + fails);
process.exit(fails === 0 ? 0 : 1);
