-- Jalankan SETELAH admin.sql, dan SETELAH akun kalfinsetiawan@icloud.com dibuat
-- (Supabase > Authentication > Users > Add user, centang Auto Confirm User).
-- Aman dijalankan berulang.

do $$
declare uid uuid;
begin
    select id into uid from auth.users where lower(email) = lower('kalfinsetiawan@icloud.com');
    if uid is null then
        raise exception 'Akun kalfinsetiawan@icloud.com belum ada. Buat dulu di Authentication > Users.';
    end if;

    -- 1. Jadikan admin panel /fsociety
    insert into public.admin_users (user_id) values (uid) on conflict do nothing;

    -- 2. Nama perusahaan di profil pemain
    insert into public.profiles (id, company_name)
    values (uid, 'Sunda Empire')
    on conflict (id) do update set company_name = 'Sunda Empire', updated_at = now();
end $$;

-- Cek hasil: harus ada 1 baris dengan is_admin = true
select u.email, p.company_name,
       exists (select 1 from public.admin_users a where a.user_id = u.id) as is_admin
  from auth.users u
  left join public.profiles p on p.id = u.id
 where lower(u.email) = lower('kalfinsetiawan@icloud.com');
