// FILE: src/main.js — DIAGNOSTIK TEMA
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:20px;padding-top:80px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.6;';
log.textContent = 'DIAGNOSTIK TEMA...\n';
document.body.appendChild(log);
const loading = document.getElementById('loading-screen');
if (loading) loading.style.display = 'none';

function step(m) { log.textContent += m + '\n'; log.scrollTop = log.scrollHeight; }
function err(m)  { log.textContent += 'X ' + m + '\n'; log.style.color = '#f44'; log.scrollTop = log.scrollHeight; }

window.addEventListener('error', e => err('Global: ' + (e.message || e.error)));
window.addEventListener('unhandledrejection', e => err('Reject: ' + e.reason));

(async function () {
    const files = [
        './data/theme.data.js',
        './core/ThemeService.js',
        './ui/panels/CompanyProfilePanel.js',
        './ui/panels/SettingsPanel.js',
        './services/CloudService.js',
        './services/README.md',
        './ui/layout/Header.js',
        './config/constants.js'
    ];
    for (const f of files) {
        if (f.endsWith('.md')) {
            step('SKIP  ' + f + ' (bukan JS)');
            continue;
        }
        try {
            await import(f);
            step('OK    ' + f);
        } catch (e) {
            err('GAGAL ' + f + '\n      >> ' + e.message);
        }
    }
    step('\nSELESAI.');
})();
