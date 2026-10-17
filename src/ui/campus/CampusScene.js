// FILE: src/ui/campus/CampusScene.js
// v2027.38 — peta 30x30: pandangan lebih lebar, batas geser & zoom-out lebih luas,
// dekorasi era (ladang angin, monorail), kapal/helikopter/kereta ikut level.
// v2027.37a — kampus tumbuh: bangunan muncul/naik level otomatis, gaya ikut era,
// animasi tumbuh singkat, tap bangunan untuk info. Tetap render-on-demand.
// Upgrade detail: cahaya hangat/dingin per tema, zoom lebih dalam, kontrol inertia.
import {
    createAssets, buildGround, buildTree, buildHQ, buildSlot, buildSprawl,
    computePlan, rememberPeak, describeBuilding, buildWind, buildRail,
    PALETTES, TREE_SPOTS, ERA_WINDOWS, SLOT_ORDER, SPRAWL_SPOTS
} from './CampusBuildings.js';
import { createCampusControls } from './CampusControls.js';
import { createCampusLife } from './CampusLife.js';

var BASE_VIEW = 22;
var MAX_DPR = 1.5;              // hemat GPU di HP DPR 3+
var MIN_RESIZE_DELTA = 2;       // piksel — skip resize kalau perubahan < 2px
var GROW_MS = 650;              // durasi animasi bangunan tumbuh
var TIP_MS = 2800;              // lama tooltip tampil
var FRAME_MS = 33;              // ~30fps untuk animasi ambient (hemat baterai)

function readAccent() {
    try {
        var v = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        if (v && v.trim()) return v.trim();
    } catch (e) {}
    return '#2563eb';
}

function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function prefersReducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
}

export function createCampusScene(THREE, container, gameState) {
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setClearColor(0x000000, 0);
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.innerHTML = '';
    container.appendChild(canvas);

    // Tooltip kecil (pointer-events none supaya tidak mengganggu drag/pinch peta).
    var tip = document.createElement('div');
    tip.style.cssText = 'position:absolute;left:50%;top:10px;transform:translateX(-50%);' +
        'max-width:90%;padding:6px 12px;border-radius:10px;text-align:center;font-size:12px;' +
        'line-height:1.35;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .2s;z-index:2;' +
        'background:var(--bg-2);color:var(--text-primary);border:1px solid var(--border);' +
        'box-shadow:var(--shadow-sm);';
    container.appendChild(tip);
    var tipTimer = null;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    var hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1);
    var sun = new THREE.DirectionalLight(0xfff1da, 0.8);
    sun.position.set(8, 10, 5);
    scene.add(hemi, sun);

    var A = createAssets(THREE);
    scene.add(buildGround(A, THREE));
    var trees = [];
    TREE_SPOTS.forEach(function (p) { var tr = buildTree(A, THREE, p[0], p[1]); trees.push(tr); scene.add(tr); });
    // Animasi ambient (mobil, awan, asap, drone, dll). Dimatikan bila pengguna memilih reduced-motion.
    var life = prefersReducedMotion() ? null : createCampusLife(THREE, A, scene, trees);
    var ambient = !!life;
    var loopRaf = 0, lastFrame = 0, inView = true;

    var dyn = {};                 // key -> { group, level, era }
    var eraIdx = -1;              // era desain yang sedang dipakai
    var appliedSig = '';
    var hasApplied = false;
    var lastPlan = null, lastData = null;
    var animList = [], animRaf = 0;
    var aspect = 1, raf = 0, disposed = false;
    var lastW = 0, lastH = 0;
    var resizeScheduled = false;
    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();

    function applyCamera() {
        var v = controls.view;
        var h = BASE_VIEW / v.zoom, w = h * aspect;
        camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
        camera.position.set(v.x + 20, 20, v.z + 20);
        camera.lookAt(v.x, 0, v.z);
        camera.updateProjectionMatrix();
    }

    function startLoop() {
        if (!ambient || loopRaf || disposed || document.hidden || !inView) return;
        loopRaf = requestAnimationFrame(frame);
    }

    // Loop tunggal ~30fps; berhenti total saat tab tersembunyi / peta di luar layar.
    function frame(now) {
        loopRaf = 0;
        if (disposed || document.hidden || !inView) return;
        loopRaf = requestAnimationFrame(frame);
        if (now - lastFrame < FRAME_MS) return;
        lastFrame = now;
        if (animList.length) stepGrow(now);
        life.update(now / 1000);
        renderer.render(scene, camera);
    }

    function requestRender() {
        if (ambient) { startLoop(); return; }
        if (raf || disposed) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            if (disposed || document.hidden) return;
            renderer.render(scene, camera);
        });
    }

    // ---------- animasi tumbuh (hanya jalan selama ada yang beranimasi) ----------
    function stepGrow(now) {
        var live = [];
        for (var i = 0; i < animList.length; i++) {
            var a = animList[i];
            var p = Math.min(1, (now - a.t0) / GROW_MS);
            a.o.scale.y = p >= 1 ? 1 : Math.max(0.001, easeOutBack(p));
            if (p < 1) live.push(a);
        }
        animList = live;
    }

    function tick(now) {
        animRaf = 0;
        if (disposed) return;
        stepGrow(now);
        if (!document.hidden) renderer.render(scene, camera);
        if (animList.length) animRaf = requestAnimationFrame(tick);
    }

    function grow(obj) {
        obj.scale.y = 0.001;
        animList.push({ o: obj, t0: performance.now() });
        if (ambient) startLoop();
        else if (!animRaf) animRaf = requestAnimationFrame(tick);
    }

    // ---------- kelola bangunan dinamis ----------
    function setBuilding(key, level, make, animate) {
        var cur = dyn[key];
        if (!level) {
            if (cur) { scene.remove(cur.group); delete dyn[key]; }
            return;
        }
        if (cur && cur.level === level && cur.era === eraIdx) return;
        var g = make();
        if (!g) return;
        var isUpgrade = !cur || level > cur.level;
        if (cur) scene.remove(cur.group);
        scene.add(g);
        dyn[key] = { group: g, level: level, era: eraIdx };
        if (animate && isUpgrade) grow(g);
    }

    function syncBuildings(plan, animate) {
        var lv = plan.levels;
        if (life) {
            life.setFactory(lv.factory);
            life.setPort(lv.port);
            life.setHq(lv.hq);
            life.setRail(plan.rail);
        }
        setBuilding('hq', lv.hq, function () { return buildHQ(A, THREE, lv.hq, eraIdx); }, animate);
        SLOT_ORDER.forEach(function (id) {
            setBuilding(id, lv[id], function () { return buildSlot(A, THREE, id, lv[id], eraIdx); }, animate);
        });
        setBuilding('rail', plan.rail ? 1 : 0, function () { return buildRail(A, THREE); }, animate);
        setBuilding('wind', plan.wind ? 1 : 0, function () { return buildWind(A, THREE); }, animate);
        if (life) life.setWind(dyn.wind ? dyn.wind.group.userData.rotors : null);
        for (var i = 0; i < SPRAWL_SPOTS.length; i++) {
            (function (idx) {
                setBuilding('blk' + idx, idx < plan.sprawl ? 1 : 0,
                    function () { return buildSprawl(A, THREE, idx, eraIdx); }, animate);
            })(i);
        }
    }

    // ---------- tap bangunan -> info ----------
    function hideTip() {
        if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
        tip.style.opacity = '0';
    }

    function showTip(info) {
        if (!info) { hideTip(); return; }
        tip.innerHTML = '';
        var t1 = document.createElement('div');
        t1.style.fontWeight = '700';
        t1.textContent = info.title;
        var t2 = document.createElement('div');
        t2.style.cssText = 'font-size:11px;color:var(--text-tertiary);';
        t2.textContent = info.sub;
        tip.appendChild(t1);
        tip.appendChild(t2);
        tip.style.opacity = '1';
        if (tipTimer) clearTimeout(tipTimer);
        tipTimer = setTimeout(hideTip, TIP_MS);
    }

    function handleTap(cx, cy) {
        if (disposed || !lastPlan) return;
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        raycaster.setFromCamera(ndc, camera);
        var groups = Object.keys(dyn).map(function (k) { return dyn[k].group; });
        var hits = raycaster.intersectObjects(groups, true);
        if (!hits.length) { hideTip(); return; }
        var o = hits[0].object;
        while (o && !(o.userData && o.userData.id)) o = o.parent;
        showTip(o ? describeBuilding(o.userData.id, lastPlan, lastData) : null);
    }

    var controls = createCampusControls(canvas, {
        unitsPerPixel: function (zoom) { return (BASE_VIEW / zoom) / Math.max(1, container.clientHeight); },
        maxZoom: 3.2,                // detail halus untuk zoom dekat
        minZoom: 0.5,                // zoom-out cukup jauh untuk melihat seluruh pulau 30x30
        limit: 11,                   // batas geser (pulau lebih besar)
        onChange: function () { applyCamera(); requestRender(); },
        onTap: handleTap
    });

    function resize() {
        if (disposed || resizeScheduled) return;
        resizeScheduled = true;
        requestAnimationFrame(function () {
            resizeScheduled = false;
            if (disposed || document.hidden) return;
            var w = container.clientWidth;
            var h = container.clientHeight;
            if (!w || !h) return;
            if (Math.abs(w - lastW) < MIN_RESIZE_DELTA && Math.abs(h - lastH) < MIN_RESIZE_DELTA) return;
            lastW = w;
            lastH = h;
            renderer.setSize(w, h, false);
            aspect = w / h;
            applyCamera();
            requestRender();
        });
    }

    function applyTheme() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        var base = dark ? PALETTES.dark : PALETTES.light;
        var p = Object.assign({}, base);
        var w = ERA_WINDOWS[Math.max(0, eraIdx)];
        if (w) p.window = dark ? w.dark : w.light;     // warna jendela ikut era
        A.applyPalette(p, readAccent());
        if (life) life.setTheme(dark, p.window);
        hemi.color.setHex(p.hemiSky);
        hemi.groundColor.setHex(p.hemiGround);
        hemi.intensity = p.hemiI;
        sun.intensity = p.dirI;
        if (p.sunCol !== undefined) sun.color.setHex(p.sunCol);   // hangat siang, kebiruan malam
    }

    // Dipanggil sering (setiap state:changed) — murah: keluar cepat kalau plan sama.
    function update(data) {
        if (disposed || !data) return;
        var plan = computePlan(data);
        rememberPeak(data, plan);
        lastData = data;
        if (plan.sig === appliedSig) return;

        var animate = hasApplied && !prefersReducedMotion();
        if (plan.eraIdx !== eraIdx) {
            eraIdx = plan.eraIdx;
            if (life) life.setEra(eraIdx);
            applyTheme();
        }
        syncBuildings(plan, animate);
        appliedSig = plan.sig;
        hasApplied = true;
        lastPlan = plan;
        requestRender();
    }

    function onVis() { if (!document.hidden) requestRender(); }
    var io = null;
    if (ambient && typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(function (en) {
            inView = en[en.length - 1].isIntersecting;
            if (inView) requestRender();
        });
        io.observe(container);
    }
    document.addEventListener('visibilitychange', onVis);

    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(resize);
        ro.observe(container);
    } else {
        window.addEventListener('resize', resize);
    }

    applyTheme();
    update(gameState);
    resize();

    return {
        update: update,
        refreshTheme: function () { applyTheme(); requestRender(); },
        dispose: function () {
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            if (loopRaf) cancelAnimationFrame(loopRaf);
            if (io) io.disconnect();
            if (life) life.dispose();
            if (animRaf) cancelAnimationFrame(animRaf);
            if (tipTimer) clearTimeout(tipTimer);
            if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVis);
            controls.dispose();
            A.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            if (tip.parentNode) tip.parentNode.removeChild(tip);
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }
    };
}
