// FILE: src/ui/campus/CampusScene.js
// v2027.60 — PREMIUM LOOK: tone mapping ACES + sRGB, rig cahaya (matahari/fill/rim/hemi) + environment
// map prosedural, shadow map statis (hanya dihitung ulang saat bangunan berubah) dengan tier adaptif,
// hutan & semak instanced, label gedung terproyeksi, hover ring (mouse), seleksi fade halus,
// pembersihan InstancedMesh saat bangunan diganti. Kontrol kamera, tap, kartu info, naik-level,
// ID/koordinat bangunan dan data TIDAK diubah.
// v2027.44 — TAHAP 4: peta interaktif. Tap bangunan = kartu info (level, progres, tombol
// "Buka panel"), cincin seleksi berdenyut, kamera terbang halus ke bangunan, efek + banner
// saat bangunan naik level, tombol zoom/reset, kartu ringkas di layar kecil, dua bahasa.
// v2027.38 — peta 30x30: pandangan lebih lebar, batas geser & zoom-out lebih luas,
// dekorasi era (ladang angin, monorail), kapal/helikopter/kereta ikut level.
// v2027.37a — kampus tumbuh: bangunan muncul/naik level otomatis, gaya ikut era,
// animasi tumbuh singkat, tap bangunan untuk info. Tetap render-on-demand.
// Upgrade detail: cahaya hangat/dingin per tema, zoom lebih dalam, kontrol inertia.
import {
    createAssets, buildGround, buildForest, buildShrubs, buildHQ, buildSlot, buildSprawl,
    computePlan, rememberPeak, buildWind, buildRail, applyShadowFlags, disposeObject, flavorKeyFor,
    PALETTES, TREE_SPOTS, ERA_WINDOWS, SLOT_ORDER, SPRAWL_SPOTS
} from './CampusBuildings.js';
import { detectQuality, createLookRig } from './CampusLook.js';
import { createCampusLabels } from './CampusLabels.js';
import { createCampusControls } from './CampusControls.js';
import { createCampusLife } from './CampusLife.js';
import { createCampusFx } from './CampusFx.js';
import { createCampusOverlay } from './CampusOverlay.js';
import { getBuildingInfo, getBuildingName, getUiStrings, hasCelebration } from './CampusInfo.js';

var BASE_VIEW = 22;
// DPR maksimum sekarang adaptif per tier kualitas (lihat detectQuality di CampusLook.js).
var MIN_RESIZE_DELTA = 2;       // piksel — skip resize kalau perubahan < 2px
var GROW_MS = 650;              // durasi animasi bangunan tumbuh
var COMPACT_H = 300;            // tinggi peta (px) di bawah ini -> kartu info mode ringkas
var FOCUS_ZOOM = 1.5;           // zoom minimum saat kamera terbang ke bangunan
var FOCUS_SHIFT = 0.14;         // geser fokus ke atas layar (porsi tinggi) agar kartu tidak menutupi
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
    var PERF = window.__PERF || {};
    var quality = detectQuality(PERF);
    var renderer = new THREE.WebGLRenderer({
        antialias: PERF.antialias !== false,
        alpha: true,
        powerPreference: quality.tier === 'high' ? 'default' : 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxDpr));
    renderer.setClearColor(0x000000, 0);
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.innerHTML = '';
    container.appendChild(canvas);

    // Label gedung dibuat sebelum overlay agar urutan DOM: canvas < label < tombol/kartu.
    var labels = createCampusLabels(THREE, container);

    // Lapisan UI: kartu info, tombol zoom/reset, banner naik level.
    var overlay = createCampusOverlay(container, {
        onClose: function () { deselect(); },
        onReset: function () { controls.reset(); },
        onZoom: function (dir) { controls.zoomTo(controls.view.zoom * (dir > 0 ? 1.4 : 1 / 1.4)); }
    });
    overlay.setLabels(getUiStrings());

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    var rig = createLookRig(THREE, renderer, scene, quality);   // cahaya + tone mapping + shadow + env
    var fx = createCampusFx(THREE);
    scene.add(fx.group);
    var selected = null;          // { id, key, cx, cz, r, top, ring }
    var hoverKey = null, hoverRaf = 0, hoverPt = null;   // hover mouse (desktop)
    var pendingCele = [];         // bangunan yang baru naik level pada sinkronisasi ini

    var A = createAssets(THREE, { shadows: rig.shadowsOn, env: rig.envOn });
    scene.add(buildGround(A, THREE));
    var forest = buildForest(A, THREE, TREE_SPOTS);     // pohon instanced; nodes[i].rotation dipakai CampusLife
    scene.add(forest.group);
    var shrubs = buildShrubs(A, THREE);
    scene.add(shrubs);
    var shadowDirty = true;       // shadow map statis: hitung ulang hanya saat geometri berubah
    // Animasi ambient (mobil, awan, asap, drone, dll). Dimatikan bila pengguna memilih reduced-motion.
    var life = prefersReducedMotion() ? null : createCampusLife(THREE, A, scene, forest.nodes);
    var ambient = !!life;
    fx.setImmediate(!ambient);
    var loopRaf = 0, loopTimer = 0, lastFrame = 0, inView = true;
    var swayTick = 0;

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
        labels.update(camera, lastW || container.clientWidth, lastH || container.clientHeight, v.zoom);
    }

    // Semua render lewat sini: shadow map diperbarui hanya bila ditandai kotor.
    function draw() {
        if (shadowDirty) { rig.requestShadowUpdate(); shadowDirty = false; }
        renderer.render(scene, camera);
    }

    // Putar bagian bangunan yang bergerak (hanya saat loop ambient jalan; reduced-motion = diam).
    function spinParts(t) {
        for (var k in dyn) {
            var sp = dyn[k].group.userData.spin;
            if (!sp) continue;
            for (var i = 0; i < sp.length; i++) sp[i].o.rotation.y = (sp[i].o.userData.base || 0) + t * sp[i].v;
        }
    }

    function startLoop() {
        if (!ambient || loopRaf || loopTimer || disposed || document.hidden || !inView) return;
        loopRaf = requestAnimationFrame(frame);
    }

    // PERF: antar frame tidur dengan setTimeout (tidak bangun di tiap vsync). Berhenti total
    // saat tab tersembunyi / peta di luar layar.
    function frameGap() { return Math.max(FRAME_MS, PERF.frameMs || 0); }
    function scheduleNext() {
        var wait = frameGap() - (performance.now() - lastFrame) - 5;
        if (wait > 4) {
            loopTimer = setTimeout(function () { loopTimer = 0; loopRaf = requestAnimationFrame(frame); }, wait);
        } else {
            loopRaf = requestAnimationFrame(frame);
        }
    }
    function frame(now) {
        loopRaf = 0;
        if (disposed || document.hidden || !inView) return;
        if (now - lastFrame < frameGap() - 2) { scheduleNext(); return; }
        lastFrame = now;
        scheduleNext();
        if (animList.length) stepGrow(now);
        fx.update(now);
        life.update(now / 1000);
        spinParts(now / 1000);
        if ((swayTick++ & 1) === 0) forest.flush();      // sway pohon cukup ~15fps
        draw();
    }

    function requestRender() {
        if (ambient) { startLoop(); return; }
        if (raf || disposed) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            if (disposed || document.hidden) return;
            draw();
        });
    }

    // ---------- animasi tumbuh (hanya jalan selama ada yang beranimasi) ----------
    function stepGrow(now) {
        shadowDirty = true;           // bangunan sedang tumbuh -> bayangan ikut bergerak
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
        if (!document.hidden) draw();
        if (animList.length) animRaf = requestAnimationFrame(tick);
    }

    function grow(obj) {
        obj.scale.y = 0.001;
        animList.push({ o: obj, t0: performance.now() });
        if (ambient) startLoop();
        else if (!animRaf) animRaf = requestAnimationFrame(tick);
    }

    // ---------- kelola bangunan dinamis ----------
    function setBuilding(key, level, make, animate, fsig) {
        var cur = dyn[key];
        fsig = fsig || '';
        if (!level) {
            if (cur) { scene.remove(cur.group); disposeObject(cur.group); delete dyn[key]; shadowDirty = true; }
            return;
        }
        if (cur && cur.level === level && cur.era === eraIdx && cur.fl === fsig) return;
        var g = make();
        if (!g) return;
        var isUpgrade = !cur || level > cur.level;
        if (cur) { scene.remove(cur.group); disposeObject(cur.group); }   // lepas buffer InstancedMesh lama
        applyShadowFlags(g, rig.shadowsOn);
        if (key === 'wind' && g.userData.rotors) {       // rotor berputar -> jangan masuk shadow map statis
            g.userData.rotors.forEach(function (h) { h.traverse(function (o) { o.castShadow = false; }); });
        }
        if (g.userData.spin) {                           // bagian berputar (cincin riset, wafer, ponsel) juga
            g.userData.spin.forEach(function (sp) { sp.o.traverse(function (o) { o.castShadow = false; }); });
        }
        shadowDirty = true;
        scene.add(g);
        dyn[key] = { group: g, level: level, era: eraIdx, fl: fsig };
        if (animate && isUpgrade) grow(g);
        // Banner naik level tetap muncul walau reduced-motion (efek partikel yang dilewati).
        if (hasApplied && isUpgrade && hasCelebration(key)) pendingCele.push({ key: key, level: level, born: !cur });
    }

    function syncBuildings(plan, animate) {
        var lv = plan.levels;
        A.flavor = plan.flavor;                          // sinyal isi-game dibaca builder lewat A.flavor
        var fl = plan.flavor;
        if (life) {
            life.setFactoryBusy(!!(fl && fl.fabBusy));
            life.setFactory(lv.factory);
            life.setPort(lv.port);
            life.setHq(lv.hq);
            life.setRail(plan.rail);
        }
        setBuilding('hq', lv.hq, function () { return buildHQ(A, THREE, lv.hq, eraIdx); }, animate, flavorKeyFor('hq', fl));
        SLOT_ORDER.forEach(function (id) {
            setBuilding(id, lv[id], function () { return buildSlot(A, THREE, id, lv[id], eraIdx); }, animate, flavorKeyFor(id, fl));
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
        afterSync();
    }

    // ---------- ukur bangunan (pakai skala penuh walau sedang animasi tumbuh) ----------
    var box3 = new THREE.Box3(), v3a = new THREE.Vector3(), v3b = new THREE.Vector3();
    function measure(group) {
        var sy = group.scale.y;
        group.scale.y = 1;
        group.updateMatrixWorld(true);
        box3.setFromObject(group);
        box3.getSize(v3a);
        box3.getCenter(v3b);
        group.scale.y = sy;
        group.updateMatrixWorld(true);
        return {
            cx: v3b.x, cz: v3b.z, top: box3.max.y,
            r: Math.max(0.9, Math.min(4.5, Math.hypot(v3a.x, v3a.z) * 0.45 + 0.2))
        };
    }

    // ---------- efek + banner naik level ----------
    function celebrate(list) {
        if (!list.length) return;
        var reduced = prefersReducedMotion();
        var U = getUiStrings();
        if (!reduced) {
            list.slice(0, 3).forEach(function (c) {
                var d = dyn[c.key];
                if (!d) return;
                var m = measure(d.group);
                fx.burst(m.cx, m.cz, m.r, m.top);
            });
            startLoop();
        }
        var first = list[0];
        var nm = getBuildingName(first.key);
        var title = list.length > 1 ? U.multi(list.length)
            : (first.born ? U.built(nm) : U.up(nm, first.level));
        overlay.showBanner(title, U.bannerSub);
    }

    function afterSync() {
        var list = pendingCele;
        pendingCele = [];
        if (selected) {                      // bangunan terpilih bisa saja diganti model / hilang
            var d = dyn[selected.key];
            if (!d) deselect(); else placeSelection(selected.id, selected.key, false);
        }
        celebrate(list);
    }

    // ---------- tap bangunan -> kartu info ----------
    function currentInfo() {
        return (selected && lastPlan) ? getBuildingInfo(selected.id, lastPlan, lastData) : null;
    }

    function refreshCard(force) {
        if (!selected) return;
        if (force) overlay.forceRefresh();
        overlay.showCard(currentInfo());
    }

    function deselect() {
        selected = null;
        fx.clearSelection();
        overlay.hideCard();
        labels.setState(null, hoverKey);
        requestRender();
    }

    // Tandai bangunan: cincin seleksi + (opsional) kamera terbang + kartu info.
    function placeSelection(id, key, flyCam) {
        var d = dyn[key];
        if (!d) return;
        var m = measure(d.group);
        var ring = id !== 'rail' && id !== 'wind';      // dekorasi panjang tidak diberi cincin
        selected = { id: id, key: key, cx: m.cx, cz: m.cz, r: m.r, top: m.top, ring: ring };
        if (ring) fx.select(m.cx, m.cz, m.r); else fx.clearSelection();
        if (hoverKey === key) { hoverKey = null; fx.clearHover(); canvas.style.cursor = ''; }
        labels.setState(key, hoverKey);
        if (flyCam && id !== 'rail') focusOn(m.cx, m.cz);
        refreshCard(true);
        requestRender();
    }

    // Terbang ke bangunan; titik fokus digeser agar bangunan tampil di atas kartu.
    function focusOn(cx, cz) {
        var zoom = Math.max(controls.view.zoom, FOCUS_ZOOM);
        var h = BASE_VIEW / zoom;
        var k = FOCUS_SHIFT * h * Math.sqrt(3) * Math.SQRT1_2;    // ke bawah layar = (+S, +S)
        controls.flyTo(cx + k, cz + k, zoom);
    }

    // Ray-pick bangunan di titik layar (cx, cy) -> { id, key } atau null.
    function pick(cx, cy) {
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        raycaster.setFromCamera(ndc, camera);
        var groups = Object.keys(dyn).map(function (k) { return dyn[k].group; });
        var hits = raycaster.intersectObjects(groups, true);
        if (!hits.length) return null;
        var o = hits[0].object;
        while (o && !(o.userData && o.userData.id)) o = o.parent;
        if (!o) return null;
        for (var k in dyn) { if (dyn[k].group === o) return { id: o.userData.id, key: k }; }
        return null;
    }

    function handleTap(cx, cy) {
        if (disposed || !lastPlan) return;
        var hit = pick(cx, cy);
        if (!hit) { deselect(); return; }
        placeSelection(hit.id, hit.key, true);
    }

    // ---------- hover (hanya mouse; sentuhan tidak punya hover) ----------
    function clearHover() {
        if (hoverKey === null) return;
        hoverKey = null;
        fx.clearHover();
        canvas.style.cursor = '';
        labels.setState(selected ? selected.key : null, null);
        requestRender();
    }
    function runHover() {
        hoverRaf = 0;
        if (disposed || !hoverPt || !lastPlan) return;
        var hit = pick(hoverPt.x, hoverPt.y);
        var k = (hit && hit.id !== 'rail' && hit.id !== 'wind' && hit.id !== 'sprawl') ? hit.key : null;
        if (k === hoverKey) return;
        hoverKey = k;
        if (k && !(selected && selected.key === k)) {
            var m = measure(dyn[k].group);
            fx.hover(m.cx, m.cz, m.r);
        } else {
            fx.clearHover();
        }
        canvas.style.cursor = k ? 'pointer' : '';
        labels.setState(selected ? selected.key : null, k);
        requestRender();
    }
    function onHoverMove(e) {
        if (e.pointerType !== 'mouse' || e.buttons) { clearHover(); return; }
        hoverPt = { x: e.clientX, y: e.clientY };
        if (!hoverRaf) hoverRaf = requestAnimationFrame(runHover);
    }
    canvas.addEventListener('pointermove', onHoverMove);
    canvas.addEventListener('pointerleave', clearHover);

    // ---------- label gedung (diproyeksikan dari atap tiap bangunan) ----------
    var LABEL_PRIO = { hq: 0, monument: 3, billboard: 3 };
    function syncLabels() {
        if (!lastPlan) return;
        var list = [];
        for (var key in dyn) {
            if (!hasCelebration(key)) continue;               // hanya bangunan ber-level (bukan dekorasi)
            var info = getBuildingInfo(key, lastPlan, lastData);
            if (!info) continue;
            var m = measure(dyn[key].group);
            list.push({
                key: key, id: key,
                name: (key === 'hq' && lastPlan.flavor && lastPlan.flavor.brand) ? lastPlan.flavor.brand : getBuildingName(key),
                level: info.level, max: info.max,
                x: m.cx, y: m.top + 0.45, z: m.cz,
                prio: LABEL_PRIO[key] !== undefined ? LABEL_PRIO[key] : 2
            });
        }
        labels.setItems(list);
    }

    var controls = createCampusControls(canvas, {
        unitsPerPixel: function (zoom) { return (BASE_VIEW / zoom) / Math.max(1, container.clientHeight); },
        maxZoom: 3.2,                // detail halus untuk zoom dekat
        minZoom: 0.5,                // zoom-out cukup jauh untuk melihat seluruh pulau 30x30
        limit: 11,                   // batas geser (pulau lebih besar)
        onChange: function () { applyCamera(); requestRender(); },
        reduceMotion: prefersReducedMotion,
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
            overlay.setCompact(h < COMPACT_H);
            renderer.setSize(w, h, false);
            aspect = w / h;
            applyCamera();
            requestRender();
        });
    }

    function applyTheme() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        var look = rig.applyTheme(dark);                  // cahaya, exposure, env (CampusLook.js)
        var base = dark ? PALETTES.dark : PALETTES.light;
        var p = Object.assign({}, base, look.colors, { aoOpacity: look.aoOpacity });
        var w = ERA_WINDOWS[Math.max(0, eraIdx)];
        if (w) p.window = dark ? w.dark : w.light;     // warna jendela ikut era
        A.applyPalette(p, readAccent());
        A.setEnvIntensity(look.envI);
        fx.setAccent(readAccent(), dark);
        if (life) life.setTheme(dark, p.window);
    }

    // Dipanggil sering (setiap state:changed) — murah: keluar cepat kalau plan sama.
    function update(data) {
        if (disposed || !data) return;
        var plan = computePlan(data);
        rememberPeak(data, plan);
        lastData = data;
        if (plan.sig === appliedSig) { if (selected) refreshCard(false); return; }

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
        syncLabels();
        if (selected) refreshCard(false);
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
        refreshLang: function () { overlay.setLabels(getUiStrings()); syncLabels(); refreshCard(true); },
        dispose: function () {
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            if (loopRaf) cancelAnimationFrame(loopRaf);
            if (loopTimer) { clearTimeout(loopTimer); loopTimer = 0; }
            if (io) io.disconnect();
            if (life) life.dispose();
            if (animRaf) cancelAnimationFrame(animRaf);
            if (hoverRaf) cancelAnimationFrame(hoverRaf);
            canvas.removeEventListener('pointermove', onHoverMove);
            canvas.removeEventListener('pointerleave', clearHover);
            labels.dispose();
            overlay.dispose();
            fx.dispose();
            if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVis);
            controls.dispose();
            for (var dk in dyn) disposeObject(dyn[dk].group);   // buffer InstancedMesh bangunan
            forest.dispose();
            disposeObject(shrubs);
            rig.dispose();
            A.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }
    };
}
