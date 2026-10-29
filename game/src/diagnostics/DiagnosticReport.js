// FILE: src/diagnostics/DiagnosticReport.js
// ============================================================
// Diagnostic Report Builder — Smartphone Empire
// v2027.1a
// ============================================================
// Fungsi:
//   buildReport(state, game, opts)  → objek terstruktur (JSON-safe)
//   formatReportText(report)        → string Markdown-friendly
//
// Kegunaan:
//   - Diagnosa bug oleh developer.
//   - Paste ke AI (DeepSeek, ChatGPT, dll.) untuk analisis.
//   - Simpan riwayat kondisi game.
//
// Usage (dari console / Eruda):
//   __game.report()                       // summary
//   __game.report({ detailed: true })     // + list lengkap
//   __game.report({ raw: true })          // + raw state
//   copy(__game.reportText())             // copy teks ke clipboard
// ============================================================

export const REPORT_VERSION = '1.0.0';

// ---------- Utilities ----------
function _safe(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
}
function _isNum(n) { return typeof n === 'number' && isFinite(n); }
function _fmtMoney(n) {
    if (!_isNum(n)) return '$—';
    return '$' + Math.round(n).toLocaleString('en-US');
}
function _fmtMoney2(n) {
    if (!_isNum(n)) return '$—';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function _fmtNum(n) { return _isNum(n) ? n.toLocaleString('en-US') : '—'; }
function _fmtPct(n, d) { return _isNum(n) ? (n * 100).toFixed(d == null ? 1 : d) + '%' : '—'; }
function _isoNow() { return new Date().toISOString(); }

function _browserInfo() {
    if (typeof navigator === 'undefined') return '—';
    var ua = navigator.userAgent || '';
    return {
        ua: ua,
        platform: (navigator.platform || '—'),
        language: (navigator.language || '—'),
        online: (typeof navigator.onLine === 'boolean' ? navigator.onLine : null)
    };
}

// ---------- Section collectors ----------
function _meta(state, game) {
    return {
        generatedAt: _isoNow(),
        reportVersion: REPORT_VERSION,
        appVersion: (game && game.state && game.state.data && game.state.data.schemaVersion) || null,
        schemaVersion: state.schemaVersion,
        era: state.era,
        difficulty: state.difficulty,
        browser: _browserInfo()
    };
}

function _time(state) {
    var t = state.time || {};
    var MIN_PER_DAY = 24 * 60;
    var totalDays = Math.floor((t.elapsedGameMinutes || 0) / MIN_PER_DAY);
    return {
        currentYear: t.currentYear,
        currentMonth: t.currentMonth,
        currentDay: t.currentDay,
        currentHour: t.currentHour,
        currentMinute: t.currentMinute,
        elapsedGameMinutes: t.elapsedGameMinutes,
        totalDays: totalDays,
        isPaused: state.isPaused,
        gameSpeed: state.gameSpeed
    };
}

function _company(state) {
    return {
        name: state.companyName,
        cash: state.cash,
        cashIsInteger: Number.isInteger(state.cash),
        era: state.era,
        eraStartYear: state.eraStartYear,
        reputation: (state.market && state.market.reputation) || 0,
        sentiment: (state.feedback && state.feedback.sentiment) || 50
    };
}

function _team(state, game) {
    var staff = Array.isArray(state.staff) ? state.staff : [];
    var byRole = { engineer: 0, designer: 0, marketer: 0 };
    var totalSalary = 0;
    var moraleSum = 0;
    staff.forEach(function (s) {
        if (byRole[s.role] !== undefined) byRole[s.role]++;
        totalSalary += s.salary || 0;
        moraleSum += s.morale || 0;
    });
    return {
        totalStaff: staff.length,
        byRole: byRole,
        totalSalary: totalSalary,
        avgMorale: staff.length ? Math.round(moraleSum / staff.length) : 0,
        candidatesCount: Array.isArray(state.candidates) ? state.candidates.length : 0
    };
}

function _products(state, opts) {
    var catalog = Array.isArray(state.products && state.products.catalog) ? state.products.catalog : [];
    var totalRevenue = 0, totalSold = 0;
    catalog.forEach(function (p) {
        totalRevenue += p.totalRevenue || 0;
        totalSold += p.totalSold || 0;
    });
    var out = {
        totalProducts: catalog.length,
        activeProducts: catalog.filter(function (p) { return p.status === 'selling'; }).length,
        totalRevenue: totalRevenue,
        totalSold: totalSold,
        development: state.products && state.products.development ? {
            name: state.products.development.name,
            phase: state.products.development.phase,
            startedAtGameMinute: state.products.development.startedAtGameMinute
        } : null
    };
    if (opts && opts.detailed) {
        out.list = catalog.map(function (p) {
            return {
                id: p.id, name: p.name, status: p.status,
                price: p.price, stock: p.stock, totalSold: p.totalSold,
                totalRevenue: p.totalRevenue, qualityScore: p.stats ? p.stats.qualityScore : null
            };
        });
    }
    return out;
}

function _research(state) {
    var r = state.research || {};
    var cr = state.chipResearch || {};
    return {
        completed: (r.completed || []).length,
        active: (r.active || []).length,
        maxSlots: r.maxSlots || 0,
        chipCompleted: (cr.completed || []).length,
        chipActive: (cr.active || []).length,
        chipMaxSlots: cr.maxSlots || 0
    };
}

function _os(state) {
    var o = state.os || {};
    return {
        name: o.name || null,
        versions: Array.isArray(o.versions) ? o.versions.length : 0,
        currentVersionId: o.currentVersionId || null,
        developing: o.developing ? { id: o.developing.id || null } : null,
        bugs: Array.isArray(o.bugs) ? o.bugs.length : 0,
        thirdPartyApps: (o.apps && o.apps.thirdParty) || 0
    };
}

function _fab(state) {
    var f = state.fab || {};
    return {
        built: !!f.built,
        level: f.level || 0,
        producing: f.producing ? { chipId: f.producing.chipId || null, qty: f.producing.qty || 0 } : null,
        inventory: f.inventory || 0,
        totalProduced: f.totalProduced || 0
    };
}

function _market(state, opts) {
    var m = state.market || {};
    var comps = Array.isArray(m.competitors) ? m.competitors : [];
    var out = {
        share: m.share || 0,
        sharePct: _fmtPct(m.share || 0),
        reputation: m.reputation || 0,
        competitorCount: comps.length,
        competitors: comps.map(function (c) {
            return { id: c.id, name: c.name, share: c.share };
        }),
        shareHistoryPoints: Array.isArray(m.shareHistory) ? m.shareHistory.length : 0
    };
    return out;
}

function _stocks(state, game, opts) {
    var s = state.stocks || {};
    var portfolio = Array.isArray(s.portfolio) ? s.portfolio : [];
    var transactions = Array.isArray(s.transactions) ? s.transactions : [];
    var stockSys = game && game.stocks ? game.stocks : null;
    var portfolioValue = stockSys ? _safe(function () { return stockSys.getPortfolioValue(); }, 0) : 0;
    var netWorth = stockSys ? _safe(function () { return stockSys.getNetWorth(); }, 0) : (state.cash || 0);
    var out = {
        portfolioCount: portfolio.length,
        portfolioValue: portfolioValue,
        portfolioValue2: _fmtMoney2(portfolioValue),
        netWorth: netWorth,
        netWorth2: _fmtMoney2(netWorth),
        transactionCount: transactions.length,
        priceCount: Object.keys(s.prices || {}).length,
        indexCount: Object.keys(s.indices || {}).length
    };
    if (opts && opts.detailed) {
        out.portfolio = portfolio.map(function (h) {
            return { stockId: h.stockId, shares: h.shares, avgBuyPriceUSD: h.avgBuyPriceUSD, totalCostUSD: h.totalCostUSD };
        });
        out.recentTransactions = transactions.slice(0, 5).map(function (t) {
            return { type: t.type, ticker: t.ticker, shares: t.shares, totalUSD: t.totalUSD, day: t.day, month: t.month, year: t.year };
        });
    }
    return out;
}

function _finance(state) {
    var f = state.finance || {};
    var loans = Array.isArray(f.loans) ? f.loans : [];
    var history = Array.isArray(f.history) ? f.history : [];
    return {
        negativeMonths: f.negativeMonths || 0,
        activeLoans: loans.length,
        totalLoanRemaining: loans.reduce(function (a, l) { return a + (l.remaining || 0); }, 0),
        historyPoints: history.length,
        lastProcessed: f.lastProcessed || null
    };
}

function _news(state) {
    var n = state.news || {};
    return {
        articleCount: Array.isArray(n.articles) ? n.articles.length : 0,
        recapSeeded: !!n.recapSeeded,
        headlineHistoryPoints: Array.isArray(n.headlineHistory) ? n.headlineHistory.length : 0
    };
}

function _events(state, opts) {
    var log = Array.isArray(state.log) ? state.log : [];
    var milestones = Array.isArray(state.milestones) ? state.milestones : [];
    var out = {
        logCount: log.length,
        milestoneCount: milestones.length
    };
    if (opts && opts.detailed) {
        out.recentLog = log.slice(0, 10).map(function (e) {
            return { year: e.year, month: e.month, day: e.day, type: e.type, text: e.text };
        });
        out.recentMilestones = milestones.slice(-5).map(function (m) {
            return { id: m.id, year: m.year, month: m.month, text: m.text };
        });
    }
    return out;
}

function _settings(state) {
    var s = state.settings || {};
    return {
        vibrate: !!s.vibrate,
        sound: !!s.sound,
        competitorMode: s.competitorMode || 'real'
    };
}

function _systems(game) {
    if (!game) return { started: [], listenerCounts: {} };
    var started = [];
    ['timeSystem','economy','quests','tutorial','research','chipResearch','os','products',
     'market','competitors','opinion','eraSystem','teamSystem','chips','fab','news','advisor','stocks']
        .forEach(function (k) { if (game[k]) started.push(k); });

    var listenerCounts = {};
    _safe(function () {
        if (game.bus && game.bus._listeners) {
            Object.keys(game.bus._listeners).forEach(function (ev) {
                var arr = game.bus._listeners[ev];
                listenerCounts[ev] = Array.isArray(arr) ? arr.length : 1;
            });
        } else if (game.bus && typeof game.bus.getListenerCounts === 'function') {
            listenerCounts = game.bus.getListenerCounts();
        }
    }, null);

    return { started: started, listenerCounts: listenerCounts };
}

// ---------- Sanity checks ----------
function _sanity(state, game) {
    var alerts = [];
    function push(level, code, msg) { alerts.push({ level: level, code: code, msg: msg }); }

    // 1. Cash integer
    if (!Number.isInteger(state.cash)) {
        push('warn', 'CASH_NON_INTEGER', 'Cash bukan integer: ' + state.cash);
    }
    // 2. Cash NaN
    if (!_isNum(state.cash)) {
        push('error', 'CASH_NAN', 'Cash NaN atau bukan angka: ' + state.cash);
    }
    // 3. Cash negatif tanpa gameOver
    if (state.cash < 0 && !state.gameOver) {
        push('warn', 'CASH_NEGATIVE', 'Cash negatif tapi game belum over.');
    }
    // 4. Portfolio value konsisten
    _safe(function () {
        if (game && game.stocks) {
            var sysValue = game.stocks.getPortfolioValue();
            var manual = 0;
            (state.stocks.portfolio || []).forEach(function (h) {
                var price = game.stocks.getPrice(h.stockId);
                var stock = null;
                // cari stock untuk rate
                manual += price * h.shares;
            });
            if (Math.abs(sysValue - manual) > 1000) {
                push('warn', 'PORTFOLIO_MISMATCH',
                    'Portfolio value berbeda: sys=' + Math.round(sysValue) + ' vs manual≈' + Math.round(manual));
            }
        }
    }, null);
    // 5. Staff valid
    (state.staff || []).forEach(function (s, i) {
        if (!s.id) push('warn', 'STAFF_NO_ID', 'Staff #' + i + ' tanpa id.');
        if (!['engineer','designer','marketer'].includes(s.role)) {
            push('warn', 'STAFF_BAD_ROLE', 'Staff #' + i + ' role tidak valid: ' + s.role);
        }
    });
    // 6. Products valid
    (state.products && state.products.catalog || []).forEach(function (p, i) {
        if (!p.id) push('warn', 'PRODUCT_NO_ID', 'Product #' + i + ' tanpa id.');
        if (!_isNum(p.stock) || p.stock < 0) push('warn', 'PRODUCT_BAD_STOCK', 'Product ' + p.name + ' stock tidak valid: ' + p.stock);
    });
    // 7. Research no duplicates
    _safe(function () {
        var r = state.research || {};
        var seen = {}, dup = [];
        (r.completed || []).forEach(function (id) {
            if (seen[id]) dup.push(id);
            seen[id] = true;
        });
        if (dup.length) push('warn', 'RESEARCH_DUPLICATE', 'Research duplikat: ' + dup.join(', '));
    }, null);
    // 8. Finance history size
    _safe(function () {
        var h = (state.finance && state.finance.history) || [];
        if (h.length > 24) push('warn', 'FINANCE_HISTORY_OVERFLOW', 'Finance history > 24: ' + h.length);
    }, null);
    // 9. Elapsed minutes
    if (!_isNum(state.time && state.time.elapsedGameMinutes)) {
        push('error', 'TIME_INVALID', 'elapsedGameMinutes tidak valid.');
    }
    // 10. Competitor mode
    _safe(function () {
        var comps = state.market && state.market.competitors;
        if (!Array.isArray(comps)) push('warn', 'MARKET_COMPETITORS_NOT_ARRAY', 'market.competitors bukan array.');
    }, null);

    return alerts;
}

// ---------- Public API ----------
export function buildReport(state, game, opts) {
    opts = opts || {};
    var report = {
        meta:     _safe(function () { return _meta(state, game); }, {}),
        time:     _safe(function () { return _time(state); }, {}),
        company:  _safe(function () { return _company(state); }, {}),
        team:     _safe(function () { return _team(state, game); }, {}),
        products: _safe(function () { return _products(state, opts); }, {}),
        research: _safe(function () { return _research(state); }, {}),
        os:       _safe(function () { return _os(state); }, {}),
        fab:      _safe(function () { return _fab(state); }, {}),
        market:   _safe(function () { return _market(state, opts); }, {}),
        stocks:   _safe(function () { return _stocks(state, game, opts); }, {}),
        finance:  _safe(function () { return _finance(state); }, {}),
        news:     _safe(function () { return _news(state); }, {}),
        events:   _safe(function () { return _events(state, opts); }, {}),
        settings: _safe(function () { return _settings(state); }, {}),
        systems:  _safe(function () { return _systems(game); }, {}),
        sanity:   _safe(function () { return { alerts: _sanity(state, game) }; }, { alerts: [] })
    };
    if (opts.raw) {
        report.raw = _safe(function () { return JSON.parse(JSON.stringify(state)); }, null);
    }
    return report;
}

export function formatReportText(report) {
    if (!report) return 'No report.';
    var L = [];
    var m = report.meta || {};
    var c = report.company || {};
    var t = report.time || {};
    var team = report.team || {};
    var prod = report.products || {};
    var market = report.market || {};
    var stocks = report.stocks || {};

    L.push('=== SMARTPHONE EMPIRE — DIAGNOSTIC REPORT ===');
    L.push('Generated: ' + (m.generatedAt || '?'));
    L.push('Report Version: ' + (m.reportVersion || '?'));
    L.push('Schema Version: ' + (m.schemaVersion || '?'));
    L.push('Era: ' + (m.era || '?'));
    L.push('Difficulty: ' + (m.difficulty || '?'));
    L.push('Browser: ' + ((m.browser && m.browser.ua) || '?'));
    L.push('');

    L.push('--- TIME ---');
    L.push('Date: ' + t.currentDay + '/' + t.currentMonth + '/' + t.currentYear +
           ' ' + t.currentHour + ':' + String(t.currentMinute).padStart(2, '0'));
    L.push('Elapsed: ' + _fmtNum(t.elapsedGameMinutes) + ' min = ' + _fmtNum(t.totalDays) + ' days');
    L.push('Paused: ' + t.isPaused + ' | Speed: ' + t.gameSpeed + 'x');
    L.push('');

    L.push('--- COMPANY ---');
    L.push('Name: ' + c.name);
    L.push('Cash: ' + _fmtMoney(c.cash) + ' | Integer: ' + c.cashIsInteger);
    L.push('Reputation: ' + c.reputation + '/100 | Sentiment: ' + c.sentiment + '/100');
    L.push('');

    L.push('--- TEAM ---');
    L.push('Staff: ' + team.totalStaff + ' (E:' + team.byRole.engineer +
           ' D:' + team.byRole.designer + ' M:' + team.byRole.marketer + ')');
    L.push('Total Salary: ' + _fmtMoney(team.totalSalary) + '/mo | Avg Morale: ' + team.avgMorale + '/100');
    L.push('Candidates: ' + team.candidatesCount);
    L.push('');

    L.push('--- PRODUCTS ---');
    L.push('Total: ' + prod.totalProducts + ' | Active: ' + prod.activeProducts);
    L.push('Total Revenue: ' + _fmtMoney(prod.totalRevenue) + ' | Total Sold: ' + _fmtNum(prod.totalSold));
    if (prod.development) L.push('In Dev: ' + prod.development.name + ' (' + prod.development.phase + ')');
    L.push('');

    L.push('--- RESEARCH / OS / FAB ---');
    L.push('Research: ' + (report.research.completed) + ' done, ' + (report.research.active) + ' active');
    L.push('Chip Research: ' + (report.research.chipCompleted) + ' done, ' + (report.research.chipActive) + ' active');
    L.push('OS: ' + (report.os.name || '—') + ' | Versions: ' + report.os.versions + ' | Bugs: ' + report.os.bugs);
    L.push('Fab: built=' + report.fab.built + ' lvl=' + report.fab.level + ' inv=' + report.fab.inventory);
    L.push('');

    L.push('--- MARKET ---');
    L.push('Your Share: ' + market.sharePct + ' | Reputation: ' + market.reputation + '/100');
    L.push('Competitors: ' + market.competitorCount);
    (market.competitors || []).slice(0, 6).forEach(function (c) {
        L.push('  ' + c.name + ': ' + _fmtPct(c.share || 0));
    });
    L.push('');

    L.push('--- STOCKS ---');
    L.push('Portfolio: ' + stocks.portfolioCount + ' holdings, value ' + stocks.portfolioValue2);
    L.push('Net Worth: ' + stocks.netWorth2);
    L.push('Transactions: ' + stocks.transactionCount + ' | Price points: ' + stocks.priceCount);
    L.push('');

    L.push('--- FINANCE ---');
    var f = report.finance || {};
    L.push('Negative Months: ' + f.negativeMonths);
    L.push('Active Loans: ' + f.activeLoans + ' | Remaining: ' + _fmtMoney(f.totalLoanRemaining));
    L.push('History Points: ' + f.historyPoints);
    L.push('');

    L.push('--- SYSTEMS ---');
    var sys = report.systems || {};
    L.push('Started: ' + (sys.started || []).join(', '));
    var lc = sys.listenerCounts || {};
    var lcKeys = Object.keys(lc);
    if (lcKeys.length) {
        L.push('Listeners:');
        lcKeys.sort().forEach(function (k) {
            L.push('  ' + k + ': ' + lc[k]);
        });
    }
    L.push('');

    L.push('--- SANITY CHECKS ---');
    var alerts = (report.sanity && report.sanity.alerts) || [];
    if (!alerts.length) {
        L.push('✓ Semua pemeriksaan lolos.');
    } else {
        alerts.forEach(function (a) {
            L.push('[' + a.level.toUpperCase() + '] ' + a.code + ': ' + a.msg);
        });
    }
    L.push('');
    L.push('=== END OF REPORT ===');

    return L.join('\n');
      }
