-- ============================================================================
-- Smartphone Empire — 07 ADMIN: AKSI & SISTEM (moderasi, info sistem, audit SIL)
-- Jalankan SETELAH 06. Aman diulang (idempoten). Semua fungsi memeriksa is_admin().
-- ============================================================================

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

-- ---------- File storage milik satu pemain ----------
create or replace function public.admin_player_files(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select o.name, o.metadata->>'mimetype' as mimetype, coalesce((o.metadata->>'size')::bigint, 0) as size, o.created_at
          from storage.objects o
         where o.bucket_id = 'player-assets' and (storage.foldername(o.name))[1] = p_user_id::text
         order by o.created_at desc limit 100) r), '[]'::jsonb);
end $$;

-- ---------- Penjelajah tabel (daftar putih; tanpa kolom rahasia / save mentah) ----------
create or replace function public.admin_browse_table(p_table text, p_limit int default 50, p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare src text; total bigint; rows jsonb;
        lim int := least(greatest(coalesce(p_limit, 50), 1), 200); off int := greatest(coalesce(p_offset, 0), 0);
begin
    perform public._assert_admin();
    src := case p_table
        when 'auth_users'           then 'select id, email, created_at, last_sign_in_at, email_confirmed_at, banned_until from auth.users'
        when 'profiles'             then 'select * from public.profiles'
        when 'save_heads'           then 'select * from public.save_heads'
        when 'game_saves'           then 'select user_id, slot, company_name, game_year, game_month, game_minutes, schema_version, device_id, client_saved_at, created_at, updated_at, pg_column_size(data) as data_bytes from public.game_saves'
        when 'silicon_wallets'      then 'select * from public.silicon_wallets'
        when 'silicon_ledger'       then 'select * from public.silicon_ledger'
        when 'silicon_quest_claims' then 'select * from public.silicon_quest_claims'
        when 'silicon_requests'     then 'select * from public.silicon_requests'
        when 'payment_orders'       then 'select * from public.payment_orders'
        when 'admin_users'          then 'select * from public.admin_users'
        when 'admin_audit'          then 'select * from public.admin_audit'
        when 'storage_objects'      then 'select id, bucket_id, name, created_at, (metadata->>''size'')::bigint as size from storage.objects'
        else null end;
    if src is null then raise exception 'invalid_table'; end if;
    execute 'select count(*) from (' || src || ') t' into total;
    execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from (select * from (%s) s order by 1 desc limit %s offset %s) t', src, lim, off) into rows;
    return jsonb_build_object('total', total, 'rows', rows);
end $$;

-- ---------- Rekonsiliasi: saldo dompet vs jumlah ledger (deteksi saldo tak wajar) ----------
-- Dompet baru bernilai awal 10. Dompet yang ada sebelum ledger dibuat bisa selisih tetap — bukan bug baru.
create or replace function public.admin_silicon_audit() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by abs(r.selisih) desc) from (
        select w.user_id, u.email, w.balance,
               10 + coalesce(l.total, 0) as expected_from_ledger,
               w.balance - (10 + coalesce(l.total, 0)) as selisih
          from public.silicon_wallets w
          join auth.users u on u.id = w.user_id
          left join (select user_id, sum(delta) as total from public.silicon_ledger group by user_id) l on l.user_id = w.user_id
         where w.balance <> 10 + coalesce(l.total, 0)
         order by abs(w.balance - (10 + coalesce(l.total, 0))) desc limit 200) r), '[]'::jsonb);
end $$;

-- ---------- Izin eksekusi ----------
do $$
declare f text;
begin
    foreach f in array array[
        'admin_update_profile(uuid, text, text)', 'admin_set_banned(uuid, boolean, text)', 'admin_delete_save(uuid, text)',
        'admin_system_overview()', 'admin_player_files(uuid)', 'admin_browse_table(text, int, int)', 'admin_silicon_audit()'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
