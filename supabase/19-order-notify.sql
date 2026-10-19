-- ============================================================================
-- Smartphone Empire — NOTIFIKASI PESANAN TOP-UP SIL untuk Admin Panel (/fsociety)
-- Jalankan di Supabase > SQL Editor (setelah file 18). Aman diulang.
--
-- Tanpa ini panel admin tetap mendapat notifikasi lewat polling tiap 20 dtk; dengan ini notifikasi INSTAN.
-- 1) Policy: admin boleh SELECT payment_orders (Realtime mengikuti RLS; tanpa ini event tidak sampai ke admin).
--    Pemain biasa tetap hanya melihat pesanannya sendiri.
-- 2) Tabel dimasukkan ke publikasi realtime.
-- ============================================================================
drop policy if exists "orders_select_admin" on public.payment_orders;
create policy "orders_select_admin" on public.payment_orders
    for select to authenticated using (public.is_admin());

do $$
begin
    alter publication supabase_realtime add table public.payment_orders;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
