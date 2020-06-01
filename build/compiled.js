var CONST;
(function (CONST) {
    CONST.levelWidth = 28;
    CONST.levelHeight = 27;
    CONST.levelMask = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
        0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    CONST.levelScale = 0.12;
    CONST.checkedTileAlpha = 0.5;
    CONST.addedToPathTileAlpha = 1.0;
    CONST.inactiveTileAlpha = 0.8;
    CONST.stepDuration = 200;
    CONST.tileTex0 = PIXI.Texture.from("../assets/1.png");
    CONST.tileTex1 = PIXI.Texture.from("../assets/0.png");
    CONST.playerTex = PIXI.Texture.from("../assets/player.png");
})(CONST || (CONST = {}));
class SceneDesigner {
    static get instance() {
        if (!this._instance) {
            this._instance = new SceneDesigner();
        }
        return this._instance;
    }
    constructor() {
        this.TILES = [];
        const scale = CONST.levelScale;
        const tileWidth = CONST.tileTex0.width * scale, tileHeight = CONST.tileTex0.height * scale;
        let xPos = 0, yPos = 0;
        for (let i = 0; i < CONST.levelHeight * CONST.levelWidth; ++i) {
            const sprite = new PIXI.Sprite(CONST.levelMask[i] ? CONST.tileTex1 : CONST.tileTex0);
            sprite.name = "tile-" + i;
            sprite.anchor.set(0.0);
            sprite.scale.set(scale);
            sprite.position.set(xPos, yPos);
            if ((i + 1) % CONST.levelWidth === 0) {
                xPos = 0;
                yPos += tileHeight;
            }
            else {
                xPos += tileWidth;
            }
            this.TILES.push(sprite);
        }
        this.PLAYER = new PIXI.Sprite(CONST.playerTex);
        this.PLAYER.name = "player";
        this.PLAYER.anchor.set(0.0);
        this.PLAYER.scale.set(CONST.levelScale);
        this.PLAYER.position.set(0.0);
        this.SOLVER = new PIXI.Text("", new PIXI.TextStyle({ fill: "#FFFFFF" }));
        this.SOLVER.name = "solver";
        this.SOLVER.anchor.set(0.0);
        this.SOLVER.position.set(0.0);
        this.PACMAN_SCENE = new PIXI.Container();
        this.PACMAN_SCENE.addChild(...this.TILES);
        this.PACMAN_SCENE.addChild(this.PLAYER);
        this.PACMAN_SCENE.addChild(this.SOLVER);
        APP.stage.addChild(this.PACMAN_SCENE);
        console.log("[SceneDesigner] SCENE WAS BUILT");
    }
}
class Player {
    constructor(playerContainer) {
        this.container = playerContainer;
        this.index = 0;
    }
    get position() {
        return this.container.position;
    }
}
class Button {
    constructor(sprite) {
        this.sprite = sprite;
        this.init();
    }
    get touchEnabled() {
        return this.sprite.interactive;
    }
    set touchEnabled(value) {
        this.sprite.interactive = value;
    }
    set onPointerTap(callback) {
        this.sprite.on("pointertap", callback);
    }
    set onPointerDown(callback) {
        this.sprite.on("pointerdown", callback);
    }
    set onPointerMove(callback) {
        this.sprite.on("pointermove", callback);
    }
    set onPointerUp(callback) {
        this.sprite.on("pointerup", callback);
    }
    init() {
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
    }
}
class Tile {
    constructor(tileSprite) {
        this.sprite = tileSprite;
        this.button = new Button(tileSprite);
    }
    get position() {
        return this.sprite.position;
    }
    get alpha() {
        return this.sprite.alpha;
    }
    set alpha(value) {
        this.sprite.alpha = value;
    }
}
class GameState {
    constructor(game) {
        this.game = game;
    }
    get isActiveState() {
        return this === this.game.currentState;
    }
}
GameState.key = "GameState";
class IdleState extends GameState {
    constructor(game) {
        super(game);
        this.onPlayState = false;
        this.onSolverPointerDown = () => {
            if (!this.isActiveState) {
                return;
            }
            this.game.nextSolver();
        };
        this.onTilePointerDown = (value, index) => {
            if (!this.isActiveState || !CONST.levelMask[index] || !CONST.levelMask[this.game.player.index]) {
                return;
            }
            for (const tile of this.game.tiles) {
                tile.alpha = CONST.inactiveTileAlpha;
            }
            const path = this.game.currentSolver.solve(this.game.player.index, index);
            const toX = [];
            const toY = [];
            for (let i = 0; i < path.length; ++i) {
                const pos = this.game.tiles[path[i]].position;
                toX.push(pos.x);
                toY.push(pos.y);
            }
            const from = { x: this.game.player.position.x, y: this.game.player.position.y };
            const to = { x: toX, y: toY };
            this.game.moveTween =
                new TWEEN.Tween(from)
                    .to(to, path.length * CONST.stepDuration)
                    .onUpdate((value) => this.game.player.position.set(value.x, value.y))
                    .easing(TWEEN.Easing.Linear.None)
                    .interpolation(TWEEN.Interpolation.Linear);
            this.game.player.index = index;
            this.onPlayState = true;
        };
    }
    enter() {
        this.onPlayState = false;
    }
    update() {
        if (this.onPlayState) {
            return this.game.states[MoveState.key];
        }
        return this;
    }
    exit() {
    }
}
IdleState.key = "IdleState";
class MoveState extends GameState {
    constructor(game) {
        super(game);
    }
    enter() {
        this.game.moveTween.start();
    }
    update() {
        if (this.game.moveTween.isPlaying()) {
            return this;
        }
        return this.game.states[IdleState.key];
    }
    exit() {
        for (const tile of this.game.tiles) {
            tile.alpha = 1.0;
        }
    }
}
MoveState.key = "MoveState";
class PathSolver {
    constructor(g) {
        this._onVertexPending = null;
        this._onVertexChecked = null;
        this._onVertexAddedToPath = null;
        this.g = g || [];
    }
    static getXY(a) {
        const v = [0, 0];
        v[0] = a % CONST.levelWidth;
        v[1] = Math.floor(a / CONST.levelWidth);
        return v;
    }
    static heuristic(a, b) {
        const A = PathSolver.getXY(a);
        const B = PathSolver.getXY(b);
        return Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]);
    }
    set onVertexPending(value) {
        this._onVertexPending = value;
    }
    set onVertexChecked(value) {
        this._onVertexChecked = value;
    }
    set onVertexAddedToPath(value) {
        this._onVertexAddedToPath = value;
    }
}
class PriorityQueue {
    constructor() {
        this.arr = [];
        this._comparator = (a, b) => a > b;
    }
    set comparator(value) {
        if (value) {
            this._comparator = value;
        }
    }
    get empty() {
        return this.arr.length === 0;
    }
    put(value, priority) {
        this.arr.push([value, priority]);
        let i = this.arr.length - 1;
        let p = Math.floor((i - 1) / 2);
        while (i > 0 && !this._comparator(this.arr[p][1], this.arr[i][1])) {
            const t = this.arr[i];
            this.arr[i] = this.arr[p];
            this.arr[p] = t;
            i = p;
            p = Math.floor((i - 1) / 2);
        }
    }
    get() {
        const value = this.arr[0][0];
        this.arr.shift();
        let last;
        if (last = this.arr.pop()) {
            this.arr.unshift(last);
            this.heapify(0);
        }
        return value;
    }
    heapify(index) {
        const n = this.arr.length;
        let l, r, m, i;
        i = index;
        for (;;) {
            l = i * 2 + 1;
            r = i * 2 + 2;
            m = i;
            if (l < n && this._comparator(this.arr[l][1], this.arr[m][1])) {
                m = l;
            }
            if (r < n && this._comparator(this.arr[r][1], this.arr[m][1])) {
                m = r;
            }
            if (m === i) {
                break;
            }
            const t = this.arr[i];
            this.arr[i] = this.arr[m];
            this.arr[m] = t;
            i = m;
        }
    }
}
class DijkstraSolver extends PathSolver {
    constructor(g) {
        super(g);
    }
    get name() { return "Dijkstra"; }
    solve(start, end) {
        const front = new PriorityQueue();
        front.comparator = (a, b) => a < b;
        front.put(start, 0);
        const previous = {};
        previous[start] = -1;
        const cost = {};
        cost[start] = 0;
        let current;
        while (!front.empty) {
            current = front.get();
            if (current === end) {
                break;
            }
            for (const next of this.g[current]) {
                const newCost = cost[current] + 1;
                if (!(next in cost) || newCost < cost[next]) {
                    cost[next] = newCost;
                    previous[next] = current;
                    front.put(next, newCost);
                    this._onVertexPending && this._onVertexPending(next);
                }
            }
            this._onVertexChecked && this._onVertexChecked(current);
        }
        const path = [];
        while (previous[current] !== -1) {
            path.push(current);
            this._onVertexAddedToPath && this._onVertexAddedToPath(current);
            current = previous[current];
        }
        this._onVertexAddedToPath && this._onVertexAddedToPath(current);
        path.push(current);
        return path.reverse();
    }
}
class GreedySolver extends PathSolver {
    constructor(g) {
        super(g);
    }
    get name() { return "Greedy"; }
    solve(start, end) {
        const front = new PriorityQueue();
        front.comparator = (a, b) => a < b;
        front.put(start, 0);
        const previous = {};
        previous[start] = -1;
        let current;
        while (!front.empty) {
            current = front.get();
            if (current === end) {
                break;
            }
            for (const next of this.g[current]) {
                if (!(next in previous)) {
                    previous[next] = current;
                    front.put(next, GreedySolver.heuristic(end, next));
                    this._onVertexPending && this._onVertexPending(next);
                }
            }
            this._onVertexChecked && this._onVertexChecked(current);
        }
        const path = [];
        while (previous[current] !== -1) {
            path.push(current);
            this._onVertexAddedToPath && this._onVertexAddedToPath(current);
            current = previous[current];
        }
        this._onVertexAddedToPath && this._onVertexAddedToPath(current);
        path.push(start);
        return path.reverse();
    }
}
class AstarSolver extends PathSolver {
    constructor(g) {
        super(g);
    }
    get name() { return "A-Star"; }
    solve(start, end) {
        const front = new PriorityQueue();
        front.comparator = (a, b) => a < b;
        front.put(start, 0);
        const previous = {};
        previous[start] = -1;
        const cost = {};
        cost[start] = 0;
        let current;
        while (!front.empty) {
            current = front.get();
            if (current === end) {
                break;
            }
            for (const next of this.g[current]) {
                const newCost = cost[current] + 1;
                if (!(next in cost) || newCost < cost[next]) {
                    cost[next] = newCost;
                    previous[next] = current;
                    front.put(next, newCost + AstarSolver.heuristic(end, next));
                    this._onVertexPending && this._onVertexPending(next);
                }
            }
            this._onVertexChecked && this._onVertexChecked(current);
        }
        const path = [];
        while (previous[current] !== -1) {
            path.push(current);
            this._onVertexAddedToPath && this._onVertexAddedToPath(current);
            current = previous[current];
        }
        this._onVertexAddedToPath && this._onVertexAddedToPath(current);
        path.push(current);
        return path.reverse();
    }
}
class GameController {
    constructor() {
        this.moveTween = null;
        this.solverIndex = 0;
        this._currentState = null;
        this._previousState = null;
        this.onVertexPending = (index) => {
        };
        this.onVertexChecked = (index) => {
            this.tiles[index].alpha = CONST.checkedTileAlpha;
        };
        this.onVertexAddedToPath = (index) => {
            this.tiles[index].alpha = CONST.addedToPathTileAlpha;
        };
        this.onTilePointerDown = (value, index) => {
            this.notifyStates("onTilePointerDown", value, index);
        };
        this.onSolverPointerDown = () => {
            this.notifyStates("onSolverPointerDown");
        };
        this.states = {};
        this.player = new Player(DESIGNER.PLAYER);
        this.tiles = DESIGNER.TILES.map((value) => new Tile(value));
        this.solverButton = new Button(DESIGNER.SOLVER);
        this.graph = Object.keys(CONST.levelMask).map(Number).map(value => getNeighbors(value));
        this.solvers = [
            new DijkstraSolver(this.graph),
            new GreedySolver(this.graph),
            new AstarSolver(this.graph),
        ];
    }
    get currentState() {
        return this._currentState;
    }
    get previousState() {
        return this._previousState;
    }
    get currentSolver() {
        return this.solvers[this.solverIndex];
    }
    start() {
        this.init();
        this._currentState && this.currentState.enter();
    }
    update() {
        if (!this._currentState) {
            return;
        }
        const nextState = this._currentState.update();
        if (nextState !== this._currentState) {
            this._previousState = this._currentState;
            this._currentState.exit();
            this._currentState = nextState;
            this._currentState.enter();
        }
    }
    nextSolver() {
        this.solverIndex = (this.solverIndex + 1) % this.solvers.length;
        DESIGNER.SOLVER.text = this.currentSolver.name;
    }
    init() {
        this.states[IdleState.key] = new IdleState(this);
        this.states[MoveState.key] = new MoveState(this);
        for (let i = 0; i < this.tiles.length; ++i) {
            this.tiles[i].button.onPointerDown = () => this.onTilePointerDown(this.tiles[i], i);
        }
        const startTile = this.tiles.find((value, index) => !!CONST.levelMask[index]);
        this.player.position.set(startTile.position.x, startTile.position.y);
        this.player.index = this.tiles.indexOf(startTile);
        for (const solver of this.solvers) {
            solver.onVertexPending = this.onVertexPending;
            solver.onVertexChecked = this.onVertexChecked;
            solver.onVertexAddedToPath = this.onVertexAddedToPath;
        }
        DESIGNER.SOLVER.text = this.currentSolver.name;
        this.solverButton.onPointerDown = this.onSolverPointerDown;
        this._currentState = this.states[IdleState.key];
    }
    notifyStates(callbackName, ...args) {
        for (const key in this.states) {
            if (key) {
                this.states[key][callbackName] && this.states[key][callbackName](...args);
            }
        }
    }
}
const APP = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xFFFFFF,
});
APP.ticker.add(() => onUpdate());
document.body.appendChild(APP.view);
const DESIGNER = SceneDesigner.instance;
const GAME = new GameController();
function onUpdate() {
    TWEEN.update();
    GAME.update();
}
GAME.start();
function getNeighbors(index) {
    const neighbors = [];
    const n = CONST.levelMask.length;
    let x;
    x = index - 1;
    if (x >= 0 && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    x = index + 1;
    if (x < n && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    x = index - CONST.levelWidth;
    if (x >= 0 && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    x = index + CONST.levelWidth;
    if (x < n && CONST.levelMask[x]) {
        neighbors.push(x);
    }
    return neighbors;
}
