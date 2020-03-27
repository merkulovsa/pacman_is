class Button {
    private readonly sprite: PIXI.Sprite

    constructor(sprite: PIXI.Sprite) {
        this.sprite = sprite

        this.init()
    }

    get touchEnabled(): boolean {
        return this.sprite.interactive
    }

    set touchEnabled(value: boolean) {
        this.sprite.interactive = value
    }

    set onPointerTap(callback: Callback) {
        this.sprite.on("pointertap", callback)
    }

    set onPointerDown(callback: Callback) {
        this.sprite.on("pointerdown", callback)
    }

    set onPointerMove(callback: Callback) {
        this.sprite.on("pointermove", callback)
    }

    set onPointerUp(callback: Callback) {
        this.sprite.on("pointerup", callback)
    }

    private init(): void {
        this.sprite.interactive = true
        this.sprite.buttonMode = true
    }
}
