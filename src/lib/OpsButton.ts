import GameEvents from "./Events";
import { Frames, Graphics } from "./Graphics"
import { OPS_TEXT_STYLE_INACTIVE, OPS_TEXT_STYLE_SELECTED } from "./Styles";
import { Layout, Neighbour as Neighbour, Position } from "./types"

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
    opType: OpType

    constructor(config: OpsButtonConfig) {
        super(config.scene,)
        this.config = config

        this.id = OpsButton.nextID()
 
        this.sprite = new Phaser.GameObjects.Sprite(this.config.scene, 0, 0, Graphics.tileSheetKey)
        this.sprite.setFrame(Frames.Button)
        this.text = new Phaser.GameObjects.Text(this.config.scene, 0, -4, "-", OPS_TEXT_STYLE_INACTIVE)
        this.opType = config.type

        this.text.setOrigin(0.5)
        this.sprite.setOrigin(0.5)
        // Half size this 
        this.add([this.sprite, this.text])
        this.setInteractive(HITAREA, Phaser.Geom.Circle.Contains)
        this.setScale(config.defaultScale)
        this.setSize(64, 64)
        this.text.setText(this.getOpText(this.opType))
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

    reset() {
        this.alpha = 1
        this.scale = this.config.defaultScale
        this.text.setStyle(OPS_TEXT_STYLE_INACTIVE)
        this.sprite.setFrame(Frames.Button)
        this.setPosition(0,0)
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
    layout: Layout
    selected: Boolean
    boardIdx: integer
    neighbour: Neighbour

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

    reset(boardIdx: integer, x: integer, y: integer, layout: Layout, neighbour: Neighbour) {

        this.layout = layout
        this.selected = false
        this.boardIdx = boardIdx
        this.neighbour = neighbour 
        this.alpha = 0
        this.scale = 1

        this.buttons.forEach((btn) => {
            btn.reset()
        })

        this.setEnabled(true)

        let addButton = this.buttons[0]
        let subButton = this.buttons[1]

        addButton.setPosition(0, 0)
        if(layout == Layout.Horizontal){
            subButton.setPosition(addButton.displayWidth + OPS_PANEL_BTN_SPACING, 0)
        }else{
            subButton.setPosition(0, subButton.displayHeight + OPS_PANEL_BTN_SPACING)
        }

        let bounds = this.getBounds()
        this.setSize(bounds.width, bounds.height)
        
        this.setPosition(x, y)
        this.setActive(true)
    }

    setEnabled(enabled: boolean) {
        if(enabled) {
            this.buttons.forEach(btn => { btn.setEnabled(true) })
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

            this.events.on(GameEvents.OPS_PANEL_HIDE, this.onHidePanel, this)
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
        if(this.selected) return 

        this.selected = true
        button.setSelected(true)
        button.setEnabled(false)

        // hide the other buttons
        this.buttons
            .filter((btn) => btn.id != button.id)
            .forEach((btn) => {
                btn.setEnabled(false)
                this.scene.tweens.add({
                    targets: btn,
                    ease: "Sine.In",
                    duration: 150,
                    props: {
                        alpha: { value: 0},
                        scale: { value: 0}
                    },
                })
            })

        // Move the last button to the middle 
        if(this.layout == Layout.Vertical){
            this.scene.tweens.add({
                targets: button,
                ease: "Sine.In",
                duration: 50,
                props: {
                    y: (this.height / 2) - 12 
                }
            })    
        }else {
            this.scene.tweens.add({
                targets: button,
                ease: "Sine.In",
                duration: 50,
                props: {
                    x: (this.width / 2) - 12
                }
            })    
        }


        // Get the other panels to hide
        GameEvents.get().emit(GameEvents.OPS_PANEL_HIDE, this.boardIdx);
        GameEvents.get().emit(GameEvents.OPS_PANEL_SELECTED, this, this.neighbour, button.opType)
    }

    onOpsButtonPointerOver(button: OpsButton) {
        if(!this.isInGroup(button)) return 
        if(this.selected) return 

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
        if(this.selected) return 

        this.scene.tweens.add({
            targets: button,
            ease: "Cubic.easeOut",
            duration: 150 ,
            props: {
                scale: { value: button.config.defaultScale }
            }
        })
    }

    onHidePanel(boardIdx: integer) {
        if(this.boardIdx != boardIdx) return
        if(this.selected) return
        this.scene.tweens.add({
            targets: this,
            duration: 150,
            props: {
                alpha: 0
            },
            onCompleteScope: this,
            onComplete() {
                this.setEnabled(false)
            }
        })
    }

}