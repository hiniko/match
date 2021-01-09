import GameEvents from "./Events";
import { Frames, Graphics } from "./Graphics"
import { OPS_TEXT_STYLE } from "./Styles";

const OPSBUTTON_RADIUS = 32
const HITAREA = new Phaser.Geom.Circle(32,32,32)

export enum OpType {
    Add,
    Subtract
}

interface OpsButtonConfig {
    scene: Phaser.Scene
    type: OpType
    defaultScale: number
}

export class OpsButton extends Phaser.GameObjects.Container {

    config : OpsButtonConfig
    sprite : Phaser.GameObjects.Sprite
    text : Phaser.GameObjects.Text

    constructor(config: OpsButtonConfig) {
        super(config.scene,)
        this.config = config
 
        this.sprite = new Phaser.GameObjects.Sprite(this.config.scene, 0, 0, Graphics.tileSheetKey)
        this.sprite.setFrame(Frames.Button)
        this.text = new Phaser.GameObjects.Text(this.config.scene, 0, -4, "-", OPS_TEXT_STYLE)

        this.text.setOrigin(0.5)
        this.sprite.setOrigin(0.5)
        // Half size this 
        this.add([this.sprite, this.text])
        this.setSize(64, 64)
        this.setInteractive(HITAREA, Phaser.Geom.Circle.Contains)
        this.setScale(config.defaultScale)
        this.setActive(false)
    }

    setEnabled(enabled: boolean) {
        if(enabled) {
            this.setActive(true)
            this.sprite.setActive(true)
            this.text.setActive(true)

            this.setInteractive(HITAREA, Phaser.Geom.Circle.Contains).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
                this.onClicked,
                this
            ).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_OVER,
                this.onPointerOver,
                this
            ).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_OUT,
                this.onPointerOut,
                this)
        }else{
            this.setInteractive(false)
                .removeAllListeners()
                .setActive(false)
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

    onPointerOver() {
        GameEvents.get().emit(GameEvents.OPS_BUTTON_POINTER_OVER, this)
    }

    onPointerOut() {
        GameEvents.get().emit(GameEvents.OPS_BUTTON_POINTER_OUT, this)
    }

    onClicked() {
        GameEvents.get().emit(GameEvents.OPS_BUTTON_CLICKED, this);
    }

}

const BUTTON_GROUP_PADDING = 12
const BUTTON_GROUP_HITAREA = (OPSBUTTON_RADIUS * 2) + BUTTON_GROUP_PADDING

export class OpsButtonGroup extends Phaser.GameObjects.Container {


    events: GameEvents = GameEvents.get()
    scene: Phaser.Scene
    buttons: OpsButton[] = []

    constructor(scene: Phaser.Scene, addButton: OpsButton, subButton: OpsButton) {
        super(scene)

        addButton.reset(OpType.Add)
        subButton.reset(OpType.Subtract)

        this.buttons.push(addButton, subButton)
        this.add(addButton)
        this.add(subButton)

        addButton.setPosition(0, 0)
        subButton.setPosition(Graphics.tileWidth + BUTTON_GROUP_PADDING)

        this.events.on(GameEvents.OPS_BUTTON_CLICKED, this.onOpsButtonClicked, this)
        this.events.on(GameEvents.OPS_BUTTON_POINTER_OVER, this.onOpsButtonPointerOver, this)
        this.events.on(GameEvents.OPS_BUTTON_POINTER_OUT, this.onOpsButtonPointerOut, this)
    }

    setEnabled(enabled: boolean) {
        if(enabled) {
            this.setActive(true)

            this.setInteractive(BUTTON_GROUP_HITAREA, Phaser.Geom.Circle.Contains).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
                this.onOpsButtonClicked,
                this
            ).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_OVER,
                this.onOpsButtonPointerOver,
                this
            ).on(
                Phaser.Input.Events.GAMEOBJECT_POINTER_OUT,
                this.onOpsButtonPointerOut,
                this)
        }else{
            this.setInteractive(false)
                .removeAllListeners()
                .setActive(false)
        }
    }

    onOpsButtonClicked(button: OpsButton) {
        button.sprite.setFrame(Frames.ButtonSelected)
    }

    onOpsButtonPointerOver(button: OpsButton) {
        this.scene.tweens.add({
        targets: button,
        ease: "Cubit.easeOut",
        props: {
            scale: { value: 0.5 }
        },
        duration: 150 
        })
    }

    onOpsButtonPointerOut(button: OpsButton) {
        this.scene.tweens.add({
        targets: button,
        ease: "Cubic.easeOut",
        props: {
            scale: { value: button.config.defaultScale }
        },
        duration: 150 
        })
    }

}