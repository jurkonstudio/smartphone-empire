import { sb, rpc, esc, num, idr, when, ago, bytes, gameDate, download, toast, checkAdmin } from './admin.js';
const $ = s => document.querySelector(s), main = $('#main'), pdlg = $('#pdlg'), pbody = $('#pd-body');
const out = async () => { await sb.auth.signOut(); location.replace('../login/'); };

const user = await checkAdmin();
if (!user) { location.replace('../login/'); await new Promise(() => {}); }
$('#who').textContent = user.email;
$('#logout').onclick = out;
sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') location.replace('../login/'); });

let tab = 'home', status = 'pending', players = [], query = '', pfilter = 'all', psort = 'joined', pshown = 100;
let cur = null, curTab = 'info', curSave = undefined, ledgerQ = '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
async function go(t) {
    tab = t;
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    main.innerHTML = '<p class="muted">Memuat…</p>';
    try { await views[t](); }
    catch (e) { if (e.denied) return out(); main.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

const bars = (d, color, unit) => {
    const max = Math.max(1, ...d);
    return d.map((c, i) => { const h = Math.round((c / max) * 70);
        return `<rect x="${i * 24 + 4}" y="${80 - h}" width="16" height="${h}" rx="3" fill="${color}"><title>${num(c)} ${unit}</title></rect>`; }).join('');
};
const stat = (label, val, cls = '', sub = '') => `<div class="stat"><span>${label}</span><strong class="${cls}">${val}</strong>${sub ? `<small>${sub}</small>` : ''}</div>`;
const kv = (pairs) => `<div class="kv">${pairs.map(([k, v]) => `<div><small>${esc(k)}</small><b>${v == null || v === '' ? '-' : v}</b></div>`).join('')}</div>`;
const pname = p => esc(p.company_name || p.player_name || p.display_name || 'Tanpa nama');

const views = {
    async home() {
        const s = await rpc('admin_dashboard_stats'), tp = s.top_players || [];
        main.innerHTML = `<div class="grid">
          <button class="stat ${s.pending > 0 ? 'hot' : ''}" data-go="orders"><span>Pesanan menunggu</span><strong>${num(s.pending)}</strong></button>
          ${stat('Pemain', num(s.players), '', `+${num(s.new_24h)} hari ini · +${num(s.new_7d)} minggu ini`)}
          ${stat('SIL beredar', num(s.sil_total), 'sil', `rata-rata ${num(s.sil_avg)} / dompet`)}
          ${stat('Pendapatan', idr(s.revenue), 'ok', `30 hari: ${idr(s.revenue_30d)}`)}</div>
          <div class="grid g6">
          ${stat('Aktif 24 jam', num(s.active_24h))}${stat('Aktif 7 hari', num(s.active_7d))}
          ${stat('Save cloud', num(s.saves))}${stat('Dompet SIL', num(s.wallets))}
          ${stat('Diblokir', num(s.banned), s.banned > 0 ? 'err' : '')}${stat('Admin', num(s.admins))}</div>
          <div class="grid g6">
          ${stat('Pesanan disetujui', num(s.orders_ok))}${stat('Pesanan ditolak', num(s.orders_rej))}
          ${stat('Transaksi SIL 24 jam', num(s.ledger_24h))}${stat('Total unit terjual (game)', num(s.game_sold_total))}
          ${stat('Total kas (game)', num(s.game_cash_total))}${stat('Total omzet (game)', num(s.game_revenue_total))}</div>
          <div class="two"><div class="panel"><h2>Pendaftar 14 hari</h2>
            <svg viewBox="0 0 340 86" width="100%" role="img" aria-label="Grafik pendaftar harian">${bars(s.signups_14d || [], '#7aa7ff', 'pendaftar')}</svg></div>
          <div class="panel"><h2>Pendapatan 14 hari</h2>
            <svg viewBox="0 0 340 86" width="100%" role="img" aria-label="Grafik pendapatan harian">${bars(s.revenue_14d || [], '#4fd1a1', 'Rp')}</svg></div></div>
          <div class="panel"><h2>Pemain teratas (omzet dalam game)</h2>
          ${tp.length ? `<div class="tw"><table><thead><tr><th>#</th><th>Perusahaan</th><th class="n">Omzet</th><th class="n">Terjual</th><th class="n">Reputasi</th><th class="n">Pangsa</th></tr></thead><tbody>
          ${tp.map((p, i) => `<tr class="click" data-open="${esc(p.id)}"><td>${i + 1}</td><td>${esc(p.name)}</td><td class="n">${num(p.stat_revenue)}</td><td class="n">${num(p.stat_sold)}</td><td class="n">${num(p.stat_reputation)}</td><td class="n">${num(p.stat_share)}%</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="muted">Belum ada data.</p>'}</div>`;
    },

    async orders() {
        const list = await rpc('admin_list_orders', { p_status: status === 'all' ? null : status });
        const chips = [['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak'], ['all', 'Semua']]
            .map(([k, v]) => `<button class="btn ${k === status ? 'on' : ''}" data-st="${k}">${v}</button>`).join('');
        const rows = list.length ? list.map(o => `<div class="row"><div class="main">
            <div>${esc(o.company_name || o.email)}</div><small>ID ${esc(o.public_id)} · ${esc(o.email)} · ${when(o.created_at)} · ${esc(o.id)}</small></div>
            <div><strong>${idr(o.amount)}</strong> <span class="sil">${num(o.sil_amount)} SIL</span></div>
            ${o.status === 'pending'
                ? `<div class="acts"><button class="btn bad" data-rej="${esc(o.id)}">Tolak</button><button class="btn good" data-ok="${esc(o.id)}">Setujui</button></div>`
                : `<span class="tag ${esc(o.status)}">${o.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>`}</div>`).join('')
            : '<div class="empty">Tidak ada pesanan di kategori ini.</div>';
        main.innerHTML = `<h2>Pesanan</h2><div class="chips">${chips}</div>${rows}`;
    },

    async players() {
        players = await rpc('admin_get_all_profiles');
        const F = [['all', 'Semua'], ['active7', 'Aktif 7 hari'], ['save', 'Punya save'], ['nosave', 'Tanpa save'], ['paid', 'Pernah top-up'], ['banned', 'Diblokir'], ['admin', 'Admin']];
        main.innerHTML = `<h2>Pemain (<span id="pcount">${num(players.length)}</span>)</h2>
          <div class="bar"><input id="q" type="search" placeholder="Cari nama, perusahaan, email, atau ID pemain (8 digit)" aria-label="Cari pemain" value="${esc(query)}">
            <select id="psort" aria-label="Urutkan">${[['joined', 'Terbaru bergabung'], ['login', 'Login terakhir'], ['sil', 'SIL terbanyak'], ['revenue', 'Omzet game'], ['cash', 'Kas game'], ['sold', 'Unit terjual'], ['save', 'Save terbaru'], ['spent', 'Top-up (Rp)']]
              .map(([k, v]) => `<option value="${k}" ${k === psort ? 'selected' : ''}>${v}</option>`).join('')}</select>
            <button class="btn" id="pcsv">Ekspor CSV</button></div>
          <div class="chips">${F.map(([k, v]) => `<button class="btn ${k === pfilter ? 'on' : ''}" data-pf="${k}">${v}</button>`).join('')}</div>
          <div id="plist"></div>`;
        $('#q').oninput = e => { query = e.target.value; pshown = 100; drawPlayers(); };
        $('#psort').onchange = e => { psort = e.target.value; drawPlayers(); };
        $('#pcsv').onclick = exportCsv;
        drawPlayers();
    },

    async sil() {
        const list = await rpc('admin_list_ledger', { p_user_id: null, p_search: ledgerQ || null, p_limit: 300 });
        main.innerHTML = `<h2>Ledger SIL</h2>
          <form class="bar" id="lq"><input id="lqi" type="search" placeholder="Cari alasan, email, atau perusahaan (mis. topup, admin, quest)" value="${esc(ledgerQ)}"><button class="btn pri">Cari</button></form>
          ${ledgerTable(list, true)}`;
        $('#lq').onsubmit = e => { e.preventDefault(); ledgerQ = $('#lqi').value.trim(); go('sil'); };
    },

    async audit() {
        const list = await rpc('admin_list_audit', { p_limit: 300 });
        main.innerHTML = `<h2>Jejak audit admin</h2>${list.length ? `<div class="tw"><table><thead><tr><th>Waktu</th><th>Admin</th><th>Aksi</th><th>Target</th><th>Detail</th></tr></thead><tbody>
          ${list.map(a => `<tr><td class="sm">${when(a.created_at)}</td><td class="sm">${esc(a.admin_email || a.admin_id)}</td><td><span class="tag info">${esc(a.action)}</span></td>
            <td class="sm">${UUID.test(a.target || '') ? `<button class="btn" data-open="${esc(a.target)}">Buka</button>` : esc(a.target || '-')}</td>
            <td class="sm">${esc(a.detail ? JSON.stringify(a.detail) : '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Belum ada aksi admin.</div>'}`;
    },

    async system() {
        const s = await rpc('admin_system_overview'), fq = '';
        const fn = s.functions || [];
        main.innerHTML = `<h2>Sistem Supabase</h2>
          <div class="grid g3">${stat('Ukuran database', bytes(s.db_bytes))}${stat('PostgreSQL', esc(s.pg_version))}${stat('Realtime aktif', num((s.realtime || []).length), '', esc((s.realtime || []).join(', ')))}</div>
          <h3>Tabel (schema public)</h3><div class="tw"><table><thead><tr><th>Tabel</th><th class="n">Baris</th><th class="n">Ukuran</th><th>RLS</th><th class="n">Policy</th></tr></thead><tbody>
          ${(s.tables || []).map(t => `<tr><td>${esc(t.name)}</td><td class="n">${num(t.rows)}</td><td class="n">${bytes(t.bytes)}</td>
            <td>${t.rls ? '<span class="tag ok">aktif</span>' : '<span class="tag bad">mati</span>'}</td><td class="n">${num(t.policies)}</td></tr>`).join('')}</tbody></table></div>
          <h3>Storage</h3><div class="tw"><table><thead><tr><th>Bucket</th><th>Akses</th><th class="n">File</th><th class="n">Ukuran</th><th class="n">Batas file</th></tr></thead><tbody>
          ${(s.buckets || []).map(b => `<tr><td>${esc(b.id)}</td><td>${b.public ? '<span class="tag warn">publik</span>' : '<span class="tag ok">privat</span>'}</td><td class="n">${num(b.files)}</td><td class="n">${bytes(b.bytes)}</td><td class="n">${b.file_size_limit ? bytes(b.file_size_limit) : '-'}</td></tr>`).join('')}</tbody></table></div>
          <h3>Fungsi / RPC (${num(fn.length)})</h3>
          <div class="bar"><input id="fq" type="search" placeholder="Filter nama fungsi" value="${esc(fq)}"></div>
          <div class="tw"><table><thead><tr><th>Fungsi</th><th>Hasil</th><th>Definer</th><th>anon</th><th>login</th><th>service</th></tr></thead><tbody id="fbody"></tbody></table></div>
          <p class="muted sm">Fungsi berawalan _ bersifat internal. Kolom anon = bisa dipanggil tanpa login (hanya company_name_available yang memang sengaja).</p>`;
        const yes = (v, bad) => v ? `<span class="tag ${bad ? 'warn' : 'ok'}">ya</span>` : '<span class="muted">tidak</span>';
        const draw = () => { const q = $('#fq').value.trim().toLowerCase();
            $('#fbody').innerHTML = fn.filter(f => !q || f.name.toLowerCase().includes(q)).map(f => `<tr><td><b>${esc(f.name)}</b><br><small class="muted">(${esc(f.args)})</small></td>
              <td class="sm">${esc(f.returns)}</td><td>${f.security_definer ? 'ya' : '-'}</td><td>${yes(f.anon, true)}</td><td>${yes(f.authenticated)}</td><td>${yes(f.service_role)}</td></tr>`).join(''); };
        $('#fq').oninput = draw; draw();
    }
};

// ---------- Daftar pemain ----------
const SORTS = {
    joined: p => +new Date(p.created_at), login: p => +new Date(p.last_sign_in_at || 0), sil: p => +p.silicon_balance,
    revenue: p => +p.stat_revenue || 0, cash: p => +p.stat_cash || 0, sold: p => +p.stat_sold || 0,
    save: p => +new Date(p.save_updated_at || 0), spent: p => +p.spent_idr || 0
};
const FILTERS = {
    all: () => true, active7: p => p.last_sign_in_at && Date.now() - new Date(p.last_sign_in_at) < 7 * 864e5,
    save: p => !!p.save_updated_at, nosave: p => !p.save_updated_at, paid: p => +p.spent_idr > 0, banned: p => p.banned, admin: p => p.is_admin
};
function filtered() {
    const q = query.trim().toLowerCase();
    return players.filter(FILTERS[pfilter]).filter(p => !q || [p.email, p.company_name, p.player_name, p.display_name, p.id, p.public_id == null ? '' : String(p.public_id)].some(v => (v || '').toLowerCase().includes(q)))
        .sort((a, b) => SORTS[psort](b) - SORTS[psort](a));
}
function drawPlayers() {
    const f = filtered(), el = $('#plist'); if (!el) return;
    $('#pcount').textContent = num(f.length) + (f.length !== players.length ? ' / ' + num(players.length) : '');
    el.innerHTML = f.length ? f.slice(0, pshown).map(p => `<div class="row click" data-open="${esc(p.id)}" tabindex="0"><div class="main">
        <div>${pname(p)}${p.is_admin ? '<span class="tag info">admin</span>' : ''}${p.banned ? '<span class="tag bad">diblokir</span>' : ''}${!p.save_updated_at ? '<span class="tag">tanpa save</span>' : ''}</div>
        <small>ID ${esc(p.public_id)} · ${esc(p.email)} · login ${ago(p.last_sign_in_at)} · bergabung ${when(p.created_at)}${p.save_updated_at ? ` · game ${gameDate(p.game_year, p.game_month)}` : ''}</small></div>
        <div class="sm muted">Omzet ${num(p.stat_revenue)}<br>Kas ${num(p.stat_cash)}</div>
        <div class="sil"><strong>${num(p.silicon_balance)}</strong> SIL</div></div>`).join('')
        + (f.length > pshown ? `<button class="btn more" id="pmore">Tampilkan lebih banyak (${num(f.length - pshown)})</button>` : '')
        : '<div class="empty">Tidak ada pemain yang cocok.</div>';
}
function exportCsv() {
    const cols = ['public_id', 'id', 'email', 'player_name', 'company_name', 'created_at', 'last_sign_in_at', 'banned', 'silicon_balance', 'streak', 'last_daily', 'stat_revenue', 'stat_sold', 'stat_reputation', 'stat_share', 'stat_cash', 'stat_products', 'game_year', 'game_month', 'game_minutes', 'save_updated_at', 'orders_count', 'spent_idr'];
    const cell = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    download('pemain.csv', [cols.join(','), ...filtered().map(p => cols.map(c => cell(p[c])).join(','))].join('\n'), 'text/csv');
}

function ledgerTable(list, withUser) {
    if (!list.length) return '<div class="empty">Tidak ada transaksi.</div>';
    return `<div class="tw"><table><thead><tr><th>Waktu</th>${withUser ? '<th>Pemain</th>' : ''}<th class="n">Perubahan</th><th class="n">Saldo</th><th>Alasan</th></tr></thead><tbody>
      ${list.map(l => `<tr><td class="sm">${when(l.created_at)}</td>${withUser ? `<td class="sm"><button class="btn" data-open="${esc(l.user_id)}">${esc(l.company_name || l.email)}</button></td>` : ''}
        <td class="n ${l.delta >= 0 ? 'pos' : 'neg'}">${l.delta > 0 ? '+' : ''}${num(l.delta)}</td><td class="n">${num(l.balance)}</td><td class="sm">${esc(l.reason)}</td></tr>`).join('')}</tbody></table></div>`;
}

// ---------- Detail pemain ----------
async function openPlayer(id) {
    cur = null; curSave = undefined; curTab = 'info';
    $('#pd-title').textContent = 'Memuat…'; $('#pd-sub').textContent = ''; pbody.innerHTML = '<p class="muted">Memuat…</p>';
    setPT('info'); if (!pdlg.open) pdlg.showModal();
    try { cur = await rpc('admin_get_player', { p_user_id: id }); drawPlayer(); }
    catch (e) { if (e.denied) return out(); pbody.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}
const setPT = t => document.querySelectorAll('[data-pt]').forEach(b => b.classList.toggle('on', b.dataset.pt === t));
async function drawPlayer() {
    if (!cur) return;
    const a = cur.account, p = cur.profile || {}, w = cur.wallet || {}, h = (cur.heads || [])[0];
    $('#pd-title').innerHTML = esc(p.company_name || p.player_name || a.email) + (a.is_admin ? '<span class="tag info">admin</span>' : '')
        + (a.banned_until && new Date(a.banned_until) > new Date() ? '<span class="tag bad">diblokir</span>' : '');
    $('#pd-sub').textContent = 'ID ' + (p.public_id ?? '-') + ' · ' + a.email + ' · ' + a.id;
    setPT(curTab);
    if (curTab === 'info') {
        pbody.innerHTML = `<h3>Akun</h3>${kv([['ID Pemain (publik)', esc(p.public_id)], ['User ID (UUID)', esc(a.id)], ['Email', esc(a.email)], ['Provider', esc(a.provider)], ['Bergabung', when(a.created_at)], ['Login terakhir', when(a.last_sign_in_at) + ' (' + ago(a.last_sign_in_at) + ')'],
            ['Email terverifikasi', a.email_confirmed_at ? when(a.email_confirmed_at) : 'belum'], ['Status', a.banned_until && new Date(a.banned_until) > new Date() ? 'diblokir' : 'normal']])}
          <h3>Profil publik &amp; statistik (dilaporkan klien)</h3>${kv([['Nama pemain', esc(p.player_name)], ['Nama display', esc(p.display_name)], ['Perusahaan', esc(p.company_name)],
            ['Berdiri', gameDate(p.founded_year, p.founded_month)], ['Ganti nama', num(p.name_changes)], ['Foto profil', esc(p.avatar_path)],
            ['Omzet', num(p.stat_revenue)], ['Unit terjual', num(p.stat_sold)], ['Reputasi', num(p.stat_reputation)], ['Pangsa pasar', num(p.stat_share) + '%'],
            ['Kas', num(p.stat_cash)], ['Produk', num(p.stat_products)], ['Statistik diperbarui', when(p.stats_updated_at)]])}
          <h3>Dompet SIL</h3>${kv([['Saldo', `<span class="sil">${num(w.balance)}</span>`], ['Streak harian', num(w.streak)], ['Klaim harian terakhir', esc(w.last_daily)],
            ['Total masuk', num(cur.ledger_totals.earned)], ['Total keluar', num(cur.ledger_totals.spent)], ['Transaksi', num(cur.ledger_totals.rows)], ['Quest diklaim', num((cur.quests || []).length)]])}
          <h3>Save cloud</h3>${h ? kv([['Perusahaan', esc(h.company_name)], ['Tanggal game', gameDate(h.game_year, h.game_month)], ['Waktu main (menit game)', num(h.game_minutes)],
            ['Disimpan', when(h.updated_at)], ['Skema', esc(h.schema_version)], ['Perangkat', esc(h.device_id)], ['Ukuran (terkompresi)', bytes(cur.save_bytes)]]) : '<p class="muted">Belum ada save cloud.</p>'}`;
    } else if (curTab === 'wallet') {
        pbody.innerHTML = `<h3>Riwayat SIL (200 terakhir)</h3>${ledgerTable(cur.ledger || [], false)}
          <h3>Quest yang diklaim</h3>${(cur.quests || []).length ? kv(cur.quests.map(q => [q.quest_id, when(q.claimed_at)])) : '<p class="muted">Belum ada.</p>'}`;
    } else if (curTab === 'orders') {
        const o = cur.orders || [];
        pbody.innerHTML = `<h3>Pesanan top-up</h3>${o.length ? `<div class="tw"><table><thead><tr><th>ID</th><th>Waktu</th><th>Paket</th><th class="n">Rp</th><th class="n">SIL</th><th>Status</th></tr></thead><tbody>
          ${o.map(x => `<tr><td class="sm">${esc(x.id)}</td><td class="sm">${when(x.created_at)}</td><td>${esc(x.package_id)}</td><td class="n">${num(x.amount)}</td><td class="n">${num(x.sil_amount)}</td><td><span class="tag ${esc(x.status)}">${esc(x.status)}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Belum ada pesanan.</p>'}`;
    } else if (curTab === 'save') {
        await drawSave();
    } else if (curTab === 'actions') {
        drawActions();
    }
}

async function drawSave() {
    if (curSave === undefined) {
        pbody.innerHTML = '<p class="muted">Memuat save…</p>';
        try { curSave = await rpc('admin_get_player_save', { p_user_id: cur.account.id }); } catch (e) { pbody.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
    }
    if (!curSave) { pbody.innerHTML = '<p class="muted">Pemain ini belum punya save cloud.</p>'; return; }
    const d = curSave.data || {}, T = d.time || {}, cat = (d.products && d.products.catalog) || [], st = d.staff || [];
    const roles = st.reduce((m, s) => (m[s.role] = (m[s.role] || 0) + 1, m), {});
    const sold = cat.reduce((n, p) => n + (p.totalSold || 0), 0), rev = cat.reduce((n, p) => n + (p.totalRevenue || 0), 0);
    pbody.innerHTML = `<h3>Ringkasan save</h3>${kv([
        ['Perusahaan', esc(d.companyName)], ['Kesulitan', esc(d.difficulty)], ['Era', esc(d.era)], ['Tanggal game', gameDate(T.currentYear, T.currentMonth) + (T.currentDay ? ' tgl ' + T.currentDay : '')],
        ['Kas', num(d.cash)], ['SIL', `<span class="sil">${num(d.silicon)}</span>`], ['Pangsa pasar', d.market ? num(d.market.share) + '%' : '-'], ['Reputasi', d.market ? num(d.market.reputation) : '-'],
        ['Produk', num(cat.length)], ['Unit terjual', num(sold)], ['Omzet produk', num(rev)], ['Staf', num(st.length) + (st.length ? ' (' + Object.entries(roles).map(([k, v]) => k + ' ' + v).join(', ') + ')' : '')],
        ['Riset selesai', d.research ? num((d.research.completed || []).length) : '-'], ['Riset berjalan', d.research ? num((d.research.active || []).length) : '-'],
        ['Chip', d.chips ? num((d.chips.catalog || []).length) : '-'], ['OS', d.os && d.os.name ? esc(d.os.name) + ' (' + num((d.os.versions || []).length) + ' versi)' : '-'],
        ['Pabrik', d.fab ? (d.fab.built ? 'level ' + d.fab.level : 'belum dibangun') : '-'], ['Pinjaman aktif', d.finance ? num((d.finance.loans || []).length) : '-'],
        ['Bulan rugi beruntun', d.finance ? num(d.finance.negativeMonths) : '-'], ['Quest selesai', d.quests ? num((d.quests.completed || []).length) : '-'],
        ['Berita', d.news ? num((d.news.articles || []).length) : '-'], ['Game over', d.gameOver ? esc(JSON.stringify(d.gameOver)).slice(0, 80) : 'tidak'],
        ['Streak harian', d.dailyLogin ? num(d.dailyLogin.streak) : '-'], ['Versi skema', esc(curSave.schema_version)], ['Disimpan', when(curSave.updated_at)], ['Perangkat', esc(curSave.device_id)]])}
      ${cat.length ? `<h3>Produk (${cat.length})</h3><div class="tw"><table><thead><tr><th>Nama</th><th>Status</th><th class="n">Harga</th><th class="n">Stok</th><th class="n">Terjual</th><th class="n">Omzet</th></tr></thead><tbody>
        ${cat.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.status)}</td><td class="n">${num(p.price)}</td><td class="n">${num(p.stock)}</td><td class="n">${num(p.totalSold)}</td><td class="n">${num(p.totalRevenue)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${st.length ? `<h3>Staf (${st.length})</h3><div class="tw"><table><thead><tr><th>Nama</th><th>Peran</th><th class="n">Skill</th><th class="n">Gaji</th><th class="n">Moral</th></tr></thead><tbody>
        ${st.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.role)}</td><td class="n">${num(s.skill)}</td><td class="n">${num(s.salary)}</td><td class="n">${num(s.morale)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <h3>Data mentah (JSON)</h3>
      <div class="bar"><select id="jk" aria-label="Bagian save">${Object.keys(d).map(k => `<option value="${esc(k)}">${esc(k)} (${bytes(JSON.stringify(d[k] ?? null).length)})</option>`).join('')}<option value="__all">— seluruh save —</option></select>
        <button class="btn" id="jdl">Unduh JSON lengkap</button></div><pre id="jv"></pre>`;
    const show = () => { const k = $('#jk').value, v = k === '__all' ? d : d[k]; let t = JSON.stringify(v, null, 2) || ''; if (t.length > 150000) t = t.slice(0, 150000) + '\n… (dipotong, unduh untuk lengkap)'; $('#jv').textContent = t; };
    $('#jk').onchange = show; show();
    $('#jdl').onclick = () => download('save-' + cur.account.id.slice(0, 8) + '.json', JSON.stringify(d, null, 2));
}

function drawActions() {
    const a = cur.account, p = cur.profile || {}, w = cur.wallet || {}, banned = a.banned_until && new Date(a.banned_until) > new Date();
    pbody.innerHTML = `<h3>Saldo SIL (sekarang ${num(w.balance)})</h3>
      <div class="act"><input id="ac-amt" type="number" step="1" placeholder="Jumlah, mis. 50 atau -20" aria-label="Jumlah SIL"><input id="ac-why" maxlength="80" placeholder="Alasan (tercatat)" aria-label="Alasan">
        <button class="btn good" data-act="add">Tambah / kurangi</button><button class="btn" data-act="set">Set saldo</button></div>
      <h3>Nama</h3><div class="note">Game menyinkronkan nama dari klien; jika pemain sinkron lagi, nama bisa kembali ke versinya. Cocok untuk moderasi cepat.</div>
      <div class="act"><input id="ac-pn" maxlength="24" placeholder="Nama pemain" value="${esc(p.player_name || '')}" aria-label="Nama pemain"><input id="ac-cn" maxlength="24" placeholder="Nama perusahaan" value="${esc(p.company_name || '')}" aria-label="Nama perusahaan">
        <button class="btn" data-act="name">Simpan nama</button></div>
      <div class="danger"><h3>Zona berbahaya</h3>
        <div class="act"><input id="ac-dwhy" maxlength="120" placeholder="Alasan (tercatat di audit)" aria-label="Alasan zona berbahaya">
          <button class="btn bad" data-act="ban">${banned ? 'Buka blokir akun' : 'Blokir akun'}</button>
          <button class="btn bad" data-act="delsave">Hapus save cloud</button></div>
        <p class="muted sm">Blokir mencegah login. Hapus save mereset progres pemain secara permanen (tersimpan di audit, tetapi datanya hilang).</p></div>`;
}

pdlg.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pt) { curTab = b.dataset.pt; return drawPlayer(); }
    if (b.dataset.open) return openPlayer(b.dataset.open);
    if (!b.dataset.act || !cur) return;
    const id = cur.account.id, why = ($('#ac-why') || {}).value, act = b.dataset.act;
    const run = async (fn, okMsg) => { b.disabled = true;
        try { await fn(); toast(okMsg); curSave = undefined; cur = await rpc('admin_get_player', { p_user_id: id }); drawPlayer(); }
        catch (err) { toast(err.message); b.disabled = false; } };
    if (act === 'add' || act === 'set') {
        const v = Math.trunc(Number($('#ac-amt').value));
        if (!Number.isFinite(v) || $('#ac-amt').value === '' || (act === 'add' && v === 0) || (act === 'set' && v < 0)) return toast('Isi jumlah yang valid.');
        if (!confirm(act === 'add' ? `Ubah saldo ${v > 0 ? '+' : ''}${v} SIL?` : `Set saldo menjadi ${v} SIL?`)) return;
        return run(() => act === 'add' ? rpc('admin_add_silicon', { p_user_id: id, p_delta: v, p_reason: why })
            : rpc('admin_set_silicon', { p_user_id: id, p_amount: v, p_reason: why }), 'Saldo SIL diperbarui');
    }
    if (act === 'name') return run(() => rpc('admin_update_profile', { p_user_id: id, p_player_name: $('#ac-pn').value, p_company_name: $('#ac-cn').value }), 'Nama diperbarui');
    const dwhy = $('#ac-dwhy').value;
    if (act === 'ban') {
        const banned = cur.account.banned_until && new Date(cur.account.banned_until) > new Date();
        if (!confirm(banned ? 'Buka blokir akun ini?' : 'Blokir akun ini? Pemain tidak bisa login lagi.')) return;
        return run(() => rpc('admin_set_banned', { p_user_id: id, p_banned: !banned, p_reason: dwhy }), banned ? 'Blokir dibuka' : 'Akun diblokir');
    }
    if (act === 'delsave') {
        if (!confirm('HAPUS save cloud pemain ini? Tidak bisa dibatalkan.')) return;
        return run(() => rpc('admin_delete_save', { p_user_id: id, p_reason: dwhy }), 'Save dihapus');
    }
});
$('#pd-close').onclick = () => pdlg.close();
pdlg.addEventListener('close', () => { if (tab === 'players') { go('players'); } });

main.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.open) openPlayer(e.target.dataset.open); });
main.addEventListener('click', async e => {
    const o = e.target.closest('[data-open]'); if (o) return openPlayer(o.dataset.open);
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'pmore') { pshown += 100; return drawPlayers(); }
    if (b.dataset.pf) { pfilter = b.dataset.pf; pshown = 100; document.querySelectorAll('[data-pf]').forEach(x => x.classList.toggle('on', x === b)); return drawPlayers(); }
    if (b.dataset.go) return go(b.dataset.go);
    if (b.dataset.st) { status = b.dataset.st; return go('orders'); }
    if (b.dataset.ok || b.dataset.rej) {
        const ok = !!b.dataset.ok, id = b.dataset.ok || b.dataset.rej;
        if (!confirm(ok ? 'Setujui pesanan ini? SIL langsung masuk ke dompet pemain.' : 'Tolak pesanan ini?')) return;
        b.disabled = true;
        try { await rpc(ok ? 'admin_approve_payment' : 'admin_reject_payment', { p_order_id: id }); toast(ok ? 'Pesanan disetujui' : 'Pesanan ditolak'); go('orders'); }
        catch (err) { toast(err.message); b.disabled = false; }
    }
});

go('home');
