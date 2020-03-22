class SceneDesigner {
    static get instance(): SceneDesigner {
        if (!this._instance) {
            this._instance = new SceneDesigner()
        }

        return this._instance
    }

    private static _instance: SceneDesigner


    readonly PACMAN_SCENE: PIXI.Container

    readonly PLAYER: PIXI.Sprite
    readonly TILES: PIXI.Sprite[]

    constructor() {
        ///
        /// PACMAN SPRITE
        ///
        this.PLAYER = new PIXI.Sprite() //TODO: add pacman texture here
        this.PLAYER.name = "player"

        ///
        /// TILE SPTIRES
        ///
        this.TILES = []
        const scale = CONST.levelScale
        const tileWidth = CONST.tileTex0.width * scale, tileHeight = CONST.tileTex0.height * scale
        let xPos = 0, yPos = 0
        for (let i = 0; i < CONST.levelHeight * CONST.levelWidth; ++i) {
            const sprite = new PIXI.Sprite(CONST.levelMask[i] ? CONST.tileTex1 : CONST.tileTex0)
            sprite.name = "tile-" + i
            sprite.anchor.set(0.0)
            sprite.scale.set(scale)
            sprite.position.set(xPos, yPos)

            if ((i + 1) % CONST.levelWidth === 0) {
                xPos = 0
                yPos += tileHeight
            } else {
                xPos += tileWidth
            }

            this.TILES.push(sprite)
        }

        ///
        /// PACMAN SCENE
        ///
        this.PACMAN_SCENE = new PIXI.Container()
        this.PACMAN_SCENE.addChild(this.PLAYER)
        this.PACMAN_SCENE.addChild(...this.TILES)

        APP.stage.addChild(this.PACMAN_SCENE)
        console.log("[SceneDesigner] SCENE WAS BUILT")
    }
}