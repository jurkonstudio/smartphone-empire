// FILE: src/ui/phone/FoldMockup3D.js
// ============================================================
// Model 3D ponsel lipat untuk wizard Desain (Three.js r160, dimuat malas dari CDN
// seperti peta kampus). Hanya bentuk lipat; bentuk lain tetap SVG dari PhoneMockup.js.
// Pemanggil wajib menangani kegagalan (tanpa WebGL / offline) dan kembali ke SVG.
//
// Cakupan:
//  - buku (ff_fold), buku lebar (ff_fold_wide), buku tanpa lipatan (ff_book_crease_free)
//  - tri-fold Z (ff_tri_fold: satu panel luar terbuka sebagai sampul)
//  - tri-fold C (ff_tri_fold_c: tanpa layar luar, layar dalam diredupkan saat tertutup)
// Pose: 'open' (terbuka rata) dan 'closed' (terlipat). Animasi lipat diputar di antaranya.
// Seret kanvas untuk memutar model.
// ============================================================

var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
var _threePromise = null;
var _tokenSeq = 0;
var PX = 700;          // piksel tekstur per satuan lebar panel
var ANIM_MS = 650;

export var FOLD_3D_FORMS = ['ff_fold', 'ff_fold_wide', 'ff_book_crease_free', 'ff_tri_fold', 'ff_tri_fold_c'];

// Ukuran dalam satuan dunia (lebar panel, tinggi, tebal).
// style: 'book' (1 engsel), 'z' (2 engsel, arah berlawanan), 'c' (2 engsel, arah sama).
var SPECS = {
    ff_fold:             { n: 2, pw: 0.46, h: 1.00, t: 0.035, style: 'book', cover: true },
    ff_book_crease_free: { n: 2, pw: 0.46, h: 1.00, t: 0.030, style: 'book', cover: true },
    ff_fold_wide:        { n: 2, pw: 0.60, h: 0.80, t: 0.035, style: 'book', cover: true },
    ff_tri_fold:         { n: 3, pw: 0.36, h: 1.00, t: 0.035, style: 'z',    cover: true },
    ff_tri_fold_c:       { n: 3, pw: 0.36, h: 1.00, t: 0.035, style: 'c',    cover: false }
};

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
function clampRange(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function nowMs() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

// Tata letak panel untuk pose p (0 = terbuka rata, 1 = terlipat). Murni matematika, tanpa THREE,
// supaya bisa diuji tanpa WebGL. Rantai panel disusun di bidang XZ; setiap engsel memutar
// panel berikutnya di sekitar sumbu Y. Saat tertutup, setiap lapisan diangkat sedikit di z.
export function foldLayout(formFactorId, p) {
    var spec = SPECS[formFactorId];
    if (!spec) return null;
    var pose = clamp01(p);
    var pw = spec.pw, out = [];
    var ang = 0, prevX = -pw / 2, prevZ = 0;
    for (var i = 0; i < spec.n; i++) {
        if (i > 0) {
            var sign = (spec.style === 'z' && i === 2) ? -1 : 1;
            ang += sign * Math.PI * pose;
        }
        var dx = Math.cos(ang), dz = -Math.sin(ang);
        var cx = prevX + dx * pw / 2;
        var cz = prevZ + dz * pw / 2;
        prevX += dx * pw;
        prevZ += dz * pw;
        out.push({ x: cx, z: cz, rotY: ang, idx: i });
    }
    var mean = 0;
    out.forEach(function (o) { mean += o.x; });
    mean /= out.length;
    out.forEach(function (o) {
        o.x -= mean;
        o.z += o.idx * spec.t * 1.15 * pose;
    });
    return out;
}

function loadThree() {
    if (!_threePromise) {
        _threePromise = import(THREE_URL).catch(function (e) { _threePromise = null; throw e; });
    }
    return _threePromise;
}

function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    c.fill();
}

// Gambar layar sederhana: latar era, jam, kisi ikon, dock. Warna dari estetika era desain.
function drawScreen(canvas, theme, clock, cols) {
    var c = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var th = theme || {};
    var bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, th.primary || '#1a2030');
    bg.addColorStop(1, th.bg || '#080a10');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.font = Math.round(H * 0.035) + 'px sans-serif';
    c.textAlign = 'right';
    c.fillText('100%', W * 0.92, H * 0.06);

    c.textAlign = 'center';
    c.fillStyle = '#ffffff';
    c.font = '600 ' + Math.round(H * 0.12) + 'px sans-serif';
    c.fillText(String(clock || '09:41'), W / 2, H * 0.24);

    var palette = [th.accent || '#0a84ff', '#34c759', '#ff9f0a', '#ff375f', '#64d2ff', '#bf5af2', '#ffd60a', '#30d158'];
    var rows = 3;
    var size = Math.min(W / (cols * 1.7), H * 0.1);
    var gap = size * 0.45;
    var gridW = cols * size + (cols - 1) * gap;
    var x0 = (W - gridW) / 2, y0 = H * 0.36;
    for (var r = 0; r < rows; r++) {
        for (var q = 0; q < cols; q++) {
            c.fillStyle = palette[(r * cols + q) % palette.length];
            roundRect(c, x0 + q * (size + gap), y0 + r * size * 1.35, size, size, size * 0.22);
        }
    }
    c.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(c, W * 0.1, H * 0.86, W * 0.8, H * 0.1, H * 0.04);
}

function makeTex(THREE, canvas) {
    var tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function createFoldScene(THREE, container, cfg) {
    var spec = SPECS[cfg.formFactorId];
    var n = spec.n, pw = spec.pw, h = spec.h, t = spec.t;
    var width = Math.max(120, Math.round(cfg.width || 140));
    var height = Math.round(width * 1.3);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    var canvas = renderer.domElement;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Model 3D ponsel lipat, seret untuk memutar');
    container.innerHTML = '';
    container.appendChild(canvas);

    var scene = new THREE.Scene();
    var aspect = width / height;
    var camera = new THREE.PerspectiveCamera(30, aspect, 0.05, 50);
    var fov = 30 * Math.PI / 180;
    var halfW = (n * pw) / 2 + 0.12;
    var halfH = h / 2 + 0.12;
    var dist = Math.max(halfH / Math.tan(fov / 2), halfW / (Math.tan(fov / 2) * aspect)) + t * 4;
    camera.position.set(0, 0.1, dist);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    var keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(1.5, 2, 3);
    scene.add(keyLight);

    var root = new THREE.Group();
    root.rotation.set(0.08, -0.45, 0);
    scene.add(root);

    // Tekstur layar: satu kanvas lebar untuk layar dalam (dibagi per panel), satu untuk sampul.
    var innerCanvas = document.createElement('canvas');
    innerCanvas.width = Math.round(n * pw * PX);
    innerCanvas.height = Math.round(h * PX);
    drawScreen(innerCanvas, cfg.era, cfg.clock, n >= 2 ? 5 : 3);
    var innerTex = makeTex(THREE, innerCanvas);

    var coverMat = null;
    if (spec.cover) {
        var coverCanvas = document.createElement('canvas');
        coverCanvas.width = Math.round(pw * PX);
        coverCanvas.height = Math.round(h * PX);
        drawScreen(coverCanvas, cfg.era, cfg.clock, 3);
        coverMat = new THREE.MeshBasicMaterial({ map: makeTex(THREE, coverCanvas) });
    }

    var bodyMat = new THREE.MeshStandardMaterial({ color: cfg.bodyHex || '#1a1a1a', metalness: 0.6, roughness: 0.32 });
    var camMat = new THREE.MeshStandardMaterial({ color: 0x0d0e12, metalness: 0.2, roughness: 0.25 });
    var lensMat = new THREE.MeshStandardMaterial({ color: 0x1b2a44, metalness: 0.9, roughness: 0.05 });
    var dimMat = new THREE.MeshBasicMaterial({ color: 0x06070b, transparent: true, opacity: 0 });
    var geoBody = new THREE.BoxGeometry(pw, h, t);
    var geoScreen = new THREE.PlaneGeometry(pw * 0.9, h * 0.92);
    var lensGeo = new THREE.CircleGeometry(pw * 0.06, 24);

    function innerMat(i) {
        var tex = innerTex.clone();
        tex.repeat.set(1 / n, 1);
        tex.offset.set(i / n, 0);
        tex.needsUpdate = true;
        return new THREE.MeshBasicMaterial({ map: tex });
    }

    // Modul kamera di sisi belakang panel pertama (tampak saat terbuka).
    function buildCameraModule() {
        var c = new THREE.Group();
        var zBack = -t / 2 - 0.006;
        var plate = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.42, pw * 0.42, 0.012), camMat);
        plate.position.set(-pw * 0.2, h * 0.36, zBack);
        c.add(plate);
        var offs = [[-0.09, 0.06], [0.02, 0.06], [-0.035, -0.04]];
        offs.forEach(function (o) {
            var l = new THREE.Mesh(lensGeo, lensMat);
            l.position.set(-pw * 0.2 + o[0] * pw, h * 0.36 + o[1] * pw, zBack - 0.007);
            l.rotation.y = Math.PI;
            c.add(l);
        });
        return c;
    }

    var groups = [];
    for (var i = 0; i < n; i++) {
        var g = new THREE.Group();
        g.add(new THREE.Mesh(geoBody, bodyMat));
        var inner = new THREE.Mesh(geoScreen, innerMat(i));
        inner.position.z = t / 2 + 0.002;
        g.add(inner);
        if (spec.style === 'c' && i === n - 1) {
            var dim = new THREE.Mesh(geoScreen, dimMat);
            dim.position.z = t / 2 + 0.004;
            g.add(dim);
        }
        if (spec.cover && i === n - 1) {
            var cov = new THREE.Mesh(geoScreen, coverMat);
            cov.position.z = -t / 2 - 0.002;
            cov.rotation.y = Math.PI;
            g.add(cov);
        }
        if (i === 0) g.add(buildCameraModule());
        root.add(g);
        groups.push(g);
    }

    var current = 0, target = 0, anim = null, animId = 0, disposed = false;
    var dragging = false, lastX = 0, lastY = 0;

    function applyPose(p) {
        var lay = foldLayout(cfg.formFactorId, p);
        for (var k = 0; k < n; k++) {
            groups[k].position.set(lay[k].x, 0, lay[k].z);
            groups[k].rotation.y = lay[k].rotY;
        }
        dimMat.opacity = spec.style === 'c' ? p * 0.8 : 0;
    }

    function requestRender() {
        if (!animId && !disposed) animId = requestAnimationFrame(frame);
    }

    function frame(now) {
        animId = 0;
        if (disposed) return;
        if (!container.isConnected) { dispose(); return; }
        if (anim) {
            var k = Math.min(1, (now - anim.t0) / anim.dur);
            var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            current = anim.from + (anim.to - anim.from) * e;
            if (k >= 1) anim = null;
        }
        applyPose(current);
        renderer.render(scene, camera);
        if (anim) requestRender();
    }

    function setPose(pose, animate) {
        var to = pose === 'open' ? 0 : 1;
        target = to;
        if (!animate || Math.abs(to - current) < 1e-4) {
            anim = null;
            current = to;
        } else {
            anim = { from: current, to: to, t0: nowMs(), dur: ANIM_MS };
        }
        requestRender();
    }

    function dispose() {
        if (disposed) return;
        disposed = true;
        if (animId) cancelAnimationFrame(animId);
        try {
            renderer.dispose();
            if (renderer.forceContextLoss) renderer.forceContextLoss();
        } catch (e) { /* konteks sudah hilang */ }
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    function endDrag(ev) {
        if (!dragging) return;
        dragging = false;
        canvas.style.cursor = 'grab';
        try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* tidak ditangkap */ }
    }

    canvas.addEventListener('pointerdown', function (ev) {
        dragging = true;
        lastX = ev.clientX;
        lastY = ev.clientY;
        canvas.style.cursor = 'grabbing';
        try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* abaikan */ }
    });
    canvas.addEventListener('pointermove', function (ev) {
        if (!dragging) return;
        root.rotation.y = clampRange(root.rotation.y + (ev.clientX - lastX) * 0.01, -1.2, 1.2);
        root.rotation.x = clampRange(root.rotation.x + (ev.clientY - lastY) * 0.005, -0.6, 0.6);
        lastX = ev.clientX;
        lastY = ev.clientY;
        requestRender();
    });
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    return {
        setPose: setPose,
        dispose: dispose,
        alive: function () { return !disposed; }
    };
}

// Pasang / perbarui model 3D di dalam container. Resolve ke handle, atau null jika
// permintaan sudah usang (container sudah diganti atau dibuang). Reject jika WebGL / modul gagal.
export function mountFoldMockup3D(container, cfg) {
    if (!container || !cfg || FOLD_3D_FORMS.indexOf(cfg.formFactorId) < 0) return Promise.resolve(null);
    var pose = cfg.pose === 'open' ? 'open' : 'closed';
    var era = cfg.era || {};
    var key = [cfg.formFactorId, cfg.bodyHex, era.primary, era.bg, era.accent, cfg.width].join('|');
    var cur = container.__fold3d;
    if (cur && cur.key === key && cur.handle.alive()) {
        cur.handle.setPose(pose, true);
        return Promise.resolve(cur.handle);
    }
    disposeFoldMockup3D(container);
    var token = ++_tokenSeq;
    container.__fold3dToken = token;
    return loadThree().then(function (THREE) {
        if (container.__fold3dToken !== token || !container.isConnected) return null;
        var handle = createFoldScene(THREE, container, cfg);
        handle.setPose(pose, false);
        container.__fold3d = { key: key, handle: handle };
        return handle;
    });
}

// Buang model 3D di container (dan batalkan permintaan yang masih menunggu).
export function disposeFoldMockup3D(container) {
    if (!container) return;
    container.__fold3dToken = 0;
    var cur = container.__fold3d;
    if (cur) {
        cur.handle.dispose();
        container.__fold3d = null;
    }
}
