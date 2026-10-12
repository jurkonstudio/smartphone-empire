// FILE: src/main.js — DIAGNOSTIK CHIP
const log = document.createElement('div');
log.style.cssText = 'position:fixed;inset:0;background:#000;color:#0f0;font:12px monospace;padding:20px;padding-top:80px;z-index:99999;white-space:pre-wrap;overflow:auto;line-height:1.7;';
log.textContent = 'DIAGNOSTIK CHIP SYSTEM...\n\n';
document.body.appendChild(log);
const loading = document.getElementById('loading-screen');
if (loading) loading.style.display = 'none';

function ok(m)  { log.textContent += 'OK    ' + m + '\n'; log.scrollTop = log.scrollHeight; }
function err(m) { log.textContent += 'GAGAL ' + m + '\n'; log.style.color = '#f44'; log.scrollTop = log.scrollHeight; }

window.addEventListener('error', function (e) {
    err('Global: ' + (e.message || e.error));
});

(async function () {
    const files = [
        './data/chip-architecture.data.js',
        './data/chip-node.data.js',
        './data/chip-features.data.js',
        './data/chip-research.data.js',
        './systems/ChipSystem.js',
        './systems/FabSystem.js',
        './ui/phone/ChipMockup.js',
        './ui/charts/ChipRadarChart.js',
        './ui/panels/ChipDesignerPanel.js',
        './ui/panels/FabPanel.js'
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
