// FILE: src/services/cloud/supabase.config.js
// v2027.37a — Konfigurasi Supabase.
//
// AMAN di sisi klien: URL proyek + kunci *publishable* memang dirancang untuk
// ditaruh di kode game. Keamanan data dijaga oleh Row Level Security (RLS)
// di supabase/schema.sql — bukan oleh kerahasiaan kunci ini.
//
// JANGAN PERNAH menaruh kunci "secret" / "service_role" di file ini.
export const SUPABASE_URL = 'https://xjhnngxcpnignjatmtpa.supabase.co';

// Ditempel apa adanya dari Dashboard; spasi nyasar (salah salin) dibuang otomatis.
const RAW_KEY = 'sb_publishable_kBiGtSn3LBFVw0jCOFzg5w_h5g Q3orp';
export const SUPABASE_KEY = RAW_KEY.replace(/\s+/g, '');

// Library dimuat hanya saat dibutuhkan (login / sesi tersimpan), bukan saat boot,
// jadi game tetap cepat & bisa offline. Versi dipin; urutan = prioritas CDN.
export const SUPABASE_LIB_URLS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm',
    'https://esm.sh/@supabase/supabase-js@2.49.4'
];

export const CLOUD = {
    slots: 3,
    defaultSlot: 1,
    maxSaveBytes: 4 * 1024 * 1024,       // batas unggah (DB menjaga 5 MB)
    autoUploadMinMs: 120000,             // jeda minimal antar autosync cloud
    tables:  { saves: 'game_saves', heads: 'save_heads', profiles: 'profiles' },
    buckets: { player: 'player-assets', game: 'game-assets' },
    authStorageKey: 'smartphone-empire:supabase-auth'
};

export function isCloudConfigured() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) && SUPABASE_KEY.length >= 20;
}
