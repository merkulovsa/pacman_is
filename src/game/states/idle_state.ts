///<reference path="../game_state.ts"/>

class IdleState extends GameState {
    static readonly key: string = "IdleState"


    private onPlayState: boolean = false

    constructor(game: GameController) {
        super(game)
    }

    enter(): void {
        this.onPlayState = false
    }

    update(): GameState {
        if (this.onPlayState) {
            return this.game.states[PlayState.key]
        }

        return this
    }

    exit(): void {
        
    }

    readonly onTilePointerDown = (value: Tile, index: number) => {
        if (!this.isActiveState || !CONST.levelMask[index] || !CONST.levelMask[this.game.player.index]) {
            return
        }

        const path = this.game.getPath(this.game.player.index, index)
        const toX = []
        const toY = []

        for (let i = 0; i < path.length; ++i) {
            const pos = this.game.tiles[path[i]].position
            toX.push(pos.x)
            toY.push(pos.y)
        }

        const from = {x: this.game.player.position.x, y: this.game.player.position.y}
        const to = {x: toX, y: toY}
        this.game.moveTween = 
            new TWEEN.Tween(from)
                .to(to, path.length * CONST.stepDuration)
                .onUpdate((value: {x: number, y: number}) => this.game.player.position.set(value.x, value.y))
                .easing(TWEEN.Easing.Linear.None)
                .interpolation(TWEEN.Interpolation.Linear)

        this.game.player.index = index

        this.onPlayState = true
    }
}
