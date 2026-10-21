// FILE: src/services/cloud/supabase.config.js
// v2027.39a — Konfigurasi Supabase (project baru). Sesi auth dipisah per project.
export const SUPABASE_URL = 'https://iyuleatpewampdjeuzrb.supabase.co';

const RAW_KEY = 'sb_publishable_HZUb3YP1Ztz57cV6EGHBPQ_obiCJ3L7';
export const SUPABASE_KEY = RAW_KEY.replace(/\s+/g, '');

export const SUPABASE_LIB_URLS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm',
    'https://esm.sh/@supabase/supabase-js@2.49.4'
];

// Ref project dari URL (mis. iyuleatpewampdjeuzrb). Dipakai untuk memisahkan sesi per project.
function _projectRef() {
    var m = /^https:\/\/([a-z0-9-]+)\.supabase\.co/i.exec(SUPABASE_URL);
    return m ? m[1] : 'default';
}

export const CLOUD = {
    slots: 1,
    defaultSlot: 1,
    maxSaveBytes: 4 * 1024 * 1024,
    autoUploadMinMs: 120000,
    tables:  { saves: 'game_saves', heads: 'save_heads', profiles: 'profiles' },
    buckets: { player: 'player-assets', game: 'game-assets' },
    authStorageKey: 'smartphone-empire:supabase-auth:' + _projectRef(),
    legacyAuthStorageKey: 'smartphone-empire:supabase-auth'
};

export function isCloudConfigured() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) && SUPABASE_KEY.length >= 20;
}
