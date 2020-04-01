class PriorityQueue<T> {
    private readonly arr: [T, number][]

    private _comparator: (a: number, b: number) => boolean

    constructor() {
        this.arr = []
        this._comparator = (a: number, b: number) => a > b
    }

    set comparator(value: (a: number, b: number) => boolean) {
        if (value) {
            this._comparator = value
        }
    }

    get empty(): boolean {
        return this.arr.length === 0
    }

    put(value: T, priority: number): void {
        this.arr.push([value, priority])
        
        let i = this.arr.length - 1
        let p = Math.floor((i - 1) / 2) // parent
        while (i > 0 && !this._comparator(this.arr[p][1], this.arr[i][1])) {
            const t = this.arr[i]
            this.arr[i] = this.arr[p]
            this.arr[p] = t

            i = p
            p = Math.floor((i - 1) / 2)
        }
    }

    get(): T {
        const value = this.arr[0][0]

        // remove first element
        this.arr.shift()

        // and set last on its place
        let last
        if (last = this.arr.pop()) {
            this.arr.unshift(last)
            this.heapify(0)
        }

        return value
    }

    private heapify(index: number): void {
        const n = this.arr.length
        let l, r, m, i // left child, right child, max child, current

        i = index
        for (;;) {
            l = i * 2 + 1
            r = i * 2 + 2
            m = i

            if (l < n && this._comparator(this.arr[l][1], this.arr[m][1])) {
                m = l
            }
            if (r < n && this._comparator(this.arr[r][1], this.arr[m][1])) {
                m = r
            }
            if (m === i) {
                break
            }

            const t = this.arr[i]
            this.arr[i] = this.arr[m]
            this.arr[m] = t
            i = m
        }
    }
}
