///<reference path="./scene_designer.ts"/>

const APP = new PIXI.Application({
    width: CONST.windowWidth,
    height: CONST.windowHeight,
})
APP.ticker.add(() => onUpdate())
document.body.appendChild(APP.view)

function onUpdate(): void {
    TWEEN.update()
}

(() => SceneDesigner.instance)()