// FILE: src/ui/office/OfficeLogic.js  (REPLACE — v2027.53a: progres riset & desain di kartu)
// Logika ruangan murni (tanpa THREE/DOM): status buka/terkunci, level, teks kartu.
// Dipisah dari OfficeScene.js (refactor, tanpa perubahan perilaku).
import { FAB_LEVELS } from '../../systems/FabSystem.js';
import { WalletService } from '../../systems/WalletService.js';
import { t } from '../../core/LanguageService.js';
import { MAX_DESKS, ROOM_DEFS, clamp, deskCapacity, fmtMoney, len, lowMoraleCount, moneyBucket, moraleTier, roleCount, roleDef, sortedStaff, tierDef, traitDef } from './OfficeConfig.js';
import { activeResearchPct, devOverallPct, devPhaseFrac } from './OfficeFx.js';

// ============================================================
// LOGIKA RUANGAN (murni, tanpa THREE) — status buka/terkunci, level, signature, teks kartu.
// ============================================================
export var ROOM_LOGIC = {
    ceo: {
        state: function (d, p) { return { open: true, level: clamp(1 + (p.levels.monument || 0), 1, 3) }; },
        sig: function (d, p) { return [p.levels.monument || 0, Math.round((d.market && d.market.reputation) || 0) >= 50 ? 1 : 0, d.companyName].join('|'); },
        lines: function (d, p) {
            var share = d.market && typeof d.market.share === 'number' ? d.market.share : 0;
            if (share <= 1) share = share * 100;
            return [
                t('office.ceo.company', { name: d.companyName || '-' }),
                t('office.ceo.rep', { n: Math.round((d.market && d.market.reputation) || 0) }),
                t('office.ceo.share', { n: (Math.round(share * 10) / 10) }),
                t('office.ceo.trophies', { n: trophyCount(d, p) })
            ];
        }
    },
    work: {
        state: function (d, p) { return { open: true, level: clamp(p.levels.hq || 1, 1, 4) }; },
        sig: function (d, p) {
            var s = sortedStaff(d), parts = [deskCapacity(p, s.length), d.companyName || '', 'o' + destOpenBits(d, p)];
            for (var i = 0; i < s.length && i < MAX_DESKS; i++) {
                parts.push(s[i].id + ':' + s[i].role + ':' + (s[i].skill || 1) + ':' + moraleTier(s[i].morale || 0));
            }
            return parts.join(',');
        },
        lines: function (d, p) {
            var s = d.staff || [], sum = 0;
            for (var i = 0; i < s.length; i++) sum += (s[i].morale || 0);
            var lines = [
                t('office.work.staff', { n: s.length, cap: deskCapacity(p, s.length) }),
                t('office.work.roles', { e: roleCount(d, 'engineer'), d: roleCount(d, 'designer'), m: roleCount(d, 'marketer') })
            ];
            if (s.length) lines.push(t('office.work.morale', { n: Math.round(sum / s.length) }));
            if (s.length > MAX_DESKS) lines.push(t('office.more', { n: s.length - MAX_DESKS }));
            return lines;
        },
        alert: function (d) {
            var n = lowMoraleCount(d);
            return n ? { lvl: n >= 3 ? 'bad' : 'warn', key: 'office.alert.morale', n: n } : null;
        }
    },
    lab: {
        state: function (d, p) {
            var act = len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active);
            var lv = p.levels.lab || 0;
            return { open: lv > 0 || act > 0, level: Math.max(1, lv), req: 'office.req.lab' };
        },
        sig: function (d) {
            var rp = activeResearchPct(d);
            return [len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active),
                    Math.min(12, len(d.research && d.research.completed)),
                    rp < 0 ? '-' : Math.floor(rp * 10)].join('|');
        },
        lines: function (d) {
            var n = len(d.research && d.research.active) + len(d.chipResearch && d.chipResearch.active);
            var lines = [
                t('office.lab.active', { n: n }),
                t('office.lab.done', { n: len(d.research && d.research.completed) + len(d.chipResearch && d.chipResearch.completed) })
            ];
            var rp = activeResearchPct(d);
            if (n && rp >= 0) lines.push(t('office.lab.progress', { n: Math.round(rp * 100) }));
            return lines;
        }
    },
    design: {
        state: function (d, p) {
            var pr = d.products || {};
            var open = roleCount(d, 'designer') > 0 || len(pr.catalog) > 0 || !!pr.designing || !!pr.development;
            return { open: open, level: clamp(1 + (roleCount(d, 'designer') >= 3 ? 1 : 0) + (roleCount(d, 'designer') >= 6 ? 1 : 0), 1, 3), req: 'office.req.design' };
        },
        sig: function (d) {
            var dev = d.products && d.products.development;
            var pf = devPhaseFrac(dev);
            return [dev ? dev.phase : '-', dev ? dev.id : '-', (d.products && d.products.designing) ? 1 : 0, roleCount(d, 'designer'),
                    pf < 0 ? '-' : Math.floor(pf * 20)].join('|');
        },
        lines: function (d) {
            var dev = d.products && d.products.development;
            var lines = [];
            if (dev) {
                lines.push(t('office.design.dev', { name: dev.name || '-', phase: t('office.phase.' + (dev.phase || 'design')) }));
                lines.push(t('office.design.progress', { n: devOverallPct(dev) }));
            } else lines.push(t('office.design.idle'));
            lines.push(t('office.design.designers', { n: roleCount(d, 'designer') }));
            return lines;
        }
    },
    server: {
        state: function (d, p) {
            var lv = p.levels.os || 0;
            return { open: lv > 0 || !!(d.os && d.os.developing), level: Math.max(1, lv), req: 'office.req.server' };
        },
        sig: function (d) {
            return [len(d.os && d.os.versions), Math.min(12, len(d.os && d.os.bugs)), (d.os && d.os.developing) ? 1 : 0].join('|');
        },
        lines: function (d) {
            var bugs = len(d.os && d.os.bugs);
            var lines = [t('office.server.versions', { n: len(d.os && d.os.versions) }),
                         bugs ? t('office.server.bugs', { n: bugs }) : t('office.server.nobugs')];
            if (d.os && d.os.developing) lines.push(t('office.server.dev'));
            return lines;
        },
        alert: function (d) {
            var n = len(d.os && d.os.bugs);
            return n ? { lvl: n >= 5 ? 'bad' : 'warn', key: 'office.alert.bugs', n: n } : null;
        }
    },
    chip: {
        state: function (d, p) {
            var f = d.fab || {};
            var open = !!f.built || !!f.upgrade || (p.levels.factory || 0) > 0 ||
                len(d.chips && d.chips.catalog) > 0 || len(d.chipResearch && d.chipResearch.completed) > 0;
            return { open: open, level: Math.max(1, p.levels.factory || 0), req: 'office.req.chip' };
        },
        sig: function (d) {
            var f = d.fab || {};
            var fp = fabProgress(d);
            return [f.built ? (f.level || 1) : 0, f.producing ? 1 : 0, moneyBucket(f.inventory || 0), len(d.chips && d.chips.catalog),
                    fp ? (Math.floor(fp.pct * 10) + ':' + (fp.target ? fp.target.level : 0) + ':' + (fp.isBuild ? 1 : 0)) : 'n'].join('|');
        },
        lines: function (d) {
            var f = d.fab || {};
            var lines = [f.built ? t('office.chip.fab', { n: f.level || 1 }) : t('office.chip.nofab'),
                         t('office.chip.designs', { n: len(d.chips && d.chips.catalog) })];
            if (f.built) lines.push(t('office.chip.inv', { n: Math.round(f.inventory || 0).toLocaleString('en-US') }));
            if (f.producing) lines.push(t('office.chip.producing'));
            var fp = fabProgress(d);
            if (fp) {
                lines.push(t(fp.isBuild ? 'office.chip.building' : 'office.chip.upgrading',
                    { name: fp.target ? fp.target.name : '-', pct: Math.round(fp.pct * 100) }));
                lines.push(t('office.chip.eta', { n: fp.daysLeft }));
            }
            return lines;
        }
    },
    showroom: {
        state: function (d, p) {
            return { open: len(d.products && d.products.catalog) > 0, level: Math.max(1, p.levels.store || 0), req: 'office.req.showroom' };
        },
        sig: function (d) {
            var cat = (d.products && d.products.catalog) || [], parts = [];
            for (var i = 0; i < cat.length; i++) parts.push(cat[i].id + ':' + (cat[i].status || '') + ':' + (cat[i].stock > 0 ? 1 : 0));
            return parts.join(',') + '|' + moneyBucket(totalStock(d));
        },
        lines: function (d) {
            var cat = (d.products && d.products.catalog) || [], sold = 0, selling = 0;
            for (var i = 0; i < cat.length; i++) { sold += (cat[i].totalSold || 0); if (cat[i].status === 'selling') selling++; }
            return [t('office.show.selling', { n: selling }),
                    t('office.show.stock', { n: Math.round(totalStock(d)).toLocaleString('en-US') }),
                    t('office.show.sold', { n: Math.round(sold).toLocaleString('en-US') })];
        },
        alert: function (d) {
            var cat = (d.products && d.products.catalog) || [], n = 0;
            for (var i = 0; i < cat.length; i++) if (cat[i].status === 'selling' && !(cat[i].stock > 0)) n++;
            return n ? { lvl: 'warn', key: 'office.alert.stock', n: n } : null;
        }
    },
    marketing: {
        state: function (d) {
            var m = roleCount(d, 'marketer'), c = len(d.marketing && d.marketing.activeCampaigns);
            return { open: m > 0 || c > 0, level: clamp(1 + (m >= 3 ? 1 : 0) + (m >= 6 ? 1 : 0), 1, 3), req: 'office.req.marketing' };
        },
        sig: function (d) { return [roleCount(d, 'marketer'), len(d.marketing && d.marketing.activeCampaigns)].join('|'); },
        lines: function (d) {
            return [t('office.mkt.campaigns', { n: len(d.marketing && d.marketing.activeCampaigns) }),
                    t('office.mkt.team', { n: roleCount(d, 'marketer') })];
        }
    },
    finance: {
        state: function () { return { open: true, level: 1 }; },
        sig: function (d) {
            return [moneyBucket(d.cash || 0), (d.cash || 0) < 0 ? 1 : 0, len(d.finance && d.finance.loans), len(d.stocks && d.stocks.portfolio)].join('|');
        },
        lines: function (d) {
            var debt = totalDebt(d);
            var lines = [t('office.fin.cash', { v: fmtMoney(d.cash || 0) }),
                         debt > 0 ? t('office.fin.debt', { v: fmtMoney(debt) }) : t('office.fin.nodebt')];
            var h = len(d.stocks && d.stocks.portfolio);
            if (h) lines.push(t('office.fin.holdings', { n: h }));
            return lines;
        },
        alert: function (d) {
            return (d.cash || 0) < 0 ? { lvl: 'bad', key: 'office.alert.cash', n: 1 } : null;
        }
    }
};

// bit buka/terkunci ruang tujuan jalan staf (supaya ruang Work dibangun ulang saat salah satunya terbuka)
function destOpenBits(d, p) {
    var out = '';
    ['ceo', 'lab', 'design', 'showroom', 'marketing'].forEach(function (id) {
        try { out += ROOM_LOGIC[id].state(d, p).open ? '1' : '0'; } catch (e) { out += '0'; }
    });
    return out;
}
export function totalStock(d) {
    var cat = (d.products && d.products.catalog) || [], s = 0;
    for (var i = 0; i < cat.length; i++) s += (cat[i].stock || 0);
    return s;
}
function totalDebt(d) {
    var l = (d.finance && d.finance.loans) || [], s = 0;
    for (var i = 0; i < l.length; i++) s += (l[i].remaining || 0);
    return s;
}
// ---------- Fab: progres & aksi (murni; dipakai kartu + adegan 3D) ----------
function fabTier(level) {
    for (var i = 0; i < FAB_LEVELS.length; i++) if (FAB_LEVELS[i].level === level) return FAB_LEVELS[i];
    return null;
}
function canPay(cost) {
    try { return !!WalletService.canAfford(cost); } catch (e) { return false; }
}
// -> null bila tidak ada konstruksi; selain itu { pct 0..1, daysLeft, target, isBuild }
export function fabProgress(d) {
    var u = d && d.fab && d.fab.upgrade;
    if (!u) return null;
    var dur = Math.max(1, u.durationDays || 1);
    var pct = clamp((u.progressDays || 0) / dur, 0, 1);
    return {
        pct: pct,
        daysLeft: Math.max(0, Math.ceil(dur - (u.progressDays || 0))),
        target: fabTier(u.targetLevel),
        isBuild: !!u.isBuild
    };
}
// Aksi Fab yang ditawarkan di kartu Lab Chip.
// -> { id:'fab-build'|'fab-upgrade', tier, disabled, noteKey } atau null (sedang konstruksi / sudah maksimal)
export function fabActionInfo(d) {
    var f = (d && d.fab) || {};
    if (f.upgrade) return null;
    var researched = !!(d.research && Array.isArray(d.research.completed) && d.research.completed.indexOf('fab_construction') >= 0);
    if (!f.built) {
        var t1 = fabTier(1);
        if (!t1) return null;
        var noteB = !researched ? 'office.act.fab.noresearch' : (!canPay(t1.cost) ? 'office.act.fab.poor' : null);
        return { id: 'fab-build', tier: t1, disabled: !!noteB, noteKey: noteB };
    }
    var next = fabTier((f.level || 1) + 1);
    if (!next) return null;
    var noteU = !canPay(next.cost) ? 'office.act.fab.poor' : null;
    return { id: 'fab-upgrade', tier: next, disabled: !!noteU, noteKey: noteU };
}
function fabCostLabel(c) { return fmtMoney(c); }
export function trophyCount(d, p) {
    var rep = (d.market && d.market.reputation) || 0;
    return clamp((p.levels.monument || 0) + (rep >= 50 ? 1 : 0), 0, 3);
}

// Peringatan ruangan (murni). null = aman.
export function roomAlert(id, data, plan) {
    var logic = ROOM_LOGIC[id];
    if (!logic || !logic.alert) return null;
    try { return logic.alert(data, plan); } catch (e) { return null; }
}

// Info untuk kartu (ruangan). Dipakai scene & bisa dites tanpa THREE.
export function describeRoom(id, data, plan) {
    var def = null, i;
    for (i = 0; i < ROOM_DEFS.length; i++) if (ROOM_DEFS[i].id === id) def = ROOM_DEFS[i];
    var logic = ROOM_LOGIC[id];
    if (!def || !logic) return null;
    var st = logic.state(data, plan);
    var al = st.open ? roomAlert(id, data, plan) : null;
    var lines = st.open ? logic.lines(data, plan) : [t(st.req || 'office.status.locked')];
    if (al) lines.push('⚠ ' + t(al.key, { n: al.n }));
    var actions = [];
    if (st.open && id === 'chip') {
        var fa = fabActionInfo(data);
        if (fa) {
            actions.push({
                id: fa.id,
                label: fa.id === 'fab-build'
                    ? t('office.act.fab.build', { name: fa.tier.name, v: fabCostLabel(fa.tier.cost) })
                    : t('office.act.fab.upgrade', { name: fa.tier.name, v: fabCostLabel(fa.tier.cost) }),
                note: fa.noteKey ? t(fa.noteKey) : t('office.act.fab.days', { n: fa.tier.durationDays }),
                disabled: fa.disabled
            });
        } else if ((data.fab && data.fab.built) && !(data.fab && data.fab.upgrade)) {
            lines.push(t('office.act.fab.max'));
        }
    }
    return {
        id: id,
        actions: actions,
        title: t('office.room.' + id),
        open: st.open,
        alert: al,
        badge: st.open ? t('office.status.level', { n: st.level }) : t('office.status.locked'),
        lines: lines,
        go: st.open ? { nav: def.go.nav, subtab: def.go.subtab, label: t('office.go.' + id) } : null,
        go2: (st.open && def.go2) ? { nav: def.go2.nav, subtab: def.go2.subtab, mode: def.go2.mode || null, label: t(def.go2.labelKey) } : null
    };
}

export function describeStaff(s) {
    var rd = roleDef(s.role), td = tierDef(s.skill || 1);
    var m = Math.round(s.morale || 0);
    var lines = [
        t('office.staff.sub', { role: rd ? rd.label : s.role, tier: td.label, m: m }),
        t('office.staff.salary', { v: fmtMoney(s.salary || 0) })
    ];
    var tr = [];
    if (Array.isArray(s.traits)) {
        for (var i = 0; i < s.traits.length; i++) { var td2 = traitDef(s.traits[i]); if (td2) tr.push(td2.label); }
    }
    if (tr.length) lines.push(t('office.staff.traits', { list: tr.join(', ') }));
    if (s.countryLabel) lines.push(t('office.staff.from', { c: (s.countryFlag ? s.countryFlag + ' ' : '') + s.countryLabel }));
    var maxTier = (s.skill || 1) >= 5;
    lines.push(maxTier ? t('office.staff.maxtier') : t('office.staff.skillprog', { n: Math.round(s.skillProgress || 0) }));
    if (m < 40) lines.push('⚠ ' + t('office.staff.lowmorale'));
    var actions = [];
    if (!maxTier) {
        var cost = (s.salary || 0) * 2;
        var poor = !canPay(cost);
        actions.push({
            id: 'train', staffId: s.id,
            label: t('office.act.train', { v: fmtMoney(cost) }),
            note: poor ? t('office.act.fab.poor') : t('office.act.train.note'),
            disabled: poor
        });
    }
    return {
        title: s.name || '-',
        badge: rd ? rd.label : String(s.role),
        lines: lines,
        actions: actions,
        staffId: s.id,
        go: { nav: 'team', subtab: 'team', staffId: s.id, label: t('office.btn.team') }
    };
}

