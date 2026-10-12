// FILE: src/main.js — SAFE MODE
// Menampilkan langkah boot di layar agar terlihat di mana error.

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
    console.error('[SAFE-ERR]', msg);
    log.scrollTop = log.scrollHeight;
}

// Tangkap error global
window.addEventListener('error', function (e) {
    err('Global error: ' + (e.message || e.error));
});
window.addEventListener('unhandledrejection', function (e) {
    err('Promise reject: ' + e.reason);
});

(async function () {
    try {
        step('1. Import config/app.config.js');
        const { APP_CONFIG } = await import('./config/app.config.js');
        step('   OK, nama app: ' + APP_CONFIG.name);

        step('2. Import config/constants.js');
        const { VIEW_TITLES } = await import('./config/constants.js');
        step('   OK');

        step('3. Import core/EventBus.js');
        const { bus } = await import('./core/EventBus.js');
        step('   OK');

        step('4. Import core/GameState.js');
        const { state } = await import('./core/GameState.js');
        step('   OK, cash: ' + state.get().cash);

        step('5. Import core/TimeSystem.js');
        const { TimeSystem } = await import('./core/TimeSystem.js');
        step('   OK');

        step('6. Import core/SaveService.js');
        const { SaveService } = await import('./core/SaveService.js');
        step('   OK');

        step('7. Import core/ToastService.js');
        const { ToastService } = await import('./core/ToastService.js');
        step('   OK');

        step('8. Import systems/EconomySystem.js');
        const { EconomySystem } = await import('./systems/EconomySystem.js');
        step('   OK');

        step('9. Import systems/QuestSystem.js');
        const { QuestSystem } = await import('./systems/QuestSystem.js');
        step('   OK');

        step('10. Import systems/TutorialSystem.js');
        const { TutorialSystem } = await import('./systems/TutorialSystem.js');
        step('   OK');

        step('11. Import ui/panels/DashboardPanel.js');
        const { renderDashboard } = await import('./ui/panels/DashboardPanel.js');
        step('   OK');

        step('12. Import ui/panels/SettingsPanel.js');
        const { renderSettingsPanel, bindSettingsActions } = await import('./ui/panels/SettingsPanel.js');
        step('   OK');

        step('13. Import ui/panels/GuidePanel.js');
        const { renderGuidePanel } = await import('./ui/panels/GuidePanel.js');
        step('   OK');

        step('14. Import ui/panels/ToastContainer.js');
        const { mountToastContainer } = await import('./ui/panels/ToastContainer.js');
        step('   OK');

        step('15. Import ui/panels/CashChart.js');
        const { drawCashChart } = await import('./ui/panels/CashChart.js');
        step('   OK');

        step('16. Import ui/panels/TutorialOverlay.js');
        const { initTutorialOverlay } = await import('./ui/panels/TutorialOverlay.js');
        step('   OK');

        step('17. Import ui/panels/OnboardingModal.js');
        const { showOnboarding } = await import('./ui/panels/OnboardingModal.js');
        step('   OK');

        step('18. Import ui/panels/MonthlySummaryModal.js');
        const { initMonthlySummary } = await import('./ui/panels/MonthlySummaryModal.js');
        step('   OK');

        step('19. Import ui/panels/GameOverScreen.js');
        const { initGameOverScreen } = await import('./ui/panels/GameOverScreen.js');
        step('   OK');

        step('20. Import ui/modal.js');
        const { Modal } = await import('./ui/modal.js');
        step('   OK');

        step('21. Cek elemen DOM');
        const els = {
            header: document.getElementById('app-header'),
            view: document.getElementById('app-view'),
            nav: document.getElementById('mobile-nav'),
            toast: document.getElementById('toast-container')
        };
        step('   header=' + !!els.header + ' view=' + !!els.view + ' nav=' + !!els.nav + ' toast=' + !!els.toast);
        if (!els.header || !els.view || !els.nav) throw new Error('Elemen HTML tidak lengkap');

        step('22. Init instances');
        const timeSystem = new TimeSystem(state);
        const economy = new EconomySystem(state);
        const quests = new QuestSystem(state);
        const tutorial = new TutorialSystem(state);
        step('   OK');

        step('23. Cek save tersimpan');
        step('   hasSave=' + SaveService.hasSave());
        if (SaveService.hasSave()) {
            const saved = SaveService.load();
            if (saved) {
                state.hydrate(saved);
                step('   Hydrate OK');
            }
        } else {
            step('   Tidak ada save, akan onboarding');
            step('24. Panggil showOnboarding() — akan muncul modal');
            const onb = await showOnboarding();
            step('   Onboarding selesai: ' + JSON.stringify(onb));
            state.patch({ companyName: onb.companyName, difficulty: onb.difficulty });
            const mod = await import('./data/balance.data.js');
            const starting = mod.BALANCE.startingCash[onb.difficulty] || mod.BALANCE.startingCash.normal;
            state.setCash(starting);
            state.addMilestone('founded', 'Perusahaan ' + onb.companyName + ' didirikan.');
            state.addLog('Perusahaan ' + onb.companyName + ' didirikan dengan modal $' + starting.toLocaleString('en-US') + '.', 'success');
            SaveService.save(state);
            step('   Save awal OK');
        }

        step('25. Start systems');
        economy.start();
        quests.start();
        tutorial.start();
        step('   OK');

        step('26. Toast container mount');
        mountToastContainer(els.toast);
        step('   OK');

        step('27. Tutorial overlay');
        initTutorialOverlay();
        step('   OK');

        step('28. Monthly summary');
        initMonthlySummary();
        step('   OK');

        step('29. Game over screen');
        initGameOverScreen();
        step('   OK');

        step('30. Render dashboard');
        els.view.innerHTML = renderDashboard(state.get(), timeSystem.snapshot());
        step('   OK');

        step('31. Draw chart');
        const chart = els.view.querySelector('.chart-wrap');
        if (chart) drawCashChart(chart);
        step('   OK');

        step('32. Start TimeSystem');
        timeSystem.start();
        step('   OK');

        step('33. Start autosave');
        SaveService.startAutoSave(function () { return state; });
        step('   OK');

        step('✅✅✅ BOOT BERHASIL ✅✅✅');
        step('Menghapus log dalam 3 detik...');

        window.__game = { state: state, bus: bus, timeSystem: timeSystem, economy: economy, quests: quests, tutorial: tutorial, SaveService: SaveService };

        setTimeout(function () {
            log.remove();
            window.location.reload(); // reload untuk memuat main.js normal
        }, 3000);

    } catch (e) {
        err('===========================================');
        err('BOOT GAGAL DI LANGKAH DI ATAS');
        err('Error: ' + e.message);
        err('Stack: ' + (e.stack || ''));
        err('===========================================');
    }
})();
