// FILE: src/ui/panels/OSPanel.js
// Sub-tab OS dalam tab Riset. Menampilkan OS aktif, wizard versi baru,
// daftar fitur, bug, apps, dan lisensi.
import { renderOsStatBar } from './OsStatBar.js';
import { OS_FEATURES, OS_LICENSES, BUILTIN_APPS, OS_ERAS } from '../../data/os.data.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function renderOSPanel({ osSystem, researchSystem }) {
    const data = window.__game.state.get();
    const os = data.os;

    // ===== Belum ada OS =====
    if (!os.name) {
        return `
            <div class="empty">
                <div class="empty-ico">💿</div>
                <div class="empty-title">Belum ada OS</div>
                <div class="empty-desc">Bangun sistem operasi sendiri atau lisensi OS pihak ketiga.</div>
                <button class="btn-primary" data-os-action="create" style="max-width:220px;margin:0 auto;">Buat OS</button>
            </div>
        `;
    }

    const currentVersion = osSystem.getCurrentVersionObject();
    const developing = os.developing;

    // ===== Kartu OS aktif =====
    const headerHtml = `
        <div class="card">
            <div class="card-title">OS Aktif</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div>
                    <div style="font-size:16px;font-weight:700;">${escapeHtml(os.name)}</div>
                    <div style="font-size:12px;color:var(--text-dim);">
                        ${currentVersion ? 'Versi ' + escapeHtml(currentVersion.versionString) : 'Belum ada versi rilis'}
                    </div>
                </div>
                <button class="btn-secondary" data-os-action="wizard" style="min-width:auto;padding:8px 12px;font-size:12px;">
                    + Versi Baru
                </button>
            </div>
            ${currentVersion
                ? renderOsStatBar(currentVersion.stats)
                : '<div style="font-size:12px;color:var(--text-dim);">Kembangkan versi pertama (v1.0) untuk melihat stat.</div>'}
        </div>
    `;

    // ===== Progres pengembangan versi =====
    const devHtml = developing ? `
        <div class="card">
            <div class="card-title">Mengembangkan ${escapeHtml(developing.versionString)}</div>
            <div class="progress-label">
                <span>${developing.features.length} fitur</span>
                <span data-os-dev-pct>0%</span>
            </div>
            <div class="progress">
                <div class="progress-bar" data-os-dev-bar style="width:0%;"></div>
            </div>
            <div style="font-size:11.5px;color:var(--text-dim);margin-top:8px;" data-os-dev-eta>
                Menghitung estimasi...
            </div>
            <button class="btn-danger" data-os-action="cancel-deving" style="margin-top:10px;width:100%;">
                Batalkan Pengembangan
            </button>
        </div>
    ` : '';

    // ===== Bug aktif =====
    const activeBugs = os.bugs.filter(b => b.status === 'active' || b.status === 'patching');
    const bugsHtml = activeBugs.length ? `
        <div class="card">
            <div class="card-title">Bug Aktif (${activeBugs.length})</div>
            ${activeBugs.map(b => {
                const isPatching = b.status === 'patching';
                return `
                    <div class="bug-item">
                        <div style="flex:1;">
                            <div class="bug-name">⚠ ${escapeHtml(b.name)}</div>
                            <div class="bug-meta">Severity ${b.severity} • Patch $${b.patchCost.toLocaleString('en-US')} • ${b.patchDays} hari</div>
                        </div>
                        ${isPatching
                            ? '<div class="bug-badge">DIPATCH</div>'
                            : `<div style="display:flex;gap:6px;">
                                <button class="btn-secondary" data-os-action="patch-bug" data-bug-id="${b.id}" style="padding:6px 10px;min-height:36px;font-size:11.5px;">Patch</button>
                                <button class="btn-secondary" data-os-action="ignore-bug" data-bug-id="${b.id}" style="padding:6px 10px;min-height:36px;font-size:11.5px;opacity:0.7;">Abaikan</button>
                            </div>`
                        }
                    </div>
                `;
            }).join('')}
        </div>
    ` : '';

    // ===== Fitur OS grouped by era =====
    const featuresHtml = `
        <div class="card">
            <div class="card-title">Fitur OS</div>
            ${OS_ERAS.map(era => {
                const eraFeatures = OS_FEATURES.filter(f => f.era === era.id);
                if (!eraFeatures.length) return '';
                return `
                    <div class="era-group">
                        <div class="era-label">${era.name}</div>
                        ${eraFeatures.map(f => {
                            const st = osSystem.getFeatureStatus(f.id);
                            return `
                                <div class="feature-item feature-${st.status}" data-os-action="feature-detail" data-feature-id="${f.id}">
                                    <div style="flex:1;">
                                        <div class="feature-name">${escapeHtml(f.name)}</div>
                                        <div class="feature-status">${_statusLabel(st)}</div>
                                    </div>
                                    <div class="feature-badge badge-${st.status}">${_statusBadge(st.status)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // ===== Aplikasi =====
    const appsHtml = osSystem.hasFeature('fw_appstore') ? `
        <div class="card">
            <div class="card-title">Ekosistem Aplikasi</div>
            <div class="sum-row"><span>Aplikasi bawaan</span><b>${os.apps.builtin.length}</b></div>
            <div class="sum-row"><span>Aplikasi pihak ketiga</span><b>${os.apps.thirdParty}</b></div>
            <div style="margin-top:10px;">
                ${BUILTIN_APPS.map(a => {
                    const owned = os.apps.builtin.includes(a.id);
                    const hasFeature = !a.requiresFeature || osSystem.hasFeature(a.requiresFeature);
                    const canStart = !owned && hasFeature;
                    return `
                        <div class="app-item">
                            <div style="flex:1;">
                                <div class="app-name">${escapeHtml(a.name)}</div>
                                <div class="app-meta">$${a.devCost.toLocaleString('en-US')} • +${a.appealBonus} appeal</div>
                            </div>
                            ${owned
                                ? '<div class="app-badge">DIMILIKI</div>'
                                : canStart
                                    ? `<button class="btn-secondary" data-os-action="start-app" data-app-id="${a.id}" style="padding:6px 10px;min-height:36px;font-size:11.5px;">Buat</button>`
                                    : '<div class="app-badge locked">TERKUNCI</div>'
                            }
                        </div>
                    `;
                }).join('')}
            </div>
            <button class="btn-secondary" data-os-action="invite-devs" style="margin-top:12px;width:100%;">
                Undang Developer (+apps)
            </button>
        </div>
    ` : '';

    // ===== Lisensi =====
    const licensesHtml = `
        <div class="card">
            <div class="card-title">Lisensi OS Pihak Ketiga</div>
            <div style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">
                Alternatif jika tidak mau mengembangkan OS sendiri. Biaya per unit, stat tetap.
            </div>
            ${OS_LICENSES.map(l => {
                const available = data.time.currentYear >= l.availableFromYear;
                return `
                    <div class="license-item ${available ? '' : 'locked'}">
                        <div style="flex:1;">
                            <div class="license-name">${escapeHtml(l.name)}</div>
                            <div class="license-meta">$${l.costPerUnit}/unit • tersedia ${l.availableFromYear}</div>
                        </div>
                        <div class="license-stat">${Math.round((l.stats.stability + l.stats.speed + l.stats.features + l.stats.security + l.stats.design) / 5)}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    return headerHtml + devHtml + bugsHtml + featuresHtml + appsHtml + licensesHtml;
}

function _statusLabel(st) {
    if (st.status === 'owned') return 'Sudah dimiliki';
    if (st.status === 'developing') return 'Sedang dikembangkan';
    if (st.status === 'available') return 'Tersedia untuk versi berikutnya';
    return st.reason || 'Terkunci';
}

function _statusBadge(s) {
    if (s === 'owned') return '✓';
    if (s === 'developing') return '⏳';
    if (s === 'available') return '+';
    return '🔒';
}

// ============================================================
// Wizard modal — kembangkan versi baru
// ============================================================
export function openOsWizardModal({ osSystem }) {
    const available = osSystem.getAvailableFeatures();
    if (!available.length) {
        window.__game.ToastService.warning('Tidak ada fitur baru yang tersedia.');
        return;
    }
    const maxSlots = osSystem._getMaxFeatureSlots();
    const baseStats = osSystem.previewStats([]);

    const featureHtml = available.map(f => `
        <label class="wiz-feature">
            <input type="checkbox" data-wiz-feature="${f.id}">
            <div style="flex:1;">
                <div class="wiz-name">${escapeHtml(f.name)}</div>
                <div class="wiz-meta">$${f.devCost.toLocaleString('en-US')} • ${f.devDays} hari</div>
            </div>
        </label>
    `).join('');

    const html = `
        <div class="modal-title">Kembangkan Versi Baru</div>
        <div class="modal-sub">Pilih maks ${maxSlots} fitur. Stat akan dihitung ulang.</div>
        <div style="max-height:40vh;overflow-y:auto;margin-bottom:12px;" data-wiz-list>
            ${featureHtml}
        </div>
        <div class="card-title">Preview Stat</div>
        <div data-wiz-preview style="margin-bottom:12px;">
            ${renderOsStatBar(baseStats)}
        </div>
        <div class="sum-row"><span>Total biaya</span><b data-wiz-cost>$0</b></div>
        <div class="sum-row"><span>Durasi</span><b data-wiz-days>0 hari</b></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-primary" data-wiz-confirm style="flex:1;">Mulai Kembangkan</button>
        </div>
    `;

    window.__game.Modal.open('os-wizard', html);

    const root = document.querySelector('[data-modal-id="os-wizard"]');
    const preview = root.querySelector('[data-wiz-preview]');
    const costEl = root.querySelector('[data-wiz-cost]');
    const daysEl = root.querySelector('[data-wiz-days]');
    const checkboxes = root.querySelectorAll('[data-wiz-feature]');

    function refresh() {
        const selected = Array.from(checkboxes).filter(c => c.checked);
        // Batasi maks
        if (selected.length > maxSlots) {
            selected[selected.length - 1].checked = false;
            window.__game.ToastService.warning('Maks ' + maxSlots + ' fitur per versi.');
            return refresh();
        }

        let cost = 0, days = 0;
        const selectedIds = [];
        selected.forEach(c => {
            const f = available.find(x => x.id === c.dataset.wizFeature);
            if (!f) return;
            cost += f.devCost;
            days += f.devDays;
            selectedIds.push(f.id);
        });

        // Preview via OSSystem supaya sama dengan hasil akhir versi.
        const stats = osSystem.previewStats(selectedIds);

        preview.innerHTML = renderOsStatBar(stats);
        costEl.textContent = '$' + cost.toLocaleString('en-US');
        daysEl.textContent = days + ' hari';
    }

    checkboxes.forEach(cb => cb.addEventListener('change', refresh));

    root.querySelector('[data-wiz-confirm]').addEventListener('click', () => {
        const selected = Array.from(checkboxes).filter(c => c.checked).map(c => c.dataset.wizFeature);
        if (!selected.length) {
            window.__game.ToastService.warning('Pilih minimal 1 fitur.');
            return;
        }
        const res = osSystem.startVersion(selected);
        if (!res.ok) {
            window.__game.ToastService.error(res.reason || 'Gagal memulai.');
        } else {
            window.__game.ToastService.success('Pengembangan ' + res.versionString + ' dimulai!');
            window.__game.Modal.close('os-wizard', true);
            window.__game.render();
        }
    });
}

// ============================================================
// Modal buat OS baru
// ============================================================
export function openCreateOsModal({ osSystem }) {
    const html = `
        <div class="modal-title">Buat OS Baru</div>
        <div class="modal-sub">Beri nama sistem operasi perusahaanmu.</div>
        <label class="field-label">Nama OS</label>
        <input class="field-input" data-os-name maxlength="24" placeholder="Contoh: MyOS, Aurora, ..." />
        <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-primary" data-os-create-confirm style="flex:1;">Buat</button>
        </div>
    `;
    window.__game.Modal.open('os-create', html);
    const root = document.querySelector('[data-modal-id="os-create"]');
    const input = root.querySelector('[data-os-name]');
    input.focus();
    root.querySelector('[data-os-create-confirm]').addEventListener('click', () => {
        const res = osSystem.createOs(input.value);
        if (!res.ok) {
            window.__game.ToastService.error(res.reason);
        } else {
            window.__game.ToastService.success('OS dibuat!');
            window.__game.Modal.close('os-create', true);
            window.__game.render();
        }
    });
}

// ============================================================
// Modal detail fitur
// ============================================================
export function openFeatureDetailModal({ osSystem, featureId }) {
    const f = OS_FEATURES.find(x => x.id === featureId);
    if (!f) return;
    const st = osSystem.getFeatureStatus(featureId);
    const html = `
        <div class="modal-title">${escapeHtml(f.name)}</div>
        <div class="modal-sub">${escapeHtml(f.description)}</div>
        <div class="sum-row"><span>Era</span><b>${f.era}</b></div>
        <div class="sum-row"><span>Tahun min</span><b>${f.minYear}</b></div>
        <div class="sum-row"><span>Biaya</span><b>$${f.devCost.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>Durasi</span><b>${f.devDays} hari</b></div>
        <div class="card-title" style="margin-top:12px;">Efek Stat</div>
        ${renderOsStatBar({
            stability: f.statEffects.stability || 0,
            speed: f.statEffects.speed || 0,
            features: f.statEffects.features || 0,
            security: f.statEffects.security || 0,
            design: f.statEffects.design || 0
        }, { compact: true })}
        <div class="sum-row" style="margin-top:12px;"><span>Status</span><b>${_statusLabel(st)}</b></div>
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">Tutup</button>
    `;
    window.__game.Modal.open('feature-detail', html);
}
