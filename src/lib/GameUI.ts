import GameEvents from "./Events"
import { UI_TEXT_STYLE_TARGET, UI_TEXT_STYLE_OPERATIONS } from "./Styles"

interface GameUIConfig {
    scene: Phaser.Scene
    width: integer
    height: integer
}

export default class GameUI extends Phaser.GameObjects.Container {

    config: GameUIConfig
    events: GameEvents
    targetText: Phaser.GameObjects.Text
    operationsText: Phaser.GameObjects.Text

    constructor(config: GameUIConfig) {
        super(config.scene)

        this.config = config
        this.events = GameEvents.get()

        this.width = config.width
        this.height = config.height
    }

}