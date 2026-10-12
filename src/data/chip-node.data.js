// FILE: src/data/chip-node.data.js
// ============================================================
// DATA PROCESS NODE — fabrikasi chip.
// Semakin kecil node (nm), semakin efisien & mahal.
// ============================================================

export const CHIP_NODES = [
    { id: 'node_180nm', name: '180nm', minYear: 2000, requiresResearch: 'node_180',
      tier: 1, perfBonus: 0.7, effBonus: 0.7, costBase: 8, fabComplexity: 1, yieldBase: 0.95 },

    { id: 'node_130nm', name: '130nm', minYear: 2001, requiresResearch: 'node_130',
      tier: 1, perfBonus: 0.85, effBonus: 0.85, costBase: 12, fabComplexity: 1, yieldBase: 0.92 },

    { id: 'node_90nm', name: '90nm', minYear: 2003, requiresResearch: 'node_90',
      tier: 2, perfBonus: 1.0, effBonus: 1.0, costBase: 18, fabComplexity: 2, yieldBase: 0.88 },

    { id: 'node_65nm', name: '65nm', minYear: 2005, requiresResearch: 'node_65',
      tier: 2, perfBonus: 1.15, effBonus: 1.2, costBase: 26, fabComplexity: 2, yieldBase: 0.85 },

    { id: 'node_45nm', name: '45nm', minYear: 2007, requiresResearch: 'node_45',
      tier: 3, perfBonus: 1.35, effBonus: 1.4, costBase: 40, fabComplexity: 3, yieldBase: 0.82 },

    { id: 'node_32nm', name: '32nm', minYear: 2010, requiresResearch: 'node_32',
      tier: 3, perfBonus: 1.5, effBonus: 1.55, costBase: 55, fabComplexity: 3, yieldBase: 0.80 },

    { id: 'node_28nm', name: '28nm', minYear: 2011, requiresResearch: 'node_28',
      tier: 3, perfBonus: 1.6, effBonus: 1.65, costBase: 70, fabComplexity: 3, yieldBase: 0.78 },

    { id: 'node_20nm', name: '20nm', minYear: 2014, requiresResearch: 'node_20',
      tier: 4, perfBonus: 1.85, effBonus: 1.9, costBase: 95, fabComplexity: 4, yieldBase: 0.75 },

    { id: 'node_14nm', name: '14nm', minYear: 2015, requiresResearch: 'node_14',
      tier: 4, perfBonus: 2.1, effBonus: 2.2, costBase: 130, fabComplexity: 4, yieldBase: 0.72 },

    { id: 'node_10nm', name: '10nm', minYear: 2017, requiresResearch: 'node_10',
      tier: 4, perfBonus: 2.4, effBonus: 2.6, costBase: 180, fabComplexity: 5, yieldBase: 0.68 },

    { id: 'node_7nm', name: '7nm', minYear: 2018, requiresResearch: 'node_7',
      tier: 5, perfBonus: 2.8, effBonus: 3.1, costBase: 240, fabComplexity: 5, yieldBase: 0.65 },

    { id: 'node_5nm', name: '5nm', minYear: 2020, requiresResearch: 'node_5',
      tier: 5, perfBonus: 3.2, effBonus: 3.6, costBase: 320, fabComplexity: 6, yieldBase: 0.60 },

    { id: 'node_3nm', name: '3nm', minYear: 2022, requiresResearch: 'node_3',
      tier: 5, perfBonus: 3.8, effBonus: 4.2, costBase: 450, fabComplexity: 6, yieldBase: 0.55 },

    { id: 'node_2nm', name: '2nm', minYear: 2025, requiresResearch: 'node_2',
      tier: 5, perfBonus: 4.5, effBonus: 5.0, costBase: 650, fabComplexity: 7, yieldBase: 0.50 }
];

export function getChipNodeById(id) {
    return CHIP_NODES.find(n => n.id === id) || null;
}

export function getAvailableChipNodes(year, completedResearch) {
    const research = completedResearch || [];
    return CHIP_NODES.filter(n => {
        if (typeof n.minYear === 'number' && year < n.minYear) return false;
        if (n.requiresResearch && !research.includes(n.requiresResearch)) return false;
        return true;
    });
}
