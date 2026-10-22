// FILE: src/config/endgame.config.js
// Pengaturan akhir permainan (satu musim). Ubah endYear untuk memajukan atau memundurkan batas.
// Permainan selesai saat tanggal game memasuki tahun setelah endYear (1 Januari endYear+1).
export const ENDGAME = {
    endYear: 2050,
    weights: {
        milestone: 100,   // per milestone tercapai
        product:   50,    // per ponsel di katalog
        research:  20,    // per riset selesai
        staff:     15     // per staf aktif di tim
        // Kekayaan bersih: setiap $10.000 (kas dikurangi sisa pinjaman) = 1 poin, minimal 0.
    }
};
