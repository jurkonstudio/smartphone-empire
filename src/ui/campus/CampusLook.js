// FILE: src/ui/campus/CampusLook.js
// v2027.60 — "Premium look" untuk Peta Kampus 3D.
// Berisi: tingkat kualitas adaptif, environment map prosedural (PMREM, sekali buat),
// rig cahaya (matahari + fill + rim + hemisphere), tone mapping, dan shadow map statis.
//
// Catatan desain:
//  - Shadow map DIBEKUK (autoUpdate=false). Scene hanya memintanya diperbarui saat bangunan
//    berubah/tumbuh, jadi biaya per-frame nol (cocok dengan loop ambient 30fps & mode hemat).
//  - Tier 'low' (mode hemat bawaan game: window.__PERF.lite) tidak memakai shadow map sama
//    sekali; bangunan jatuh kembali ke bayangan palsu + contact-AO.
//  - Paksa tier untuk QA lewat URL: ?campusq=low | medium | high
//  - Nilai cahaya mengikuti Three r160 (lampu fisik, tanpa pengali PI).

// Warna & intensitas khusus peta kampus. Sengaja TERPISAH dari PALETTES (yang juga dipakai
// OfficeScene), supaya tampilan Office tidak ikut berubah.
export var CAMPUS_LOOK = {
    light: {
        hemiSky: 0xeaf2ff, hemiGround: 0xc2cfb8, hemiI: 1.05,
        sunCol: 0xffe6c2, sunI: 3.0,
        fillCol: 0xcfe0ff, fillI: 0.6,
        rimCol: 0xe3ecff, rimI: 0.6,
        envI: 0.55, exposure: 1.04,
        aoOpacity: 0.38,
        colors: { roofAlt: 0xa3adbb }
    },
    dark: {
        hemiSky: 0x7f93bd, hemiGround: 0x1d2430, hemiI: 0.9,
        sunCol: 0xa9bde8, sunI: 1.7,
        fillCol: 0x6f8fd0, fillI: 0.35,
        rimCol: 0x8fb0ff, rimI: 0.55,
        envI: 0.22, exposure: 0.95,
        aoOpacity: 0.5,
        colors: { roofAlt: 0x5a6578 }
    }
};

// Arah matahari: dari kiri-depan (-x,+z) relatif kamera isometrik, sehingga dua sisi dinding
// yang terlihat (+z dan +x) mendapat nilai terang berbeda dan bayangan jatuh ke kanan layar.
export var SUN_POS = [-9, 13, 8];
export var SHADE_DIR = [1, -1];    // arah bayangan palsu di tanah (x, z) — untuk tier tanpa shadow map

function queryTier() {
    try {
        var m = /[?&]campusq=(low|medium|high)/.exec(location.search);
        if (m) return m[1];
    } catch (e) {}
    return '';
}

export function detectQuality(PERF) {
    PERF = PERF || {};
    var mobile = false;
    try {
        mobile = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
            Math.min(screen.width || 9999, screen.height || 9999) < 700;
    } catch (e) {}
    var tier = queryTier() || (PERF.lite ? 'low' : (mobile ? 'medium' : 'high'));
    return {
        tier: tier,
        shadows: tier !== 'low',
        shadowMap: tier === 'high' ? 2048 : 1024,
        maxDpr: tier === 'high' ? 2 : (tier === 'medium' ? 1.5 : 1.25),
        env: true
    };
}

// Environment prosedural kecil: gradien langit→cakrawala→tanah + dua softbox. Dipakai untuk
// pantulan kaca/logam; dibuat satu kali (PMREM), bukan per frame.
function buildEnv(THREE, renderer) {
    var pm = new THREE.PMREMGenerator(renderer);
    var es = new THREE.Scene();
    var R = 40;
    var geo = new THREE.SphereGeometry(R, 24, 16);
    var pos = geo.attributes.position;
    var col = new Float32Array(pos.count * 3);
    var top = new THREE.Color(0x9cc0f0), mid = new THREE.Color(0xf3efe6), bot = new THREE.Color(0x7d8a78);
    var c = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
        var y = pos.getY(i) / R;
        if (y >= 0) c.copy(mid).lerp(top, Math.pow(y, 0.6));
        else c.copy(mid).lerp(bot, Math.min(1, -y * 2.2));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    es.add(new THREE.Mesh(geo, skyMat));

    var panelGeo = new THREE.PlaneGeometry(14, 14);
    var mats = [skyMat];
    function softbox(dir, color, k, size) {
        var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide });
        mats.push(m);
        var p = new THREE.Mesh(panelGeo, m);
        var v = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(R * 0.8);
        p.position.copy(v);
        p.scale.setScalar(size);
        p.lookAt(0, 0, 0);
        es.add(p);
    }
    softbox(SUN_POS, 0xffeccc, 6, 1);              // matahari
    softbox([14, 7, 12], 0xcfe0ff, 2.2, 1.4);      // fill dingin
    softbox([-6, 9, -14], 0xe0eaff, 1.6, 1.2);     // rim

    var rt = pm.fromScene(es, 0.04);
    geo.dispose(); panelGeo.dispose();
    mats.forEach(function (m) { m.dispose(); });
    pm.dispose();
    return rt;
}

export function createLookRig(THREE, renderer, scene, quality) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    var hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1);
    var sun = new THREE.DirectionalLight(0xffecd0, 2.7);
    var fill = new THREE.DirectionalLight(0xcfe0ff, 0.5);
    var rim = new THREE.DirectionalLight(0xe3ecff, 0.5);
    sun.position.set(SUN_POS[0], SUN_POS[1], SUN_POS[2]);
    fill.position.set(14, 7, 12);
    rim.position.set(-6, 9, -14);
    scene.add(hemi, sun, fill, rim);

    var shadowsOn = !!quality.shadows;
    if (shadowsOn) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;      // diperbarui manual (lihat requestShadowUpdate)
        sun.castShadow = true;
        sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
        var sc = sun.shadow.camera;
        sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24;
        sc.near = 1; sc.far = 60;
        sc.updateProjectionMatrix();
        sun.shadow.bias = -0.0004;
        sun.shadow.normalBias = 0.03;
        sun.shadow.radius = 2;
    }

    var envRT = null, envOn = false;
    if (quality.env) {
        try {
            envRT = buildEnv(THREE, renderer);
            scene.environment = envRT.texture;
            envOn = true;
        } catch (e) {
            console.warn('[CampusLook] environment map dilewati:', e);
        }
    }

    function applyTheme(dark) {
        var p = dark ? CAMPUS_LOOK.dark : CAMPUS_LOOK.light;
        hemi.color.setHex(p.hemiSky);
        hemi.groundColor.setHex(p.hemiGround);
        hemi.intensity = p.hemiI;
        sun.color.setHex(p.sunCol); sun.intensity = p.sunI;
        fill.color.setHex(p.fillCol); fill.intensity = p.fillI;
        rim.color.setHex(p.rimCol); rim.intensity = p.rimI;
        renderer.toneMappingExposure = p.exposure;
        return p;
    }

    return {
        shadowsOn: shadowsOn,
        envOn: envOn,
        lights: { hemi: hemi, sun: sun, fill: fill, rim: rim },   // dipakai CampusWeather (cuaca & senja)
        applyTheme: applyTheme,
        // Tandai shadow map perlu dihitung ulang pada render berikutnya.
        requestShadowUpdate: function () { if (shadowsOn) renderer.shadowMap.needsUpdate = true; },
        dispose: function () {
            scene.remove(hemi, sun, fill, rim);
            if (sun.shadow && sun.shadow.map) sun.shadow.map.dispose();
            scene.environment = null;
            if (envRT) envRT.dispose();
        }
    };
}
