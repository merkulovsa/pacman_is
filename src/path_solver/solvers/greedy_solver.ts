class GreedySolver extends PathSolver {
    constructor(g: number[][]) {
        super(g)
    }

    get name(): string {return "Greedy"}

    solve(start: number, end: number): number[] {
        const front = new PriorityQueue<number>()
        front.comparator = (a: number, b: number) => a < b
        front.put(start, 0)
        const previous: {[key: number]: number} = {}
        previous[start] = -1

        let current
        while (!front.empty) {
            current = front.get()

            if (current === end) {
                break
            }

            for (const next of this.g[current]) {
                if (!(next in previous)) {
                    previous[next] = current
                    front.put(next, GreedySolver.heuristic(end, next))
                    this._onVertexPending && this._onVertexPending(next)
                }
            }
            
            this._onVertexChecked && this._onVertexChecked(current)
        }

        const path = []
        while (previous[current] !== -1) {
            path.push(current)
            this._onVertexAddedToPath && this._onVertexAddedToPath(current)
            current = previous[current]
        }
        this._onVertexAddedToPath && this._onVertexAddedToPath(current)
        path.push(start)

        return path.reverse()
    }
}