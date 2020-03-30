///<reference path="./scene_designer.ts"/>
///<reference path="./game/game_controller.ts"/>

const APP = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xFFFFFF,
})
APP.ticker.add(() => onUpdate())
document.body.appendChild(APP.view)
const DESIGNER = SceneDesigner.instance
const GAME = new GameController()

function onUpdate(): void {
    TWEEN.update()
    GAME.update()
}

GAME.start()
