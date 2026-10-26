// Tes perilaku "saran selesai" pada Asisten (v2028.43). Jalankan dari akar repo: node tools/advisor-done-test.mjs
import { stubBrowser, load } from './boot.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
stubBrowser();
const { bus } = await load(ROOT, 'src/core/EventBus.js');
const { AdvisorSystem } = await load(ROOT, 'src/systems/AdvisorSystem.js');

let fails = 0;
function check(name, cond, extra) {
    console.log((cond ? 'LULUS ' : 'GAGAL ') + name + (extra !== undefined ? '  ' + JSON.stringify(extra) : ''));
    if (!cond) fails++;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

function makeState(stock) {
    return {
        data: {
            cash: 500000, difficulty: 'normal', staff: [], team: { engineers: 1, designers: 1, marketers: 1 },
            products: { catalog: [{ id: 'p1', name: 'Phone A', status: 'selling', stock: stock, baseCapacity: 100,
                price: 500, unitCost: 300, totalSold: 10, releaseGameMinute: 0 }], designing: null, development: null },
            time: { elapsedGameMinutes: 1440 * 5, currentYear: 2026, currentMonth: 1, currentDay: 1 },
            tutorial: { completed: true }, advisor: {}
        }
    };
}

const events = [];
bus.on('advisor:resolved', p => events.push(p));
const updates = [];
bus.on('advisor:updated', b => updates.push(b));

// 1) stok habis -> saran "stock_out:p1" muncul
const state = makeState(0);
const sys = new AdvisorSystem(state, {});
let ids = sys.getAdvice().map(a => a.id);
check('stok habis memunculkan saran stock_out', ids.indexOf('stock_out:p1') >= 0, ids);

// 2) tandai selesai -> hilang dari daftar & lencana, tercatat di getDone
check('markDone berhasil', sys.markDone('stock_out:p1') === true);
ids = sys.getAdvice().map(a => a.id);
check('saran selesai tidak tampil lagi', ids.indexOf('stock_out:p1') < 0, ids);
check('saran selesai tercatat di getDone', sys.getDone().some(d => d.id === 'stock_out:p1'));
check('lencana tidak menghitung saran selesai', sys.getBadge().critical === 0 || ids.indexOf('stock_out:p1') < 0);

// 3) dibatalkan -> kembali muncul
sys.undoDone('stock_out:p1');
ids = sys.getAdvice().map(a => a.id);
check('undo mengembalikan saran', ids.indexOf('stock_out:p1') >= 0);
check('undo menghapus dari getDone', sys.getDone().length === 0);

// 4) saran selesai lalu kondisinya beres sendiri -> tidak memicu "beres" (sudah ditandai),
//    dan entri selesai dibersihkan agar bisa muncul lagi bila masalahnya kembali
sys.markDone('stock_out:p1');
events.length = 0;
state.data.products.catalog[0].stock = 80;
sys._lastSig = ''; sys._scheduleRefresh(); await wait(350);
check('saran selesai yang beres tidak memicu notifikasi "Beres"',
    !events.some(e => e.items.some(i => i.id === 'stock_out:p1')), events);
check('entri selesai dibersihkan setelah kondisi beres', sys.getDone().length === 0 && !sys._store().done['stock_out:p1']);
state.data.products.catalog[0].stock = 0;
ids = sys.getAdvice().map(a => a.id);
check('masalah kembali -> saran muncul lagi', ids.indexOf('stock_out:p1') >= 0, ids);

// 5) saran aktif yang beres tanpa ditandai -> event advisor:resolved dikirim (untuk notifikasi "Beres")
sys._lastSig = ''; sys._scheduleRefresh(); await wait(350);
events.length = 0;
state.data.products.catalog[0].stock = 80;
sys._lastSig = ''; sys._scheduleRefresh(); await wait(350);
check('kondisi beres tanpa ditandai memicu advisor:resolved',
    events.some(e => e.items.some(i => i.id === 'stock_out:p1')), events.map(e => e.items.map(i => i.id)));

// 6) snooze dianggap ditunda, bukan beres
state.data.products.catalog[0].stock = 0;
sys._lastSig = ''; sys._scheduleRefresh(); await wait(350);
events.length = 0;
sys.snooze('stock_out:p1');
await wait(350);
state.data.products.catalog[0].stock = 80;
sys._lastSig = ''; sys._scheduleRefresh(); await wait(350);
check('saran yang ditunda tidak dianggap "beres"', !events.some(e => e.items.some(i => i.id === 'stock_out:p1')));

// 7) pemantauan: perubahan stok terdeteksi tanpa event khusus (advisor:updated dikirim)
const state2 = makeState(0);
const sys2 = new AdvisorSystem(state2, {});
sys2._scheduleRefresh(); await wait(350);
updates.length = 0;
state2.data.products.catalog[0].stock = 100;
sys2._scheduleRefresh(); await wait(350);
check('perubahan stok memicu advisor:updated', updates.length >= 1, updates.length);

// 8) markDone pada saran yang tidak ada -> false
check('markDone saran tidak ada -> false', sys2.markDone('tidak_ada') === false);

// 9) data lama (tanpa field done) tetap aman
const state3 = { data: { cash: 1000, staff: [], team: {}, products: { catalog: [] }, time: { elapsedGameMinutes: 0 }, advisor: { snoozed: {} } } };
const sys3 = new AdvisorSystem(state3, {});
let ok = true;
try { sys3.getDone(); sys3.getAdvice(); } catch (e) { ok = false; }
check('data simpanan lama tanpa "done" tetap aman', ok);

console.log(fails ? '\n' + fails + ' GAGAL' : '\nSemua tes advisor-done LULUS');
process.exit(fails ? 1 : 0);
