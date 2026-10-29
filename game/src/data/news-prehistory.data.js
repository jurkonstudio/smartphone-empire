// FILE: src/data/news-prehistory.data.js
// ============================================================
// ARSIP PRA-2000 — peristiwa teknologi NYATA 1992-1999.
// Dipakai sebagai "rekam jejak industri" saat game dimulai.
//
// Catatan verifikasi (peristiwa nyata, sumber referensi):
//  1992-11-10 Nokia 1011       — Science Museum Group
//  1994-08-16 IBM Simon        — BBC News Indonesia
//  1996-01-03 Motorola StarTAC — CNET, Science Museum
//  1997-03-01 Nokia 6110       — Microsoft Blogs, HMD (bulan perkiraan)
//  1998-06-24 Symbian Ltd      — BBC News, Wikipedia ID
//  1999-02-23 Nokia 7110       — Wired, IT History
//
// Nama media (source) adalah outlet fiktif game. Peristiwa &
// tanggal mengacu pada sumber nyata di atas.
// ============================================================

export const PREHISTORY_HEADLINES = [
    {
        year: 1992, month: 11, day: 10,
        source: 'TechPulse Global', sourceId: 'techpulse_us',
        tone: 'positive', era: 'firmware',
        dateline: 'Helsinki',
        tags: ['nokia', 'gsm', 'feature_phone'],
        headline: 'Nokia 1011: ponsel GSM massal pertama resmi dijual',
        text: 'Nokia meluncurkan 1011 pada 10 November 1992 sebagai ponsel GSM pertama yang diproduksi massal. Perangkat ini bekerja di 14 negara dan menjadi fondasi era digital mobile di Eropa.'
    },
    {
        year: 1994, month: 8, day: 16,
        source: 'TechPulse Global', sourceId: 'techpulse_us',
        tone: 'positive', era: 'firmware',
        dateline: 'New York',
        tags: ['ibm', 'smartphone', 'touchscreen'],
        headline: 'IBM Simon: "smartphone" pertama dunia mulai dijual',
        text: 'IBM Simon Personal Communicator mulai dijual 16 Agustus 1994. Ia menggabungkan telepon, kalender, email, dan layar sentuh dalam satu perangkat — jauh sebelum iPhone lahir.'
    },
    {
        year: 1996, month: 1, day: 3,
        source: 'MobileWeek Europe', sourceId: 'mobileweek_uk',
        tone: 'positive', era: 'firmware',
        dateline: 'Chicago',
        tags: ['motorola', 'flip_phone', 'design'],
        headline: 'Motorola StarTAC: ponsel lipat pertama menggebrak pasar',
        text: 'Motorola memperkenalkan StarTAC pada 3 Januari 1996. Desain clamshell-nya yang ringan dan ringkas mengubah cara industri melihat bentuk ponsel selama satu dekade.'
    },
    {
        year: 1997, month: 3, day: 1,
        source: 'Asia Mobile Review', sourceId: 'asiamobile_jp',
        tone: 'positive', era: 'firmware',
        dateline: 'Tokyo',
        tags: ['nokia', 'game', 'snake'],
        headline: 'Nokia 6110 bawa Snake: game mobile pertama jadi fenomena',
        text: 'Nokia 6110 (1997) adalah ponsel pertama dengan game Snake. Permainan sederhana ini menciptakan budaya gaming mobile di kalangan remaja di seluruh dunia.'
    },
    {
        year: 1998, month: 6, day: 24,
        source: 'MobileWeek Europe', sourceId: 'mobileweek_uk',
        tone: 'positive', era: 'firmware',
        dateline: 'London',
        tags: ['symbian', 'os', 'alliance'],
        headline: 'Symbian Ltd didirikan: aliansi raksasa ponsel untuk satu OS',
        text: 'Pada 24 Juni 1998, Nokia, Ericsson, Motorola, dan Psion mendirikan Symbian Ltd. Tujuannya: menciptakan sistem operasi standar untuk ponsel pintar generasi berikutnya.'
    },
    {
        year: 1999, month: 2, day: 23,
        source: 'TechPulse Global', sourceId: 'techpulse_us',
        tone: 'positive', era: 'firmware',
        dateline: 'Helsinki',
        tags: ['nokia', 'wap', 'internet'],
        headline: 'Nokia 7110: ponsel pertama dengan browser WAP',
        text: 'Nokia mengumumkan 7110 pada Februari 1999. Ini adalah ponsel pertama yang mendukung WAP — langkah awal membawa internet ke saku pengguna, meski masih lambat dan terbatas.'
    }
];

export function getPrehistoryHeadlines() {
    return PREHISTORY_HEADLINES.slice();
}
