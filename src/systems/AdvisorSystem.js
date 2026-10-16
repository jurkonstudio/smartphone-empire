// FILE: src/systems/AdvisorSystem.js
// v2027.37 — Asisten bisnis berbasis aturan + percakapan lokal (AdvisorBrain).
// icon = id ikon SVG (src/ui/icons/GameIcons.js), bukan emoji.
//
// - getAdvice(): daftar saran berurutan (kritis -> info) dari kondisi game.
// - Saran bisa ditunda (snooze) pemain; disimpan di state.data.advisor.
// - Toast peringatan untuk hal penting (ada jeda per saran, tidak spam).
// - Titik sambung AI: setProvider(fn) + ask(question) + buildContext().
//   Tanpa provider, asisten tetap jalan penuh secara lokal.
//
// Tidak mengubah state game selain data.advisor (snooze/jeda toast).
import { bus } from '../core/EventBus.js';
import { LanguageService } from '../core/LanguageService.js';
import { ToastService } from '../core/ToastService.js';
import { BALANCE } from '../data/balance.data.js';
import { getMacro } from '../core/MacroModel.js';
import { AdvisorBrain } from './AdvisorBrain.js';

const DAY = 1440;                 // menit game per hari
const SNOOZE_DAYS = 30;
const TOAST_COOLDOWN_DAYS = 20;
const CHECK_EVERY_DAYS = 2;
const MAX_ADVICE = 8;
const SEV = { critical: 0, warn: 1, tip: 2, info: 3 };

// ------------------------------------------------------------
// Teks (id / en). Kunci: '<ruleId>.t' (judul), '<ruleId>.d' (detail).
// ------------------------------------------------------------
const DICT = {
    id: {
        'ui.title': 'Asisten Bisnis',
        'ui.open': 'Buka',
        'ui.snooze': 'Tunda 30 hari',
        'ui.close': 'Tutup',
        'ui.ask_ph': 'Tanya apa saja atau ketik "buka riset"…',
        'ui.advice': 'Saran untuk kamu',
        'ui.show_all': 'Lihat semua',
        'ui.hide': 'Sembunyikan',
        'ui.clear': 'Mulai ulang',
        'ui.ask_send': 'Kirim',
        'ui.thinking': 'Berpikir…',
        'ui.ask_fail': 'Asisten AI sedang tidak tersedia.',
        'ui.summary': 'Uang cukup sekitar {months} bulan biaya operasional.',
        'ui.summary_na': 'Belum ada biaya bulanan berarti.',
        'cash_crit.t': 'Uang hampir habis!',
        'cash_crit.d': 'Uang ${cash} kurang dari biaya bulanan ${burn}. Jual stok, tunda riset baru, atau ambil pinjaman di Setelan.',
        'cash_low.t': 'Uang mulai menipis',
        'cash_low.d': 'Uang cukup sekitar {months} bulan biaya (${burn}/bulan). Pastikan produk laku sebelum menambah staf.',
        'hire_first.t': 'Rekrut anggota tim pertama',
        'hire_first.d': 'Mulai dari engineer (biaya rekrut ${cost}). Engineer mempercepat riset dan membuka slot riset.',
        'hire_designer.t': 'Butuh desainer',
        'hire_designer.d': 'Desainer mempercepat pengembangan ponsel dan menaikkan kualitas produk.',
        'hire_marketer.t': 'Rekrut marketer',
        'hire_marketer.d': 'Kamu sudah menjual produk. Marketer memperbesar jangkauan kampanye.',
        'research_idle.t': 'Slot riset kosong',
        'research_idle.d': '{free} slot menganggur. Riset yang tersedia: "{name}" (${cost}).',
        'research_slots.t': 'Slot riset penuh',
        'research_slots.d': 'Tambah {need} engineer lagi untuk membuka slot riset berikutnya.',
        'design_first.t': 'Rancang ponsel pertamamu',
        'design_first.d': 'Teknologi awal sudah cukup. Rilis produk pertama untuk mulai mendapat pemasukan.',
        'stock_out.t': 'Stok habis: {name}',
        'stock_out.d': 'Penjualan terhenti. Produksi ulang agar tidak kehilangan pelanggan.',
        'stock_low.t': 'Stok menipis: {name}',
        'stock_low.d': 'Sisa {stock} unit. Pesan produksi atau aktifkan auto-restock.',
        'campaign.t': 'Jalankan kampanye untuk {name}',
        'campaign.d': 'Belum ada kampanye aktif. Iklan mendorong penjualan selama produk masih baru.',
        'successor.t': '{name} mulai menua',
        'successor.d': 'Sudah {days} hari dijual dan penjualan akan menurun. Mulai rancang penerusnya.',
        'os_missing.t': 'Pertimbangkan OS sendiri',
        'os_missing.d': 'OS yang stabil menaikkan skor produk dan membuka toko aplikasi.',
        'os_bugs.t': 'Bug OS menumpuk',
        'os_bugs.d': 'Ada {n} bug aktif. Perbaiki agar kepuasan pengguna tidak turun.',
        'fab_ready.t': 'Pabrik chip siap dibangun',
        'fab_ready.d': 'Riset konstruksi Fab selesai. Punya pabrik sendiri menekan biaya chip.',
        'morale.t': 'Moral tim rendah',
        'morale.d': 'Rata-rata moral {n}/100. Moral rendah menurunkan kinerja dan bisa membuat staf keluar.',
        'reputation.t': 'Reputasi masih rendah',
        'reputation.d': 'Reputasi {n}/100. Rilis produk berkualitas dan jaga ulasan agar naik.',
        'all_good.t': 'Semua terkendali',
        'all_good.d': 'Tidak ada hal mendesak. Waktu yang bagus untuk berinvestasi di riset atau produk baru.'
    },
    en: {
        'ui.title': 'Business Advisor',
        'ui.open': 'Open',
        'ui.snooze': 'Snooze 30 days',
        'ui.close': 'Close',
        'ui.ask_ph': 'Ask anything or type "open research"…',
        'ui.advice': 'Suggestions',
        'ui.show_all': 'Show all',
        'ui.hide': 'Hide',
        'ui.clear': 'Restart',
        'ui.ask_send': 'Send',
        'ui.thinking': 'Thinking…',
        'ui.ask_fail': 'The AI advisor is unavailable right now.',
        'ui.summary': 'Cash covers about {months} months of operating costs.',
        'ui.summary_na': 'No significant monthly costs yet.',
        'cash_crit.t': 'Cash is almost gone!',
        'cash_crit.d': 'Cash ${cash} is below monthly costs of ${burn}. Sell stock, delay new research, or take a loan in Settings.',
        'cash_low.t': 'Cash is running low',
        'cash_low.d': 'Cash covers about {months} months (${burn}/month). Make sure products sell before hiring more.',
        'hire_first.t': 'Hire your first team member',
        'hire_first.d': 'Start with an engineer (hiring cost ${cost}). Engineers speed up research and unlock research slots.',
        'hire_designer.t': 'You need a designer',
        'hire_designer.d': 'Designers speed up phone development and raise product quality.',
        'hire_marketer.t': 'Hire a marketer',
        'hire_marketer.d': 'You are selling products. Marketers widen campaign reach.',
        'research_idle.t': 'Idle research slot',
        'research_idle.d': '{free} slot(s) idle. Available research: "{name}" (${cost}).',
        'research_slots.t': 'Research slots are full',
        'research_slots.d': 'Hire {need} more engineer(s) to unlock the next research slot.',
        'design_first.t': 'Design your first phone',
        'design_first.d': 'Your starter tech is enough. Release a first product to start earning revenue.',
        'stock_out.t': 'Out of stock: {name}',
        'stock_out.d': 'Sales have stopped. Produce more so you do not lose customers.',
        'stock_low.t': 'Low stock: {name}',
        'stock_low.d': '{stock} units left. Order production or enable auto-restock.',
        'campaign.t': 'Run a campaign for {name}',
        'campaign.d': 'No active campaign. Ads boost sales while the product is still new.',
        'successor.t': '{name} is getting old',
        'successor.d': 'On sale for {days} days; sales will decline. Start designing a successor.',
        'os_missing.t': 'Consider your own OS',
        'os_missing.d': 'A stable OS raises product scores and unlocks the app store.',
        'os_bugs.t': 'OS bugs piling up',
        'os_bugs.d': '{n} active bugs. Fix them so user satisfaction does not drop.',
        'fab_ready.t': 'Chip fab is ready to build',
        'fab_ready.d': 'Fab construction research is done. Your own fab lowers chip costs.',
        'morale.t': 'Team morale is low',
        'morale.d': 'Average morale {n}/100. Low morale hurts performance and can make staff quit.',
        'reputation.t': 'Reputation is still low',
        'reputation.d': 'Reputation {n}/100. Ship quality products and watch reviews to raise it.',
        'all_good.t': 'Everything under control',
        'all_good.d': 'Nothing urgent. A good time to invest in research or a new product.'
    }
};

function curLang() {
    var l = 'id';
    try { l = LanguageService.getLang(); } catch (e) {}
    return DICT[l] ? l : 'en';
}

export function tx(key, vars) {
    var dict = DICT[curLang()];
    var str = dict[key];
    if (str === undefined) str = DICT.en[key];
    if (str === undefined) return key;
    return str.replace(/\{(\w+)\}/g, function (m, k) {
        return (vars && Object.prototype.hasOwnProperty.call(vars, k)) ? String(vars[k]) : m;
    });
}

function money(n) { return Math.round(n).toLocaleString('en-US'); }
function arr(a) { return Array.isArray(a) ? a : []; }

// ------------------------------------------------------------
// ATURAN. Masing-masing: function (c, push). Dibungkus try/catch.
// push(id, severity, icon, vars, action, priority)
// ------------------------------------------------------------
const RULES = [
    function cash(c, push) {
        if (c.burn <= 0) return;
        if (c.cash < c.burn) {
            push('cash_crit', 'critical', 'cash-alert', { cash: money(c.cash), burn: money(c.burn) }, { nav: 'settings' }, 0);
        } else if (c.runway < 3) {
            push('cash_low', c.selling.length ? 'tip' : 'warn', 'warn',
                { months: c.runway.toFixed(1), burn: money(c.burn) }, { nav: 'products', subtab: 'sales' }, 5);
        }
    },
    function stock(c, push) {
        c.selling.forEach(function (p) {
            var cap = p.baseCapacity || p.totalProduced || 0;
            if ((p.stock || 0) <= 0) {
                push('stock_out:' + p.id, 'critical', 'package', { name: p.name }, { nav: 'products', subtab: 'sales' }, 1);
            } else if (cap > 0 && p.stock < cap * 0.2 && !(p.autoRestock && p.autoRestock.enabled)) {
                push('stock_low:' + p.id, 'warn', 'package', { name: p.name, stock: money(p.stock) }, { nav: 'products', subtab: 'sales' }, 10);
            }
        });
    },
    function hiring(c, push) {
        var t = c.team, total = t.engineers + t.designers + t.marketers;
        var cost = Math.round(((BALANCE.recruitCost && BALANCE.recruitCost.engineer) || 2000) * getMacro(c.d.time, BALANCE.macro).wageIndex);
        if (total === 0) {
            push('hire_first', 'tip', 'users', { cost: money(cost) }, { nav: 'team' }, 20);
            return;
        }
        if (t.designers === 0 && t.engineers >= 1 && c.catalog.length === 0) {
            push('hire_designer', 'tip', 'palette', {}, { nav: 'team' }, 30);
        }
        if (t.marketers === 0 && c.selling.length > 0) {
            push('hire_marketer', 'tip', 'megaphone', {}, { nav: 'team' }, 32);
        }
    },
    function research(c, push) {
        var r = c.d.research || {};
        var active = arr(r.active).length;
        var max = r.maxSlots || 1;
        if (active < max && c.deps.research) {
            var best = null;
            try {
                var rs = c.deps.research;
                arr(rs.getCategories()).forEach(function (cat) {
                    arr(rs.getNodesByCategory(cat.id)).forEach(function (n) {
                        if (rs.getNodeStatus(n.id).status !== 'available') return;
                        if (!best || n.cost < best.cost) best = n;
                    });
                });
            } catch (e) { best = null; }
            if (best) {
                push('research_idle', active === 0 ? 'warn' : 'tip', 'research',
                    { free: max - active, name: best.name, cost: money(best.cost) }, { nav: 'research', subtab: 'tech' }, 25);
            }
        } else if (active >= max && max < ((BALANCE.research && BALANCE.research.maxSlots) || 3) && c.team.engineers > 0) {
            var need = Math.max(1, 2 * max - c.team.engineers);
            push('research_slots', 'info', 'research', { need: need }, { nav: 'team' }, 60);
        }
    },
    function design(c, push) {
        var p = c.d.products || {};
        if (c.catalog.length === 0 && !p.designing && !p.development &&
            (c.team.engineers + c.team.designers) >= 1) {
            push('design_first', 'tip', 'phone', {}, { nav: 'products', subtab: 'design' }, 22);
        }
    },
    function marketing(c, push) {
        if (c.team.marketers < 1 || c.cash < 5000) return;
        var camps = arr((c.d.marketing || {}).activeCampaigns);
        var lc = (BALANCE.products && BALANCE.products.lifecycle) || {};
        var window_ = (lc.riseDays || 60) + (lc.peakDays || 120);
        for (var i = 0; i < c.selling.length; i++) {
            var p = c.selling[i];
            var age = (c.now - (p.releaseGameMinute || 0)) / DAY;
            var has = camps.some(function (m) { return m.productId === p.id; });
            if (!has && age <= window_ && (p.stock || 0) > 0) {
                push('campaign', 'tip', 'megaphone', { name: p.name }, { nav: 'products', subtab: 'sales' }, 35);
                return;
            }
        }
    },
    function aging(c, push) {
        var p0 = c.d.products || {};
        if (!c.selling.length || p0.designing || p0.development) return;
        var newest = c.selling.reduce(function (a, b) {
            return (b.releaseGameMinute || 0) > (a.releaseGameMinute || 0) ? b : a;
        });
        var days = Math.floor((c.now - (newest.releaseGameMinute || 0)) / DAY);
        var lc = (BALANCE.products && BALANCE.products.lifecycle) || {};
        var threshold = (lc.riseDays || 60) + (lc.peakDays || 120);
        if (days >= threshold) {
            push('successor', days >= (lc.declineDays || 200) + 60 ? 'warn' : 'tip', 'hourglass',
                { name: newest.name, days: days }, { nav: 'products', subtab: 'design' }, 28);
        }
    },
    function os(c, push) {
        var o = c.d.os || {};
        if (c.catalog.length >= 1 && arr(o.versions).length === 0 && c.team.engineers >= 1) {
            push('os_missing', 'info', 'puzzle', {}, { nav: 'research', subtab: 'os' }, 70);
        }
        var bugs = arr(o.bugs).length;
        if (bugs >= 3) push('os_bugs', 'tip', 'bug', { n: bugs }, { nav: 'research', subtab: 'os' }, 40);
    },
    function fab(c, push) {
        var f = c.d.fab || {};
        var done = arr((c.d.chipResearch || {}).completed);
        if (!f.built && done.indexOf('fab_construction') >= 0) {
            push('fab_ready', 'tip', 'factory', {}, { nav: 'research', subtab: 'chip' }, 38);
        }
    },
    function morale(c, push) {
        var s = arr(c.d.staff);
        if (!s.length) return;
        var avg = s.reduce(function (a, x) { return a + (x.morale || 0); }, 0) / s.length;
        if (avg < 50) push('morale', 'warn', 'mood-low', { n: Math.round(avg) }, { nav: 'team' }, 15);
    },
    function reputation(c, push) {
        var rep = (c.d.market || {}).reputation;
        if (c.catalog.length >= 1 && typeof rep === 'number' && rep < 20) {
            push('reputation', 'info', 'star', { n: Math.round(rep) }, { nav: 'market' }, 80);
        }
    }
];

// ------------------------------------------------------------
export class AdvisorSystem {
    // deps: { research } (opsional). Tanpa deps, aturan riset dilewati.
    constructor(gameState, deps) {
        this.state = gameState;
        this.deps = deps || {};
        this._unsubs = [];
        this._provider = null;
        this._lastSig = '';
        this._timer = null;
        this._lastCheckDay = -1;
        this.brain = new AdvisorBrain(this);
        this._chat = [];                 // riwayat percakapan (sesi berjalan)
    }

    _lang() { return curLang(); }

    start() {
        var self = this;
        var refresh = function () { self._scheduleRefresh(); };
        ['time:day-changed', 'research:completed', 'research:started', 'product:released',
         'team:changed', 'product:stock-out', 'lang:changed', 'state:hydrated'].forEach(function (ev) {
            self._unsubs.push(bus.on(ev, refresh));
        });
        this._unsubs.push(bus.on('time:day-changed', function () { self._maybeToast(); }));
        this._scheduleRefresh();
    }

    stop() {
        this._unsubs.forEach(function (u) { try { u(); } catch (e) {} });
        this._unsubs = [];
        if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    }

    // ---------- data pribadi di state ----------
    _store() {
        var d = this.state.data;
        if (!d.advisor || typeof d.advisor !== 'object') d.advisor = {};
        if (!d.advisor.snoozed) d.advisor.snoozed = {};
        if (!d.advisor.toasted) d.advisor.toasted = {};
        return d.advisor;
    }

    _ctx() {
        var d = this.state.data;
        var diff = (BALANCE.difficultyMultiplier && BALANCE.difficultyMultiplier[d.difficulty]) ||
                   (BALANCE.difficultyMultiplier && BALANCE.difficultyMultiplier.normal) || { expense: 1 };
        var m = BALANCE.monthly || {};
        var fixed = ((m.rentHQ || 0) + (m.utilities || 0) + (m.baseAdmin || 0)) * getMacro(d.time, BALANCE.macro).cpiIndex * (diff.expense || 1);
        var payroll = arr(d.staff).reduce(function (a, s) { return a + (s.salary || 0); }, 0);
        var burn = fixed + payroll;
        var catalog = arr((d.products || {}).catalog);
        return {
            d: d, deps: this.deps,
            now: (d.time && d.time.elapsedGameMinutes) || 0,
            cash: d.cash || 0,
            burn: burn,
            runway: burn > 0 ? (d.cash || 0) / burn : Infinity,
            team: {
                engineers: (d.team && d.team.engineers) || 0,
                designers: (d.team && d.team.designers) || 0,
                marketers: (d.team && d.team.marketers) || 0
            },
            catalog: catalog,
            selling: catalog.filter(function (p) { return p.status === 'selling'; })
        };
    }

    // Daftar saran terurut. opts.includeSnoozed=true untuk melihat semuanya.
    getAdvice(opts) {
        var includeSnoozed = !!(opts && opts.includeSnoozed);
        var c = this._ctx();
        var store = this._store();
        var out = [];
        var seen = {};
        var push = function (id, sev, icon, vars, action, pri) {
            if (seen[id]) return;
            seen[id] = true;
            var base = id.split(':')[0];
            out.push({
                id: id, sev: sev, icon: icon, pri: pri || 50,
                title: tx(base + '.t', vars), detail: tx(base + '.d', vars),
                action: action || null
            });
        };
        RULES.forEach(function (rule) {
            try { rule(c, push); } catch (err) { console.warn('[Advisor] aturan gagal:', rule.name, err); }
        });

        out = out.filter(function (a) {
            if (includeSnoozed) return true;
            var until = store.snoozed[a.id];
            return !(typeof until === 'number' && until > c.now);
        });
        out.sort(function (a, b) { return (SEV[a.sev] - SEV[b.sev]) || (a.pri - b.pri); });
        out = out.slice(0, MAX_ADVICE);

        if (!out.length) {
            out.push({ id: 'all_good', sev: 'info', icon: 'check-circle', pri: 99,
                title: tx('all_good.t'), detail: tx('all_good.d'), action: null });
        }
        return out;
    }

    // Jumlah yang perlu perhatian (kritis + peringatan).
    getBadge() {
        var list = this.getAdvice();
        var critical = 0, warn = 0;
        list.forEach(function (a) { if (a.sev === 'critical') critical++; else if (a.sev === 'warn') warn++; });
        return { count: critical + warn, critical: critical, total: list.length };
    }

    getSummary() {
        var c = this._ctx();
        if (!isFinite(c.runway)) return tx('ui.summary_na');
        return tx('ui.summary', { months: Math.max(0, c.runway).toFixed(1) });
    }

    snooze(id, days) {
        var c = this._ctx();
        this._store().snoozed[id] = c.now + (days || SNOOZE_DAYS) * DAY;
        this._scheduleRefresh();
    }

    // ---------- refresh & toast ----------
    _scheduleRefresh() {
        var self = this;
        if (this._timer) return;
        this._timer = setTimeout(function () {
            self._timer = null;
            var b = self.getBadge();
            var sig = b.count + ':' + b.critical + ':' + b.total + ':' + curLang();
            if (sig !== self._lastSig) {
                self._lastSig = sig;
                bus.emit('advisor:updated', b);
            }
        }, 250);
    }

    _maybeToast() {
        var d = this.state.data;
        if (!d || !d.time) return;
        var tut = d.tutorial || {};
        if (!tut.completed && !tut.skipped) return;            // jangan ganggu tutorial
        var day = Math.floor((d.time.elapsedGameMinutes || 0) / DAY);
        if (this._lastCheckDay >= 0 && day - this._lastCheckDay < CHECK_EVERY_DAYS) return;
        this._lastCheckDay = day;

        var store = this._store();
        var now = d.time.elapsedGameMinutes || 0;
        var list = this.getAdvice();
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (a.sev !== 'critical' && a.sev !== 'warn') continue;
            var last = store.toasted[a.id];
            if (typeof last === 'number' && now - last < TOAST_COOLDOWN_DAYS * DAY) continue;
            store.toasted[a.id] = now;
            try {
                if (a.sev === 'critical') ToastService.error(a.title);
                else ToastService.warning(a.title);
            } catch (e) {}
            break;                                              // satu toast per pengecekan
        }
    }

    // ---------- titik sambung AI ----------
    // fn({ question, context, advice, lang }) => Promise<string>
    setProvider(fn) { this._provider = (typeof fn === 'function') ? fn : null; }
    hasProvider() { return !!this._provider; }

    // Ringkasan state yang ringkas & aman dikirim ke model.
    buildContext() {
        var c = this._ctx();
        var d = c.d;
        var t = d.time || {};
        return {
            date: { year: t.currentYear, month: t.currentMonth, day: t.currentDay },
            company: d.companyName,
            difficulty: d.difficulty,
            cash: c.cash,
            monthlyBurn: Math.round(c.burn),
            runwayMonths: isFinite(c.runway) ? Math.round(c.runway * 10) / 10 : null,
            team: c.team,
            research: {
                active: arr((d.research || {}).active).map(function (e) { return e.name; }),
                slots: (d.research || {}).maxSlots,
                completedCount: arr((d.research || {}).completed).length
            },
            products: c.catalog.map(function (p) {
                return { name: p.name, status: p.status, stock: p.stock, price: p.price, sold: p.totalSold };
            }),
            os: { versions: arr((d.os || {}).versions).length, bugs: arr((d.os || {}).bugs).length },
            fab: { built: !!(d.fab && d.fab.built), level: d.fab && d.fab.level },
            market: { share: (d.market || {}).share, reputation: (d.market || {}).reputation },
            activeCampaigns: arr((d.marketing || {}).activeCampaigns).length
        };
    }

    // ---------- percakapan (lokal, tanpa API) ----------
    getChat() {
        if (!this._chat.length) this._chat.push(Object.assign({ role: 'bot' }, this.brain.greeting()));
        return this._chat;
    }
    resetChat() { this._chat = []; this.brain.mem = { last: null, lastProduct: null, depth: 0, turns: 0, asked: {} }; }

    // Balasan lokal; bila yakin rendah dan ada provider AI, tanya provider.
    async chat(text) {
        var q = String(text || '').trim();
        if (!q) return null;
        this.getChat().push({ role: 'user', text: q });
        var res;
        try { res = this.brain.reply(q); }
        catch (e) { console.warn('[Advisor] brain gagal:', e); res = { text: tx('ui.ask_fail'), actions: [], chips: [] }; }
        if (res.intent === 'unknown' && this._provider) {
            var ai = await this.ask(q);
            if (ai.ok && ai.text) res = { text: ai.text, actions: res.actions || [], chips: res.chips || [], intent: 'ai' };
        }
        var msg = Object.assign({ role: 'bot' }, res);
        this._chat.push(msg);
        if (this._chat.length > 60) this._chat.splice(0, this._chat.length - 60);
        return msg;
    }

    async ask(question) {
        if (!this._provider) return { ok: false, reason: 'no_provider' };
        try {
            var advice = this.getAdvice().map(function (a) { return { id: a.id, severity: a.sev, title: a.title }; });
            var text = await this._provider({
                question: String(question || ''),
                context: this.buildContext(),
                advice: advice,
                lang: curLang()
            });
            return { ok: true, text: String(text || '') };
        } catch (e) {
            return { ok: false, reason: (e && e.message) || 'error' };
        }
    }
}
