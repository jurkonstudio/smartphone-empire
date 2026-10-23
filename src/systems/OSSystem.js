import { escapeHtml } from '../utils/html.js';
// FILE: src/systems/OSSystem.js
// v2028.35 — Context-Aware Bugs (Tahun & Fitur), lengkap & kompatibel dengan os.data.js baru.
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import { getNodeById } from '../data/research.data.js';
import {
    OS_FEATURES,
    OS_LICENSES,
    BUILTIN_APPS,
    DEV_TEMPLATES,
    BUG_TEMPLATES,
    OS_PLATFORM_TRACKS,
    getLicenseStatsAtYear,
    getOsFeatureById,
    getBuiltinAppById
} from '../data/os.data.js';
import { WalletService } from './WalletService.js';
import { computeOsAdoption, getEcosystemAppBonus, ADOPTION_CONFIG } from './OsAdoptionModel.js';
import { getUpdateBuildFee } from '../data/os-update-cards.data.js';
import { getOsFeatureCost } from './FutureEffects.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;


function _getStarterFeatureIds() {
    return OS_FEATURES.filter(function (f) { return f.starter === true; }).map(function (f) { return f.id; });
}

export class OSSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed',   (s) => this._onDayChanged(s)));
        this._unsubs.push(bus.on('time:month-changed', (s) => this._onMonthChanged(s)));
        this._unsubs.push(bus.on('state:hydrated',     () => this._onHydrated()));
        this._onHydrated();
        console.info('[OSSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const data = this.state.data;
        if (!Array.isArray(data.os.versions)) data.os.versions = [];
        if (!Array.isArray(data.os.bugs)) data.os.bugs = [];
        if (!data.os.apps) data.os.apps = { builtin: [], thirdParty: 0 };
        if (!Array.isArray(data.os.apps.builtin)) data.os.apps.builtin = [];
        if (typeof data.os.apps.thirdParty !== 'number') data.os.apps.thirdParty = 0;
        if (typeof data.os.appsAccumulator !== 'number') data.os.appsAccumulator = 0;
        if (!data.os.adoption || typeof data.os.adoption !== 'object') data.os.adoption = { history: [] };
        if (!Array.isArray(data.os.adoption.history)) data.os.adoption.history = [];
        if (typeof data.os.licenseChoice === 'undefined') data.os.licenseChoice = null;
        this._ensurePlatform();
        if (data.os.developing) {
            const d = data.os.developing;
            if (typeof d.progressDays !== 'number')        d.progressDays = 0;
            if (typeof d.durationDays !== 'number')        d.durationDays = 0;
            if (typeof d.lastProcessedMinute !== 'number') d.lastProcessedMinute = data.time.elapsedGameMinutes;
            if (typeof d.startedAtGameMinute !== 'number') d.startedAtGameMinute = data.time.elapsedGameMinutes;
        }
        this._migrateStarterInDeveloping(data);
    }

    _migrateStarterInDeveloping(data) {
        const d = data.os.developing;
        if (!d || !Array.isArray(d.features) || !d.features.length) return;
        const starterIds = _getStarterFeatureIds();
        if (!starterIds.length) return;

        const filtered = d.features.filter(function (id) { return starterIds.indexOf(id) === -1; });
        if (filtered.length === d.features.length) return;

        let newCost = 0, newDays = 0;
        filtered.forEach(function (id) {
            const f = getOsFeatureById(id);
            if (f) { newCost += f.devCost; newDays += f.devDays; }
        });

        const fee = d.buildFee || 0;
        const refundedCost = (d.cost || 0) - fee - newCost;
        const refund = Math.max(0, Math.floor(refundedCost * (BALANCE.os.refundPercent || 0)));

        if (filtered.length === 0) {
            data.os.developing = null;
            if (refund > 0) this.state.addCash(refund);
            this.state.addLog('Pengembangan OS dibatalkan: fitur dasar kini dimiliki otomatis. Refund $' + refund.toLocaleString('en-US') + '.', LOG_TYPES.info);
        } else {
            d.features = filtered;
            d.cost = newCost + fee;
            d.durationDays = newDays;
            if (refund > 0) this.state.addCash(refund);
            this.state.addLog('Fitur dasar kini dimiliki otomatis — dikeluarkan dari pengembangan. Refund $' + refund.toLocaleString('en-US') + '.', LOG_TYPES.info);
        }
        bus.emit('state:changed', data);
    }

    _onDayChanged(_snap) {
        const data = this.state.data;
        if (data.os.developing) this._tickDeveloping();
        this._tickPlatform();
        if (data.os.versions.length > 0) this._rollForBug();
        if (data.os.bugs.length) this._tickBugs();
    }

    _tickDeveloping() {
        const data = this.state.data;
        const d = data.os.developing;
        const currentMinute = data.time.elapsedGameMinutes;
        const last = (typeof d.lastProcessedMinute === 'number') ? d.lastProcessedMinute : d.startedAtGameMinute;
        const deltaMinutes = currentMinute - last;
        if (deltaMinutes <= 0) return;

        const speed = this._getSpeedMultiplier();
        d.progressDays += (deltaMinutes / MINUTES_PER_DAY) * speed;
        d.lastProcessedMinute = currentMinute;

        if (d.progressDays >= d.durationDays) {
            this._releaseVersion();
        } else {
            bus.emit('os:progress', {
                versionString: d.versionString,
                progressDays: d.progressDays,
                durationDays: d.durationDays,
                percent: d.durationDays > 0 ? Math.min(1, d.progressDays / d.durationDays) : 0,
                remainingDays: Math.max(0, (d.durationDays - d.progressDays) / speed)
            });
        }
    }

    _releaseVersion() {
        const data = this.state.data;
        const d = data.os.developing;
        if (!d) return;

        const stats = this._calculateStats(d.features);
        const versionEntry = {
            id: d.versionString,
            versionString: d.versionString,
            features: d.features.slice(),
            stats,
            devCost: d.cost,
            releasedAt: { year: data.time.currentYear, month: data.time.currentMonth, day: data.time.currentDay }
        };
        data.os.versions.push(versionEntry);
        data.os.currentVersionId = versionEntry.id;
        data.os.developing = null;

        if (data.os.versions.length === 1) {
            this.state.addMilestone('first_os', 'OS pertama dirilis: ' + (data.os.name || 'OS') + ' ' + d.versionString);
        }
        ToastService.success('OS ' + d.versionString + ' dirilis!');
        if (data.settings.vibrate) { try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (e) {} }
        this.state.addLog('OS ' + d.versionString + ' dirilis dengan ' + d.features.length + ' fitur.', LOG_TYPES.success);

        bus.emit('os:version-released', { versionString: d.versionString, stats, features: d.features.slice() });
        bus.emit('state:changed', data);
    }

    // ============================================================
    // [CONTEXT-AWARE BUGS] Filter Bug Berdasarkan Tahun & Fitur
    // ============================================================
    _rollForBug() {
        const data = this.state.data;
        const activeBugs = data.os.bugs.filter(b => b.status === 'active');
        if (activeBugs.length >= 3) return;

        const cs = this.getCurrentStats();
        const stability = cs ? cs.stability : 50;
        const baseChance = BALANCE.os.baseBugChancePerDay || 0.02;
        const chance = baseChance * ((100 - stability) / 100);

        if (Math.random() < chance) {
            const currentYear = data.time.currentYear;
            const currentVersion = this.getCurrentVersionObject();
            const currentFeatures = currentVersion ? currentVersion.features : [];

            // Saring bug: Hanya ambil yang sesuai zaman & fitur
            const validBugs = BUG_TEMPLATES.filter(bug => {
                const min = bug.minYear || 2000;
                const max = bug.maxYear || 9999;
                if (currentYear < min || currentYear > max) return false;
                
                if (bug.requiresFeature) {
                    const f = getOsFeatureById(bug.requiresFeature);
                    if (f && f.starter) return true;
                    if (currentFeatures.indexOf(bug.requiresFeature) === -1) return false;
                }
                return true;
            });

            if (validBugs.length > 0) {
                const randomBug = validBugs[Math.floor(Math.random() * validBugs.length)];
                this._spawnBug(randomBug);
            } else {
                if (BUG_TEMPLATES.length) this._spawnBug(BUG_TEMPLATES[0]); // Fallback bug dasar
            }
        }
    }

    _spawnBug(tpl) {
        const data = this.state.data;
        
        const bug = {
            id: 'bug_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            templateId: tpl.id, 
            name: tpl.name, 
            severity: tpl.severity,
            satisfactionHit: tpl.satisfactionHit, 
            reputationHit: tpl.reputationHit,
            patchCost: tpl.patchCost, 
            patchDays: tpl.patchDays,
            appearedAtGameMinute: data.time.elapsedGameMinutes,
            status: 'active', 
            patchCompleteAtMinute: null
        };
        
        data.os.bugs.push(bug);
        data.market.reputation = Math.max(0, (data.market.reputation || 0) - tpl.reputationHit);

        ToastService.warning('Bug muncul: ' + bug.name);
        this.state.addLog('Bug OS terdeteksi: ' + bug.name + ' (severity ' + bug.severity + ').', LOG_TYPES.warning);
        bus.emit('os:bug-appeared', { bug: { ...bug } });
        bus.emit('state:changed', data);
    }

    _tickBugs() {
        const data = this.state.data;
        const currentMinute = data.time.elapsedGameMinutes;
        for (const bug of data.os.bugs) {
            if (bug.status === 'patching' && bug.patchCompleteAtMinute !== null) {
                if (currentMinute >= bug.patchCompleteAtMinute) {
                    bug.status = 'fixed';
                    ToastService.success('Bug diperbaiki: ' + bug.name);
                    this.state.addLog('Bug diperbaiki: ' + bug.name + '.', LOG_TYPES.success);
                    bus.emit('os:bug-patched', { bugId: bug.id, name: bug.name });
                }
            }
        }
    }

    _onMonthChanged(snap) {
        const data = this.state.data;
        this._recordAdoptionSnapshot(snap);
        if (!this.hasFeature('fw_appstore')) return;

        const rep = data.market.reputation || 0;
        const cs = this.getCurrentStats();
        const stability = cs ? cs.stability : 50;

        // Pengguna aktif OS ikut menambah ekosistem aplikasi pihak ketiga.
        const adoption = computeOsAdoption(data);
        const ecoBonus = getEcosystemAppBonus(adoption.activeUsers);
        const growth = Math.floor(DEV_TEMPLATES.baseGrowthPerMonth + rep * DEV_TEMPLATES.perReputationBonus + stability * DEV_TEMPLATES.perStabilityBonus) + ecoBonus;
        const capped = Math.min(DEV_TEMPLATES.maxApps - data.os.apps.thirdParty, growth);
        if (capped > 0) {
            data.os.apps.thirdParty += capped;
            if (capped >= 5) this.state.addLog(capped + ' aplikasi pihak ketiga baru ditambahkan.', LOG_TYPES.info);
        }
        bus.emit('state:changed', data);
    }

    // ============================================================
    // ADOPSI / PENGGUNA OS
    // ============================================================
    getAdoption() {
        return computeOsAdoption(this.state.data);
    }

    _recordAdoptionSnapshot(snap) {
        const data = this.state.data;
        const h = data.os.adoption.history;
        const adoption = computeOsAdoption(data);
        if (!adoption.hasOs) return;
        const year = snap ? snap.currentYear : data.time.currentYear;
        const month = snap ? snap.currentMonth : data.time.currentMonth;
        h.push({ year: year, month: month, active: adoption.activeUsers, shipped: adoption.shippedUnits });
        if (h.length > ADOPTION_CONFIG.historyMax) h.splice(0, h.length - ADOPTION_CONFIG.historyMax);
    }

    _calculateStats(featureIds) {
        const merged = new Set(_getStarterFeatureIds());
        (featureIds || []).forEach(function (id) { merged.add(id); });

        const stats = { stability: 20, speed: 20, features: 20, security: 20, design: 20 };
        merged.forEach(function (fid) {
            const f = getOsFeatureById(fid);
            if (!f || !f.statEffects) return;
            stats.stability += f.statEffects.stability || 0;
            stats.speed     += f.statEffects.speed     || 0;
            stats.features  += f.statEffects.features  || 0;
            stats.security  += f.statEffects.security  || 0;
            stats.design    += f.statEffects.design    || 0;
        });

        const engBonus = Math.min(20, (this.state.data.team.engineers || 0) * 1);
        for (const k in stats) stats[k] += engBonus;

        const data = this.state.data;
        const prev = data.os.versions[data.os.versions.length - 1];
        if (prev && prev.stats) {
            for (const k in stats) stats[k] += Math.floor(prev.stats[k] * 0.3);
        }
        for (const k in stats) stats[k] = Math.max(0, Math.min(100, Math.round(stats[k])));
        return stats;
    }

    _getSpeedMultiplier() {
        const eng = this.state.data.team.engineers || 0;
        return Math.min(BALANCE.os.baseSpeed + eng * BALANCE.os.perEngineerSpeed, BALANCE.os.maxSpeedMultiplier);
    }

    _getMaxFeatureSlots() {
        const eng = this.state.data.team.engineers || 0;
        return Math.min(BALANCE.os.maxFeatureSlots, BALANCE.os.baseFeatureSlots + Math.floor(eng * BALANCE.os.perEngineerFeatureSlots));
    }

    _nextVersionString() {
        const versions = this.state.data.os.versions;
        if (!versions.length) return 'v1.0';
        const last = versions[versions.length - 1].versionString;
        const m = /^v(\d+)\.(\d+)$/.exec(last);
        if (!m) return 'v1.0';
        let major = parseInt(m[1], 10);
        let minor = parseInt(m[2], 10) + 1;
        if (minor > BALANCE.os.minorVersionMax) { minor = 0; major += 1; }
        return 'v' + major + '.' + minor;
    }

    createOs(name) {
        const data = this.state.data;
        if (data.os.name) return { ok: false, reason: 'OS sudah dibuat.' };
        const trimmed = (name || '').trim();
        if (!trimmed) return { ok: false, reason: 'Nama OS tidak boleh kosong.' };
        if (trimmed.length > 24) return { ok: false, reason: 'Nama maksimal 24 karakter.' };

        data.os.name = trimmed;
        data.os.createdAt = { year: data.time.currentYear, month: data.time.currentMonth, day: data.time.currentDay };
        this.state.addLog('OS "' + trimmed + '" dibuat.', LOG_TYPES.success);
        bus.emit('os:created', { name: trimmed });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    startVersion(featureIds) {
        const data = this.state.data;
        if (!data.os.name) return { ok: false, reason: 'Buat OS dulu.' };
        if (data.os.developing) return { ok: false, reason: 'Ada versi yang sedang dikembangkan.' };

        const ids = Array.isArray(featureIds) ? featureIds.slice() : [];
        if (!ids.length) return { ok: false, reason: 'Pilih minimal 1 fitur.' };
        const maxSlots = this._getMaxFeatureSlots();
        if (ids.length > maxSlots) return { ok: false, reason: 'Maks ' + maxSlots + ' fitur per versi.' };

        let totalCost = 0, totalDays = 0;
        for (const fid of ids) {
            const st = this.getFeatureStatus(fid);
            if (st.status !== 'available') return { ok: false, reason: 'Fitur tidak tersedia: ' + (st.reason || fid) };
            const f = getOsFeatureById(fid);
            totalCost += getOsFeatureCost(f, data);
            totalDays += f.devDays;
        }
        const buildFee = getUpdateBuildFee(ids, data.time.currentYear);
        const grandTotal = totalCost + buildFee;
        if (!WalletService.canAfford(grandTotal)) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + grandTotal.toLocaleString('en-US') + '.' };
        }
        WalletService.pay(grandTotal, 'os-dev');

        const versionString = this._nextVersionString();
        data.os.developing = {
            versionString, features: ids, cost: grandTotal, buildFee: buildFee, durationDays: totalDays,
            progressDays: 0, startedAtGameMinute: data.time.elapsedGameMinutes, lastProcessedMinute: data.time.elapsedGameMinutes
        };
        this.state.addLog('Mulai kembangkan OS ' + versionString + ' (' + ids.length + ' fitur, $' + totalCost.toLocaleString('en-US') + ' + biaya rilis $' + buildFee.toLocaleString('en-US') + ').', LOG_TYPES.info);
        bus.emit('os:version-started', { versionString, features: ids, cost: grandTotal, buildFee: buildFee, durationDays: totalDays });
        bus.emit('state:changed', data);
        return { ok: true, versionString, cost: grandTotal, buildFee: buildFee, durationDays: totalDays };
    }

    cancelVersion() {
        const data = this.state.data;
        const d = data.os.developing;
        if (!d) return { ok: false, reason: 'Tidak ada versi yang dikembangkan.' };
        const refund = Math.floor(Math.max(0, (d.cost || 0) - (d.buildFee || 0)) * (BALANCE.os.refundPercent || 0));
        if (refund > 0) this.state.addCash(refund);
        data.os.developing = null;
        this.state.addLog('Pengembangan OS dibatalkan (refund $' + refund.toLocaleString('en-US') + ').', LOG_TYPES.warning);
        bus.emit('os:version-cancelled', { refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    boostResearch(nodeId, days) {
        const data = this.state.data;
        const d = data.os.developing;
        if (!d || d.versionString !== nodeId) return { ok: false, reason: 'Pengembangan tidak ditemukan.' };
        
        const add = (days === Infinity) ? (d.durationDays - d.progressDays) : Math.max(0, days || 0);
        d.progressDays = Math.min(d.durationDays, d.progressDays + add);
        
        if (d.progressDays >= d.durationDays) {
            this._releaseVersion();
            return { ok: true, completed: true };
        }
        bus.emit('state:changed', data);
        return { ok: true, completed: false };
    }

    finishResearch(nodeId) {
        return this.boostResearch(nodeId, Infinity);
    }

    getCurrentStats() {
        const v = this.getCurrentVersionObject();
        return v ? this.getEffectiveStats(v) : null;
    }

    previewStats(featureIds) {
        const ids = Array.isArray(featureIds) ? featureIds.slice() : [];
        return this._applyPlatformBonus(this._calculateStats(ids));
    }

    // Pratinjau biaya build (dipakai panel Rancang Update). Tidak mengubah state.
    previewUpdate(featureIds) {
        const ids = Array.isArray(featureIds) ? featureIds.slice() : [];
        let featureCost = 0, days = 0;
        ids.forEach(fid => { const f = getOsFeatureById(fid); if (f) { featureCost += getOsFeatureCost(f, this.state.data); days += f.devDays; } });
        const buildFee = ids.length ? getUpdateBuildFee(ids, this.state.data.time.currentYear) : 0;
        return { featureCost, buildFee, total: featureCost + buildFee, days, stats: this.previewStats(ids) };
    }

    getAvailableFeatures() {
        return OS_FEATURES.filter(f => this.getFeatureStatus(f.id).status === 'available');
    }

    getFeatureStatus(featureId) {
        const data = this.state.data;
        const f = getOsFeatureById(featureId);
        if (!f) return { status: 'locked', reason: 'Fitur tidak ditemukan.' };

        if (f.starter === true) return { status: 'owned', reason: null };

        const currentVersion = this.getCurrentVersionObject();
        if (currentVersion && currentVersion.features.includes(featureId)) return { status: 'owned', reason: null };
        if (data.os.developing && data.os.developing.features.includes(featureId)) return { status: 'developing', reason: null };
        if (data.time.currentYear < f.minYear) return { status: 'locked', reason: 'Tersedia tahun ' + f.minYear };

        const missingFeatures = (f.requiresFeatures || []).filter(rf => !this.hasFeature(rf));
        if (missingFeatures.length) {
            const names = missingFeatures.map(rf => (getOsFeatureById(rf) || {}).name || rf);
            return { status: 'locked', reason: 'Butuh fitur: ' + names.join(', ') };
        }

        const missingResearch = (f.requiresResearch || []).filter(rId => !(data.research && data.research.completed || []).includes(rId));
        if (missingResearch.length) {
            const names = missingResearch.map(rId => {
                const node = getNodeById(rId);
                return node ? node.name : rId;
            });
            return { status: 'locked', reason: 'Butuh riset: ' + names.join(', '), missingResearch: missingResearch };
        }

        return { status: 'available', reason: null };
    }

    getCurrentVersionObject() {
        const data = this.state.data;
        if (!data.os.versions.length) return null;
        const id = data.os.currentVersionId || data.os.versions[data.os.versions.length - 1].id;
        return data.os.versions.find(x => x.id === id) || null;
    }

    hasFeature(featureId) {
        if (!featureId) return false;
        const f = getOsFeatureById(featureId);
        if (f && f.starter === true) return true;
        const v = this.getCurrentVersionObject();
        return v ? v.features.includes(featureId) : false;
    }

    patchBug(bugId) {
        const data = this.state.data;
        const bug = data.os.bugs.find(b => b.id === bugId);
        if (!bug) return { ok: false, reason: 'Bug tidak ditemukan.' };
        if (bug.status !== 'active') return { ok: false, reason: 'Bug tidak aktif.' };
        if (!WalletService.canAfford(bug.patchCost)) return { ok: false, reason: 'Uang tidak cukup.' };

        WalletService.pay(bug.patchCost, 'os-patch');
        bug.status = 'patching';
        bug.patchCompleteAtMinute = data.time.elapsedGameMinutes + bug.patchDays * MINUTES_PER_DAY;

        this.state.addLog('Mulai patch: ' + bug.name + ' ($' + bug.patchCost.toLocaleString('en-US') + ', ' + bug.patchDays + ' hari).', LOG_TYPES.info);
        bus.emit('os:bug-patching', { bugId: bug.id, name: bug.name });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    ignoreBug(bugId) {
        const data = this.state.data;
        const bug = data.os.bugs.find(b => b.id === bugId);
        if (!bug) return { ok: false, reason: 'Bug tidak ditemukan.' };
        if (bug.status !== 'active') return { ok: false, reason: 'Bug tidak aktif.' };
        bug.status = 'ignored';
        data.market.reputation = Math.max(0, (data.market.reputation || 0) - bug.reputationHit * 2);
        this.state.addLog('Bug diabaikan: ' + bug.name + '. Reputasi turun.', LOG_TYPES.warning);
        bus.emit('os:bug-ignored', { bugId: bug.id, name: bug.name });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    startApp(appId) {
        const data = this.state.data;
        const app = getBuiltinAppById(appId);
        if (!app) return { ok: false, reason: 'Aplikasi tidak ditemukan.' };
        if (data.os.apps.builtin.includes(appId)) return { ok: false, reason: 'Sudah dibuat.' };
        if (app.requiresFeature && !this.hasFeature(app.requiresFeature)) {
            return { ok: false, reason: 'Butuh fitur OS: ' + app.requiresFeature };
        }
        if (!WalletService.canAfford(app.devCost)) return { ok: false, reason: 'Uang tidak cukup.' };

        WalletService.pay(app.devCost, 'os-app');
        data.os.apps.builtin.push(appId);
        this.state.addLog('Aplikasi dirilis: ' + app.name + '.', LOG_TYPES.success);
        bus.emit('os:app-released', { appId, name: app.name, appealBonus: app.appealBonus });
        bus.emit('state:changed', data);
        return { ok: true };
    }

    inviteDevelopers() {
        const data = this.state.data;
        if (!this.hasFeature('fw_appstore')) return { ok: false, reason: 'Fitur App Store belum dimiliki.' };
        const rep = data.market.reputation || 0;
        const bonus = Math.floor(5 + rep * 0.5);
        data.os.apps.thirdParty += bonus;
        this.state.addLog('Kampanye developer: +' + bonus + ' aplikasi.', LOG_TYPES.info);
        bus.emit('state:changed', data);
        return { ok: true, bonus };
    }

    getOsOptionsForPhone() {
        const data = this.state.data;
        const options = [];
        data.os.versions.forEach(v => {
            options.push({ id: 'own:' + v.id, source: 'own', label: (data.os.name || 'OS') + ' ' + v.versionString, stats: this.getEffectiveStats(v), costPerUnit: 0, versionId: v.id });
        });
        OS_LICENSES.forEach(lic => {
            if (data.time.currentYear < lic.availableFromYear) return;
            options.push({ id: 'license:' + lic.id, source: 'license', label: lic.name, stats: getLicenseStatsAtYear(lic, data.time.currentYear), costPerUnit: lic.costPerUnit, licenseId: lic.id });
        });
        return options;
    }

    applyUpdateToPhones(versionId) {
        const data = this.state.data;
        const v = data.os.versions.find(x => x.id === versionId);
        if (!v) return { ok: false, reason: 'Versi tidak ditemukan.' };
        bus.emit('os:updated', { versionId, versionString: v.versionString });
        return { ok: true };
    }


    // ============================================================
    // R&D PLATFORM OS (v2028.36) — level yang naik terus-menerus
    // Bonus platform bersifat DINAMIS: berlaku ke semua versi OS buatan
    // sendiri (seperti update OTA), tanpa harus merilis versi baru.
    // ============================================================
    _ensurePlatform() {
        const os = this.state.data.os;
        if (!os.platform || typeof os.platform !== 'object') os.platform = {};
        if (!os.platform.levels || typeof os.platform.levels !== 'object') os.platform.levels = {};
        OS_PLATFORM_TRACKS.forEach(t => { if (typeof os.platform.levels[t.id] !== 'number') os.platform.levels[t.id] = 0; });
        if (typeof os.platform.totalUpgrades !== 'number') os.platform.totalUpgrades = 0;
        if (typeof os.platform.developing === 'undefined') os.platform.developing = null;
        const d = os.platform.developing;
        if (d) {
            if (typeof d.progressDays !== 'number') d.progressDays = 0;
            if (typeof d.lastProcessedMinute !== 'number') d.lastProcessedMinute = this.state.data.time.elapsedGameMinutes;
        }
    }

    getPlatformLevels() { this._ensurePlatform(); return Object.assign({}, this.state.data.os.platform.levels); }

    getPlatformBonus() {
        this._ensurePlatform();
        const per = BALANCE.rnd.os.statPerLevel;
        const lv = this.state.data.os.platform.levels;
        const out = {};
        OS_PLATFORM_TRACKS.forEach(t => { out[t.id] = (lv[t.id] || 0) * per; });
        return out;
    }

    _applyPlatformBonus(stats) {
        const bonus = this.getPlatformBonus();
        const out = {};
        for (const k in stats) out[k] = Math.max(0, Math.min(100, Math.round(stats[k] + (bonus[k] || 0))));
        return out;
    }

    // Stat efektif sebuah versi = stat rilis + bonus R&D platform saat ini.
    getEffectiveStats(version) {
        if (!version || !version.stats) return null;
        return this._applyPlatformBonus(version.stats);
    }

    getPlatformInfo(statId) {
        this._ensurePlatform();
        const data = this.state.data;
        const cfg = BALANCE.rnd.os;
        const track = OS_PLATFORM_TRACKS.find(t => t.id === statId);
        const level = data.os.platform.levels[statId] || 0;
        const year = data.time.currentYear;
        const v = this.getCurrentVersionObject();

        let featureCount = 0;
        if (v) {
            const set = new Set(_getStarterFeatureIds());
            (v.features || []).forEach(f => set.add(f));
            featureCount = set.size;
        }
        const capFeat = cfg.capBase + cfg.capPerFeature * featureCount;
        const capYear = Math.floor(Math.max(0, year - 2000) * BALANCE.rnd.capYearPerYear) + BALANCE.rnd.capYearBase;
        const cap = Math.min(cfg.maxLevel, capFeat, capYear);

        const cost = Math.round(cfg.baseCost * Math.pow(cfg.costGrowth, level) * (1 + cfg.yearCostInflation * Math.max(0, year - 2000)) / 100) * 100;
        const days = Math.min(cfg.maxDays, Math.round(cfg.baseDays * Math.pow(cfg.daysGrowth, level)));

        const dev = data.os.platform.developing;
        const running = dev && dev.statId === statId ? dev : null;
        let status = 'available', reason = null, blocker = null;
        if (!v) { status = 'locked'; blocker = 'version'; reason = 'Rilis versi OS pertama dulu'; }
        else if (running) status = 'running';
        else if (dev) { status = 'locked'; blocker = 'slots'; reason = 'R&D platform lain sedang berjalan'; }
        else if (level >= cfg.maxLevel) { status = 'maxed'; reason = 'Level maksimum'; }
        else if (level >= cap) {
            status = 'capped';
            if (level >= capFeat && capFeat <= capYear) { blocker = 'feature'; reason = 'Kembangkan lebih banyak fitur OS untuk level lebih tinggi'; }
            else { blocker = 'year'; reason = 'Tunggu kemajuan zaman untuk level berikutnya'; }
        }
        else if (!WalletService.canAfford(cost)) { status = 'locked'; blocker = 'cash'; reason = 'Uang tidak cukup ($' + cost.toLocaleString('en-US') + ')'; }

        const speed = this._getSpeedMultiplier();
        return {
            id: statId, name: track ? track.name : statId, hint: track ? track.hint : '',
            level, cap, maxLevel: cfg.maxLevel, cost, days, etaDays: Math.ceil(days / Math.max(0.01, speed)),
            bonus: level * cfg.statPerLevel, nextBonus: (level + 1) * cfg.statPerLevel,
            status, reason, blocker, running
        };
    }

    startPlatformUpgrade(statId) {
        this._ensurePlatform();
        const data = this.state.data;
        if (!OS_PLATFORM_TRACKS.some(t => t.id === statId)) return { ok: false, reason: 'Jalur tidak ditemukan.' };
        const info = this.getPlatformInfo(statId);
        if (info.status !== 'available') return { ok: false, reason: info.reason || 'Belum bisa dimulai.' };

        WalletService.pay(info.cost, 'os-dev');
        data.os.platform.developing = {
            statId, name: info.name + ' Lv ' + (info.level + 1), targetLevel: info.level + 1,
            cost: info.cost, durationDays: info.days, progressDays: 0,
            startedAtGameMinute: data.time.elapsedGameMinutes, lastProcessedMinute: data.time.elapsedGameMinutes
        };
        this.state.addLog('Mulai R&D platform OS: ' + data.os.platform.developing.name + ' ($' + info.cost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        bus.emit('os:platform-started', { statId, targetLevel: info.level + 1 });
        bus.emit('state:changed', data);
        return { ok: true, cost: info.cost, days: info.days };
    }

    cancelPlatformUpgrade() {
        this._ensurePlatform();
        const data = this.state.data;
        const d = data.os.platform.developing;
        if (!d) return { ok: false, reason: 'Tidak ada R&D platform berjalan.' };
        const refund = Math.floor((d.cost || 0) * (BALANCE.os.refundPercent || 0));
        if (refund > 0) this.state.addCash(refund);
        data.os.platform.developing = null;
        this.state.addLog('R&D platform dibatalkan (refund $' + refund.toLocaleString('en-US') + ').', LOG_TYPES.warning);
        bus.emit('os:platform-cancelled', { refund });
        bus.emit('state:changed', data);
        return { ok: true, refund };
    }

    boostPlatform(days) {
        this._ensurePlatform();
        const d = this.state.data.os.platform.developing;
        if (!d) return { ok: false, reason: 'Tidak ada R&D platform berjalan.' };
        const add = (days === Infinity) ? (d.durationDays - d.progressDays) : Math.max(0, days || 0);
        d.progressDays = Math.min(d.durationDays, d.progressDays + add);
        if (d.progressDays >= d.durationDays) { this._completePlatform(); return { ok: true, completed: true }; }
        bus.emit('state:changed', this.state.data);
        return { ok: true, completed: false };
    }

    _tickPlatform() {
        const data = this.state.data;
        this._ensurePlatform();
        const d = data.os.platform.developing;
        if (!d) return;
        const cur = data.time.elapsedGameMinutes;
        const delta = cur - d.lastProcessedMinute;
        if (delta <= 0) return;
        const speed = this._getSpeedMultiplier();
        d.progressDays += (delta / MINUTES_PER_DAY) * speed;
        d.lastProcessedMinute = cur;
        if (d.progressDays >= d.durationDays) { this._completePlatform(); return; }
        bus.emit('os:platform-progress', {
            statId: d.statId,
            percent: d.durationDays > 0 ? Math.min(1, d.progressDays / d.durationDays) : 0,
            remainingDays: Math.max(0, (d.durationDays - d.progressDays) / speed)
        });
    }

    _completePlatform() {
        const data = this.state.data;
        const d = data.os.platform.developing;
        if (!d) return;
        data.os.platform.levels[d.statId] = Math.max(data.os.platform.levels[d.statId] || 0, d.targetLevel);
        data.os.platform.totalUpgrades = (data.os.platform.totalUpgrades || 0) + 1;
        data.os.platform.developing = null;

        // Pemicu pasar: OS yang membaik menaikkan gaung & reputasi.
        const bz = BALANCE.rnd.buzz;
        const rs = (typeof window !== 'undefined' && window.__game) ? window.__game.research : null;
        if (rs && typeof rs.addBuzz === 'function') rs.addBuzz(bz.osPlatformBase + d.targetLevel * bz.osPlatformPerLevel, 'os-platform');
        if (typeof this.state.addReputation === 'function') this.state.addReputation(bz.reputationPerLevel * Math.max(1, d.targetLevel / 4));

        ToastService.success('R&D OS selesai: ' + d.name);
        this.state.addLog('R&D platform OS selesai: ' + d.name + '. Semua ponsel ber-OS ' + (data.os.name || 'sendiri') + ' ikut membaik lewat update.', LOG_TYPES.success);
        bus.emit('os:platform-done', { statId: d.statId, level: d.targetLevel });
        bus.emit('state:changed', data);
    }

    escapeHtml(s) { return escapeHtml(s); }

    spawnBug() { 
        // Menggunakan bug pertama sebagai default untuk cheat
        if (!BUG_TEMPLATES.length) return { ok: false, total: this.state.data.os.bugs.length };
        this._spawnBug(BUG_TEMPLATES[0]);
        return { ok: true, total: this.state.data.os.bugs.length };
    }

    quickSetup(featuresList) {
        const data = this.state.data;
        if (!data.os.name) this.createOs('CheatOS');
        const ids = featuresList || ['fw_j2me', 'fw_poly_ringtone'];
        const versionString = this._nextVersionString();
        const stats = this._calculateStats(ids);
        data.os.versions.push({
            id: versionString, versionString, features: ids, stats, devCost: 0,
            releasedAt: { year: data.time.currentYear, month: data.time.currentMonth, day: data.time.currentDay }
        });
        data.os.currentVersionId = versionString;
        this.state.addLog('(cheat) OS ' + versionString + ' dirilis.', LOG_TYPES.info);
        bus.emit('state:changed', data);
        return { ok: true, versionString, stats };
    }
}
