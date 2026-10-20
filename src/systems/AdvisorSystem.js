// FILE: src/systems/AdvisorSystem.js
// v2028.42 — Pemberitahuan patch & perbaikan bug.
import { bus } from '../core/EventBus.js';
import { LanguageService } from '../core/LanguageService.js';
import { ToastService } from '../core/ToastService.js';
import { BALANCE } from '../data/balance.data.js';
import { getMacro } from '../core/MacroModel.js';
import { AdvisorBrain } from './AdvisorBrain.js';
import { ADVISOR_CONFIG } from '../config/advisor.config.js';
import { createAdvisorProvider } from '../services/AdvisorAI.js';
import { buildReport, formatReportText } from '../diagnostics/DiagnosticReport.js';
import { PatchService, cmpVersion } from '../services/PatchService.js';

const DAY = 1440;                 
const SNOOZE_DAYS = 30;
const TOAST_COOLDOWN_DAYS = 20;
const CHECK_EVERY_DAYS = 2;
const SNAPSHOT_EVERY_DAYS = 7;
const MAX_SNAPSHOTS = 26;
const MAX_ADVICE = 8;
const SEV = { critical: 0, warn: 1, tip: 2, info: 3 };

// ------------------------------------------------------------
// Teks (id / en). 
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
        'ui.chat': 'Tanya asisten',
        'ui.copy_report': 'Salin laporan bug',
        'ui.open_report': 'Lihat detail',
        'ui.report_copied': 'Laporan disalin. Kirim ke pengembang.',
        'ui.report_failed': 'Gagal menyalin. Buka detail lalu salin manual.',
        'ui.patch_reload': 'Simpan & muat ulang',
        'ui.patch_ack': 'Tandai dibaca',
        'ui.patch_saved': 'Game disimpan. Memuat versi terbaru…',
        'patch_update.t': 'Pembaruan v{v} tersedia',
        'patch_update.d': '{sum} Kamu memakai v{cur}. Simpan lalu muat ulang untuk memakai v{v}.',
        'patch_fix.t': 'Perbaikan bug v{v} sudah aktif',
        'patch_fix.d': '{sum}',
        'patch_new.t': 'Patch baru v{v} sudah aktif',
        'patch_new.d': '{sum}',
        'app_issue.t': 'Masalah teknis terdeteksi',
        'app_issue.d': '{n} anomali data atau error terdeteksi. Salin laporan dan kirim ke pengembang agar cepat diperbaiki.',
        'ui.briefing': 'Sejak terakhir kamu cek',
        'ui.health': 'Kesehatan bisnis',
        'ui.ai': 'AI',
        'ui.cash_lbl': 'Uang',
        'ui.sold_lbl': 'Terjual',
        'ui.health_lbl': 'Skor',
        'ui.resolved_lbl': '{n} masalah sudah beres',
        'ui.days_lbl': '{n} hari',
        'ui.weakest_lbl': 'Area terlemah: {name}',
        'stock_soon.t': 'Stok {name} segera habis',
        'stock_soon.d': 'Dengan laju jual ±{pace} unit/hari, stok {stock} unit habis sekitar {days} hari lagi. Produksi ulang sekarang atau aktifkan auto-restock.',
        'ui.ask_fail': 'Asisten AI sedang tidak tersedia.',
        'ui.summary': 'Uang cukup sekitar {months} bulan biaya operasional.',
        'ui.summary_na': 'Belum ada biaya bulanan berarti.',
        'cash_crit.t': 'Uang hampir habis!',
        'cash_crit.d': 'Uang ${cash} kurang dari biaya bulanan ${burn}. Jual stok, tunda riset baru, atau ambil pinjaman di Setelan.',
        'cash_low.t': 'Uang mulai menipis',
        'cash_low.d': 'Uang cukup sekitar {months} bulan biaya (${burn}/bulan). Pastikan produk laku sebelum menambah staf.',
        'cash_trend.t': 'Kas terus menyusut',
        'cash_trend.d': 'Dengan pemasukan rata-rata ${income}/bulan, arus kas bersih {net}/bulan. Uang habis sekitar {months} bulan lagi.',
        'negative_cash.t': 'Kas pernah minus',
        'negative_cash.d': '{n} bulan terakhir uangmu negatif. Segera tutup defisit: jual stok, tunda pengeluaran, atau pinjam.',
        'loan_late.t': 'Cicilan pinjaman telat',
        'loan_late.d': '{n} pinjaman menunggak. Telat berulang kena denda dan bisa membuat bank memblokirmu.',
        'loan_burden.t': 'Cicilan terlalu berat',
        'loan_burden.d': 'Cicilan ${inst}/bulan memakan {pct}% pemasukan. Hindari pinjaman baru; pertimbangkan pelunasan dini.',
        'loan_payoff.t': 'Pertimbangkan pelunasan dini',
        'loan_payoff.d': 'Uangmu cukup longgar. Melunasi sisa pinjaman ${left} menghemat bunga bulanan.',
        'margin_thin.t': 'Margin tipis: {name}',
        'margin_thin.d': 'Untung per unit hanya {pct}% dari harga. Naikkan harga sedikit atau tekan biaya komponen di versi berikutnya.',
        'sales_slump.t': 'Penjualan melambat',
        'sales_slump.d': 'Laju jual turun sekitar {pct}% dibanding periode sebelumnya. Coba kampanye, turunkan harga, atau rilis penerus.',
        'share_drop.t': 'Pangsa pasar turun',
        'share_drop.d': 'Pangsa pasarmu turun dari {from}% menjadi {to}%. Pesaing sedang menekan; cek tren dan harga.',
        'product_unhappy.t': 'Pengguna kurang puas: {name}',
        'product_unhappy.d': 'Kepuasan {n}/100. Perbaiki bug OS dan rancang penerus yang lebih baik.',
        'catalog_full.t': 'Katalog aktif penuh',
        'catalog_full.d': '{n} produk dijual sekaligus (batas {max}). Hentikan yang sudah tua sebelum merilis yang baru.',
        'viral_opportunity.t': 'Momentum viral positif',
        'viral_opportunity.d': 'Produkmu sedang jadi perbincangan. Jalankan kampanye sekarang untuk memanfaatkan momentumnya.',
        'idle_cash.t': 'Uang menganggur',
        'idle_cash.d': 'Runway {months} bulan. Kelebihan uang paling baik dipakai untuk riset, produk penerus, atau OS/chip sendiri.',
        'overstaffed.t': 'Staf terlalu banyak untuk pemasukan',
        'overstaffed.d': 'Gaji {pct}% dari biaya bulanan padahal belum ada produk laku. Tahan rekrutmen sampai produk menghasilkan.',
        'hire_first.t': 'Rekrut anggota tim pertama',
        'hire_first.d': 'Mulai dari engineer (biaya rekrut ${cost}). Engineer mempercepat riset dan membuka slot riset.',
        'hire_designer.t': 'Butuh desainer',
        'hire_designer.d': 'Desainer mempercepat pengembangan ponsel dan menaikkan kualitas produk.',
        'hire_marketer.t': 'Rekrut marketer',
        'hire_marketer.d': 'Kamu sudah menjual produk. Marketer memperbesar jangkauan kampanye.',
        'research_idle.t': 'Slot riset kosong',
        'research_idle.d': '{free} slot menganggur. Rekomendasi terbaik: "{name}" (${cost}) — {why}.',
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
        'ui.chat': 'Ask the advisor',
        'ui.copy_report': 'Copy bug report',
        'ui.open_report': 'View details',
        'ui.report_copied': 'Report copied. Send it to the developer.',
        'ui.report_failed': 'Copy failed. Open details and copy manually.',
        'ui.patch_reload': 'Save & reload',
        'ui.patch_ack': 'Mark as read',
        'ui.patch_saved': 'Game saved. Loading the latest version…',
        'patch_update.t': 'Update v{v} is available',
        'patch_update.d': '{sum} You are on v{cur}. Save, then reload to get v{v}.',
        'patch_fix.t': 'Bug fixes in v{v} are live',
        'patch_fix.d': '{sum}',
        'patch_new.t': 'New patch v{v} is live',
        'patch_new.d': '{sum}',
        'app_issue.t': 'Technical problem detected',
        'app_issue.d': '{n} data anomalies or errors detected. Copy the report and send it to the developer so it can be fixed.',
        'ui.briefing': 'Since you last checked',
        'ui.health': 'Business health',
        'ui.ai': 'AI',
        'ui.cash_lbl': 'Cash',
        'ui.sold_lbl': 'Sold',
        'ui.health_lbl': 'Score',
        'ui.resolved_lbl': '{n} issue(s) resolved',
        'ui.days_lbl': '{n} day(s)',
        'ui.weakest_lbl': 'Weakest area: {name}',
        'stock_soon.t': '{name} will run out soon',
        'stock_soon.d': 'At ~{pace} units/day, {stock} units of stock last about {days} more days. Restock now or enable auto-restock.',
        'ui.ask_fail': 'The AI advisor is unavailable right now.',
        'ui.summary': 'Cash covers about {months} months of operating costs.',
        'ui.summary_na': 'No significant monthly costs yet.',
        'cash_crit.t': 'Cash is almost gone!',
        'cash_crit.d': 'Cash ${cash} is below monthly costs of ${burn}. Sell stock, delay new research, or take a loan in Settings.',
        'cash_low.t': 'Cash is running low',
        'cash_low.d': 'Cash covers about {months} months (${burn}/month). Make sure products sell before hiring more.',
        'cash_trend.t': 'Cash keeps shrinking',
        'cash_trend.d': 'With average revenue of ${income}/month, net cash flow is {net}/month. Cash runs out in about {months} months.',
        'negative_cash.t': 'Cash went negative',
        'negative_cash.d': 'Your cash was negative for {n} recent month(s). Close the gap: sell stock, cut spending, or borrow.',
        'loan_late.t': 'Loan payment overdue',
        'loan_late.d': '{n} loan(s) are behind. Repeated lateness adds fees and can get you blocked by the bank.',
        'loan_burden.t': 'Loan payments too heavy',
        'loan_burden.d': 'Installments of ${inst}/month take {pct}% of revenue. Avoid new loans; consider early repayment.',
        'loan_payoff.t': 'Consider early repayment',
        'loan_payoff.d': 'You have comfortable cash. Paying off the ${left} remaining saves monthly interest.',
        'margin_thin.t': 'Thin margin: {name}',
        'margin_thin.d': 'Profit per unit is only {pct}% of price. Raise the price slightly or cut component costs next time.',
        'sales_slump.t': 'Sales are slowing',
        'sales_slump.d': 'Sales pace is down about {pct}% versus the previous period. Try a campaign, lower the price, or ship a successor.',
        'share_drop.t': 'Market share is falling',
        'share_drop.d': 'Your share fell from {from}% to {to}%. Rivals are pushing; check trends and pricing.',
        'product_unhappy.t': 'Users are unhappy: {name}',
        'product_unhappy.d': 'Satisfaction {n}/100. Fix OS bugs and design a better successor.',
        'catalog_full.t': 'Active catalog is full',
        'catalog_full.d': '{n} products on sale (limit {max}). Retire old ones before releasing new ones.',
        'viral_opportunity.t': 'Positive viral momentum',
        'viral_opportunity.d': 'Your product is trending. Run a campaign now to ride the momentum.',
        'idle_cash.t': 'Idle cash',
        'idle_cash.d': 'Runway is {months} months. Spare cash is best spent on research, a successor product, or your own OS/chip.',
        'overstaffed.t': 'Payroll too heavy for revenue',
        'overstaffed.d': 'Payroll is {pct}% of monthly cost with no selling product yet. Pause hiring until products earn.',
        'hire_first.t': 'Hire your first team member',
        'hire_first.d': 'Start with an engineer (hiring cost ${cost}). Engineers speed up research and unlock research slots.',
        'hire_designer.t': 'You need a designer',
        'hire_designer.d': 'Designers speed up phone development and raise product quality.',
        'hire_marketer.t': 'Hire a marketer',
        'hire_marketer.d': 'You are selling products. Marketers widen campaign reach.',
        'research_idle.t': 'Idle research slot',
        'research_idle.d': '{free} slot(s) idle. Best pick: "{name}" (${cost}) — {why}.',
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

const WHY = {
    id: { dependents: 'membuka {n} riset lanjutan', cheap: 'murah & cepat menaikkan skor produk', unlocks: 'membuka komponen/fitur baru', fallback: 'langkah teknologi berikutnya' },
    en: { dependents: 'unlocks {n} follow-up research', cheap: 'cheap and quickly lifts product score', unlocks: 'unlocks new components/features', fallback: 'the next tech step' }
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

function money(n) { return Math.round(n || 0).toLocaleString('en-US'); }
function arr(a) { return Array.isArray(a) ? a : []; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function sumBy(list, fn) { return arr(list).reduce(function (a, x) { return a + (fn(x) || 0); }, 0); }

function patchSummary(releases, isId) {
    var fixes = [], other = [];
    arr(releases).forEach(function (r) {
        arr(r.items).forEach(function (it) {
            var t = String((it.text && it.text[isId ? 'id' : 'en']) || '').replace(/[.!\s]+$/, '');
            if (!t) return;
            (it.type === 'fix' ? fixes : other).push(t);
        });
    });
    var total = fixes.length + other.length, left = 3, parts = [];
    var f = fixes.slice(0, left); left -= f.length;
    var o = other.slice(0, Math.max(0, left));
    if (f.length) parts.push((isId ? 'Perbaikan bug: ' : 'Bug fixes: ') + f.join('; ') + '.');
    if (o.length) parts.push((isId ? 'Perubahan: ' : 'Changes: ') + o.join('; ') + '.');
    var more = total - f.length - o.length;
    if (more > 0) parts.push(isId ? '(+' + more + ' lainnya)' : '(+' + more + ' more)');
    return { sum: parts.join(' '), fixes: fixes.length, total: total };
}

const RULES = [
    function patch(c, push) {
        var p = c.patch;
        if (!p || !p.kind) return;
        var tut = c.d.tutorial || {};
        if (!tut.completed && !tut.skipped) return;
        var vars = { v: p.ver, cur: p.cur, n: p.total, fixes: p.fixes, sum: p.sum };
        var icon = p.fixes ? 'bug' : 'spark';
        if (p.kind === 'update') push('patch_update', 'warn', icon, vars, { patch: 'reload' }, 1);
        else push(p.kind === 'fix' ? 'patch_fix' : 'patch_new', 'warn', icon, vars, { patch: 'ack', ver: p.ver }, 2);
    },
    function cash(c, push) {
        if (c.burn <= 0) return;
        if (c.cash < c.burn) {
            push('cash_crit', 'critical', 'cash-alert', { cash: money(c.cash), burn: money(c.burn) }, { nav: 'settings' }, 0);
        } else if (c.runway < 3) {
            push('cash_low', c.selling.length ? 'tip' : 'warn', 'warn',
                { months: c.runway.toFixed(1), burn: money(c.burn) }, { nav: 'products', subtab: 'sales' }, 5);
        }
    },
    function cashTrend(c, push) {
        if (c.income <= 0 || c.net >= 0 || !isFinite(c.trendRunway)) return;
        if (c.cash >= c.burn && c.trendRunway < 5) {
            push('cash_trend', c.trendRunway < 2.5 ? 'warn' : 'tip', 'chart',
                { income: money(c.income), net: (c.net < 0 ? '−$' : '+$') + money(Math.abs(c.net)), months: c.trendRunway.toFixed(1) },
                { nav: 'products', subtab: 'sales' }, 8);
        }
    },
    function negativeCash(c, push) {
        var n = (c.d.finance && c.d.finance.negativeMonths) || 0;
        if (n >= 1) push('negative_cash', 'critical', 'cash-alert', { n: n }, { nav: 'settings' }, 2);
    },
    function loans(c, push) {
        if (!c.loans.length) return;
        var late = c.loans.filter(function (l) { return (l.missed || 0) > 0; }).length;
        if (late) push('loan_late', 'critical', 'bank', { n: late }, { nav: 'settings' }, 3);
        var base = c.income > 0 ? c.income : c.burn;
        if (base > 0 && c.debtService > base * 0.4) {
            push('loan_burden', 'warn', 'bank',
                { inst: money(c.debtService), pct: Math.round(c.debtService / base * 100) }, { nav: 'settings' }, 12);
        }
        var left = sumBy(c.loans, function (l) { return l.remaining; });
        if (left > 0 && c.cash > left * 1.5 + c.burn * 6 && c.runway > 8) {
            push('loan_payoff', 'info', 'bank', { left: money(left) }, { nav: 'settings' }, 75);
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
    function appIssue(c, push) {
        var dg = c.diag;
        if (!dg) return;
        var errs = dg.alerts.filter(function (a) { return a.level === 'error'; }).length;
        var n = dg.alerts.length + dg.errors.length;
        if (errs > 0) push('app_issue', 'critical', 'bug', { n: n }, { report: true }, 4);
        else if (dg.errors.length >= 3 || dg.alerts.length >= 2) push('app_issue', 'warn', 'bug', { n: n }, { report: true }, 16);
    },
    function stockForecast(c, push) {
        var pp = (c.trends && c.trends.perProduct) || {};
        c.selling.forEach(function (p) {
            var pace = pp[p.id];
            var stock = p.stock || 0;
            if (!(pace > 0.5) || stock <= 0) return;
            if (p.autoRestock && p.autoRestock.enabled) return;
            var cap = p.baseCapacity || p.totalProduced || 0;
            if (cap > 0 && stock < cap * 0.2) return;
            var days = stock / pace;
            if (days <= 14) {
                push('stock_soon:' + p.id, days <= 7 ? 'warn' : 'tip', 'package',
                    { name: p.name, pace: pace.toFixed(1), stock: money(stock), days: Math.max(1, Math.round(days)) },
                    { nav: 'products', subtab: 'sales' }, 9);
            }
        });
    },
    function margin(c, push) {
        c.selling.forEach(function (p) {
            if (!(p.price > 0) || typeof p.unitCost !== 'number') return;
            var m = (p.price - p.unitCost) / p.price;
            if (m < 0.12) {
                push('margin_thin:' + p.id, m < 0 ? 'warn' : 'tip', 'cash',
                    { name: p.name, pct: Math.round(m * 100) }, { nav: 'products', subtab: 'sales' }, 18);
            }
        });
    },
    function slump(c, push) {
        var t = c.trends;
        if (!t || t.salesDrop === null || !c.selling.length) return;
        if (t.salesDrop >= 0.4 && t.salesPrev >= 5) {
            push('sales_slump', t.salesDrop >= 0.6 ? 'warn' : 'tip', 'chart',
                { pct: Math.round(t.salesDrop * 100) }, { nav: 'products', subtab: 'sales' }, 26);
        }
    },
    function shareDrop(c, push) {
        var h = arr((c.d.market || {}).shareHistory);
        if (h.length < 2 || !c.selling.length) return;
        var now = h[0].playerShare, prev = h[1].playerShare;
        if (typeof now !== 'number' || typeof prev !== 'number') return;
        var scale = (now <= 1 && prev <= 1) ? 100 : 1;
        if (prev * scale >= 0.5 && now < prev * 0.85) {
            push('share_drop', 'tip', 'target',
                { from: (prev * scale).toFixed(1), to: (now * scale).toFixed(1) }, { nav: 'market' }, 34);
        }
    },
    function satisfaction(c, push) {
        var sat = (c.d.feedback && c.d.feedback.perProductSatisfaction) || {};
        c.selling.forEach(function (p) {
            var v = sat[p.id];
            if (typeof v === 'number' && v < 45) {
                push('product_unhappy:' + p.id, 'tip', 'mood-low', { name: p.name, n: Math.round(v) },
                    { nav: 'research', subtab: 'os' }, 36);
            }
        });
    },
    function hiring(c, push) {
        var t = c.team, total = t.engineers + t.designers + t.marketers;
        var cost = c.recruitCost('engineer');
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
    function overstaffed(c, push) {
        if (c.selling.length || c.burn <= 0 || c.runway >= 6) return;
        var share = c.payroll / c.burn;
        if (share > 0.6 && (c.team.engineers + c.team.designers + c.team.marketers) >= 3) {
            push('overstaffed', 'warn', 'users', { pct: Math.round(share * 100) }, { nav: 'team' }, 14);
        }
    },
    function research(c, push) {
        var r = c.d.research || {};
        var active = arr(r.active).length;
        var max = r.maxSlots || 1;
        if (active < max && c.deps.research) {
            var pick = c.bestResearch();
            if (pick) {
                push('research_idle', active === 0 ? 'warn' : 'tip', 'research',
                    { free: max - active, name: pick.node.name, cost: money(pick.node.cost), why: pick.why },
                    { nav: 'research', subtab: 'tech' }, 25);
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
    function catalogFull(c, push) {
        var max = (BALANCE.products && BALANCE.products.maxActiveProducts) || 5;
        if (c.selling.length >= max) {
            push('catalog_full', 'info', 'package', { n: c.selling.length, max: max }, { nav: 'products', subtab: 'sales' }, 55);
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
    function viral(c, push) {
        var v = arr((c.d.feedback || {}).activeViral).filter(function (x) { return x && x.type === 'positive'; });
        if (v.length && c.selling.length && c.team.marketers >= 1 && c.cash >= 5000) {
            push('viral_opportunity', 'tip', 'spark', {}, { nav: 'products', subtab: 'sales' }, 24);
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
        if (c.catalog.length >= 1 && arr(o.versions).length === 0 && c.team.engineers >= 1 && !o.developing) {
            push('os_missing', 'info', 'puzzle', {}, { nav: 'research', subtab: 'os' }, 70);
        }
        var bugs = arr(o.bugs).filter(function (b) { return b && b.status === 'active'; }).length;
        if (bugs >= 3) push('os_bugs', bugs >= 5 ? 'warn' : 'tip', 'bug', { n: bugs }, { nav: 'research', subtab: 'os' }, 40);
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
    },
    function idleCash(c, push) {
        if (c.burn <= 0 || !isFinite(c.runway) || c.runway < 15 || c.cash < 50000) return;
        push('idle_cash', 'info', 'gem-s', { months: c.runway.toFixed(0) }, { nav: 'research', subtab: 'tech' }, 85);
    }
];

export class AdvisorSystem {
    constructor(gameState, deps) {
        this.state = gameState;
        this.deps = deps || {};
        this._unsubs = [];
        this._provider = null;
        this._lastSig = '';
        this._timer = null;
        this._lastCheckDay = -1;
        this.brain = new AdvisorBrain(this);
        this._chat = [];
        this._errors = [];
        this._diagCache = null;
        
        this._lastProactiveWarn = {}; // [UPGRADE]
    }

    _lang() { return curLang(); }

    start() {
        var self = this;
        var refresh = function () { self._scheduleRefresh(); };
        ['time:day-changed', 'research:completed', 'research:started', 'product:released',
         'team:changed', 'product:stock-out', 'lang:changed', 'state:hydrated'].forEach(function (ev) {
            self._unsubs.push(bus.on(ev, refresh));
        });
        
        this._unsubs.push(bus.on('time:day-changed', function () { 
            self._snapshot(); 
            self._maybeToast(); 
            self._checkProactiveAnomalies(); // [UPGRADE]
        }));

        this._captureErrors();
        this._unsubs.push(bus.on('state:hydrated', function () { self._patchFreshAck(); }));
        this._patchFreshAck();
        PatchService.start(function () { self._onPatchInfo(); });
        
        if (!this._provider && ADVISOR_CONFIG && ADVISOR_CONFIG.aiEnabled && ADVISOR_CONFIG.endpoint) {
            this.setProvider(createAdvisorProvider(ADVISOR_CONFIG));
        }
        this._scheduleRefresh();
    }

    stop() {
        this._unsubs.forEach(function (u) { try { u(); } catch (e) {} });
        this._unsubs = [];
        try { PatchService.stop(); } catch (e) {}
        if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    }

    _store() {
        var d = this.state.data;
        if (!d.advisor || typeof d.advisor !== 'object') d.advisor = {};
        if (!d.advisor.snoozed) d.advisor.snoozed = {};
        if (!d.advisor.toasted) d.advisor.toasted = {};
        if (!Array.isArray(d.advisor.hist)) d.advisor.hist = [];
        return d.advisor;
    }

    _snapshot() {
        var d = this.state.data;
        if (!d || !d.time) return;
        var store = this._store();
        var day = Math.floor((d.time.elapsedGameMinutes || 0) / DAY);
        var last = store.hist[store.hist.length - 1];
        if (last && day - last.day < SNAPSHOT_EVERY_DAYS) return;
        var cat = arr((d.products || {}).catalog);
        var ps = {};
        cat.forEach(function (p) { if (p && p.id != null) ps[p.id] = p.totalSold || 0; });
        var hs = null;
        try { hs = this.getHealth().score; } catch (e) {}
        store.hist.push({
            day: day,
            cash: d.cash || 0,
            sold: sumBy(cat, function (p) { return p.totalSold; }),
            rev: sumBy(cat, function (p) { return p.totalRevenue; }),
            ps: ps,
            hs: hs
        });
        if (store.hist.length > MAX_SNAPSHOTS) store.hist.splice(0, store.hist.length - MAX_SNAPSHOTS);
    }

    _trends() {
        var h = this._store().hist;
        var out = { salesRecent: null, salesPrev: null, salesDrop: null, cashPerDay: null, points: h.length, perProduct: {}, healthDelta: null };
        if (h.length >= 2) {
            var a = h[h.length - 2], b = h[h.length - 1];
            var dd = Math.max(1, b.day - a.day);
            out.salesRecent = (b.sold - a.sold) / dd;
            out.cashPerDay = (b.cash - a.cash) / dd;
            if (a.ps && b.ps) {
                Object.keys(b.ps).forEach(function (id) {
                    if (typeof a.ps[id] === 'number') out.perProduct[id] = Math.max(0, (b.ps[id] - a.ps[id]) / dd);
                });
            }
            if (typeof a.hs === 'number' && typeof b.hs === 'number') out.healthDelta = b.hs - a.hs;
        }
        if (h.length >= 3) {
            var p0 = h[h.length - 3], p1 = h[h.length - 2];
            var d2 = Math.max(1, p1.day - p0.day);
            out.salesPrev = (p1.sold - p0.sold) / d2;
            if (out.salesPrev > 0) out.salesDrop = clamp(1 - out.salesRecent / out.salesPrev, -5, 1);
        }
        return out;
    }

    _wageIndex() {
        try { return getMacro(this.state.data.time, BALANCE.macro).wageIndex || 1; } catch (e) { return 1; }
    }
    recruitCostOf(role) {
        var base = (BALANCE.recruitCost && BALANCE.recruitCost[role]) || 2000;
        return Math.round(base * this._wageIndex());
    }
    salaryOf(role) {
        var base = (BALANCE.salary && BALANCE.salary[role]) || 2200;
        return Math.round(base * this._wageIndex());
    }

    _ctx() {
        var d = this.state.data;
        var self = this;
        var diff = (BALANCE.difficultyMultiplier && BALANCE.difficultyMultiplier[d.difficulty]) ||
                   (BALANCE.difficultyMultiplier && BALANCE.difficultyMultiplier.normal) || { expense: 1 };
        var m = BALANCE.monthly || {};
        var cpi = 1;
        try { cpi = getMacro(d.time, BALANCE.macro).cpiIndex || 1; } catch (e) {}
        var fixed = ((m.rentHQ || 0) + (m.utilities || 0) + (m.baseAdmin || 0)) * cpi * (diff.expense || 1);
        var payroll = sumBy(d.staff, function (s) { return s.salary; });
        var burn = fixed + payroll;
        var catalog = arr((d.products || {}).catalog);
        var loans = arr((d.finance || {}).loans);
        var debtService = sumBy(loans, function (l) { return l.installment; });
        var rh = arr((d.market || {}).revenueHistory).slice(0, 3);
        var income = rh.length ? sumBy(rh, function (r) { return r.playerRevenue; }) / rh.length : 0;
        var net = income - burn - debtService;
        var cash = d.cash || 0;
        var c = {
            d: d, deps: this.deps,
            now: (d.time && d.time.elapsedGameMinutes) || 0,
            cash: cash,
            burn: burn,
            payroll: payroll,
            fixed: fixed,
            runway: burn > 0 ? cash / burn : Infinity,
            income: income,
            debtService: debtService,
            net: net,
            trendRunway: net < 0 ? cash / -net : Infinity,
            loans: loans,
            team: {
                engineers: (d.team && d.team.engineers) || 0,
                designers: (d.team && d.team.designers) || 0,
                marketers: (d.team && d.team.marketers) || 0
            },
            catalog: catalog,
            selling: catalog.filter(function (p) { return p.status === 'selling'; }),
            trends: this._trends(),
            diag: this.getDiagnostics(),
            patch: this.getPatchStatus(),
            recruitCost: function (role) { return self.recruitCostOf(role); },
            bestResearch: function () { return self._bestResearch(c); }
        };
        return c;
    }

    _bestResearch(c) {
        var rs = this.deps.research;
        if (!rs) return null;
        var best = null, W = WHY[curLang()];
        try {
            arr(rs.getCategories()).forEach(function (cat) {
                arr(rs.getNodesByCategory(cat.id)).forEach(function (n) {
                    if (rs.getNodeStatus(n.id).status !== 'available') return;
                    if (n.cost > c.cash) return;
                    var dep = 0;
                    try { dep = typeof rs.getDependents === 'function' ? arr(rs.getDependents(n.id)).length : 0; } catch (e) {}
                    var eff = n.effects || {};
                    var unl = arr(eff.unlocksComponents).length + arr(eff.unlocksOsFeatures).length;
                    var value = 1 + dep * 2 + unl * 1.5;
                    var score = value / Math.max(1, n.cost);
                    if (!best || score > best.score) best = { node: n, score: score, dep: dep, unl: unl };
                });
            });
        } catch (e) { return null; }
        if (!best) return null;
        best.why = best.dep > 0 ? W.dependents.replace('{n}', best.dep)
                 : best.unl > 0 ? W.unlocks
                 : W.cheap;
        return best;
    }

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

    getHealth() {
        var c = this._ctx();
        var L = curLang() === 'id';
        var parts = [];
        var add = function (id, label, score, weight, note) {
            parts.push({ id: id, label: label, score: Math.round(clamp(score, 0, 100)), weight: weight, note: note || '' });
        };

        var liq = 100, liqNote = '';
        if (c.burn > 0) {
            var r = Math.min(c.runway, c.trendRunway);
            liq = r < 1 ? 5 : r < 3 ? 30 : r < 6 ? 60 : r < 12 ? 85 : 100;
            liqNote = isFinite(r) ? r.toFixed(1) + (L ? ' bln' : ' mo') : '';
        }
        if (((c.d.finance || {}).negativeMonths || 0) > 0) liq -= 25;
        if (c.loans.some(function (l) { return (l.missed || 0) > 0; })) liq -= 20;
        add('liquidity', L ? 'Likuiditas' : 'Liquidity', liq, 0.28, liqNote);

        var gr = c.selling.length ? 65 : (c.catalog.length ? 40 : 30), grNote = '';
        if (c.trends.salesDrop !== null && c.trends.salesPrev >= 5) {
            gr = clamp(75 - c.trends.salesDrop * 70, 10, 100);
            grNote = (c.trends.salesDrop >= 0 ? '-' : '+') + Math.abs(Math.round(c.trends.salesDrop * 100)) + '%';
        } else if (c.net > 0) { gr = 85; grNote = '+$' + money(c.net); }
        var sh = arr((c.d.market || {}).shareHistory);
        if (sh.length >= 2 && sh[0].playerShare < sh[1].playerShare * 0.85) gr -= 12;
        add('growth', L ? 'Pertumbuhan' : 'Growth', gr, 0.2, grNote);

        var pr = 20, prNote = '';
        if (c.catalog.length) {
            pr = 70;
            var out = c.selling.filter(function (p) { return (p.stock || 0) <= 0; }).length;
            pr -= out * 25;
            var sat = (c.d.feedback && c.d.feedback.perProductSatisfaction) || {};
            var vals = c.selling.map(function (p) { return sat[p.id]; }).filter(function (v) { return typeof v === 'number'; });
            if (vals.length) { var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length; pr = (pr + avg) / 2; prNote = Math.round(avg) + '/100'; }
            if (!c.selling.length) pr -= 20;
        }
        add('product', L ? 'Produk' : 'Product', pr, 0.2, prNote);

        var tm = 40, tmNote = '';
        var staff = arr(c.d.staff);
        if (staff.length) {
            var mor = sumBy(staff, function (s) { return s.morale; }) / staff.length;
            tm = mor; tmNote = Math.round(mor) + '/100';
            if (!c.team.designers && !c.catalog.length) tm -= 10;
            if (!c.team.marketers && c.selling.length) tm -= 10;
        }
        add('team', L ? 'Tim' : 'Team', tm, 0.12, tmNote);

        var rsr = c.d.research || {};
        var slots = rsr.maxSlots || 1, act = arr(rsr.active).length;
        var te = 40 + (act / slots) * 30 + Math.min(20, arr(rsr.completed).length);
        if (arr((c.d.os || {}).versions).length) te += 10;
        var bugs = arr((c.d.os || {}).bugs).filter(function (b) { return b && b.status === 'active'; }).length;
        te -= bugs * 6;
        add('tech', L ? 'Teknologi' : 'Tech', te, 0.1, act + '/' + slots + (L ? ' slot' : ' slots'));

        var rep = typeof (c.d.market || {}).reputation === 'number' ? c.d.market.reputation : 10;
        add('brand', L ? 'Merek' : 'Brand', rep, 0.1, Math.round(rep) + '/100');

        var score = 0, wsum = 0;
        parts.forEach(function (p) { score += p.score * p.weight; wsum += p.weight; });
        score = Math.max(5, Math.min(100, Math.round(score / wsum)));
        var label = score >= 80 ? (L ? 'Sangat baik' : 'Excellent')
                  : score >= 60 ? (L ? 'Baik' : 'Good')
                  : score >= 40 ? (L ? 'Waspada' : 'Caution')
                  : (L ? 'Kritis' : 'Critical');
        var weakest = parts.slice().sort(function (a, b) { return a.score - b.score; })[0];
        return { score: score, label: label, parts: parts, weakest: weakest };
    }

    forecast(months) {
        var n = months || 6;
        var c = this._ctx();
        var base = [], worst = [], cb = c.cash, cw = c.cash;
        var outflow = c.burn + c.debtService;
        var firstBase = null, firstWorst = null;
        for (var m = 1; m <= n; m++) {
            cb += c.income - outflow;
            cw += -outflow;
            base.push({ m: m, cash: cb });
            worst.push({ m: m, cash: cw });
            if (firstBase === null && cb < 0) firstBase = m;
            if (firstWorst === null && cw < 0) firstWorst = m;
        }
        return {
            base: base, worst: worst,
            income: c.income, outflow: outflow, net: c.income - outflow,
            runwayBase: (c.income - outflow) < 0 ? c.cash / (outflow - c.income) : Infinity,
            runwayWorst: outflow > 0 ? c.cash / outflow : Infinity
        };
    }

    simulate(opts) {
        var c = this._ctx(), o = opts || {};
        var addBurn = 0, upfront = 0, desc = [];
        var hire = o.hire || {};
        Object.keys(hire).forEach(function (role) {
            var n = hire[role] | 0;
            if (n <= 0) return;
            addBurn += n * this.salaryOf(role);
            upfront += n * this.recruitCostOf(role);
            desc.push(n + ' ' + role);
        }, this);
        var loanAmt = Math.max(0, o.loan || 0);
        var loanInst = 0;
        if (loanAmt > 0) {
            var rate = 0.03, term = 12;
            loanInst = loanAmt * rate / (1 - Math.pow(1 + rate, -term));
        }
        var cashAfter = c.cash - upfront + loanAmt;
        var newBurn = c.burn + addBurn;
        var outflow = newBurn + c.debtService + loanInst;
        var runway = newBurn > 0 ? cashAfter / newBurn : Infinity;
        var net = c.income - outflow;
        return {
            desc: desc, upfront: upfront, addBurn: addBurn, loanAmt: loanAmt, loanInst: loanInst,
            cashAfter: cashAfter, newBurn: newBurn, runwayBefore: c.runway, runwayAfter: runway,
            netBefore: c.net, netAfter: net,
            trendRunwayAfter: net < 0 ? cashAfter / -net : Infinity,
            safe: cashAfter >= newBurn * 3 && (net >= 0 || cashAfter / -net >= 6)
        };
    }

    _captureErrors() {
        var self = this;
        if (typeof window === 'undefined' || typeof window.addEventListener !== 'function' || this._errHandlers) return;
        var push = function (msg, src) {
            msg = String(msg || '').slice(0, 200);
            if (!msg || /^Script error\.?$/i.test(msg) || /ResizeObserver loop/i.test(msg)) return;
            self._errors.push({ t: Date.now(), msg: msg, src: src || '' });
            if (self._errors.length > 10) self._errors.shift();
            self._diagCache = null;
            self._scheduleRefresh();
        };
        var onErr = function (e) { push(e && e.message, e && e.filename ? String(e.filename).split('/').pop() + ':' + (e.lineno || 0) : ''); };
        var onRej = function (e) { var r = e && e.reason; push(r && r.message ? r.message : r, 'promise'); };
        window.addEventListener('error', onErr);
        window.addEventListener('unhandledrejection', onRej);
        this._errHandlers = [onErr, onRej];
        this._unsubs.push(function () {
            window.removeEventListener('error', onErr);
            window.removeEventListener('unhandledrejection', onRej);
            self._errHandlers = null;
        });
    }

    _gameRef() {
        var g = (typeof window !== 'undefined') ? window.__game : null;
        return (g && g.state && typeof g.state.get === 'function') ? g : null;
    }

    getDiagnostics() {
        var now = Date.now();
        if (!this._diagCache || now - this._diagCache.t > 30000) {
            var alerts = [];
            var g = this._gameRef();
            if (g) {
                try { alerts = (buildReport(g.state.get(), g, {}).sanity || {}).alerts || []; } catch (e) {}
            }
            this._diagCache = { t: now, alerts: alerts };
        }
        return { alerts: this._diagCache.alerts, errors: this._errors.slice() };
    }

    buildBugReportText() {
        var g = this._gameRef(), L = [];
        try {
            if (g) L.push(formatReportText(buildReport(g.state.get(), g, { detailed: true })));
        } catch (e) { L.push('(laporan dasar gagal dibuat: ' + (e && e.message) + ')'); }
        var pinfo = PatchService.getInfo();
        L.push('');
        L.push('App version: v' + PatchService.current() + (pinfo ? ' (latest on server: v' + pinfo.latest + ')' : ' (patch check: n/a)'));
        var dg = this.getDiagnostics();
        L.push('');
        L.push('--- RUNTIME ERRORS (' + dg.errors.length + ') ---');
        dg.errors.forEach(function (x) { L.push(new Date(x.t).toISOString() + ' ' + x.msg + (x.src ? ' @ ' + x.src : '')); });
        if (!dg.errors.length) L.push('(tidak ada)');
        try {
            var h = this.getHealth();
            L.push('');
            L.push('--- ADVISOR ---');
            L.push('Health: ' + h.score + '/100 (' + h.label + ')');
            L.push('Advice: ' + this.getAdvice().map(function (a) { return a.id; }).join(', '));
        } catch (e) {}
        return L.join('\n');
    }

    getBriefing() {
        var d = this.state.data;
        if (!d || !d.time) return null;
        var store = this._store();
        var seen = store.seen;
        if (!seen) return null;
        var c = this._ctx();
        var days = Math.floor((c.now - seen.now) / DAY);
        if (days < 1) return null;
        var list = this.getAdvice().filter(function (a) { return a.id !== 'all_good'; });
        var prev = arr(seen.ids);
        var fresh = list.filter(function (a) { return prev.indexOf(a.id) < 0 && (a.sev === 'critical' || a.sev === 'warn'); });
        var nowIds = list.map(function (a) { return a.id; });
        var resolved = prev.filter(function (id) { return nowIds.indexOf(id) < 0; }).length;
        var sold = sumBy(c.catalog, function (p) { return p.totalSold; });
        var health = this.getHealth().score;
        var out = {
            days: days,
            cashDelta: Math.round(c.cash - seen.cash),
            soldDelta: Math.max(0, sold - (seen.sold || 0)),
            healthDelta: typeof seen.hs === 'number' ? health - seen.hs : null,
            fresh: fresh.slice(0, 3).map(function (a) { return { id: a.id, sev: a.sev, title: a.title }; }),
            resolved: resolved
        };
        var notable = out.fresh.length || out.resolved || Math.abs(out.cashDelta) >= Math.max(500, c.cash * 0.05) ||
                      out.soldDelta > 0 || (out.healthDelta !== null && Math.abs(out.healthDelta) >= 3);
        return notable ? out : null;
    }

    markSeen() {
        var d = this.state.data;
        if (!d || !d.time) return;
        var c = this._ctx();
        var store = this._store();
        var ids = this.getAdvice().filter(function (a) { return a.id !== 'all_good'; }).map(function (a) { return a.id; });
        store.seen = {
            now: c.now,
            cash: Math.round(c.cash),
            sold: sumBy(c.catalog, function (p) { return p.totalSold; }),
            hs: this.getHealth().score,
            ids: ids
        };
    }

    snooze(id, days) {
        var c = this._ctx();
        var store = this._store();
        store.snoozed[id] = c.now + (days || SNOOZE_DAYS) * DAY;
        Object.keys(store.snoozed).forEach(function (k) {
            if (store.snoozed[k] <= c.now) delete store.snoozed[k];
        });
        this._scheduleRefresh();
    }

    _patchStore() {
        var st = this._store();
        if (!st.patch || typeof st.patch !== 'object') st.patch = {};
        return st.patch;
    }

    getPatchStatus() {
        var isId = curLang() === 'id';
        var info = PatchService.getInfo();
        var cur = PatchService.current();
        var out = { checked: !!info, cur: cur, latest: info ? info.latest : null,
                    kind: null, ver: null, sum: '', fixes: 0, total: 0, lastVer: null, lastSum: '' };
        if (!info) return out;
        var past = PatchService.releasesAfter('0.0.0', cur);
        if (past.length) { out.lastVer = past[0].version; out.lastSum = patchSummary([past[0]], isId).sum; }
        var rel;
        if (cmpVersion(info.latest, cur) > 0) {
            rel = PatchService.releasesAfter(cur);
            out.kind = 'update';
            out.ver = info.latest;
        } else {
            var ack = this._patchStore().ack || '0.0.0';
            rel = PatchService.releasesAfter(ack, cur);
            if (!rel.length) return out;
            out.ver = rel[0].version;
        }
        var s = patchSummary(rel, isId);
        out.sum = s.sum; out.fixes = s.fixes; out.total = s.total;
        if (!out.kind) out.kind = s.fixes ? 'fix' : 'new';
        return out;
    }

    _patchFreshAck() {
        var d = this.state.data;
        if (!d || !d.time) return;
        var st = this._patchStore();
        if (!st.ack && (d.time.elapsedGameMinutes || 0) < 3 * DAY) st.ack = PatchService.current();
    }

    _onPatchInfo() {
        this._patchFreshAck();
        this._lastSig = '';
        this._scheduleRefresh();
        this._patchNotify();
    }

    _patchNotify() {
        var d = this.state.data;
        if (!d || !d.time) return;
        var tut = d.tutorial || {};
        if (!tut.completed && !tut.skipped) return;
        var p = this.getPatchStatus();
        if (!p.kind) return;
        var st = this._patchStore();
        var key = p.kind + ':' + p.ver;
        if (st.notified === key) return;
        st.notified = key;
        var base = p.kind === 'update' ? 'patch_update' : (p.kind === 'fix' ? 'patch_fix' : 'patch_new');
        try { ToastService.warning(tx(base + '.t', { v: p.ver, cur: p.cur }), 6000); } catch (e) {}
    }

    ackPatch(ver) {
        var st = this._patchStore();
        var v = String(ver || PatchService.current());
        if (!st.ack || cmpVersion(v, st.ack) > 0) st.ack = v;
        this._lastSig = '';
        this._scheduleRefresh();
    }

    applyUpdate() {
        var g = this._gameRef();
        try { if (g && g.SaveService) g.SaveService.save(g.state); } catch (e) {}
        try { ToastService.success(tx('ui.patch_saved')); } catch (e) {}
        setTimeout(function () { try { window.location.reload(); } catch (e) {} }, 700);
    }

    _scheduleRefresh() {
        var self = this;
        if (this._timer) return;
        this._timer = setTimeout(function () {
            self._timer = null;
            var b = self.getBadge();
            var pi = PatchService.getInfo();
            var sig = b.count + ':' + b.critical + ':' + b.total + ':' + curLang() + ':' + (pi ? pi.latest : '') + ':' + ((self._patchStore().ack) || '');
            if (sig !== self._lastSig) {
                self._lastSig = sig;
                bus.emit('advisor:updated', b);
            }
        }, 250);
    }

    _maybeToast() {
        var d = this.state.data;
        if (!d || !d.time) return;
        this._patchNotify();
        var tut = d.tutorial || {};
        if (!tut.completed && !tut.skipped) return;
        var day = Math.floor((d.time.elapsedGameMinutes || 0) / DAY);
        if (this._lastCheckDay >= 0 && day - this._lastCheckDay < CHECK_EVERY_DAYS) return;
        this._lastCheckDay = day;

        var store = this._store();
        var now = d.time.elapsedGameMinutes || 0;
        var list = this.getAdvice();
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (a.sev !== 'critical' && a.sev !== 'warn') continue;
            if (a.id.indexOf('patch_') === 0) continue;
            var last = store.toasted[a.id];
            if (typeof last === 'number' && now - last < TOAST_COOLDOWN_DAYS * DAY) continue;
            store.toasted[a.id] = now;
            try {
                if (a.sev === 'critical') ToastService.error(a.title);
                else ToastService.warning(a.title);
            } catch (e) {}
            break;
        }
    }

    _checkProactiveAnomalies() {
        var c = this._ctx();
        var today = Math.floor(c.now / DAY);

        // 1. Kas Kritis
        if (c.cash < c.burn && c.cash > 0 && c.burn > 0) {
            if (!this._lastProactiveWarn['cash'] || this._lastProactiveWarn['cash'] < today) {
                ToastService.error('Asisten: Uang kas kurang dari biaya bulanan! Segera cari pinjaman atau jual stok.');
                this._lastProactiveWarn['cash'] = today;
            }
        }

        // 2. Stok Habis
        var outOfStock = (c.selling || []).filter(function(p) { return p.stock === 0; });
        if (outOfStock.length > 0) {
            if (!this._lastProactiveWarn['stock'] || this._lastProactiveWarn['stock'] < today) {
                ToastService.warning('Asisten: Stok "' + outOfStock[0].name + '" habis. Penjualan berhenti!');
                this._lastProactiveWarn['stock'] = today;
            }
        }

        // 3. Moral Rendah
        var staff = c.d.staff || [];
        if (staff.length > 0) {
            var avgMorale = staff.reduce(function(a,b){ return a + (b.morale || 0); }, 0) / staff.length;
            if (avgMorale < 40) {
                if (!this._lastProactiveWarn['morale'] || this._lastProactiveWarn['morale'] < today) {
                    ToastService.warning('Asisten: Moral tim sedang sangat rendah (' + Math.round(avgMorale) + '/100). Segera lakukan training atau beri perhatian.');
                    this._lastProactiveWarn['morale'] = today;
                }
            }
        }
    }

    setProvider(fn) { this._provider = (typeof fn === 'function') ? fn : null; }
    hasProvider() { return !!this._provider; }

    buildContext() {
        var c = this._ctx();
        var d = c.d;
        var t = d.time || {};
        var h = this.getHealth();
        return {
            date: { year: t.currentYear, month: t.currentMonth, day: t.currentDay },
            company: d.companyName,
            difficulty: d.difficulty,
            cash: c.cash,
            monthlyBurn: Math.round(c.burn),
            monthlyRevenue: Math.round(c.income),
            netMonthly: Math.round(c.net),
            debtService: Math.round(c.debtService),
            runwayMonths: isFinite(c.runway) ? Math.round(c.runway * 10) / 10 : null,
            health: { score: h.score, label: h.label, weakest: h.weakest && h.weakest.id },
            team: c.team,
            research: {
                active: arr((d.research || {}).active).map(function (e) { return e.name; }),
                slots: (d.research || {}).maxSlots,
                completedCount: arr((d.research || {}).completed).length
            },
            products: c.catalog.map(function (p) {
                return { name: p.name, status: p.status, stock: p.stock, price: p.price, unitCost: p.unitCost, sold: p.totalSold };
            }),
            loans: c.loans.map(function (l) { return { remaining: l.remaining, installment: l.installment, missed: l.missed }; }),
            trends: { salesDrop: c.trends.salesDrop, salesPerDay: c.trends.salesRecent },
            os: { versions: arr((d.os || {}).versions).length, bugs: arr((d.os || {}).bugs).filter(function (b) { return b && b.status === 'active'; }).length },
            fab: { built: !!(d.fab && d.fab.built), level: d.fab && d.fab.level },
            market: { share: (d.market || {}).share, reputation: (d.market || {}).reputation },
            activeCampaigns: arr((d.marketing || {}).activeCampaigns).length,
            healthParts: h.parts.map(function (p) { return { id: p.id, score: p.score }; }),
            salesPaceByProduct: c.trends.perProduct
        };
    }

    getChat() {
        if (!this._chat.length) this._chat.push(Object.assign({ role: 'bot' }, this.brain.greeting()));
        return this._chat;
    }
    resetChat() { this._chat = []; this.brain.resetMemory(); }

    async chat(text) {
        var q = String(text || '').trim();
        if (!q) return null;
        this.getChat().push({ role: 'user', text: q });
        var res;
        try { res = this.brain.reply(q); }
        catch (e) { console.warn('[Advisor] brain gagal:', e); res = { text: tx('ui.ask_fail'), actions: [], chips: [] }; }
        
        if (this._provider && (res.intent === 'unknown' || (res.confidence !== undefined && res.confidence < 0.35 && res.intent !== 'clarify'))) {
            var ai = await this.ask(q);
            if (ai.ok && ai.text) res = { text: ai.text, actions: res.actions || [], chips: res.chips || [], intent: 'ai', source: 'ai', confidence: 1 };
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
            var history = this._chat.slice(-7, -1).map(function (m) {
                return { role: m.role === 'user' ? 'user' : 'assistant', text: String(m.text || '').slice(0, 280) };
            });
            var text = await this._provider({
                question: String(question || ''),
                context: this.buildContext(),
                advice: advice,
                history: history,
                lang: curLang()
            });
            return { ok: true, text: String(text || '') };
        } catch (e) {
            return { ok: false, reason: (e && e.message) || 'error' };
        }
    }
                    }
