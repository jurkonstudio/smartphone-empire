// FILE: src/data/chip-features.data.js
// ============================================================
// DATA FITUR CHIP — 23 fitur dalam 7 kategori.
// ============================================================

export const CHIP_FEATURES = [
    // ==================== GRAPHICS ====================
    { id: 'isp_basic', name: 'ISP Dasar', category: 'graphics',
      description: 'Image Signal Processor untuk kamera.',
      minYear: 2005, requiresResearch: 'chip_isp_basic',
      costPerUnit: 3, statBonus: { camera: 8 } },

    { id: 'gpu_integrated', name: 'GPU Terintegrasi', category: 'graphics',
      description: 'GPU on-die untuk gaming dan UI.',
      minYear: 2007, requiresResearch: 'chip_gpu_integrated',
      costPerUnit: 6, statBonus: { performance: 5, display: 4 } },

    { id: 'gpu_modern', name: 'GPU Modern', category: 'graphics',
      description: 'GPU dengan support Vulkan/Metal.',
      minYear: 2012, requiresResearch: 'chip_gpu_modern',
      costPerUnit: 12, statBonus: { performance: 10, display: 6 } },

    { id: 'ray_tracing', name: 'Ray Tracing', category: 'graphics',
      description: 'Ray tracing real-time untuk gaming.',
      minYear: 2021, requiresResearch: 'chip_ray_tracing',
      costPerUnit: 30, statBonus: { performance: 15 } },

    // ==================== MEMORY ====================
    { id: 'mem_controller', name: 'Memory Controller', category: 'memory',
      description: 'Kontroler memori terintegrasi.',
      minYear: 2008, requiresResearch: 'chip_mem_controller_implied',
      costPerUnit: 4, statBonus: { performance: 6, quality: 3 } },

    { id: 'cache_large', name: 'Cache Besar', category: 'memory',
      description: 'L3 cache besar untuk performa.',
      minYear: 2013, requiresResearch: 'chip_cache_large',
      costPerUnit: 8, statBonus: { performance: 8 } },

    // ==================== POWER ====================
    { id: 'dvfs', name: 'DVFS', category: 'power',
      description: 'Dynamic Voltage & Frequency Scaling.',
      minYear: 2004, requiresResearch: 'chip_dvfs',
      costPerUnit: 2, statBonus: { battery: 8 } },

    { id: 'thermal_adaptive', name: 'Thermal Adaptive', category: 'power',
      description: 'Manajemen panas adaptif.',
      minYear: 2008, requiresResearch: 'chip_thermal_adaptive',
      costPerUnit: 5, statBonus: { battery: 5, quality: 4 } },

    { id: 'low_leakage', name: 'Low Leakage', category: 'power',
      description: 'Arsitektur low-power consumption.',
      minYear: 2012, requiresResearch: 'chip_low_leakage',
      costPerUnit: 9, statBonus: { battery: 12 } },

    { id: 'pmic_advanced', name: 'PMIC Lanjutan', category: 'power',
      description: 'Power Management IC presisi.',
      minYear: 2016, requiresResearch: 'chip_pmic_advanced',
      costPerUnit: 14, statBonus: { battery: 10, quality: 5 } },

    // ==================== SECURITY ====================
    { id: 'secure_enclave', name: 'Secure Enclave', category: 'security',
      description: 'Enclave terisolasi untuk data sensitif.',
      minYear: 2016, requiresResearch: 'chip_secure_enclave',
      costPerUnit: 8, statBonus: { quality: 8, connectivity: 3 } },

    { id: 'tpm_integrated', name: 'TPM Terintegrasi', category: 'security',
      description: 'Trusted Platform Module terintegrasi.',
      minYear: 2019, requiresResearch: 'chip_tpm_integrated',
      costPerUnit: 10, statBonus: { quality: 10 } },

    // ==================== AI ====================
    { id: 'npu_gen1', name: 'NPU Gen 1', category: 'ai',
      description: 'Neural Processing Unit generasi pertama.',
      minYear: 2018, requiresResearch: 'chip_npu_gen1',
      costPerUnit: 15, statBonus: { performance: 12, camera: 6 } },

    { id: 'npu_gen2', name: 'NPU Gen 2', category: 'ai',
      description: 'NPU dengan throughput 2x.',
      minYear: 2020, requiresResearch: 'chip_npu_gen2',
      costPerUnit: 22, statBonus: { performance: 18, camera: 10 } },

    { id: 'npu_gen3', name: 'NPU Gen 3', category: 'ai',
      description: 'NPU dengan AI on-device lengkap.',
      minYear: 2022, requiresResearch: 'chip_npu_gen3',
      costPerUnit: 35, statBonus: { performance: 25, camera: 15 } },

    { id: 'llm_accelerator', name: 'LLM Accelerator', category: 'ai',
      description: 'Akselerator untuk language model lokal.',
      minYear: 2023, requiresResearch: 'chip_llm_accelerator',
      costPerUnit: 50, statBonus: { performance: 30, camera: 20 } },

    // ==================== CONNECTIVITY ====================
    { id: 'lte_modem', name: 'LTE Modem Terintegrasi', category: 'connectivity',
      description: 'Modem 4G on-die.',
      minYear: 2012, requiresResearch: 'chip_lte_modem',
      costPerUnit: 18, statBonus: { connectivity: 20 } },

    { id: 'wifi6_chip', name: 'Wi-Fi 6 Chip', category: 'connectivity',
      description: 'Wi-Fi 6 terintegrasi on-die.',
      minYear: 2019, requiresResearch: 'chip_wifi6',
      costPerUnit: 12, statBonus: { connectivity: 18 } },

    { id: 'modem_5g', name: 'Modem 5G', category: 'connectivity',
      description: 'Modem 5G terintegrasi.',
      minYear: 2020, requiresResearch: 'chip_modem_5g',
      costPerUnit: 30, statBonus: { connectivity: 35 } },

    { id: 'satellite', name: 'Satellite Modem', category: 'connectivity',
      description: 'Konektivitas satelit darurat.',
      minYear: 2022, requiresResearch: 'chip_satellite',
      costPerUnit: 40, statBonus: { connectivity: 15, quality: 8 } },

    // ==================== SPECIAL ====================
    { id: 'custom_instruction', name: 'Custom Instructions', category: 'special',
      description: 'Instruksi khusus untuk workload.',
      minYear: 2017, requiresResearch: 'chip_custom_instruction',
      costPerUnit: 20, statBonus: { performance: 15 } },

    { id: 'open_ecosystem', name: 'Open Ecosystem', category: 'special',
      description: 'Dukungan ekosistem terbuka RISC-V.',
      minYear: 2019, requiresResearch: 'chip_open_ecosystem',
      costPerUnit: 8, statBonus: { connectivity: 6, quality: 4 } },

    { id: 'chiplet_design', name: 'Chiplet Design', category: 'special',
      description: 'Desain modular chiplet untuk scaling.',
      minYear: 2021, requiresResearch: 'chip_chiplet',
      costPerUnit: 45, statBonus: { performance: 20, quality: 10 } },

    { id: 'ai_boost_50', name: 'AI Boost', category: 'special',
      description: 'AI acceleration premium.',
      minYear: 2022, requiresResearch: 'chip_ai_boost',
      costPerUnit: 25, statBonus: { performance: 22, camera: 12 } }
];

export const FEATURE_CATEGORIES = [
    { id: 'graphics',     name: 'Grafis',       icon: '🎮' },
    { id: 'memory',       name: 'Memori',       icon: '💾' },
    { id: 'power',        name: 'Daya',         icon: '🔋' },
    { id: 'security',     name: 'Keamanan',     icon: '🛡️' },
    { id: 'ai',           name: 'Kecerdasan',   icon: '🤖' },
    { id: 'connectivity', name: 'Konektivitas', icon: '📡' },
    { id: 'special',      name: 'Spesial',      icon: '⚡' }
];

export function getChipFeatureById(id) {
    return CHIP_FEATURES.find(f => f.id === id) || null;
}

export function getFeaturesByCategory(catId) {
    return CHIP_FEATURES.filter(f => f.category === catId);
}

export function getAvailableChipFeatures(year, completedResearch) {
    const research = completedResearch || [];
    return CHIP_FEATURES.filter(f => {
        if (typeof f.minYear === 'number' && year < f.minYear) return false;
        if (f.requiresResearch && !research.includes(f.requiresResearch)) return false;
        return true;
    });
}
