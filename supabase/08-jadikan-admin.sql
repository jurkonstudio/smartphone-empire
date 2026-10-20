-- ============================================================================
-- Smartphone Empire — 08 JADIKAN AKUNMU ADMIN (panel /fsociety)
-- 1) Daftar / login dulu di game dengan akunmu (atau Authentication > Users > Add user, centang Auto Confirm).
-- 2) GANTI 'emailkamu@contoh.com' di bawah dengan email akun itu, lalu Run. Aman diulang.
-- ============================================================================
do $$
declare uid uuid; mail text := 'emailkamu@contoh.com';     -- <-- GANTI
begin
    select id into uid from auth.users where lower(email) = lower(mail);
    if uid is null then raise exception 'Akun % belum ada. Buat/daftar dulu.', mail; end if;
    insert into public.admin_users (user_id) values (uid) on conflict do nothing;
end $$;

-- Cek: harus ada 1 baris is_admin = true
select u.email, exists (select 1 from public.admin_users a where a.user_id = u.id) as is_admin
  from auth.users u order by u.created_at desc limit 5;
