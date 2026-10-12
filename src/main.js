// FILE: src/main.js — DIAGNOSTIK MAIN.JS IMPORTS
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:11px monospace;padding:16px;padding-top:80px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.6;';
log.textContent = 'DIAGNOSTIK MAIN IMPORTS...\n\n';
document.body.appendChild(log);
const loading = document.getElementById('loading-screen');
if (loading) loading.style.display = 'none';

function ok(m)  { log.textContent += 'OK    ' + m + '\n'; log.scrollTop = log.scrollHeight; }
function err(m) { log.textContent += 'GAGAL ' + m + '\n'; log.style.color = '#f44'; log.scrollTop = log.scrollHeight; }

window.addEventListener('error', function (e) { err('Global: ' + (e.message || e.error)); });

(async function () {
    const files = [
        './config/app.config.js',
        './config/constants.js',
        './core/EventBus.js',
        './core/GameState.js',
        './core/TimeSystem.js',
        './core/SaveService.js',
        './core/ToastService.js',
        './core/ThemeService.js',
        './systems/EconomySystem.js',
        './systems/QuestSystem.js',
        './systems/TutorialSystem.js',
        './systems/ResearchSystem.js',
        './systems/OSSystem.js',
        './systems/ProductSystem.js',
        './systems/MarketSystem.js',
        './systems/CompetitorSystem.js',
        './systems/PublicOpinionSystem.js',
        './systems/EraSystem.js',
        './systems/TeamSystem.js',
        './systems/ChipSystem.js',
        './systems/FabSystem.js',
        './ui/layout/Header.js',
        './ui/layout/MobileNav.js',
        './ui/panels/DashboardPanel.js',
        './ui/panels/EmptyState.js',
        './ui/panels/SettingsPanel.js',
        './ui/panels/GuidePanel.js',
        './ui/panels/CompanyProfilePanel.js',
        './ui/panels/ToastContainer.js',
        './ui/panels/CashChart.js',
        './ui/panels/TutorialOverlay.js',
        './ui/panels/OnboardingModal.js',
        './ui/panels/MonthlySummaryModal.js',
        './ui/panels/GameOverScreen.js',
        './ui/modal.js',
        './ui/panels/ResearchPanel.js',
        './ui/panels/ProductPanel.js',
        './ui/panels/DesignWizard.js',
        './ui/panels/MarketPanel.js',
        './ui/panels/CompetitorDetailModal.js',
        './ui/panels/PublicOpinionPanel.js',
        './ui/panels/SalesChart.js',
        './ui/panels/TeamPanel.js',
        './ui/panels/StaffDetailModal.js',
        './ui/panels/ChipDesignerPanel.js',
        './ui/panels/FabPanel.js',
        './ui/phone/ChipMockup.js',
        './ui/charts/ChipRadarChart.js',
        './data/marketing.data.js',
        './data/feedback.data.js',
        './ui/notifications/NotificationRenderer.js'
    ];

    let failCount = 0;
    for (const f of files) {
        try {
            await import(f);
            ok(f);
        } catch (e) {
            failCount++;
            err(f + ' → ' + e.message);
        }
    }

    log.textContent += '\nSELESAI. Gagal: ' + failCount + '/' + files.length;
})();
