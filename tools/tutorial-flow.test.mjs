// Tes alur tutorial/misi pertama (Node, tanpa browser). Jalankan: node tools/tutorial-flow.test.mjs
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.document = globalThis.document || { documentElement: { setAttribute() {}, lang: '' }, body: { classList: { add() {}, remove() {}, toggle() {} } }, getElementById: () => null, createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {}, addEventListener() {} }), querySelector: () => null, addEventListener() {} };
globalThis.window = globalThis.window || { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) };

const { bus } = await import('../src/core/EventBus.js');
const { TutorialSystem, TUTORIAL_STEPS, FIRST_SALE_REWARD } = await import('../src/systems/TutorialSystem.js');

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('GAGAL:', m); } else console.log('ok   ', m); };

function fakeState(tut) {
    const d = { tutorial: tut || { completed: false, skipped: false, currentStep: 0 }, seenTips: [], products: { catalog: [], development: null }, cash: 100000, logs: [], milestones: [] };
    return {
        data: d,
        hasSeenTip: id => d.seenTips.includes(id), markTipSeen: id => d.seenTips.push(id),
        addCash: n => { d.cash += n; }, addLog: m => d.logs.push(m), addMilestone: (id) => { d.milestones.push(id); return true; }
    };
}
const idx = id => TUTORIAL_STEPS.findIndex(s => s.id === id);
const cur = s => s.data.tutorial.currentStep;

// --- alur penuh ---
{
    const st = fakeState(); const tut = new TutorialSystem(st);
    const emitted = []; bus.on('tutorial:step-changed', e => emitted.push(e.step.id));
    tut.start();
    ok(emitted[0] === 'welcome', 'mulai di welcome');
    bus.emit('tutorial:action', { id: 'action:toggle-pause' });
    bus.emit('tutorial:action', { id: 'action:cycle-speed' });
    tut.advance(); // cash (acknowledge)
    ok(TUTORIAL_STEPS[cur(st)].id === 'nav-products', 'sampai nav-products');
    bus.emit('tutorial:action', { id: 'nav:products' }); // format main.js tanpa awalan action:
    ok(TUTORIAL_STEPS[cur(st)].id === 'design-open', 'nav:products (tanpa action:) memajukan langkah');
    bus.emit('tutorial:action', { id: 'action:wizard-opened' });
    bus.emit('tutorial:action', { id: 'action:wizard-ready' });
    ok(TUTORIAL_STEPS[cur(st)].id === 'design-release', 'sampai design-release');
    st.data.products.development = { id: 'p1' };
    bus.emit('tutorial:action', { id: 'action:product-started' });
    ok(TUTORIAL_STEPS[cur(st)].id === 'wait-dev', 'menunggu pengembangan');
    st.data.products.development = null; st.data.products.catalog.push({ totalSold: 0, totalRevenue: 0 });
    bus.emit('product:released', {});
    ok(TUTORIAL_STEPS[cur(st)].id === 'wait-sale', 'rilis -> menunggu penjualan');
    st.data.products.catalog[0].totalSold = 120; st.data.products.catalog[0].totalRevenue = 5000;
    bus.emit('product:sale', {});
    ok(TUTORIAL_STEPS[cur(st)].id === 'celebrate', 'penjualan pertama -> perayaan');
    ok(st.data.cash === 100000 + FIRST_SALE_REWARD && st.data.tutorial.rewarded === true, 'hadiah kas masuk sekali');
    tut.advance(); tut.advance();
    ok(st.data.tutorial.completed === true, 'tutorial selesai');
    // restart tidak memberi hadiah lagi dan melewati langkah yang sudah terpenuhi
    const cashBefore = st.data.cash;
    tut.restart();
    ok(TUTORIAL_STEPS[cur(st)].id === 'welcome', 'restart mulai dari welcome');
    for (let i = 0; i < 3; i++) tut.advance();
    ok(st.data.cash === cashBefore, 'tidak ada hadiah ganda');
    ok(['finish'].includes(TUTORIAL_STEPS[cur(st)].id) || TUTORIAL_STEPS[cur(st)].id === 'nav-products', 'langkah terpenuhi dilewati: ' + TUTORIAL_STEPS[cur(st)].id);
    tut.stop();
}

// --- migrasi save lama ---
{
    const st = fakeState({ completed: false, skipped: false, currentStep: 5 });
    const t2 = new TutorialSystem(st); t2.start();
    ok(TUTORIAL_STEPS[cur(st)].id === 'nav-products' && st.data.tutorial.v === 2, 'save lama langkah 5 -> nav-products');
    t2.stop();
    const st2 = fakeState({ completed: true, skipped: false, currentStep: 8 });
    const t3 = new TutorialSystem(st2); t3.start();
    ok(st2.data.tutorial.currentStep === 8 && st2.data.tutorial.completed, 'save lama selesai tidak diubah');
}

// --- target 1.000 unit ---
{
    const st = fakeState({ completed: true, skipped: false, currentStep: 8 });
    st.data.products.catalog.push({ totalSold: 999 });
    const t4 = new TutorialSystem(st); t4.start();
    bus.emit('product:sale', {});
    ok(!st.data.tutorial.goalDone, 'belum 1000 -> belum tercapai');
    st.data.products.catalog[0].totalSold = 1000; bus.emit('product:sale', {});
    ok(st.data.tutorial.goalDone === true && st.data.milestones.includes('first_1000_units'), 'target 1000 tercapai sekali');
}
console.log(fails ? ('\n' + fails + ' GAGAL') : '\nSEMUA LULUS');
process.exit(fails ? 1 : 0);
