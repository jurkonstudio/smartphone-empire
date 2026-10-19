-- ---------- Aksi admin: tambah/kurangi SIL (delta) ----------
create or replace function public.admin_add_silicon(p_user_id uuid, p_delta bigint, p_reason text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; old bigint;
begin
    perform public._assert_admin();
    if p_delta is null or p_delta = 0 or abs(p_delta) > 10000000 then raise exception 'invalid_amount'; end if;
    w := public._wallet(p_user_id); old := w.balance;
    if old + p_delta < 0 then raise exception 'insufficient_silicon'; end if;
    update public.silicon_wallets set balance = balance + p_delta, updated_at = now()
        where user_id = p_user_id returning * into w;
    insert into public.silicon_ledger (user_id, delta, reason, balance)
    values (p_user_id, p_delta, 'admin:' || left(coalesce(nullif(btrim(p_reason), ''), 'adjust'), 80), w.balance);
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'add_silicon', p_user_id::text, jsonb_build_object('from', old, 'delta', p_delta, 'reason', p_reason));
    return w.balance;
end $$;

-- ---------- Aksi admin: koreksi nama (moderasi) ----------
-- Catatan: game menyinkronkan nama dari klien, jadi nama bisa kembali saat pemain sinkron lagi.
create or replace function public.admin_update_profile(p_user_id uuid, p_player_name text, p_company_name text) returns void
language plpgsql security definer set search_path = public as $$
declare old record;
begin
    perform public._assert_admin();
    insert into public.profiles (id) values (p_user_id) on conflict (id) do nothing;
    select player_name, company_name into old from public.profiles where id = p_user_id;
    update public.profiles set
        player_name  = nullif(left(btrim(coalesce(p_player_name, '')), 24), ''),
        company_name = nullif(left(btrim(coalesce(p_company_name, '')), 24), ''),
        updated_at   = now()
     where id = p_user_id;
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'update_profile', p_user_id::text,
            jsonb_build_object('from', to_jsonb(old), 'player_name', p_player_name, 'company_name', p_company_name));
end $$;

-- ---------- Aksi admin: blokir / buka blokir akun ----------
create or replace function public.admin_set_banned(p_user_id uuid, p_banned boolean, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
    perform public._assert_admin();
    if p_user_id = auth.uid() then raise exception 'cannot_ban_self'; end if;
    if exists (select 1 from public.admin_users where user_id = p_user_id) then raise exception 'cannot_ban_admin'; end if;
    update auth.users set banned_until = case when p_banned then now() + interval '100 years' else null end
     where id = p_user_id;
    if not found then raise exception 'user_not_found'; end if;
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), case when p_banned then 'ban' else 'unban' end, p_user_id::text,
            jsonb_build_object('reason', p_reason));
end $$;

-- ---------- Aksi admin: hapus save cloud pemain (reset progres) ----------
create or replace function public.admin_delete_save(p_user_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare g record;
begin
    perform public._assert_admin();
    select company_name, game_year, game_month, game_minutes into g
      from public.game_saves where user_id = p_user_id order by updated_at desc limit 1;
    if not found then raise exception 'save_not_found'; end if;
    delete from public.game_saves where user_id = p_user_id;
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'delete_save', p_user_id::text, jsonb_build_object('save', to_jsonb(g), 'reason', p_reason));
end $$;

-- ---------- Info sistem Supabase: tabel, RPC, bucket, realtime, ukuran DB ----------
create or replace function public.admin_system_overview() returns jsonb
language plpgsql security definer set search_path = public as $$
declare t record; tables jsonb := '[]'::jsonb; n bigint;
begin
    perform public._assert_admin();
    for t in select c.relname, c.relrowsecurity as rls, pg_total_relation_size(c.oid) as bytes
               from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
              where ns.nspname = 'public' and c.relkind = 'r' order by c.relname loop
        execute format('select count(*) from public.%I', t.relname) into n;
        tables := tables || jsonb_build_array(jsonb_build_object(
            'name', t.relname, 'rows', n, 'bytes', t.bytes, 'rls', t.rls,
            'policies', (select count(*) from pg_policies pp where pp.schemaname = 'public' and pp.tablename = t.relname)));
    end loop;
    return jsonb_build_object(
        'db_bytes', pg_database_size(current_database()),
        'pg_version', current_setting('server_version'),
        'tables', tables,
        'functions', coalesce((select jsonb_agg(f order by f.name) from (
            select p.proname as name, pg_get_function_identity_arguments(p.oid) as args,
                   pg_get_function_result(p.oid) as returns, p.prosecdef as security_definer,
                   has_function_privilege('anon', p.oid, 'execute') as anon,
                   has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
                   has_function_privilege('service_role', p.oid, 'execute') as service_role
              from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
             where ns.nspname = 'public' and p.prokind = 'f'
               and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')) f), '[]'::jsonb),
        'buckets', coalesce((select jsonb_agg(b) from (
            select bk.id, bk.public, bk.file_size_limit, count(o.id) as files,
                   coalesce(sum((o.metadata->>'size')::bigint), 0) as bytes
              from storage.buckets bk left join storage.objects o on o.bucket_id = bk.id
             group by bk.id, bk.public, bk.file_size_limit order by bk.id) b), '[]'::jsonb),
        'realtime', coalesce((select jsonb_agg(pt.tablename) from pg_publication_tables pt
                               where pt.pubname = 'supabase_realtime'), '[]'::jsonb));
end $$;

-- ---------- Izin eksekusi: hanya login (dan tetap dicek is_admin di dalam) ----------
do $$
declare f text;
begin
    foreach f in array array[
        'admin_dashboard_stats()', 'admin_get_all_profiles()', 'admin_get_player(uuid)',
        'admin_get_player_save(uuid)', 'admin_list_ledger(uuid, text, int)', 'admin_list_audit(int)',
        'admin_add_silicon(uuid, bigint, text)', 'admin_update_profile(uuid, text, text)',
        'admin_set_banned(uuid, boolean, text)', 'admin_delete_save(uuid, text)', 'admin_system_overview()'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
