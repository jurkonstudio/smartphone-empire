-- ============================================================================
-- Smartphone Empire — 10 PESAN ANTAR PEMAIN (DM lewat panel Pesan)
-- Jalankan SETELAH 09-pesan-inbox.sql. Aman diulang (idempoten).
-- Pengirim memakai ID Pemain 8 digit (public_id); email/UUID penerima tidak pernah terbuka.
-- Perlindungan: batas kirim (5/menit, 40/jam, 15/jam per penerima), blokir, laporan ke admin,
-- maks 500 karakter, maks 50 pesan pemain tersimpan per penerima.
-- ============================================================================

alter table public.inbox_messages
    add column if not exists sender_id        uuid references auth.users(id) on delete set null,
    add column if not exists sender_name      text,
    add column if not exists sender_public_id bigint;
alter table public.inbox_messages drop constraint if exists inbox_messages_kind_check;
alter table public.inbox_messages add constraint inbox_messages_kind_check
    check (kind in ('admin', 'sil', 'system', 'player'));

-- Tabel pendukung: tidak bisa diakses langsung oleh pemain, hanya lewat fungsi di bawah.
create table if not exists public.inbox_blocks (
    user_id    uuid not null references auth.users(id) on delete cascade,
    blocked_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, blocked_id)
);
create table if not exists public.inbox_send_log (
    id       bigserial primary key,
    sender   uuid not null references auth.users(id) on delete cascade,
    receiver uuid not null,
    at       timestamptz not null default now()
);
create index if not exists inbox_send_log_idx on public.inbox_send_log (sender, at desc);
create table if not exists public.inbox_reports (
    id               bigserial primary key,
    reporter_id      uuid not null references auth.users(id) on delete cascade,
    sender_id        uuid references auth.users(id) on delete set null,
    sender_public_id bigint,
    message_body     text not null,
    reason           text,
    created_at       timestamptz not null default now(),
    resolved         boolean not null default false
);
alter table public.inbox_blocks   enable row level security;
alter table public.inbox_send_log enable row level security;
alter table public.inbox_reports  enable row level security;
revoke all on public.inbox_blocks, public.inbox_send_log, public.inbox_reports from anon, authenticated;

-- ---------- Internal: simpan pesan pemain (maks 50 per penerima; tidak menggusur pesan admin/SIL) ----------
create or replace function public._inbox_push_player(p_to uuid, p_from uuid, p_name text, p_pid bigint, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
    insert into public.inbox_messages (user_id, kind, title, body, sender_id, sender_name, sender_public_id)
    values (p_to, 'player', left(p_name, 80), left(p_body, 500), p_from, left(p_name, 80), p_pid);
    delete from public.inbox_messages
     where user_id = p_to and kind = 'player'
       and id not in (select id from public.inbox_messages where user_id = p_to and kind = 'player' order by id desc limit 50);
end $$;
revoke all on function public._inbox_push_player(uuid, uuid, text, bigint, text) from public, anon, authenticated;

-- ---------- Kirim pesan ----------
create or replace function public.send_player_message(p_receiver_public_id bigint, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); rid uuid; mypid bigint; myname text; n int;
begin
    if me is null then raise exception 'not_authenticated'; end if;
    p_body := btrim(coalesce(p_body, ''));
    if char_length(p_body) < 1 or char_length(p_body) > 500 then raise exception 'invalid_body'; end if;

    select id into rid from public.profiles where public_id = p_receiver_public_id;
    if rid is null then raise exception 'receiver_not_found'; end if;
    if rid = me then raise exception 'cannot_message_self'; end if;
    select public_id, coalesce(nullif(btrim(company_name), ''), nullif(btrim(player_name), ''), 'Pemain')
      into mypid, myname from public.profiles where id = me;
    if mypid is null then raise exception 'no_profile'; end if;

    delete from public.inbox_send_log where sender = me and at < now() - interval '2 hours';
    select count(*) into n from public.inbox_send_log where sender = me and at > now() - interval '1 minute';
    if n >= 5 then raise exception 'rate_limited'; end if;
    select count(*) into n from public.inbox_send_log where sender = me and at > now() - interval '1 hour';
    if n >= 40 then raise exception 'rate_limited'; end if;
    select count(*) into n from public.inbox_send_log where sender = me and receiver = rid and at > now() - interval '1 hour';
    if n >= 15 then raise exception 'rate_limited'; end if;
    insert into public.inbox_send_log (sender, receiver) values (me, rid);

    -- Diblokir penerima: tampak terkirim bagi pengirim, tetapi tidak masuk inbox penerima.
    if exists (select 1 from public.inbox_blocks where user_id = rid and blocked_id = me) then
        return jsonb_build_object('ok', true);
    end if;
    perform public._inbox_push_player(rid, me, myname, mypid, p_body);
    return jsonb_build_object('ok', true);
end $$;

-- ---------- Blokir ----------
create or replace function public.inbox_block(p_public_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); bid uuid;
begin
    if me is null then raise exception 'not_authenticated'; end if;
    select id into bid from public.profiles where public_id = p_public_id;
    if bid is null then raise exception 'receiver_not_found'; end if;
    if bid = me then raise exception 'cannot_message_self'; end if;
    insert into public.inbox_blocks (user_id, blocked_id) values (me, bid) on conflict do nothing;
    delete from public.inbox_messages where user_id = me and sender_id = bid;
    return jsonb_build_object('ok', true);
end $$;

create or replace function public.inbox_unblock(p_public_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    delete from public.inbox_blocks
     where user_id = auth.uid() and blocked_id = (select id from public.profiles where public_id = p_public_id);
    return jsonb_build_object('ok', true);
end $$;

create or replace function public.inbox_list_blocks() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    return coalesce((select jsonb_agg(jsonb_build_object('public_id', p.public_id,
                'company_name', coalesce(nullif(btrim(p.company_name), ''), nullif(btrim(p.player_name), ''), 'Pemain'))
                order by b.created_at desc)
        from public.inbox_blocks b join public.profiles p on p.id = b.blocked_id
        where b.user_id = auth.uid()), '[]'::jsonb);
end $$;

-- ---------- Laporkan pesan (isi pesan disalin sebagai bukti; hanya pesan di inbox sendiri) ----------
create or replace function public.inbox_report(p_message_id bigint, p_reason text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m public.inbox_messages;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    select * into m from public.inbox_messages where id = p_message_id and user_id = auth.uid() and kind = 'player';
    if not found then raise exception 'message_not_found'; end if;
    if exists (select 1 from public.inbox_reports where reporter_id = auth.uid() and sender_id is not distinct from m.sender_id
               and message_body = m.body) then
        return jsonb_build_object('ok', true);
    end if;
    insert into public.inbox_reports (reporter_id, sender_id, sender_public_id, message_body, reason)
    values (auth.uid(), m.sender_id, m.sender_public_id, m.body, left(nullif(btrim(coalesce(p_reason, '')), ''), 300));
    return jsonb_build_object('ok', true);
end $$;

-- ---------- Admin: lihat laporan ----------
create or replace function public.admin_list_reports(p_limit int default 40) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.id desc) from (
        select x.id, x.created_at, x.sender_public_id, sp.company_name as sender_name, x.message_body as pesan,
               x.reason as alasan, rp.company_name as pelapor, x.resolved
          from public.inbox_reports x
          left join public.profiles sp on sp.id = x.sender_id
          left join public.profiles rp on rp.id = x.reporter_id
         order by x.id desc limit greatest(1, least(coalesce(p_limit, 40), 200))) r), '[]'::jsonb);
end $$;

-- ---------- Privasi: riwayat pesan di panel admin tidak menampilkan DM antar pemain ----------
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
         where m.kind <> 'player'
         order by m.id desc limit greatest(1, least(coalesce(p_limit, 40), 200))) r), '[]'::jsonb);
end $$;

-- ---------- Izin eksekusi ----------
do $$
declare f text;
begin
    foreach f in array array[
        'send_player_message(bigint, text)', 'inbox_block(bigint)', 'inbox_unblock(bigint)', 'inbox_list_blocks()',
        'inbox_report(bigint, text)', 'admin_list_reports(int)', 'admin_list_messages(int)'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
