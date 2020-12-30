export interface NumberTileConfig{
    scene : Phaser.Scene
    value : integer 
    spriteKey : string
    spriteFrame: string 
    dataIndex : integer
}

export default class NumberTile extends Phaser.GameObjects.GameObject {

    config : NumberTileConfig
    container: Phaser.GameObjects.Container
    sprite: Phaser.GameObjects.Sprite
    text: Phaser.GameObjects.Text
    selected: Boolean

    constructor(config: NumberTileConfig) {
        super(config.scene, "Number Tile " + config.dataIndex)

        this.config = config

        this.sprite = config.scene.make.sprite({ 
            key: config.spriteKey,
            frame: config.spriteFrame
        });

        this.text = new Phaser.GameObjects.Text(config.scene, 0, 0, config.value.toString(),{ 
            fontFamily: "NunitoExtraBold", 
            fontSize: "24px",
            shadow: {
                offsetX: 2,
                offsetY: 2, 
                color: "#000000",
                fill: true
            }
        });

        this.text.setOrigin(0.5)

        this.text.setText(this.config.value.toString())
        this.container = config.scene.make.container({})
        this.container.setSize(64,64)

        this.container.setInteractive().on('pointerdown', this.onClick, this);

        this.container.add(this.sprite)
        this.container.add(this.text)
        this.container.sendToBack(this.sprite)
    }

    onClick(pointer, localX, localY, event) {
        this.setSelected()
        let val = this.emit("tileClicked", this)
        console.log(val)
    }

    setSelected(){
        this.selected = !this.selected

        if(this.selected) {
            this.sprite.setFrame("tileHilight")
        }else{
            this.sprite.setFrame(this.config.spriteFrame)
        }
    }

    setPosition(x: integer, y: integer) {
        this.container.setPosition(x, y, 0, 0)
    }

}


