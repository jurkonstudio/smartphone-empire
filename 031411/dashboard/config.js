// Satu-satunya file yang perlu disesuaikan dengan game + Supabase kamu.
export const CFG = {
  base: '/031411',
  adminCheckRpc: 'is_admin',                        // fungsi SQL di Supabase; admin diverifikasi server, bukan email di kode
  supabaseConfig: '/src/services/cloud/supabase.config.js', // exports: SUPABASE_URL, SUPABASE_KEY, SUPABASE_LIB_URLS
  authStorageKey: 'se-admin-auth',
  idleMinutes: 15,    // keluar otomatis bila tidak ada aktivitas (0 = nonaktif)
  keepLogin: false,   // false: sesi hilang saat tab/browser ditutup
  pageSize: 50,
  rpc: {
    profiles: 'admin_get_all_profiles',
    pendingPayments: 'get_pending_payments',
    approvePayment: 'admin_approve_payment',   // args: { p_order_id }
    setSilicon: 'admin_set_silicon',           // args: { p_user_id, p_amount }
    sendMessage: 'admin_send_message',         // args: { p_user_id, p_title, p_body }
    broadcast: 'admin_broadcast_message',      // args: { p_title, p_body }
    listMessages: 'admin_list_messages',       // args: { p_limit }
    listReports: 'admin_list_reports'          // args: { p_limit }  (laporan DM antar pemain)
  },
  tables: { wallets: 'silicon_wallets', ledger: 'silicon_ledger' },
  quickTables: ['profiles', 'silicon_wallets', 'silicon_ledger'],
  playerCols: ['public_id', 'display_name', 'company_name', 'email', 'silicon', 'silicon_balance', 'stat_revenue', 'created_at'],
  paymentCols: ['order_id', 'id', 'user_id', 'package_id', 'amount', 'sil_amount', 'status', 'created_at'],
  ledgerCols: ['created_at', 'delta', 'reason', 'balance']
};
