// FILE: src/services/cloud/SupabaseAdapter.js
// v2028.44 — [TRANSFER] Menambahkan rpcGetPlayerById & rpcTransferSilicon.
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_LIB_URLS, CLOUD } from './supabase.config.js';

var _client = null;
var _loading = null;
var _injected = null;
var _pubIdOk = true; 
var PUB_COLS = 'id, display_name, avatar_path, company_name, founded_year, founded_month, game_minutes, created_at, updated_at, stat_revenue, stat_sold, stat_reputation, stat_share, stat_level, stat_xp, stat_credibility, stat_score';
function _pubCols() { return PUB_COLS + (_pubIdOk ? ', public_id' : ''); }
function _isPubIdMissing(err) { return !!err && String(err.message || '').toLowerCase().indexOf('public_id') >= 0; }
var _idemOk = true;
var _inboxExt = true;
var _reasonOk = true;
var _rewardOk = true;

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

    // ---------- Inbox (pesan admin + notifikasi SIL) ----------
    inboxList: async function (limit, sinceId) {
        var c = await getClient();
        var cols = 'id, kind, title, body, amount, created_at, read_at' + (_inboxExt ? ', sender_name, sender_public_id' : '') + (_rewardOk ? ', reward_cash, reward_kind, reward_claimed_at' : '');
        var q = c.from('inbox_messages').select(cols);
        if (sinceId) q = q.gt('id', sinceId);          // polling hemat: hanya pesan yang lebih baru
        var res = await q.order('id', { ascending: false }).limit(limit || 60);
        if (res.error && _rewardOk && String(res.error.message || '').indexOf('reward_') >= 0) {
            _rewardOk = false;                         // SQL 12 belum dijalankan: tanpa kolom hadiah
            return this.inboxList(limit, sinceId);
        }
        if (res.error && _inboxExt && String(res.error.message || '').indexOf('sender_') >= 0) {
            _inboxExt = false;                         // SQL 10 belum dijalankan: pakai kolom dasar
            return this.inboxList(limit, sinceId);
        }
        if (res.error) throw mk(res.error);
        return res.data || [];
    },
    inboxMarkRead: async function (ids) {
        var c = await getClient();
        var res = await c.rpc('inbox_mark_read', { p_ids: ids && ids.length ? ids : null });
        if (res.error) throw mk(res.error);
        return res.data || 0;
    },
    inboxDelete: async function (ids) {
        var c = await getClient();
        var res = await c.rpc('inbox_delete', { p_ids: ids && ids.length ? ids : null });
        if (res.error) throw mk(res.error);
        return res.data || 0;
    },
    // ---------- Pesan antar pemain ----------
    rpcSendPlayerMessage: async function (publicId, body) {
        var c = await getClient();
        var res = await c.rpc('send_player_message', { p_receiver_public_id: publicId, p_body: body });
        if (res.error) throw mk(res.error);
        return res.data;
    },
    rpcInboxBlock: async function (publicId) {
        var c = await getClient();
        var res = await c.rpc('inbox_block', { p_public_id: publicId });
        if (res.error) throw mk(res.error);
        return res.data;
    },
    rpcInboxUnblock: async function (publicId) {
        var c = await getClient();
        var res = await c.rpc('inbox_unblock', { p_public_id: publicId });
        if (res.error) throw mk(res.error);
        return res.data;
    },
    rpcInboxBlocks: async function () {
        var c = await getClient();
        var res = await c.rpc('inbox_list_blocks');
        if (res.error) throw mk(res.error);
        return res.data || [];
    },
    rpcInboxReport: async function (messageId, reason) {
        var c = await getClient();
        var res = await c.rpc('inbox_report', { p_message_id: messageId, p_reason: reason || null });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    subscribeInbox: async function (userId, cb) {
        var c = await getClient();
        var ch = c.channel('inbox:' + userId).on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'inbox_messages', filter: 'user_id=eq.' + userId },
            function (p) { if (p && p.new) cb(p.new); }
        ).subscribe();
        return function () { try { c.removeChannel(ch); } catch (e) {} };
    },

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
            try { var state = ch.presenceState() || {}; var ids = Object.keys(state); onSync(ids); } 
            catch (e) { onSync([]); }
        });
        ch.subscribe(function (status) {
            if (status === 'SUBSCRIBED') { try { ch.track(meta || { online_at: new Date().toISOString() }); } catch (e) {} }
        });
        return function () { try { ch.untrack(); } catch (e) {} try { c.removeChannel(ch); } catch (e) {} };
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
        var cols = { revenue: 'stat_revenue', sold: 'stat_sold', reputation: 'stat_reputation', share: 'stat_share', recent: 'updated_at',
                     score: 'stat_score', level: 'stat_xp', credibility: 'stat_credibility' };   // level diurutkan lewat XP
        var col = cols[orderBy] || cols.revenue;
        var c = await getClient();
        var res = await c.from('public_profiles').select(_pubCols())
            .order(col, { ascending: false, nullsFirst: false }).limit(100);
        if (res.error && _pubIdOk && _isPubIdMissing(res.error)) {
            _pubIdOk = false;
            res = await c.from('public_profiles').select(_pubCols())
                .order(col, { ascending: false, nullsFirst: false }).limit(100);
        }
        if (res.error) throw mk(res.error);
        return res.data || [];
    },

    getProfileById: async function (id) {
        var c = await getClient();
        var res = await c.from('public_profiles').select(_pubCols()).eq('id', id).maybeSingle();
        if (res.error && _pubIdOk && _isPubIdMissing(res.error)) {
            _pubIdOk = false;
            res = await c.from('public_profiles').select(_pubCols()).eq('id', id).maybeSingle();
        }
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
        // Jangan mengartikan respons kosong/tidak valid sebagai saldo 0: nilai itu dapat
        // menimpa saldo lokal yang sah saat sinkronisasi. Saldo nol yang sah tetap diterima.
        if (res.data == null || res.data === '') {
            var err = new Error('RPC get_silicon tidak mengembalikan saldo.');
            err.code = 'INVALID_SILICON_BALANCE';
            throw err;
        }
        var balance = Number(res.data);
        if (!Number.isFinite(balance) || balance < 0 || Math.floor(balance) !== balance) {
            var invalid = new Error('RPC get_silicon mengembalikan saldo tidak valid.');
            invalid.code = 'INVALID_SILICON_BALANCE';
            throw invalid;
        }
        return balance;
    },

    // [LEVEL/HADIAH] Klaim hadiah di Pesan. Aman di-retry: token sama = nominal sama, tidak dikredit dua kali di server.
    rpcClaimInboxReward: async function (messageId, token) {
        var c = await getClient();
        var res = await c.rpc('claim_inbox_reward', { p_message_id: messageId, p_token: String(token).slice(0, 64) });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    // [LEVEL] Peringkat pemain sendiri (tidak dibatasi 100 teratas).
    rpcLeaderboardMyRank: async function (sort) {
        var c = await getClient();
        var res = await c.rpc('leaderboard_my_rank', { p_sort: sort || 'score' });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    rpcGetMyPublicId: async function () {
        var c = await getClient();
        var res = await c.rpc('get_my_public_id');
        if (res.error) throw mk(res.error);
        return res.data == null ? null : res.data;
    },

    // [NEW] Cek detail pemain berdasarkan ID sebelum transfer
    rpcGetPlayerById: async function (publicId) {
        var c = await getClient();
        var res = await c.rpc('get_player_by_id', { p_public_id: publicId });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    // [NEW] Eksekusi transfer SIL
    rpcTransferSilicon: async function (receiverId, amount) {
        var c = await getClient();
        var res = await c.rpc('transfer_silicon', { 
            p_receiver_id: receiverId, 
            p_amount: Math.floor(amount) 
        });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    rpcClaimDaily: async function () {
        var c = await getClient();
        var res = await c.rpc('claim_daily_silicon');
        if (res.error) throw mk(res.error);
        return res.data == null ? 0 : res.data;
    },

    rpcSpendSilicon: async function (amount, requestId, reason) {
        var c = await getClient();
        var missing = /could not find the function|schema cache/i;
        var args = { p_amount: Math.floor(amount) };
        if (requestId && _idemOk) args.p_request_id = String(requestId).slice(0, 64);
        if (reason && _reasonOk && args.p_request_id) args.p_reason = String(reason).slice(0, 80);
        var res = await c.rpc('spend_silicon', args);
        // Kompatibel mundur: SQL lama (tanpa p_reason / tanpa p_request_id) tetap jalan.
        if (res.error && args.p_reason !== undefined && missing.test(String(res.error.message || ''))) {
            _reasonOk = false;
            delete args.p_reason;
            res = await c.rpc('spend_silicon', args);
        }
        if (res.error && args.p_request_id && missing.test(String(res.error.message || ''))) {
            _idemOk = false;
            res = await c.rpc('spend_silicon', { p_amount: Math.floor(amount) });
        }
        if (res.error) throw mk(res.error);
        return res.data == null ? 0 : res.data;
    },

    // [EXCHANGE] Tukar SIL -> uang. Server menentukan harga SIL & jumlah uang dari ID paket + tahun game.
    // Hasil: { ok, balance, sil, cash }. request_id sama = tidak memotong dua kali.
    rpcExchangeSilicon: async function (pkg, year, requestId) {
        var c = await getClient();
        var res = await c.rpc('exchange_silicon', {
            p_package: String(pkg),
            p_year: Math.floor(year),
            p_request_id: String(requestId).slice(0, 64)
        });
        if (res.error) throw mk(res.error);
        return res.data;
    },

    // [AUDIT] Kembalikan potongan SIL (aksi gagal setelah bayar). Server hanya mengembalikan SEKALI
    // dan hanya untuk potongan milik akun ini (lihat supabase/21-silicon-audit-fix.sql).
    rpcRefundSilicon: async function (requestId) {
        var c = await getClient();
        var res = await c.rpc('refund_silicon', { p_request_id: String(requestId).slice(0, 64) });
        if (res.error) throw mk(res.error);
        return res.data == null ? 0 : res.data;
    },

    rpcClaimQuest: async function (questId) {
        var c = await getClient();
        var res = await c.rpc('claim_quest_silicon', { p_quest_id: String(questId) });
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
