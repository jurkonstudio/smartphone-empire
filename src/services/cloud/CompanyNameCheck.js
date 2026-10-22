// FILE: src/services/cloud/CompanyNameCheck.js
// Cek apakah nama perusahaan sudah dipakai pemain lain.
// RPC company_name_available dibuat di supabase/03-profil-leaderboard.sql.
// Penjaga sebenarnya di server: indeks unik profiles (03) dan trigger game_saves (14).
// Return: true = tersedia, false = sudah dipakai, null = tidak bisa dicek
// (offline / belum dikonfigurasi / SQL belum dijalankan) -> pemanggil tetap mengizinkan;
// penjaga di server tetap berlaku saat sinkronisasi.
import { SupabaseAdapter } from './SupabaseAdapter.js';
import { SUPABASE_KEY } from './supabase.config.js';

export async function checkCompanyNameAvailable(name, timeoutMs) {
    if (!SUPABASE_KEY || !name) return null;
    try {
        var r = await Promise.race([
            SupabaseAdapter.rpcCompanyNameAvailable(name),
            new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, timeoutMs || 4000); })
        ]);
        return r === true ? true : (r === false ? false : null);
    } catch (e) {
        console.warn('[CompanyNameCheck] tidak bisa cek:', e && e.message);
        return null;
    }
}
