// FILE: src/ui/campus/CampusControls.js
// Kontrol sentuh: drag 1 jari = geser, pinch 2 jari = zoom, roda mouse = zoom.
// view = { x, z, zoom } dibaca oleh CampusScene untuk menaruh kamera.
var S = Math.SQRT1_2;
var SQRT3 = Math.sqrt(3); // 1 / sin(elevasi kamera isometrik)

export function createCampusControls(el, cfg) {
    var view = { x: 0, z: 0, zoom: 1 };
    var ptrs = new Map();
    var pinchDist = 0, moved = 0, downT = 0;
    var minZoom = cfg.minZoom || 0.7, maxZoom = cfg.maxZoom || 2.4, limit = cfg.limit || 7;

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
    function dist() {
        var a = Array.from(ptrs.values());
        return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    }

    function onDown(e) {
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ptrs.size === 1) { moved = 0; downT = Date.now(); }
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
        if (wasTap && e.type === 'pointerup' && cfg.onTap) cfg.onTap(e.clientX, e.clientY);
    }
    function onWheel(e) {
        e.preventDefault();
        zoomBy(Math.exp(-e.deltaY * 0.001));
        changed();
    }

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return {
        view: view,
        dispose: function () {
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
            el.removeEventListener('pointercancel', onUp);
            el.removeEventListener('wheel', onWheel);
            ptrs.clear();
        }
    };
}
