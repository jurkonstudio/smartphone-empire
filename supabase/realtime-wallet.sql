-- Aktifkan Realtime untuk dompet SIL supaya saldo di game langsung ikut berubah
-- saat admin mengatur SIL. Jalankan sekali di SQL Editor. Aman diulang.
do $$
begin
    alter publication supabase_realtime add table public.silicon_wallets;
exception when duplicate_object then null;
end $$;
