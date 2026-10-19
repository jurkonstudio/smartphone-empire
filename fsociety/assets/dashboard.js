import { sb, rpc, esc, num, idr, when, toast, checkAdmin } from './admin.js';
const $ = s => document.querySelector(s), main = $('#main'), dlg = $('#dlg');
const out = async () => { await sb.auth.signOut(); location.replace('../login/'); };

const user = await checkAdmin();
if (!user) location.replace('../login/');
$('#who').textContent = user.email;
$('#logout').onclick = out;
sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') location.replace('../login/'); });

let tab = 'home', status = 'pending', players = [], query = '';

document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
async function go(t) {
    tab = t;
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    main.innerHTML = '<p class="muted">Memuat…</p>';
    try { await views[t](); }
    catch (e) { if (e.denied) return out(); main.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}

const views = {
    async home() {
        const s = await rpc('admin_dashboard_stats'), d = s.signups_14d || [], max = Math.max(1, ...d);
        const bars = d.map((c, i) => { const h = Math.round((c / max) * 70); return `<rect x="${i * 24 + 4}" y="${80 - h}" width="16" height="${h}" rx="3" fill="#7aa7ff"><title>${c} pendaftar</title></rect>`; }).join('');
        main.innerHTML = `<div class="grid">
          <button class="stat ${s.pending > 0 ? 'hot' : ''}" data-go="orders"><span>Pesanan menunggu</span><strong>${num(s.pending)}</strong></button>
          <div class="stat"><span>Pemain</span><strong>${num(s.players)}</strong><small>+${num(s.new_7d)} minggu ini</small></div>
          <div class="stat"><span>SIL beredar</span><strong class="sil">${num(s.sil_total)}</strong></div>
          <div class="stat"><span>Pendapatan</span><strong class="ok">${idr(s.revenue)}</strong></div></div>
          <div class="panel"><h2>Pendaftar 14 hari</h2>
          <svg viewBox="0 0 340 86" width="100%" role="img" aria-label="Grafik pendaftar harian">${bars}</svg></div>`;
    },

    async orders() {
        const list = await rpc('admin_list_orders', { p_status: status === 'all' ? null : status });
        const chips = [['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak'], ['all', 'Semua']]
            .map(([k, v]) => `<button class="btn ${k === status ? 'on' : ''}" data-st="${k}">${v}</button>`).join('');
        const rows = list.length ? list.map(o => `<div class="row"><div class="main">
            <div>${esc(o.company_name || o.email)}</div><small>${esc(o.email)} · ${when(o.created_at)} · ${esc(o.id)}</small></div>
            <div><strong>${idr(o.amount)}</strong> <span class="sil">${num(o.sil_amount)} SIL</span></div>
            ${o.status === 'pending'
                ? `<div class="acts"><button class="btn bad" data-rej="${esc(o.id)}">Tolak</button><button class="btn good" data-ok="${esc(o.id)}">Setujui</button></div>`
                : `<span class="tag ${esc(o.status)}">${o.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>`}</div>`).join('')
            : '<div class="empty">Tidak ada pesanan di kategori ini.</div>';
        main.innerHTML = `<h2>Pesanan</h2><div class="chips">${chips}</div>${rows}`;
    },

    async players() {
        players = await rpc('admin_get_all_profiles');
        main.innerHTML = `<h2>Pemain (${num(players.length)})</h2>
          <div class="field"><input id="q" type="search" placeholder="Cari nama, perusahaan, atau email" aria-label="Cari pemain" value="${esc(query)}"></div><div id="plist"></div>`;
        $('#q').oninput = e => { query = e.target.value; drawPlayers(); };
        drawPlayers();
    }
};

function drawPlayers() {
    const q = query.trim().toLowerCase();
    const f = players.filter(p => !q || [p.email, p.company_name, p.player_name].some(v => (v || '').toLowerCase().includes(q))).slice(0, 200);
    $('#plist').innerHTML = f.length ? f.map(p => `<div class="row"><div class="main">
        <div>${esc(p.company_name || p.player_name || 'Tanpa nama')}</div><small>${esc(p.email)} · bergabung ${when(p.created_at)}</small></div>
        <div class="sil"><strong>${num(p.silicon_balance)}</strong> SIL</div>
        <button class="btn" data-set="${esc(p.id)}">Atur SIL</button></div>`).join('')
        : '<div class="empty">Tidak ada pemain yang cocok.</div>';
}

main.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.go) return go(b.dataset.go);
    if (b.dataset.st) { status = b.dataset.st; return go('orders'); }
    if (b.dataset.ok || b.dataset.rej) {
        const ok = !!b.dataset.ok, id = b.dataset.ok || b.dataset.rej;
        if (!confirm(ok ? 'Setujui pesanan ini? SIL langsung masuk ke dompet pemain.' : 'Tolak pesanan ini?')) return;
        b.disabled = true;
        try { await rpc(ok ? 'admin_approve_payment' : 'admin_reject_payment', { p_order_id: id }); toast(ok ? 'Pesanan disetujui' : 'Pesanan ditolak'); go('orders'); }
        catch (err) { toast(err.message); b.disabled = false; }
    }
    if (b.dataset.set) {
        const p = players.find(x => x.id === b.dataset.set); if (!p) return;
        $('#dlg-name').textContent = p.company_name || p.email;
        $('#dlg-id').value = p.id; $('#dlg-amt').value = p.silicon_balance; $('#dlg-why').value = '';
        dlg.showModal();
    }
});

$('#dlg-cancel').onclick = () => dlg.close();
$('#dlg-form').onsubmit = async e => {
    e.preventDefault();
    const btn = $('#dlg-save'); btn.disabled = true;
    try {
        await rpc('admin_set_silicon', { p_user_id: $('#dlg-id').value, p_amount: Math.floor(Number($('#dlg-amt').value)), p_reason: $('#dlg-why').value });
        dlg.close(); toast('Saldo SIL diperbarui'); go('players');
    } catch (err) { toast(err.message); }
    btn.disabled = false;
};

go('home');
