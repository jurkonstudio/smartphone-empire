// ============================================================
// [CONTEXT-AWARE BUGS] Memfilter bug berdasarkan tahun & fitur
// ============================================================
_rollForBug() {
    const data = this.state.data;
    const activeBugs = data.os.bugs.filter(b => b.status === 'active');
    if (activeBugs.length >= 3) return;

    const cs = this.getCurrentStats();
    const stability = cs ? cs.stability : 50;
    const baseChance = BALANCE.os.baseBugChancePerDay || 0.02;
    
    // Semakin tinggi stabilitas, semakin kecil chance bug muncul
    const chance = baseChance * ((100 - stability) / 100);

    if (Math.random() < chance) {
        const currentYear = data.time.currentYear;
        const currentVersion = this.getCurrentVersionObject();
        const currentFeatures = currentVersion ? currentVersion.features : [];

        // Filter: Hanya ambil bug yang valid untuk tahun ini dan fitur ini
        const validBugs = BUG_TEMPLATES.filter(bug => {
            // 1. Cek rentang tahun
            const min = bug.minYear || 2000;
            const max = bug.maxYear || 9999;
            if (currentYear < min || currentYear > max) return false;
            
            // 2. Cek syarat fitur (jika ada)
            if (bug.requiresFeature) {
                const f = getOsFeatureById(bug.requiresFeature);
                // Jika fitur starter, otomatis lolos
                if (f && f.starter) return true;
                // Jika bukan starter, cek apakah ada di versi OS saat ini
                if (currentFeatures.indexOf(bug.requiresFeature) === -1) return false;
            }

            return true;
        });

        // Pilih bug secara acak dari daftar yang lolos filter
        if (validBugs.length > 0) {
            const randomBug = validBugs[Math.floor(Math.random() * validBugs.length)];
            this._spawnBug(randomBug);
        } else {
            // Fallback jika tidak ada bug yang cocok
            this._spawnBug(BUG_TEMPLATES[0]);
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
