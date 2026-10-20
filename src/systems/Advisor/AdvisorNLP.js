// src/systems/Advisor/AdvisorNLP.js

import AdvisorConfig from './AdvisorConfig.js';
import advisorAnalytics from './AdvisorAnalytics.js';

class AdvisorNLP {
    constructor() {
        this.isProcessing = false;
    }

    // Fungsi untuk notifikasi otomatis (seperti di UI popup Anda)
    generateResponse(issues) {
        if (!AdvisorConfig.isEnabled || issues.length === 0) return ["Semua berjalan lancar, Bos!"];
        
        return issues.map(issue => {
            const yearText = issue.data.year ? `[Tahun ${issue.data.year}] ` : "";
            return `ℹ️ ${yearText}${issue.message}`;
        });
    }

    // FUNGSI BARU: Untuk membaca ketikan pemain di kolom chat
    chat(userText, gameState) {
        const text = userText.toLowerCase();
        const latestData = advisorAnalytics.getLatestData();
        const history = advisorAnalytics.getHistoricalContext();
        
        // 1. Cek sapaan
        if (text.match(/(halo|hai|pagi|siang|malam|bos)/)) {
            return `Halo Bos! Sekarang tahun ${latestData.year}. Ada yang bisa saya bantu? Tanya soal "penjualan", "riset", atau "uang".`;
        }

        // 2. Cek pertanyaan tentang Uang/Keuangan
        if (text.match(/(uang|dana|modal|duit|keuangan|saldo)/)) {
            return `Dana kita saat ini $${latestData.funds.toLocaleString()}. ${latestData.funds < 10000 ? "Saya sarankan hemat pengeluaran." : "Kondisi keuangan aman, kita bisa investasi."}`;
        }

        // 3. Cek pertanyaan tentang Penjualan/Produk
        if (text.match(/(jual|sales|produk|barang|laku)/)) {
            return `Penjualan terakhir tercatat ${latestData.sales} unit. ${latestData.sales === 0 ? "Saatnya buat kampanye marketing!" : "Pertahankan tren ini."}`;
        }

        // 4. Cek pertanyaan tentang Riset/Teknologi
        if (text.match(/(riset|research|teknologi|fitur|hp)/)) {
            return `Level riset kita ada di angka ${latestData.researchLevel}. Di tahun ${latestData.year}, kita butuh riset yang lebih gencar agar tidak kalah saing.`;
        }

        // 5. Cek pertanyaan tentang Sejarah/Perkembangan
        if (text.match(/(sejarah|perkembangan|masa lalu|dari awal)/)) {
            if (history) return `Ini catatan perkembangan kita: ${history}`;
            return `Kita baru memulai perjalanan ini, belum ada catatan sejarah yang berarti.`;
        }

        // 6. Minta saran umum
        if (text.match(/(saran|bantuan|apa lagi|harus apa|bingung)/)) {
            const issues = advisorAnalytics.analyze();
            if (issues.length > 0) return this.generateResponse([issues[0]])[0]; // Ambil 1 saran teratas
            return "Saat ini bisnis berjalan baik. Lanjutkan inovasi produk atau buka pasar baru!";
        }

        // 7. Fallback (Jika AI tidak mengerti)
        return `Hmm, saya belum mengerti maksud Anda. Coba tanyakan tentang "uang", "penjualan", atau minta "saran".`;
    }

    // Fungsi update otomatis (dipanggil game loop)
    update(gameState) {
        if (this.isProcessing) return [];
        this.isProcessing = true;
        
        advisorAnalytics.trackData(gameState); // Catat data tiap update
        const issues = advisorAnalytics.analyze();
        const messages = this.generateResponse(issues);
        
        this.isProcessing = false;
        return messages;
    }
}

export const advisorNLP = new AdvisorNLP();
export default advisorNLP;
