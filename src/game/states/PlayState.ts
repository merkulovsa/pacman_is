class PlayState extends GameState {
    static readonly key: string = "PlayState"

    constructor(game: GameController) {
        super(game)
    }

    enter(): void {

    }

    update(): GameState {
        return this
    }

    exit(): void {
        
    }
}
