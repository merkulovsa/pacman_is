class Player {
    index: number

    private readonly container: PIXI.Container

    constructor(playerContainer: PIXI.Container) {
        this.container = playerContainer
        this.index = 0
    }

    get position(): PIXI.Point {
        return this.container.position
    }
}
