// FILE: src/main.js — DIAGNOSTIK BOOT
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:11px monospace;padding:16px;padding-top:80px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.6;';
log.textContent = 'DIAGNOSTIK BOOT STEP...\n\n';
document.body.appendChild(log);
const loading = document.getElementById('loading-screen');
if (loading) loading.style.display = 'none';

function step(m) { log.textContent += m + '\n'; log.scrollTop = log.scrollHeight; }
function err(m)  { log.textContent += 'X ' + m + '\n'; log.style.color = '#f44'; log.scrollTop = log.scrollHeight; }

window.addEventListener('error', function (e) {
    err('Global error: ' + (e.message || e.error));
});

(async function () {
    try {
        step('1. Import core');
        const { bus } = await import('./core/EventBus.js');
        const { state } = await import('./core/GameState.js');
        step('   OK');

        step('2. Import systems');
        const { TimeSystem } = await import('./core/TimeSystem.js');
        const { EconomySystem } = await import('./systems/EconomySystem.js');
        const { ChipSystem } = await import('./systems/ChipSystem.js');
        const { FabSystem } = await import('./systems/FabSystem.js');
        step('   OK');

        step('3. Instantiate TimeSystem');
        const timeSystem = new TimeSystem(state);
        step('   OK');

        step('4. Instantiate ChipSystem');
        const chipSystem = new ChipSystem(state);
        step('   OK');

        step('5. Instantiate FabSystem');
        const fabSystem = new FabSystem(state);
        step('   OK');

        step('6. ChipSystem.start()');
        chipSystem.start();
        step('   OK');

        step('7. FabSystem.start()');
        fabSystem.start();
        step('   OK');

        step('8. Cek state chips');
        step('   chips.catalog length: ' + (state.get().chips.catalog || []).length);
        step('   fab.built: ' + state.get().fab.built);

        step('9. Import UI panels');
        const { renderProductPanel } = await import('./ui/panels/ProductPanel.js');
        step('   OK');

        step('10. Render ProductPanel (chip tab)');
        const html = renderProductPanel({ subtab: 'chip', productSystem: null, researchSystem: null, osSystem: null });
        step('   OK, panjang HTML: ' + html.length);

        step('11. Import main visual');
        await import('./ui/phone/ChipMockup.js');
        await import('./ui/charts/ChipRadarChart.js');
        await import('./ui/panels/ChipDesignerPanel.js');
        await import('./ui/panels/FabPanel.js');
        step('   OK');

        step('✅ SEMUA STEP LOLOS');
        step('Masalah bukan di sistem — cek file main.js versi asli.');

    } catch (e) {
        err('===========================================');
        err('GAGAL DI STEP DI ATAS');
        err('Error: ' + (e.message || 'unknown'));
        err('Stack: ' + (e.stack ? e.stack.split('\n').slice(0,4).join('\n       ') : '-'));
        err('===========================================');
    }
})();
