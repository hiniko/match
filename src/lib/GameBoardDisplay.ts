import GameEvents from "./Events";
import GameBoard from "./GameBoard";
import { TileData, DropData, NewData} from "./GameBoard";
import Tile from "./Tile";
import { Frames, Graphics } from "./Graphics"
import { Layout, Neighbour, Position } from "./Types"

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

const UPDATING = "updating"
const IDLE = "idle"

const FALL_DURATION = 350
const MAGIC_SPACING_BULLSHIT = 12

export default class GameBoardDisplay extends Phaser.GameObjects.GameObject {
  config: GameBoardDisplayConfig;
  events: GameEvents;
  scene: Phaser.Scene;
  tileGroup: Phaser.GameObjects.Group;
  timeline: Phaser.Tweens.Timeline;
  selectedTiles: Tile[] = []
  activeTiles: Tile[] = [];
  container: Phaser.GameObjects.Container;

  objectPoolSize = 0

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

    this.events.on(GameEvents.LOGIC_BOARD_UPDATED, this.onBoardUpdated, this);
    this.events.on(GameEvents.BOARD_UPDATE_ANIMATIONS, this.checkAnimations, this);

    this.events.on(GameEvents.TILE_CLICKED, this.onTileClicked, this)
    this.events.on(GameEvents.TILE_POINTER_OVER, this.onTilePointerOver, this)
    this.events.on(GameEvents.TILE_POINTER_OUT, this.onTilePointerOut, this)

    this.objectPoolSize = 
      this.config.gameBoard.boardSize + Math.floor(this.config.gameBoard.boardSize / 2)

    ;
    this.createTiles();
    this.setState(IDLE);
  }

  private createTiles() {
    for ( let i = 0; i < this.objectPoolSize; i++) {
      let tile = new Tile({
        scene: this.scene,
        boardIndex: -1,
        spriteFrameRange: this.config.spriteFrameCount,
        spriteKey: this.config.spriteKey,
        tileWidth: this.config.tileWidth,
        tileHeight: this.config.tileHeight,
        tilePadding: this.config.tilePadding,
        value: 0,
      })
      tile.setEnabled(false)
      this.tileGroup.add(tile)
    }
  }

  assembleBoard() {
    let x = 0;
    let y = 0;

    // Create board
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
      let tileData = this.config.gameBoard.boardData[i];

      tile.reset(x, y, i, tileData.type);

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
    }else {
      this.events.checkDeferred()
    }

  }

  /*
   * Event Handlers
   */
  onTileClicked(boardIdx: integer) {
    if(this.state != IDLE) return
    this.events.emit(GameEvents.BOARD_TILE_SELECTED, boardIdx, null)
  }

  onTilePointerOver(boardIdx: integer) {
  }

  onTilePointerOut(boardIdx: integer) {
  }

  onBoardUpdated(dropData: DropData[], newData: NewData[]) {

    if(this.state != IDLE) {
      this.events.defer({
        name: "GameBoardDisplay.onBoardUpdated", 
        callback: (args:any[]) => {
          this.onBoardUpdated(args[0], args[1])
        },
        callbackContext: this,
        args: [dropData, newData]
      })
      return;
    }

    let dropSlot: AnimationSlot = {
      blocking: true,
      tweens: []
    }

    // Drop tiles 
    for (let i = 0; i < dropData.length; i++) {

      let oldBoardIndex = dropData[i].idx;
      let newBoardIndex = dropData[i].newIdx;
      let dropCount = dropData[i].dropCount;

      if (newBoardIndex == null) {
        this.activeTiles[oldBoardIndex].setEnabled(false);
        this.container.remove(this.activeTiles[oldBoardIndex])
        this.activeTiles[oldBoardIndex] = null;
        continue;
      }

      // Update Tile
      let tile = this.activeTiles[oldBoardIndex];
      this.activeTiles[newBoardIndex] = tile;
      tile.config.boardIndex = newBoardIndex;
      this.activeTiles[oldBoardIndex] = null;

      let newY =
        tile.container.y +
        (this.config.tileHeight + this.config.tilePadding) * dropCount;

      let row = this.config.gameBoard.getRow(newBoardIndex);

      this.queueDropTween(tile, dropSlot, newY, row, FALL_DURATION)

    }

    for(let i=0; i<newData.length; i++) {

      let idx = newData[i].idx
      let data = newData[i].data
      let col = newData[i].col
      let row = newData[i].row

      // get a tile and place drop it into the board
      let tile: Tile = this.tileGroup.get()

      let x = (col * this.config.tileWidth) + (this.config.tilePadding * col)
      let y = 0 
      let newY = ((row + 1) * this.config.tileHeight) + (this.config.tilePadding * (row + 1))

      tile.reset(x, y, idx, data.type)
      this.activeTiles[idx] = tile

      this.queueDropTween(tile, dropSlot, newY, row, FALL_DURATION)
    }

    this.enqueueAnim(dropSlot);
  }

  queueDropTween(tile: Tile, slot: AnimationSlot, y: integer, row: integer, duration: integer) {
    let rowOffset = duration / this.config.gameBoard.config.width

    slot.tweens.push({
      targets: tile.container,
      props: {
        y: { value: y }
      },
      ease: "Bounce.easeOut",
      delay: duration - (row * rowOffset),
      duration: duration,
    });
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
          scale: { value: 0 },
        },
        ease: "Back.easeInOut",
        duration: 200,
        delay: 30 * selIdx,
      });
    });

    this.selectedTiles.length = 0

    this.enqueueAnim(slot);
  }

  onUnselection(dataIdxs: integer[], rejection: Boolean = false) {
    let slot: AnimationSlot = {
      blocking: true,
      tweens: []
    }

    dataIdxs.forEach((dataIdx, idx) => {
      let tile = this.selectedTiles.pop()
      if(rejection) {
        tile.setFrame(Frames.TileError)
      }
      // Animate the tile away
      slot.tweens.push({
        targets: tile.container,
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

    // Remove all of the ops related to the tiles

    this.enqueueAnim(slot);
  }
 
  getSides(boardIdx:integer) : Neighbour[] {
    let row = this.config.gameBoard.getRow(boardIdx);
    let width = this.config.gameBoard.config.width
    let selectedIdxs = this.selectedTiles.map((tile) => tile.config.boardIndex )
    let topIdx = boardIdx - width
    let rightIdx = boardIdx + 1
    let bottomIdx = boardIdx + width
    let leftIdx = boardIdx - 1
    let pos: Neighbour[] = []

    const top = topIdx >= 0 && selectedIdxs.includes(topIdx) == false
    const right = this.config.gameBoard.getRow(rightIdx) == row && selectedIdxs.includes(rightIdx) == false
    const bottom = bottomIdx < this.config.gameBoard.boardSize && selectedIdxs.includes(bottomIdx) == false
    const left = this.config.gameBoard.getRow(leftIdx) == row && selectedIdxs.includes(leftIdx) == false

    if(top) pos.push({ side: Position.Top, boardIdx: topIdx})
    if(right) pos.push({ side: Position.Right, boardIdx: rightIdx})
    if(bottom) pos.push({ side: Position.Bottom, boardIdx: bottomIdx})
    if(left) pos.push({ side: Position.Left, boardIdx: leftIdx})

    console.log(pos)

    return pos
  }

  onValidSelection(boardIdx: integer) {
    let tile = this.activeTiles[boardIdx]
    this.selectedTiles.push(tile)
    tile.setFrame(Frames.TileSelected);

//    this.addOpsPanelsForTile(boardIdx)

    this.scene.tweens.add({
      targets: [this.activeTiles[boardIdx].container],
      scale: { from: 1, to: 1.1 },
      ease: "Back.easeInOut",
      duration: 250,
      yoyo: true
    });
  }

  onInvalidSelection(boardIdx: integer) {
    this.scene.tweens.add({
      targets: [this.activeTiles[boardIdx].container],
      alpha: { from: 1, to: 0.85 },
      angle: { from: 0, to: 25 },
      ease: "Back.easeInOut",
      duration: 250,
      repeat: 0,
      yoyo: true,
      callbackScope: this,
      onStart: () => {
        this.activeTiles[boardIdx].setFrame(Frames.TileInvalid);
      },
      onComplete: () => {
        this.activeTiles[boardIdx].resetFrame();
      },
    });
  }
}
