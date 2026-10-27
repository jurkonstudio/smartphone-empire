// FILE: src/ui/office/OfficeLook.js  (BARU — v2027.82 "Office Cinematic")
// Sentuhan visual premium untuk Office 3D Map, memakai teknik yang sudah terbukti di Peta Kampus.
// Logika game, rute staf, kartu, dan antarmuka TIDAK berubah.
//   1) Pasca-proses HDR (tier high): bloom halus + tone mapping ACES + grading warna (CampusPost.js).
//      Layar monitor, lampu meja, dan lampu showroom ikut bersinar sedikit. Malam = glow lebih kuat.
//   2) Vignette (tier medium & high): overlay CSS radial, pointer-events: none, tidak menutupi kartu.
//   3) Tier low (mode hemat) tidak menyentuh apa pun: langsung render seperti sebelumnya.
// Ukuran buffer dibaca otomatis tiap frame, jadi perubahan ukuran / pixel ratio tidak perlu ditangani manual.

import { createCampusPost } from '../campus/CampusPost.js';

export function createOfficeLook(THREE, renderer, container, look) {
    var tier = (look && look.tier) || 'medium';
    var post = null;
    var vig = null;
    var size = new THREE.Vector2();
    var lastW = -1, lastH = -1;
    var night = 0;

    // Pasca-proses hanya di tier high. ?officepost=0 mematikannya untuk QA.
    if (tier === 'high' && !/[?&]officepost=0/.test(location.search)) {
        try { post = createCampusPost(THREE, renderer, { samples: 4 }); }
        catch (e) { console.warn('[OfficeLook] pasca-proses dilewati:', e); post = null; }
    }

    // Vignette: lapisan DOM di belakang kartu (tidak di-dispose sendiri; dibuang di dispose()).
    if (tier !== 'low' && container) {
        try {
            vig = document.createElement('div');
            vig.setAttribute('aria-hidden', 'true');
            vig.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;';
            container.appendChild(vig);
            applyVignette();
        } catch (e) { vig = null; }
    }

    function applyVignette() {
        if (!vig) return;
        var dark = night > 0.5;
        var a = dark ? 0.36 : 0.12;
        var rgb = dark ? '2,4,12' : '20,28,48';
        vig.style.background =
            'radial-gradient(ellipse at 50% 46%, rgba(' + rgb + ',0) 52%, rgba(' + rgb + ',' + a + ') 100%)';
    }

    // Dipanggil setiap frame sebelum render. Mengikuti ukuran buffer kanvas (piksel perangkat).
    function sync() {
        if (!post) return;
        renderer.getDrawingBufferSize(size);
        if (size.x !== lastW || size.y !== lastH) {
            lastW = size.x; lastH = size.y;
            post.setSize(size.x, size.y);
        }
    }

    return {
        // Ganti pemanggilan renderer.render(scene, camera) dengan ini.
        render: function (scene, camera) {
            if (post) {
                sync();
                post.render(scene, camera);
            } else {
                renderer.render(scene, camera);
            }
        },
        // Tema siang (0) / malam (1). Panggil dari applyTheme().
        setNight: function (n) {
            night = Math.max(0, Math.min(1, +n || 0));
            if (post) post.setNight(night);
            applyVignette();
        },
        dispose: function () {
            if (post) post.dispose();
            post = null;
            if (vig && vig.parentNode) vig.parentNode.removeChild(vig);
            vig = null;
        }
    };
}
