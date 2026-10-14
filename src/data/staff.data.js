// FILE: src/data/staff.data.js
// v2027.7a — Sistem kandidat internasional + profil lengkap.
// 7 region: US, EU, JP, KR, CN, IN, ID. Distribusi per era.
// ============================================================

export const ROLES = [
    { id: 'engineer', label: 'Engineer', icon: 'cpu',       color: '#60a5fa',
      description: 'Mempercepat riset dan pengembangan OS' },
    { id: 'designer', label: 'Designer', icon: 'palette',   color: '#a78bfa',
      description: 'Meningkatkan kualitas dan kecepatan desain produk' },
    { id: 'marketer', label: 'Marketer', icon: 'signal',    color: '#34d399',
      description: 'Memperkuat efektivitas kampanye pemasaran' }
];

export const SKILL_TIERS = [
    { tier: 1, label: 'Junior',    color: '#949aab', salaryMult: 1.0, bonusMult: 0.5 },
    { tier: 2, label: 'Mid-level', color: '#34d399', salaryMult: 1.4, bonusMult: 1.0 },
    { tier: 3, label: 'Senior',    color: '#60a5fa', salaryMult: 2.0, bonusMult: 1.6 },
    { tier: 4, label: 'Lead',      color: '#a78bfa', salaryMult: 2.8, bonusMult: 2.4 },
    { tier: 5, label: 'Principal', color: '#fbbf24', salaryMult: 4.0, bonusMult: 3.5 }
];

export const TRAITS = [
    { id: 'fast_learner', label: 'Fast Learner',   description: 'Naik skill 50% lebih cepat',            color: '#34d399', icon: 'zap' },
    { id: 'productive',   label: 'Productive',     description: 'Bonus output +15%',                     color: '#60a5fa', icon: 'activity' },
    { id: 'team_player',  label: 'Team Player',    description: 'Menaikkan moral tim',                   color: '#a78bfa', icon: 'heart' },
    { id: 'innovative',   label: 'Innovative',     description: 'Peluang ide brilian',                   color: '#fbbf24', icon: 'sparkles' },
    { id: 'loyal',        label: 'Loyal',          description: 'Moral stabil, sulit resign',            color: '#34d399', icon: 'shield' },
    { id: 'demanding',    label: 'Demanding',      description: 'Gaji naik cepat, skill top',            color: '#f87171', icon: 'warn' },
    { id: 'specialist',   label: 'Specialist',     description: 'Bonus +25% di bidangnya',               color: '#60a5fa', icon: 'target' },
    { id: 'mentor',       label: 'Mentor',         description: 'Tim sekitar belajar lebih cepat',       color: '#a78bfa', icon: 'users' }
];

// ============================================================
// REGION — 7 grup etnis/nasional
// ============================================================
export const COUNTRIES = {
    us:  { id: 'us',  label: 'United States', flag: '🇺🇸' },
    eu:  { id: 'eu',  label: 'Europe',        flag: '🇪🇺' },
    jp:  { id: 'jp',  label: 'Japan',         flag: '🇯🇵' },
    kr:  { id: 'kr',  label: 'South Korea',   flag: '🇰🇷' },
    cn:  { id: 'cn',  label: 'China',         flag: '🇨🇳' },
    in:  { id: 'in',  label: 'India',         flag: '🇮🇳' },
    id:  { id: 'id',  label: 'Indonesia',     flag: '🇮🇩' }
};

// Distribusi per era (dalam urutan key region).
// 2000-an dominan US/EU/JP, makin beragam menjelang 2026.
const REGION_WEIGHTS = {
    early: { us: 0.35, eu: 0.25, jp: 0.20, kr: 0.10, cn: 0.05, in: 0.03, id: 0.02 },
    mid:   { us: 0.25, eu: 0.18, jp: 0.18, kr: 0.15, cn: 0.10, in: 0.08, id: 0.06 },
    late:  { us: 0.20, eu: 0.15, jp: 0.15, kr: 0.18, cn: 0.12, in: 0.12, id: 0.08 }
};

// ============================================================
// NAMA PER REGION
// ============================================================
const NAMES = {
    us: {
        first: ['Michael','Sarah','James','Emma','David','Olivia','Robert','Sophia','William','Ava',
                'Daniel','Mia','Christopher','Charlotte','Matthew','Amelia','Lucas','Isabella','Henry','Evelyn',
                'Ethan','Harper','Alexander','Abigail','Benjamin','Emily','Sebastian','Elizabeth','Jack','Sofia'],
        last:  ['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Anderson','Taylor',
                'Thomas','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark','Lewis',
                'Walker','Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams']
    },
    eu: {
        first: ['Lars','Anna','Klaus','Marie','Pierre','Sophie','Hans','Emma','Otto','Clara',
                'Lucas','Hannah','Felix','Lena','Erik','Giovanni','Sofia','Matteo','Charlotte','Nikolai',
                'Anders','Ingrid','Mathieu','Camille','Felix','Johanna','Stefan','Petra','Jan','Eva'],
        last:  ['Müller','Schmidt','Dubois','Bernard','Larsson','Andersson','Rossi','Russo','Novak','Kowalski',
                'Weber','Fischer','Schneider','Ferrari','Costa','Moreau','Petrov','Popović','Johansson','Nilsson',
                'Bakker','Visser','Jansen','Meyer','Wagner','Becker','Hoffmann','Schulz','Koch','Richter']
    },
    jp: {
        first: ['Haruki','Yuki','Sota','Aoi','Ren','Yui','Kaito','Hina','Riku','Sakura',
                'Yuto','Mizuki','Sora','Kokoro','Kenta','Akari','Ryo','Emi','Souta','Nao',
                'Daiki','Hana','Kaito','Rin','Shota','Miyu','Taichi','Yuna','Hayato','Ayaka'],
        last:  ['Tanaka','Sato','Suzuki','Takahashi','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato',
                'Yoshida','Yamada','Sasaki','Matsumoto','Inoue','Kimura','Hayashi','Shimizu','Yamaguchi','Mori',
                'Abe','Ikeda','Hashimoto','Ishikawa','Ogawa','Goto','Okada','Hasegawa','Murakami','Kondo']
    },
    kr: {
        first: ['Min-jun','Ji-woo','Seo-yeon','Do-yun','Ha-eun','Ji-ho','Ye-rin','Jun-seo','Soo-ah','Tae-yang',
                'Ye-jun','Na-eun','Si-woo','Da-eun','Hyun-woo','Ji-min','Yu-jin','Su-bin','Ha-jun','Seo-jun',
                'Eun-woo','Da-hyun','Jun-ho','Ye-seul','Seung-min','Ha-yoon','Do-hyun','Ji-a','Min-seo','Jun-hyuk'],
        last:  ['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim',
                'Han','Oh','Seo','Shin','Kwon','Hwang','Ahn','Yoo','Song','Hong',
                'Jeon','Ko','Moon','Yang','Bae','Baek','Nam','Ryu','Sim','No']
    },
    cn: {
        first: ['Wei','Mei','Chen','Lin','Ming','Ling','Hao','Xiu','Jun','Ying',
                'Lei','Fang','Tao','Yun','Bo','Lan','Kai','Qing','Feng','Hui',
                'Jian','Yan','Bin','Ping','Gang','Xin','Hao','Lian','Jun','Xia'],
        last:  ['Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou',
                'Xu','Sun','Ma','Zhu','Hu','Guo','He','Gao','Lin','Luo',
                'Zheng','Liang','Xie','Song','Tang','Han','Feng','Deng','Cao','Peng']
    },
    in: {
        first: ['Arjun','Priya','Raj','Ananya','Vikram','Deepa','Rohan','Kavya','Aryan','Diya',
                'Karan','Isha','Aditya','Sanya','Vihaan','Anaya','Reyansh','Aadhya','Krishna','Nisha',
                'Aarav','Anika','Vivaan','Myra','Advait','Saanvi','Dhruv','Anvi','Rudra','Prisha'],
        last:  ['Sharma','Patel','Kumar','Singh','Gupta','Reddy','Verma','Joshi','Agarwal','Iyer',
                'Rao','Nair','Das','Mukherjee','Chatterjee','Banerjee','Menon','Pillai','Chopra','Kapoor',
                'Mehta','Shah','Desai','Bhatia','Malhotra','Sinha','Roy','Bose','Sengupta','Mishra']
    },
    id: {
        first: ['Andi','Budi','Citra','Dewi','Eko','Fitri','Gilang','Hana','Indra','Joko',
                'Kartika','Lina','Made','Nadia','Oka','Putri','Rian','Sinta','Taufik','Umar',
                'Ayu','Bagas','Cahyo','Dian','Erna','Fajar','Gita','Hendra','Ika','Jihan'],
        last:  ['Wijaya','Santoso','Hartono','Kusuma','Pratama','Setiawan','Gunawan','Halim','Firdaus','Purnama',
                'Maulana','Saputra','Nugroho','Susanto','Wibowo','Hidayat','Firmansyah','Irawan','Siregar','Lestari',
                'Anggraini','Permata','Maharani','Safitri','Simanjuntak','Nainggolan','Panggabean','Situmorang','Hutapea','Samosir']
    }
};

// ============================================================
// SPECIALTY per role
// ============================================================
export const SPECIALTIES = {
    engineer: [
        'Chip Architecture', 'OS Kernel', 'Radio Systems', 'AI / ML',
        'Battery Systems', 'Display Engineering', 'Camera Systems', 'Embedded Firmware',
        'Thermal Design', 'Antenna Design'
    ],
    designer: [
        'Mobile UI', 'Hardware Design', 'Brand Identity', 'UX Research',
        'Product Design', 'Industrial Design', 'Motion Design', 'Iconography',
        'Typography', 'Packaging'
    ],
    marketer: [
        'Brand Strategy', 'Social Media', 'Retail Channels', 'Influencer Marketing',
        'PR & Communications', 'Performance Marketing', 'Content Strategy', 'Community Growth',
        'Analytics', 'Partnership'
    ]
};

export const BACKGROUNDS = [
    'Ex-Samsung', 'Ex-Nokia', 'Ex-Apple', 'Ex-Xiaomi', 'Ex-Huawei',
    'Ex-LG', 'Ex-Sony', 'Ex-Motorola', 'Ex-Google', 'Ex-Qualcomm',
    'Ex-ARM', 'Ex-TSMC', 'Ex-OnePlus', 'Ex-Oppo', 'Ex-Vivo',
    'Startup Founder', 'Fresh Graduate', 'Freelance', 'Consultant', 'Academy'
];

// ============================================================
// HELPER
// ============================================================
export function getRoleById(id) {
    return ROLES.find(r => r.id === id) || ROLES[0];
}

export function getSkillTier(tier) {
    return SKILL_TIERS.find(s => s.tier === tier) || SKILL_TIERS[0];
}

export function getTraitById(id) {
    return TRAITS.find(t => t.id === id) || null;
}

export function getCountryById(id) {
    return COUNTRIES[id] || COUNTRIES.us;
}

export function pickRegionForYear(year) {
    let w;
    if (year <= 2005) w = REGION_WEIGHTS.early;
    else if (year <= 2015) w = REGION_WEIGHTS.mid;
    else w = REGION_WEIGHTS.late;

    const roll = Math.random();
    let cum = 0;
    const keys = ['us', 'eu', 'jp', 'kr', 'cn', 'in', 'id'];
    for (let i = 0; i < keys.length; i++) {
        cum += w[keys[i]] || 0;
        if (roll < cum) return keys[i];
    }
    return 'us';
}

export function generateNameForRegion(regionId) {
    const pool = NAMES[regionId] || NAMES.us;
    const first = pool.first[Math.floor(Math.random() * pool.first.length)];
    const last  = pool.last[Math.floor(Math.random() * pool.last.length)];
    return first + ' ' + last;
}

export function generateRandomName() {
    // Backward-compat: pakai US pool default.
    return generateNameForRegion('us');
}

export function pickSpecialty(roleId) {
    const list = SPECIALTIES[roleId] || SPECIALTIES.engineer;
    return list[Math.floor(Math.random() * list.length)];
}

export function pickBackground() {
    return BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
}

export function rollExperience(tier) {
    // Tier 1-5 → 0-25 tahun
    const ranges = { 1: [0, 3], 2: [3, 6], 3: [6, 10], 4: [10, 15], 5: [15, 25] };
    const r = ranges[tier] || ranges[1];
    return r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));
}

export function rollAge(tier, experience) {
    const base = { 1: 22, 2: 25, 3: 28, 4: 32, 5: 38 }[tier] || 22;
    const variance = Math.floor(Math.random() * 4);
    return Math.min(65, base + variance + Math.min(3, Math.floor(experience / 5)));
}

// Pilih 0-2 trait acak
export function rollTraits() {
    const count = Math.random() < 0.55 ? 0 : (Math.random() < 0.75 ? 1 : 2);
    if (count === 0) return [];
    const shuffled = [...TRAITS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(t => t.id);
}
