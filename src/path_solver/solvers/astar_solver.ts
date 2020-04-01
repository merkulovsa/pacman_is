class AstarSolver extends PathSolver {
    constructor(g: number[][]) {
        super(g)
    }

    get name(): string {return "A-Star"}

    solve(start: number, end: number): number[] {
        const front = new PriorityQueue<number>()
        front.comparator = (a: number, b: number) => a < b
        front.put(start, 0)
        const previous: {[key: number]: number} = {}
        previous[start] = -1
        const cost: {[key: number]: number} = {}
        cost[start] = 0

        let current
        while (!front.empty) {
            current = front.get()

            if (current === end) {
                break
            }

            for (const next of this.g[current]) {
                const newCost = cost[current] + 1
                if (!(next in cost) || newCost < cost[next]) {
                    cost[next] = newCost
                    previous[next] = current
                    front.put(next, newCost + AstarSolver.heuristic(end, next))
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
        path.push(current)

        return path.reverse()
    }
}
