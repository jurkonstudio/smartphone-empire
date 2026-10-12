// FILE: src/data/staff.data.js
// ============================================================
// DATA STAFF — nama, skill, trait, role.
// Setiap staff adalah individu dengan identitas sendiri.
// ============================================================

export const ROLES = [
    { id: 'engineer', label: 'Engineer', icon: '🔧', color: '#60a5fa',
      description: 'Mempercepat riset dan pengembangan OS' },
    { id: 'designer', label: 'Designer', icon: '🎨', color: '#a78bfa',
      description: 'Meningkatkan kualitas dan kecepatan desain produk' },
    { id: 'marketer', label: 'Marketer', icon: '📣', color: '#34d399',
      description: 'Memperkuat efektivitas kampanye pemasaran' }
];

export const SKILL_TIERS = [
    { tier: 1, label: 'Pemula',         color: '#949aab', salaryMult: 1.0, bonusMult: 0.5 },
    { tier: 2, label: 'Terampil',       color: '#34d399', salaryMult: 1.4, bonusMult: 1.0 },
    { tier: 3, label: 'Berpengalaman',  color: '#60a5fa', salaryMult: 2.0, bonusMult: 1.6 },
    { tier: 4, label: 'Ahli',           color: '#a78bfa', salaryMult: 2.8, bonusMult: 2.4 },
    { tier: 5, label: 'Legendaris',     color: '#fbbf24', salaryMult: 4.0, bonusMult: 3.5 }
];

export const TRAITS = [
    { id: 'fast_learner', label: 'Cepat Belajar', description: 'Naik skill 50% lebih cepat', color: '#34d399' },
    { id: 'productive',   label: 'Produktif',     description: 'Bonus output +15%',            color: '#60a5fa' },
    { id: 'team_player',  label: 'Kerja Sama',    description: 'Menaikkan moral tim',          color: '#a78bfa' },
    { id: 'innovative',   label: 'Inovatif',      description: 'Peluang ide brilian',          color: '#fbbf24' },
    { id: 'loyal',        label: 'Setia',         description: 'Moral stabil, sulit resign',   color: '#34d399' },
    { id: 'demanding',    label: 'Menuntut',      description: 'Gaji naik cepat, skill top',   color: '#f87171' },
    { id: 'specialist',   label: 'Spesialis',     description: 'Bonus +25% di bidangnya',      color: '#60a5fa' },
    { id: 'mentor',       label: 'Mentor',        description: 'Tim sekitar belajar lebih cepat', color: '#a78bfa' }
];

export const FIRST_NAMES = [
    'Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gilang', 'Hana',
    'Indra', 'Joko', 'Kartika', 'Lina', 'Made', 'Nadia', 'Oka', 'Putri',
    'Rian', 'Sinta', 'Taufik', 'Umar', 'Vina', 'Wahyu', 'Yani', 'Zaki',
    'Ayu', 'Bagas', 'Cahyo', 'Dian', 'Erna', 'Fajar', 'Gita', 'Hendra',
    'Ika', 'Jihan', 'Kevin', 'Lisa', 'Maya', 'Nino', 'Oscar', 'Prita'
];

export const LAST_NAMES = [
    'Wijaya', 'Santoso', 'Hartono', 'Kusuma', 'Pratama', 'Setiawan',
    'Gunawan', 'Halim', 'Firdaus', 'Purnama', 'Maulana', 'Saputra',
    'Nugroho', 'Susanto', 'Wibowo', 'Hidayat', 'Firmansyah', 'Irawan',
    'Siregar', 'Nainggolan', 'Simanjuntak', 'Situmorang', 'Panggabean',
    'Lestari', 'Anggraini', 'Permata', 'Maharani', 'Safitri'
];

export function getRoleById(id) {
    return ROLES.find(r => r.id === id) || ROLES[0];
}

export function getSkillTier(tier) {
    return SKILL_TIERS.find(s => s.tier === tier) || SKILL_TIERS[0];
}

export function getTraitById(id) {
    return TRAITS.find(t => t.id === id) || null;
}

export function generateRandomName() {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return first + ' ' + last;
}

// Pilih 0-2 trait acak, berbobot jarang
export function rollTraits() {
    const count = Math.random() < 0.55 ? 0 : (Math.random() < 0.75 ? 1 : 2);
    if (count === 0) return [];
    const shuffled = [...TRAITS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(t => t.id);
}
