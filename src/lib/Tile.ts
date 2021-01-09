import GameEvents from "./Events";
import { TILE_TEXT_STYLE } from "./Styles";

interface TileConfig {
  scene: Phaser.Scene;
  boardIndex: integer;
  spriteKey: string;
  spriteFrameRange: integer;
  tileWidth: integer;
  tileHeight: integer;
  tilePadding: integer; 
  value: integer;
}

const HITAREA = new Phaser.Geom.Rectangle(0,0,64,64)

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
  currentSpriteFrame: integer;
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

    this.text = new Phaser.GameObjects.Text(this.scene, 0, 0, "-", TILE_TEXT_STYLE);
    this.text.setScale(0.5)
    this.text.setOrigin(0.5);
    this.text.setText("?");

    this.container.add([this.sprite, this.text]);
    this.container.sendToBack(this.sprite);

    this.container
      .setInteractive()
  }

  randomSpriteFrame(): integer {
    return Math.floor(Math.random() * this.config.spriteFrameRange);
  }

  reset(x: integer, y: integer, boardIndex: integer, value: integer) {
    this.setEnabled(true)
    this.config.boardIndex = boardIndex;
    this.config.value = value;
    this.container.setPosition(x, y);
    this.container.alpha = 1
    this.container.scale = 1
    this.text.setText(value.toString());
    this.sprite.setFrame(this.randomSpriteFrame())
  }

  setPosition(x: integer, y: integer) {
    this.container.setPosition(x, y, 0, 0);
  }

  setEnabled(enabled: boolean) {
    if(enabled) {
      this.container.setInteractive(HITAREA, Phaser.Geom.Rectangle.Contains).on(
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
        this
      );
      this.setActive(true)
      this.container.setActive(true)
      this.sprite.setActive(true)
      this.text.setActive(true)
      
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

  resetFrame() {
    this.sprite.setFrame(this.currentSpriteFrame);
  }

  setFrame(frame: integer) {
    this.sprite.setFrame(frame)
  }

  onClicked() {
    GameEvents.get().emit(GameEvents.TILE_CLICKED, this.config.boardIndex);
  }

  onPointerOver(){
    GameEvents.get().emit(GameEvents.TILE_POINTER_OVER, this.config.boardIndex);
  }

  onPointerOut() {
    GameEvents.get().emit(GameEvents.TILE_POINTER_OUT, this.config.boardIndex);
  }
}
