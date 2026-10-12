// FILE: src/core/DesignEraService.js
// ============================================================
// DesignEraService — API untuk akses konfigurasi era desain.
// Menyediakan helper untuk wizard, mockup, dan komponen filter.
// ============================================================
import { state } from './GameState.js';
import {
    getDesignEraForYear,
    getDesignEraById,
    getBodyColorsForYear,
    getFormFactorsForYear,
    getScreenStyleForYear,
    getUiThemeForYear,
    getAestheticForYear,
    isBodyColorAvailable,
    isFormFactorAvailable,
    DESIGN_ERAS
} from '../data/era-design.data.js';
import { COMPONENTS, getComponentById } from '../data/components.data.js';

export const DesignEraService = {
    // Ambil era desain berdasarkan tahun game saat ini
    getCurrentEra() {
        const year = state.get().time.currentYear;
        return getDesignEraForYear(year);
    },

    getCurrentYear() {
        return state.get().time.currentYear;
    },

    getCurrentEraId() {
        return this.getCurrentEra().id;
    },

    getUiTheme() {
        return getUiThemeForYear(this.getCurrentYear());
    },

    getAesthetic() {
        return getAestheticForYear(this.getCurrentYear());
    },

    getScreenStyle() {
        return getScreenStyleForYear(this.getCurrentYear());
    },

    // ============================================================
    // FILTER KOMPONEN per era
    // ============================================================
    // Cek apakah komponen tersedia di tahun tertentu (berdasarkan minYear)
    isComponentAvailableInYear(component, year) {
        if (!component) return false;
        if (typeof component.minYear !== 'number') return true;
        return year >= component.minYear;
    },

    // Cek apakah komponen juga sudah diriset
    isComponentUnlocked(component, completedResearch) {
        if (!component) return false;
        if (!component.requiresResearch) return true;
        return (completedResearch || []).includes(component.requiresResearch);
    },

    // Cek komponen valid di era saat ini (year + research)
    isComponentAvailable(componentId, year, completedResearch) {
        const comp = getComponentById(componentId);
        if (!comp) return { ok: false, reason: 'Komponen tidak ditemukan.' };

        if (!this.isComponentAvailableInYear(comp, year)) {
            return { ok: false, reason: 'Tersedia tahun ' + comp.minYear };
        }
        if (!this.isComponentUnlocked(comp, completedResearch)) {
            return { ok: false, reason: 'Butuh riset: ' + comp.requiresResearch };
        }
        return { ok: true };
    },

    // Filter komponen per kategori yang tersedia di era ini
    getAvailableComponentsByCategory(catId, year, completedResearch) {
        return COMPONENTS.filter(c => {
            if (c.category !== catId) return false;
            return this.isComponentAvailable(c.id, year, completedResearch).ok;
        });
    },

    // ============================================================
    // BODY & FORM FACTOR
    // ============================================================
    getAvailableBodyColors() {
        const year = this.getCurrentYear();
        return getBodyColorsForYear(year);
    },

    getAvailableFormFactors() {
        const year = this.getCurrentYear();
        return getFormFactorsForYear(year);
    },

    isBodyColorAvailable(colorId) {
        return isBodyColorAvailable(colorId, this.getCurrentYear());
    },

    isFormFactorAvailable(ffId) {
        return isFormFactorAvailable(ffId, this.getCurrentYear());
    },

    // ============================================================
    // SANITASI CONFIG
    // ============================================================
    // Pastikan config punya nilai valid untuk era saat ini.
    // Kalau ada komponen dari masa depan, ganti dengan yang tersedia.
    sanitizeConfig(config) {
        const year = this.getCurrentYear();
        const data = state.get();
        const completed = data.research.completed || [];

        const out = { ...(config || {}) };

        // Cek setiap field komponen
        const fieldToCat = {
            displayId: 'display',
            cameraId: 'camera',
            batteryId: 'battery',
            chipId: 'chip',
            networkId: 'network',
            bodyId: 'body',
            formFactorId: 'form_factor'
        };

        for (const field in fieldToCat) {
            const catId = fieldToCat[field];
            const cur = out[field];
            if (cur && this.isComponentAvailable(cur, year, completed).ok) continue;

            // Ganti dengan komponen tertinggi yang tersedia
            const list = this.getAvailableComponentsByCategory(catId, year, completed);
            out[field] = list.length ? list[list.length - 1].id : null;
        }

        // Warna bodi
        if (!out.bodyColorId || !this.isBodyColorAvailable(out.bodyColorId)) {
            const colors = this.getAvailableBodyColors();
            out.bodyColorId = colors[0] || 'color_black';
        }

        return out;
    },

    // ============================================================
    // ERAS INFO
    // ============================================================
    getAllEras() {
        return DESIGN_ERAS.slice();
    },

    // Cek apakah era berubah dibanding tahun sebelumnya
    hasEraChanged(prevYear, newYear) {
        const prev = getDesignEraForYear(prevYear);
        const now = getDesignEraForYear(newYear);
        return prev.id !== now.id;
    }
};
