// src/systems/Advisor/AdvisorConfig.js

export const AdvisorConfig = {
    // Pengaturan Dasar
    advisorName: "ARIA", // Nama asisten/AI di game Anda
    version: "1.0.0",
    isEnabled: true,

    // Pengaturan NLP (Natural Language Processing)
    nlp: {
        language: "id", // Bahasa Indonesia
        maxResponseLength: 200, // Maksimal karakter balasan
        creativityLevel: 0.7, // 0.0 - 1.0 (semakin tinggi semakin variatif)
    },

    // Pengaturan Analitik
    analytics: {
        trackPlayerBehavior: true,
        updateIntervalMs: 5000, // Seberapa sering AI menganalisis data (dalam milidetik)
        minDataPoints: 10, // Minimal data sebelum AI memberi saran
    },

    // Tipe-tipe saran yang bisa diberikan AI
    adviceTypes: {
        FINANCIAL: "financial_advice", // Saran keuangan/budget
        MARKETING: "marketing_advice", // Saran promosi
        RESEARCH: "research_advice",   // Saran riset produk
        CRISIS: "crisis_management"    // Saran saat perusahaan krisis
    },

    // Bobot prioritas AI saat memilih saran
    priorityWeights: {
        lowFunds: 0.8,
        lowSales: 0.6,
        highCompetition: 0.7
    }
};

export default AdvisorConfig;
