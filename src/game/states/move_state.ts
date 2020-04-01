class MoveState extends GameState {
    static readonly key: string = "MoveState"

    constructor(game: GameController) {
        super(game)
    }

    enter(): void {
        this.game.moveTween.start()
    }

    update(): GameState {
        if (this.game.moveTween.isPlaying()) {
            return this
        }

        return this.game.states[IdleState.key]
    }

    exit(): void {
        for (const tile of this.game.tiles) {
            tile.alpha = 1.0
        }
    }
}
