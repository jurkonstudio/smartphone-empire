// FILE: src/services/cloud/CompanyNameCheck.js
// Cek apakah nama perusahaan sudah dipakai pemain lain (butuh supabase/company-name-unique.sql).
// Return: true = tersedia, false = sudah dipakai, null = tidak bisa dicek
// (offline / belum dikonfigurasi / SQL belum dijalankan) -> pemanggil tetap mengizinkan;
// index unik di server tetap jadi penjaga saat sinkronisasi.
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
