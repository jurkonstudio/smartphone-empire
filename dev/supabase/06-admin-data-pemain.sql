-- ============================================================================
-- Smartphone Empire — 06 ADMIN: DASHBOARD & DATA PEMAIN (hanya baca)
-- Jalankan SETELAH 05. Aman diulang (idempoten). Semua fungsi memeriksa is_admin().
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
        select u.id, p.public_id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at,
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

-- ---------- Detail satu pemain ----------
create or replace function public.admin_get_player(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare res jsonb;
begin
    perform public._assert_admin();
    if not exists (select 1 from auth.users where id = p_user_id) then raise exception 'user_not_found'; end if;
    select jsonb_build_object(
        'account', (select jsonb_build_object(
                'id', u.id, 'email', u.email, 'phone', u.phone, 'created_at', u.created_at,
                'last_sign_in_at', u.last_sign_in_at, 'email_confirmed_at', u.email_confirmed_at,
                'banned_until', u.banned_until,
                'provider', u.raw_app_meta_data->>'provider',
                'is_admin', exists (select 1 from public.admin_users a where a.user_id = u.id))
              from auth.users u where u.id = p_user_id),
        'profile', (select to_jsonb(p) from public.profiles p where p.id = p_user_id),
        'wallet',  (select to_jsonb(w) from public.silicon_wallets w where w.user_id = p_user_id),
        'heads',   coalesce((select jsonb_agg(to_jsonb(h) order by h.slot) from public.save_heads h where h.user_id = p_user_id), '[]'::jsonb),
        'save_bytes', (select pg_column_size(g.data) from public.game_saves g where g.user_id = p_user_id order by g.updated_at desc limit 1),
        'ledger',  coalesce((select jsonb_agg(l order by l.id desc) from (
                        select id, delta, reason, balance, created_at from public.silicon_ledger
                         where user_id = p_user_id order by id desc limit 200) l), '[]'::jsonb),
        'ledger_totals', (select jsonb_build_object(
                'earned', coalesce(sum(delta) filter (where delta > 0), 0),
                'spent',  coalesce(-sum(delta) filter (where delta < 0), 0),
                'rows',   count(*)) from public.silicon_ledger where user_id = p_user_id),
        'orders',  coalesce((select jsonb_agg(o order by o.created_at desc) from (
                        select id, package_id, amount, sil_amount, status, created_at, decided_at
                          from public.payment_orders where user_id = p_user_id
                         order by created_at desc limit 100) o), '[]'::jsonb),
        'quests',  coalesce((select jsonb_agg(q order by q.claimed_at desc) from (
                        select quest_id, claimed_at from public.silicon_quest_claims where user_id = p_user_id) q), '[]'::jsonb),
        'requests_count', (select count(*) from public.silicon_requests where user_id = p_user_id),
        'audit',   coalesce((select jsonb_agg(a order by a.id desc) from (
                        select id, admin_id, action, detail, created_at from public.admin_audit
                         where target = p_user_id::text order by id desc limit 50) a), '[]'::jsonb)
    ) into res;
    return res;
end $$;

-- ---------- Isi save game (JSON mentah) satu pemain ----------
create or replace function public.admin_get_player_save(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g record;
begin
    perform public._assert_admin();
    select slot, company_name, game_year, game_month, game_minutes, schema_version, device_id,
           client_saved_at, created_at, updated_at, data into g
      from public.game_saves where user_id = p_user_id order by updated_at desc limit 1;
    if not found then return null; end if;
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'view_save', p_user_id::text, jsonb_build_object('slot', g.slot));
    return jsonb_build_object('slot', g.slot, 'company_name', g.company_name, 'game_year', g.game_year,
        'game_month', g.game_month, 'game_minutes', g.game_minutes, 'schema_version', g.schema_version,
        'device_id', g.device_id, 'client_saved_at', g.client_saved_at, 'created_at', g.created_at,
        'updated_at', g.updated_at, 'data', g.data);
end $$;

-- ---------- Ledger SIL global (bisa difilter pemain / kata kunci alasan) ----------
create or replace function public.admin_list_ledger(p_user_id uuid default null, p_search text default null, p_limit int default 200)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.id desc) from (
        select l.id, l.user_id, u.email, p.company_name, l.delta, l.reason, l.balance, l.created_at
          from public.silicon_ledger l
          join auth.users u on u.id = l.user_id
          left join public.profiles p on p.id = l.user_id
         where (p_user_id is null or l.user_id = p_user_id)
           and (p_search is null or p_search = '' or l.reason ilike '%' || p_search || '%'
                or u.email ilike '%' || p_search || '%' or p.company_name ilike '%' || p_search || '%')
         order by l.id desc limit least(greatest(coalesce(p_limit, 200), 1), 500)) r), '[]'::jsonb);
end $$;

-- ---------- Jejak audit admin ----------
create or replace function public.admin_list_audit(p_limit int default 200) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.id desc) from (
        select a.id, a.admin_id, u.email as admin_email, a.action, a.target, a.detail, a.created_at
          from public.admin_audit a
          left join auth.users u on u.id = a.admin_id
         order by a.id desc limit least(greatest(coalesce(p_limit, 200), 1), 500)) r), '[]'::jsonb);
end $$;


do $$
declare f text;
begin
    foreach f in array array[
        'admin_dashboard_stats()', 'admin_get_all_profiles()', 'admin_get_player(uuid)',
        'admin_get_player_save(uuid)', 'admin_list_ledger(uuid, text, int)', 'admin_list_audit(int)'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
