# Paket 2027–2028 + Kompetitor (SPEKULATIF — skenario permainan)
Salin file ke lokasi yang sama (path relatif dari akar repo). Uji: `node tools/paket2027.mjs src`.

- Pasar: anchor 2027–2030 di `balance.data.js` (unit, harga rata-rata, others).
- Biaya RAM: BARU `data/supply-shock.data.js` (indeks x1.35/1.5/1.2/1.05), dipakai `material-plants.data.js` (`getMarketPrice`, `resolveComponentCost`), `ComponentPlantSystem`, `ProductSystem`, DesignWizard, ManufacturePanel. Komponen `ram_lpddr6_24g`.
- Tren: `memory_crunch`, `agentic_ai`, `eu_battery_rule` di `market-nav.data.js`.
- Berita: BARU `news-headlines-2027-2030.data.js` + penggabungan di `NewsSystem`.
- OS: `fw_agentic_os`, `fw_agent_guard`, `fw_agent_store`, bug `bug_agent_permission_leak`, riset `ai_agentic_runtime`, jalur kartu, diskon F-AI, i18n id+en.
- Kompetitor: `shareByYear` s.d. 2030 (16 merek), pendatang fiktif `novamind` (aktif 2028), penarikan merek emergent (`competitor-actions.data.js` → `withdrawal`, ambang 0,3% selama 2 tahun), pengaruh krisis memori pada pilihan aksi, `withdrawn`/`lowShareYears` di save.
