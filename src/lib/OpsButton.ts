import GameEvents from "./Events";
import Graphics from "./Graphics"
import { OPS_TEXT_STYLE } from "./Styles";

const HITAREA = new Phaser.Geom.Circle(32,32,32)

export enum OpType {
    Add,
    Subtract
}

interface OpsButtonConfig {
    scene: Phaser.Scene
    type: OpType
}

export default class OpsButton extends Phaser.GameObjects.GameObject {

    config : OpsButtonConfig
    container: Phaser.GameObjects.Container
    sprite : Phaser.GameObjects.Sprite
    text : Phaser.GameObjects.Text

    constructor(config: OpsButtonConfig) {
        super(config.scene, "OpButton")
        this.config = config
 
        this.container = new Phaser.GameObjects.Container(this.config.scene)
        this.sprite = new Phaser.GameObjects.Sprite(this.config.scene, 0, 0, Graphics.tileSheet)
        this.sprite.setFrame(Graphics.opsTile)
        this.text = new Phaser.GameObjects.Text(this.config.scene, 0, -4, "-", OPS_TEXT_STYLE)

        this.text.setOrigin(0.5)
        this.sprite.setOrigin(0.5)
        //this.sprite.setScale(0.5)
        //this.text.setScale(0.75)
        // Half size this 
        this.container.add([this.sprite, this.text])
        this.container.setSize(64, 64)
        this.container.setInteractive(HITAREA, Phaser.Geom.Circle.Contains)
        this.container.setScale(0.5)

//        this.setActive(false)
    }

    setEnabled(enabled: boolean) {
        if(enabled) {
            this.setActive(true)
            this.container.setActive(true)
            this.sprite.setActive(true)
            this.text.setActive(true)

            this.container.setInteractive(HITAREA, Phaser.Geom.Circle.Contains).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
                this.onClicked,
                this
            ).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_OVER,
                this.onClicked,
                this
            ).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_OUT,
                this.onClicked,
                this)
        }else{
            this.container
                .setInteractive(false)
                .removeAllListeners()
                .setActive(false)
            this.setActive(false)
            this.sprite.setActive(false)
            this.text.setActive(false)
        }
    }

    reset(op: OpType) {
        this.sprite.alpha = 1
        this.text.setText(this.getOpText(op))
    }

    getOpText(op: OpType) : string {
        switch(op) {
            case OpType.Add: return "+";
            case OpType.Subtract: return "-";
            default: return "??";
        }
    }

    /*
     * Event Handlers
     */

    onClicked() {
        GameEvents.get().emit(GameEvents.OPS_BUTTON_CLICKED, this.config.type);
    }

}