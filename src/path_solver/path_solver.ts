abstract class PathSolver {
    protected static getXY(a: number): [number, number] {
        const v: [number, number] = [0, 0]
        v[0] = a % CONST.levelWidth
        v[1] = Math.floor(a / CONST.levelWidth)

        return v
    }

    protected static heuristic(a: number, b: number): number {
        const A = PathSolver.getXY(a)
        const B = PathSolver.getXY(b)

        return Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1])
    }

    protected readonly g: number[][]
    
    protected _onVertexPending: (index: number) => void = null
    protected _onVertexChecked: (index: number) => void = null
    protected _onVertexAddedToPath: (index: number) => void = null

    protected constructor(g: number[][]) {
        this.g = g || []
    }

    abstract get name(): string
    
    set onVertexPending(value: (index: number) => void) {
        this._onVertexPending = value
    }

    set onVertexChecked(value: (index: number) => void) {
        this._onVertexChecked = value
    }

    set onVertexAddedToPath(value: (index: number) => void) {
        this._onVertexAddedToPath = value
    }

    abstract solve(start: number, end: number): number[]
}