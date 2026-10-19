// FILE: src/services/cloud/SupabaseAdapter.js
// v2028.28 — [LEADERBOARD] Menambahkan created_at di listProfiles untuk Umur Akun Real-Life.
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_LIB_URLS, CLOUD } from './supabase.config.js';

var _client = null;
var _loading = null;
var _injected = null;

function classify(err) {
    if (!err) return 'unknown';
    if (err.code === 'LIB_LOAD_FAILED') return 'lib';
    var msg = String(err.message || '').toLowerCase();
    var code = String(err.code || err.error_code || '').toLowerCase();
    var status = err.status || err.statusCode || 0;

    if (msg.indexOf('invalid login credentials') >= 0 || code === 'invalid_credentials') return 'invalid_credentials';
    if (msg.indexOf('already registered') >= 0 || code === 'user_already_exists' || code === 'email_exists') return 'email_exists';
    if (msg.indexOf('email not confirmed') >= 0 || code === 'email_not_confirmed') return 'email_not_confirmed';
    if (msg.indexOf('password should be at least') >= 0 || code === 'weak_password') return 'weak_password';
    if (msg.indexOf('rate limit') >= 0 || code.indexOf('rate_limit') >= 0 || status === 429) return 'rate_limit';
    if (msg.indexOf('failed to fetch') >= 0 || msg.indexOf('networkerror') >= 0 ||
        msg.indexOf('load failed') >= 0 || msg.indexOf('network request failed') >= 0) return 'network';
    if (code === '42p01' || code === 'pgrst205' || msg.indexOf('does not exist') >= 0 ||
        msg.indexOf('could not find the table') >= 0) return 'db_setup';
    if (code === '42501' || status === 401 || status === 403 || msg.indexOf('row-level security') >= 0) return 'permission';
    if (err.code === 'no_save') return 'no_save';
    return 'unknown';
}

function mk(err, forcedCode) {
    var e = new Error((err && err.message) || 'error');
    e.code = forcedCode || classify(err);
    e.raw = err || null;
    return e;
}

async function loadLib() {
    for (var i = 0; i < SUPABASE_LIB_URLS.length; i++) {
        try {
            var m = await import(/* webpackIgnore: true */ SUPABASE_LIB_URLS[i]);
            if (m && typeof m.createClient === 'function') return m.createClient;
        } catch (e) { }
    }
    var err = new Error('Gagal memuat library Supabase.');
    err.code = 'LIB_LOAD_FAILED';
    throw err;
}

async function getClient() {
    if (_client) return _client;
    if (_loading) return _loading;
    _loading = (async function () {
        try {
            var createClient = _injected || await loadLib();
            _client = createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    storageKey: CLOUD.authStorageKey
                },
                realtime: { params: { eventsPerSecond: 2 } }
            });
            return _client;
        } catch (e) {
            throw mk(e);
        } finally {
            _loading = null;
        }
    })();
    return _loading;
}

function userOf(u) { return u ? { userId: u.id, email: u.email || '' } : null; }

export const SupabaseAdapter = {
    _inject: function (createClientFn) { _injected = createClientFn; _client = null; },

    hasStoredSession: function () {
        try {
            if (localStorage.getItem(CLOUD.authStorageKey)) return true;
            var h = (typeof location !== 'undefined') ? (location.hash || '') + (location.search || '') : '';
            return h.indexOf('access_token') >= 0 || h.indexOf('type=recovery') >= 0 || h.indexOf('code=') >= 0;
        } catch (e) { return false; }
    },

    init: async function () {
        var c = await getClient();
        var res = await c.auth.getSession();
        if (res.error) throw mk(res.error);
        return userOf(res.data && res.data.session && res.data.session.user);
    },

    onAuthChange: function (cb) {
        var self = this;
        getClient().then(function (c) {
            var sub = c.auth.onAuthStateChange(function (event, session) {
                cb(event, userOf(session && session.user));
            });
            self._authSub = sub && sub.data && sub.data.subscription;
        }).catch(function () {});
    },

    signIn: async function (email, password) {
        var c = await getClient();
        var res = await c.auth.signInWithPassword({ email: email, password: password });
        if (res.error) throw mk(res.error);
        return userOf(res.data.user);
    },

    signUp: async function (email, password) {
        var c = await getClient();
        var res = await c.auth.signUp({ email: email, password: password, options: { emailRedirectTo: location.origin } });
        if (res.error) throw mk(res.error);
        var u = res.data.user;
        if (u && Array.isArray(u.identities) && u.identities.length === 0) throw mk(null, 'email_exists');
        var out = userOf(u) || {};
        out.needsConfirm = !(res.data.session);
        return out;
    },

    signOut: async function () {
        var c = await getClient();
        var res = await c.auth.signOut();
        if (res.error) throw mk(res.error);
    },

    resetPassword: async function (email) {
        var c = await getClient();
        var res = await c.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
        if (res.error) throw mk(res.error);
    },

    updatePassword: async function (password) {
        var c = await getClient();
        var res = await c.auth.updateUser({ password: password });
        if (res.error) throw mk(res.error);
    },

    uploadSave: async function (userId, payload) {
        var c = await getClient();
        var meta = payload.meta || {};
        var row = {
            user_id: userId,
            slot: payload.slot,
            company_name: meta.companyName || '',
            game_year: meta.gameYear == null ? null : meta.gameYear,
            game_month: meta.gameMonth == null ? null : meta.gameMonth,
            game_minutes: Math.max(0, Math.floor(meta.gameMinutes || 0)),
            schema_version: payload.version,
            device_id: payload.deviceId || null,
            client_saved_at: payload.savedAt || Date.now(),
            data: payload.data
        };
        var res = await c.from(CLOUD.tables.saves).upsert(row, { onConflict: 'user_id,slot' }).select('updated_at').single();
        if (res.error) throw mk(res.error);
        return { uploadedAt: res.data.updated_at };
    },

    fetchI18nStrings: async function (lang) {
        var c = await getClient();
        var res = await c.from('i18n_strings').select('key,value').eq('lang', lang);
        if (res.error) throw mk(res.error);
        return res.data || [];
    },

    saveI18nString: async function (lang, key, value) {
        var c = await getClient();
        var session = await c.auth.getSession();
        var userId = session && session.data && session.data.session && session.data.session.user
            ? session.data.session.user.id : null;
        var res = await c.from('i18n_strings').upsert({
            key: key, lang: lang, value: value, updated_by: userId, updated_at: new Date().toISOString()
        }, { onConflict: 'key,lang' });
        if (res.error) throw mk(res.error);
        return true;
    },

    deleteI18nString: async function (lang, key) {
        var c = await getClient();
        var res = await c.from('i18n_strings').delete().eq('key', key).eq('lang', lang);
        if (res.error) throw mk(res.error);
        return true;
    },

    downloadSave: async function (userId, slot) {
        var c = await getClient();
        var res = await c.from(CLOUD.tables.saves)
            .select('data, schema_version, client_saved_at, updated_at, company_name, game_minutes')
            .eq('user_id', userId).eq('slot', slot).maybeSingle();
        if (res.error) throw mk(res.error);
        if (!res.data) { var e = new Error('Belum ada save di slot ini.'); e.code = 'no_save'; throw e; }
        return { data: res.data.data, version: res.data.schema_version, savedAt: res.data.client_saved_at, updatedAt: res.data.updated_at };
    },

    listSaves: async function (userId) {
        var c = await getClient();
        var res = await c.from(CLOUD.tables.heads).select('*').eq('user_id', userId).order('slot', { ascending: true });
        if (res.error) throw mk(res.error);
        return res.data || [];
    },

    subscribeSaves: async function (userId, cb) {
        var c = await getClient();
        var ch = c.channel('heads:' + userId).on('postgres_changes',
            { event: '*', schema: 'public', table: CLOUD.tables.heads, filter: 'user_id=eq.' + userId },
            function (p) { if (p && p.new && p.new.slot != null) cb(p.new); }
        ).subscribe();
        return function () { try { c.removeChannel(ch); } catch (e) {} };
    },

    // Dompet SIL: server memberi tahu saat saldo berubah (admin, top-up, belanja di perangkat lain).
    subscribeWallet: async function (userId, cb) {
        var c = await getClient();
        var ch = c.channel('wallet:' + userId).on('postgres_changes',
            { event: '*', schema: 'public', table: 'silicon_wallets', filter: 'user_id=eq.' + userId },
            function () { cb(); }
        ).subscribe();
        return function () { try { c.removeChannel(ch); } catch (e) {} };
    },

    subscribePresence: async function (userId, meta, onSync) {
        var c = await getClient();
        var ch = c.channel('online-users', {
            config: { presence: { key: userId } }
        });

        ch.on('presence', { event: 'sync' }, function () {
            try {
                var state = ch.presenceState() || {};
                var ids = Object.keys(state);
                onSync(ids);
            } catch (e) { onSync([]); }
        });

        ch.subscribe(function (status) {
            if (status === 'SUBSCRIBED') {
                try { ch.track(meta || { online_at: new Date().toISOString() }); } catch (e) {}
            }
        });

        return function () {
            try { ch.untrack(); } catch (e) {}
            try { c.removeChannel(ch); } catch (e) {}
        };
    },

    getProfile: async function (userId) {
        var c = await getClient();
        var res = await c.from(CLOUD.tables.profiles).select('*').eq('id', userId).maybeSingle();
        if (res.error) throw mk(res.error);
        return res.data;
    },

    updateProfile: async function (userId, fields) {
        var c = await getClient();
        var res = await c.from(CLOUD.tables.profiles).update(fields).eq('id', userId).select().single();
        if (res.error) throw mk(res.error);
        return res.data;
    },

    listProfiles: async function (orderBy) {
        var cols = { revenue: 'stat_revenue', sold: 'stat_sold', reputation: 'stat_reputation', share: 'stat_share', recent: 'updated_at' };
        var col = cols[orderBy] || cols.revenue;
        var c = await getClient();
        var res = await c.from('public_profiles')
            // TAMBAHAN: created_at
            .select('id, display_name, avatar_path, company_name, founded_year, founded_month, game_minutes, created_at, updated_at, stat_revenue, stat_sold, stat_reputation, stat_share')
            .order(col, { ascending: false, nullsFirst: false })
            .limit(100);
        if (res.error) throw mk(res.error);
        return res.data || [];
    },

    getProfileById: async function (id) {
        var c = await getClient();
        var res = await c.from('public_profiles')
            .select('id, display_name, avatar_path, company_name, founded_year, founded_month, game_minutes, updated_at, created_at, stat_revenue, stat_sold, stat_reputation, stat_share')
            .eq('id', id)
            .maybeSingle();
        if (res.error) throw mk(res.error);
        return res.data;
    },

    uploadPlayerAsset: async function (userId, name, fileOrBlob, contentType) {
        var c = await getClient();
        var path = userId + '/' + String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
        var res = await c.storage.from(CLOUD.buckets.player).upload(path, fileOrBlob, {
            upsert: true, contentType: contentType || (fileOrBlob && fileOrBlob.type) || 'application/octet-stream'
        });
        if (res.error) throw mk(res.error);
        return { path: path };
    },

    getPlayerAssetUrl: async function (path, expiresSec) {
        var c = await getClient();
        var res = await c.storage.from(CLOUD.buckets.player).createSignedUrl(path, expiresSec || 3600);
        if (res.error) throw mk(res.error);
        return res.data.signedUrl;
    },

    getPlayerAssetUrls: async function (paths, expiresSec) {
        var c = await getClient();
        var res = await c.storage.from(CLOUD.buckets.player).createSignedUrls(paths, expiresSec || 3600);
        if (res.error) throw mk(res.error);
        return res.data || [];
    },

    rpcCompanyNameAvailable: async function (name) {
        var c = await getClient();
        var res = await c.rpc('company_name_available', { p_name: name });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    rpcSyncProfile: async function (fields) {
        var c = await getClient();
        var res = await c.rpc('sync_player_profile', fields);
        if (res.error) throw mk(res.error);
        return true;
    },

    getGameAssetUrl: async function (path) {
        var c = await getClient();
        return c.storage.from(CLOUD.buckets.game).getPublicUrl(path).data.publicUrl;
    },

    rpcGetSilicon: async function () {
        var c = await getClient();
        var res = await c.rpc('get_silicon');
        if (res.error) throw mk(res.error);
        return res.data == null ? 0 : res.data;
    },

    rpcClaimDaily: async function () {
        var c = await getClient();
        var res = await c.rpc('claim_daily_silicon');
        if (res.error) throw mk(res.error);
        return res.data == null ? 0 : res.data;
    },

    rpcSpendSilicon: async function (amount) {
        var c = await getClient();
        var res = await c.rpc('spend_silicon', { p_amount: Math.floor(amount) });
        if (res.error) throw mk(res.error);
        return res.data == null ? 0 : res.data;
    },

    rpcCreatePaymentOrder: async function (orderId, packageId, priceIdr, silAmount) {
        var c = await getClient();
        var res = await c.rpc('create_payment_order', {
            p_order_id: orderId,
            p_package_id: packageId,
            p_amount: priceIdr,
            p_sil_amount: silAmount
        });
        if (res.error) throw mk(res.error);
        return { ok: true, data: res.data };
    },

    rpcCheckPaymentStatus: async function (orderId) {
        var c = await getClient();
        var res = await c.rpc('check_payment_status', {
            p_order_id: orderId
        });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    rpcGetPendingPayments: async function () {
        var c = await getClient();
        var res = await c.rpc('get_pending_payments');
        if (res.error) throw mk(res.error);
        return res.data;
    },

    rpcAdminApprove: async function (orderId) {
        var c = await getClient();
        var res = await c.rpc('admin_approve_payment', { p_order_id: orderId });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    // [ADMIN PANEL - MANAJEMEN PEMAIN]
    rpcAdminGetProfiles: async function () {
        var c = await getClient();
        var res = await c.rpc('admin_get_all_profiles');
        if (res.error) throw mk(res.error);
        return res.data;
    },

    rpcAdminSetSilicon: async function (userId, amount) {
        var c = await getClient();
        var res = await c.rpc('admin_set_silicon', { p_user_id: userId, p_amount: amount });
        if (res.error) throw mk(res.error);
        return res.data;
    },
};
