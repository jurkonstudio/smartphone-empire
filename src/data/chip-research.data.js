// FILE: src/data/chip-research.data.js
// ============================================================
// RISET CHIP — 52 node riset khusus chip.
// 6 kategori: Design, Architecture, Process, Graphics/AI,
// Power/Security, Fab & Business.
//
// Setiap node: id, category, name, description, cost, durationDays,
//              prerequisites[], minYear, tier, unlock (data id).
// ============================================================

export const CHIP_RESEARCH_CATEGORIES = [
    { id: 'design',       name: 'Desain',         icon: '📐' },
    { id: 'architecture', name: 'Arsitektur',     icon: '🧩' },
    { id: 'process',      name: 'Fabrikasi',      icon: '⚙️' },
    { id: 'graphics',     name: 'Grafis & AI',    icon: '🤖' },
    { id: 'power',        name: 'Daya & Keamanan',icon: '🔋' },
    { id: 'business',     name: 'Fab & Bisnis',   icon: '🏭' }
];

export const CHIP_RESEARCH_NODES = [
    // ==================== DESIGN (3) ====================
    {
        id: 'chip_design_tool', category: 'design', tier: 1, minYear: 2003,
        name: 'Chip Design Tool',
        description: 'Perangkat lunak EDA untuk mendesain chip.',
        cost: 25000, durationDays: 60, prerequisites: [],
        unlock: { type: 'feature', id: 'chip_lab' }
    },
    {
        id: 'chip_simulation', category: 'design', tier: 2, minYear: 2007,
        name: 'Simulasi Lanjutan',
        description: 'Simulasi thermal & power untuk chip kompleks.',
        cost: 60000, durationDays: 75, prerequisites: ['chip_design_tool'],
        unlock: { type: 'bonus', id: 'yield_bonus_10' }
    },
    {
        id: 'chip_verification', category: 'design', tier: 4, minYear: 2018,
        name: 'Verifikasi Otomatis',
        description: 'Verifikasi formal untuk chip besar (milyaran transistor).',
        cost: 200000, durationDays: 90, prerequisites: ['chip_simulation'],
        unlock: { type: 'bonus', id: 'yield_bonus_15' }
    },

    // ==================== ARCHITECTURE (8) ====================
    {
        id: 'chip_arch_arm_a', category: 'architecture', tier: 1, minYear: 2003,
        name: 'ARM Cortex-A',
        description: 'Arsitektur ARM standar industri.',
        cost: 40000, durationDays: 90, prerequisites: ['chip_design_tool'],
        unlock: { type: 'architecture', id: 'arch_arm_cortex_a' }
    },
    {
        id: 'chip_arch_arm_m', category: 'architecture', tier: 1, minYear: 2005,
        name: 'ARM Cortex-M',
        description: 'Arsitektur low-power ARM.',
        cost: 35000, durationDays: 75, prerequisites: ['chip_arch_arm_a'],
        unlock: { type: 'architecture', id: 'arch_arm_cortex_m' }
    },
    {
        id: 'chip_arch_x86', category: 'architecture', tier: 2, minYear: 2008,
        name: 'x86 Mobile',
        description: 'Arsitektur Intel untuk mobile.',
        cost: 80000, durationDays: 120, prerequisites: ['chip_arch_arm_a'],
        unlock: { type: 'architecture', id: 'arch_x86_mobile' }
    },
    {
        id: 'chip_arch_64bit', category: 'architecture', tier: 3, minYear: 2013,
        name: 'ARM 64-bit',
        description: 'Arsitektur 64-bit modern.',
        cost: 150000, durationDays: 150, prerequisites: ['chip_arch_arm_a', 'node_28'],
        unlock: { type: 'architecture', id: 'arch_arm_64' }
    },
    {
        id: 'chip_arch_biglittle', category: 'architecture', tier: 3, minYear: 2015,
        name: 'big.LITTLE',
        description: 'Kombinasi core besar & kecil.',
        cost: 180000, durationDays: 120, prerequisites: ['chip_arch_64bit'],
        unlock: { type: 'architecture', id: 'arch_biglittle' }
    },
    {
        id: 'chip_arch_custom_risc', category: 'architecture', tier: 4, minYear: 2017,
        name: 'Custom RISC',
        description: 'Arsitektur RISC custom.',
        cost: 260000, durationDays: 180, prerequisites: ['chip_arch_64bit'],
        unlock: { type: 'architecture', id: 'arch_custom_risc' }
    },
    {
        id: 'chip_arch_riscv', category: 'architecture', tier: 4, minYear: 2019,
        name: 'RISC-V',
        description: 'Arsitektur open source.',
        cost: 220000, durationDays: 150, prerequisites: ['chip_arch_64bit'],
        unlock: { type: 'architecture', id: 'arch_riscv' }
    },
    {
        id: 'chip_arch_neural', category: 'architecture', tier: 5, minYear: 2022,
        name: 'Neural-First Architecture',
        description: 'Arsitektur dirancang untuk AI.',
        cost: 500000, durationDays: 240, prerequisites: ['chip_arch_custom_risc', 'chip_npu_gen3'],
        unlock: { type: 'architecture', id: 'arch_neural' }
    },

    // ==================== PROCESS NODE (14) ====================
    {
        id: 'node_180', category: 'process', tier: 1, minYear: 2003,
        name: 'Proses 180nm',
        description: 'Node fabrikasi 180nm.',
        cost: 30000, durationDays: 60, prerequisites: ['chip_design_tool'],
        unlock: { type: 'node', id: 'node_180nm' }
    },
    {
        id: 'node_130', category: 'process', tier: 1, minYear: 2003,
        name: 'Proses 130nm',
        description: 'Node fabrikasi 130nm.',
        cost: 45000, durationDays: 75, prerequisites: ['node_180'],
        unlock: { type: 'node', id: 'node_130nm' }
    },
    {
        id: 'node_90', category: 'process', tier: 1, minYear: 2003,
        name: 'Proses 90nm',
        description: 'Node fabrikasi 90nm.',
        cost: 65000, durationDays: 90, prerequisites: ['node_130'],
        unlock: { type: 'node', id: 'node_90nm' }
    },
    {
        id: 'node_65', category: 'process', tier: 2, minYear: 2005,
        name: 'Proses 65nm',
        description: 'Node fabrikasi 65nm.',
        cost: 90000, durationDays: 105, prerequisites: ['node_90'],
        unlock: { type: 'node', id: 'node_65nm' }
    },
    {
        id: 'node_45', category: 'process', tier: 2, minYear: 2007,
        name: 'Proses 45nm',
        description: 'Node fabrikasi 45nm.',
        cost: 130000, durationDays: 120, prerequisites: ['node_65'],
        unlock: { type: 'node', id: 'node_45nm' }
    },
    {
        id: 'node_32', category: 'process', tier: 3, minYear: 2010,
        name: 'Proses 32nm',
        description: 'Node fabrikasi 32nm.',
        cost: 180000, durationDays: 135, prerequisites: ['node_45'],
        unlock: { type: 'node', id: 'node_32nm' }
    },
    {
        id: 'node_28', category: 'process', tier: 3, minYear: 2011,
        name: 'Proses 28nm',
        description: 'Node fabrikasi 28nm.',
        cost: 220000, durationDays: 150, prerequisites: ['node_32'],
        unlock: { type: 'node', id: 'node_28nm' }
    },
    {
        id: 'node_20', category: 'process', tier: 4, minYear: 2014,
        name: 'Proses 20nm',
        description: 'Node fabrikasi 20nm.',
        cost: 300000, durationDays: 165, prerequisites: ['node_28'],
        unlock: { type: 'node', id: 'node_20nm' }
    },
    {
        id: 'node_14', category: 'process', tier: 4, minYear: 2015,
        name: 'Proses 14nm',
        description: 'Node fabrikasi 14nm FinFET.',
        cost: 400000, durationDays: 180, prerequisites: ['node_20'],
        unlock: { type: 'node', id: 'node_14nm' }
    },
    {
        id: 'node_10', category: 'process', tier: 4, minYear: 2017,
        name: 'Proses 10nm',
        description: 'Node fabrikasi 10nm.',
        cost: 550000, durationDays: 200, prerequisites: ['node_14'],
        unlock: { type: 'node', id: 'node_10nm' }
    },
    {
        id: 'node_7', category: 'process', tier: 5, minYear: 2018,
        name: 'Proses 7nm',
        description: 'Node fabrikasi 7nm EUV.',
        cost: 800000, durationDays: 220, prerequisites: ['node_10'],
        unlock: { type: 'node', id: 'node_7nm' }
    },
    {
        id: 'node_5', category: 'process', tier: 5, minYear: 2020,
        name: 'Proses 5nm',
        description: 'Node fabrikasi 5nm.',
        cost: 1200000, durationDays: 240, prerequisites: ['node_7'],
        unlock: { type: 'node', id: 'node_5nm' }
    },
    {
        id: 'node_3', category: 'process', tier: 5, minYear: 2022,
        name: 'Proses 3nm',
        description: 'Node fabrikasi 3nm GAA.',
        cost: 2000000, durationDays: 280, prerequisites: ['node_5'],
        unlock: { type: 'node', id: 'node_3nm' }
    },
    {
        id: 'node_2', category: 'process', tier: 5, minYear: 2025,
        name: 'Proses 2nm',
        description: 'Node fabrikasi 2nm (batas fisik).',
        cost: 3500000, durationDays: 320, prerequisites: ['node_3'],
        unlock: { type: 'node', id: 'node_2nm' }
    },

    // ==================== GRAPHICS & AI (10) ====================
    {
        id: 'chip_isp_basic', category: 'graphics', tier: 2, minYear: 2005,
        name: 'ISP Dasar',
        description: 'Image Signal Processor.',
        cost: 40000, durationDays: 60, prerequisites: ['chip_design_tool'],
        unlock: { type: 'feature', id: 'isp_basic' }
    },
    {
        id: 'chip_gpu_integrated', category: 'graphics', tier: 2, minYear: 2007,
        name: 'GPU Terintegrasi',
        description: 'GPU on-die.',
        cost: 70000, durationDays: 90, prerequisites: ['chip_isp_basic'],
        unlock: { type: 'feature', id: 'gpu_integrated' }
    },
    {
        id: 'chip_gpu_modern', category: 'graphics', tier: 3, minYear: 2012,
        name: 'GPU Modern',
        description: 'GPU dengan Vulkan/Metal.',
        cost: 140000, durationDays: 120, prerequisites: ['chip_gpu_integrated'],
        unlock: { type: 'feature', id: 'gpu_modern' }
    },
    {
        id: 'chip_ray_tracing', category: 'graphics', tier: 5, minYear: 2021,
        name: 'Ray Tracing',
        description: 'Ray tracing real-time.',
        cost: 350000, durationDays: 200, prerequisites: ['chip_gpu_modern', 'chip_npu_gen2'],
        unlock: { type: 'feature', id: 'ray_tracing' }
    },
    {
        id: 'chip_npu_gen1', category: 'graphics', tier: 4, minYear: 2018,
        name: 'NPU Generasi 1',
        description: 'Neural Processing Unit pertama.',
        cost: 200000, durationDays: 150, prerequisites: ['chip_gpu_modern'],
        unlock: { type: 'feature', id: 'npu_gen1' }
    },
    {
        id: 'chip_npu_gen2', category: 'graphics', tier: 4, minYear: 2020,
        name: 'NPU Generasi 2',
        description: 'NPU dengan throughput 2x.',
        cost: 320000, durationDays: 180, prerequisites: ['chip_npu_gen1'],
        unlock: { type: 'feature', id: 'npu_gen2' }
    },
    {
        id: 'chip_npu_gen3', category: 'graphics', tier: 5, minYear: 2022,
        name: 'NPU Generasi 3',
        description: 'NPU dengan AI on-device lengkap.',
        cost: 500000, durationDays: 210, prerequisites: ['chip_npu_gen2'],
        unlock: { type: 'feature', id: 'npu_gen3' }
    },
    {
        id: 'chip_llm_accelerator', category: 'graphics', tier: 5, minYear: 2023,
        name: 'LLM Accelerator',
        description: 'Akselerator untuk language model lokal.',
        cost: 800000, durationDays: 260, prerequisites: ['chip_npu_gen3'],
        unlock: { type: 'feature', id: 'llm_accelerator' }
    },
    {
        id: 'chip_custom_instruction', category: 'graphics', tier: 4, minYear: 2017,
        name: 'Custom Instructions',
        description: 'Instruksi khusus untuk workload.',
        cost: 180000, durationDays: 140, prerequisites: ['chip_gpu_modern'],
        unlock: { type: 'feature', id: 'custom_instruction' }
    },
    {
        id: 'chip_chiplet', category: 'graphics', tier: 5, minYear: 2021,
        name: 'Chiplet Design',
        description: 'Desain modular chiplet.',
        cost: 600000, durationDays: 220, prerequisites: ['node_7'],
        unlock: { type: 'feature', id: 'chiplet_design' }
    },

    // ==================== POWER & SECURITY (8) ====================
    {
        id: 'chip_dvfs', category: 'power', tier: 1, minYear: 2004,
        name: 'DVFS',
        description: 'Dynamic Voltage & Frequency Scaling.',
        cost: 30000, durationDays: 60, prerequisites: ['chip_design_tool'],
        unlock: { type: 'feature', id: 'dvfs' }
    },
    {
        id: 'chip_thermal_adaptive', category: 'power', tier: 2, minYear: 2008,
        name: 'Thermal Adaptive',
        description: 'Manajemen panas adaptif.',
        cost: 65000, durationDays: 90, prerequisites: ['chip_dvfs'],
        unlock: { type: 'feature', id: 'thermal_adaptive' }
    },
    {
        id: 'chip_low_leakage', category: 'power', tier: 3, minYear: 2012,
        name: 'Low Leakage',
        description: 'Arsitektur low-power.',
        cost: 120000, durationDays: 120, prerequisites: ['chip_thermal_adaptive'],
        unlock: { type: 'feature', id: 'low_leakage' }
    },
    {
        id: 'chip_pmic_advanced', category: 'power', tier: 4, minYear: 2016,
        name: 'PMIC Lanjutan',
        description: 'Power Management IC presisi.',
        cost: 180000, durationDays: 150, prerequisites: ['chip_low_leakage'],
        unlock: { type: 'feature', id: 'pmic_advanced' }
    },
    {
        id: 'chip_secure_enclave', category: 'power', tier: 4, minYear: 2016,
        name: 'Secure Enclave',
        description: 'Enclave terisolasi.',
        cost: 200000, durationDays: 160, prerequisites: ['chip_mem_controller_implied'],
        unlock: { type: 'feature', id: 'secure_enclave' }
    },
    {
        id: 'chip_tpm_integrated', category: 'power', tier: 4, minYear: 2019,
        name: 'TPM Terintegrasi',
        description: 'Trusted Platform Module.',
        cost: 240000, durationDays: 150, prerequisites: ['chip_secure_enclave'],
        unlock: { type: 'feature', id: 'tpm_integrated' }
    },
    {
        id: 'chip_mem_controller_implied', category: 'power', tier: 3, minYear: 2008,
        name: 'Memory Controller',
        description: 'Kontroler memori terintegrasi.',
        cost: 70000, durationDays: 90, prerequisites: ['chip_design_tool'],
        unlock: { type: 'feature', id: 'mem_controller' }
    },
    {
        id: 'chip_cache_large', category: 'power', tier: 3, minYear: 2013,
        name: 'Cache Besar',
        description: 'L3 cache besar.',
        cost: 140000, durationDays: 130, prerequisites: ['chip_mem_controller_implied'],
        unlock: { type: 'feature', id: 'cache_large' }
    },

    // ==================== FAB & BUSINESS (7) ====================
    {
        id: 'fab_construction', category: 'business', tier: 3, minYear: 2010,
        name: 'Konstruksi Fab',
        description: 'Bangun pabrik chip sendiri.',
        cost: 500000, durationDays: 180, prerequisites: ['node_45', 'chip_arch_64bit'],
        unlock: { type: 'fab', id: 'fab_build_unlock' }
    },
    {
        id: 'fab_upgrade_1', category: 'business', tier: 4, minYear: 2014,
        name: 'Upgrade Fab Medium',
        description: 'Perluas fab ke kapasitas medium.',
        cost: 2000000, durationDays: 240, prerequisites: ['fab_construction'],
        unlock: { type: 'fab', id: 'fab_upgrade_medium' }
    },
    {
        id: 'fab_upgrade_2', category: 'business', tier: 5, minYear: 2019,
        name: 'Upgrade Fab Large',
        description: 'Fab skala besar.',
        cost: 8000000, durationDays: 300, prerequisites: ['fab_upgrade_1'],
        unlock: { type: 'fab', id: 'fab_upgrade_large' }
    },
    {
        id: 'chip_licensing', category: 'business', tier: 4, minYear: 2015,
        name: 'Lisensi Chip',
        description: 'Jual chip ke pihak ketiga.',
        cost: 300000, durationDays: 120, prerequisites: ['node_20'],
        unlock: { type: 'feature', id: 'chip_licensing' }
    },
    {
        id: 'chip_wifi6', category: 'business', tier: 5, minYear: 2019,
        name: 'Wi-Fi 6 Chip',
        description: 'Wi-Fi 6 on-die.',
        cost: 220000, durationDays: 150, prerequisites: ['node_10'],
        unlock: { type: 'feature', id: 'wifi6_chip' }
    },
    {
        id: 'chip_modem_5g', category: 'business', tier: 5, minYear: 2020,
        name: 'Modem 5G',
        description: 'Modem 5G terintegrasi.',
        cost: 400000, durationDays: 200, prerequisites: ['node_7'],
        unlock: { type: 'feature', id: 'modem_5g' }
    },
    {
        id: 'chip_satellite', category: 'business', tier: 5, minYear: 2022,
        name: 'Satellite Modem',
        description: 'Konektivitas satelit.',
        cost: 500000, durationDays: 210, prerequisites: ['chip_modem_5g'],
        unlock: { type: 'feature', id: 'satellite' }
    },
    {
        id: 'chip_ai_boost', category: 'business', tier: 5, minYear: 2022,
        name: 'AI Boost',
        description: 'AI acceleration premium.',
        cost: 450000, durationDays: 190, prerequisites: ['chip_npu_gen3'],
        unlock: { type: 'feature', id: 'ai_boost_50' }
    },
    {
        id: 'chip_open_ecosystem', category: 'business', tier: 4, minYear: 2019,
        name: 'Open Ecosystem',
        description: 'Dukungan RISC-V.',
        cost: 200000, durationDays: 130, prerequisites: ['chip_arch_riscv'],
        unlock: { type: 'feature', id: 'open_ecosystem' }
    }
];

// ============================================================
// VALIDASI
// ============================================================
export function validateChipResearch() {
    const issues = [];
    const ids = new Set();
    CHIP_RESEARCH_NODES.forEach(n => {
        if (ids.has(n.id)) issues.push('ID duplikat: ' + n.id);
        ids.add(n.id);
    });
    const validCats = new Set(CHIP_RESEARCH_CATEGORIES.map(c => c.id));
    CHIP_RESEARCH_NODES.forEach(n => {
        if (!validCats.has(n.category)) issues.push('Kategori invalid: ' + n.id);
        (n.prerequisites || []).forEach(p => {
            if (!ids.has(p)) issues.push('Node ' + n.id + ' prereq tidak ada: ' + p);
        });
    });
    if (issues.length) {
        console.warn('[chip-research.data] ' + issues.length + ' masalah:');
        issues.forEach(i => console.warn('  - ' + i));
    } else {
        console.info('[chip-research.data] Validasi OK. ' + CHIP_RESEARCH_NODES.length + ' node.');
    }
    return issues;
}

export function getChipResearchById(id) {
    return CHIP_RESEARCH_NODES.find(n => n.id === id) || null;
}

export function getChipResearchByCategory(catId) {
    return CHIP_RESEARCH_NODES.filter(n => n.category === catId);
}

export function getChipResearchByTier(tier) {
    return CHIP_RESEARCH_NODES.filter(n => n.tier === tier);
      }
