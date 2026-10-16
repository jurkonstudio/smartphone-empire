# Hardening v2027.42 (audit ulang)

## Temuan (diuji di browser)
1. `window.__game.cheat` aktif di produksi -> SIL +1.000.000 & cash $5 miliar lewat konsol. (DEV_BUILD = true)
2. Edit localStorage (silicon:123456) langsung diterima.
3. CloudSync "local wins" + RPC `add_silicon` dari klien -> siapa pun bisa kirim saldo bebas ke server.
4. Provider pembayaran `sandbox` otomatis "paid" selama DEV_BUILD.

## Perbaikan
- dev.config.js: DEV_BUILD=false (DevPanel, sandbox, cheat mati)
- main.js: `delete window.__game.cheat` di produksi
- SiliconService.add: kredit hanya dari sumber sah
- CloudSync/CloudService/SupabaseAdapter: server authoritative, klien tak bisa menambah SIL; hadiah harian via RPC server
- core/Integrity.js + SaveService: save/export bertanda tangan; save diedit -> SIL di-nol-kan + tamperFlag
- supabase/hardening.sql: dompet SIL server, RLS read-only, spend/claim_daily, add_silicon hanya service_role, trigger paksa SIL di save cloud

## WAJIB manual
Jalankan supabase/hardening.sql di SQL Editor. Top-up uang asli: kredit SIL hanya lewat webhook/Edge Function (service_role).
