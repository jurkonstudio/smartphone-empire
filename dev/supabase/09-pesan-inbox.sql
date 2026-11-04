-- ============================================================================
-- Smartphone Empire — 09 PESAN (inbox pemain: notifikasi SIL masuk + pesan dari admin)
-- Jalankan SETELAH 05 (butuh is_admin, admin_audit, payment_orders). Aman diulang (idempoten).
-- Pemain: hanya BACA & kelola pesan miliknya. Pesan hanya bisa dibuat oleh server/admin.
-- ============================================================================

create table if not exists public.inbox_messages (
    id         bigserial primary key,
    user_id    uuid not null references auth.users(id) on delete cascade,
    kind       text not null default 'admin' check (kind in ('admin', 'sil', 'system')),
    title      text not null,
    body       text not null default '',
    amount     bigint,
    created_at timestamptz not null default now(),
    read_at    timestamptz
);
create index if not exists inbox_messages_user_idx on public.inbox_messages (user_id, id desc);
alter table public.inbox_messages enable row level security;
drop policy if exists "inbox_select_own" on public.inbox_messages;
create policy "inbox_select_own" on public.inbox_messages
    for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.inbox_messages from anon, authenticated;

do $$ begin
    alter publication supabase_realtime add table public.inbox_messages;
exception when duplicate_object then null; end $$;

-- ---------- Internal: kirim 1 pesan (maks 100 pesan terakhir per pemain) ----------
create or replace function public._inbox_push(p_user uuid, p_kind text, p_title text, p_body text, p_amount bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
    insert into public.inbox_messages (user_id, kind, title, body, amount)
    values (p_user, p_kind, left(p_title, 80), left(coalesce(p_body, ''), 1000), p_amount);
    delete from public.inbox_messages
     where user_id = p_user
       and id not in (select id from public.inbox_messages where user_id = p_user order by id desc limit 100);
end $$;
revoke all on function public._inbox_push(uuid, text, text, text, bigint) from public, anon, authenticated;

-- ---------- Otomatis: notifikasi saat SIL masuk (top-up disetujui, dari admin, transfer) ----------
create or replace function public._ledger_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text := to_char(new.delta, 'FM999,999,999,999'); b text := to_char(new.balance, 'FM999,999,999,999');
begin
    if new.delta <= 0 then return new; end if;
    if new.reason like 'topup:%' then
        perform public._inbox_push(new.user_id, 'sil', 'Top-up berhasil',
            '+' || n || ' SIL sudah masuk ke dompetmu. Saldo sekarang ' || b || ' SIL.', new.delta);
    elsif new.reason like 'admin:%' then
        perform public._inbox_push(new.user_id, 'sil', 'SIL dari admin',
            '+' || n || ' SIL ditambahkan ke dompetmu. Saldo sekarang ' || b || ' SIL.', new.delta);
    elsif new.reason = 'transfer_in' then
        perform public._inbox_push(new.user_id, 'sil', 'SIL diterima',
            'Kamu menerima ' || n || ' SIL dari pemain lain. Saldo sekarang ' || b || ' SIL.', new.delta);
    end if;
    return new;
end $$;
drop trigger if exists silicon_ledger_notify on public.silicon_ledger;
create trigger silicon_ledger_notify after insert on public.silicon_ledger
    for each row execute function public._ledger_notify();

-- ---------- Otomatis: pesanan top-up ditolak ----------
create or replace function public._order_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if new.status = 'rejected' and old.status is distinct from 'rejected' then
        perform public._inbox_push(new.user_id, 'system', 'Pembayaran ditolak',
            'Pesanan top-up ' || new.id || ' ditolak admin. Hubungi admin bila ini keliru.');
    end if;
    return new;
end $$;
drop trigger if exists payment_orders_notify on public.payment_orders;
create trigger payment_orders_notify after update of status on public.payment_orders
    for each row execute function public._order_notify();

-- ---------- Sisi pemain ----------
create or replace function public.inbox_mark_read(p_ids bigint[] default null) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    update public.inbox_messages set read_at = now()
     where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids));
    get diagnostics n = row_count;
    return n;
end $$;

create or replace function public.inbox_delete(p_ids bigint[] default null) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    delete from public.inbox_messages
     where user_id = auth.uid() and (p_ids is null or id = any(p_ids));
    get diagnostics n = row_count;
    return n;
end $$;

-- ---------- Sisi admin (semua memeriksa is_admin di server) ----------
create or replace function public.admin_send_message(p_user_id uuid, p_title text, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
    perform public._assert_admin();
    p_title := btrim(coalesce(p_title, '')); p_body := btrim(coalesce(p_body, ''));
    if char_length(p_title) < 1 or char_length(p_title) > 80 then raise exception 'invalid_title'; end if;
    if char_length(p_body) < 1 or char_length(p_body) > 1000 then raise exception 'invalid_body'; end if;
    if not exists (select 1 from auth.users where id = p_user_id) then raise exception 'user_not_found'; end if;
    perform public._inbox_push(p_user_id, 'admin', p_title, p_body);
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'send_message', p_user_id::text, jsonb_build_object('title', p_title));
    return jsonb_build_object('ok', true, 'sent', 1);
end $$;

create or replace function public.admin_broadcast_message(p_title text, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n int;
begin
    perform public._assert_admin();
    p_title := btrim(coalesce(p_title, '')); p_body := btrim(coalesce(p_body, ''));
    if char_length(p_title) < 1 or char_length(p_title) > 80 then raise exception 'invalid_title'; end if;
    if char_length(p_body) < 1 or char_length(p_body) > 1000 then raise exception 'invalid_body'; end if;
    insert into public.inbox_messages (user_id, kind, title, body)
        select p.id, 'admin', p_title, p_body from public.profiles p;
    get diagnostics n = row_count;
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'broadcast_message', 'all', jsonb_build_object('title', p_title, 'count', n));
    return jsonb_build_object('ok', true, 'sent', n);
end $$;

create or replace function public.admin_list_messages(p_limit int default 40) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.id desc) from (
        select m.id, m.kind, m.title, left(m.body, 80) as body, u.email, p.company_name,
               m.created_at, m.read_at
          from public.inbox_messages m
          join auth.users u on u.id = m.user_id
          left join public.profiles p on p.id = m.user_id
         order by m.id desc limit greatest(1, least(coalesce(p_limit, 40), 200))) r), '[]'::jsonb);
end $$;

-- ---------- Izin eksekusi ----------
do $$
declare f text;
begin
    foreach f in array array[
        'inbox_mark_read(bigint[])', 'inbox_delete(bigint[])',
        'admin_send_message(uuid, text, text)', 'admin_broadcast_message(text, text)', 'admin_list_messages(int)'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
