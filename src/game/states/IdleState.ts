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

    }
}
