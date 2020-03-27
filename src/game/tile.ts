class Tile {
    readonly button: Button
    readonly neighbors: number[]

    private readonly container: PIXI.Container

    private occupied: boolean = false

    constructor(tileSprite: PIXI.Sprite, neighbors?: number[]) {
        this.container = tileSprite
        this.button = new Button(tileSprite)
        this.neighbors = neighbors || []
    }

    get position(): PIXI.Point {
        return this.container.position
    }

    get isOccupied(): boolean {
        return this.occupied
    }
}
