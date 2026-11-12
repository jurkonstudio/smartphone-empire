// FILE: src/data/random-company-names.data.js
// Pembuat nama perusahaan acak untuk akun baru (tanpa layar setup manual).
// Kombinasi: ~150 awalan x ~60 akhiran x 4 pola = puluhan ribu nama berbeda.
// Setiap nama lolos validateCompanyName (kata kasar, merek, tokoh publik, panjang <= 24).
import { validateCompanyName } from './name-blocklist.data.js';

const PREFIX = [
    // alam & langit
    'Nova','Apex','Zenith','Orbit','Vertex','Lumen','Nimbus','Astra','Aurora','Borealis','Cosmo','Stellar','Solar','Lunar','Comet',
    'Meteor','Galaxy','Nebula','Eclipse','Horizon','Zephyr','Tempest','Cirrus','Cumulus','Monsoon','Typhoon','Glacier','Tundra',
    'Savanna','Lagoon','Reef','Coral','Delta','Summit','Ridge','Canyon','Mesa','Cascade','Ember','Blaze','Flare','Spark','Volt',
    // teknologi & sains
    'Quantum','Photon','Neutron','Proton','Fusion','Matrix','Vector','Pulse','Signal','Cipher','Binary','Syntax','Kernel','Logic',
    'Circuit','Silicon','Carbon','Titan','Argon','Neon','Cobalt','Helix','Prism','Quark','Axiom','Vortex','Synapse','Nexus','Arc',
    // kekuatan & sifat
    'Swift','Bold','Brave','Keen','Prime','Royal','Grand','Noble','Rapid','Vivid','Clever','Mighty','Agile','Sharp','Bright',
    'Alpha','Omega','Sigma','Gamma','Beta','Ultra','Mega','Hyper','Omni','Terra','Aero','Hydro','Geo','Evo','Neo',
    // hewan
    'Falcon','Eagle','Hawk','Raven','Phoenix','Tiger','Panther','Lynx','Jaguar','Cobra','Viper','Wolf','Fox','Orca','Dolphin',
    'Condor','Osprey','Gecko','Mantis','Rhino','Bison','Komodo','Garuda','Harimau','Cendrawasih','Elang','Naga','Merak',
    // nusantara & umum
    'Nusa','Bumi','Surya','Cakra','Bayu','Tirta','Agni','Bintang','Pelangi','Kencana','Mandala','Nusantara','Arunika','Senja',
    'Fajar','Samudra','Rimba','Pesona','Cahaya','Gemilang','Jaya','Mega','Sinar','Tunas','Wira','Karya','Lintas','Cipta',
    // gaya modern
    'Blue','Red','Silver','Golden','Crimson','Indigo','Violet','Amber','Jade','Onyx','Ivory','Cyan','Scarlet','Teal','Azure',
    'Pioneer','Frontier','Legacy','Vanguard','Zeal','Aspire','Elevate','Momentum','Catalyst','Odyssey','Voyager','Horizon'
];

const SUFFIX = [
    'Mobile','Telecom','Devices','Wireless','Communications','Electronics','Labs','Works','Dynamics','Systems','Technologies',
    'Industries','Mobility','Networks','Gadgets','Handsets','Phones','Digital','Innovations','Ventures','Group','Corp','Holdings',
    'Studio','Foundry','Forge','Craft','Link','Connect','Wave','Cell','Tel','Com','Tronics','Logic','Core','Hub','Point','Gear',
    'Solutions','Engineering','Design','Makers','Smart','Micro','Nano','Pro','Plus','Max','One','Global','International',
    'Nusantara','Indonesia','Asia','Pasifik','Teknologi','Selular','Komunikasi','Elektronik','Karya','Mandiri','Utama','Abadi'
];

const GLUE = ['', '-', ' '];

function _rand(n) {
    try {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        return a[0] % n;
    } catch (e) {
        return Math.floor(Math.random() * n);
    }
}

function _pick(arr) { return arr[_rand(arr.length)]; }

function _buildOne() {
    const p = _pick(PREFIX);
    const s = _pick(SUFFIX);
    switch (_rand(4)) {
        case 0:  return p + ' ' + s;                          // Nova Mobile
        case 1:  return p + _pick(PREFIX).toLowerCase() + ' ' + s; // Sparkfox Labs
        case 2:  return p + _pick(GLUE) + _pick(['X','Z','Q','7','9','One','Pro','Go']); // Apex-X
        default: return _pick(PREFIX) + ' ' + p + ' ' + s;    // Blue Falcon Wireless
    }
}

// Nama acak yang lolos validasi dan panjangnya <= 24.
export function generateCompanyName() {
    for (let i = 0; i < 60; i++) {
        const n = _buildOne().replace(/\s+/g, ' ').trim();
        if (n.length >= 3 && n.length <= 24 && validateCompanyName(n).ok) return n;
    }
    return 'Nova Mobile ' + (100 + _rand(900));
}

// Tambahkan angka kecil supaya nama tetap unik bila semua percobaan bentrok.
export function withNumericSuffix(name) {
    const tag = ' ' + (10 + _rand(990));
    const base = name.length + tag.length > 24 ? name.slice(0, 24 - tag.length).trim() : name;
    return base + tag;
}
