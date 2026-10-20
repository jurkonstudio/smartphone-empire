// src/systems/Advisor/AdvisorNLP.js

import AdvisorConfig from './AdvisorConfig.js';
import advisorAnalytics from './AdvisorAnalytics.js';

class AdvisorNLP {
    constructor() {
        this.isProcessing = false;
    }

    /**
     * Memproses hasil analitik menjadi balasan teks (seperti AI berbicara)
     * @param {Array} issues - Daftar masalah dari AdvisorAnalytics
     * @returns {Array} Daftar pesan balasan untuk pemain
     */
    generateResponse(issues) {
        if (!AdvisorConfig.isEnabled || issues.length === 0) {
            return ["Semua berjalan lancar, Bos!"];
        }

        const responses = [];

        issues.forEach(issue => {
            let responseText = "";

            // Logika NLP sederhana berdasarkan tipe masalah
            switch (issue.type) {
                case AdvisorConfig.adviceTypes.FINANCIAL:
                    responseText = `⚠️ ${issue.message} (Dana saat ini: $${issue.data.funds})`;
                    break;
                case AdvisorConfig.adviceTypes.MARKETING:
                    responseText = `📈 ${issue.message} Penjualan saat ini: ${issue.data.sales} unit.`;
                    break;
                case AdvisorConfig.adviceTypes.RESEARCH:
                    responseText = `🔬 ${issue.message} (Level Riset: ${issue.data.researchLevel})`;
                    break;
                default:
                    responseText = `ℹ️ ${issue.message}`;
            }

            responses.push(responseText);
        });

        return responses;
    }

    /**
     * Fungsi utama yang dipanggil oleh Game Loop
     * @param {Object} gameState - Data game saat ini
     * @returns {Array} Pesan dari Advisor
     */
    update(gameState) {
        if (this.isProcessing) return [];

        this.isProcessing = true;
        
        // 1. Catat data
        advisorAnalytics.trackData(gameState);
        
        // 2. Analisis data
        const issues = advisorAnalytics.analyze();
        
        // 3. Hasilkan teks balasan
        const messages = this.generateResponse(issues);
        
        this.isProcessing = false;
        
        return messages;
    }
}

// Ekspor sebagai instance tunggal (Singleton)
export const advisorNLP = new AdvisorNLP();
export default advisorNLP;
