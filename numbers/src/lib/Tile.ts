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
      .on(
        Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
        this.onTileClicked,
        this
      );

    this.events.on(GameEvents.TILE_INVALID_SELECTION, this.onInvalidSelection, this);
    this.events.on(GameEvents.TILE_VALID_SELECTION, this.onValidSelection, this);
    this.events.on(GameEvents.TILE_DESELECTION, this.onDeselection, this);
    this.events.on(GameEvents.TILE_ACCEPT_SELECTION, this.onAccepted, this);
  }

  randomSpriteFrame(): string {
    return "tile" + Math.floor(Math.random() * this.config.spriteFrameRange);
  }

  reset(x: integer, y: integer, boardIndex: integer, value: integer) {
    this.config.boardIndex = boardIndex;
    this.config.value = value;
    this.container.setPosition(x, y);
    this.setActive(true);
    this.text.setText(value.toString());
  }

  setPosition(x: integer, y: integer) {
    this.container.setPosition(x, y, 0, 0);
  }

  onTileClicked(pointer, localX, localY, event) {
    GameEvents.get().emit(GameEvents.TILE_CLICKED, this.config.boardIndex);
  }

  onAccepted(dataIdx: integer, delayMultiplier: integer = 0) {
    if (dataIdx == this.config.boardIndex) {
      //this.setState(Tile.ACCEPTED)
      this.scene.tweens.add({
        targets: [this.sprite, this.text],
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0 },
        ease: "Back.easeInOut", // 'Cubic', 'Elastic', 'Bounce', 'Back'
        duration: 250,
        repeat: 0, // -1: infinity
        yoyo: false,
        delay: 50 * delayMultiplier,
      });
      return;
    }
  }

  onClick(pointer, localX, localY, event) {
    let val = GameEvents.get().emit(
      GameEvents.TILE_CLICKED,
      this.config.boardIndex
    );
  }

  onDeselection(dataIdx: integer, delayMultiplier: integer = 0) {
    if (dataIdx == this.config.boardIndex) {
      // this.setState(Tile.NORMAL)
      this.scene.tweens.add({
        targets: [this.sprite, this.text],
        alpha: { from: 1, to: 0.85 },
        scale: { from: 1, to: 0.9 },
        ease: "Back.easeInOut", // 'Cubic', 'Elastic', 'Bounce', 'Back'
        duration: 200,
        repeat: 0, // -1: infinity
        yoyo: true,
        callbackScope: this,
        delay: 50 * delayMultiplier,
        onComplete: () => {
          this.sprite.setFrame(this.currentSpriteFrame);
        },
      });
      return;
    }
  }

  onValidSelection(dataIdx: integer) {
    if (dataIdx == this.config.boardIndex) {
      // this.setState(Tile.VALID)
      this.sprite.setFrame("tileHilight");
      this.scene.tweens.add({
        targets: [this.sprite, this.text],
        scale: { from: 1, to: 1.1 },
        ease: "Back.easeInOut", // 'Cubic', 'Elastic', 'Bounce', 'Back'
        duration: 250,
        repeat: 0, // -1: infinity
        yoyo: true,
        callbackScope: this,
      });
      return;
    }
  }

  onInvalidSelection(dataIdx: integer) {
    if (dataIdx == this.config.boardIndex) {
      // this.setState(Tile.INVALID)
      this.sprite.setFrame("tileError");
      this.scene.tweens.add({
        targets: [this.sprite, this.text],
        alpha: { from: 1, to: 0.85 },
        angle: { from: 0, to: 25 },
        ease: "Back.easeInOut", // 'Cubic', 'Elastic', 'Bounce', 'Back'
        duration: 250,
        repeat: 0, // -1: infinity
        yoyo: true,
        callbackScope: this,
        onComplete: () => {
          GameEvents.get().emit(GameEvents.TILE_DESELECTION, dataIdx);
        },
      });
      return;
    }
  }
}
