// FILE: src/data/name-blocklist.data.js
// v2027.36a — tambah PROFANITY_DAERAH (bahasa daerah Indonesia)
// Sumber: LDNOOBWV2, censor-text, riset akademis, komunitas daerah

// ============================================================
// 1. KOMPETITOR & MEREK
// ============================================================
export const COMPETITOR_NAMES = [
    'nokia', 'motorola', 'sony', 'ericsson', 'sonyericsson',
    'samsung', 'lg', 'siemens', 'palm', 'blackberry', 'rim',
    'apple', 'htc', 'google', 'android', 'huawei', 'xiaomi',
    'oppo', 'vivo', 'microsoft', 'lumia', 'honor', 'nothing',
    'benq', 'alcatel', 'sharp', 'panasonic', 'toshiba',
    'nokio', 'motora', 'samsul', 'apel', 'huawaei', 'xioami'
];

export const OTHER_BRANDS = [
    'iphone', 'ipad', 'macbook', 'windows', 'windowsphone',
    'symbian', 'miui', 'coloros', 'funtouch', 'harmonyos',
    'ios', 'pixel', 'galaxy', 'redmi', 'poco', 'realme',
    'oneplus', 'asus', 'acer', 'lenovo', 'dell',
    'meizu', 'smartisan', 'blackshark', 'nubia', 'tecno',
    'infinix', 'itel', 'lava', 'micromax', 'karbonn'
];

// ============================================================
// 2. KATA KOTOR INDONESIA
// ============================================================
export const PROFANITY_ID = [
    'memek', 'meki', 'm3m3k', 'mmk', 'pepek', 'pepe', 'puki',
    'tempik', 'temp1k', 'kontol', 'kntl', 'k0nt0l', 'kntol',
    'peler', 'pler', 'pel3r', 'titit', 'itil', 'klitoris',
    'penis', 'vagina', 'bokong', 'silit', 'jembut', 'jmbt',
    'tetek', 'tete', 'nenen', 'payudara', 'susu', 'sange',
    'sangean', 'cabul', 'mesum', 'birahi',
    'ngentot', 'entot', 'ngentod', 'entod',
    'coli', 'colmek', 'col1', 'masturbasi', 'masturbat',
    'bokep', 'bkp', 'porno', 'pornografi', 'xxx', 'sex',
    'seks', 'seksual', 'orgasme', 'sperma', 'kelamin',
    'anjing', 'anjg', 'anj', 'anjeng', 'anjir', 'anjay',
    'anjrot', 'anjrit', 'asu', 'babi', 'b4bi', 'bangsat',
    'bgsd', 'bgst', 'bajingan', 'bajing', 'monyet', 'kunyuk',
    'kampret', 'keparat', 'setan', 'iblis', 'tuyul',
    'jahanam', 'laknat', 'terkutuk', 'sundal', 'pelacur',
    'lonte', 'perek', 'bispak', 'jablay', 'jablai', 'sampah',
    'bangke', 'bangkai', 'najis', 'tai', 'taik', 'tahi',
    'goblok', 'goblog', 'g0bl0k', 'tolol', 't0l0l', 'bego',
    'b3g0', 'idiot', 'id10t', 'sinting', 'gila', 'gil4',
    'sarap', 'ontohod', 'dungu', 'bodoh', 'b0d0h', 'pandir',
    'bangang', 'bahlul', 'bahlil', 'dongo',
    'brengsek', 'brngsk', 'bejat', 'sialan', 'sial', 'modar',
    'mampus', 'matilu', 'kampungan', 'ndeso', 'norak', 'kampang',
    'kere', 'miskin', 'bokek', 'bangkrut',
    'bgsd', 'bgst', 'anjg', 'anj', 'mmk', 'ktl', 'pnt',
    'ngehe', 'jancok', 'jancuk', 'dancok', 'cok', 'cuk',
    'c0k', 'jir', 'j1r', 'njir', 'gblk', 'tlol',
    'asw', 'jnc*k', 'j4nc0k', 'j*nc*k', 'ngent0t',
    'ibumu', 'bapakmu', 'emakmu', 'nenekmu', 'kakekmu',
    'bapaklu', 'emaklu', 'ibul*u', 'em4kmu',
    'aj*ng', 'anj*ng', 'g*bl*k', 'gobl*ok', 't*l*l'
];

// ============================================================
// 3. KATA KOTOR INGGRIS
// ============================================================
export const PROFANITY_EN = [
    'fuck', 'fuk', 'fck', 'f*ck', 'fucking', 'fucker',
    'motherfucker', 'shit', 'sh1t', 'sh*t', 'shitty',
    'asshole', 'arsehole', 'ass', 'arse', 'bastard', 'bitch',
    'b1tch', 'b*tch', 'dick', 'd1ck', 'd*ck', 'cock', 'c0ck',
    'pussy', 'puss1', 'cunt', 'c*nt', 'whore', 'wh0re',
    'slut', 'sl*t', 'boobs', 'b00bs', 'tits', 't1ts',
    'porn', 'porno', 'pornography', 'masturbat', 'masturbate',
    'orgasm', 'orgasmic', 'sperm', 'penis', 'vagina', 'clitoris',
    'anal', 'anus', 'rectum', 'testicles', 'scrotum',
    'cum', 'c*m', 'cumming', 'horny', 'h0rny', 'nude', 'nudes',
    'naked', 'erotic', 'hentai', 'milf', 'dildo', 'vibrator',
    'idiot', 'id10t', 'stupid', 'st*pid', 'dumb', 'd*mb',
    'moron', 'm0ron', 'retard', 'r*tard', 'imbecile', 'loser',
    'l0ser', 'fool', 'f00l', 'jerk', 'jerkoff', 'jackass',
    'dumbass', 'dumba*s', 'twat', 'prat', 'wanker', 'tosser',
    'sonofabitch', 'dog', 'pig', 'monkey', 'donkey',
    'cow', 'rat', 'snake', 'weasel', 'jackal', 'hyena',
    'damn', 'goddamn', 'dammit', 'hell', 'jesus', 'christ',
    'nigger', 'n1gger', 'n*gger', 'nigga', 'n1gga',
    'fag', 'f4g', 'faggot', 'f*ggot', 'chink', 'ch1nk',
    'spic', 'sp1c', 'kike', 'k1ke', 'wetback', 'gook',
    'jap', 'raghead', 'towelhead', 'cameljockey', 'coon',
    'crap', 'cr*p', 'piss', 'p*ss', 'fart', 'butt', 'butthole',
    'peeing', 'poop', 'doodoo', 'shite', 'shyte', 'bollocks'
];

// ============================================================
// 4. KATA KOTOR MULTI-BAHASA
// ============================================================
export const PROFANITY_MULTI = [
    'scheisse', 'scheiße', 'scheiss', 'arschloch', 'arschl*ch',
    'wichser', 'ficker', 'fotze', 'kacke', 'hurensohn',
    'schwanz', 'titten', 'muschi', 'pimmel', 'ficken',
    'verdammt', 'verfickt', 'blödmann', 'dummkopf',
    'kloten', 'klootzak', 'godverdomme', 'kanker', 'tyfus',
    'tering', 'pleuris', 'kut', 'lul', 'pik', 'mierenneuker',
    'hoer', 'slet', 'reet', 'kont', 'neuken', 'naaien',
    'puta', 'put0', 'joder', 'j0der', 'mierda', 'm1erda',
    'cabron', 'cabr0n', 'pendejo', 'pendej0', 'estupido',
    'gilipollas', 'coño', 'cono', 'verga', 'v3rga',
    'chinga', 'chingada', 'pito', 'panocha', 'culo',
    'polla', 'pollas', 'cojones', 'maricon', 'marica',
    'merde', 'm3rde', 'putain', 'put1n', 'connard', 'c0nnard',
    'salaud', 'enculé', 'encule', 'bordel', 'salope',
    'pute', 'put3', 'foutre', 'nique', 'baiser', 'couilles',
    'chatte', 'bite', 'pénis', 'vagin', 'nichon', 'burne',
    'cazzo', 'c4zzo', 'merda', 'm3rda', 'stronzo', 'str0nzo',
    'puttana', 'putt4n4', 'minchia', 'minch1a', 'figa',
    'f1ga', 'coglione', 'cogl1one', 'vaffanculo', 'porca',
    'caralho', 'c4ralho', 'porra', 'p0rra', 'foder', 'f0der',
    'buceta', 'buc3t4', 'pica', 'p1ca', 'cu', 'cuzinho',
    'filho da puta',
    'blyad', 'blya', 'suka', 'suchka', 'khuy', 'huy',
    'pizda', 'pizdets', 'yebat', 'yob', 'yobany',
    'mudak', 'mudilo', 'gandon', 'pidor', 'pidaras',
    'kuso', 'kus0', 'chikusho', 'shine', 'sh1ne',
    'baka', 'bakayaro', 'aho', 'manuke', 'kusoyaro',
    'unko', 'chinko', 'manko', 'oppai', 'chichi',
    'shibal', 'ssibal', 's1bal', 'gaesaekki', 'gaesekki',
    'byeongsin', 'byeongshin', 'jot', 'jotkkal', 'jiral',
    'changnyeon', 'sangnom', 'ssangnom',
    'kuay', 'kuaytiaw', 'hia', 'hiad', 'satt',
    'kwai', 'kwaai', 'baak', 'aihia',
    'sharmouta', 'sharmuta', 'himar', 'hibl', 'kalb',
    'zibi', 'zib', 'kuss', 'kussom', 'kussok', 'kussuk',
    'tiz', 'tizz', 'khanzeer', 'khanzir', 'nasl',
    'sik', 's1k', 'sikeyim', 'orospu', 'piç',
    'amk', 'aq', 'amina', 'amcik', 'yarrak', 'y4rrak',
    'got', 'göt', 'g0t', 'siktir', 'kahpe',
    'malaka', 'mal4k4', 'malakas', 'gamoto', 'pousti',
    'poutana', 'kolo', 'kolos', 'archidia', 'pula',
    'kurwa', 'kurw4', 'chuj', 'ch00j', 'jebac', 'jeban',
    'cipa', 'c1pa', 'huj', 'dziwka',
    'duma', 'dit', 'djt', 'cac', 'lon', 'buoi', 'chim',
    'ditme',
    'putangina', 'putang', 'gago', 'g4go', 'tanga', 't4nga',
    'bobo', 'b0bo', 'ulol', 'kingina', 'hinayupak',
    'pakyu', 'tarantado', 'hayop'
];

// ============================================================
// 5. SARA — SUKU, AGAMA, RAS, ANTARGOLONGAN
// ============================================================
export const SARA_ID = [
    'bacin', 'cokin', 'huakiau', 'huaren', 'cinten', 'tongyin',
    'tengnang', 'tenglang', 'kuproy', 'keling', 'jakon',
    'jadel', 'cimed', 'dalle',
    'cebong', 'kampret', 'kadrun', 'kafir',
    'termul', 'terjal', 'anak abah', 'pki', 'antek asing',
    'londo ireng', 'ndasmu', 'babu china', 'boneka amerika',
    'buzzer', 'cendol',
    'islam anjing', 'islam babi', 'islam kafir', 'islam sesat',
    'kristen kafir', 'bible palsu', 'muhammad babi',
    'yesus kayu tol', 'yahudi', 'nasrani', 'murtad',
    'sesat', 'penista', 'penistaan',
    'rasis', 'rasisme', 'diskriminasi', 'supremasi',
    'apartheid', 'segregasi', 'xenophobia', 'xenofobia',
    'chauvinis', 'fasis', 'nazi', 'hitler'
];

// ============================================================
// 6. SARKASME & SINDIRAN KASAR
// ============================================================
export const SARCASM_ID = [
    'tahi pilat', 'kutu kupret', 'anjing buduk',
    'otak udang', 'sok tau', 'sok tahu', 'sok pinter',
    'sok jago', 'sok suci', 'sok bersih', 'sok sibuk',
    'mbeling', 'godog', 'ngeyel', 'bawel', 'bacot',
    'comberan', 'lambe', 'kentut', 'jijik',
    'muntah', 'babu', 'pembantu',
    'melarat', 'gembel', 'gelandangan',
    'pengemis', 'maling', 'copet', 'rampok',
    'penjahat', 'bandit', 'preman', 'jagoan',
    'munafik', 'pencitraan', 'palsu', 'bohong', 'dusta',
    'pengkhianat', 'penipu', 'culas', 'licik', 'curang'
];

// ============================================================
// 7. PROFANITY DAERAH — BAHASA DAERAH INDONESIA (partial match)
// Sumber: komunitas daerah, riset bahasa, kamus daerah
// ============================================================
export const PROFANITY_DAERAH = [
    // === SUNDA ===
    'ublag', 'ublag-ublagan', 'bebel', 'kimak', 'koplok',
    'jancok', 'jancuk', 'memet', 'memed', 'bangor', 'bangor',
    'siah', 'sia', 'aing', 'maneh', 'goreng', 'gelo',
    'belegug', 'belegug', 'dungu', 'goblok',
    'silit', 'burit', 'pantat', 'hampang', 'lendu',
    'siah', 'sia', 'aing', 'maneh', 'beruk', 'budug',
    'budak', 'kacung', 'gelo', 'haram', 'jahanam',

    // === JAWA ===
    'jancuk', 'jancok', 'ancuk', 'ancok', 'ndasmu', 'ndas',
    'congormu', 'congor', 'asu', 'pekok', 'peko',
    'goblog', 'bedes', 'bedhes', 'kenthu', 'raimu',
    'lambemu', 'lambe', 'bajingan', 'cangkem', 'cangkemu',
    'matamu', 'matamu', 'sikep', 'sikepmu', 'jancik',
    'keparat', 'kethu', 'kethu', 'bedhes', 'bajigur',
    'kenthir', 'edan', 'gemblung', 'sinting',

    // === BATAK ===
    'bujanginam', 'loak', 'bodat', 'heang', 'parbaju',
    'pege', 'sitogol', 'biring', 'uak', 'bujang',
    'pantat', 'parompuan', 'dengke', 'begu', 'sibegu',
    'biawak', 'babi', 'bontor', 'huting', 'huting',

    // === MINANG ===
    'anjiang', 'baruak', 'boco', 'pangka', 'pantek',
    'pantat', 'sarawa', 'loyang', 'rangkai', 'padiah',
    'sialan', 'bangsat', 'lacua', 'lacuik', 'lacuik',

    // === MADURA ===
    'pate', 'pokeh', 'peller', 'jhie', 'cang',
    'jhe', 'jhi', 'kacong', 'pole', 'pole', 'lacur',
    'tai', 'bangkai', 'cengeng', 'bedhes',

    // === BALI ===
    'cicing', 'beler', 'buduh', 'belog', 'pemek',
    'kumpi', 'nyep', 'nyep-nyep', 'bajang', 'bajang',
    'kedis', 'celeng', 'bojog', 'kambing', 'sampi',
    'cai', 'cai', 'peli', 'pelus', 'belus',

    // === BUGIS / MAKASSAR ===
    'laco', 'laco', 'laco', 'peccah', 'laso', 'baco',
    'bangkung', 'bangkung', 'bosi', 'bosi', 'bangka',
    'canggong', 'canggong', 'kampong', 'pantat',
    'puki', 'puki', 'pantek', 'pantek',

    // === AMBON / MALUKU ===
    'cuki', 'cuki', 'par lae', 'wela', 'wela',
    'kase', 'kase', 'bodo', 'bodo', 'sio',
    'puki', 'pantat', 'bajingan', 'anjing',

    // === PAPUA ===
    'kitorang', 'bodo', 'bodo', 'sio', 'sio',
    'sial', 'sial', 'pantat', 'pantek', 'asu',
    'babi', 'monyet', 'kampung', 'kaimana',

    // === BANJAR ===
    'bangsat', 'bangsat', 'bahira', 'bahira', 'haram',
    'haram', 'jahanam', 'kada', 'kada',
    'lacuk', 'lacuk', 'puki', 'puki',

    // === ACEH ===
    'binoe', 'binoe', 'kameng', 'kameng', 'leumo',
    'leumo', 'pukai', 'pukai', 'puki', 'puki',
    'pantat', 'pantat', 'bangsat', 'bangsat',

    // === NUSA TENGGARA ===
    'kaka', 'kaka', 'adik', 'adik', 'sio',
    'sio', 'bodo', 'bodo', 'puki', 'puki',
    'pantat', 'pantat', 'anak', 'anak',

    // === DAYAK ===
    'kelasi', 'kelasi', 'bangsat', 'bangsat', 'jahanam',
    'jahanam', 'kanene', 'kanene', 'balau', 'balau',
    'antek', 'antek', 'puki', 'puki', 'pantat', 'pantat',

    // === TIONGHOA-INDONESIA (slang) ===
    'cipi', 'cipi', 'babu', 'babu', 'cina',
    'cina', 'cokin', 'cokin', 'huakiau', 'huakiau',
    'tongyin', 'tongyin', 'keling', 'keling'
];

// ============================================================
// 8. NORMALISASI
// ============================================================
export function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/8/g, 'b')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's')
        .replace(/!/g, 'i')
        .replace(/[\s\-_.]+/g, '')
        .replace(/(.)\1{2,}/g, '$1');
}

// ============================================================
// 9. HELPER MATCH
// Kata < 4 huruf = exact match
// Kata >= 4 huruf = partial match
// ============================================================
function _matchWord(norm, rawWord) {
    const w = normalizeText(rawWord);
    if (w.length < 4) return norm === w;
    return norm.includes(w);
}

// ============================================================
// 8b. TOKOH PUBLIK & POLITIK DUNIA (era dahulu sampai sekarang)
// Diperbarui Okt 2026 (termasuk nabi & tokoh agama): pemimpin dunia terkini, bisnis/teknologi, hiburan, olahraga, tokoh Indonesia.
// Nama 2 kata atau lebih dicocokkan sebagai bagian dari nama.
// Nama tunggal (mis. Jokowi) hanya cocok jika namanya sama persis,
// supaya kata biasa seperti "computing" tidak ikut terblokir.
// Daftar ini tidak lengkap; tambahkan nama baru di sini.
// ============================================================
export const PUBLIC_FIGURE_NAMES = [
    'Barack Obama',
    'Donald Trump',
    'Joe Biden',
    'Bill Clinton',
    'Hillary Clinton',
    'George Bush',
    'George Washington',
    'Abraham Lincoln',
    'John F Kennedy',
    'Richard Nixon',
    'Ronald Reagan',
    'Franklin Roosevelt',
    'Winston Churchill',
    'Margaret Thatcher',
    'Tony Blair',
    'Angela Merkel',
    'Emmanuel Macron',
    'Vladimir Putin',
    'Xi Jinping',
    'Mao Zedong',
    'Deng Xiaoping',
    'Joseph Stalin',
    'Adolf Hitler',
    'Benito Mussolini',
    'Nelson Mandela',
    'Mahatma Gandhi',
    'Jawaharlal Nehru',
    'Indira Gandhi',
    'Narendra Modi',
    'Kim Il Sung',
    'Kim Jong Un',
    'Fidel Castro',
    'Che Guevara',
    'Ho Chi Minh',
    'Benjamin Netanyahu',
    'Recep Tayyip Erdogan',
    'Volodymyr Zelensky',
    'Justin Trudeau',
    'Shinzo Abe',
    'Jacinda Ardern',
    'Rishi Sunak',
    'Keir Starmer',
    'Olaf Scholz',
    'Kamala Harris',
    'Bernie Sanders',
    'Nancy Pelosi',
    'Mikhail Gorbachev',
    'Boris Yeltsin',
    'Charles de Gaulle',
    'Ferdinand Marcos',
    'Muammar Gaddafi',
    'Saddam Hussein',
    'Osama bin Laden',
    'Hosni Mubarak',
    'Aung San Suu Kyi',
    'Lee Kuan Yew',
    'Mahathir Mohamad',
    'Kwame Nkrumah',
    'Antonio Guterres',
    'Ban Ki-moon',
    'Joko Widodo',
    'Susilo Bambang Yudhoyono',
    'Megawati Soekarnoputri',
    'Mohammad Hatta',
    'Anwar Ibrahim',
    'Pol Pot',
    'Elon Musk',
    'Bill Gates',
    'Steve Jobs',
    'Mark Zuckerberg',
    'Jeff Bezos',
    'Warren Buffett',
    'Albert Einstein',
    'Isaac Newton',
    'Stephen Hawking',
    'Michael Jackson',
    'Elvis Presley',
    'Lady Gaga',
    'Taylor Swift',
    'Cristiano Ronaldo',
    'Lionel Messi',
    'Diego Maradona',
    'Michael Jordan',
    'Muhammad Ali',
    'Oprah Winfrey',
    'Walt Disney',
    'Pablo Picasso',
    'Leonardo da Vinci',
    'Vincent van Gogh',
    'Charlie Chaplin',
    'Marilyn Monroe',
    'John Lennon',
    'Freddie Mercury',
    'Bob Marley',
    'Mother Teresa',
    'Pope Francis',
    'Dalai Lama',
    'Princess Diana',
    'King Charles',
    'Queen Elizabeth',
    'Kanye West',
    'Kim Kardashian',
    'Ariana Grande',
    'Justin Bieber',
    'Mr Beast',
    'Usain Bolt',
    'Serena Williams',
    'Roger Federer',
    'Rafael Nadal',
    'Tiger Woods',
    'LeBron James',
    'Kobe Bryant',
    'Mike Tyson',
    'Bruce Lee',
    'Jackie Chan',
    'Stephen Curry',
    'Soekarno',
    'Soeharto',
    'Jokowi',
    'Prabowo',
    'Putin',
    'Obama',
    'Trump',
    'Gandhi',
    'Mandela',
    'Hitler',
    'Stalin',
    'Mao',
    'Netanyahu',
    'Zelensky',
    'Erdogan',
    'Beyonce',
    'Rihanna',
    'Shakira',
    'Madonna',
    'Eminem',
    'Adele',
    'Drake',
    'Ronaldinho',
    'Neymar',
    'Pele',

    // --- PEMIMPIN DUNIA 2026 (hasil pengecekan Okt 2026) ---
    'Andy Burnham',
    'Mojtaba Khamenei',
    'Ali Khamenei',
    'Masoud Pezeshkian',
    'Sanae Takaichi',
    'Friedrich Merz',
    'Giorgia Meloni',
    'Mark Carney',
    'Claudia Sheinbaum',
    'Javier Milei',
    'Luiz Inacio Lula da Silva',
    'Lula da Silva',
    'Jair Bolsonaro',
    'Prabowo Subianto',
    'Gibran Rakabuming',
    'Lee Jae-myung',
    'Yoon Suk Yeol',
    'Moon Jae-in',
    'Anthony Albanese',
    'Christopher Luxon',
    'Cyril Ramaphosa',
    'Bola Tinubu',
    'Abdel Fattah el-Sisi',
    'Mohammed bin Salman',
    'Mohammed bin Zayed',
    'Ahmed al-Sharaa',
    'Bashar al-Assad',
    'Mahmoud Abbas',
    'Ebrahim Raisi',
    'Hassan Rouhani',
    'Min Aung Hlaing',
    'Tarique Rahman',
    'Sheikh Hasina',
    'Muhammad Yunus',
    'Shehbaz Sharif',
    'Imran Khan',
    'Asif Ali Zardari',
    'Anutin Charnvirakul',
    'Thaksin Shinawatra',
    'Paetongtarn Shinawatra',
    'Lawrence Wong',
    'Hun Sen',
    'Hun Manet',
    'To Lam',
    'Rodrigo Duterte',
    'Bongbong Marcos',
    'Rahul Gandhi',
    'Amit Shah',
    'Droupadi Murmu',
    'Li Qiang',
    'Wang Yi',
    'Kim Yo Jong',
    'Dmitry Medvedev',
    'Sergei Lavrov',
    'Alexander Lukashenko',
    'Alexei Navalny',
    'Yevgeny Prigozhin',
    'Viktor Orban',
    'Marine Le Pen',
    'Nigel Farage',
    'Pedro Sanchez',
    'Donald Tusk',
    'Ursula von der Leyen',
    'Antonio Costa',
    'Kaja Kallas',
    'Mark Rutte',
    'Jens Stoltenberg',
    'Christine Lagarde',
    'Tedros Adhanom',
    'Nicolas Maduro',
    'Gustavo Petro',
    'Nayib Bukele',
    'Evo Morales',
    'Hugo Chavez',
    'Paul Kagame',
    'Yoweri Museveni',
    'Mohamed Muizzu',
    'Reza Pahlavi',
    'Pope Leo',
    'Robert Prevost',
    'Pope John Paul',
    'Pope Benedict',

    // --- POLITISI AS & TOKOH POLITIK LAIN ---
    'JD Vance',
    'Marco Rubio',
    'Pete Hegseth',
    'Robert F Kennedy',
    'Mike Pence',
    'Ron DeSantis',
    'Gavin Newsom',
    'Alexandria Ocasio-Cortez',
    'Zohran Mamdani',
    'Charlie Kirk',
    'Melania Trump',
    'Ivanka Trump',
    'Michelle Obama',
    'Jill Biden',
    'George W Bush',
    'Jimmy Carter',
    'Theodore Roosevelt',
    'Thomas Jefferson',
    'Martin Luther King',
    'Malcolm X',
    'Rosa Parks',
    'Malala Yousafzai',
    'Greta Thunberg',

    // --- PEMIMPIN & TOKOH SEJARAH ---
    'Napoleon Bonaparte',
    'Julius Caesar',
    'Alexander the Great',
    'Genghis Khan',
    'Cleopatra',
    'Queen Victoria',
    'Francisco Franco',
    'Augusto Pinochet',
    'Idi Amin',
    'Mobutu Sese Seko',
    'Slobodan Milosevic',
    'Nicolae Ceausescu',
    'Vladimir Lenin',
    'Leon Trotsky',
    'Karl Marx',
    'Friedrich Engels',
    'Ruhollah Khomeini',
    'Mustafa Kemal Ataturk',
    'Sun Yat-sen',
    'Chiang Kai-shek',
    'Zhou Enlai',
    'Hu Jintao',
    'Jiang Zemin',
    'Emperor Hirohito',
    'Heinrich Himmler',
    'Joseph Goebbels',
    'Hermann Goering',
    'Gamal Abdel Nasser',
    'Anwar Sadat',
    'Yasser Arafat',
    'Golda Meir',
    'David Ben-Gurion',
    'Haile Selassie',
    'Patrice Lumumba',
    'Thomas Sankara',
    'Desmond Tutu',
    'Julius Nyerere',
    'Jomo Kenyatta',
    'Robert Mugabe',
    'Jose Mujica',
    'Aristotle',
    'Plato',
    'Socrates',
    'Confucius',
    'Charles Darwin',
    'Marie Curie',
    'Galileo Galilei',
    'Sigmund Freud',
    'Nikola Tesla',
    'Thomas Edison',
    'Alexander Graham Bell',
    'Alan Turing',
    'Henry Ford',
    'Neil Armstrong',
    'Yuri Gagarin',
    'Carl Sagan',
    'Neil deGrasse Tyson',
    'Richard Dawkins',
    'Jordan Peterson',
    'Noam Chomsky',
    'Yuval Noah Harari',
    'Tim Berners-Lee',
    'Linus Torvalds',

    // --- TOKOH INDONESIA ---
    'Gus Dur',
    'Abdurrahman Wahid',
    'BJ Habibie',
    'Sutan Sjahrir',
    'Tan Malaka',
    'Ki Hajar Dewantara',
    'RA Kartini',
    'Pangeran Diponegoro',
    'Gajah Mada',
    'Hamengkubuwono',
    'Sri Mulyani',
    'Basuki Tjahaja Purnama',
    'Anies Baswedan',
    'Ganjar Pranowo',
    'Ridwan Kamil',
    'Dedi Mulyadi',
    'Luhut Binsar Pandjaitan',
    'Erick Thohir',
    'Nadiem Makarim',
    'Susi Pudjiastuti',
    'Gatot Nurmantyo',
    'Agus Harimurti Yudhoyono',
    'Puan Maharani',
    'Hary Tanoesoedibjo',
    'Chairul Tanjung',
    'Raffi Ahmad',
    'Deddy Corbuzier',
    'Atta Halilintar',
    'Agnez Mo',
    'Rich Brian',
    'Taufik Hidayat',
    'Susi Susanti',
    'Shin Tae-yong',

    // --- BISNIS & TEKNOLOGI ---
    'Sam Altman',
    'Jensen Huang',
    'Tim Cook',
    'Satya Nadella',
    'Sundar Pichai',
    'Larry Page',
    'Sergey Brin',
    'Larry Ellison',
    'Peter Thiel',
    'Dario Amodei',
    'Demis Hassabis',
    'Ilya Sutskever',
    'Mustafa Suleyman',
    'Masayoshi Son',
    'Ren Zhengfei',
    'Lei Jun',
    'Zhang Yiming',
    'Bernard Arnault',
    'Mukesh Ambani',
    'Gautam Adani',
    'Ratan Tata',
    'Richard Branson',
    'Jamie Dimon',
    'Michael Dell',
    'Akio Morita',
    'Jack Dorsey',
    'Reed Hastings',
    'Travis Kalanick',
    'Evan Spiegel',
    'Mark Cuban',
    'Gabe Newell',
    'Hideo Kojima',
    'Shigeru Miyamoto',
    'Hayao Miyazaki',
    'Akira Toriyama',
    'Steve Wozniak',
    'Sheryl Sandberg',
    'Changpeng Zhao',
    'Satoshi Nakamoto',
    'Vitalik Buterin',
    'Sam Bankman-Fried',

    // --- MUSIK, FILM & KONTEN KREATOR ---
    'Bad Bunny',
    'Bruno Mars',
    'Ed Sheeran',
    'The Weeknd',
    'Billie Eilish',
    'Dua Lipa',
    'Olivia Rodrigo',
    'Sabrina Carpenter',
    'Selena Gomez',
    'Katy Perry',
    'Snoop Dogg',
    'Travis Scott',
    'Kendrick Lamar',
    'Justin Timberlake',
    'Britney Spears',
    'Whitney Houston',
    'Celine Dion',
    'Elton John',
    'Paul McCartney',
    'Ringo Starr',
    'Bob Dylan',
    'Jimi Hendrix',
    'Kurt Cobain',
    'Tupac Shakur',
    'Notorious BIG',
    'Johnny Depp',
    'Leonardo DiCaprio',
    'Brad Pitt',
    'Angelina Jolie',
    'Tom Cruise',
    'Tom Hanks',
    'Will Smith',
    'Dwayne Johnson',
    'Keanu Reeves',
    'Robert Downey',
    'Chris Hemsworth',
    'Timothee Chalamet',
    'Margot Robbie',
    'Scarlett Johansson',
    'Jennifer Lawrence',
    'Emma Watson',
    'Morgan Freeman',
    'Steven Spielberg',
    'Christopher Nolan',
    'Quentin Tarantino',
    'James Cameron',
    'Stan Lee',
    'Joe Rogan',
    'Pewdiepie',
    'Logan Paul',
    'Jake Paul',
    'Khaby Lame',
    'Charli Damelio',
    'Addison Rae',
    'Jennie Kim',
    'Kim Taehyung',
    'Jeon Jungkook',
    'Park Jimin',
    'Lee Min Ho',
    'Salvador Dali',
    'Claude Monet',
    'Michelangelo',
    'Rembrandt',
    'Frida Kahlo',
    'Andy Warhol',
    'William Shakespeare',
    'JK Rowling',
    'Stephen King',
    'Tolkien',

    // --- OLAHRAGA ---
    'Kylian Mbappe',
    'Erling Haaland',
    'Lamine Yamal',
    'Luka Modric',
    'Zinedine Zidane',
    'David Beckham',
    'Zlatan Ibrahimovic',
    'Mohamed Salah',
    'Son Heung-min',
    'Kevin De Bruyne',
    'Vinicius Junior',
    'Jude Bellingham',
    'Pep Guardiola',
    'Jose Mourinho',
    'Alex Ferguson',
    'Johan Cruyff',
    'Franz Beckenbauer',
    'Lewis Hamilton',
    'Max Verstappen',
    'Michael Schumacher',
    'Ayrton Senna',
    'Valentino Rossi',
    'Marc Marquez',
    'Novak Djokovic',
    'Carlos Alcaraz',
    'Jannik Sinner',
    'Coco Gauff',
    'Naomi Osaka',
    'Simone Biles',
    'Michael Phelps',
    'Katie Ledecky',
    'Shaquille Oneal',
    'Magic Johnson',
    'Larry Bird',
    'Kevin Durant',
    'Giannis Antetokounmpo',
    'Luka Doncic',
    'Victor Wembanyama',
    'Caitlin Clark',
    'Tom Brady',
    'Patrick Mahomes',
    'Travis Kelce',
    'Conor McGregor',
    'Khabib Nurmagomedov',
    'Manny Pacquiao',
    'Floyd Mayweather',
    'Canelo Alvarez',
    'Anthony Joshua',
    'Tyson Fury',
    'Oleksandr Usyk',
    'Eliud Kipchoge',
    'Wayne Rooney',
    'Thierry Henry',
    'Andres Iniesta',
    'Xavi Hernandez',
    'Robert Lewandowski',
    'Harry Kane',

    // --- NAMA TUNGGAL TERKENAL (cocok hanya jika sama persis) ---
    'Biden',
    'Macron',
    'Merkel',
    'Modi',
    'Lenin',
    'Napoleon',
    'Khomeini',
    'Khamenei',
    'Takaichi',
    'Meloni',
    'Milei',
    'Maduro',
    'Bolsonaro',
    'Lula',
    'Sheinbaum',
    'Mamdani',
    'Gibran',
    'Habibie',
    'Kartini',
    'Diponegoro',
    'Musk',
    'Zuckerberg',
    'Bezos',
    'Einstein',
    'Ronaldo',
    'Messi',
    'Mbappe',
    'Haaland',
    'Zidane',
    'Beckham',
    'Djokovic',
    'Alcaraz',
    'Verstappen',
    'Zendaya',
    'Jungkook',
    'Taehyung',
    'Jimin',

    // --- NABI & RASUL (Islam) ---
    'Nabi Muhammad',
    'Prophet Muhammad',
    'Muhammad Rasulullah',
    'Rasulullah',
    'Nabi Adam',
    'Nabi Idris',
    'Nabi Nuh',
    'Nabi Hud',
    'Nabi Saleh',
    'Nabi Ibrahim',
    'Nabi Luth',
    'Nabi Ismail',
    'Nabi Ishaq',
    'Nabi Yakub',
    'Nabi Yusuf',
    'Nabi Ayub',
    'Nabi Syuaib',
    'Nabi Musa',
    'Nabi Harun',
    'Nabi Zulkifli',
    'Nabi Daud',
    'Nabi Sulaiman',
    'Nabi Ilyas',
    'Nabi Alyasa',
    'Nabi Yunus',
    'Nabi Zakaria',
    'Nabi Yahya',
    'Nabi Isa',
    'Prophet Moses',
    'Prophet Abraham',
    'Prophet Noah',
    'Prophet Adam',
    'Prophet Jesus',
    'Prophet Solomon',
    'Prophet David',
    'Prophet Joseph',
    'Prophet Jonah',
    'Isa Almasih',

    // --- SAHABAT, KELUARGA NABI & ULAMA ---
    'Abu Bakar',
    'Umar bin Khattab',
    'Utsman bin Affan',
    'Ali bin Abi Thalib',
    'Khulafaur Rasyidin',
    'Aisyah',
    'Khadijah',
    'Fatimah Az-Zahra',
    'Hasan bin Ali',
    'Husain bin Ali',
    'Bilal bin Rabah',
    'Khalid bin Walid',
    'Salahuddin Al-Ayyubi',
    'Imam Syafii',
    'Imam Hanbali',
    'Imam Malik',
    'Abu Hanifah',
    'Imam Bukhari',
    'Imam Muslim',
    'Imam Ghazali',
    'Ibnu Sina',
    'Ibnu Taimiyah',
    'Ibnu Khaldun',
    'Rumi',
    'Hasyim Asyari',
    'Ahmad Dahlan',
    'Quraish Shihab',
    'Zakir Naik',
    'Ahmad Deedat',

    // --- WALISONGO & ULAMA NUSANTARA ---
    'Walisongo',
    'Sunan Kalijaga',
    'Sunan Gunung Jati',
    'Sunan Ampel',
    'Sunan Bonang',
    'Sunan Giri',
    'Sunan Drajat',
    'Sunan Kudus',
    'Sunan Muria',
    'Maulana Malik Ibrahim',
    'Syekh Yusuf',
    'Hamzah Fansuri',

    // --- KRISTEN & KATOLIK ---
    'Yesus Kristus',
    'Jesus Christ',
    'Yesus',
    'Bunda Maria',
    'Virgin Mary',
    'Santa Maria',
    'Santo Petrus',
    'Saint Peter',
    'Santo Paulus',
    'Saint Paul',
    'Santo Yosef',
    'Santo Yohanes',
    'Yohanes Pembaptis',
    'John the Baptist',
    'Santo Fransiskus',
    'Francis of Assisi',
    'Agustinus Hippo',
    'Thomas Aquinas',
    'Martin Luther',
    'John Calvin',
    'John Wesley',
    'Billy Graham',
    'Joel Osteen',

    // --- YAHUDI ---
    'Abraham Isaac',
    'Moses Maimonides',
    'Maimonides',
    'Rabbi Akiva',

    // --- BUDDHA, HINDU & LAINNYA ---
    'Siddhartha Gautama',
    'Buddha Gautama',
    'Sang Buddha',
    'Buddha',
    'Bodhidharma',
    'Nagarjuna',
    'Thich Nhat Hanh',
    'Guru Nanak',
    'Guru Gobind Singh',
    'Zarathustra',
    'Zoroaster',
    'Lao Tzu',
    'Laozi',
    'Mencius',
    'Swami Vivekananda',
    'Adi Shankara',
    'Ramakrishna',
    'Sai Baba',
    'Sri Krishna',
    'Mahavira',
    'Baha\'u\'llah',
    'Bahaullah',
    'Joseph Smith',
    'Brigham Young',
    'L Ron Hubbard',
];

// ============================================================
// 10. VALIDASI UTAMA
// ============================================================
export function validateCompanyName(name) {
    if (!name || !name.trim()) {
        return { ok: false, reason: 'empty' };
    }

    const trimmed = name.trim();
    const normalized = normalizeText(trimmed);

    // Kompetitor
    for (const comp of COMPETITOR_NAMES) {
        if (normalizeText(comp) === normalized) {
            return { ok: false, reason: 'competitor', matched: comp };
        }
    }

    // Other brands
    for (const brand of OTHER_BRANDS) {
        if (normalizeText(brand) === normalized) {
            return { ok: false, reason: 'brand', matched: brand };
        }
    }

    // Tokoh publik & politik dunia
    for (const figure of PUBLIC_FIGURE_NAMES) {
        const f = normalizeText(figure);
        const isMulti = figure.trim().includes(' ');
        const hit = isMulti ? normalized.includes(f) : normalized === f;
        if (hit) {
            return { ok: false, reason: 'public_figure', matched: figure };
        }
    }

    // Profanity ID
    for (const word of PROFANITY_ID) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'profanity', lang: 'id', matched: word };
        }
    }

    // Profanity EN
    for (const word of PROFANITY_EN) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'profanity', lang: 'en', matched: word };
        }
    }

    // Profanity multi
    for (const word of PROFANITY_MULTI) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'profanity', lang: 'multi', matched: word };
        }
    }

    // Profanity daerah
    for (const word of PROFANITY_DAERAH) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'profanity', lang: 'daerah', matched: word };
        }
    }

    // SARA
    for (const word of SARA_ID) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'sara', matched: word };
        }
    }

    // Sarkasme
    for (const word of SARCASM_ID) {
        if (_matchWord(normalized, word)) {
            return { ok: false, reason: 'sarcasm', matched: word };
        }
    }

    // Panjang
    if (trimmed.length < 2) return { ok: false, reason: 'too_short' };
    if (trimmed.length > 24) return { ok: false, reason: 'too_long' };

    return { ok: true };
    }
