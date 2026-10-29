// FILE: src/data/staff.data.js
// v2027.8a — Kandidat internasional + bahasa game.
// 9 region: US, EU, JP, KR, CN, IN, ID, RU, LATAM.
// Region yang berbahasa sama dengan bahasa game mendapat bobot lebih besar
// (lihat LANG_REGIONS & pickRegionForYear).
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
// REGION — 9 grup etnis/nasional
// ============================================================
export const COUNTRIES = {
    us:    { id: 'us',    label: 'United States', flag: '🇺🇸' },
    eu:    { id: 'eu',    label: 'Europe',        flag: '🇪🇺' },
    jp:    { id: 'jp',    label: 'Japan',         flag: '🇯🇵' },
    kr:    { id: 'kr',    label: 'South Korea',   flag: '🇰🇷' },
    cn:    { id: 'cn',    label: 'China',         flag: '🇨🇳' },
    in:    { id: 'in',    label: 'India',         flag: '🇮🇳' },
    id:    { id: 'id',    label: 'Indonesia',     flag: '🇮🇩' },
    ru:    { id: 'ru',    label: 'Russia',        flag: '🇷🇺' },
    latam: { id: 'latam', label: 'Latin America', flag: '🌎' }
};

// Nama negara sesuai bahasa game (fallback ke label Inggris).
const COUNTRY_LABELS = {
    id: {
        us: 'Amerika Serikat', eu: 'Eropa', jp: 'Jepang', kr: 'Korea Selatan', cn: 'Tiongkok',
        in: 'India', id: 'Indonesia', ru: 'Rusia', latam: 'Amerika Latin'
    },
    es: {
        us: 'Estados Unidos', eu: 'Europa', jp: 'Japón', kr: 'Corea del Sur', cn: 'China',
        in: 'India', id: 'Indonesia', ru: 'Rusia', latam: 'Latinoamérica'
    },
    ru: {
        us: 'США', eu: 'Европа', jp: 'Япония', kr: 'Южная Корея', cn: 'Китай',
        in: 'Индия', id: 'Индонезия', ru: 'Россия', latam: 'Латинская Америка'
    },
    zh: {
        us: '美国', eu: '欧洲', jp: '日本', kr: '韩国', cn: '中国',
        in: '印度', id: '印度尼西亚', ru: '俄罗斯', latam: '拉丁美洲'
    }
};

// Bahasa game → region yang paling sesuai. Kandidat dari region ini
// dipilih lebih sering agar pemain melihat lebih banyak orang yang
// bisa berkomunikasi dalam bahasa yang sama.
export const LANG_REGIONS = {
    id: ['id'],
    en: ['us', 'in', 'eu'],
    es: ['latam', 'eu'],
    pt: ['latam'],
    ru: ['ru'],
    pl: ['eu'],
    it: ['eu'],
    de: ['eu'],
    zh: ['cn'],
    ko: ['kr'],
    ja: ['jp'],
    hi: ['in']
};

// Bobot dasar per era (urutan key = urutan pengecekan).
const REGION_WEIGHTS = {
    early: { us: 0.30, eu: 0.22, jp: 0.18, kr: 0.08, cn: 0.05, in: 0.03, id: 0.02, ru: 0.07, latam: 0.05 },
    mid:   { us: 0.22, eu: 0.16, jp: 0.15, kr: 0.13, cn: 0.09, in: 0.07, id: 0.05, ru: 0.06, latam: 0.07 },
    late:  { us: 0.18, eu: 0.13, jp: 0.12, kr: 0.15, cn: 0.10, in: 0.10, id: 0.07, ru: 0.05, latam: 0.10 }
};

// Pengali bobot untuk region yang cocok dengan bahasa game.
const LANG_BOOST = 2.5;

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
    },
    ru: {
        first: ['Ivan','Olga','Dmitri','Natalia','Sergei','Elena','Alexei','Anastasia','Mikhail','Irina',
                'Andrei','Tatiana','Pavel','Yulia','Nikita','Svetlana','Maksim','Ekaterina','Artem','Daria',
                'Vladimir','Polina','Roman','Marina','Egor','Anna','Konstantin','Vera','Viktor','Lyudmila'],
        last:  ['Ivanov','Smirnov','Kuznetsov','Popov','Vasiliev','Petrov','Sokolov','Mikhailov','Novikov','Fedorov',
                'Morozov','Volkov','Alekseev','Lebedev','Semenov','Egorov','Pavlov','Kozlov','Stepanov','Nikolaev',
                'Orlov','Andreev','Makarov','Zakharov','Zaitsev','Sokolova','Kovalenko','Bondarenko','Shevchenko','Tkachenko']
    },
    latam: {
        first: ['Mateo','Valentina','Santiago','Camila','Sebastián','Lucía','Diego','Sofía','Andrés','Mariana',
                'Joaquín','Isabella','Nicolás','Gabriela','Thiago','Antonella','Rafael','Julieta','Gustavo','Beatriz',
                'Emiliano','Renata','Felipe','Paula','Bruno','Valeria','Alejandro','Fernanda','Lorenzo','Daniela'],
        last:  ['García','Rodríguez','Martínez','López','González','Hernández','Pérez','Sánchez','Ramírez','Torres',
                'Flores','Rivera','Gómez','Díaz','Silva','Souza','Oliveira','Costa','Pereira','Almeida',
                'Morales','Ortiz','Castillo','Mendoza','Vargas','Reyes','Cruz','Ruiz','Herrera','Medina']
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

// Label negara mengikuti bahasa game; fallback ke bahasa Inggris.
export function getCountryById(id, lang) {
    const base = COUNTRIES[id] || COUNTRIES.us;
    const localized = COUNTRY_LABELS[lang] && COUNTRY_LABELS[lang][base.id];
    return { ...base, label: localized || base.label };
}

// Bobot era + boost bahasa, lalu pilih satu region secara acak.
export function pickRegionForYear(year, lang) {
    let base;
    if (year <= 2005) base = REGION_WEIGHTS.early;
    else if (year <= 2015) base = REGION_WEIGHTS.mid;
    else base = REGION_WEIGHTS.late;

    const matched = LANG_REGIONS[lang] || [];
    const keys = Object.keys(base);
    const w = {};
    let total = 0;
    keys.forEach(k => {
        w[k] = (base[k] || 0) * (matched.includes(k) ? LANG_BOOST : 1);
        total += w[k];
    });

    const roll = Math.random() * total;
    let cum = 0;
    for (let i = 0; i < keys.length; i++) {
        cum += w[keys[i]];
        if (roll < cum) return keys[i];
    }
    return 'us';
}

// Region yang cocok dengan bahasa game (dipakai untuk kuota kandidat).
export function pickLangRegion(lang) {
    const list = LANG_REGIONS[lang] || LANG_REGIONS.en;
    return list[Math.floor(Math.random() * list.length)];
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
