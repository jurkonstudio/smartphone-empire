// FILE: src/systems/TeamSystem.js
// v2027.7a — generate kandidat dengan profil lengkap (country, specialty, exp, age, background).
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { BALANCE } from '../data/balance.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { ToastService } from '../core/ToastService.js';
import { LOG_TYPES } from '../config/constants.js';
import {
    ROLES,
    getRoleById,
    getSkillTier,
    getTraitById,
    getCountryById,
    pickRegionForYear,
    generateNameForRegion,
    generateRandomName,
    pickSpecialty,
    pickBackground,
    rollExperience,
    rollAge,
    rollTraits
} from '../data/staff.data.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;

export class TeamSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:day-changed',   () => this._tickDailySkill()));
        this._unsubs.push(bus.on('time:month-changed', () => this._tickMonthly()));
        this._unsubs.push(bus.on('state:hydrated',     () => this._onHydrated()));

        if (!this.state.data.candidates.length) {
            this.refreshCandidates();
        }
        this.state.syncTeamCounters();
        console.info('[TeamSystem] siap. Staff aktif:', this.state.data.staff.length);
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onHydrated() {
        const data = this.state.data;
        if (!Array.isArray(data.candidates)) data.candidates = [];
        if (!data.candidates.length) this.refreshCandidates();
        this.state.syncTeamCounters();
    }

    // ============ DAILY: SKILL PROGRESSION ============
    _tickDailySkill() {
        const data = this.state.data;
        if (!data.staff.length) return;

        const mentorCount = data.staff.filter(s =>
            s.traits && s.traits.includes('mentor')
        ).length;

        const cfg = BALANCE.team || {};
        const base = cfg.skillProgressPerMonth || 1.5;
        const perDay = base / 30;
        const fastBonus = cfg.skillFastLearnerBonus || 0.5;
        const mentorBonus = cfg.skillMentorBonus || 0.25;

        let changed = false;
        for (const s of data.staff) {
            if (s.skill >= 5) continue;
            let progress = perDay;
            if (s.traits && s.traits.includes('fast_learner')) progress *= (1 + fastBonus);
            if (mentorCount > 0 && (!s.traits || !s.traits.includes('mentor'))) progress *= (1 + mentorBonus);
            s.skillProgress = (s.skillProgress || 0) + progress;
            changed = true;
            while (s.skillProgress >= 100 && s.skill < 5) {
                s.skillProgress -= 100;
                s.skill += 1;
                this._onSkillUp(s);
            }
            if (s.skill >= 5) s.skillProgress = 0;
        }
        if (changed) bus.emit('state:changed', data);
    }

    _onSkillUp(staff) {
        const roleBase = (BALANCE.salary && BALANCE.salary[staff.role]) || 2500;
        const skillDef = getSkillTier(staff.skill);
        const traitMult = this._traitSalaryMultiplier(staff.traits);
        staff.salary = Math.round(roleBase * skillDef.salaryMult * traitMult);

        const label = skillDef ? skillDef.label : ('Tier ' + staff.skill);
        this.state.addLog(staff.name + ' naik ke ' + label + '.', LOG_TYPES.success);
        ToastService.success('⬆ ' + staff.name + ' → ' + label);
        bus.emit('team:skill-up', { staffId: staff.id, skill: staff.skill });
    }

    _traitSalaryMultiplier(traits) {
        if (!traits || !traits.length) return 1.0;
        const table = (BALANCE.team && BALANCE.team.traitSalaryBonus) || {};
        let mult = 1.0;
        traits.forEach(tid => {
            if (table[tid]) mult += table[tid];
        });
        return Math.max(0.8, mult);
    }

    // ============ MONTHLY: MORALE + POOL REFRESH ============
    _tickMonthly() {
        const data = this.state.data;
        const cfg = BALANCE.team || {};

        let moraleChanged = false;
        for (const s of data.staff) {
            const isLoyal = s.traits && s.traits.includes('loyal');
            const decay = isLoyal ? 0.5 : (cfg.moraleDecayPerMonth || 2);
            s.morale = Math.max(cfg.moraleMin || 0, (s.morale || 75) - decay);
            moraleChanged = true;
        }
        if (moraleChanged) bus.emit('state:changed', data);

        const now = data.time.elapsedGameMinutes;
        const last = (data.candidatePool && data.candidatePool.lastRefreshMinute) || 0;
        const interval = (cfg.poolRefreshDays || 30) * MINUTES_PER_DAY;
        if (now - last >= interval || !data.candidates.length) {
            this.refreshCandidates();
        }
    }

    // ============ CANDIDATES ============
    refreshCandidates() {
        const data = this.state.data;
        if (!data.candidatePool) {
            data.candidatePool = { lastRefreshMinute: 0, lastRefreshMonth: null };
        }
        const cfg = BALANCE.team || {};
        const size = cfg.candidatePoolSize || 6;
        const year = data.time.currentYear;

        const list = [];
        for (let i = 0; i < size; i++) {
            list.push(this._generateCandidate(year, i));
        }
        data.candidates = list;
        data.candidatePool.lastRefreshMinute = data.time.elapsedGameMinutes;
        data.candidatePool.lastRefreshMonth = {
            year: data.time.currentYear,
            month: data.time.currentMonth
        };
        bus.emit('team:candidates-refreshed', { count: list.length });
        bus.emit('state:changed', data);
        return list;
    }

    _generateCandidate(year, idx) {
        // [v2027.7a] Profil lengkap: region, specialty, experience, age, background.
        const region = pickRegionForYear(year);
        const countryInfo = getCountryById(region);
        const name = generateNameForRegion(region);

        const role = ROLES[Math.floor(Math.random() * ROLES.length)];
        const skill = this._rollSkill(year);
        const traits = rollTraits();
        const specialty = pickSpecialty(role.id);
        const yearsExperience = rollExperience(skill);
        const age = rollAge(skill, yearsExperience);
        const background = pickBackground();

        const skillDef = getSkillTier(skill);
        const roleBase = (BALANCE.salary && BALANCE.salary[role.id]) || 2500;
        const traitMult = this._traitSalaryMultiplier(traits);
        const salary = Math.round(roleBase * skillDef.salaryMult * traitMult);

        const signingMult = (BALANCE.team && BALANCE.team.signingBonusMult) || 0.6;
        const signingBonus = Math.round(salary * signingMult * 3);
        const roleRecruitCost = (BALANCE.recruitCost && BALANCE.recruitCost[role.id]) || 2000;
        const totalCost = roleRecruitCost + signingBonus;

        return {
            id: 'cand_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random() * 1000),
            name: name,
            country: region,
            countryLabel: countryInfo.label,
            countryFlag: countryInfo.flag,
            role: role.id,
            skill: skill,
            specialty: specialty,
            yearsExperience: yearsExperience,
            age: age,
            background: background,
            traits: traits,
            salary: salary,
            signingBonus: signingBonus,
            totalCost: totalCost,
            generatedAtMinute: this.state.data.time.elapsedGameMinutes
        };
    }

    _rollSkill(year) {
        const cfg = BALANCE.team || {};
        const weights = cfg.skillWeightsByYear || {};
        let w;
        if (year <= 2005) w = weights.early;
        else if (year <= 2015) w = weights.mid;
        else if (year <= 2025) w = weights.late;
        else w = weights.modern;
        if (!w) w = { 1: 0.5, 2: 0.3, 3: 0.15, 4: 0.04, 5: 0.01 };

        const roll = Math.random();
        let cum = 0;
        for (let t = 1; t <= 5; t++) {
            cum += w[t] || 0;
            if (roll < cum) return t;
        }
        return 1;
    }

    // ============ HIRE ============
    hireCandidate(candidateId) {
        const data = this.state.data;
        const cand = data.candidates.find(c => c.id === candidateId);
        if (!cand) return { ok: false, reason: 'Kandidat tidak ditemukan.' };

        const counts = this.getTeamCounts();
        const cap = (BALANCE.teamCap && BALANCE.teamCap[cand.role]) || 20;
        const cur = cand.role === 'engineer' ? counts.engineers
                  : cand.role === 'designer' ? counts.designers
                  : counts.marketers;
        if (cur >= cap) {
            return { ok: false, reason: 'Kapasitas ' + cand.role + ' penuh (maks ' + cap + ').' };
        }

        const roleRecruitCost = (BALANCE.recruitCost && BALANCE.recruitCost[cand.role]) || 2000;
        const signingMult = (BALANCE.team && BALANCE.team.signingBonusMult) || 0.6;
        const signingBonus = cand.signingBonus != null
            ? cand.signingBonus
            : Math.round(cand.salary * signingMult * 3);
        const totalCost = cand.totalCost != null
            ? cand.totalCost
            : (roleRecruitCost + signingBonus);

        if (data.cash < totalCost) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + totalCost.toLocaleString('en-US') + '.' };
        }

        this.state.setCash(data.cash - totalCost);

        const newStaff = {
            id: 'staff_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: cand.name,
            country: cand.country || null,
            countryLabel: cand.countryLabel || null,
            countryFlag: cand.countryFlag || null,
            role: cand.role,
            skill: cand.skill,
            specialty: cand.specialty || null,
            yearsExperience: cand.yearsExperience || 0,
            age: cand.age || null,
            background: cand.background || null,
            salary: cand.salary,
            morale: (BALANCE.team && BALANCE.team.moraleStart) || 75,
            traits: Array.isArray(cand.traits) ? cand.traits.slice() : [],
            skillProgress: 0,
            hireDate: {
                year: data.time.currentYear,
                month: data.time.currentMonth,
                day: data.time.currentDay
            },
            hireGameMinute: data.time.elapsedGameMinutes,
            hireCost: totalCost
        };

        data.staff.push(newStaff);
        data.candidates = data.candidates.filter(c => c.id !== candidateId);
        this.state.syncTeamCounters();

        const roleLabel = getRoleById(cand.role).label;
        this.state.addLog(cand.name + ' direkrut sebagai ' + roleLabel + ' ($' + cand.salary.toLocaleString('en-US') + '/bln).', LOG_TYPES.success);
        ToastService.success('🎉 ' + cand.name + ' bergabung!');
        if (data.settings.vibrate) { try { if (navigator.vibrate) navigator.vibrate([20, 40, 20]); } catch (e) {} }

        bus.emit('team:recruited', { staff: newStaff, cost: totalCost });
        bus.emit('tutorial:action', { id: 'action:recruit' });
        bus.emit('state:changed', data);

        return { ok: true, staff: newStaff, cost: totalCost };
    }

    // ============ FIRE ============
    fireStaff(staffId) {
        const data = this.state.data;
        const idx = data.staff.findIndex(s => s.id === staffId);
        if (idx < 0) return { ok: false, reason: 'Staff tidak ditemukan.' };

        const staff = data.staff[idx];
        const severanceMonths = (BALANCE.team && BALANCE.team.severanceMonths) || 2;
        const severance = staff.salary * severanceMonths;

        data.staff.forEach(s => {
            if (s.id !== staffId) s.morale = Math.max(0, (s.morale || 75) - 5);
        });

        this.state.setCash(data.cash - severance);
        data.staff.splice(idx, 1);
        this.state.syncTeamCounters();

        this.state.addLog(staff.name + ' di-PHK. Pesangon $' + severance.toLocaleString('en-US') + '.', LOG_TYPES.warning);
        ToastService.info(staff.name + ' telah di-PHK.');

        bus.emit('team:fired', { staffId: staff.id, name: staff.name, severance });
        bus.emit('state:changed', data);
        return { ok: true, severance };
    }

    // ============ TRAIN ============
    trainStaff(staffId) {
        const data = this.state.data;
        const s = data.staff.find(x => x.id === staffId);
        if (!s) return { ok: false, reason: 'Staff tidak ditemukan.' };
        if (s.skill >= 5) return { ok: false, reason: 'Sudah tier tertinggi.' };

        const cost = s.salary * 2;
        if (data.cash < cost) {
            return { ok: false, reason: 'Uang tidak cukup. Butuh $' + cost.toLocaleString('en-US') + '.' };
        }

        this.state.setCash(data.cash - cost);
        s.skillProgress = (s.skillProgress || 0) + 30;
        while (s.skillProgress >= 100 && s.skill < 5) {
            s.skillProgress -= 100;
            s.skill += 1;
            this._onSkillUp(s);
        }

        this.state.addLog(s.name + ' mengikuti training ($' + cost.toLocaleString('en-US') + ').', LOG_TYPES.info);
        ToastService.success('📚 ' + s.name + ' selesai training.');
        bus.emit('state:changed', data);
        return { ok: true, cost };
    }

    // ============ GETTERS ============
    getTeamCounts() {
        const counts = { engineers: 0, designers: 0, marketers: 0 };
        (this.state.data.staff || []).forEach(s => {
            if (s.role === 'engineer') counts.engineers++;
            else if (s.role === 'designer') counts.designers++;
            else if (s.role === 'marketer') counts.marketers++;
        });
        return counts;
    }

    getStaffByRole(role) {
        return (this.state.data.staff || []).filter(s => s.role === role);
    }

    getTotalSalary() {
        return (this.state.data.staff || []).reduce((sum, s) => sum + (s.salary || 0), 0);
    }

    getAverageMorale() {
        const list = this.state.data.staff || [];
        if (!list.length) return 0;
        const sum = list.reduce((acc, s) => acc + (s.morale || 0), 0);
        return Math.round(sum / list.length);
    }

    // ============ STATIC BONUS ============
    static getResearchBonusFromStaff(staffList) {
        const engineers = (staffList || []).filter(s => s.role === 'engineer');
        const cfg = BALANCE.team && BALANCE.team.engineer ? BALANCE.team.engineer : {};
        if (!engineers.length) return { speedMult: 1.0, extraSlots: 0 };

        const bonusPerEng = cfg.researchSpeedPerEngineer || 0.08;
        const maxSpeed = cfg.maxResearchSpeed || 2.5;

        let speedMult = 1.0;
        engineers.forEach(s => {
            const skillDef = getSkillTier(s.skill);
            speedMult += bonusPerEng * (skillDef.bonusMult || 1);
        });
        speedMult = Math.min(speedMult, maxSpeed);

        const extraSlots = Math.min(
            Math.max(0, (cfg.maxResearchSlots || 3) - 1),
            Math.floor(engineers.length * (cfg.researchSlotPer2Engineers || 0.5))
        );
        return { speedMult, extraSlots };
    }

    static getOsDevBonusFromStaff(staffList) {
        const engineers = (staffList || []).filter(s => s.role === 'engineer');
        const cfg = BALANCE.team && BALANCE.team.engineer ? BALANCE.team.engineer : {};
        if (!engineers.length) return 1.0;

        const bonusPerEng = cfg.osDevSpeedPerEngineer || 0.06;
        const maxSpeed = cfg.maxOsDevSpeed || 2.0;

        let mult = 1.0;
        engineers.forEach(s => {
            const skillDef = getSkillTier(s.skill);
            mult += bonusPerEng * (skillDef.bonusMult || 1);
        });
        return Math.min(mult, maxSpeed);
    }

    static getOsFeatureSlotsFromStaff(staffList) {
        const engineers = (staffList || []).filter(s => s.role === 'engineer');
        return Math.floor(engineers.length * 0.33);
    }

    static getProductDevBonusFromStaff(staffList) {
        const designers = (staffList || []).filter(s => s.role === 'designer');
        const cfg = BALANCE.team && BALANCE.team.designer ? BALANCE.team.designer : {};
        if (!designers.length) return { speedMult: 1.0, qualityBonus: 0 };

        let speedMult = 1.0;
        let qualityBonus = 0;
        designers.forEach(s => {
            const skillDef = getSkillTier(s.skill);
            speedMult += (cfg.productDevSpeedPerDesigner || 0.1) * (skillDef.bonusMult || 1);
            qualityBonus += (cfg.qualityBonusPerDesigner || 0.5) * (skillDef.bonusMult || 1);
        });
        speedMult = Math.min(speedMult, cfg.maxProductDevSpeed || 3.0);
        qualityBonus = Math.min(qualityBonus, cfg.maxQualityBonus || 15);
        return { speedMult, qualityBonus };
    }

    static getMarketingBonusFromStaff(staffList) {
        const marketers = (staffList || []).filter(s => s.role === 'marketer');
        const cfg = BALANCE.team && BALANCE.team.marketer ? BALANCE.team.marketer : {};
        if (!marketers.length) return 1.0;

        let mult = 1.0;
        marketers.forEach(s => {
            const skillDef = getSkillTier(s.skill);
            mult += (cfg.marketingBonusPerMarketer || 0.1) * (skillDef.bonusMult || 1);
        });
        return Math.min(mult, cfg.maxMarketingBonus || 2.0);
    }

    // ============ CHEAT ============
    addStaffByName(role, skill) {
        const year = this.state.data.time.currentYear;
        const cand = this._generateCandidate(year, 0);
        cand.role = role || 'engineer';
        cand.skill = Math.max(1, Math.min(5, skill || 3));
        const skillDef = getSkillTier(cand.skill);
        const roleBase = (BALANCE.salary && BALANCE.salary[cand.role]) || 2500;
        cand.salary = Math.round(roleBase * skillDef.salaryMult);

        const newStaff = {
            id: 'staff_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: cand.name,
            country: cand.country,
            countryLabel: cand.countryLabel,
            countryFlag: cand.countryFlag,
            role: cand.role,
            skill: cand.skill,
            specialty: cand.specialty,
            yearsExperience: cand.yearsExperience,
            age: cand.age,
            background: cand.background,
            salary: cand.salary,
            morale: 75,
            traits: cand.traits || [],
            skillProgress: 0,
            hireDate: {
                year: this.state.data.time.currentYear,
                month: this.state.data.time.currentMonth,
                day: this.state.data.time.currentDay
            },
            hireGameMinute: this.state.data.time.elapsedGameMinutes,
            hireCost: 0
        };
        this.state.data.staff.push(newStaff);
        this.state.syncTeamCounters();
        bus.emit('state:changed', this.state.data);
        return newStaff;
    }

    fillStaff(role, count, skill) {
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push(this.addStaffByName(role, skill));
        }
        return list;
    }
            }
