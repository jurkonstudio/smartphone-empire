// Tes aksesibilitas Modal dengan DOM tiruan (tanpa jsdom, tanpa dependensi).
// Jalankan dari akar repo: node tools/modal-a11y.test.mjs
const VOID = new Set(['input', 'br', 'img', 'hr']);
let activeEl = null;
const docListeners = {};

class El {
    constructor(tag) {
        this.tagName = String(tag).toUpperCase(); this.attrs = {}; this.children = []; this.parent = null;
        this.listeners = {}; this._classes = new Set(); this.dataset = {}; this._text = ''; this.disabled = false;
        const self = this;
        this.classList = {
            add: c => self._classes.add(c), remove: c => self._classes.delete(c),
            contains: c => self._classes.has(c), toggle: (c, f) => { (f ?? !self._classes.has(c)) ? self._classes.add(c) : self._classes.delete(c); }
        };
    }
    get className() { return [...this._classes].join(' '); }
    set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get id() { return this.attrs.id || ''; }
    set id(v) { this.attrs.id = v; }
    get type() { return this.attrs.type; }
    get isConnected() { let n = this; while (n.parent) n = n.parent; return n === body; }
    get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    appendChild(c) { c.parent = this; this.children.push(c); return c; }
    remove() { if (this.parent) { this.parent.children = this.parent.children.filter(c => c !== this); this.parent = null; } }
    contains(n) { for (; n; n = n.parent) if (n === this) return true; return false; }
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
    click() { const e = { target: this }; (this.listeners.click || []).forEach(f => f(e)); }
    focus() { if (this.isConnected) activeEl = this; }
    getClientRects() { return 'hidden' in this.attrs ? [] : [1]; }
    set innerHTML(html) {
        this.children = []; const stack = [this];
        const re = /<\/(\w+)>|<(\w+)([^>]*?)\/?>|([^<]+)/g; let m;
        while ((m = re.exec(html))) {
            const top = stack[stack.length - 1];
            if (m[1]) { if (stack.length > 1) stack.pop(); }
            else if (m[2]) {
                const el = new El(m[2].toLowerCase()); top.appendChild(el);
                const ar = /([\w-]+)(?:="([^"]*)")?/g; let a;
                while ((a = ar.exec(m[3]))) {
                    el.attrs[a[1]] = a[2] ?? '';
                    if (a[1] === 'class') el.className = a[2];
                    if (a[1] === 'disabled') el.disabled = true;
                }
                if (!VOID.has(el.tagName.toLowerCase())) stack.push(el);
            } else if (m[4]) top._text += m[4];
        }
    }
    _match(sel) {
        const m = /^([a-z0-9]*)((?:[.#][\w-]+|\[[^\]]+\])*)$/i.exec(sel.trim());
        if (!m) throw new Error('selector tidak didukung: ' + sel);
        if (m[1] && this.tagName.toLowerCase() !== m[1].toLowerCase()) return false;
        const parts = m[2].match(/[.#][\w-]+|\[[^\]]+\]/g) || [];
        return parts.every(p => {
            if (p[0] === '.') return this._classes.has(p.slice(1));
            if (p[0] === '#') return this.id === p.slice(1);
            const [, k, v] = /\[([\w-]+)(?:="([^"]*)")?\]/.exec(p);
            const camel = k.replace(/^data-/, '').replace(/-(\w)/g, (_, c) => c.toUpperCase());
            const val = k in this.attrs ? this.attrs[k] : (k.startsWith('data-') ? this.dataset[camel] : undefined);
            return v === undefined ? val !== undefined : String(val) === v;
        });
    }
    querySelectorAll(sel) {
        const sels = sel.split(','), out = [];
        const walk = n => n.children.forEach(c => { if (sels.some(s => c._match(s))) out.push(c); walk(c); });
        walk(this); return out;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

const body = new El('body');
globalThis.document = {
    body, documentElement: new El('html'),
    get activeElement() { return activeEl || body; },
    createElement: t => new El(t),
    addEventListener(t, fn) { (docListeners[t] = docListeners[t] || []).push(fn); },
    removeEventListener(t, fn) { docListeners[t] = (docListeners[t] || []).filter(f => f !== fn); },
    getElementById: () => null, querySelector: () => null
};
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.window = { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) };
globalThis.requestAnimationFrame = fn => setTimeout(fn, 0);

const key = (k, shift = false) => {
    let prevented = false;
    const e = { key: k, shiftKey: shift, preventDefault() { prevented = true; } };
    (docListeners.keydown || []).slice().forEach(f => f(e));
    return prevented;
};

const { Modal } = await import('../src/ui/modal.js');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('GAGAL:', m); } else console.log('ok   ', m); };

// Pemicu di halaman
const trigger = new El('button'); body.appendChild(trigger); trigger.focus();
const FORM = '<h2>Judul Modal</h2><button id="a">A</button><button id="b">B</button><button data-modal-close type="button">\u2715</button>';

// 1. Buka modal
const node = Modal.open('t1', FORM);
const card = node.querySelector('.modal-card');
ok(card.getAttribute('role') === 'dialog' && card.getAttribute('aria-modal') === 'true', 'role=dialog dan aria-modal');
ok(card.getAttribute('aria-labelledby') && card.querySelector('h2').id === card.getAttribute('aria-labelledby'), 'aria-labelledby menunjuk judul');
ok(card.querySelector('[data-modal-close]').getAttribute('aria-label'), 'tombol tutup simbol diberi aria-label');
ok(body.classList.contains('modal-open'), 'scroll body dikunci saat modal terbuka');
ok(activeEl && card.contains(activeEl) && activeEl.id === 'a', 'fokus pindah ke elemen fokusable pertama');
ok((docListeners.keydown || []).length === 1, 'satu listener keydown terpasang');

// 2. Focus trap
const b = card.querySelector('#b'), a = card.querySelector('#a'), x = card.querySelector('[data-modal-close]');
x.focus(); ok(key('Tab') && activeEl === a, 'Tab di elemen terakhir berputar ke pertama');
a.focus(); ok(key('Tab', true) && activeEl === x, 'Shift+Tab di elemen pertama berputar ke terakhir');
b.focus(); ok(!key('Tab') && activeEl === b, 'Tab di tengah dibiarkan (perilaku bawaan browser)');
trigger.focus(); ok(key('Tab') && card.contains(activeEl), 'fokus di luar modal ditarik kembali masuk');

// 3. Esc menutup + fokus kembali
let closedCb = 0;
Modal.close('t1', true);
trigger.focus();
Modal.open('t2', FORM, { onClose: () => { closedCb++; } });
ok(key('Escape'), 'Esc ditangani saat modal dismissible');
ok(!Modal.isOpen('t2') && closedCb === 1, 'Esc menutup modal dan memanggil onClose');
ok(activeEl === trigger, 'fokus kembali ke elemen pemicu');
ok(!body.classList.contains('modal-open'), 'kunci scroll dilepas');
ok((docListeners.keydown || []).length === 0, 'listener keydown dilepas saat tak ada modal');

// 4. Tidak dismissible
trigger.focus();
Modal.open('t3', FORM, { dismissible: false });
key('Escape');
ok(Modal.isOpen('t3'), 'Esc tidak menutup modal non-dismissible');
Modal.close('t3');
ok(activeEl === trigger, 'close() manual juga mengembalikan fokus');

// 5. Modal berurutan (single-modal): kunci tidak bocor, fokus balik ke pemicu asli
trigger.focus();
Modal.open('s1', FORM); Modal.open('s2', FORM);
ok(Modal.isOpen('s2') && !Modal.isOpen('s1') && body.classList.contains('modal-open'), 'modal kedua menggantikan yang pertama, kunci tetap');
ok((docListeners.keydown || []).length === 1, 'tetap satu listener keydown setelah ganti modal');
Modal.close('s2');
ok(!body.classList.contains('modal-open') && activeEl === trigger, 'setelah modal terakhir tutup: kunci lepas, fokus ke pemicu asli');

// 6. Modal tanpa elemen fokusable: kartu menerima fokus, Tab tidak lolos
trigger.focus();
const n7 = Modal.open('t7', '<p>Hanya teks</p>');
const c7 = n7.querySelector('.modal-card');
ok(activeEl === c7, 'tanpa elemen fokusable, kartu yang menerima fokus');
ok(key('Tab') && activeEl === c7, 'Tab tetap di dalam kartu');
Modal.closeAll();
ok(!Modal.hasOpen() && !body.classList.contains('modal-open'), 'closeAll membersihkan semuanya');

// 7. Kolom teks pertama tidak langsung difokus (hindari keyboard HP muncul)
trigger.focus();
const n8 = Modal.open('t8', '<input type="text" id="i1"><button id="z">OK</button>');
ok(activeEl === n8.querySelector('.modal-card'), 'kolom teks pertama tidak otomatis difokus');
Modal.closeAll();

console.log(fails ? ('\n' + fails + ' GAGAL') : '\nSEMUA LULUS'); process.exit(fails ? 1 : 0);
