abstract class GameState {
    static readonly key: string = "GameState"

    protected readonly game: GameController

    protected constructor(game: GameController) {
        this.game = game
    }

    abstract enter(): void

    abstract update(): GameState

    abstract exit(): void

    readonly [key: string]: any
}
