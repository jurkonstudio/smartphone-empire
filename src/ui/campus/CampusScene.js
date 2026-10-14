// FILE: src/ui/campus/CampusScene.js
// v2027.38b — force render saat carousel scroll (anti hitam mid-swipe)
import { createAssets, buildGround, buildTree, buildHQ, getHqLevel, PALETTES, TREE_SPOTS } from './CampusBuildings.js';
import { createCampusControls } from './CampusControls.js';
import { bus } from '../../core/EventBus.js';

var BASE_VIEW = 16;
var MAX_DPR = 1.5;
var MIN_RESIZE_DELTA = 2;

function readAccent() {
    try {
        var v = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        if (v && v.trim()) return v.trim();
    } catch (e) {}
    return '#2563eb';
}

export function createCampusScene(THREE, container, gameState) {
    var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
        preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setClearColor(0x000000, 0);
    var canvas = renderer.domElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.innerHTML = '';
    container.appendChild(canvas);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    var hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1);
    var sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(6, 10, 4);
    scene.add(hemi, sun);

    var A = createAssets(THREE);
    scene.add(buildGround(A, THREE));
    TREE_SPOTS.forEach(function (p) { scene.add(buildTree(A, THREE, p[0], p[1])); });

    var hq = null, hqLevel = 0;
    var aspect = 1, raf = 0, disposed = false;
    var lastW = 0, lastH = 0;
    var resizeScheduled = false;

    function applyCamera() {
        var v = controls.view;
        var h = BASE_VIEW / v.zoom, w = h * aspect;
        camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
        camera.position.set(v.x + 20, 20, v.z + 20);
        camera.lookAt(v.x, 0, v.z);
        camera.updateProjectionMatrix();
    }

    function requestRender() {
        if (raf || disposed) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            if (disposed || document.hidden) return;
            renderer.render(scene, camera);
        });
    }

    // v2027.38b — render langsung tanpa debounce (untuk scroll force render)
    function forceRender() {
        if (disposed || document.hidden) return;
        renderer.render(scene, camera);
    }

    var controls = createCampusControls(canvas, {
        unitsPerPixel: function (zoom) { return (BASE_VIEW / zoom) / Math.max(1, container.clientHeight); },
        onChange: function () { applyCamera(); requestRender(); }
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
        var p = dark ? PALETTES.dark : PALETTES.light;
        A.applyPalette(p, readAccent());
        hemi.color.setHex(p.hemiSky);
        hemi.groundColor.setHex(p.hemiGround);
        hemi.intensity = p.hemiI;
        sun.intensity = p.dirI;
    }

    function update(data) {
        var lvl = getHqLevel(data);
        if (lvl === hqLevel) return;
        if (hq) scene.remove(hq);
        hq = buildHQ(A, THREE, lvl);
        scene.add(hq);
        hqLevel = lvl;
        requestRender();
    }

    function onVis() { if (!document.hidden) requestRender(); }
    document.addEventListener('visibilitychange', onVis);

    // v2027.38b — listen event dari main.js, force render selama swipe
    var unsubScroll = bus.on('home:carousel-scroll', forceRender);
    var unsubScrollEnd = bus.on('home:carousel-scroll-end', requestRender);

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
        forceRender: forceRender,
        refreshTheme: function () { applyTheme(); requestRender(); },
        dispose: function () {
            disposed = true;
            if (raf) cancelAnimationFrame(raf);
            if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', onVis);
            if (typeof unsubScroll === 'function') unsubScroll();
            if (typeof unsubScrollEnd === 'function') unsubScrollEnd();
            controls.dispose();
            A.dispose();
            renderer.dispose();
            try { renderer.forceContextLoss(); } catch (e) {}
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }
    };
}
