-- ---------- Sisi admin ----------
create or replace function public.admin_list_orders(p_status text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select o.id, u.email, p.company_name, o.package_id, o.amount, o.sil_amount, o.status, o.created_at, o.decided_at
          from public.payment_orders o
          join auth.users u on u.id = o.user_id
          left join public.profiles p on p.id = o.user_id
         where p_status is null or o.status = p_status
         order by o.created_at desc limit 300) r), '[]'::jsonb);
end $$;

-- Nama lama yang dipanggil game (AdminPanel.js).
create or replace function public.get_pending_payments() returns jsonb
language sql stable security definer set search_path = public as $$
    select public.admin_list_orders('pending');
$$;

create or replace function public._decide_order(p_order_id text, p_to text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.payment_orders;
begin
    perform public._assert_admin();
    select * into o from public.payment_orders where id = p_order_id for update;
    if not found then raise exception 'order_not_found'; end if;
    if o.status <> 'pending' then raise exception 'order_not_pending'; end if;
    if p_to = 'approved' then
        perform public.add_silicon(o.user_id, o.sil_amount, 'topup:' || o.package_id);
    end if;
    update public.payment_orders set status = p_to, decided_at = now(), decided_by = auth.uid() where id = p_order_id;
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'order_' || p_to, p_order_id, jsonb_build_object('user', o.user_id, 'sil', o.sil_amount, 'amount', o.amount));
    return jsonb_build_object('ok', true, 'status', p_to);
end $$;
revoke all on function public._decide_order(text, text) from public, anon, authenticated;

create or replace function public.admin_approve_payment(p_order_id text) returns jsonb
language sql security definer set search_path = public as $$ select public._decide_order(p_order_id, 'approved'); $$;
create or replace function public.admin_reject_payment(p_order_id text) returns jsonb
language sql security definer set search_path = public as $$ select public._decide_order(p_order_id, 'rejected'); $$;

create or replace function public.admin_get_all_profiles() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select u.id, u.email, p.player_name, p.company_name, coalesce(w.balance, 0) as silicon_balance,
               p.stat_revenue, p.stat_sold, u.created_at
          from auth.users u
          left join public.profiles p on p.id = u.id
          left join public.silicon_wallets w on w.user_id = u.id
         order by u.created_at desc limit 1000) r), '[]'::jsonb);
end $$;

create or replace function public.admin_set_silicon(p_user_id uuid, p_amount bigint, p_reason text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; old bigint;
begin
    perform public._assert_admin();
    if p_amount is null or p_amount < 0 or p_amount > 10000000 then raise exception 'invalid_amount'; end if;
    w := public._wallet(p_user_id); old := w.balance;
    update public.silicon_wallets set balance = p_amount, updated_at = now() where user_id = p_user_id returning * into w;
    insert into public.silicon_ledger (user_id, delta, reason, balance)
    values (p_user_id, p_amount - old, 'admin:' || left(coalesce(nullif(btrim(p_reason), ''), 'set'), 80), w.balance);
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'set_silicon', p_user_id::text, jsonb_build_object('from', old, 'to', p_amount, 'reason', p_reason));
    return w.balance;
end $$;

create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return jsonb_build_object(
        'players',     (select count(*) from auth.users),
        'new_7d',      (select count(*) from auth.users where created_at > now() - interval '7 days'),
        'saves',       (select count(*) from public.save_heads),
        'sil_total',   (select coalesce(sum(balance), 0) from public.silicon_wallets),
        'pending',     (select count(*) from public.payment_orders where status = 'pending'),
        'orders_ok',   (select count(*) from public.payment_orders where status = 'approved'),
        'revenue',     (select coalesce(sum(amount), 0) from public.payment_orders where status = 'approved'),
        'signups_14d', (select coalesce(jsonb_agg(c order by d), '[]'::jsonb) from (
                           select g::date as d, (select count(*) from auth.users where created_at::date = g::date) as c
                             from generate_series(current_date - 13, current_date, interval '1 day') g) s));
end $$;

do $$
declare f text;
begin
    foreach f in array array[
        'admin_list_orders(text)', 'get_pending_payments()', 'admin_approve_payment(text)', 'admin_reject_payment(text)',
        'admin_get_all_profiles()', 'admin_set_silicon(uuid, bigint, text)', 'admin_dashboard_stats()'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

-- ---------- JADIKAN AKUN KAMU ADMIN (ganti email, jalankan sekali) ----------
-- insert into public.admin_users (user_id) select id from auth.users where email = 'emailkamu@contoh.com' on conflict do nothing;
