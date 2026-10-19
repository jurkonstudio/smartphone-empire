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
        const e = new Error(error.code === '42501' ? 'Akses ditolak.' : error.code === '42883' ? 'Fungsi belum ada. Jalankan supabase/admin.sql.' : error.message);
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
