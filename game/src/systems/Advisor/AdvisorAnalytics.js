// src/systems/Advisor/AdvisorAnalytics.js

import AdvisorConfig from './AdvisorConfig.js';

class AdvisorAnalytics {
    constructor() {
        this.dataHistory = [];
        this.maxHistoryLength = 50; 
        this.lastAnalysisTime = 0;
        
        // Memori Jangka Panjang
        this.currentYear = 2000; 
        this.companyHistory = []; // Menyimpan rekap tiap tahun
    }

    /**
     * Mencatat data game saat ini
     * @param {Object} gameState - Harus berisi: year, funds, sales, researchLevel, activeProducts
     */
    trackData(gameState) {
        if (!AdvisorConfig.isEnabled || !AdvisorConfig.analytics.trackPlayerBehavior) return;

        // Cek jika tahun berubah
        if (gameState.year && gameState.year > this.currentYear) {
            this.recordNewYear(gameState);
            this.currentYear = gameState.year;
        }

        const snapshot = {
            timestamp: Date.now(),
            year: gameState.year || this.currentYear,
            funds: gameState.funds || 0,
            sales: gameState.sales || 0,
            researchLevel: gameState.researchLevel || 1,
            activeProducts: gameState.activeProducts || 0
        };

        this.dataHistory.push(snapshot);
        if (this.dataHistory.length > this.maxHistoryLength) {
            this.dataHistory.shift();
        }
    }

    /**
     * Mencatat ringkasan di akhir tahun
     */
    recordNewYear(gameState) {
        const summary = `Thn ${this.currentYear}: Dana $${gameState.funds}, ${gameState.activeProducts} produk aktif.`;
        this.companyHistory.push(summary);
        
        // Simpan maksimal 10 tahun terakhir agar memori tidak penuh
        if (this.companyHistory.length > 10) {
            this.companyHistory.shift();
        }
    }

    /**
     * Menganalisis data dengan konteks waktu (Era 2000 - 2026)
     */
    analyze() {
        const now = Date.now();
        if (now - this.lastAnalysisTime < AdvisorConfig.analytics.updateIntervalMs) return [];
        
        this.lastAnalysisTime = now;
        if (this.dataHistory.length < AdvisorConfig.analytics.minDataPoints) return [];

        const issues = [];
        const current = this.dataHistory[this.dataHistory.length - 1];
        
        // --- LOGIKA BERDASARKAN ERA TAHUN ---
        if (current.year >= 2000 && current.year <= 2009) {
            if (current.researchLevel < 2) {
                issues.push({
                    type: AdvisorConfig.adviceTypes.RESEARCH,
                    severity: 'medium',
                    message: `Di era ${current.year}, persaingan HP belum terlalu ketat. Cepat riset untuk kembangkan fitur dasar (baterai/kamera).`,
                    data: { year: current.year }
                });
            }
        } 
        else if (current.year >= 2010 && current.year <= 2019) {
            issues.push({
                type: AdvisorConfig.adviceTypes.MARKETING,
                severity: 'medium',
                message: `Tahun ${current.year}, tren layar sentuh sedang naik! Pastikan produk kita punya touchscreen atau kita akan tertinggal.`,
                data: { year: current.year }
            });
        } 
        else if (current.year >= 2020 && current.year <= 2026) {
            issues.push({
                type: AdvisorConfig.adviceTypes.RESEARCH,
                severity: 'high',
                message: `Tahun ${current.year}, pasar sangat ketat. Kita butuh inovasi AI, 5G, atau layar lipat untuk bertahan!`,
                data: { year: current.year }
            });
        }

        // Logika Keuangan
        if (current.funds < 1000) {
            issues.push({
                type: AdvisorConfig.adviceTypes.FINANCIAL,
                severity: 'high',
                message: `Dana menipis di tahun ${current.year}. Tunda ekspansi, fokus jualan produk lama!`,
                data: { funds: current.funds }
            });
        }

        return issues;
    }

    getHistoricalContext() {
        return this.companyHistory.join(" | ");
    }
    
    // Fungsi untuk mengambil data terbaru (dipakai untuk chat)
    getLatestData() {
        if (this.dataHistory.length === 0) return { funds: 0, sales: 0, year: this.currentYear };
        return this.dataHistory[this.dataHistory.length - 1];
    }
}

export const advisorAnalytics = new AdvisorAnalytics();
export default advisorAnalytics;
