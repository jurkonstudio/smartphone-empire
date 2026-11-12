#!/usr/bin/env python3
"""Perbaikan zoom halaman yang menempel setelah login (Chrome Android).
Jalankan dari folder game/ (yang berisi index.html):  python3 apply-zoom-fix.py
Aman dijalankan berulang: bagian yang sudah ada dilewati."""
import os, re, sys

def read(p):
    with open(p, encoding='utf-8') as f: return f.read()
def write(p, s):
    with open(p, 'w', encoding='utf-8', newline='') as f: f.write(s)
def need(p):
    if not os.path.exists(p): sys.exit('Tidak ketemu: %s. Jalankan dari folder game/.' % p)

PAGEZOOM = r"""// Mencegah dan memulihkan zoom halaman yang "menempel" (Chrome Android).
// Penyebab umum: kolom isian berfont < 16px yang difokuskan (login) membuat browser
// memperbesar halaman, dan zoom itu tidak kembali. Di peta 3D pinch dipakai peta
// (touch-action: none), jadi pemain tidak bisa memperkecil halaman dengan jari.
const VIEWPORT = 'meta[name="viewport"]';

export function isTouchDevice() {
    try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; }
}

export function pageScale() {
    const v = window.visualViewport;
    return v && v.scale ? v.scale : 1;
}

let resetting = false;
/** Kembalikan skala halaman ke 1 bila sedang diperbesar. Pengaturan viewport asli dipulihkan setelahnya. */
export function resetPageZoom() {
    if (resetting || pageScale() <= 1.02) return;
    const meta = document.querySelector(VIEWPORT);
    if (!meta) return;
    resetting = true;
    const original = meta.getAttribute('content');
    meta.setAttribute('content', 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, viewport-fit=cover');
    setTimeout(function () { meta.setAttribute('content', original); resetting = false; }, 250);
}

function isField(el) {
    return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

export function installZoomGuard() {
    if (typeof window === 'undefined' || window.__seZoomGuard) return;
    window.__seZoomGuard = true;
    // Setelah keyboard ditutup (kolom kehilangan fokus), pulihkan zoom bila masih membesar.
    document.addEventListener('focusout', function (e) {
        if (!isField(e.target)) return;
        setTimeout(function () { if (!isField(document.activeElement)) resetPageZoom(); }, 200);
    }, true);
    // Halaman yang dibuka kembali dalam keadaan ter-zoom (mis. setelah login lewat Google/Discord/GitHub).
    window.addEventListener('load', function () { setTimeout(resetPageZoom, 400); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) setTimeout(resetPageZoom, 200); });
}

installZoomGuard();
"""

CSS_MARK = '[zoom-fix]'
CSS = """
/* ============================================================================
   [zoom-fix] Kolom isian berfont < 16px membuat Chrome Android memperbesar
   halaman saat difokuskan (login), dan zoom itu bisa menempel. Di layar sentuh
   semua kolom isian memakai 16px.
   ============================================================================ */
@media (pointer: coarse) {
    input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="color"]):not([type="file"]),
    select, textarea { font-size: 16px !important; }
}
"""

changed = []

# 1) modul baru
p = 'src/utils/pageZoom.js'
need('src/utils')
if not os.path.exists(p):
    write(p, PAGEZOOM); changed.append('dibuat  ' + p)

# 2) CSS
p = 'ux-polish.css'; need(p)
s = read(p)
if CSS_MARK not in s:
    write(p, s.rstrip('\n') + '\n' + CSS); changed.append('diubah  ' + p)

# 3) OnboardingModal: impor, pemulihan zoom saat selesai, tanpa fokus otomatis di layar sentuh
p = 'src/ui/panels/OnboardingModal.js'; need(p)
s = read(p); o = s
if 'pageZoom.js' not in s:
    imports = list(re.finditer(r"^import[^\n]*\n", s, re.M))
    if not imports: sys.exit('Tidak ada baris import di ' + p)
    e = imports[-1].end()
    s = s[:e] + "import { resetPageZoom, isTouchDevice } from '../../utils/pageZoom.js';\n" + s[e:]
a = "Modal.close('onboarding', true);\n            bus.emit('onboarding:done', result);"
if a in s and 'resetPageZoom();' not in s:
    s = s.replace(a, "Modal.close('onboarding', true);\n            resetPageZoom();\n            bus.emit('onboarding:done', result);", 1)
elif a not in s and 'resetPageZoom();' not in s:
    sys.exit('Anchor _finish tidak ditemukan di ' + p + ' (kodenya sudah berubah?)')
rx = re.compile(r"(var el = \$\(auth\.email \? '\[data-onb-pass\]' : '\[data-onb-email\]'\);\s*\n\s*)if \(el\) el\.focus\(\);")
if rx.search(s):
    s = rx.sub(lambda m: m.group(1) + "if (el && !isTouchDevice()) el.focus();", s, 1)
elif 'isTouchDevice()) el.focus' not in s:
    print('PERINGATAN: fokus otomatis tidak ditemukan di ' + p + ', dilewati.')
if s != o: write(p, s); changed.append('diubah  ' + p)

# 4) main.js: pasang penjaga zoom sejak awal
p = 'src/main.js'; need(p)
s = read(p)
if 'utils/pageZoom.js' not in s:
    m = re.search(r"^import \{ showOnboarding \} from [^\n]*\n", s, re.M)
    if not m: sys.exit('Anchor import showOnboarding tidak ditemukan di ' + p)
    s = s[:m.end()] + "import './utils/pageZoom.js';\n" + s[m.end():]
    write(p, s); changed.append('diubah  ' + p)

print('\n'.join(changed) if changed else 'Tidak ada perubahan (sudah terpasang).')
