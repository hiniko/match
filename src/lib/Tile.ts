import GameEvents from "./Events";
import { TEXT_STYLE } from "./Styles";

interface TileConfig {
  scene: Phaser.Scene;
  boardIndex: integer;
  spriteKey: string;
  spriteFrameRange: integer;
  active: boolean;
  tileWidth: integer;
  tileHeight: integer;
  tilePadding: integer; 
  value: integer;
}

export default class Tile extends Phaser.GameObjects.GameObject {
  static idCount: integer = -1;

  static nextID() {
    Tile.idCount++;
    return Tile.idCount;
  }

  id: integer;
  events: GameEvents;
  config: TileConfig;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  currentSpriteFrame: string;
  text: Phaser.GameObjects.Text;

  constructor(config: TileConfig) {
    super(config.scene, "Tile");

    this.config = config;

    this.id = Tile.nextID();
    this.events = GameEvents.get();

    this.setActive(false);

    this.container = new Phaser.GameObjects.Container(this.scene);
    this.container.setSize(config.tileWidth, config.tileHeight);

    this.currentSpriteFrame = this.randomSpriteFrame();
    this.sprite = this.scene.make.sprite({
      key: this.config.spriteKey,
      frame: this.currentSpriteFrame,
    });

    this.text = new Phaser.GameObjects.Text(this.scene, 0, 0, "-", TEXT_STYLE);
    this.text.setOrigin(0.5);
    this.text.setText("?");

    this.container.add([this.sprite, this.text]);
    this.container.sendToBack(this.sprite);

    this.container
      .setInteractive()
  }

  randomSpriteFrame(): string {
    return "tile" + Math.floor(Math.random() * this.config.spriteFrameRange);
  }

  reset(x: integer, y: integer, boardIndex: integer, value: integer) {
    this.setEnabled(true)
    this.config.boardIndex = boardIndex;
    this.config.value = value;
    this.container.setPosition(x, y);
    this.text.setText(value.toString());
  }

  setPosition(x: integer, y: integer) {
    this.container.setPosition(x, y, 0, 0);
  }

  setEnabled(enabled: boolean) {
    if(enabled) {
      this.container.setInteractive(true).on(
        Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
        this.onTileClicked,
        this
      );
      this.setActive(true)
      this.sprite.setActive(true)
      this.text.setActive(true)
      
    }else{
      this.container.setInteractive(false)
        .removeAllListeners()
      this.setActive(false)
      this.sprite.setActive(false)
      this.text.setActive(false)
    }
  }

  resetFrame() {
    this.sprite.setFrame(this.currentSpriteFrame);
  }

  setFrame(frame: string) {
    this.sprite.setFrame(frame)
  }

  // onTileDropped(row: integer, col: integer, oldboardIndex: integer, newBoardIndex: integer, dropCount: integer) {
  //   if(oldboardIndex != this.config.boardIndex)
  //     return 

  //   this.config.boardIndex = newBoardIndex

  //   // let newY = this.container.y + (this.config.tileHeight + (this.config.tilePadding * dropCount)) * dropCount 
  //    let newY = this.container.y + (this.config.tileHeight + this.config.tilePadding) * dropCount 

  //   this.scene.tweens.add({
  //       targets: [this.container],
  //       y: { from: this.container.y, to: newY},
  //       ease: "Bounce.easeInOut",
  //       duration: 500,
  //       repeat: 0,
  //       yoyo: false,
  //       //delay: 50 * delayMultiplier,
  //     });

  // }

  onTileClicked(pointer, localX, localY, event) {
    GameEvents.get().emit(GameEvents.BOARD_TILE_CLICKED, this.config.boardIndex);
  }

}
