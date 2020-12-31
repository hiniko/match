import GameEvents from "./Events"

export interface NumberTileConfig{
    scene : Phaser.Scene
    value : integer 
    spriteKey : string
    spriteFrame: string 
    dataIndex : integer
}

export default class NumberTile extends Phaser.GameObjects.GameObject {

    static NORMAL = 0
    static VALID = 2
    static INVALID = 3
    static ACCEPTED = 4

    config : NumberTileConfig
    container: Phaser.GameObjects.Container
    sprite: Phaser.GameObjects.Sprite
    text: Phaser.GameObjects.Text
    selected: Boolean

    constructor(config: NumberTileConfig) {
        super(config.scene, "Number Tile " + config.dataIndex)

        this.config = config

        let evts = GameEvents.get()
        evts.on(GameEvents.TILE_INVALID_SELECTION, this.onInvalidSelection, this)
        evts.on(GameEvents.TILE_VALID_SELECTION, this.onValidSelection, this)
        evts.on(GameEvents.TILE_DESELECTION, this.onDeselection, this)
        evts.on(GameEvents.TILE_ACCEPT_SELECTION, this.onAccepted, this)

        this.setState(NumberTile.NORMAL)
    }

    onAccepted(dataIdx: integer, delayMultiplier: integer = 0) {
      if(dataIdx == this.config.dataIndex) {
        this.setState(NumberTile.ACCEPTED)  
        this.scene.tweens.add({
          targets: [this.sprite, this.text],
          alpha: { from: 1, to: 0},
          scale: {from: 1, to: 0},
          ease: 'Back.easeInOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
          duration: 250,
          repeat: 0,            // -1: infinity
          yoyo: false,
          delay: 50 * delayMultiplier, 
        })
        return;
      }
    }

    onClick(pointer, localX, localY, event) {
      let val = GameEvents.get().emit(GameEvents.TILE_CLICKED, this.config.dataIndex)
    }

    onDeselection(dataIdx: integer, delayMultiplier: integer = 0) {
      if(dataIdx == this.config.dataIndex) {
        this.setState(NumberTile.NORMAL)
        this.scene.tweens.add({
          targets: [this.sprite, this.text],
          alpha: { from: 1, to: 0.85 },
          scale: {from: 1, to: 0.9},
          ease: 'Back.easeInOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
          duration: 250,
          repeat: 0,            // -1: infinity
          yoyo: true,
          callbackScope: this,
          delay: 50 * delayMultiplier, 
          onComplete: () => {
            this.sprite.setFrame(this.config.spriteFrame)
          }
        })
        return;
      }
    }

    onValidSelection(dataIdx: integer) {
      if(dataIdx == this.config.dataIndex) {
        this.setState(NumberTile.VALID)
        this.sprite.setFrame("tileHilight")
        this.scene.tweens.add({
          targets: [this.sprite, this.text],
          scale: { from: 1, to: 1.1 },
          ease: 'Back.easeInOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
          duration: 250,
          repeat: 0,            // -1: infinity
          yoyo: true,
          callbackScope: this, 
        })
        return;
      }
    }

    onInvalidSelection(dataIdx: integer) {
      if(dataIdx == this.config.dataIndex) {
        this.setState(NumberTile.INVALID)
        this.sprite.setFrame("tileError")
        this.scene.tweens.add({
          targets: [this.sprite, this.text],
          alpha: { from: 1, to: 0.85 },
          angle: {from: 0, to: 25},
          ease: 'Back.easeInOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
          duration: 250,
          repeat: 0,            // -1: infinity
          yoyo: true,
          callbackScope: this,
          onComplete: () => {
            GameEvents.get().emit(GameEvents.TILE_DESELECTION, dataIdx)
          }
      })
        return;
      }
    }

    setPosition(x: integer, y: integer) {
        this.container.setPosition(x, y, 0, 0)
    }

}


