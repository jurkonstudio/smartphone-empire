-- ============================================================================
-- Nama perusahaan UNIK antar pemain (v2027.43)
-- Jalankan sekali di Supabase -> SQL Editor. Aman dijalankan ulang.
--
-- SEBELUM menjalankan, cek apakah sudah ada nama kembar (index akan gagal jika ada):
--   select public.normalize_company_name(company_name) as n, count(*)
--     from public.profiles where company_name is not null
--    group by 1 having count(*) > 1;
-- Jika ada baris, ubah salah satu nama pemainnya dulu.
-- ============================================================================

-- Normalisasi: huruf kecil, tanpa spasi/simbol -> "Nokia Corp." == "nokiacorp"
create or replace function public.normalize_company_name(p text)
returns text
language sql
immutable
as $$
    select lower(regexp_replace(btrim(coalesce(p, '')), '[^[:alnum:]]+', '', 'g'))
$$;

-- Penjaga terakhir di server (menang walau dua pemain mendaftar bersamaan).
create unique index if not exists profiles_company_name_unique
    on public.profiles (public.normalize_company_name(company_name))
    where company_name is not null and btrim(company_name) <> '';

-- Cek ketersediaan nama. Hanya mengembalikan true/false (tidak membocorkan data).
-- Nama milik akun sendiri dianggap tersedia (boleh dipakai ulang di slot lain).
create or replace function public.company_name_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        public.normalize_company_name(p_name) <> ''
        and not exists (
            select 1 from public.profiles p
             where p.company_name is not null
               and public.normalize_company_name(p.company_name) = public.normalize_company_name(p_name)
               and p.id is distinct from auth.uid()
        )
        and not exists (
            select 1 from public.save_heads h
             where h.company_name is not null
               and public.normalize_company_name(h.company_name) = public.normalize_company_name(p_name)
               and h.user_id is distinct from auth.uid()
        );
$$;

revoke all on function public.company_name_available(text) from public;
-- anon: onboarding berjalan sebelum login.
grant execute on function public.company_name_available(text) to anon, authenticated;
