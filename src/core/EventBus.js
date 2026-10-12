// FILE: src/core/EventBus.js
// Event bus sederhana berbasis Set — mendukung on/off/emit/clear.
// Tidak ada listener duplikat dalam satu event.
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    // Mendaftarkan listener. Mengembalikan fungsi unsubscribe.
    on(event, callback) {
        if (typeof callback !== 'function') return () => {};
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        const set = this.listeners.get(event);
        if (!set) return;
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(event);
    }

    emit(event, data) {
        const set = this.listeners.get(event);
        if (!set) return;
        // Snapshot agar aman jika ada listener yang unsubscribe saat iterasi
        for (const cb of Array.from(set)) {
            try { cb(data); }
            catch (err) { console.error(`[EventBus] error di "${event}":`, err); }
        }
    }

    clear(event) {
        if (event) this.listeners.delete(event);
        else this.listeners.clear();
    }

    listenerCount(event) {
        return this.listeners.get(event)?.size ?? 0;
    }
}

export const bus = new EventBus();
