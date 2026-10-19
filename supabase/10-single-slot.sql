-- ============================================================================
-- Ubah save cloud menjadi SATU slot per pemain. Jalankan di SQL Editor.
-- Urutan aman: deploy kode game baru dulu, lalu jalankan file ini.
-- Hasil: tiap pemain hanya menyimpan save TERBARU-nya, dipindah ke slot 1.
-- Save slot lain yang lebih lama DIHAPUS. Aman diulang.
-- ============================================================================
begin;

delete from public.game_saves g
using (
    select distinct on (user_id) user_id, slot as keep_slot
      from public.game_saves
     order by user_id, updated_at desc
) k
where g.user_id = k.user_id and g.slot <> k.keep_slot;

update public.game_saves set slot = 1 where slot <> 1;
delete from public.save_heads where slot <> 1;

alter table public.game_saves drop constraint if exists game_saves_slot_check;
alter table public.game_saves add constraint game_saves_slot_check check (slot = 1);

commit;

-- Cek: setiap pemain tepat satu baris, semuanya slot 1.
select slot, count(*) from public.game_saves group by slot;
