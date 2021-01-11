import GameEvents from "./Events";
import { Frames, Graphics } from "./Graphics"
import { OPS_TEXT_STYLE_INACTIVE, OPS_TEXT_STYLE_SELECTED } from "./Styles";
import { Layout } from "./types"

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

    static idCount = -1

    static nextID(): integer{
        OpsButton.idCount++
        return OpsButton.idCount
    }

    config : OpsButtonConfig
    sprite : Phaser.GameObjects.Sprite
    text : Phaser.GameObjects.Text
    id : integer

    constructor(config: OpsButtonConfig) {
        super(config.scene,)
        this.config = config

        this.id = OpsButton.nextID()
 
        this.sprite = new Phaser.GameObjects.Sprite(this.config.scene, 0, 0, Graphics.tileSheetKey)
        this.sprite.setFrame(Frames.Button)
        this.text = new Phaser.GameObjects.Text(this.config.scene, 0, -4, "-", OPS_TEXT_STYLE_INACTIVE)

        this.text.setOrigin(0.5)
        this.sprite.setOrigin(0.5)
        // Half size this 
        this.add([this.sprite, this.text])
        this.setInteractive(HITAREA, Phaser.Geom.Circle.Contains)
        this.setScale(config.defaultScale)
        let bounds = this.getBounds()
        this.setSize(64, 64)
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

    setSelected(selected: Boolean) {
        if(selected) {
            this.sprite.setFrame(Frames.ButtonSelected)
            this.text.setStyle(OPS_TEXT_STYLE_SELECTED)
        }else{
            this.sprite.setFrame(Frames.ButtonInvalid)
            this.text.setStyle(OPS_TEXT_STYLE_INACTIVE)
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


const OPS_PANEL_BTN_SCALE = 0.4
const OPS_PANEL_BTN_SPACING = 0

export class OpsPanel extends Phaser.GameObjects.Container {

    events: GameEvents = GameEvents.get()
    scene: Phaser.Scene
    buttons: OpsButton[] = []
    buttonIDs: integer[] = []

    constructor(scene: Phaser.Scene) {
        super(scene)
        this.name = "OpsPanel"

        this.events.on(GameEvents.OPS_BUTTON_CLICKED, this.onOpsButtonClicked, this)
        this.events.on(GameEvents.OPS_BUTTON_POINTER_OVER, this.onOpsButtonPointerOver, this)
        this.events.on(GameEvents.OPS_BUTTON_POINTER_OUT, this.onOpsButtonPointerOut, this)

        let add = new OpsButton({
            scene: scene,
            defaultScale: OPS_PANEL_BTN_SCALE,
            type: OpType.Add
        }) 

        let sub = new OpsButton({
            scene: scene,
            defaultScale: OPS_PANEL_BTN_SCALE,
            type: OpType.Subtract
        }) 

        this.buttons.push(add, sub)
        this.buttonIDs.push(add.id, sub.id)
        this.add(sub)
        this.add(add)
        this.setActive(false)
    }

    reset(x: integer, y: integer, layout: Layout) {
        this.setEnabled(true)

        let addButton = this.buttons[0]
        let subButton = this.buttons[1]

        addButton.reset(OpType.Add)
        subButton.reset(OpType.Subtract)

        addButton.setPosition(0, 0)
        if(layout == Layout.Horizontal){
            subButton.setPosition(addButton.displayWidth + OPS_PANEL_BTN_SPACING, 0)
        }else{
            subButton.setPosition(0, addButton.displayHeight + OPS_PANEL_BTN_SPACING)
        }

        let bounds = this.getBounds()
        this.setSize(bounds.width, bounds.height)
        this.alpha = 0
        
        this.setPosition(x, y)
        this.setActive(true)
    }

    setEnabled(enabled: boolean) {
        if(enabled) {
            this.buttons.forEach(btn => btn.setEnabled(true))
            this.setActive(true)
            this.on(
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
            this.buttons.forEach(btn => btn.setEnabled(false))
            this.removeAllListeners()
                .setActive(false)
        }
    }

    isInGroup(button: OpsButton) : Boolean {
        return this.buttonIDs.filter((id: integer) => button.id == id).length > 0
    }

    onOpsButtonClicked(button: OpsButton) {
        if(!this.isInGroup(button)) return 
        button.setSelected(true)
    }

    onOpsButtonPointerOver(button: OpsButton) {
        if(!this.isInGroup(button)) return 

        this.scene.tweens.add({
        targets: button,
        ease: "Cubic.easeOut",
        props: {
            scale: { value: 0.5 }
        },
        duration: 150 
        })
    }

    onOpsButtonPointerOut(button: OpsButton) {
        if(!this.isInGroup(button)) return 

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