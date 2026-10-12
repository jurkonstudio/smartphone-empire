// FILE: src/data/chip-architecture.data.js
// ============================================================
// DATA ARSITEKTUR CHIP
// Setiap arsitektur punya karakteristik berbeda:
//   - perfMultiplier   : pengali performance
//   - effMultiplier    : pengali efficiency
//   - costMultiplier   : pengali biaya per unit
//   - coresMax         : batas core yang didukung
//   - compatibleOS     : OS yang kompatibel (untuk driver)
// ============================================================

export const CHIP_ARCHITECTURES = [
    {
        id: 'arch_arm_cortex_a',
        name: 'ARM Cortex-A',
        description: 'Arsitektur ARM standar industri, kompatibel luas.',
        minYear: 2003,
        requiresResearch: 'chip_arch_arm_a',
        tier: 1,
        perfMultiplier: 1.0,
        effMultiplier: 1.0,
        costMultiplier: 1.0,
        coresMax: 4,
        compatibleOS: ['own', 'license', 'android'],
        featuresUnlock: []
    },
    {
        id: 'arch_arm_cortex_m',
        name: 'ARM Cortex-M',
        description: 'Arsitektur low-power untuk perangkat hemat daya.',
        minYear: 2005,
        requiresResearch: 'chip_arch_arm_m',
        tier: 1,
        perfMultiplier: 0.85,
        effMultiplier: 1.3,
        costMultiplier: 0.85,
        coresMax: 2,
        compatibleOS: ['own', 'license'],
        featuresUnlock: []
    },
    {
        id: 'arch_x86_mobile',
        name: 'x86 Mobile',
        description: 'Arsitektur Intel untuk perangkat mobile.',
        minYear: 2008,
        requiresResearch: 'chip_arch_x86',
        tier: 2,
        perfMultiplier: 1.25,
        effMultiplier: 0.75,
        costMultiplier: 1.4,
        coresMax: 4,
        compatibleOS: ['own', 'windows'],
        featuresUnlock: []
    },
    {
        id: 'arch_arm_64',
        name: 'ARM 64-bit',
        description: 'Arsitektur ARM 64-bit, standar smartphone modern.',
        minYear: 2013,
        requiresResearch: 'chip_arch_64bit',
        tier: 3,
        perfMultiplier: 1.4,
        effMultiplier: 1.2,
        costMultiplier: 1.3,
        coresMax: 8,
        compatibleOS: ['own', 'license', 'android', 'ios'],
        featuresUnlock: []
    },
    {
        id: 'arch_biglittle',
        name: 'big.LITTLE',
        description: 'Kombinasi core besar & kecil untuk efisiensi adaptif.',
        minYear: 2015,
        requiresResearch: 'chip_arch_biglittle',
        tier: 3,
        perfMultiplier: 1.5,
        effMultiplier: 1.6,
        costMultiplier: 1.5,
        coresMax: 8,
        compatibleOS: ['own', 'license', 'android'],
        featuresUnlock: ['thermal_adaptive']
    },
    {
        id: 'arch_custom_risc',
        name: 'Custom RISC',
        description: 'Arsitektur RISC custom untuk kontrol penuh.',
        minYear: 2017,
        requiresResearch: 'chip_arch_custom_risc',
        tier: 4,
        perfMultiplier: 1.75,
        effMultiplier: 1.55,
        costMultiplier: 1.9,
        coresMax: 12,
        compatibleOS: ['own'],
        featuresUnlock: ['custom_instruction']
    },
    {
        id: 'arch_riscv',
        name: 'RISC-V',
        description: 'Arsitektur open source, bebas lisensi.',
        minYear: 2019,
        requiresResearch: 'chip_arch_riscv',
        tier: 4,
        perfMultiplier: 1.65,
        effMultiplier: 1.7,
        costMultiplier: 1.4,
        coresMax: 16,
        compatibleOS: ['own', 'license'],
        featuresUnlock: ['open_ecosystem']
    },
    {
        id: 'arch_neural',
        name: 'Neural-First',
        description: 'Arsitektur dirancang khusus untuk AI dan LLM lokal.',
        minYear: 2022,
        requiresResearch: 'chip_arch_neural',
        tier: 5,
        perfMultiplier: 2.0,
        effMultiplier: 2.1,
        costMultiplier: 2.5,
        coresMax: 24,
        compatibleOS: ['own'],
        featuresUnlock: ['ai_boost_50']
    }
];

export function getArchitectureById(id) {
    return CHIP_ARCHITECTURES.find(a => a.id === id) || null;
}

export function getAvailableArchitectures(year, completedResearch) {
    const research = completedResearch || [];
    return CHIP_ARCHITECTURES.filter(a => {
        if (typeof a.minYear === 'number' && year < a.minYear) return false;
        if (a.requiresResearch && !research.includes(a.requiresResearch)) return false;
        return true;
    });
}
