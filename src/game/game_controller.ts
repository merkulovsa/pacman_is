class GameController {
    readonly states: {[key: string]: GameState}
    readonly player: Player
    readonly tiles: Tile[]

    private _currentState: GameState = null
    private _previousState: GameState = null

    constructor() {
        this.states = {}
        this.player = new Player(SceneDesigner.instance.PLAYER)
        this.tiles = SceneDesigner.instance.TILES.map((value, index) => new Tile(value, this.getNeighbors(index)))
    }

    get currentState(): GameState {
        return this._currentState
    }

    get previousState(): GameState {
        return this._previousState
    }

    start(): void {
        this.init()

        this._currentState && this.currentState.enter()
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

    private init(): void {
        this.states[IdleState.key] = new IdleState(this)
        this.states[PlayState.key] = new PlayState(this)

        for (let i = 0; i < this.tiles.length; ++i) {
            this.tiles[i].button.onPointerDown = () => this.onTilePointerDown(this.tiles[i], i)
        }

        this._currentState = this.states[IdleState.key]
    }

    private notifyStates(callbackName: string, ...args: any[]): void {
        for (const key in this.states) {
            if (key) {
                this.states[key][callbackName] && this.states[key][callbackName](...args)
            }
        }
    }

    private getNeighbors(index: number): number[] {
        const neighbors = []
        const n = CONST.levelMask.length
        let x

        // left
        x = index - 1
        if (x >= 0 && CONST.levelMask[x]) {
            neighbors.push(x)
        }

        // right
        x = index + 1
        if (x < n && CONST.levelMask[x]) {
            neighbors.push(x)
        }

        // up
        x = index - CONST.levelWidth
        if (x >= 0 && CONST.levelMask[x]) {
            neighbors.push(x)
        }

        // down
        x = index + CONST.levelWidth
        if (x < n && CONST.levelMask[x]) {
            neighbors.push(x)
        }

        return neighbors
    }

    // Diijkstra
    private getPath(from: number, to: number): number[] {
        const g = this.tiles.map((value) => value.neighbors)
        const n = CONST.levelMask.length
        const s = from
	    const d = new Array(n).fill(Infinity), p = new Array(n), u = new Array(n)
	    d[s] = 0
	    for (let i = 0; i < n; ++i) {
	    	let v = -1
            for (let j = 0; j < n; ++j) {
                if (!u[j] && (v == -1 || d[j] < d[v])) {
                    v = j
                }
            }
	    		
            if (d[v] == Infinity) {
	    		break
            }
	    	u[v] = true
        
	    	for (let j = 0; j < g[v].length; ++j) {
	    		let next = g[v][j]
	    		if (d[v] + 1 < d[next]) {
	    			d[next] = d[v] + 1
	    			p[next] = v
	    		}
	    	}
        }

        const path: number[] = []
        for (let v = to; v !== s; v = p[v]) {
	        path.push(v)
        }
        path.push(s)
        
        return path.reverse()
    }

    private readonly onTilePointerDown = (value: Tile, index: number) => {
        this.notifyStates("onTilePointerDown", value, index)
    }
}