// FILE: src/main.js — DIAGNOSTIK TIM
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:20px;padding-top:80px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.6;';
log.textContent = 'DIAGNOSTIK TIM...\n';
document.body.appendChild(log);
const loading = document.getElementById('loading-screen');
if (loading) loading.style.display = 'none';

function step(m) { log.textContent += m + '\n'; log.scrollTop = log.scrollHeight; }
function err(m)  { log.textContent += 'X ' + m + '\n'; log.style.color = '#f44'; log.scrollTop = log.scrollHeight; }

window.addEventListener('error', e => err('Global: ' + (e.message || e.error)));
window.addEventListener('unhandledrejection', e => err('Reject: ' + e.reason));

(async function () {
    const files = [
        './data/staff.data.js',
        './data/balance.data.js',
        './core/GameState.js',
        './config/constants.js',
        './systems/TeamSystem.js',
        './ui/panels/TeamPanel.js',
        './ui/panels/StaffDetailModal.js',
        './ui/panels/DashboardPanel.js',
        './ui/layout/MobileNav.js'
    ];
    for (const f of files) {
        try {
            const mod = await import(f);
            let extra = '';
            if (f.includes('balance')) extra = ' | team: ' + (mod.BALANCE && mod.BALANCE.team ? 'ADA' : 'TIDAK ADA');
            if (f.includes('GameState')) extra = ' | SCHEMA: ' + mod.SCHEMA_VERSION;
            if (f.includes('constants')) extra = ' | NAV: ' + (mod.NAV_ITEMS ? mod.NAV_ITEMS.length : '?');
            step('OK    ' + f + extra);
        } catch (e) {
            err('GAGAL ' + f + '\n      >> ' + e.message);
        }
    }
    step('\nSELESAI.');
})();
