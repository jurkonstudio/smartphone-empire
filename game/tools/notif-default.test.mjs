// P1: bawaan notifikasi "hanya penting" untuk game BARU; save lama tidak berubah.
// Pakai: node tools/notif-default.test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(11);
console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { NotificationPrefs } = await load(root, 'core/NotificationPrefs.js');
let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

// 1. game baru
state.reset('normal');
chk(NotificationPrefs.isEnabled() === true, 'game baru: saklar utama nyala');
chk(NotificationPrefs.isImportantOnly() === true, 'game baru: mode hanya penting');
chk(NotificationPrefs.isTypeEnabled('warning') && NotificationPrefs.isTypeEnabled('error'), 'game baru: warning dan error tampil');
chk(!NotificationPrefs.isTypeEnabled('success') && !NotificationPrefs.isTypeEnabled('info'), 'game baru: success dan info tidak tampil');
chk(NotificationPrefs.isTypeEnabled('news') === true, 'game baru: berita mengikuti notifNews (bawaan nyala)');

// 2. save lama (dibuat dari game baru lalu disetel seperti versi sebelumnya)
const mkOld = (mut) => { state.reset('normal'); const s = state.serialize(); mut(s); return s; };
const load2 = (s) => { state.hydrate(JSON.parse(JSON.stringify(s))); };

load2(mkOld(s => { s.settings.notifEnabled = false; delete s.settings.notifImportantOnly; }));
chk(NotificationPrefs.isEnabled() === false && NotificationPrefs.isImportantOnly() === false, 'save lama (notifEnabled=false): tetap MATI');

load2(mkOld(s => { delete s.settings.notifEnabled; delete s.settings.notifImportantOnly; }));
chk(NotificationPrefs.isEnabled() === false && NotificationPrefs.isImportantOnly() === false, 'save lama tanpa field notifEnabled: tetap MATI');

load2(mkOld(s => { delete s.settings; }));
chk(NotificationPrefs.isEnabled() === false && NotificationPrefs.isImportantOnly() === false, 'save lama tanpa objek settings: tetap MATI');

load2(mkOld(s => { s.schemaVersion = 1; delete s.settings; }));
chk(NotificationPrefs.isEnabled() === false, 'save sangat lama (schema < 2): tetap MATI');

// 3. pilihan pemain dihormati
load2(mkOld(s => { s.settings.notifEnabled = true; s.settings.notifImportantOnly = false; }));
chk(NotificationPrefs.isEnabled() === true && NotificationPrefs.isImportantOnly() === false, 'save pemain yang menyalakan semua: dipertahankan');
load2(mkOld(s => { s.settings.notifEnabled = true; s.settings.notifImportantOnly = true; }));
chk(NotificationPrefs.isEnabled() === true && NotificationPrefs.isImportantOnly() === true, 'save pemain hanya-penting: dipertahankan');

// 4. round trip game baru
state.reset('normal');
load2(state.serialize());
chk(NotificationPrefs.isEnabled() === true && NotificationPrefs.isImportantOnly() === true, 'game baru disimpan lalu dimuat: tetap hanya-penting');

console.log(fails ? fails + ' GAGAL' : 'SEMUA LULUS');
process.exit(fails ? 1 : 0);
