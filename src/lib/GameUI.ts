import GameEvents from "./Events"
import { OpType } from "./OpsButton"
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
        
        this.targetText = new Phaser.GameObjects.Text(config.scene, 0, 0, "0", UI_TEXT_STYLE_TARGET)
        this.operationsText = new Phaser.GameObjects.Text(config.scene, 0, 50, "", UI_TEXT_STYLE_OPERATIONS)

        this.targetText.setOrigin(0.5)
        this.operationsText.setOrigin(0.5)

        this.events.on(GameEvents.LOGIC_NEW_TARGET, this.onTargetUpdate, this)
        this.events.on(GameEvents.LOGIC_VALID_SELECTION, this.onValidSelection, this)
        this.events.on(GameEvents.LOGIC_ACCEPT_SELECTION, this.onAcceptSolution, this)

        this.add(this.targetText)
        this.add(this.operationsText)
    }

    onAcceptSolution() {
        this.operationsText.setText("")
    }

    onValidSelection(idx: integer, number: integer, op: OpType) {
        let symbol = ""
        switch(op) {
            case OpType.Add: symbol = " +"; break
            case OpType.Subtract: symbol = " -"; break
        }
        this.operationsText.setText(this.operationsText.text + symbol + " " + number)
    }
 
    onTargetUpdate(target: integer) {
        this.scene.tweens.add({
            targets: this.targetText,
            duration: 100,
            yoyo: true,
            onYoyoScope: this,
            onYoyo(){
                this.targetText.setText(target.toString())
            },
            props: {
                scale: { value: 0},
                angle: { value: 180 }
            }
        }) 
    }



}