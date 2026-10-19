-- ---------- Panel admin: tampilkan & cari berdasarkan ID ----------
create or replace function public.admin_list_orders(p_status text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select o.id, u.email, p.company_name, p.public_id, o.package_id, o.amount, o.sil_amount, o.status, o.created_at, o.decided_at
          from public.payment_orders o
          join auth.users u on u.id = o.user_id
          left join public.profiles p on p.id = o.user_id
         where p_status is null or o.status = p_status
         order by o.created_at desc limit 300) r), '[]'::jsonb);
end $$;

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

do $$
declare f text;
begin
    foreach f in array array['admin_list_orders(text)', 'admin_get_all_profiles()'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
