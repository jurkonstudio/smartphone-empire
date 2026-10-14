// FILE: src/ui/campus/CampusBuildings.js
// Pabrik geometri/material bersama + pembuat bangunan low-poly (flat shading).
// Semua geometry & material di-cache di "assets" supaya dispose cukup sekali.

// Warna per tema. Warna atap (roof) diambil dari CSS variable --accent.
export const PALETTES = {
    light: {
        grass: 0xcfe6c8, plaza: 0xeceff4, road: 0xd3d9e2, wall: 0xffffff,
        window: 0x8fb4e8, trunk: 0xb59a7a, leaf: 0x8cc98a,
        hemiSky: 0xffffff, hemiGround: 0xcfd6e0, hemiI: 0.95, dirI: 0.8
    },
    dark: {
        grass: 0x2d4a3b, plaza: 0x3b4252, road: 0x30353f, wall: 0xb4becd,
        window: 0x4f77b8, trunk: 0x6b5a45, leaf: 0x3f7a55,
        hemiSky: 0x9fb0d0, hemiGround: 0x20242d, hemiI: 0.7, dirI: 0.55
    }
};

export const TREE_SPOTS = [[-7, -6], [-5.5, -7.5], [7, -6.5], [8, -4], [-8, 5], [7.5, 6.5]];

var COLOR_ROLES = ['grass', 'plaza', 'road', 'wall', 'window', 'trunk', 'leaf'];

export function createAssets(THREE) {
    var geos = new Map();
    var mats = new Map();
    function cached(key, make) {
        if (!geos.has(key)) geos.set(key, make());
        return geos.get(key);
    }
    return {
        box: function (w, h, d) { return cached('b' + w + '_' + h + '_' + d, function () { return new THREE.BoxGeometry(w, h, d); }); },
        cyl: function (rt, rb, h, s) { return cached('y' + rt + '_' + rb + '_' + h + '_' + s, function () { return new THREE.CylinderGeometry(rt, rb, h, s); }); },
        cone: function (r, h, s) { return cached('c' + r + '_' + h + '_' + s, function () { return new THREE.ConeGeometry(r, h, s); }); },
        mat: function (role) {
            if (!mats.has(role)) mats.set(role, new THREE.MeshLambertMaterial({ flatShading: true }));
            return mats.get(role);
        },
        applyPalette: function (p, accent) {
            var self = this;
            COLOR_ROLES.forEach(function (r) { self.mat(r).color.setHex(p[r]); });
            try { self.mat('roof').color.set(accent); } catch (e) { self.mat('roof').color.setHex(0x2563eb); }
        },
        dispose: function () {
            geos.forEach(function (g) { g.dispose(); });
            mats.forEach(function (m) { m.dispose(); });
            geos.clear(); mats.clear();
        }
    };
}

function mesh(A, THREE, geo, role, x, y, z) {
    var m = new THREE.Mesh(geo, A.mat(role));
    m.position.set(x, y, z);
    return m;
}

// Tanah dasar, plaza, dan dua jalan.
export function buildGround(A, THREE) {
    var g = new THREE.Group();
    g.add(mesh(A, THREE, A.box(20, 0.6, 20), 'grass', 0, -0.3, 0));
    g.add(mesh(A, THREE, A.box(7, 0.08, 7), 'plaza', 0, 0.04, 0));
    g.add(mesh(A, THREE, A.box(2, 0.06, 6.5), 'road', 0, 0.03, 6.75));
    g.add(mesh(A, THREE, A.box(6.5, 0.06, 2), 'road', -6.75, 0.03, 0));
    return g;
}

export function buildTree(A, THREE, x, z) {
    var g = new THREE.Group();
    g.add(mesh(A, THREE, A.cyl(0.12, 0.16, 0.6, 6), 'trunk', 0, 0.3, 0));
    g.add(mesh(A, THREE, A.cone(0.7, 1.4, 6), 'leaf', 0, 1.3, 0));
    g.position.set(x, 0, z);
    return g;
}

// Level HQ diturunkan dari jumlah staf (state.staff.length).
export function getHqLevel(data) {
    var n = (data && Array.isArray(data.staff)) ? data.staff.length : 0;
    if (n >= 30) return 4;
    if (n >= 15) return 3;
    if (n >= 5) return 2;
    return 1;
}

// Satu blok gedung: badan + pita jendela per lantai + atap aksen.
function addBlock(group, A, THREE, w, h, d, x, z, floors) {
    group.add(mesh(A, THREE, A.box(w, h, d), 'wall', x, h / 2, z));
    var fh = h / floors;
    for (var i = 0; i < floors; i++) {
        group.add(mesh(A, THREE, A.box(w + 0.04, 0.32, d + 0.04), 'window', x, (i + 0.55) * fh, z));
    }
    group.add(mesh(A, THREE, A.box(w + 0.2, 0.14, d + 0.2), 'roof', x, h + 0.07, z));
}

export function buildHQ(A, THREE, level) {
    var g = new THREE.Group();
    g.position.y = 0.08; // di atas plaza
    if (level === 1) {
        addBlock(g, A, THREE, 3.2, 1.6, 2.6, 0, 0, 1);
    } else if (level === 2) {
        addBlock(g, A, THREE, 3.8, 2.8, 3.0, 0, 0, 2);
    } else if (level === 3) {
        addBlock(g, A, THREE, 4.2, 4.0, 3.2, 0, 0, 3);
        addBlock(g, A, THREE, 2.0, 1.6, 2.2, 3.2, 0.3, 1);
    } else {
        addBlock(g, A, THREE, 4.4, 4.8, 3.4, 0, 0, 4);
        addBlock(g, A, THREE, 2.0, 1.6, 2.2, 3.3, 0.3, 1);
        addBlock(g, A, THREE, 1.6, 7.0, 1.6, -1.2, -0.6, 6);
    }
    g.userData = { id: 'hq', level: level };
    return g;
}
