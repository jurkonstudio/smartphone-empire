// FILE: src/ui/panels/OSPanel.js
// Sub-tab OS dalam tab Riset. Menampilkan OS aktif, wizard versi baru,
// daftar fitur per era, bug, apps, dan lisensi.
// Visual v2: logo OS yang ikut era, radar stat, kartu fitur beribu ikon,
// wizard dengan preview radar sebelum/sesudah. Class baru berawalan "osx-".
import { renderOsStatBar, getStatMeta } from './OsStatBar.js';
import { renderOsRadar } from '../charts/OsRadarChart.js';
import { renderIconInline } from '../icons/IconRenderer.js';
import { OS_FEATURES, OS_LICENSES, BUILTIN_APPS, OS_ERAS, getEraForYear } from '../../data/os.data.js';

const STAT_KEYS = ['stability', 'speed', 'features', 'security', 'design'];
const NAME_IDEAS = ['Nova OS', 'Helix', 'Pulse', 'Aero', 'Lumen', 'Kernel'];

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ---------- ikon SVG kecil (tanpa emoji) ----------
const PATHS = {
    check: '<polyline points="20 6 9 17 4 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    plus:  '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    lock:  '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    warn:  '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
};

function svg(name, size) {
    const s = size || 14;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
           'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           (PATHS[name] || '') + '</svg>';
}

function fullMoney(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

function money(n) {
    n = Math.round(n);
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(n % 1e3 ? 1 : 0) + 'K';
    return '$' + n;
}

// ---------- logo OS: warna dari nama, bentuk mengikuti era ----------
function hashHue(name) {
    let h = 0;
    const s = String(name || 'OS');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
}

function osLogo(name, year, size) {
    const shape = year < 2007 ? 'mono' : year < 2013 ? 'gloss' : 'flat';
    const ch = escapeHtml((String(name || '?').trim().charAt(0) || '?').toUpperCase());
    return '<span class="osx-logo osx-logo--' + shape + '" style="--h:' + hashHue(name) + ';--s:' + size + 'px;">' + ch + '</span>';
}

function topEffects(f, n) {
    const meta = getStatMeta();
    return STAT_KEYS
        .map(k => ({ k, v: (f.statEffects && f.statEffects[k]) || 0 }))
        .filter(x => x.v > 0)
        .sort((a, b) => b.v - a.v)
        .slice(0, n)
        .map(x => ({ label: meta[x.k].label, v: x.v, color: meta[x.k].color }));
}

function _statusLabel(st) {
    if (st.status === 'owned') return 'Sudah dimiliki';
    if (st.status === 'developing') return 'Sedang dikembangkan';
    if (st.status === 'available') return 'Tersedia untuk versi berikutnya';
    return st.reason || 'Terkunci';
}

function _statusIcon(s) {
    if (s === 'owned') return svg('check', 13);
    if (s === 'developing') return svg('clock', 13);
    if (s === 'available') return svg('plus', 13);
    return svg('lock', 13);
}

// ============================================================
// Panel utama
// ============================================================
export function renderOSPanel({ osSystem, researchSystem }) {
    const data = window.__game.state.get();
    const os = data.os;
    const year = data.time.currentYear;

    // ===== Belum ada OS =====
    if (!os.name) {
        return `
            <div class="card osx-empty">
                ${osLogo('?', year, 72)}
                <div class="osx-empty-title">Belum ada sistem operasi</div>
                <div class="osx-empty-desc">Bangun OS sendiri dan kembangkan fiturnya dari era ke era, atau lisensi OS pihak ketiga.</div>
                <button class="btn-primary" data-os-action="create" style="max-width:220px;margin:0 auto;">Buat OS</button>
            </div>
        `;
    }

    const currentVersion = osSystem.getCurrentVersionObject();
    const developing = os.developing;
    const era = getEraForYear(year);

    // ===== Hero: OS aktif =====
    let bodyHtml;
    if (currentVersion) {
        const st = currentVersion.stats;
        const meta = getStatMeta();
        const avg = Math.round(STAT_KEYS.reduce((a, k) => a + (st[k] || 0), 0) / STAT_KEYS.length);
        const sorted = STAT_KEYS.slice().sort((a, b) => (st[b] || 0) - (st[a] || 0));
        const best = meta[sorted[0]].label;
        const worst = meta[sorted[sorted.length - 1]].label;
        bodyHtml = `
            <div class="osx-hero-body">
                ${renderOsRadar(st, { size: 150 })}
                <div class="osx-score">
                    <div class="osx-score-num">${avg}</div>
                    <div class="osx-score-lbl">skor rata-rata</div>
                    <div class="osx-score-line">Terkuat <b>${best}</b></div>
                    <div class="osx-score-line">Terlemah <b>${worst}</b></div>
                </div>
            </div>
            ${renderOsStatBar(st, { compact: true })}
        `;
    } else {
        bodyHtml = '<div class="osx-hint">Kembangkan versi pertama (v1.0) untuk melihat stat.</div>';
    }

    const headerHtml = `
        <div class="card osx-hero" style="--h:${hashHue(os.name)};">
            <div class="osx-hero-top">
                ${osLogo(os.name, year, 52)}
                <div class="osx-hero-id">
                    <div class="osx-hero-name">${escapeHtml(os.name)}</div>
                    <div class="osx-hero-sub">
                        <span class="osx-chip">${currentVersion ? 'Versi ' + escapeHtml(currentVersion.versionString) : 'Belum rilis'}</span>
                        <span class="osx-chip osx-chip--soft">${escapeHtml(era.name)}</span>
                    </div>
                </div>
                <button class="btn-secondary osx-newver" data-os-action="wizard">+ Versi Baru</button>
            </div>
            ${bodyHtml}
        </div>
    `;

    // ===== Progres pengembangan versi =====
    const devFeatChips = developing
        ? developing.features.map(id => {
            const f = OS_FEATURES.find(x => x.id === id);
            return f ? '<span class="osx-mini">' + renderIconInline(f.icon, 13) + escapeHtml(f.name) + '</span>' : '';
        }).join('')
        : '';

    const devHtml = developing ? `
        <div class="card">
            <div class="card-title">Mengembangkan ${escapeHtml(developing.versionString)}</div>
            <div class="osx-mini-row">${devFeatChips}</div>
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
                        <span class="osx-bug-ico osx-sev-${Math.min(4, Math.max(1, b.severity || 1))}">${svg('warn', 16)}</span>
                        <div style="flex:1;">
                            <div class="bug-name">${escapeHtml(b.name)}</div>
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

    // ===== Fitur OS per era =====
    const eraHtml = OS_ERAS.map(e => {
        const list = OS_FEATURES.filter(f => f.era === e.id);
        if (!list.length) return '';
        const rows = list.map(f => ({ f, st: osSystem.getFeatureStatus(f.id) }));
        const owned = rows.filter(r => r.st.status === 'owned').length;
        const active = rows.some(r => r.st.status === 'owned' || r.st.status === 'developing');

        // Era yang belum tiba: tampil ringkas satu baris
        if (year < e.fromYear && !active) {
            return `
                <div class="osx-era osx-era--future">
                    <span class="osx-era-lock">${svg('lock', 14)}</span>
                    <div>
                        <div class="osx-era-name">${escapeHtml(e.name)}</div>
                        <div class="osx-era-sub">Terbuka tahun ${e.fromYear} • ${list.length} fitur</div>
                    </div>
                </div>
            `;
        }

        const isNow = year >= e.fromYear && year <= e.toYear;
        const pct = Math.round((owned / list.length) * 100);
        const range = e.toYear >= 9999 ? e.fromYear + '+' : e.fromYear + '–' + e.toYear;
        return `
            <div class="osx-era">
                <div class="osx-era-head">
                    <div>
                        <div class="osx-era-name">${escapeHtml(e.name)}${isNow ? ' <span class="osx-chip osx-chip--now">Sekarang</span>' : ''}</div>
                        <div class="osx-era-sub">${range}</div>
                    </div>
                    <span class="osx-ring" style="--p:${pct};"><i>${owned}/${list.length}</i></span>
                </div>
                ${rows.map(({ f, st }) => `
                    <div class="osx-feat osx-feat--${st.status}" data-os-action="feature-detail" data-feature-id="${f.id}">
                        <span class="osx-feat-ico">${renderIconInline(f.icon, 18)}</span>
                        <div class="osx-feat-main">
                            <div class="osx-feat-name">${escapeHtml(f.name)}</div>
                            <div class="osx-feat-sub">${escapeHtml(_statusLabel(st))}</div>
                        </div>
                        <span class="osx-badge osx-badge--${st.status}">${_statusIcon(st.status)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');

    const featuresHtml = `
        <div class="card">
            <div class="card-title">Fitur OS</div>
            ${eraHtml}
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
                    const hasFeature = osSystem.hasFeature(a.requiresFeature);
                    const canStart = !owned && hasFeature;
                    return `
                        <div class="app-item">
                            <div style="flex:1;">
                                <div class="app-name">${escapeHtml(a.name)}</div>
                                <div class="app-meta">$${a.devCost.toLocaleString('en-US')} • ${a.devDays} hari • +${a.appealBonus} appeal</div>
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
                const available = year >= l.availableFromYear;
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
    const currentVersion = osSystem.getCurrentVersionObject();
    const base = currentVersion
        ? { ...currentVersion.stats }
        : { stability: 20, speed: 20, features: 20, security: 20, design: 20 };
    const cash = window.__game.state.get().cash;
    const meta = getStatMeta();

    const picksHtml = available.map(f => {
        const eff = topEffects(f, 2).map(e =>
            '<span class="osx-eff" style="--c:' + e.color + ';">+' + e.v + ' ' + e.label + '</span>').join('');
        return `
            <label class="osx-pick">
                <input type="checkbox" data-wiz-feature="${f.id}">
                <span class="osx-pick-ico">${renderIconInline(f.icon, 18)}</span>
                <span class="osx-pick-main">
                    <span class="osx-pick-name">${escapeHtml(f.name)}</span>
                    <span class="osx-pick-eff">${eff}</span>
                </span>
                <span class="osx-pick-cost">${money(f.devCost)}<small>${f.devDays} hari</small></span>
                <span class="osx-check">${svg('check', 12)}</span>
            </label>
        `;
    }).join('');

    const html = `
        <div class="modal-title">Kembangkan Versi Baru</div>
        <div class="modal-sub">Pilih fitur untuk versi berikutnya. Stat dihitung ulang langsung.</div>
        <div class="osx-slots"><span data-wiz-slots></span><b data-wiz-slotcount>0/${maxSlots}</b></div>
        <div class="osx-pick-list" data-wiz-list>${picksHtml}</div>
        <div class="osx-sum">
            <div data-wiz-radar>${renderOsRadar(base, { size: 128 })}</div>
            <div class="osx-deltas" data-wiz-deltas></div>
        </div>
        <div class="sum-row"><span>Kas</span><b>${fullMoney(cash)}</b></div>
        <div class="sum-row"><span>Total biaya</span><b data-wiz-cost>$0</b></div>
        <div class="sum-row"><span>Durasi</span><b data-wiz-days>0 hari</b></div>
        <div class="osx-warn" data-wiz-warn hidden>Kas tidak cukup untuk fitur yang dipilih.</div>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-primary" data-wiz-confirm style="flex:1;" disabled>Mulai Kembangkan</button>
        </div>
    `;

    window.__game.Modal.open('os-wizard', html);

    const root = document.querySelector('[data-modal-id="os-wizard"]');
    const radarEl = root.querySelector('[data-wiz-radar]');
    const deltasEl = root.querySelector('[data-wiz-deltas]');
    const costEl = root.querySelector('[data-wiz-cost]');
    const daysEl = root.querySelector('[data-wiz-days]');
    const warnEl = root.querySelector('[data-wiz-warn]');
    const slotsEl = root.querySelector('[data-wiz-slots]');
    const slotCountEl = root.querySelector('[data-wiz-slotcount]');
    const confirmBtn = root.querySelector('[data-wiz-confirm]');
    const checkboxes = Array.from(root.querySelectorAll('[data-wiz-feature]'));

    function refresh() {
        const selected = checkboxes.filter(c => c.checked);
        const full = selected.length >= maxSlots;

        let cost = 0, days = 0;
        const stats = { ...base };
        selected.forEach(c => {
            const f = available.find(x => x.id === c.dataset.wizFeature);
            if (!f) return;
            cost += f.devCost;
            days += f.devDays;
            STAT_KEYS.forEach(k => { stats[k] += (f.statEffects && f.statEffects[k]) || 0; });
        });
        STAT_KEYS.forEach(k => { stats[k] = Math.max(0, Math.min(100, Math.round(stats[k]))); });

        // kunci pilihan lain saat slot penuh (lebih jelas daripada toast)
        checkboxes.forEach(c => {
            const lab = c.closest('.osx-pick');
            lab.classList.toggle('on', c.checked);
            const lock = full && !c.checked;
            c.disabled = lock;
            lab.classList.toggle('osx-pick--full', lock);
        });

        slotsEl.innerHTML = Array.from({ length: maxSlots }, (_, i) =>
            '<span class="osx-slot' + (i < selected.length ? ' on' : '') + '"></span>').join('');
        slotCountEl.textContent = selected.length + '/' + maxSlots;

        radarEl.innerHTML = renderOsRadar(stats, { size: 128, base: base });

        const deltas = STAT_KEYS
            .map(k => ({ k, d: stats[k] - Math.round(base[k]) }))
            .filter(x => x.d !== 0)
            .map(x => '<span class="osx-delta" style="--c:' + meta[x.k].color + ';">' +
                      meta[x.k].label + ' <b>' + (x.d > 0 ? '+' : '') + x.d + '</b></span>').join('');
        deltasEl.innerHTML = deltas || '<span class="osx-hint">Pilih fitur untuk melihat dampaknya.</span>';

        const over = cost > cash;
        costEl.textContent = fullMoney(cost);
        costEl.classList.toggle('osx-over', over);
        daysEl.textContent = days + ' hari';
        warnEl.hidden = !over;
        confirmBtn.disabled = !selected.length || over;
    }

    checkboxes.forEach(cb => cb.addEventListener('change', refresh));
    refresh();

    confirmBtn.addEventListener('click', () => {
        const selected = checkboxes.filter(c => c.checked).map(c => c.dataset.wizFeature);
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
// Modal buat OS baru — logo langsung berubah saat mengetik
// ============================================================
export function openCreateOsModal({ osSystem }) {
    const year = window.__game.state.get().time.currentYear;
    const ideas = NAME_IDEAS.map(n =>
        '<button type="button" class="osx-idea" data-os-idea="' + escapeHtml(n) + '">' + escapeHtml(n) + '</button>').join('');

    const html = `
        <div class="modal-title">Buat OS Baru</div>
        <div class="modal-sub">Beri nama sistem operasi perusahaanmu.</div>
        <div class="osx-create">
            <div data-os-logo>${osLogo('?', year, 64)}</div>
            <div style="flex:1;min-width:0;">
                <label class="field-label">Nama OS</label>
                <input class="field-input" data-os-name maxlength="24" placeholder="Contoh: MyOS, Aurora, ..." />
            </div>
        </div>
        <div class="osx-ideas">${ideas}</div>
        <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-primary" data-os-create-confirm style="flex:1;">Buat</button>
        </div>
    `;
    window.__game.Modal.open('os-create', html);

    const root = document.querySelector('[data-modal-id="os-create"]');
    const input = root.querySelector('[data-os-name]');
    const logoEl = root.querySelector('[data-os-logo]');

    function updateLogo() {
        logoEl.innerHTML = osLogo(input.value.trim() || '?', year, 64);
    }
    input.addEventListener('input', updateLogo);
    root.querySelectorAll('[data-os-idea]').forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.osIdea;
            updateLogo();
            input.focus();
        });
    });
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
    const eraObj = OS_ERAS.find(e => e.id === f.era);

    const reqs = (f.requiresFeatures || []).map(id => {
        const rf = OS_FEATURES.find(x => x.id === id);
        const has = osSystem.hasFeature(id);
        return '<span class="osx-req ' + (has ? 'ok' : '') + '">' + (has ? svg('check', 12) : svg('lock', 12)) +
               escapeHtml(rf ? rf.name : id) + '</span>';
    }).join('');

    const html = `
        <div class="osx-detail-head">
            <span class="osx-feat-ico osx-feat-ico--lg">${renderIconInline(f.icon, 24)}</span>
            <div>
                <div class="modal-title" style="margin:0;">${escapeHtml(f.name)}</div>
                <div class="osx-era-sub">${escapeHtml(eraObj ? eraObj.name : f.era)} • mulai ${f.minYear}</div>
            </div>
        </div>
        <div class="modal-sub">${escapeHtml(f.description)}</div>
        ${reqs ? '<div class="card-title">Prasyarat fitur</div><div class="osx-mini-row">' + reqs + '</div>' : ''}
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
        <div class="sum-row" style="margin-top:12px;"><span>Status</span><b>${escapeHtml(_statusLabel(st))}</b></div>
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">Tutup</button>
    `;
    window.__game.Modal.open('feature-detail', html);
}
