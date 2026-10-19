-- ============================================================================
-- Smartphone Empire — ID PEMAIN (angka 8 digit acak, mis. 48271956)
-- Jalankan SETELAH admin.sql & admin-v2.sql. Idempotent.
--
-- Tiap pemain mendapat public_id: angka acak 8 digit, unik, tidak berubah, dibuat server.
-- Dipakai pemain untuk top-up SIL di web: tidak perlu menyalin UUID panjang.
-- public_id TIDAK ikut tampil di leaderboard/daftar pemain (hanya pemilik & admin yang tahu).
-- ============================================================================

alter table public.profiles add column if not exists public_id bigint;

-- Pembuat ID acak 8 digit (10000000–99999999), diulang sampai belum dipakai.
create or replace function public._gen_public_id() returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint; tries int := 0;
begin
    loop
        v := 10000000 + floor(random() * 90000000)::bigint;
        exit when not exists (select 1 from public.profiles where public_id = v);
        tries := tries + 1;
        if tries > 50 then raise exception 'public_id_exhausted'; end if;
    end loop;
    return v;
end $$;
revoke all on function public._gen_public_id() from public, anon, authenticated;

-- Isi otomatis saat profil dibuat; tolak perubahan nilai setelahnya.
create or replace function public.profiles_public_id_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if tg_op = 'INSERT' then
        if new.public_id is null then new.public_id := public._gen_public_id(); end if;
    else
        new.public_id := coalesce(old.public_id, new.public_id);
    end if;
    return new;
end $$;
drop trigger if exists profiles_public_id_guard on public.profiles;
create trigger profiles_public_id_guard before insert or update on public.profiles
    for each row execute function public.profiles_public_id_guard();

-- Pemain lama: buat profil yang belum ada, lalu beri ID.
insert into public.profiles (id) select u.id from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id) on conflict do nothing;
update public.profiles set public_id = public._gen_public_id() where public_id is null;

create unique index if not exists profiles_public_id_key on public.profiles (public_id);
alter table public.profiles alter column public_id set not null;

-- ---------- Pemain: baca ID miliknya (dipakai game) ----------
create or replace function public.get_my_public_id() returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    insert into public.profiles (id) values (auth.uid()) on conflict (id) do nothing;
    select public_id into v from public.profiles where id = auth.uid();
    return v;
end $$;
revoke all on function public.get_my_public_id() from public, anon;
grant execute on function public.get_my_public_id() to authenticated;

-- ---------- Untuk WEB TOP-UP (backend/Edge Function dengan service_role) ----------
-- Cek ID pemain sebelum bayar. Hanya service_role: jangan buka ke browser (mencegah tebak-tebakan ID).
create or replace function public.lookup_player_by_public_id(p_public_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object('public_id', p.public_id, 'user_id', p.id,
                              'company_name', p.company_name, 'player_name', p.player_name)
      from public.profiles p where p.public_id = p_public_id;
$$;
revoke all on function public.lookup_player_by_public_id(bigint) from public, anon, authenticated;
grant execute on function public.lookup_player_by_public_id(bigint) to service_role;

-- Buat pesanan top-up (status pending) untuk pemain berdasarkan ID. Harga & SIL diambil dari daftar paket server.
-- Admin lalu menyetujui di panel /fsociety seperti biasa.
create or replace function public.create_topup_order_by_public_id(p_public_id bigint, p_package_id text, p_order_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid; pkg record;
begin
    select id into uid from public.profiles where public_id = p_public_id;
    if uid is null then raise exception 'player_not_found'; end if;
    select * into pkg from (values ('pkg_s',15000,50),('pkg_m',35000,130),('pkg_l',79000,345),('pkg_xl',169000,840),('pkg_xxl',329000,1900))
        v(id, price, sil) where v.id = p_package_id;
    if not found then raise exception 'invalid_package'; end if;
    if p_order_id is null or length(p_order_id) not between 6 and 64 then raise exception 'invalid_order_id'; end if;
    if (select count(*) from public.payment_orders where user_id = uid and status = 'pending') >= 5 then
        raise exception 'too_many_pending';
    end if;
    insert into public.payment_orders (id, user_id, package_id, amount, sil_amount)
    values (p_order_id, uid, p_package_id, pkg.price, pkg.sil) on conflict (id) do nothing;
    return jsonb_build_object('status', 'pending', 'order_id', p_order_id, 'amount', pkg.price, 'sil_amount', pkg.sil);
end $$;
revoke all on function public.create_topup_order_by_public_id(bigint, text, text) from public, anon, authenticated;
grant execute on function public.create_topup_order_by_public_id(bigint, text, text) to service_role;

