// FILE: src/ui/panels/OsPlatformHub.js  (BARU)
// ============================================================
// Tampilan baru tab Status OS (OS Platform), gaya "release console".
// Tiga segmen:
//   - Produk       : rilis aktif, aksi berikutnya, lapisan fitur versi aktif, riwayat.
//   - Pengembangan : ringkasan R&D, jalur R&D platform sebagai layer (level, batas,
//                    biaya, ETA, progres live), dan saran perbaikan.
//   - Pasar        : pengguna aktif, unit terjual, retensi, tren bulanan,
//                    pengguna per versi & per ponsel, serta lawan lisensi pihak ketiga.
// Semua angka dihitung dari OSSystem / OsAdoptionModel. Modul ini TIDAK mengubah state.
// Aksi mulai/batal R&D memakai handler data-osp-action yang sudah ada di OSPanel.js,
// dan progres live memakai atribut data-rnd-bar / data-rnd-pct + data-osp-root.
// ============================================================
import { escapeHtml } from '../../utils/html.js';
import { OS_PLATFORM_TRACKS, OS_LICENSES, OS_ERAS, getLicenseStatsAtYear, getOsFeatureById } from '../../data/os.data.js';
import { formatUsers, ADOPTION_CONFIG } from '../../systems/OsAdoptionModel.js';

const SECTIONS = [
    { id: 'product', label: 'Produk' },
    { id: 'development', label: 'Pengembangan' },
    { id: 'market', label: 'Pasar' }
];
const STAT_KEYS = ['stability', 'speed', 'features', 'security', 'design'];
const STAT_LABEL = { stability: 'Stabilitas', speed: 'Kecepatan', features: 'Fitur', security: 'Keamanan', design: 'Desain' };
const TIER_LABEL = { current: 'Terbaru', previous: 'Sebelumnya', older: 'Lama' };

var _section = 'product';
var _bound = false;
var _styled = false;

export function setOsHubSection(id) {
    if (SECTIONS.some(function (s) { return s.id === id; })) _section = id;
}

// ============================================================
// ENTRY
// ctx = { osSystem, data, parts: { kpi, hero, devStrip, history, rdSummary } }
// ============================================================
export function renderOsHub(ctx) {
    _ensureStyles();
    _ensureHandlers();
    var parts = ctx.parts || {};
    var nav = '<div class="osh-nav" role="tablist">' + SECTIONS.map(function (s) {
        return '<button class="osh-nav-btn' + (s.id === _section ? ' active' : '') + '" data-osh-section="' + s.id + '">' + s.label + '</button>';
    }).join('') + '</div>';

    var body;
    if (_section === 'development') body = _renderDevelopment(ctx);
    else if (_section === 'market') body = _renderMarket(ctx);
    else body = _renderProduct(ctx);

    return '<div class="osh-root">' + (parts.kpi || '') + nav + body + '</div>';
}

// ============================================================
// SEGMEN PRODUK
// ============================================================
function _renderProduct(ctx) {
    var osSystem = ctx.osSystem, data = ctx.data, parts = ctx.parts || {};
    var cur = osSystem.getCurrentVersionObject();
    return _releaseCard(osSystem, data, cur) +
        (parts.hero || '') +
        _actionCard(_nextAction(osSystem, data)) +
        _layersShipped(cur) +
        (parts.history || '');
}

function _releaseCard(osSystem, data, cur) {
    var os = data.os;
    var stats = osSystem.getCurrentStats();
    var avg = stats ? Math.round(_avg(stats)) : 0;
    var bugs = (os.bugs || []).filter(function (b) { return b.status === 'active' || b.status === 'patching'; }).length;
    var fCount = cur && cur.features ? cur.features.length : 0;
    return '<div class="osh-card osh-release">' +
        '<div class="osh-eyebrow">Rilis OS · ' + escapeHtml(os.name || '-') + '</div>' +
        '<div class="osh-release-top"><div class="osh-release-ver">' + escapeHtml(cur ? cur.versionString : 'Belum dirilis') + '</div>' +
        '<div class="osh-serial">' + escapeHtml(cur ? cur.id : '-') + '</div></div>' +
        '<div class="osh-kpis">' +
            _kpi('Fitur di versi', String(fCount)) +
            _kpi('Skor rata-rata', String(avg)) +
            _kpi('Bug aktif', String(bugs), bugs >= 3 ? 'down' : '') +
            _kpi('Status', cur ? (os.developing ? 'Dev berjalan' : 'Aktif') : 'Dev') +
        '</div></div>';
}

// Aksi paling berguna saat ini, dihitung dari kondisi R&D dan rilis.
function _nextAction(osSystem, data) {
    var cur = osSystem.getCurrentVersionObject();
    if (!cur) return { title: 'Rilis versi OS pertama', desc: 'R&D platform terbuka setelah OS pertama dirilis.', btn: 'Buka Rancang Update', tab: 'rancang' };
    var platDev = data.os.platform && data.os.platform.developing;
    if (platDev) return { title: 'R&D platform berjalan: ' + platDev.name, desc: 'Tunggu selesai atau pantau progres di segmen Pengembangan.', btn: 'Lihat Pengembangan', btnAttr: 'data-osh-section="development"' };
    if (data.os.developing) return { title: 'Rilis ' + data.os.developing.versionString + ' sedang dikembangkan', desc: 'Pantau progres rilis di segmen Pengembangan.', btn: 'Lihat Pengembangan', btnAttr: 'data-osh-section="development"' };

    var infos = OS_PLATFORM_TRACKS.map(function (t) { return osSystem.getPlatformInfo(t.id); });
    var free = infos.filter(function (i) { return i.status === 'available'; }).sort(function (a, b) { return a.level - b.level; })[0];
    if (free) return {
        title: 'Naikkan ' + free.name + ' ke Lv ' + (free.level + 1),
        desc: 'Setiap level menambah +' + (free.nextBonus - free.bonus) + ' stat ke semua ponsel ber-OS-mu. Biaya $' + _fmt(free.cost) + ', sekitar ' + free.etaDays + ' hari.',
        btn: 'Mulai R&D · $' + _fmt(free.cost), act: 'start', id: free.id
    };
    var cash = infos.find(function (i) { return i.blocker === 'cash'; });
    if (cash) return { title: 'Kumpulkan dana untuk ' + cash.name, desc: cash.reason || '', btn: 'Lihat Pengembangan', btnAttr: 'data-osh-section="development"' };
    var capped = infos.find(function (i) { return i.status === 'capped'; });
    if (capped) return { title: capped.name + ' mencapai batas', desc: capped.reason || '', btn: 'Lihat Pengembangan', btnAttr: 'data-osh-section="development"' };
    return { title: 'Semua jalur R&D berjalan normal', desc: 'Pantau pasar atau rilis versi OS baru untuk membuka level berikutnya.', btn: 'Lihat Pasar', btnAttr: 'data-osh-section="market"' };
}

function _actionCard(n) {
    var btn = '';
    if (n.act) btn = '<button class="osh-btn" data-osp-action="' + n.act + '" data-rnd-id="' + n.id + '">' + escapeHtml(n.btn) + '</button>';
    else if (n.tab) btn = '<button class="osh-btn ghost" data-os-tab="' + n.tab + '">' + escapeHtml(n.btn) + ' →</button>';
    else if (n.btnAttr) btn = '<button class="osh-btn ghost" ' + n.btnAttr + '>' + escapeHtml(n.btn) + ' →</button>';
    return '<div class="osh-card osh-action"><div class="osh-eyebrow">Lakukan ini berikutnya</div>' +
        '<div class="osh-action-title">' + escapeHtml(n.title) + '</div>' +
        (n.desc ? '<div class="osh-note">' + escapeHtml(n.desc) + '</div>' : '') + btn + '</div>';
}

// Lapisan fitur versi aktif, diurutkan menurut tahun kemunculan.
function _layersShipped(cur) {
    if (!cur) return '';
    var feats = (cur.features || []).map(function (id) { return getOsFeatureById(id); }).filter(Boolean)
        .sort(function (a, b) { return (a.minYear || 0) - (b.minYear || 0); });
    var rows = feats.map(function (f, i) {
        return '<div class="osh-layer">' +
            '<span class="osh-node">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<div class="osh-layer-main"><div class="osh-layer-name">' + escapeHtml(f.name) + '</div>' +
            '<div class="osh-layer-meta">' + escapeHtml(_eraName(f.era)) + ' · ' + f.minYear + '</div></div>' +
            _statChips(f.statEffects) + '</div>';
    }).join('');
    return '<div class="osh-section-label">Lapisan OS aktif · ' + feats.length + '</div>' +
        '<div class="osh-stack">' + (rows || '<div class="osh-empty">Belum ada fitur di versi ini.</div>') + '</div>';
}

// ============================================================
// SEGMEN PENGEMBANGAN
// ============================================================
function _renderDevelopment(ctx) {
    var osSystem = ctx.osSystem, data = ctx.data, parts = ctx.parts || {};
    var layers = OS_PLATFORM_TRACKS.map(function (t) { return _renderLayer(osSystem.getPlatformInfo(t.id)); }).join('');
    return (parts.rdSummary || '') +
        (parts.devStrip || '') +
        '<div class="osh-section-label">Jalur R&amp;D platform · ' + OS_PLATFORM_TRACKS.length + ' layer</div>' +
        '<div class="osh-stack" data-osp-root>' + layers + '</div>' +
        _improveCard(osSystem, data);
}

function _renderLayer(info) {
    var max = info.maxLevel || 1;
    var pips = [];
    for (var i = 0; i < max; i++) {
        var cls = i < info.level ? 'on' : (i < info.cap ? 'cap-ok' : '');
        pips.push('<i class="' + cls + '"></i>');
    }
    var run = info.running;
    var runPct = run && run.durationDays > 0 ? Math.min(100, Math.round(run.progressDays / run.durationDays * 100)) : 0;
    var action;
    if (run) action = '<button class="osh-btn danger" data-osp-action="cancel" data-rnd-id="' + info.id + '">Batalkan</button>';
    else if (info.status === 'available') action = '<button class="osh-btn" data-osp-action="start" data-rnd-id="' + info.id + '">Mulai · $' + _fmt(info.cost) + ' · ' + info.etaDays + ' hari</button>';
    else action = '<div class="osh-note">' + escapeHtml(info.reason || 'Tidak tersedia') + '</div>';
    var progress = run
        ? '<div class="osh-bar"><span data-rnd-bar="' + info.id + '" style="width:' + runPct + '%"></span></div>' +
          '<div class="osh-note"><b data-rnd-pct="' + info.id + '">' + runPct + '%</b> selesai</div>'
        : '';
    return '<div class="osh-layer-card' + (run ? ' running' : '') + '">' +
        '<div class="osh-layer-top"><div><div class="osh-layer-name">' + escapeHtml(info.name) + '</div>' +
        '<div class="osh-layer-meta">' + escapeHtml(info.hint) + '</div></div>' +
        '<div class="osh-lv">Lv ' + info.level + '<span>/' + max + '</span></div></div>' +
        '<div class="osh-pips">' + pips.join('') + '</div>' +
        '<div class="osh-layer-meta">Bonus +' + info.bonus + ' stat · level berikutnya +' + (info.nextBonus - info.bonus) + '</div>' +
        progress +
        '<div class="osh-layer-foot">' + action + '</div></div>';
}

function _improveCard(osSystem, data) {
    var bugs = (data.os.bugs || []).filter(function (b) { return b.status === 'active' || b.status === 'patching'; });
    var cmp = _licenseCompare(osSystem, data);
    var verdict = cmp.own === 0 ? 'Rilis OS pertama untuk membandingkan dengan lisensi pihak ketiga.'
        : (cmp.diff >= 0
            ? 'OS-mu unggul ' + cmp.diff + ' poin dari ' + cmp.bestName + ' tahun ini.'
            : 'OS-mu tertinggal ' + Math.abs(cmp.diff) + ' poin dari ' + cmp.bestName + ' tahun ini. Lisensi pihak ketiga terus diperbarui.');
    return '<div class="osh-card"><div class="osh-eyebrow">Perbaiki berikutnya</div>' +
        '<div class="osh-note">' + escapeHtml(verdict) + '</div>' +
        (bugs.length
            ? '<button class="osh-btn ghost" data-os-tab="bug">Tangani ' + bugs.length + ' bug aktif →</button>'
            : '<div class="osh-note">Tidak ada bug aktif.</div>') +
        '</div>';
}

// ============================================================
// SEGMEN PASAR
// ============================================================
function _renderMarket(ctx) {
    var osSystem = ctx.osSystem, data = ctx.data;
    var a = osSystem.getAdoption();
    if (!a.hasOs) return '<div class="osh-empty">Belum ada pengguna OS. Rilis OS lalu luncurkan ponsel yang memakainya.</div>';

    var hist = a.history || [];
    var last = hist[hist.length - 1], prev = hist[hist.length - 2];
    var delta = last && prev ? last.active - prev.active : 0;
    var kpis = '<div class="osh-kpis">' +
        _kpi('Pengguna aktif', formatUsers(a.activeUsers)) +
        _kpi('Unit terjual', formatUsers(a.shippedUnits)) +
        _kpi('Retensi', Math.round(a.retentionRate * 100) + '%') +
        _kpi('Δ bulan lalu', (delta >= 0 ? '+' : '-') + formatUsers(Math.abs(delta)), delta >= 0 ? 'up' : 'down') +
        '</div>';

    var versionRows = a.versions.slice().reverse().map(function (v) {
        var pct = Math.round(v.share * 100);
        return '<div class="osh-bar-row"><div class="osh-bar-top"><span>' + escapeHtml(v.versionString) + ' <em class="osh-tier">' + TIER_LABEL[v.tier] + '</em></span>' +
            '<b>' + escapeHtml(formatUsers(v.active)) + ' · ' + pct + '%</b></div>' +
            '<div class="osh-bar"><span style="width:' + pct + '%"></span></div></div>';
    }).join('') || '<div class="osh-note">Belum ada versi.</div>';

    var maxPhone = a.topPhones.length ? Math.max(1, a.topPhones[0].active) : 1;
    var phoneRows = a.topPhones.map(function (p) {
        var pct = Math.round(p.active / maxPhone * 100);
        return '<div class="osh-bar-row"><div class="osh-bar-top"><span>' + escapeHtml(p.name) + '</span>' +
            '<b>' + escapeHtml(formatUsers(p.active)) + ' aktif</b></div>' +
            '<div class="osh-note">' + escapeHtml(p.versionString) + ' · terjual ' + escapeHtml(formatUsers(p.shipped)) + '</div>' +
            '<div class="osh-bar"><span style="width:' + pct + '%"></span></div></div>';
    }).join('') || '<div class="osh-note">Belum ada ponsel ber-OS sendiri yang terjual.</div>';

    var cmp = _licenseCompare(osSystem, data);
    var compare = '<div class="osh-card"><div class="osh-kpis">' +
        _kpi('OS-mu (rata-rata)', String(cmp.own)) +
        _kpi('Lisensi terbaik', String(cmp.best)) +
        '</div><div class="osh-note">' + escapeHtml(cmp.bestName || 'Belum ada lisensi tersedia') + ' · selisih ' + (cmp.diff >= 0 ? '+' : '') + cmp.diff + '</div></div>';

    return kpis +
        _trendChart(hist) +
        '<div class="osh-section-label">Pengguna per versi</div><div class="osh-card">' + versionRows + '</div>' +
        '<div class="osh-section-label">Ponsel dengan pengguna terbanyak</div><div class="osh-card">' + phoneRows + '</div>' +
        '<div class="osh-section-label">Lawan lisensi pihak ketiga</div>' + compare +
        '<div class="osh-card"><div class="osh-eyebrow">Dampak ekosistem</div>' +
        '<div class="osh-note">Bonus aplikasi pihak ketiga: <b>+' + a.appBonusPerMonth + ' / bulan</b>. Setiap ' +
        escapeHtml(formatUsers(ADOPTION_CONFIG.appsUsersPerBonus)) + ' pengguna aktif menambah 1 aplikasi per bulan.</div>' +
        (a.licensedUnits > 0 ? '<div class="osh-note">Ponsel berlisensi OS pihak ketiga terjual ' + escapeHtml(formatUsers(a.licensedUnits)) + ' unit (tidak dihitung sebagai pengguna OS-mu).</div>' : '') +
        '</div>';
}

function _trendChart(hist) {
    if (!hist || hist.length < 2) {
        return '<div class="osh-card"><div class="osh-eyebrow">Tren pengguna aktif</div><div class="osh-note">Grafik tren muncul setelah dua bulan riwayat.</div></div>';
    }
    var pts = hist.slice(-24);
    var W = 320, H = 96, P = 6;
    var max = 1;
    pts.forEach(function (p) { if (p.active > max) max = p.active; });
    var xy = pts.map(function (p, i) {
        var x = P + i * (W - 2 * P) / (pts.length - 1);
        var y = H - P - (p.active / max) * (H - 2 * P);
        return x.toFixed(1) + ',' + y.toFixed(1);
    });
    return '<div class="osh-card"><div class="osh-eyebrow">Tren pengguna aktif</div>' +
        '<svg class="osh-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<polyline points="' + xy.join(' ') + '" fill="none" stroke="var(--osh-rust)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>' +
        '<div class="osh-note">' + pts.length + ' bulan terakhir · puncak ' + escapeHtml(formatUsers(max)) + '</div></div>';
}

// ============================================================
// HELPER
// ============================================================
function _licenseCompare(osSystem, data) {
    var cs = osSystem.getCurrentStats();
    var own = cs ? _avg(cs) : 0;
    var best = 0, bestName = '';
    OS_LICENSES.forEach(function (l) {
        if (data.time.currentYear < l.availableFromYear) return;
        var a = _avg(getLicenseStatsAtYear(l, data.time.currentYear));
        if (a > best) { best = a; bestName = l.name; }
    });
    return { own: Math.round(own), best: Math.round(best), bestName: bestName, diff: Math.round(own - best) };
}

function _avg(s) {
    if (!s) return 0;
    return (s.stability + s.speed + s.features + s.security + s.design) / 5;
}

function _statChips(se) {
    se = se || {};
    return STAT_KEYS.map(function (k) {
        var v = se[k] || 0;
        return v > 0 ? '<span class="osh-chip">+' + v + ' ' + STAT_LABEL[k] + '</span>' : '';
    }).join('');
}

function _eraName(id) {
    var era = OS_ERAS.find(function (e) { return e.id === id; });
    return era ? era.name : id;
}

function _kpi(label, val, tone) {
    return '<div class="osh-kpi ' + (tone || '') + '"><div class="osh-kpi-lbl">' + escapeHtml(label) + '</div>' +
        '<div class="osh-kpi-val">' + escapeHtml(val) + '</div></div>';
}

function _fmt(n) { return Math.round(n || 0).toLocaleString('en-US'); }

function _ensureHandlers() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;
    document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest && e.target.closest('[data-osh-section]');
        if (!b) return;
        var s = b.getAttribute('data-osh-section');
        if (!s || s === _section) return;
        setOsHubSection(s);
        if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
    });
}

function _ensureStyles() {
    if (_styled || typeof document === 'undefined') return;
    _styled = true;
    var st = document.createElement('style');
    st.id = 'osh-styles';
    st.textContent = [
        '.osh-root{--osh-paper:#f4efe4;--osh-card:#fbf8f1;--osh-ink:#3b3128;--osh-mute:#8a7d70;--osh-line:#e1d5c3;--osh-rust:#a2552f;--osh-rust-soft:#ead3c2;--osh-teal:#0d6676;--osh-green:#2f7a45;--osh-red:#b03a2e;',
        'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--osh-ink);',
        'background-image:linear-gradient(rgba(162,85,47,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(162,85,47,.05) 1px,transparent 1px);background-size:22px 22px;',
        'border-radius:16px;padding:10px;}',
        '.osh-card{background:var(--osh-card);border:1px solid var(--osh-line);border-radius:14px;padding:12px;margin:8px 0;}',
        '.osh-eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--osh-rust);margin-bottom:6px;}',
        '.osh-release-top{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;}',
        '.osh-release-ver{font-family:Georgia,serif;font-size:30px;font-weight:700;color:var(--osh-ink);}',
        '.osh-serial{font-size:11px;color:var(--osh-mute);}',
        '.osh-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 2px;}',
        '.osh-kpi{background:var(--osh-card);border:1px solid var(--osh-line);border-radius:12px;padding:9px;min-width:0;}',
        '.osh-kpi-lbl{font-size:10px;color:var(--osh-mute);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.osh-kpi-val{font-family:Georgia,serif;font-size:20px;font-weight:700;margin-top:2px;}',
        '.osh-kpi.up .osh-kpi-val{color:var(--osh-green);}.osh-kpi.down .osh-kpi-val{color:var(--osh-red);}',
        '.osh-nav{display:flex;gap:6px;background:var(--osh-rust-soft);border-radius:12px;padding:4px;margin:10px 0;}',
        '.osh-nav-btn{flex:1;border:0;background:transparent;color:var(--osh-ink);font:inherit;font-size:12px;font-weight:700;padding:8px 6px;border-radius:9px;cursor:pointer;}',
        '.osh-nav-btn.active{background:var(--osh-card);color:var(--osh-rust);box-shadow:0 1px 0 var(--osh-line);}',
        '.osh-section-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--osh-rust);margin:14px 2px 4px;}',
        '.osh-action{border-color:var(--osh-rust);}',
        '.osh-action-title{font-family:Georgia,serif;font-size:19px;font-weight:700;margin-bottom:4px;}',
        '.osh-note{font-size:12px;color:var(--osh-mute);line-height:1.45;margin:4px 0;}',
        '.osh-btn{display:block;width:100%;margin-top:8px;border:0;border-radius:10px;padding:10px 12px;background:var(--osh-rust);color:#fff;font:inherit;font-size:12.5px;font-weight:700;letter-spacing:.02em;cursor:pointer;text-align:center;}',
        '.osh-btn.ghost{background:transparent;color:var(--osh-rust);border:1px solid var(--osh-rust);}',
        '.osh-btn.danger{background:transparent;color:var(--osh-red);border:1px solid var(--osh-red);}',
        '.osh-btn:disabled{opacity:.6;cursor:progress;}',
        '.osh-stack{display:flex;flex-direction:column;gap:8px;}',
        '.osh-layer{display:flex;align-items:flex-start;gap:10px;background:var(--osh-card);border:1px solid var(--osh-line);border-radius:12px;padding:10px;}',
        '.osh-node{flex:0 0 auto;width:26px;height:26px;border-radius:50%;border:2px solid var(--osh-teal);color:var(--osh-teal);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;}',
        '.osh-layer-main{flex:1;min-width:0;}',
        '.osh-layer-name{font-weight:700;font-size:13.5px;}',
        '.osh-layer-meta{font-size:11px;color:var(--osh-mute);margin-top:2px;}',
        '.osh-chip{display:inline-block;font-size:10px;color:var(--osh-teal);background:rgba(13,102,118,.1);border-radius:999px;padding:2px 7px;margin:2px 2px 0 0;}',
        '.osh-layer-card{background:var(--osh-card);border:1px solid var(--osh-line);border-left:4px solid var(--osh-rust);border-radius:12px;padding:12px;}',
        '.osh-layer-card.running{border-left-color:var(--osh-teal);}',
        '.osh-layer-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;}',
        '.osh-lv{font-family:Georgia,serif;font-size:20px;font-weight:700;white-space:nowrap;}',
        '.osh-lv span{font-size:12px;color:var(--osh-mute);}',
        '.osh-pips{display:flex;gap:3px;margin:9px 0 6px;}',
        '.osh-pips i{flex:1;height:8px;border-radius:3px;background:var(--osh-line);}',
        '.osh-pips i.on{background:var(--osh-rust);}',
        '.osh-pips i.cap-ok{background:var(--osh-rust-soft);}',
        '.osh-bar{height:6px;border-radius:999px;background:var(--osh-line);overflow:hidden;margin:6px 0 2px;}',
        '.osh-bar span{display:block;height:100%;background:var(--osh-teal);border-radius:inherit;transition:width .4s ease;}',
        '.osh-bar-row{margin:8px 0;}',
        '.osh-bar-top{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;}',
        '.osh-tier{font-style:normal;font-size:10px;color:var(--osh-mute);margin-left:4px;}',
        '.osh-chart{width:100%;height:96px;display:block;margin-top:6px;}',
        '.osh-empty{text-align:center;color:var(--osh-mute);font-size:13px;padding:24px 12px;background:var(--osh-card);border:1px dashed var(--osh-line);border-radius:12px;}',
        '@media (min-width:700px){.osh-kpis{grid-template-columns:repeat(4,minmax(0,1fr));}}'
    ].join('');
    document.head.appendChild(st);
}
