function getNeighbors(index: number): number[] {
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
