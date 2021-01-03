import GameEvents from "./Events";
import GameBoard from "./GameBoard";
import Tile from "./Tile";

export interface GameBoardDisplayConfig {
  scene: Phaser.Scene;
  gameBoard: GameBoard;
  spriteKey: string;
  spriteFrameCount: integer;
  tileHeight: integer;
  tileWidth: integer;
  tilePadding: integer;
}

interface TileDrop {
  dataIndex: integer;
  to: integer;
}

const UPDATING = "updating";
const IDLE = "idle"

export default class GameBoardDisplay extends Phaser.GameObjects.GameObject {
  config: GameBoardDisplayConfig;
  events: GameEvents;
  scene: Phaser.Scene;
  group: Phaser.GameObjects.Group;
  board: GameBoard;
  timeline: Phaser.Tweens.Timeline;
  tiles: Tile[] = [];
  container: Phaser.GameObjects.Container;

  animLockCount: integer = 0;
  // Really, anim queue needs Phaser.Types.Tweens.TweenBuilderConfig[][] however the builders 
  // in phaser scan for properties in the object, which is fine in JS but not TS;
  animQueue = [];

  constructor(config: GameBoardDisplayConfig) {
    super(config.scene, "GameBoardDisplay for " + config.gameBoard.name);

    this.config = config;
    this.events = GameEvents.get();
    this.group = new Phaser.GameObjects.Group(this.scene);
    this.container = new Phaser.GameObjects.Container(this.scene);
    this.timeline = this.scene.tweens.createTimeline();

    this.events.on( GameEvents.TILE_INVALID_SELECTION,
      this.onInvalidSelection,
      this
    );
    this.events.on(
      GameEvents.TILE_VALID_SELECTION,
      this.onValidSelection,
      this
    );
    this.events.on(GameEvents.TILE_DESELECTION, this.onDeselection, this);
    this.events.on(GameEvents.TILE_ACCEPT_SELECTION, this.onAccepted, this);
    this.events.on(GameEvents.TILE_DROPPED, this.onTileDropped, this);
    this.events.on(GameEvents.BOARD_NEW_ANIMATIONS, this.checkAnimations, this)

    this.createTiles();
    this.setState(IDLE)
  }

  private createTiles() {
    console.log("Generating Tiles...");
    for (
      let i = 0;
      i < this.config.gameBoard.boardSize + Math.floor(this.config.gameBoard.boardSize / 2);
      i++
    ) {
      let tile = new Tile({
        scene: this.scene,
        active: false,
        boardIndex: -1,
        spriteFrameRange: this.config.spriteFrameCount,
        spriteKey: this.config.spriteKey,
        tileWidth: this.config.tileWidth,
        tileHeight: this.config.tileHeight,
        tilePadding: this.config.tilePadding,
        value: 0,
      });

      this.group.add(tile);
    }
  }

  createBoard() {
    let x = 0;
    let y = 0;

    for (var i = 0; i < this.config.gameBoard.boardSize; i++) {
      let newRow =
        i %
          (this.config.gameBoard.boardSize /
            this.config.gameBoard.config.height) ==
        0;

      if (newRow) {
        x = 0;
        y += this.config.tileHeight + this.config.tilePadding;
      }

      let tile = this.getNextTile();
      let value = this.config.gameBoard.boardData[i];

      tile.reset(x, y, i, value);

      x += this.config.tileWidth + this.config.tilePadding;

      this.container.add(tile.container);
      this.tiles[i] = tile;
    }
  }

  setPosition(x: integer, y: integer) {
    this.container.setPosition(x, y, 0, 0);
  }

  private getNextTile(): Tile {
    let tile = this.group.getFirstDead(false);
    if (tile === null) {
      console.error("Failed to get a dead tile from the group");
      throw Error("Failed to get a dead tile from the group");
    }
    return tile;
  }

  enqueueAnim(tweens) {
    if(!Array.isArray(tweens)) {
      this.animQueue.push([tweens])
    }else {
      this.animQueue.push(tweens)
    }
    this.events.emit(GameEvents.BOARD_NEW_ANIMATIONS, this.checkAnimations)
  }

  checkAnimations() {
    if (this.animQueue.length > 0 && this.animLockCount == 0) {
      this.setState(UPDATING)
      let tweens = this.animQueue.pop();
      this.animLockCount = tweens.length;
      tweens.forEach((tween: Phaser.Types.Tweens.TweenBuilderConfig) => {
        // wrap the orignal call back in order to manage animLock count on complete
        let complete = tween.onComplete;
        tween.onComplete = (
          tween: Phaser.Tweens.Tween,
          targets: any[],
          ...param: any[]
        ) => {
          if (complete) {
            complete(tween, targets, param);
          }
          this.animLockCount--;
          this.events.emit(GameEvents.BOARD_NEW_ANIMATIONS, this.checkAnimations)
        };
        this.scene.tweens.add(tween);
      });
    }else{
      this.setState(IDLE)
    }
  }

  /*
   * Event Handlers
   */

  onTileDropped(dropData: integer[][]) {
    console.log("----- TILES DROPPED -----")
    console.log(dropData)
    console.log(this.tiles)
    console.log(this.tiles.map((tile) => tile?.config.value))
    console.log(this.tiles.map((tile) => tile?.config.boardIndex))

    let tweens = []
    console.log("--- DOING TRANSFROM ---")
    for(let i=0; i< dropData.length; i++ ){

      let oldBoardIndex = dropData[i][0]
      let newBoardIndex = dropData[i][1]
      let dropCount = dropData[i][2]

      if(newBoardIndex == null) {
        this.tiles[oldBoardIndex].setEnabled(false)
        this.tiles[oldBoardIndex] = null
        console.log(dropData[i])
        continue
      }
       
      console.log(dropData[i])

      // Update Tile
      let tile = this.tiles[oldBoardIndex]
      this.tiles[newBoardIndex] = tile 
      tile.config.boardIndex = newBoardIndex
      this.tiles[oldBoardIndex] = null

      // Move tiles in array

      let newY =
        tile.container.y + (this.config.tileHeight + this.config.tilePadding) * dropCount;

      // Queue a remove tween for the tile
      tweens.push({
        targets: this.tiles[newBoardIndex].container,
        y: { from: this.tiles[newBoardIndex].container.y, to: newY },
        ease: "Bounce.easeOutIn",
        duration: 250,
      });
    }
    this.enqueueAnim(tweens)

    console.log(this.tiles)
    console.log(this.tiles.map((tile) => tile?.config.value))
    console.log(this.tiles.map((tile) => tile?.config.boardIndex))
    console.log("----- TILES DROPPED END-----")
  }

  onAccepted(acceptedIdxs: integer[]) {
    console.log("----- TILES ACCEPTED -----")
    let tweens = []
    acceptedIdxs.forEach((dataIdx: integer, selIdx: integer) => {
      this.tiles[dataIdx].setEnabled(false);
      tweens.push({
        targets: [this.tiles[dataIdx].container],
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0 },
        ease: "Back.easeInOut",
        duration: 250,
        repeat: 0,
        yoyo: false,
        delay: 50 * selIdx,
        callbackScope: this,
        onStart: () => {
          //this.tiles[dataIdx].setEnabled(false)
          //this.tiles[dataIdx] = null
        },
      });
    })
    this.enqueueAnim(tweens)
    console.log("----- TILES ACCEPTED END -----")
  }

  onDeselection(dataIdxs: integer[]) {
    let tweenConfigs = [];
    dataIdxs.forEach((dataIdx, idx) => {
      tweenConfigs.push({
        targets: this.tiles[dataIdx].container,
        alpha: { from: 1, to: 0.85 },
        scale: { from: 1, to: 0.9 },
        ease: "Back.easeInOut",
        duration: 250,
        delay: 50 * idx,
        yoyo: true,
        onYoyoScope: this,
        onYoyo: () => {
          this.tiles[dataIdx].resetFrame();
        },
      });
    });
    this.enqueueAnim(tweenConfigs);
  }

  onValidSelection(dataIdx: integer) {
    // if(this.state != IDLE)
    //   return

    this.scene.tweens.add({
      targets: [this.tiles[dataIdx].container],
      scale: { from: 1, to: 1.1 },
      ease: "Back.easeInOut",
      duration: 250,
      repeat: 0,
      yoyo: true,
      onYoyoScope: this,
      onYoyo: () => {
        this.tiles[dataIdx].setFrame("tileHilight");
      },
    });
  }

  onInvalidSelection(dataIdx: integer) {
    // if(this.state != IDLE)
    //   return

    this.scene.tweens.add({
      targets: [this.tiles[dataIdx].container],
      alpha: { from: 1, to: 0.85 },
      angle: { from: 0, to: 25 },
      ease: "Back.easeInOut",
      duration: 250,
      repeat: 0,
      yoyo: true,
      callbackScope: this,
      onStart: () => {
        this.tiles[dataIdx].setFrame("tileError");
      },
      onComplete: () => {
        this.tiles[dataIdx].resetFrame();
      },
    });
  }
}
