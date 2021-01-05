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

interface AnimationSlot {
  blocking: boolean
  tweens : Phaser.Types.Tweens.TweenBuilderConfig[]
}

const UPDATING = "updating";
const IDLE = "idle";

export default class GameBoardDisplay extends Phaser.GameObjects.GameObject {
  config: GameBoardDisplayConfig;
  events: GameEvents;
  scene: Phaser.Scene;
  tileGroup: Phaser.GameObjects.Group;
  board: GameBoard;
  timeline: Phaser.Tweens.Timeline;
  activeTiles: Tile[] = [];
  container: Phaser.GameObjects.Container;

  animLockCount: integer = 0;
  // Really, anim queue needs Phaser.Types.Tweens.TweenBuilderConfig[][] however the builders
  // in phaser scan for properties in the object, which is fine in JS but not TS;
  animQueue = [];

  constructor(config: GameBoardDisplayConfig) {
    super(config.scene, "GameBoardDisplay for " + config.gameBoard.name);

    this.config = config;
    this.events = GameEvents.get();
    this.tileGroup = new Phaser.GameObjects.Group(this.scene);
    this.container = new Phaser.GameObjects.Container(this.scene);
    this.timeline = this.scene.tweens.createTimeline();

    this.events.on(GameEvents.LOGIC_INVALID_SELECTION, this.onInvalidSelection, this);
    this.events.on(GameEvents.LOGIC_VALID_SELECTION, this.onValidSelection, this);
    this.events.on(GameEvents.LOGIC_UNSELECTION, this.onUnselection, this);
    this.events.on(GameEvents.LOGIC_BOARD_UPDATED, this.onBoardUpdated, this);
    this.events.on(GameEvents.LOGIC_CLEAR_SELECTION, this.onClearSelection, this);

    this.events.on(GameEvents.BOARD_UPDATE_ANIMATIONS, this.checkAnimations, this);
    this.events.on(GameEvents.BOARD_TILE_CLICKED, this.onTileClicked, this)

    let spaceKey = this.scene.input.keyboard.addKey("Space")
    spaceKey.on('down', this.onSpaceKeyDown, this)

    this.createTiles();
    this.setState(IDLE);
  }


  private createTiles() {
    console.log("Generating Tiles...");
    for (
      let i = 0;
      i <
      this.config.gameBoard.boardSize +
        Math.floor(this.config.gameBoard.boardSize / 2);
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

      this.tileGroup.add(tile);
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
      this.activeTiles[i] = tile;
    }
  }

  setPosition(x: integer, y: integer) {
    this.container.setPosition(x, y, 0, 0);
  }

  private getNextTile(): Tile {
    let tile = this.tileGroup.getFirstDead(false);
    if (tile === null) {
      console.error("Failed to get a dead tile from the group");
      throw Error("Failed to get a dead tile from the group");
    }
    return tile;
  }

  enqueueAnim(slot: AnimationSlot) {
    this.animQueue.push(slot)
    this.events.emit(GameEvents.BOARD_UPDATE_ANIMATIONS, this.checkAnimations);
  }

  checkAnimations() {
    if(this.animLockCount > 0) return
    else this.setState(IDLE);

    if (this.animQueue.length > 0) {
      let slot = this.animQueue.pop();

      if(slot.blocking)
        this.setState(UPDATING);

      this.animLockCount = slot.tweens.length;

      slot.tweens.forEach((tween: Phaser.Types.Tweens.TweenBuilderConfig) => {
        // wrap the orignal call back in order to manage animLock count on complete
        let complete = tween.onComplete;
        tween.onComplete = ( tween: Phaser.Tweens.Tween, targets: any[], ...param: any[]) => {
          if (complete) 
            complete(tween, targets, param);

          this.animLockCount--;
          this.events.emit(
            GameEvents.BOARD_UPDATE_ANIMATIONS,
            this.checkAnimations
          );
        };
        this.scene.tweens.add(tween);
      });
    }
  }

  /*
   * Event Handlers
   */

  onSpaceKeyDown() {
    if(this.state != IDLE) return
    this.setState(UPDATING)
    this.events.emit(GameEvents.LOGIC_ACCEPT_SELECTION)
  }

  onTileClicked(boardIdx: integer) {
    console.log(this.state)
    console.log(this.animQueue)
    this.checkAnimations()
    if(this.state != IDLE) return
    this.events.emit(GameEvents.LOGIC_UPDATE_SELECTION, boardIdx)
  }

  onBoardUpdated(dropData: integer[][], newIdxs: integer[][]) {

    let dropSlot: AnimationSlot = {
      blocking: true,
      tweens: []
    }

    let newSlot: AnimationSlot = {
      blocking: true,
      tweens: []
    }

    // Drop tiles 
    for (let i = 0; i < dropData.length; i++) {
      let oldBoardIndex = dropData[i][0];
      let newBoardIndex = dropData[i][1];
      let dropCount = dropData[i][2];

      if (newBoardIndex == null) {
        this.activeTiles[oldBoardIndex].setEnabled(false);
        this.activeTiles[oldBoardIndex] = null;
        console.log(dropData[i]);
        continue;
      }

      // Update Tile
      let tile = this.activeTiles[oldBoardIndex];
      this.activeTiles[newBoardIndex] = tile;
      tile.config.boardIndex = newBoardIndex;
      this.activeTiles[oldBoardIndex] = null;

      // Queue a remove tween for the tile
      let newY =
        tile.container.y +
        (this.config.tileHeight + this.config.tilePadding) * dropCount;

      let row = this.config.gameBoard.getRow(tile.config.boardIndex)
      let duration = 250 
      let rowOffset = duration / this.config.gameBoard.config.width

      console.log(row, duration, rowOffset)

      dropSlot.tweens.push({
        targets: this.activeTiles[newBoardIndex].container,
        props: {
         y: { value: newY }
        },
        ease: "Bounce.easeOut",
        delay: duration - (row * rowOffset),
        duration: duration,
      });
    }
    this.enqueueAnim(dropSlot);

    for(let i=0; i<dropData.length; i++) {
      // need to find right y to dorp them in and decide spawn drop point
      let tile: Tile = this.tileGroup.get()
      tile.reset
    }

  }

  onClearSelection(acceptedIdxs: integer[]) {
    let slot = {
      blocking: true,
      tweens: []
    }
    acceptedIdxs.forEach((dataIdx: integer, selIdx: integer) => {
      this.activeTiles[dataIdx].setEnabled(false);
      slot.tweens.push({
        targets: [this.activeTiles[dataIdx].container],
        props: {
          alpha: { value: 0 },
          scale: { from: 0 },
        },
        ease: "Back.easeInOut",
        duration: 200,
        delay: 30 * selIdx,
      });
    });
    this.enqueueAnim(slot);
  }

  onUnselection(dataIdxs: integer[]) {
    let slot: AnimationSlot = {
      blocking: true,
      tweens: []
    }
    dataIdxs.forEach((dataIdx, idx) => {
      slot.tweens.push({
        targets: this.activeTiles[dataIdx].container,
        props: {
          alpha: { value: 0.85 },
          scale: { value: 0.9 },
        },
        ease: "Back.easeInOut",
        duration: 250,
        delay: 50 * idx,
        yoyo: true,
        onYoyoScope: this,
        onYoyo: () => {
          this.activeTiles[dataIdx].resetFrame();
        },
      });
    });
    this.enqueueAnim(slot);
  }

  onValidSelection(dataIdx: integer) {
    this.activeTiles[dataIdx].setFrame("tileHilight");
    this.scene.tweens.add({
      targets: [this.activeTiles[dataIdx].container],
      scale: { from: 1, to: 1.1 },
      ease: "Back.easeInOut",
      duration: 250,
      yoyo: true

    });
  }

  onInvalidSelection(dataIdx: integer) {
    this.scene.tweens.add({
      targets: [this.activeTiles[dataIdx].container],
      alpha: { from: 1, to: 0.85 },
      angle: { from: 0, to: 25 },
      ease: "Back.easeInOut",
      duration: 250,
      repeat: 0,
      yoyo: true,
      callbackScope: this,
      onStart: () => {
        this.activeTiles[dataIdx].setFrame("tileError");
      },
      onComplete: () => {
        this.activeTiles[dataIdx].resetFrame();
      },
    });
  }
}
