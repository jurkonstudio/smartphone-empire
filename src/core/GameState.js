import { TIME_CONFIG } from '../config/time.config.js';

class GameState {
    constructor() {
        this.data = {
            companyName: 'My Tech Co',
            cash: 100000,
            time: {
                currentYear: TIME_CONFIG.startYear,
                currentMonth: TIME_CONFIG.startMonth,
                currentDay: TIME_CONFIG.startDay,
                currentHour: TIME_CONFIG.startHour,
                currentMinute: TIME_CONFIG.startMinute,
                elapsedGameMinutes: 0
            },
            isPaused: TIME_CONFIG.startPaused,
            gameSpeed: TIME_CONFIG.defaultSpeed
        };
    }
    get() { return this.data; }
    update(patch) { Object.assign(this.data, patch); }
}
export const state = new GameState();
