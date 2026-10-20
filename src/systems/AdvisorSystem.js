// FILE: src/systems/AdvisorSystem.js
// v2028.42 — Pemberitahuan patch & perbaikan bug.
// + [UPGRADE] Proactive Anomalies (Peringatan Dini Otomatis)
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

// ... (DICT dan RULES asli Anda tetap di sini) ...

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
        
        // [UPGRADE] State untuk Peringatan Dini
        this._lastProactiveWarn = {}; 
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
            // [UPGRADE] Panggil Peringatan Dini
            self._checkProactiveAnomalies();
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

    // [UPGRADE BARU] Deteksi Anomali secara Proaktif
    _checkProactiveAnomalies() {
        var c = this._ctx();
        var now = c.now;
        var today = Math.floor(now / DAY);

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

    // ... (Sisa fungsi asli: getAdvice, getHealth, forecast, simulate, chat, dll)
}
