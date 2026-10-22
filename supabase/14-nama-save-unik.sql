-- ============================================================
-- 14-nama-save-unik.sql
-- Menjaga nama perusahaan tetap unik juga di jalur SAVE (game_saves).
--
-- Sebelumnya indeks unik hanya ada di profiles, sedangkan upload save
-- (game_saves.company_name) tidak memeriksa apa pun. Akibatnya dua akun bisa
-- menyimpan nama yang sama lewat save.
--
-- Perilaku:
--  - Hanya aktif saat company_name ditulis dan NILAINYA BERUBAH, jadi save lama
--    yang sudah telanjur sama tidak ikut terkunci.
--  - Nama dinormalisasi dengan fungsi yang sama seperti 03 (huruf kecil, tanpa
--    spasi/tanda baca), sehingga "Acme Corp" dan "acme-corp" dianggap sama.
--  - Advisory lock per nama mencegah dua upload bersamaan lolos berbarengan.
--  - Aman diulang (idempoten).
--
-- Catatan: daftar kata kasar TIDAK diperiksa di sini. Blocklist hidup di
-- klien (src/data/name-blocklist.data.js).
--
-- Sebelum dijalankan, cek apakah sudah ada nama kembar di save lama:
--   select public.normalize_company_name(company_name) n, count(distinct user_id)
--     from public.game_saves where company_name is not null and btrim(company_name) <> ''
--    group by 1 having count(distinct user_id) > 1;
-- Hasil ini TIDAK menggagalkan migrasi, hanya informasi untuk admin.
-- ============================================================

create or replace function public.guard_save_company_name()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    norm text := public.normalize_company_name(new.company_name);
begin
    -- Tidak ada perubahan nama: biarkan (mencegah mengunci save lama).
    if tg_op = 'UPDATE' and old.company_name is not distinct from new.company_name then
        return new;
    end if;

    if norm = '' then
        return new;
    end if;

    perform pg_advisory_xact_lock(hashtext('company_name:' || norm));

    if exists (
        select 1 from public.profiles p
         where p.id <> new.user_id
           and p.company_name is not null
           and public.normalize_company_name(p.company_name) = norm
    ) or exists (
        select 1 from public.game_saves g
         where g.user_id <> new.user_id
           and g.company_name is not null
           and public.normalize_company_name(g.company_name) = norm
    ) then
        raise exception 'company_name_taken' using errcode = '23505',
            hint = 'Nama perusahaan sudah dipakai pemain lain.';
    end if;

    return new;
end $$;

drop trigger if exists game_saves_guard_company_name on public.game_saves;
create trigger game_saves_guard_company_name
    before insert or update of company_name on public.game_saves
    for each row execute function public.guard_save_company_name();

-- Fungsi ini hanya dipanggil oleh trigger; tidak perlu dibuka ke klien.
revoke all on function public.guard_save_company_name() from public, anon, authenticated;
