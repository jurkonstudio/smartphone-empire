# Peta Server 3D — v2027.74

File diganti: `src/ui/server/ServerScene.js`, `src/ui/server/ServerMap.js` (hanya meneruskan teks status & petunjuk).

## Perbaikan akar masalah
- **Kabut**: Exp2 0.03 pada kamera ortografik berjarak ~60 menutup ~96% pusat peta. Diganti `Fog` linear (50→118).
- **Partikel**: gelembung berukuran 0.16 (satuan dunia) = <1 piksel pada kamera ortografik sehingga tak terlihat. Kini ukuran piksel, mengikuti zoom.

## Tambahan visual
Kaustik di dasar laut, riak pasir, bayangan (medium/high), env map PMREM, sinar permukaan lembut, vinyet.
Pod: pelana, hatch, jendela, rak bertekstur, strip lantai berwarna beban, lampu titik interior (high).
Hub: sirip, kipas berbilah, cerobong; pipa daya & pendingin; denyut data di kabel.
Hidup: kelp, karang, kawanan ikan, ubur-ubur, drone ROV, salju laut. Lahan terkunci = lokasi konstruksi + derek.
Interaksi: ketuk pod → kamera fokus + kartu status; ketuk ruang kosong → batal.

## Tier
- low: tanpa bayangan/env/kelp/partikel/ROV/ikan (setara beban lama).
- medium (HP): bayangan 1024, tanpa lampu titik, objek hidup dikurangi.
- high: semua aktif. Paksa tier lewat parameter query yang sudah dipakai `queryTier()`.

## Checklist uji di browser
1. Home → Server: pod terlihat jelas (tidak pucat), kaustik bergerak di dasar.
2. Ketuk Pod A/B → kamera mendekat, label menampilkan status; ketuk kosong → kembali.
3. Ganti Kampus ↔ Server 10×: tidak ada peringatan WebGL context / memori naik terus.
4. Tab disembunyikan → animasi berhenti; kembali → lanjut.
