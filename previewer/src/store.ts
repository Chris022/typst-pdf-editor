import { Action, appReducer, AppState } from "./logic";


export class Store {
    private state: AppState;
    private listeners: ((state: AppState) => void)[] = [];

    constructor(initialState: AppState) {
        this.state = initialState;
    }

    dispatch(action: Action) {
        this.state = appReducer(this.state, action);
        this.listeners.forEach(listener => listener(this.state));
    }

    subscribe(listener: (state: AppState) => void) {
        this.listeners.push(listener);
        listener(this.state); // Initial call
    }

    getState() {
        return this.state;
    }
}