-- ============================================================================
-- Smartphone Empire — 18 IZIN TABEL SAVE (perbaikan "progres tidak tersimpan di cloud")
-- Jalankan di Supabase > SQL Editor. Aman diulang (idempoten).
--
-- Proyek Supabase baru tidak lagi memberi izin otomatis (GRANT) pada tabel di schema public
-- untuk Data API. Tanpa GRANT, upload/unduh save gagal ("permission denied") walau RLS benar,
-- sehingga setelah keluar & masuk lagi progres kosong. RLS tetap membatasi tiap pemain ke barisnya.
-- ============================================================================
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.game_saves to authenticated;
grant select                         on public.save_heads to authenticated;   -- ditulis hanya oleh trigger
grant select                         on public.profiles   to authenticated;
grant select                         on public.silicon_wallets to authenticated;  -- Realtime dompet

-- Pastikan 4 kebijakan RLS save ada (dibuat ulang di 01, ini hanya jaring pengaman).
do $$ begin
    if (select count(*) from pg_policies where schemaname='public' and tablename='game_saves') < 4 then
        raise notice 'Kebijakan game_saves kurang dari 4: jalankan ulang 01-inti-game.sql';
    end if;
end $$;

notify pgrst, 'reload schema';
