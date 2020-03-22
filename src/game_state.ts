abstract class GameState {
    protected readonly gameController: GameController

    protected constructor(gameController: GameController) {
        this.gameController = gameController
    }

    abstract enter(): void

    abstract update(): GameState

    abstract exit(): void
}
