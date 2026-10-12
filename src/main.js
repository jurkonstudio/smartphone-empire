// FILE: src/main.js — TES MINIMAL
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:14px monospace;padding:24px;padding-top:80px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.8;';
log.textContent = 'TES FILE KRITIS...\n\n';
document.body.appendChild(log);
const loading = document.getElementById('loading-screen');
if (loading) loading.style.display = 'none';

function ok(m)  { log.textContent += 'OK    ' + m + '\n'; log.scrollTop = log.scrollHeight; }
function err(m) { log.textContent += 'GAGAL ' + m + '\n'; log.style.color = '#f44'; log.scrollTop = log.scrollHeight; }

window.addEventListener('error', function (e) {
    err('Global error: ' + (e.message || e.error));
});

(async function () {
    const files = [
        './services/CloudService.js',
        './ui/panels/CompanyProfilePanel.js',
        './core/ThemeService.js',
        './data/theme.data.js',
        './ui/panels/SettingsPanel.js'
    ];
    for (const f of files) {
        try {
            await import(f);
            ok(f);
        } catch (e) {
            err(f + ' → ' + e.message);
        }
    }
    log.textContent += '\nSELESAI.';
})();
