// FILE: src/config/app.config.js
export const APP_CONFIG = {
    name: 'Smartphone Empire',
    version: '0.2.4',
    milestone: 'M1-Fase1',
    startYear: 2000,
    saveKey: 'smartphone-empire:save:v1',
    defaultLang: 'en',  // 'en' atau 'id'
    // Berkas catatan patch yang dibaca Asisten Bisnis (relatif terhadap index.html).
    patchUrl: './patches.json',
    // Halaman studio / landing page (web.html: kontak, sosial media, download APK). Dibuka di tab baru dari Pengaturan > Umum.
    studioUrl: 'https://www.smartphone-empire.my.id/web.html'
};
