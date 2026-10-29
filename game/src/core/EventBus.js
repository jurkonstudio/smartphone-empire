// FILE: src/core/EventBus.js
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (typeof callback !== 'function') return function () {};
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(callback);
        const self = this;
        return function () { self.off(event, callback); };
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
        const arr = Array.from(set);
        for (let i = 0; i < arr.length; i++) {
            try {
                arr[i](data);
            } catch (err) {
                console.error('[EventBus] error di "' + event + '":', err);
            }
        }
    }

    clear(event) {
        if (event) this.listeners.delete(event);
        else this.listeners.clear();
    }

    listenerCount(event) {
        const set = this.listeners.get(event);
        return set ? set.size : 0;
    }
}

export const bus = new EventBus();
