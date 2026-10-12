class GameState {
    constructor() {
        this.data = {
            cash: 100000,
            day: 1,
            companyName: 'My Tech Co'
        };
    }
    get() {
        return this.data;
    }
    update(newData) {
        this.data = { ...this.data, ...newData };
    }
}
export const state = new GameState();
