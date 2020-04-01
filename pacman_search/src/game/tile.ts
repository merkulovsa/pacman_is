///<reference path="../common/button.ts"/>

class Tile {
    readonly button: Button

    private readonly sprite: PIXI.Sprite

    constructor(tileSprite: PIXI.Sprite) {
        this.sprite = tileSprite
        this.button = new Button(tileSprite)
    }

    get position(): PIXI.Point {
        return this.sprite.position
    }

    get alpha(): number {
        return this.sprite.alpha
    }

    set alpha(value: number) {
        this.sprite.alpha = value
    }
}
