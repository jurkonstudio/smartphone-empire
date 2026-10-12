// FILE: src/systems/EraSystem.js
// ============================================================
// EraSystem — memantau pergantian era teknologi.
// Sumber data era: UI_ERAS (src/data/ui-era.data.js).
// Ketika tahun game melewati batas era, update state.era
// dan pancarkan event era:changed.
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { LOG_TYPES } from '../config/constants.js';
import { ToastService } from '../core/ToastService.js';
import { UI_ERAS, getEraForYear } from '../data/ui-era.data.js';

// Cari ID era teknologi yang cocok dengan tahun
function getTechEraIdForYear(year) {
    const era = getEraForYear(year);
    return era ? era.id : 'feature_phone';
}

export class EraSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
    }

    start() {
        this._unsubs.push(bus.on('time:year-changed', (snap) => this._onYearChanged(snap)));
        // Sinkronkan saat boot — jangan umumkan, hanya perbaiki jika salah
        this._syncEra(this.state.data.time.currentYear, false);
        console.info('[EraSystem] siap. Era saat ini:', this.state.data.era);
    }

    stop() {
        this._unsubs.forEach(u => u());
        this._unsubs = [];
    }

    _onYearChanged(snap) {
        this._syncEra(snap.currentYear, true);
    }

    _syncEra(year, announce) {
        const newEra = getTechEraIdForYear(year);
        const oldEra = this.state.data.era;
        if (newEra === oldEra) return;

        this.state.data.era = newEra;
        this.state.data.eraStartYear = year;

        const eraDef = UI_ERAS.find(e => e.id === newEra);
        const label = eraDef ? eraDef.label : newEra;

        if (announce) {
            const msg = 'Memasuki era ' + label + '!';
            this.state.addLog(msg, LOG_TYPES.success);
            this.state.addMilestone('era_' + newEra, msg);
            ToastService.success('🎉 ' + msg);
            if (this.state.data.settings.vibrate) {
                try { if (navigator.vibrate) navigator.vibrate([40, 60, 40]); } catch (e) {}
            }
        }

        bus.emit('era:changed', { from: oldEra, to: newEra, year });
        bus.emit('state:changed', this.state.data);
    }
}

export { getTechEraIdForYear };
