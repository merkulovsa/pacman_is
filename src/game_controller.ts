class GameController {
    readonly states: {[key: string]: GameState}

    private _currentState: GameState = null
    private _previousState: GameState = null

    constructor() {
        this.states = {}
    }

    get currentState(): GameState {
        return this._currentState
    }

    get previousState(): GameState {
        return this._previousState
    }

    update(): void {
        if (!this._currentState) {
            return
        }

        const nextState = this._currentState.update()
        if (nextState !== this._currentState) {
            this._previousState = this._currentState
            this._currentState.exit()
            this._currentState = nextState
            this._currentState.enter()
        }
    }
}