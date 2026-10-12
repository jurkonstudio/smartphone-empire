// FILE: src/main.js — SAFE MODE
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:20px;padding-top:60px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.6;';
log.textContent = 'MEMULAI BOOT...\n';
document.body.appendChild(log);

const loading = document.getElementById('loading-screen');
if (loading) loading.style.display = 'none';

function step(msg) {
    log.textContent += msg + '\n';
    log.scrollTop = log.scrollHeight;
    console.log('[SAFE]', msg);
}
function err(msg) {
    log.textContent += '❌ ' + msg + '\n';
    log.style.color = '#f44';
    log.scrollTop = log.scrollHeight;
    console.error('[SAFE-ERR]', msg);
}

window.addEventListener('error', function (e) {
    err('Global error: ' + (e.message || e.error));
});
window.addEventListener('unhandledrejection', function (e) {
    err('Promise reject: ' + e.reason);
});

(async function () {
    try {
        step('1. Import APP_CONFIG');
        const { APP_CONFIG } = await import('./config/app.config.js');

        step('2. Import constants');
        const { VIEW_TITLES } = await import('./config/constants.js');

        step('3. Import EventBus');
        const { bus } = await import('./core/EventBus.js');

        step('4. Import GameState');
        const { state } = await import('./core/GameState.js');

        step('5. Import TimeSystem');
        const { TimeSystem } = await import('./core/TimeSystem.js');

        step('6. Import SaveService');
        const { SaveService } = await import('./core/SaveService.js');

        step('7. Import ToastService');
        const { ToastService } = await import('./core/ToastService.js');

        step('8. Import EconomySystem');
        const { EconomySystem } = await import('./systems/EconomySystem.js');

        step('9. Import QuestSystem');
        const { QuestSystem } = await import('./systems/QuestSystem.js');

        step('10. Import TutorialSystem');
        const { TutorialSystem } = await import('./systems/TutorialSystem.js');

        step('11. Import DashboardPanel');
        const { renderDashboard } = await import('./ui/panels/DashboardPanel.js');

        step('12. Import SettingsPanel');
        const { renderSettingsPanel, bindSettingsActions } = await import('./ui/panels/SettingsPanel.js');

        step('13. Import GuidePanel');
        const { renderGuidePanel } = await import('./ui/panels/GuidePanel.js');

        step('14. Import ToastContainer');
        const { mountToastContainer } = await import('./ui/panels/ToastContainer.js');

        step('15. Import CashChart');
        const { drawCashChart } = await import('./ui/panels/CashChart.js');

        step('16. Import TutorialOverlay');
        const { initTutorialOverlay } = await import('./ui/panels/TutorialOverlay.js');

        step('17. Import OnboardingModal');
        const { showOnboarding } = await import('./ui/panels/OnboardingModal.js');

        step('18. Import MonthlySummaryModal');
        const { initMonthlySummary } = await import('./ui/panels/MonthlySummaryModal.js');

        step('19. Import GameOverScreen');
        const { initGameOverScreen } = await import('./ui/panels/GameOverScreen.js');

        step('20. Import Modal');
        const { Modal } = await import('./ui/modal.js');

        step('21. Cek DOM');
        const els = {
            header: document.getElementById('app-header'),
            view: document.getElementById('app-view'),
            nav: document.getElementById('mobile-nav'),
            toast: document.getElementById('toast-container')
        };
        step('   header=' + !!els.header + ' view=' + !!els.view + ' nav=' + !!els.nav + ' toast=' + !!els.toast);

        step('22. Init instances');
        const timeSystem = new TimeSystem(state);
        const economy = new EconomySystem(state);
        const quests = new QuestSystem(state);
        const tutorial = new TutorialSystem(state);

        step('23. Cek save');
        if (SaveService.hasSave()) {
            const saved = SaveService.load();
            if (saved) { state.hydrate(saved); step('   Hydrate OK'); }
        } else {
            step('24. Onboarding');
            const onb = await showOnboarding();
            step('   Onboarding OK: ' + JSON.stringify(onb));
            state.patch({ companyName: onb.companyName, difficulty: onb.difficulty });
            const mod = await import('./data/balance.data.js');
            const starting = mod.BALANCE.startingCash[onb.difficulty] || mod.BALANCE.startingCash.normal;
            state.setCash(starting);
            state.addMilestone('founded', 'Perusahaan ' + onb.companyName + ' didirikan.');
            state.addLog('Perusahaan didirikan.', 'success');
            SaveService.save(state);
        }

        step('25. Start systems');
        economy.start();
        quests.start();
        tutorial.start();

        step('26. Mount toast');
        mountToastContainer(els.toast);

        step('27. Tutorial overlay');
        initTutorialOverlay();

        step('28. Monthly summary');
        initMonthlySummary();

        step('29. Game over');
        initGameOverScreen();

        step('30. Render dashboard');
        els.view.innerHTML = renderDashboard(state.get(), timeSystem.snapshot());

        step('31. Draw chart');
        const chart = els.view.querySelector('.chart-wrap');
        if (chart) drawCashChart(chart);

        step('32. Start TimeSystem');
        timeSystem.start();

        step('33. Autosave');
        SaveService.startAutoSave(function () { return state; });

        step('✅✅✅ BOOT BERHASIL ✅✅✅');
        step('Reload otomatis dalam 3 detik...');

        setTimeout(function () { window.location.reload(); }, 3000);

    } catch (e) {
        err('===========================================');
        err('BOOT GAGAL');
        err('Error: ' + e.message);
        err('===========================================');
    }
})();
