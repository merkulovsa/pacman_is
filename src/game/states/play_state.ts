class PlayState extends GameState {
    static readonly key: string = "PlayState"

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
        
    }
}
