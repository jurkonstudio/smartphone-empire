-- ============================================================================
-- Smartphone Empire — ADMIN v2 (lihat SEMUA data pemain & sistem Supabase)
-- Jalankan di Supabase SQL Editor SETELAH admin.sql. Idempotent.
-- Semua fungsi memeriksa is_admin() di server; pemain biasa mendapat 'forbidden'.
-- Menggantikan admin_dashboard_stats() & admin_get_all_profiles() dengan versi lengkap
-- (kunci lama tetap ada, jadi panel lama tidak rusak).
-- ============================================================================

-- ---------- Ringkasan dashboard ----------
create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return jsonb_build_object(
        'players',      (select count(*) from auth.users),
        'new_24h',      (select count(*) from auth.users where created_at > now() - interval '24 hours'),
        'new_7d',       (select count(*) from auth.users where created_at > now() - interval '7 days'),
        'active_24h',   (select count(*) from auth.users where last_sign_in_at > now() - interval '24 hours'),
        'active_7d',    (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
        'banned',       (select count(*) from auth.users where banned_until is not null and banned_until > now()),
        'admins',       (select count(*) from public.admin_users),
        'saves',        (select count(*) from public.save_heads),
        'sil_total',    (select coalesce(sum(balance), 0) from public.silicon_wallets),
        'sil_avg',      (select coalesce(round(avg(balance)), 0) from public.silicon_wallets),
        'wallets',      (select count(*) from public.silicon_wallets),
        'ledger_24h',   (select count(*) from public.silicon_ledger where created_at > now() - interval '24 hours'),
        'pending',      (select count(*) from public.payment_orders where status = 'pending'),
        'orders_ok',    (select count(*) from public.payment_orders where status = 'approved'),
        'orders_rej',   (select count(*) from public.payment_orders where status = 'rejected'),
        'revenue',      (select coalesce(sum(amount), 0) from public.payment_orders where status = 'approved'),
        'revenue_30d',  (select coalesce(sum(amount), 0) from public.payment_orders
                          where status = 'approved' and decided_at > now() - interval '30 days'),
        'game_cash_total', (select coalesce(sum(stat_cash), 0) from public.profiles),
        'game_revenue_total', (select coalesce(sum(stat_revenue), 0) from public.profiles),
        'game_sold_total', (select coalesce(sum(stat_sold), 0) from public.profiles),
        'signups_14d',  (select coalesce(jsonb_agg(c order by d), '[]'::jsonb) from (
                           select g::date as d, (select count(*) from auth.users where created_at::date = g::date) as c
                             from generate_series(current_date - 13, current_date, interval '1 day') g) s),
        'revenue_14d',  (select coalesce(jsonb_agg(c order by d), '[]'::jsonb) from (
                           select g::date as d, (select coalesce(sum(amount), 0) from public.payment_orders
                                                  where status = 'approved' and decided_at::date = g::date) as c
                             from generate_series(current_date - 13, current_date, interval '1 day') g) s),
        'top_players',  (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
                           select p.id, coalesce(p.company_name, p.player_name, 'Tanpa nama') as name,
                                  p.stat_revenue, p.stat_sold, p.stat_reputation, p.stat_share
                             from public.profiles p where p.company_name is not null
                            order by p.stat_revenue desc limit 5) t));
end $$;

-- ---------- Daftar semua pemain (akun + profil + statistik + dompet + save) ----------
create or replace function public.admin_get_all_profiles() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at,
               (u.banned_until is not null and u.banned_until > now()) as banned,
               p.player_name, p.display_name, p.company_name, p.founded_year, p.founded_month, p.name_changes,
               p.avatar_path, p.stat_revenue, p.stat_sold, p.stat_reputation, p.stat_share, p.stat_cash,
               p.stat_products, p.stats_updated_at,
               coalesce(w.balance, 0) as silicon_balance, w.streak, w.last_daily,
               h.game_year, h.game_month, h.game_minutes, h.updated_at as save_updated_at, h.device_id,
               pg_column_size(g.data) as save_bytes,
               exists (select 1 from public.admin_users a where a.user_id = u.id) as is_admin,
               (select count(*) from public.payment_orders o where o.user_id = u.id) as orders_count,
               (select coalesce(sum(o.amount), 0) from public.payment_orders o
                 where o.user_id = u.id and o.status = 'approved') as spent_idr
          from auth.users u
          left join public.profiles p on p.id = u.id
          left join public.silicon_wallets w on w.user_id = u.id
          left join lateral (select * from public.save_heads s where s.user_id = u.id
                              order by s.updated_at desc limit 1) h on true
          left join lateral (select data from public.game_saves s where s.user_id = u.id
                              order by s.updated_at desc limit 1) g on true
         order by u.created_at desc limit 2000) r), '[]'::jsonb);
end $$;

