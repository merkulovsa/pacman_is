///<reference path="../common/button.ts"/>

class Tile {
    readonly button: Button
    readonly neighbors: number[]

    private readonly container: PIXI.Container

    constructor(tileSprite: PIXI.Sprite, neighbors?: number[]) {
        this.container = tileSprite
        this.button = new Button(tileSprite)
        this.neighbors = neighbors || []
    }

    get position(): PIXI.Point {
        return this.container.position
    }
}
