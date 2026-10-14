// FILE: src/ui/panels/OSPanel.js
// Sub-tab OS dalam tab Riset.
// v2026.3 — row-based, section-grouped (konsisten dengan Research v2026.2).
// v2027.13c — i18n.
import { renderOsStatBar } from './OsStatBar.js';
import { OS_FEATURES, OS_LICENSES, BUILTIN_APPS, OS_ERAS } from '../../data/os.data.js';
import { renderOsScreenMockup } from '../phone/OsScreenMockup.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

var STAT_ORDER = ['stability', 'speed', 'features', 'security', 'design'];
var STAT_SHORT_KEYS = {
    stability: 'os.stat.stab_short',
    speed:     'os.stat.cepat_short',
    features:  'os.stat.fitur_short',
    security:  'os.stat.aman_short',
    design:    'os.stat.desain_short'
};

// ============================================================
// MAIN
// ============================================================
export function renderOSPanel(params) {
    var osSystem = params.osSystem;
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
        '<div class="empty-title">' + t('os.empty.title') + '</div>' +
        '<div class="empty-desc">' + t('os.empty.desc') + '</div>' +
        '<button class="btn-primary" data-os-action="create" style="max-width:220px;margin:0 auto;">' + t('os.empty.create') + '</button>' +
        '</div>';
}

// ============================================================
// HERO
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
        ? t('os.hero.version', { v: escapeHtml(currentVersion.versionString) })
        : t('os.hero.no_version');

    const statHtml = currentVersion
        ? renderOsStatBar(currentVersion.stats)
        : '<div class="os-hero-empty-stat">' + t('os.hero.dev_empty') + '</div>';

    return '<div class="card os-hero">' +
        '<div class="os-hero-top">' +
            '<div class="os-hero-screen">' + mockupHtml + '</div>' +
            '<div class="os-hero-info">' +
                '<div class="os-hero-name">' + escapeHtml(os.name) + '</div>' +
                '<div class="os-hero-version">' + verLabel + '</div>' +
                '<button class="btn-primary os-hero-cta" data-os-action="wizard">' +
                    '<span style="font-size:15px;line-height:1;margin-right:4px;">+</span>' +
                    t('os.hero.dev_new') +
                '</button>' +
            '</div>' +
        '</div>' +
        '<div class="os-hero-stats">' + statHtml + '</div>' +
        '</div>';
}

// ============================================================
// DEV STRIP
// ============================================================
function _renderDevStrip(developing) {
    return '<div class="slot-strip">' +
        '<div class="slot-strip-top">' +
            '<span class="slot-strip-label">' + t('os.dev.title') + '</span>' +
            '<span class="slot-strip-count">' + escapeHtml(developing.versionString) + '</span>' +
        '</div>' +
        '<div class="slot-strip-item">' +
            '<div class="slot-strip-item-head">' +
                '<span class="slot-strip-item-name">' +
                    t('os.dev.features_count', { n: developing.features.length }) +
                '</span>' +
                '<span class="slot-strip-item-pct" data-os-dev-pct>0%</span>' +
            '</div>' +
            '<div class="progress slot-strip-item-progress">' +
                '<div class="progress-bar" data-os-dev-bar style="width:0%;"></div>' +
            '</div>' +
            '<div class="slot-strip-item-eta" data-os-dev-eta>' + t('os.dev.eta_calc') + '</div>' +
        '</div>' +
        '<button class="btn-danger os-dev-cancel" data-os-action="cancel-deving">' +
            t('os.dev.cancel') +
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
                    '<span class="os-bug-sev">' + t('os.bug.severity', { n: b.severity }) + '</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>$' + b.patchCost.toLocaleString('en-US') + '</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>' + b.patchDays + ' </span>' +
                '</div>' +
            '</div>' +
            '<div class="os-row-actions">' +
                (isPatching
                    ? '<span class="os-status-badge os-status-running">' + t('os.bug.patching') + '</span>'
                    : '<button class="os-mini-btn" data-os-action="patch-bug" data-bug-id="' + b.id + '">' + t('os.bug.patch') + '</button>' +
                      '<button class="os-mini-btn os-mini-btn-ghost" data-os-action="ignore-bug" data-bug-id="' + b.id + '">' + t('os.bug.ignore') + '</button>'
                ) +
            '</div>' +
            '</div>';
    }).join('');

    return '<div class="section-label">' +
        '<span class="section-label-text">' + t('os.bug.title', { n: active.length }) + '</span>' +
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
        html += _renderFeatureGroup(t('os.features.section_available'), groups.available, 'available');
    }
    if (groups.developing.length) {
        html += _renderFeatureGroup(t('os.features.section_deving'), groups.developing, 'developing');
    }
    if (groups.owned.length) {
        html += _renderFeatureGroupCollapsible(t('os.features.section_owned'), groups.owned, 'owned');
    }
    if (groups.locked.length) {
        html += _renderFeatureGroupCollapsible(t('os.features.section_locked'), groups.locked, 'locked');
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

    var se = feature.statEffects || {};
    var statChips = STAT_ORDER.map(function (k) {
        var v = se[k] || 0;
        if (v <= 0) return '';
        return '<span class="os-stat-chip">+' + v + ' ' + t(STAT_SHORT_KEYS[k]) + '</span>';
    }).filter(function (s) { return s; }).join('');

    var badgeCls = 'os-status-badge os-status-' + status;
    var badgeLabel = status === 'owned' ? t('os.feature.badge_owned')
        : status === 'developing' ? t('os.feature.badge_deving')
        : status === 'available' ? t('os.feature.badge_available')
        : t('os.feature.badge_locked');

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
                '<span class="os-row-dur">' + feature.devDays + '</span>' +
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

        var statusHtml = '';
        if (isOwned) {
            statusHtml = '<span class="os-status-badge os-status-owned">' + t('os.apps.owned_badge') + '</span>';
        } else if (!hasFeature) {
            statusHtml = '<span class="os-status-badge os-status-locked">' + t('os.apps.locked_badge') + '</span>';
        } else {
            statusHtml = '<button class="os-mini-btn os-mini-btn-primary" data-os-action="start-app" data-app-id="' + a.id + '">' + t('os.apps.build') + '</button>';
        }

        return '<div class="os-row os-app-row">' +
            '<div class="os-row-main">' +
                '<div class="os-row-title">' + escapeHtml(a.name) + '</div>' +
                '<div class="os-row-meta">' +
                    '<span>$' + a.devCost.toLocaleString('en-US') + '</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>' + t('os.apps.appeal_bonus', { n: a.appealBonus }) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="os-row-actions">' + statusHtml + '</div>' +
            '</div>';
    }).join('');

    return '<div class="section-label">' +
        '<span class="section-label-text">' + t('os.apps.section', { owned: owned.length, total: total }) + '</span>' +
        '<span class="section-label-line"></span>' +
        '</div>' +
        '<div class="os-apps-summary">' +
            '<span>' + t('os.apps.third_party', { n: thirdParty }) + '</span>' +
        '</div>' +
        '<div class="os-list">' + rows + '</div>' +
        '<button class="btn-secondary os-apps-invite" data-os-action="invite-devs">' +
            t('os.apps.invite') +
        '</button>';
}

// ============================================================
// LICENSES
// ============================================================
function _renderLicensesSection(data) {
    var rows = OS_LICENSES.map(function (l) {
        var available = data.time.currentYear >= l.availableFromYear;
        var avgStat = Math.round(
            (l.stats.stability + l.stats.speed + l.stats.features + l.stats.security + l.stats.design) / 5
        );
        var availLabel = available ? t('os.licenses.available') : t('os.licenses.available_from', { year: l.availableFromYear });
        return '<div class="os-row os-lic-row' + (available ? '' : ' os-lic-locked') + '">' +
            '<div class="os-row-main">' +
                '<div class="os-row-title">' + escapeHtml(l.name) + '</div>' +
                '<div class="os-row-meta">' +
                    '<span>' + t('os.licenses.per_unit', { cost: l.costPerUnit }) + '</span>' +
                    '<span class="os-row-dot">·</span>' +
                    '<span>' + availLabel + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="os-row-actions">' +
                '<span class="os-lic-stat">' + avgStat + '</span>' +
            '</div>' +
            '</div>';
    }).join('');

    var header = '<summary class="section-summary">' +
        '<span class="section-summary-text">' + t('os.licenses.section') + '</span>' +
        '<span class="section-summary-line"></span>' +
        '</summary>';

    return '<details class="section-collapsible">' + header +
        '<div class="os-list">' + rows + '</div>' +
        '</details>';
}

// ============================================================
// MODAL — WIZARD VERSI BARU
// ============================================================
export function openOsWizardModal(params) {
    var osSystem = params.osSystem;
    const available = osSystem.getAvailableFeatures();
    if (!available.length) {
        window.__game.ToastService.warning(t('os.wizard.no_features'));
        return;
    }
    const maxSlots = osSystem._getMaxFeatureSlots();
    const baseStats = osSystem.previewStats([]);

    const featureHtml = available.map(function (f) {
        return '<label class="wiz-feature">' +
            '<input type="checkbox" data-wiz-feature="' + f.id + '">' +
            '<div style="flex:1;">' +
                '<div class="wiz-name">' + escapeHtml(f.name) + '</div>' +
                '<div class="wiz-meta">$' + f.devCost.toLocaleString('en-US') + ' • ' + f.devDays + '</div>' +
            '</div>' +
            '</label>';
    }).join('');

    const html = `
        <div class="modal-title">${t('os.wizard.title')}</div>
        <div class="modal-sub">${t('os.wizard.sub', { n: maxSlots })}</div>
        <div style="max-height:40vh;overflow-y:auto;margin-bottom:12px;" data-wiz-list>
            ${featureHtml}
        </div>
        <div class="card-title">${t('os.wizard.preview')}</div>
        <div data-wiz-preview style="margin-bottom:12px;">
            ${renderOsStatBar(baseStats)}
        </div>
        <div class="sum-row"><span>${t('os.wizard.total_cost')}</span><b data-wiz-cost>$0</b></div>
        <div class="sum-row"><span>${t('os.wizard.duration')}</span><b data-wiz-days>0</b></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">${t('os.wizard.cancel')}</button>
            <button class="btn-primary" data-wiz-confirm style="flex:1;">${t('os.wizard.start')}</button>
        </div>
    `;

    window.__game.Modal.open('os-wizard', html);

    const root = document.querySelector('[data-modal-id="os-wizard"]');
    const preview = root.querySelector('[data-wiz-preview]');
    const costEl = root.querySelector('[data-wiz-cost]');
    const daysEl = root.querySelector('[data-wiz-days]');
    const checkboxes = root.querySelectorAll('[data-wiz-feature]');

    function refresh() {
        const selected = Array.from(checkboxes).filter(function (c) { return c.checked; });
        if (selected.length > maxSlots) {
            selected[selected.length - 1].checked = false;
            window.__game.ToastService.warning(t('os.wizard.max_features', { n: maxSlots }));
            return refresh();
        }
        let cost = 0, days = 0;
        const selectedIds = [];
        selected.forEach(function (c) {
            const f = available.find(function (x) { return x.id === c.dataset.wizFeature; });
            if (!f) return;
            cost += f.devCost;
            days += f.devDays;
            selectedIds.push(f.id);
        });
        const stats = osSystem.previewStats(selectedIds);
        preview.innerHTML = renderOsStatBar(stats);
        costEl.textContent = '$' + cost.toLocaleString('en-US');
        daysEl.textContent = days;
    }

    checkboxes.forEach(function (cb) { cb.addEventListener('change', refresh); });

    root.querySelector('[data-wiz-confirm]').addEventListener('click', function () {
        const selected = Array.from(checkboxes).filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.wizFeature; });
        if (!selected.length) {
            window.__game.ToastService.warning(t('os.wizard.select_min'));
            return;
        }
        const res = osSystem.startVersion(selected);
        if (!res.ok) {
            window.__game.ToastService.error(res.reason || 'Failed.');
        } else {
            window.__game.ToastService.success('v' + res.versionString);
            window.__game.Modal.close('os-wizard', true);
            window.__game.render();
        }
    });
}

// ============================================================
// MODAL — BUAT OS BARU
// ============================================================
export function openCreateOsModal(params) {
    var osSystem = params.osSystem;
    const html = `
        <div class="modal-title">${t('os.create.title')}</div>
        <div class="modal-sub">${t('os.create.sub')}</div>
        <label class="field-label">${t('os.create.label')}</label>
        <input class="field-input" data-os-name maxlength="24" placeholder="${t('os.create.placeholder')}" />
        <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">${t('os.create.cancel')}</button>
            <button class="btn-primary" data-os-create-confirm style="flex:1;">${t('os.create.btn')}</button>
        </div>
    `;
    window.__game.Modal.open('os-create', html);
    const root = document.querySelector('[data-modal-id="os-create"]');
    const input = root.querySelector('[data-os-name]');
    input.focus();
    root.querySelector('[data-os-create-confirm]').addEventListener('click', function () {
        const res = osSystem.createOs(input.value);
        if (!res.ok) {
            window.__game.ToastService.error(res.reason);
        } else {
            window.__game.ToastService.success('OS');
            window.__game.Modal.close('os-create', true);
            window.__game.render();
        }
    });
}

// ============================================================
// MODAL — DETAIL FITUR
// ============================================================
export function openFeatureDetailModal(params) {
    var osSystem = params.osSystem;
    var featureId = params.featureId;

    const f = OS_FEATURES.find(function (x) { return x.id === featureId; });
    if (!f) return;
    const st = osSystem.getFeatureStatus(featureId);
    const html = `
        <div class="modal-title">${escapeHtml(f.name)}</div>
        <div class="modal-sub">${escapeHtml(f.description)}</div>
        <div class="sum-row"><span>${t('os.feature_detail.era')}</span><b>${f.era}</b></div>
        <div class="sum-row"><span>${t('os.feature_detail.min_year')}</span><b>${f.minYear}</b></div>
        <div class="sum-row"><span>${t('os.feature_detail.cost')}</span><b>$${f.devCost.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>${t('os.feature_detail.duration')}</span><b>${f.devDays}</b></div>
        <div class="card-title" style="margin-top:12px;">${t('os.feature_detail.effects')}</div>
        ${renderOsStatBar({
            stability: f.statEffects.stability || 0,
            speed: f.statEffects.speed || 0,
            features: f.statEffects.features || 0,
            security: f.statEffects.security || 0,
            design: f.statEffects.design || 0
        }, { compact: true })}
        <div class="sum-row" style="margin-top:12px;"><span>${t('os.feature_detail.status')}</span><b>${_statusLabel(st)}</b></div>
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">${t('os.feature_detail.close')}</button>
    `;
    window.__game.Modal.open('feature-detail', html);
}

function _statusLabel(st) {
    if (st.status === 'owned') return t('os.feature_detail.status_owned');
    if (st.status === 'developing') return t('os.feature_detail.status_deving');
    if (st.status === 'available') return t('os.feature_detail.status_available');
    return st.reason || t('os.feature.badge_locked');
}
