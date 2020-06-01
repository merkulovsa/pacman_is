///<reference path="./player.ts"/>
///<reference path="./tile.ts"/>
///<reference path="./states/idle_state.ts"/>
///<reference path="./states/move_state.ts"/>
///<reference path="../path_solver/solvers/dijkstra_solver.ts"/>
///<reference path="../path_solver/solvers/greedy_solver.ts"/>
///<reference path="../path_solver/solvers/astar_solver.ts"/>

class GameController {
    readonly states: {[key: string]: GameState}
    readonly player: Player
    readonly tiles: Tile[]
    readonly solverButton: Button

    moveTween: TWEEN.Tween = null

    private readonly graph: number[][]
    private readonly solvers: PathSolver[]

    private solverIndex: number = 0
    private _currentState: GameState = null
    private _previousState: GameState = null

    constructor() {
        this.states = {}
        this.player = new Player(DESIGNER.PLAYER)
        this.tiles = DESIGNER.TILES.map((value) => new Tile(value))
        this.solverButton = new Button(DESIGNER.SOLVER)
        this.graph = Object.keys(CONST.levelMask).map(Number).map(value => getNeighbors(value))
        this.solvers = [
            new DijkstraSolver(this.graph),
            new GreedySolver(this.graph),
            new AstarSolver(this.graph),
        ]
    }

    get currentState(): GameState {
        return this._currentState
    }

    get previousState(): GameState {
        return this._previousState
    }
    
    get currentSolver(): PathSolver {
        return this.solvers[this.solverIndex]
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

    nextSolver(): void {
        this.solverIndex = (this.solverIndex + 1) % this.solvers.length
        DESIGNER.SOLVER.text = this.currentSolver.name
    }
    
    private init(): void {
        this.states[IdleState.key] = new IdleState(this)
        this.states[MoveState.key] = new MoveState(this)

        for (let i = 0; i < this.tiles.length; ++i) {
            this.tiles[i].button.onPointerDown = () => this.onTilePointerDown(this.tiles[i], i)
        }
        
        
        const startTile = this.tiles.find((value, index) => !!CONST.levelMask[index])
        this.player.position.set(startTile.position.x, startTile.position.y)
        this.player.index = this.tiles.indexOf(startTile)

        for (const solver of this.solvers) {
            solver.onVertexPending = this.onVertexPending
            solver.onVertexChecked = this.onVertexChecked
            solver.onVertexAddedToPath = this.onVertexAddedToPath
        }
        
        DESIGNER.SOLVER.text = this.currentSolver.name
        this.solverButton.onPointerDown = this.onSolverPointerDown

        this._currentState = this.states[IdleState.key]
    }

    private notifyStates(callbackName: string, ...args: any[]): void {
        for (const key in this.states) {
            if (key) {
                this.states[key][callbackName] && this.states[key][callbackName](...args)
            }
        }
    }

    private readonly onVertexPending = (index: number) => {
        // this.tiles[index].alpha = CONST.pendingTileAlpha
    }

    private readonly onVertexChecked = (index: number) => {
        this.tiles[index].alpha = CONST.checkedTileAlpha
    }

    private readonly onVertexAddedToPath = (index: number) => {
        this.tiles[index].alpha = CONST.addedToPathTileAlpha
    }

    private readonly onTilePointerDown = (value: Tile, index: number) => {
        this.notifyStates("onTilePointerDown", value, index)
    }

    private readonly onSolverPointerDown = () => {
        this.notifyStates("onSolverPointerDown")
    }
}