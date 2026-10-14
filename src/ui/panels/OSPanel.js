// FILE: src/ui/panels/OSPanel.js
// Sub-tab OS dalam tab Riset.
// v2026.3 — row-based, section-grouped (konsisten dengan Research v2026.2).
import { renderOsStatBar } from './OsStatBar.js';
import { OS_FEATURES, OS_LICENSES, BUILTIN_APPS, OS_ERAS } from '../../data/os.data.js';
import { renderOsScreenMockup } from '../phone/OsScreenMockup.js';
import { renderIcon } from '../icons/FeatureIcons.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

var STAT_ORDER = ['stability', 'speed', 'features', 'security', 'design'];
var STAT_SHORT = {
    stability: 'Stab', speed: 'Cepat', features: 'Fitur',
    security: 'Aman', design: 'Desain'
};

// ============================================================
// MAIN
// ============================================================
export function renderOSPanel({ osSystem, researchSystem }) {
    const data = window.__game.state.get();
    const os = data.os;

    if (!os.name) {
        return _renderEmptyState();
    }

    const currentVersion = osSystem.getCurrentVersionObject();
    const developing = os.developing;

    const hero = _renderHero(os, currentVersion, osSystem);
    const devStrip = developing ? _renderDevStrip(developing) : '';

    const bugsHtml = _renderBugsSection(os.bugs);
    const featuresHtml = _renderFeaturesSection(osSystem);
    const appsHtml = _renderAppsSection(osSystem, os);
    const licensesHtml = _renderLicensesSection(data);

    return hero + devStrip + bugsHtml + featuresHtml + appsHtml + licensesHtml;
}

// ============================================================
// EMPTY STATE
// ============================================================
function _renderEmptyState() {
    return '<div class="empty">' +
        '<div class="empty-ico" style="font-size:0;line-height:0;">' +
            renderIcon('disc', 48) +
        '</div>' +
        '<div class="empty-title">Belum ada OS</div>' +
        '<div class="empty-desc">Bangun sistem operasi sendiri atau lisensi OS pihak ketiga.</div>' +
        '<button class="btn-primary" data-os-action="create" style="max-width:220px;margin:0 auto;">Buat OS</button>' +
        '</div>';
}

// ============================================================
// HERO — mockup + nama + tombol + stat bar
// ============================================================
function _renderHero(os, currentVersion, osSystem) {
    let mockupHtml = '';
    try {
        mockupHtml = renderOsScreenMockup({ size: 100 });
    } catch (e) {
        console.error('[OSPanel] mockup error:', e);
        mockupHtml = '';
    }

    const verLabel = currentVersion
        ? 'Versi ' + escapeHtml(currentVersion.versionString)
        : 'Belum ada versi rilis';

    const statHtml = currentVersion
        ? renderOsStatBar(currentVersion.stats)
        : '<div class="os-hero-empty-stat">Kembangkan versi pertama (v1.0) untuk melihat stat.</div>';

    return '<div class="card os-hero">' +
        '<div class="os-hero-top">' +
            '<div class="os-hero-screen">' + mockupHtml + '</div>' +
            '<div class="os-hero-info">' +
                '<div class="os-hero-name">' + escapeHtml(os.name) + '</div>' +
                '<div class="os-hero-version">' + verLabel + '</div>' +
                '<button class="btn-primary os-hero-cta" data-os-action="wizard">' +
                    '<span style="font-size:15px;line-height:1;margin-right:4px;">+</span>' +
                    'Kembangkan Versi Baru' +
                '</button>' +
            '</div>' +
        '</div>' +
        '<div class="os-hero-stats">' + statHtml + '</div>' +
        '</div>';
}

// ============================================================
// DEV STRIP — pakai .slot-strip dari v2026.2
// ============================================================
function _renderDevStrip(developing) {
    return '<div class="slot-strip">' +
        '<div class="slot-strip-top">' +
            '<span class="slot-strip-label">Sedang Dikembangkan</span>' +
            '<span class="slot-strip-count">' + escapeHtml(developing.versionString) + '</span>' +
        '</div>' +
        '<div class="slot-strip-item">' +
            '<div class="slot-strip-item-head">' +
                '<span class="slot-strip-item-name">' +
                    developing.features.length + ' fitur baru' +
                '</span>' +
                '<span class="slot-strip-item-pct" data-os-dev-pct>0%</span>' +
            '</div>' +
            '<div class="progress slot-strip-item-progress">' +
                '<div class="progress-bar" data-os-dev-bar style="width:0%;"></div>' +
            '</div>' +
            '<div class="slot-strip-item-eta" data-os-dev-eta>Menghitung estimasi...</div>' +
        '</div>' +
        '<button class="btn-danger os-dev-cancel" data-os-action="cancel-deving">' +
            'Batalkan Pengembangan' +
        '</button>' +
        '</div>';
}

// ============================================================
// BUGS
// ============================================================
function _renderBugsSection(bugs) {
    const active = (bugs || []).filter(function (b) {
        return b.status === 'active' || b.status === 'patching';
    });
    if (!active.length) return '';

    const rows = active.map(function (b) {
        const isPatching = b.status === 'patching';
        return '<div class="os-row os-bug-row">' +
            '<div class="os-row-main">' +
                '<div class="os-row-title">' +
                    '<span class="os-bug-dot" aria-hidden="true"></span>' +
                    escapeHtml(b.name) +
                '</div>' +
                '<div class="os-row-meta">' +
                    '<span class="os-bug-sev">Sev ' + b.severity + '</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>$' + b.patchCost.toLocaleString('en-US') + '</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>' + b.patchDays + ' hari</span>' +
                '</div>' +
            '</div>' +
            '<div class="os-row-actions">' +
                (isPatching
                    ? '<span class="os-status-badge os-status-running">DIPATCH</span>'
                    : '<button class="os-mini-btn" data-os-action="patch-bug" data-bug-id="' + b.id + '">Patch</button>' +
                      '<button class="os-mini-btn os-mini-btn-ghost" data-os-action="ignore-bug" data-bug-id="' + b.id + '">Abaikan</button>'
                ) +
            '</div>' +
            '</div>';
    }).join('');

    return '<div class="section-label">' +
        '<span class="section-label-text">Bug Aktif · ' + active.length + '</span>' +
        '<span class="section-label-line"></span>' +
        '</div>' +
        '<div class="os-list">' + rows + '</div>';
}

// ============================================================
// FEATURES
// ============================================================
function _renderFeaturesSection(osSystem) {
    var groups = { available: [], developing: [], owned: [], locked: [] };

    OS_FEATURES.forEach(function (f) {
        var st = osSystem.getFeatureStatus(f.id);
        var bucket = groups[st.status] || groups.locked;
        bucket.push({ node: f, status: st.status });
    });

    Object.keys(groups).forEach(function (k) {
        groups[k].sort(function (a, b) {
            if (a.node.minYear !== b.node.minYear) return (a.node.minYear || 0) - (b.node.minYear || 0);
            return 0;
        });
    });

    var html = '';

    if (groups.available.length) {
        html += _renderFeatureGroup('Tersedia', groups.available, 'available');
    }
    if (groups.developing.length) {
        html += _renderFeatureGroup('Dikembangkan', groups.developing, 'developing');
    }
    if (groups.owned.length) {
        html += _renderFeatureGroupCollapsible('Dimiliki', groups.owned, 'owned');
    }
    if (groups.locked.length) {
        html += _renderFeatureGroupCollapsible('Terkunci', groups.locked, 'locked');
    }

    return html;
}

function _renderFeatureGroup(label, items, status) {
    var header = '<div class="section-label">' +
        '<span class="section-label-text">' + label + ' · ' + items.length + '</span>' +
        '<span class="section-label-line"></span>' +
        '</div>';
    var rows = items.map(function (it) { return _renderFeatureRow(it.node, it.status); }).join('');
    return header + '<div class="os-list">' + rows + '</div>';
}

function _renderFeatureGroupCollapsible(label, items, status) {
    var header = '<summary class="section-summary">' +
        '<span class="section-summary-text">' + label + ' · ' + items.length + '</span>' +
        '<span class="section-summary-line"></span>' +
        '</summary>';
    var rows = items.map(function (it) { return _renderFeatureRow(it.node, it.status); }).join('');
    return '<details class="section-collapsible">' + header +
        '<div class="os-list">' + rows + '</div>' +
        '</details>';
}

function _renderFeatureRow(feature, status) {
    var era = OS_ERAS.find(function (e) { return e.id === feature.era; });
    var eraName = era ? era.name : feature.era;

    // Stat effects compact
    var se = feature.statEffects || {};
    var statChips = STAT_ORDER.map(function (k) {
        var v = se[k] || 0;
        if (v <= 0) return '';
        return '<span class="os-stat-chip">+' + v + ' ' + STAT_SHORT[k] + '</span>';
    }).filter(function (s) { return s; }).join('');

    var badgeCls = 'os-status-badge os-status-' + status;
    var badgeLabel = status === 'owned' ? 'DIMILIKI'
        : status === 'developing' ? 'DIKEMBANGKAN'
        : status === 'available' ? 'TERSEDIA'
        : 'TERKUNCI';

    return '<div class="os-row os-feat-row os-feat-' + status + '" data-os-action="feature-detail" data-feature-id="' + feature.id + '">' +
        '<div class="os-row-main">' +
            '<div class="os-row-title">' +
                escapeHtml(feature.name) +
                '<span class="os-row-year">' + feature.minYear + '</span>' +
            '</div>' +
            '<div class="os-row-meta">' +
                '<span>' + escapeHtml(eraName) + '</span>' +
                (statChips ? '<span class="os-row-dot">·</span>' + statChips : '') +
            '</div>' +
            '<div class="os-row-foot">' +
                '<span class="os-row-cost">$' + feature.devCost.toLocaleString('en-US') + '</span>' +
                '<span class="os-row-dot">·</span>' +
                '<span class="os-row-dur">' + feature.devDays + ' hari</span>' +
            '</div>' +
        '</div>' +
        '<div class="os-row-actions">' +
            '<span class="' + badgeCls + '">' + badgeLabel + '</span>' +
        '</div>' +
        '</div>';
}

// ============================================================
// APPS
// ============================================================
function _renderAppsSection(osSystem, os) {
    if (!osSystem.hasFeature('fw_appstore')) return '';

    var owned = os.apps.builtin || [];
    var thirdParty = os.apps.thirdParty || 0;
    var total = BUILTIN_APPS.length;

    var rows = BUILTIN_APPS.map(function (a) {
        var isOwned = owned.indexOf(a.id) !== -1;
        var hasFeature = !a.requiresFeature || osSystem.hasFeature(a.requiresFeature);
        var canStart = !isOwned && hasFeature;

        var statusHtml = '';
        if (isOwned) {
            statusHtml = '<span class="os-status-badge os-status-owned">DIMILIKI</span>';
        } else if (!hasFeature) {
            statusHtml = '<span class="os-status-badge os-status-locked">TERKUNCI</span>';
        } else {
            statusHtml = '<button class="os-mini-btn os-mini-btn-primary" data-os-action="start-app" data-app-id="' + a.id + '">Buat</button>';
        }

        return '<div class="os-row os-app-row">' +
            '<div class="os-row-main">' +
                '<div class="os-row-title">' + escapeHtml(a.name) + '</div>' +
                '<div class="os-row-meta">' +
                    '<span>$' + a.devCost.toLocaleString('en-US') + '</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>+' + a.appealBonus + ' appeal</span>' +
                '</div>' +
            '</div>' +
            '<div class="os-row-actions">' + statusHtml + '</div>' +
            '</div>';
    }).join('');

    return '<div class="section-label">' +
        '<span class="section-label-text">Ekosistem Aplikasi · ' + owned.length + '/' + total + '</span>' +
        '<span class="section-label-line"></span>' +
        '</div>' +
        '<div class="os-apps-summary">' +
            '<span>Aplikasi pihak ketiga: <b>' + thirdParty + '</b></span>' +
        '</div>' +
        '<div class="os-list">' + rows + '</div>' +
        '<button class="btn-secondary os-apps-invite" data-os-action="invite-devs">' +
            'Undang Developer (+apps)' +
        '</button>';
}

// ============================================================
// LICENSES — collapsible
// ============================================================
function _renderLicensesSection(data) {
    var rows = OS_LICENSES.map(function (l) {
        var available = data.time.currentYear >= l.availableFromYear;
        var avgStat = Math.round(
            (l.stats.stability + l.stats.speed + l.stats.features + l.stats.security + l.stats.design) / 5
        );
        return '<div class="os-row os-lic-row' + (available ? '' : ' os-lic-locked') + '">' +
            '<div class="os-row-main">' +
                '<div class="os-row-title">' + escapeHtml(l.name) + '</div>' +
                '<div class="os-row-meta">' +
                    '<span>$' + l.costPerUnit + '/unit</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>' + (available ? 'Tersedia' : 'Tersedia ' + l.availableFromYear) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="os-row-actions">' +
                '<span class="os-lic-stat">' + avgStat + '</span>' +
            '</div>' +
            '</div>';
    }).join('');

    var header = '<summary class="section-summary">' +
        '<span class="section-summary-text">Lisensi OS Pihak Ketiga</span>' +
        '<span class="section-summary-line"></span>' +
        '</summary>';

    return '<details class="section-collapsible">' + header +
        '<div class="os-list">' + rows + '</div>' +
        '</details>';
}

// ============================================================
// MODAL — WIZARD VERSI BARU (tidak berubah)
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
// MODAL — BUAT OS BARU (tidak berubah)
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
// MODAL — DETAIL FITUR (tidak berubah)
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

function _statusLabel(st) {
    if (st.status === 'owned') return 'Sudah dimiliki';
    if (st.status === 'developing') return 'Sedang dikembangkan';
    if (st.status === 'available') return 'Tersedia untuk versi berikutnya';
    return st.reason || 'Terkunci';
            }
