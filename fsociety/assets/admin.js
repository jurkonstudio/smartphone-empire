// Klien Supabase bersama untuk /fsociety. Memakai URL & key yang sama dengan game.
import { SUPABASE_URL, SUPABASE_KEY } from '../../src/services/cloud/supabase.config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';

// Sesi admin hanya di sessionStorage (hilang saat tab ditutup) dan terpisah dari sesi game.
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
            storageKey: 'se-admin-auth', storage: window.sessionStorage }
});

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const num = n => Number(n || 0).toLocaleString('id-ID');
export const idr = n => 'Rp ' + num(n);
export const when = d => d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export async function rpc(fn, args) {
    const { data, error } = await sb.rpc(fn, args);
    if (error) {
        const FRIENDLY = { cannot_ban_self: 'Tidak bisa memblokir akun sendiri.', cannot_ban_admin: 'Tidak bisa memblokir sesama admin.',
            user_not_found: 'Pemain tidak ditemukan.', save_not_found: 'Pemain ini belum punya save cloud.',
            insufficient_silicon: 'Saldo SIL tidak cukup untuk pengurangan ini.', invalid_amount: 'Jumlah tidak valid.' };
        const e = new Error(error.code === '42501' ? 'Akses ditolak.'
            : error.code === '42883' || error.code === 'PGRST202' ? 'Fungsi belum ada. Jalankan supabase/admin.sql lalu supabase/admin-v2.sql.'
            : error.code === '23505' ? 'Nama perusahaan sudah dipakai pemain lain.'
            : FRIENDLY[error.message] || error.message);
        e.denied = error.code === '42501';
        throw e;
    }
    return data;
}

// Kembalikan user jika sesi valid DAN terdaftar di admin_users (dicek server).
export async function checkAdmin() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    try { return (await rpc('is_admin')) === true ? session.user : null; } catch { return null; }
}

let _t;
export function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(_t); _t = setTimeout(() => el.classList.remove('show'), 2600);
}

export const ago = d => { if (!d) return '-'; const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu'; if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 86400 * 30) return Math.floor(s / 86400) + ' hari lalu'; return when(d); };
export const bytes = n => { n = Number(n || 0); return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1073741824).toFixed(2) + ' GB'; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const gameDate = (y, m) => y ? (MON[(m || 1) - 1] || '?') + ' ' + y : '-';
export function download(name, text, type = 'application/json') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
