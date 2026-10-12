// FILE: src/main.js — TES IMPORT SATU PER SATU
(async function () {
    const files = [
        './config/app.config.js',
        './config/constants.js',
        './config/time.config.js',
        './core/EventBus.js',
        './core/GameState.js',
        './core/TimeSystem.js',
        './core/SaveService.js',
        './core/ToastService.js',
        './data/balance.data.js',
        './systems/EconomySystem.js',
        './systems/QuestSystem.js',
        './systems/TutorialSystem.js',
        './ui/modal.js',
        './ui/layout/Header.js',
        './ui/layout/MobileNav.js',
        './ui/panels/DashboardPanel.js',
        './ui/panels/EmptyState.js',
        './ui/panels/SettingsPanel.js',
        './ui/panels/GuidePanel.js',
        './ui/panels/ToastContainer.js',
        './ui/panels/CashChart.js',
        './ui/panels/TutorialOverlay.js',
        './ui/panels/OnboardingModal.js',
        './ui/panels/MonthlySummaryModal.js',
        './ui/panels/GameOverScreen.js',
        './ui/panels/LogPanel.js',
        './ui/panels/QuestsPanel.js',
        './ui/panels/TimelinePanel.js',
        './ui/panels/KpiCards.js',
        './ui/panels/ProgressPanel.js',
        './ui/panels/TimePanel.js',
        './ui/panels/CloudStatus.js'
    ];

    const hasil = [];
    for (let i = 0; i < files.length; i++) {
        try {
            await import(files[i]);
            hasil.push('OK    ' + files[i]);
        } catch (err) {
            hasil.push('GAGAL ' + files[i] + '\n      >> ' + err.message);
        }
    }

    const loading = document.getElementById('loading-screen');
    const errorBox = document.getElementById('error-message');
    if (loading) loading.style.display = 'none';
    if (errorBox) {
        errorBox.style.display = 'block';
        errorBox.style.background = '#111';
        errorBox.style.color = '#fff';
        errorBox.style.fontFamily = 'monospace';
        errorBox.style.fontSize = '11px';
        errorBox.style.lineHeight = '1.6';
        errorBox.style.maxHeight = '90vh';
        errorBox.style.overflowY = 'auto';
        errorBox.style.whiteSpace = 'pre-wrap';
        errorBox.style.padding = '16px';
        errorBox.style.paddingTop = '80px';
        errorBox.innerHTML = '<b style="color:#4CAF50;">HASIL TES IMPORT:</b>\n\n' + hasil.join('\n\n');
    }
})();
