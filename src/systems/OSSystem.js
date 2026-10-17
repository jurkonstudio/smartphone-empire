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
    getOsFeatureById,
    getBuiltinAppById
} from '../data/os.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

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
        if (typeof data.os.licenseChoice === 'undefined') data.os.licenseChoice = null;
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

        const refundedCost = (d.cost || 0) - newCost;
        const refund = Math.max(0, Math.floor(refundedCost * (BALANCE.os.refundPercent || 0)));

        if (filtered.length === 0) {
            data.os.developing = null;
            if (refund > 0) this.state.addCash(refund);
            this.state.addLog('Pengembangan OS dibatalkan: fitur dasar kini dimiliki otomatis. Refund $' + refund.toLocaleString('en-US') + '.', LOG_TYPES.info);
        } else {
            d.features = filtered;
            d.cost = newCost;
            d.durationDays = newDays;
            if (refund > 0) this.state.addCash(refund);
            this.state.addLog('Fitur dasar kini dimiliki otomatis — dikeluarkan dari pengembangan. Refund $' + refund.toLocaleString('en-US') + '.', LOG_TYPES.info);
        }
        bus.emit('state:changed', data);
    }

    _onDayChanged(_snap) {
        const data = this.state.data;
        if (data.os.developing) this._tickDeveloping();
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

    _onMonthChanged(_snap) {
        const data = this.state.data;
        if (!this.hasFeature('fw_appstore')) return;

        const rep = data.market.reputation || 0;
        const cs = this.getCurrentStats();
        const stability = cs ? cs.stability : 50;

        const growth = Math.floor(DEV_TEMPLATES.baseGrowthPerMonth + rep * DEV_TEMPLATES.perReputationBonus + stability * DEV_TEMPLATES.perStabilityBonus);
        const capped = Math.min(DEV_TEMPLATES.maxApps - data.os.apps.thirdParty, growth);
        if (capped > 0) {
            data.os.apps.thirdParty += capped;
            if (capped >= 5) this.state.addLog(capped + ' aplikasi pihak ketiga baru ditambahkan.', LOG_TYPES.info);
        }
        bus.emit('state:changed', data);
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
            totalCost += f.devCost;
            totalDays += f.devDays;
        }
        if (data.cash < totalCost) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + totalCost.toLocaleString('en-US') + '.' };
        }
        this.state.setCash(data.cash - totalCost);

        const versionString = this._nextVersionString();
        data.os.developing = {
            versionString, features: ids, cost: totalCost, durationDays: totalDays,
            progressDays: 0, startedAtGameMinute: data.time.elapsedGameMinutes, lastProcessedMinute: data.time.elapsedGameMinutes
        };
        this.state.addLog('Mulai kembangkan OS ' + versionString + ' (' + ids.length + ' fitur, $' + totalCost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        bus.emit('os:version-started', { versionString, features: ids, cost: totalCost, durationDays: totalDays });
        bus.emit('state:changed', data);
        return { ok: true, versionString, cost: totalCost, durationDays: totalDays };
    }

    cancelVersion() {
        const data = this.state.data;
        const d = data.os.developing;
        if (!d) return { ok: false, reason: 'Tidak ada versi yang dikembangkan.' };
        const refund = Math.floor((d.cost || 0) * (BALANCE.os.refundPercent || 0));
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
        return v ? { ...v.stats } : null;
    }

    previewStats(featureIds) {
        const ids = Array.isArray(featureIds) ? featureIds.slice() : [];
        return this._calculateStats(ids);
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
        if (data.cash < bug.patchCost) return { ok: false, reason: 'Uang tidak cukup.' };

        this.state.setCash(data.cash - bug.patchCost);
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
        if (data.cash < app.devCost) return { ok: false, reason: 'Uang tidak cukup.' };

        this.state.setCash(data.cash - app.devCost);
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
            options.push({ id: 'own:' + v.id, source: 'own', label: (data.os.name || 'OS') + ' ' + v.versionString, stats: { ...v.stats }, costPerUnit: 0, versionId: v.id });
        });
        OS_LICENSES.forEach(lic => {
            if (data.time.currentYear < lic.availableFromYear) return;
            options.push({ id: 'license:' + lic.id, source: 'license', label: lic.name, stats: { ...lic.stats }, costPerUnit: lic.costPerUnit, licenseId: lic.id });
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
