export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try { handler(payload); }
      catch (err) { console.error(`[EventBus] handler error for "${event}"`, err); }
    }
  }
}

export const bus = new EventBus();
