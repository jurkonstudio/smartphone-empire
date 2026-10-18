// FILE: src/ui/campus/CampusControls.js
// v2027.44 (Tahap 4) — + flyTo(x, z, zoom) kamera terbang halus, zoomTo(z), reset().
//   Sentuhan / roda mouse / double-tap membatalkan animasi terbang.
// Kontrol sentuh: drag 1 jari = geser (dengan inertia), pinch 2 jari = zoom,
// roda mouse = zoom, double-tap = zoom in/out halus.
// view = { x, z, zoom } dibaca oleh CampusScene untuk menaruh kamera.
var S = Math.SQRT1_2;
var SQRT3 = Math.sqrt(3); // 1 / sin(elevasi kamera isometrik)

export function createCampusControls(el, cfg) {
    var view = { x: 0, z: 0, zoom: 1 };
    var ptrs = new Map();
    var pinchDist = 0, moved = 0, downT = 0;
    var minZoom = cfg.minZoom || 0.7, maxZoom = cfg.maxZoom || 2.4, limit = cfg.limit || 7;

    // inertia & animasi zoom
    var vel = { x: 0, y: 0 };      // px per ms
    var lastMoveT = 0;
    var zoomTarget = 0;            // 0 = tidak ada animasi zoom
    var raf = 0, lastT = 0;
    var lastTap = { t: 0, x: 0, y: 0 };
    var fly = null;                // animasi kamera terbang { t0, dur, fx, fz, fzoom, tx, tz, tzoom }

    el.style.touchAction = 'none'; // cegah scroll/zoom bawaan browser di atas peta

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function changed() { if (cfg.onChange) cfg.onChange(view); }

    function panBy(dx, dy) {
        var upp = cfg.unitsPerPixel(view.zoom);
        // kanan layar = (S,0,-S), atas layar di tanah = (-S,0,-S)
        view.x += -dx * upp * S - dy * upp * SQRT3 * S;
        view.z +=  dx * upp * S - dy * upp * SQRT3 * S;
        view.x = clamp(view.x, -limit, limit);
        view.z = clamp(view.z, -limit, limit);
    }
    function zoomBy(f) { view.zoom = clamp(view.zoom * f, minZoom, maxZoom); }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function dist() {
        var a = Array.from(ptrs.values());
        return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    }

    // Satu loop kecil: hanya hidup selama ada inertia / animasi zoom.
    function kick() {
        if (raf) return;
        lastT = performance.now();
        raf = requestAnimationFrame(loop);
    }
    function loop(now) {
        raf = 0;
        var dt = Math.min(48, now - lastT) || 16;
        lastT = now;
        var active = false;

        if (fly) {
            var p = Math.min(1, (performance.now() - fly.t0) / fly.dur);
            var e = ease(p);
            view.x = fly.fx + (fly.tx - fly.fx) * e;
            view.z = fly.fz + (fly.tz - fly.fz) * e;
            view.zoom = fly.fzoom + (fly.tzoom - fly.fzoom) * e;
            if (p >= 1) fly = null; else active = true;
        }
        if (!ptrs.size && (Math.abs(vel.x) > 0.02 || Math.abs(vel.y) > 0.02)) {
            panBy(vel.x * dt, vel.y * dt);
            var fr = Math.pow(0.92, dt / 16);
            vel.x *= fr; vel.y *= fr;
            active = true;
        } else if (!ptrs.size) {
            vel.x = vel.y = 0;
        }
        if (zoomTarget) {
            var k = 1 - Math.pow(0.82, dt / 16);
            view.zoom += (zoomTarget - view.zoom) * k;
            if (Math.abs(zoomTarget - view.zoom) < 0.005) { view.zoom = zoomTarget; zoomTarget = 0; }
            else active = true;
        }
        changed();
        if (active) raf = requestAnimationFrame(loop);
    }

    function onDown(e) {
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        vel.x = vel.y = 0;           // sentuhan menghentikan inertia
        zoomTarget = 0;
        fly = null;
        if (ptrs.size === 1) { moved = 0; downT = Date.now(); lastMoveT = performance.now(); }
        if (ptrs.size === 2) { pinchDist = dist(); moved += 99; }
    }
    function onMove(e) {
        var p = ptrs.get(e.pointerId);
        if (!p) return;
        var dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        if (ptrs.size === 1) {
            moved += Math.abs(dx) + Math.abs(dy);
            panBy(dx, dy);
            var now = performance.now();
            var ms = Math.max(1, now - lastMoveT);
            lastMoveT = now;
            vel.x = vel.x * 0.6 + (dx / ms) * 0.4;   // rata-rata bergerak
            vel.y = vel.y * 0.6 + (dy / ms) * 0.4;
            changed();
        } else if (ptrs.size === 2) {
            var nd = dist();
            if (pinchDist > 0) zoomBy(nd / pinchDist);
            pinchDist = nd;
            changed();
        }
    }
    function onUp(e) {
        var wasTap = ptrs.size === 1 && moved < 8 && Date.now() - downT < 300;
        ptrs.delete(e.pointerId);
        if (ptrs.size < 2) pinchDist = 0;
        if (wasTap) { vel.x = vel.y = 0; }
        else if (!ptrs.size && performance.now() - lastMoveT < 80) kick();   // lepas sambil bergerak -> luncur
        if (wasTap && e.type === 'pointerup') {
            var nowT = Date.now();
            if (nowT - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 28) {
                lastTap.t = 0;
                fly = null;
                zoomTarget = view.zoom > (minZoom + maxZoom) / 2 ? 1 : Math.min(maxZoom, 2);
                kick();
            } else {
                lastTap.t = nowT; lastTap.x = e.clientX; lastTap.y = e.clientY;
                if (cfg.onTap) cfg.onTap(e.clientX, e.clientY);
            }
        }
    }
    function onWheel(e) {
        e.preventDefault();
        zoomTarget = 0;
        fly = null;
        zoomBy(Math.exp(-e.deltaY * 0.001));
        changed();
    }

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    // Terbang halus ke (x, z) dengan zoom tertentu. ms = 0 / reduceMotion -> langsung pindah.
    function flyTo(x, z, zoom, ms) {
        var tz = (zoom == null) ? view.zoom : clamp(zoom, minZoom, maxZoom);
        var tx = clamp(x, -limit, limit), tzz = clamp(z, -limit, limit);
        vel.x = vel.y = 0;
        zoomTarget = 0;
        var instant = ms === 0 || (cfg.reduceMotion && cfg.reduceMotion());
        if (instant) {
            fly = null;
            view.x = tx; view.z = tzz; view.zoom = tz;
            changed();
            return;
        }
        fly = { t0: performance.now(), dur: ms || 520, fx: view.x, fz: view.z, fzoom: view.zoom, tx: tx, tz: tzz, tzoom: tz };
        kick();
    }
    // Zoom halus ke nilai tertentu (tanpa menggeser pusat).
    function zoomTo(zm) {
        fly = null;
        var target = clamp(zm, minZoom, maxZoom);
        if (cfg.reduceMotion && cfg.reduceMotion()) { zoomTarget = 0; view.zoom = target; changed(); return; }
        zoomTarget = target;
        kick();
    }

    return {
        view: view,
        flyTo: flyTo,
        zoomTo: zoomTo,
        reset: function () { flyTo(0, 0, 1); },
        dispose: function () {
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            fly = null;
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onUp);
            el.removeEventListener('wheel', onWheel);
            ptrs.clear();
        }
    };
}
