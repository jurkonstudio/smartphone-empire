// FILE: src/data/news-competitor-releases.s3.data.js
// ============================================================
// BERITA RILIS KOMPETITOR — SESI 3 (celah 2000-2008): Sharp, Panasonic, NEC, Sagem, Alcatel.
// Mendaftar sendiri ke daftar utama (COMPETITOR_RELEASE_NEWS) saat di-import, sama seperti s1/s2.
// Teks ditulis ulang ringkas; bulan dan nama model berupa perkiraan (approx).
// ============================================================
import { COMPETITOR_RELEASE_NEWS } from './news-competitor-releases.data.js';

export const COMPETITOR_RELEASE_NEWS_S3 = [
    { cid: "sharp", year: 2000, month: 11, product: "Sharp J-SH04", tone: "positive", tags: ["sharp", "camera", "japan"], approx: true,
      h: "Sharp J-SH04: ponsel berkamera komersial pertama hadir di Jepang",
      t: "J-Phone menjual J-SH04 dengan kamera kecil dan layar warna. Foto bisa dikirim lewat email, membuka kebiasaan baru berbagi gambar.",
      h_en: "Sharp J-SH04: the first commercial camera phone arrives in Japan",
      t_en: "J-Phone sells the J-SH04 with a small camera and a color screen. Photos can be sent by email, opening a new habit of sharing pictures." },
    { cid: "panasonic", year: 2001, month: 6, product: "Panasonic GD55", tone: "positive", tags: ["panasonic", "gsm", "europe"], approx: true,
      h: "Panasonic GD55 membawa ponsel GSM kecil ringan ke Eropa",
      t: "GD55 menekankan bodi ringkas dan layar warna. Panasonic mencoba menyaingi Nokia dan Siemens di Eropa lewat kualitas rekayasa.",
      h_en: "Panasonic GD55 brings a compact, light GSM phone to Europe",
      t_en: "The GD55 stresses a small body and a color screen. Panasonic tries to rival Nokia and Siemens in Europe through engineering quality." },
    { cid: "sharp", year: 2002, month: 10, product: "Sharp GX10", tone: "positive", tags: ["sharp", "camera", "vodafone", "europe"], approx: true,
      h: "Sharp GX10 jadi ponsel berkamera pertama bagi banyak orang Eropa",
      t: "Lewat Vodafone, GX10 membawa kamera dan layar warna cerah ke jaringan GSM Eropa. Ponsel berkamera mulai keluar dari Jepang.",
      h_en: "Sharp GX10 is the first camera phone for many Europeans",
      t_en: "Through Vodafone, the GX10 brings a camera and a bright color screen to European GSM networks. Camera phones start leaving Japan." },
    { cid: "nec", year: 2003, month: 3, product: "NEC e606", tone: "mixed", tags: ["nec", "3g", "umts", "europe"], approx: true,
      h: "NEC e606 hadir di jaringan 3G pertama Eropa",
      t: "Ponsel UMTS ini ikut diluncurkan operator 3G baru. Panggilan video menarik perhatian, tetapi harga dan daya tahan baterai membatasi penjualan.",
      h_en: "NEC e606 arrives on the first 3G networks in Europe",
      t_en: "This UMTS phone launches alongside new 3G operators. Video calls draw attention, but price and battery life limit sales." },
    { cid: "sagem", year: 2003, month: 9, product: "Sagem myX-5", tone: "mixed", tags: ["sagem", "camera", "france"], approx: true,
      h: "Sagem myX-5: ponsel berkamera menengah dari Prancis",
      t: "Sagem menawarkan fitur kamera dan layar warna pada harga yang bersaing. Namun merek kecil sulit menyaingi iklan Nokia dan Samsung.",
      h_en: "Sagem myX-5: a mid-range camera phone from France",
      t_en: "Sagem offers a camera and a color screen at a competitive price. But a small brand struggles against Nokia and Samsung advertising." },
    { cid: "alcatel", year: 2004, month: 4, product: "TCL-Alcatel", tone: "mixed", tags: ["alcatel", "tcl", "corporate"], approx: true,
      h: "Alcatel dan TCL bentuk usaha patungan ponsel",
      t: "Lini ponsel One Touch dialihkan ke usaha patungan dengan TCL asal Tiongkok. Alcatel memilih fokus ke peralatan jaringan.",
      h_en: "Alcatel and TCL form a mobile phone joint venture",
      t_en: "The One Touch phone line moves into a joint venture with TCL of China. Alcatel chooses to focus on network equipment." },
    { cid: "panasonic", year: 2006, month: 3, product: "Panasonic Eropa", tone: "negative", tags: ["panasonic", "europe", "withdrawal"], approx: true,
      h: "Panasonic mundur dari pasar ponsel Eropa",
      t: "Persaingan ketat dan margin tipis membuat Panasonic menghentikan penjualan ponsel di Eropa dan memusatkan upaya di Jepang.",
      h_en: "Panasonic withdraws from the European phone market",
      t_en: "Fierce competition and thin margins lead Panasonic to stop selling phones in Europe and concentrate on Japan." },
    { cid: "sagem", year: 2008, month: 6, product: "Sagem Wireless", tone: "negative", tags: ["sagem", "exit", "corporate"], approx: true,
      h: "Sagem menutup bisnis ponselnya",
      t: "Divisi ponsel dilepas dan berhenti memproduksi perangkat baru. Satu lagi merek Eropa kecil menyerah pada skala raksasa Nokia dan Samsung.",
      h_en: "Sagem closes its mobile phone business",
      t_en: "The phone division is wound down and stops making new devices. Another small European brand gives way to the scale of Nokia and Samsung." }
];

function _slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
export function registerCompetitorReleaseNewsS3() {
    var existing = {};
    COMPETITOR_RELEASE_NEWS.forEach(function (e) { existing[e.id] = true; });
    var added = 0;
    COMPETITOR_RELEASE_NEWS_S3.forEach(function (e) {
        e.id = 'crel_' + e.cid + '_' + e.year + '_' + e.month + '_' + _slug(e.product);
        if (existing[e.id]) return;
        existing[e.id] = true;
        COMPETITOR_RELEASE_NEWS.push(e);
        added++;
    });
    return added;
}

registerCompetitorReleaseNewsS3();
