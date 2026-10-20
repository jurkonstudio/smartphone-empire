import { CFG } from '/031411/dashboard/config.js';
const ADMIN_EMAIL = CFG.adminEmail;
const $ = (s, r) => (r || document).querySelector(s);
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = { sb: null, players: [], pays: [], sel: null, filter: '', tab: 'ov', logs: [] };

/* ---------- console ---------- */
function log(kind, msg) {
  S.logs.unshift({ k: kind, t: new Date().toTimeString().slice(0, 8), m: String(msg) });
  if (S.logs.length > 200) S.logs.length = 200;
  if (S.tab === 'con') renderCon();
}
function renderCon() {
  $('#t-con').innerHTML = '<div class="row"><button class="btn sm" data-a="clearlog">Bersihkan</button><span class="dim">' + S.logs.length + ' entri</span></div>' +
    '<div class="tw">' + (S.logs.map(l => '<div class="ln ' + l.k + '"><i>' + l.t + '</i>' + esc(l.m) + '</div>').join('') || '<div class="ln dim">(kosong)</div>') + '</div>';
}

/* ---------- helpers ---------- */
function fmt(v) {
  if (v == null) return '–';
  if (typeof v === 'number') return v.toLocaleString('en-US');
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  if (/^\d{4}-\d\d-\d\dT/.test(s)) return s.slice(0, 16).replace('T', ' ');
  return s.length > 28 ? s.slice(0, 27) + '…' : s;
}
function rowsOf(d) { return Array.isArray(d) ? d : (d && typeof d === 'object' ? [d] : []); }
function idOf(r) { return r.id || r.user_id || ''; }
async function rpc(name, args) {
  const r = await S.sb.rpc(name, args);
  if (r.error) { log('er', name + ': ' + r.error.message); throw r.error; }
  log('ok', name + ' ok');
  return r.data;
}
function table(rows, cols, extra) {
  if (!rows.length) return '<div class="dim" style="padding:8px">(kosong)</div>';
  return '<div class="tw"><table><thead><tr>' + cols.map(c => '<th>' + esc(c) + '</th>').join('') + (extra ? '<th></th>' : '') + '</tr></thead><tbody>' +
    rows.map((r, i) => '<tr data-a="' + (extra ? '' : 'player') + '" data-i="' + i + '">' + cols.map(c => '<td>' + esc(fmt(r[c])) + '</td>').join('') + (extra ? '<td>' + extra(r, i) + '</td>' : '') + '</tr>').join('') + '</tbody></table></div>';
}
function pickCols(rows, pref) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const c = pref.filter(k => keys.includes(k));
  return c.length ? c : keys.slice(0, 5);
}

/* ---------- tabs ---------- */
function setTab(t) {
  S.tab = t;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  ['ov', 'pl', 'pay', 'led', 'con', 'tb', 'rpc', 'inf'].forEach(k => $('#t-' + k).classList.toggle('hide', k !== t));
  if (t === 'ov') renderOv();
  if (t === 'pl') renderPl();
  if (t === 'pay') renderPay();
  if (t === 'led') renderLed();
  if (t === 'con') renderCon();
  if (t === 'tb') renderTb();
  if (t === 'rpc') renderRpc();
  if (t === 'inf') renderInf();
}

/* ---------- data ---------- */
async function loadPlayers() {
  try { S.players = rowsOf(await rpc(CFG.rpc.profiles)); }
  catch (e) { S.players = []; }
}
async function loadPays() {
  try { S.pays = rowsOf(await rpc(CFG.rpc.pendingPayments)); }
  catch (e) { S.pays = []; }
}

/* ---------- overview ---------- */
function renderOv() {
  const today = new Date().toISOString().slice(0, 10);
  const newToday = S.players.filter(p => String(p.created_at || '').startsWith(today)).length;
  $('#t-ov').innerHTML =
    '<div class="grid">' +
    '<div class="stat"><small>Total pemain</small><b>' + S.players.length.toLocaleString('en-US') + '</b></div>' +
    '<div class="stat"><small>Pemain baru hari ini</small><b>' + newToday + '</b></div>' +
    '<div class="stat"><small>Pembayaran tertunda</small><b>' + S.pays.length + '</b></div>' +
    '<div class="stat"><small>Server</small><b style="font-size:12px">' + esc((S.cfgUrl || '').replace('https://', '')) + '</b></div>' +
    '</div><div class="row"><button class="btn sm" data-a="reload">Muat ulang data</button></div>';
}

/* ---------- players ---------- */
const PS = CFG.pageSize;
function renderPl() {
  const q = S.filter.toLowerCase();
  let rows = q ? S.players.filter(p => JSON.stringify(p).toLowerCase().includes(q)) : S.players.slice();
  const cols = pickCols(S.players, CFG.playerCols);
  if (S.sort) { const c = S.sort.c, d = S.sort.d; rows.sort((x, y) => { const a = x[c], b = y[c]; if (a == b) return 0; if (a == null) return 1; if (b == null) return -1; return (a > b ? 1 : -1) * d; }); }
  S.all = rows;
  const pages = Math.max(1, Math.ceil(rows.length / PS));
  S.page = Math.max(0, Math.min(S.page || 0, pages - 1));
  const view = rows.slice(S.page * PS, S.page * PS + PS); S.view = view;
  const th = cols.map(c => '<th data-a="sort" data-c="' + esc(c) + '">' + esc(c) + (S.sort && S.sort.c === c ? (S.sort.d > 0 ? ' ▲' : ' ▼') : '') + '</th>').join('');
  const body = view.map((r, i) => '<tr data-a="player" data-i="' + i + '">' + cols.map(c => '<td>' + esc(fmt(r[c])) + '</td>').join('') + '</tr>').join('');
  $('#t-pl').innerHTML = '<div class="row"><input id="q" placeholder="Cari nama / ID / email…" value="' + esc(S.filter) + '"><button class="btn sm" data-a="reload">Muat ulang</button><button class="btn sm" data-a="csv">CSV</button></div>' +
    '<div class="dim" style="margin-bottom:6px">' + rows.length + ' dari ' + S.players.length + ' pemain · ketuk baris untuk detail · ketuk header untuk urut</div>' +
    (view.length ? '<div class="tw"><table><thead><tr>' + th + '</tr></thead><tbody>' + body + '</tbody></table></div>' : '<div class="dim" style="padding:8px">(kosong)</div>') +
    '<div class="row" style="margin-top:8px;justify-content:center"><button class="btn sm" data-a="pg" data-i="-1">‹</button><span class="dim">' + (S.page + 1) + ' / ' + pages + '</span><button class="btn sm" data-a="pg" data-i="1">›</button></div>';
}
function exportCsv() {
  const rows = S.all || []; if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const c = v => { v = v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); return '"' + v.replace(/"/g, '""') + '"'; };
  const csv = [keys.map(c).join(',')].concat(rows.map(r => keys.map(k => c(r[k])).join(','))).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'players-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); log('ok', 'Export CSV ' + rows.length + ' baris');
}

function openSheet(p) {
  S.sel = p;
  const kv = Object.keys(p).map(k => '<span>' + esc(k) + '</span><span>' + esc(fmt(p[k])) + '</span>').join('');
  $('#sin').innerHTML = '<div class="row" style="justify-content:space-between"><b style="color:var(--ac)">Detail pemain</b><button class="btn sm" data-a="close">Tutup</button></div>' +
    '<div class="kv">' + kv + '</div>' +
    '<div class="row"><button class="btn pri" data-a="setsil">Set saldo SIL…</button><button class="btn" data-a="wallet">Dompet &amp; ledger</button><button class="btn" data-a="copyid">Salin ID</button></div>';
  $('#sheet').classList.remove('hide');
}
function closeSheet() { $('#sheet').classList.add('hide'); }

async function setSil() {
  const p = S.sel; if (!p) return;
  const id = idOf(p);
  const v = prompt('Set saldo SIL ke berapa? (angka bulat ≥ 0)');
  if (v == null) return;
  const n = Math.floor(Number(v));
  if (!isFinite(n) || n < 0) { alert('Angka tidak valid.'); return; }
  if (!confirm('Set SIL ' + (p.display_name || p.company_name || id) + ' menjadi ' + n.toLocaleString('en-US') + '?')) return;
  try {
    await rpc(CFG.rpc.setSilicon, { p_user_id: id, p_amount: n });
    log('wn', 'SET SIL ' + id + ' → ' + n);
    closeSheet(); await loadPlayers(); renderPl();
  } catch (e) { alert('Gagal: ' + (e.message || e)); }
}

/* ---------- payments ---------- */
function renderPay() {
  const cols = pickCols(S.pays, CFG.paymentCols);
  $('#t-pay').innerHTML = '<div class="row"><button class="btn sm" data-a="reloadpay">Muat ulang</button><span class="dim">' + S.pays.length + ' tertunda</span></div>' +
    table(S.pays, cols, (r, i) => '<button class="btn sm pri" data-a="approve" data-i="' + i + '">Setujui</button>');
}
async function approve(i) {
  const r = S.pays[i]; if (!r) return;
  const id = r.order_id || r.id;
  if (!confirm('Setujui pembayaran ' + id + '?')) return;
  try { await rpc(CFG.rpc.approvePayment, { p_order_id: id }); log('wn', 'APPROVE ' + id); await loadPays(); renderPay(); }
  catch (e) { alert('Gagal: ' + (e.message || e)); }
}

/* ---------- ledger ---------- */
function renderLed(res) {
  $('#t-led').innerHTML = '<div class="row"><input id="lid" placeholder="User ID (uuid)" value="' + esc(S.ledId || '') + '"><button class="btn pri sm" data-a="loadled">Muat</button></div>' +
    '<div id="ledout">' + (res || '<div class="dim">Isi User ID atau buka dari detail pemain.</div>') + '</div>';
}
async function loadLedger(id) {
  S.ledId = id; setTab('led');
  let html = '';
  const w = await S.sb.from(CFG.tables.wallets).select('*').eq('user_id', id).maybeSingle();
  if (w.error) { log('er', 'silicon_wallets: ' + w.error.message); html += '<div class="ln er">Dompet: ' + esc(w.error.message) + '</div>'; }
  else html += '<h2>Dompet</h2>' + (w.data ? '<div class="kv">' + Object.keys(w.data).map(k => '<span>' + esc(k) + '</span><span>' + esc(fmt(w.data[k])) + '</span>').join('') + '</div>' : '<div class="dim">(tidak ada)</div>');
  const l = await S.sb.from(CFG.tables.ledger).select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(40);
  if (l.error) { log('er', 'silicon_ledger: ' + l.error.message); html += '<div class="ln er">Ledger: ' + esc(l.error.message) + '</div>'; }
  else { const rows = l.data || []; html += '<h2>Ledger (40 terakhir)</h2>' + table(rows, pickCols(rows, CFG.ledgerCols), null).replace(/data-a="player"/g, ''); }
  renderLed(html);
}

/* ---------- tables ---------- */
function renderTb(res) {
  $('#t-tb').innerHTML = '<div class="row"><input id="tbn" placeholder="nama tabel" value="' + esc(S.tbn || '') + '"><input id="tbl" type="number" min="1" max="500" value="' + (S.tbl || 50) + '" style="flex:none;min-width:0;width:70px"><button class="btn pri sm" data-a="runtb">Ambil</button></div>' +
    '<div class="row">' + CFG.quickTables.map(n => '<button class="btn sm" data-a="chip" data-n="' + n + '">' + n + '</button>').join('') + '</div><div>' + (res || '<div class="dim">Pilih / ketik nama tabel (tunduk pada RLS).</div>') + '</div>';
}
async function runTb() {
  S.tbn = ($('#tbn').value || '').trim(); S.tbl = Math.min(500, Math.max(1, +$('#tbl').value || 50));
  if (!/^[A-Za-z0-9_]+$/.test(S.tbn)) { renderTb('<div class="ln er">Nama tabel tidak valid.</div>'); return; }
  const r = await S.sb.from(S.tbn).select('*').limit(S.tbl);
  if (r.error) { log('er', S.tbn + ': ' + r.error.message); renderTb('<div class="ln er">' + esc(r.error.message) + '</div>'); return; }
  const rows = r.data || []; log('ok', S.tbn + ': ' + rows.length + ' baris');
  renderTb('<div class="dim" style="margin-bottom:6px">' + rows.length + ' baris</div>' + table(rows, rows.length ? Object.keys(rows[0]).slice(0, 8) : [], null).replace(/data-a="player"/g, '') + '<details><summary>JSON</summary><pre>' + esc(JSON.stringify(rows, null, 1)) + '</pre></details>');
}

/* ---------- rpc ---------- */
function renderRpc(out) {
  $('#t-rpc').innerHTML = '<label for="rn" style="margin-top:0">Nama fungsi</label><input id="rn" placeholder="admin_get_all_profiles" value="' + esc(S.rn || '') + '">' +
    '<label for="ra">Argumen (JSON)</label><textarea id="ra" spellcheck="false">' + esc(S.ra || '{}') + '</textarea>' +
    '<div class="row" style="margin-top:8px"><button class="btn pri sm" data-a="runrpc">Jalankan</button><span class="dim">Hati-hati: fungsi yang mengubah data langsung dieksekusi.</span></div>' + (out || '');
}
async function runRpc() {
  S.rn = ($('#rn').value || '').trim(); S.ra = $('#ra').value;
  let args; try { args = JSON.parse(S.ra || '{}'); } catch (e) { renderRpc('<div class="ln er">JSON tidak valid.</div>'); return; }
  if (!/^[A-Za-z0-9_]+$/.test(S.rn)) { renderRpc('<div class="ln er">Nama fungsi tidak valid.</div>'); return; }
  if (!confirm('Jalankan ' + S.rn + '(' + S.ra + ')?')) return;
  try { const d = await rpc(S.rn, args); log('wn', 'RPC ' + S.rn); renderRpc('<pre>' + esc(JSON.stringify(d, null, 1)) + '</pre>'); }
  catch (e) { renderRpc('<div class="ln er">' + esc(e.message || e) + '</div>'); }
}

/* ---------- info ---------- */
async function renderInf() {
  const { data } = await S.sb.auth.getSession(); const ss = data && data.session;
  const kv = [['Server', S.cfgUrl], ['Email', ss && ss.user.email], ['User ID', ss && ss.user.id],
    ['Token berakhir', ss && new Date(ss.expires_at * 1000).toLocaleString()], ['Pemain dimuat', S.players.length], ['Tertunda', S.pays.length],
    ['Layar', innerWidth + '×' + innerHeight + ' @' + devicePixelRatio + 'x'], ['Browser', navigator.userAgent]];
  $('#t-inf').innerHTML = '<div class="kv">' + kv.map(r => '<span>' + esc(r[0]) + '</span><span>' + esc(fmt(r[1])) + '</span>').join('') + '</div>' +
    '<div class="row"><button class="btn sm" data-a="refsess">Segarkan sesi</button><button class="btn sm dng" data-a="logout">Keluar</button></div>';
}

/* ---------- auth ---------- */
function showLogin(msg) {
  $('#app').classList.add('hide'); $('#login').classList.remove('hide');
  const m = $('#lm'); if (msg) { m.textContent = msg; m.className = 'msg er'; } else m.className = 'msg';
}
async function enter(user) {
  if (!user || String(user.email || '').toLowerCase() !== ADMIN_EMAIL) {
    await S.sb.auth.signOut(); showLogin('Akun ini tidak punya akses admin.'); return;
  }
  $('#who').textContent = user.email;
  $('#login').classList.add('hide'); $('#app').classList.remove('hide');
  log('ok', 'Masuk sebagai ' + user.email);
  await Promise.all([loadPlayers(), loadPays()]);
  setTab('ov');
}

async function boot() {
  try {
    const cfg = await import(CFG.supabaseConfig);
    S.cfgUrl = cfg.SUPABASE_URL;
    let mk = null;
    for (const u of cfg.SUPABASE_LIB_URLS) { try { const m = await import(u); if (m && m.createClient) { mk = m.createClient; break; } } catch (e) {} }
    if (!mk) throw new Error('Gagal memuat library Supabase.');
    S.sb = mk(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: CFG.authStorageKey } });
    S.sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') showLogin(); });
    const { data } = await S.sb.auth.getSession();
    if (data && data.session) await enter(data.session.user); else showLogin();
  } catch (e) { showLogin('Gagal memulai: ' + (e.message || e)); }
}

$('#f').addEventListener('submit', async ev => {
  ev.preventDefault();
  const b = $('#go'); b.disabled = true; b.textContent = 'Memproses…';
  try {
    const r = await S.sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
    if (r.error) throw r.error;
    $('#pw').value = '';
    await enter(r.data.user);
  } catch (e) { showLogin(e.message === 'Invalid login credentials' ? 'Email atau password salah.' : (e.message || 'Gagal masuk.')); }
  b.disabled = false; b.textContent = 'Masuk';
});

/* ---------- events ---------- */
document.addEventListener('click', async e => {
  const nb = e.target.closest('#nav button'); if (nb) { setTab(nb.dataset.tab); return; }
  const t = e.target.closest('[data-a]'); if (!t) { if (e.target.id === 'sheet') closeSheet(); return; }
  const a = t.dataset.a, i = +t.dataset.i;
  if (a === 'logout') { await S.sb.auth.signOut(); showLogin(); }
  else if (a === 'player') { const p = (S.view || [])[i]; if (p) openSheet(p); }
  else if (a === 'close') closeSheet();
  else if (a === 'setsil') setSil();
  else if (a === 'wallet') { const id = idOf(S.sel || {}); closeSheet(); if (id) loadLedger(id); }
  else if (a === 'reload') { await Promise.all([loadPlayers(), loadPays()]); setTab(S.tab); }
  else if (a === 'reloadpay') { await loadPays(); renderPay(); }
  else if (a === 'approve') approve(i);
  else if (a === 'loadled') { const id = ($('#lid').value || '').trim(); if (id) loadLedger(id); }
  else if (a === 'sort') { const c = t.dataset.c; S.sort = S.sort && S.sort.c === c ? { c, d: -S.sort.d } : { c, d: 1 }; S.page = 0; renderPl(); }
  else if (a === 'pg') { S.page = (S.page || 0) + i; renderPl(); }
  else if (a === 'csv') exportCsv();
  else if (a === 'copyid') { try { await navigator.clipboard.writeText(idOf(S.sel || {})); log('ok', 'ID disalin'); } catch (x) { prompt('Salin ID:', idOf(S.sel || {})); } }
  else if (a === 'chip') { S.tbn = t.dataset.n; renderTb(); runTb(); }
  else if (a === 'runtb') runTb();
  else if (a === 'runrpc') runRpc();
  else if (a === 'refsess') { const r = await S.sb.auth.refreshSession(); log(r.error ? 'er' : 'ok', 'refresh sesi' + (r.error ? ': ' + r.error.message : '')); renderInf(); }
  else if (a === 'clearlog') { S.logs = []; renderCon(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.filter = e.target.value; S.page = 0; const pos = e.target.selectionStart; renderPl(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); }
});

addEventListener('error', e => log('er', e.message));
addEventListener('unhandledrejection', e => log('er', 'Promise: ' + ((e.reason && e.reason.message) || e.reason)));
boot();
