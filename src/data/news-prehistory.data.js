// FILE: src/data/news-prehistory.data.js
// ============================================================
// ARSIP PRA-2000 — peristiwa teknologi NYATA 1992-1999.
// Dipakai sebagai "rekam jejak industri" saat game dimulai.
//
// Catatan verifikasi (peristiwa nyata, sumber referensi):
//  1992-11-10 Nokia 1011        — Science Museum Group
//  1994-08-16 IBM Simon         — BBC News Indonesia
//  1996-01-03 Motorola StarTAC  — CNET, Science Museum
//  1997-03-01 Nokia 6110        — Microsoft Blogs, HMD (bulan perkiraan)
//  1998-06-24 Symbian Ltd       — BBC News, Wikipedia ID
//  1999-02-23 Nokia 7110 announce — Wired, IT History
//  1999-11-17 Y2K prep          — konteks industri akhir 1999
//  1999-11-18 Nokia 7110 UK sale — ZDNET, The Register
//  1999-12-06 3G auction prep   — persiapan lelang UMTS Eropa
//  1999-12-08 Microsoft–Ericsson JV — Microsoft Press Release
//  1999-12-15 Orange videophone — The Register
//  1999-12-20 Asia market       — tren pasar Asia akhir dekade
//  1999-12-30 NZ network surge  — laporan jaringan tahun baru
//  1999-12-31 Decade recap      — ringkasan era mobile 1990-an
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
    },
    {
        year: 1999, month: 11, day: 17,
        source: 'TechPulse Global', sourceId: 'techpulse_us',
        tone: 'mixed', era: 'firmware',
        dateline: 'New York',
        tags: ['y2k', 'millennium', 'industry'],
        headline: 'Menjelang 2000: industri telekomunikasi waspadai "Y2K bug"',
        text: 'Seiring berjalannya tahun 1999, industri telekomunikasi global mempersiapkan diri menghadapi potensi gangguan "Y2K bug" pada pergantian milenium. Operator di seluruh dunia melakukan uji coba besar-besaran untuk memastikan jaringan tetap stabil saat tahun berganti.'
    },
    {
        year: 1999, month: 11, day: 18,
        source: 'MobileWeek Europe', sourceId: 'mobileweek_uk',
        tone: 'positive', era: 'firmware',
        dateline: 'London',
        tags: ['nokia', 'wap', 'uk'],
        headline: 'Nokia 7110e resmi dijual di Inggris: browser WAP pertama di pasaran',
        text: 'Orange mulai menjual Nokia 7110e seharga £129 dengan akses WAP gratis hingga 31 Januari 2000. Perangkat ini menjadi ponsel pertama yang membawa browser WAP ke konsumen Inggris, lengkap dengan navigasi Navi-Roller dan predictive text.'
    },
    {
        year: 1999, month: 12, day: 6,
        source: 'Der Mobilfunk', sourceId: 'mobilfunk_de',
        tone: 'mixed', era: 'firmware',
        dateline: 'Bonn',
        tags: ['3g', 'umts', 'license'],
        headline: 'Eropa bersiap lelang lisensi 3G: taruhan miliaran dolar',
        text: 'Pemerintah di seluruh Eropa bersiap melelang lisensi jaringan 3G. Operator besar seperti Vodafone, Deutsche Telekom, dan France Télécom bersiap bertaruh besar untuk mengamankan spektrum generasi berikutnya.'
    },
    {
        year: 1999, month: 12, day: 8,
        source: 'MobileWeek Europe', sourceId: 'mobileweek_uk',
        tone: 'positive', era: 'firmware',
        dateline: 'Stockholm',
        tags: ['microsoft', 'ericsson', 'wap', 'partnership'],
        headline: 'Microsoft dan Ericsson bentuk joint venture untuk internet mobile',
        text: 'Microsoft dan Ericsson mengumumkan kemitraan strategis di bidang mobile internet. Ericsson akan mengadopsi Microsoft Mobile Explorer di beberapa ponselnya, sementara Microsoft mendapat akses lebih dalam ke pasar perangkat seluler. Joint venture ini fokus pada solusi email mobile.'
    },
    {
        year: 1999, month: 12, day: 15,
        source: 'MobileWeek Europe', sourceId: 'mobileweek_uk',
        tone: 'positive', era: 'firmware',
        dateline: 'London',
        tags: ['orange', 'videophone', 'windows_ce'],
        headline: 'Orange siapkan videophone berbasis Windows CE untuk 2000',
        text: 'Orange mengumumkan rencana merilis videophone layar sentuh berbasis Windows CE pada kuartal kedua 2000. Perangkat ini mendukung dual-band GSM dan kecepatan data hingga 64 Kbps — ambisi besar sebelum era 3G matang.'
    },
    {
        year: 1999, month: 12, day: 20,
        source: 'Asia Mobile Review', sourceId: 'asiamobile_jp',
        tone: 'positive', era: 'firmware',
        dateline: 'Tokyo',
        tags: ['asia', 'market', 'growth'],
        headline: 'Pasar ponsel Asia melonjak menjelang tahun baru',
        text: 'Penjualan ponsel di Asia mencatat pertumbuhan signifikan menjelang akhir tahun. Jepang dan Korea Selatan memimpin dengan adopsi layar warna dan ponsel kamera, sementara pasar Tiongkok dan India mulai terbuka lebar.'
    },
    {
        year: 1999, month: 12, day: 30,
        source: 'Asia Mobile Review', sourceId: 'asiamobile_jp',
        tone: 'mixed', era: 'firmware',
        dateline: 'Auckland',
        tags: ['y2k', 'network', 'new_zealand'],
        headline: 'Jaringan seluler Selandia Baru kewalahan saat malam tahun baru',
        text: 'Operator di Selandia Baru melaporkan lonjakan trafik ekstrem pada malam pergantian tahun. Bukan karena "Y2K bug", melainkan karena jutaan panggilan dan SMS dikirim bersamaan. Jaringan sempat tersendat selama beberapa menit sebelum kembali normal.'
    },
    {
        year: 1999, month: 12, day: 31,
        source: 'TechPulse Global', sourceId: 'techpulse_us',
        tone: 'positive', era: 'firmware',
        dateline: 'London',
        tags: ['millennium', 'year_end', 'recap'],
        headline: 'Milenium baru: dekade yang mengubah wajah industri mobile',
        text: 'Sepanjang 1990-an, industri ponsel bertransformasi dari perangkat mewah menjadi kebutuhan sehari-hari. Nokia, Motorola, dan Ericsson memimpin pasar, sementara fondasi era smartphone mulai diletakkan lewat Symbian dan ponsel layar sentuh awal.'
    }
];

export function getPrehistoryHeadlines() {
    return PREHISTORY_HEADLINES.slice();
}
