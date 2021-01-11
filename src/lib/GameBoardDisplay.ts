import GameEvents from "./Events";
import GameBoard from "./GameBoard";
import Tile from "./Tile";
import { OpType, OpsPanel} from "./OpsButton"
import { Frames, Graphics } from "./Graphics"
import { Layout, Position } from "./Types"

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
  panelGroup: Phaser.GameObjects.Group;
  timeline: Phaser.Tweens.Timeline;
  selectedTiles: Tile[] = []
  activeTiles: Tile[] = [];
  activePanels: OpsPanel[] = []
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
    this.panelGroup = new Phaser.GameObjects.Group(this.scene)
    this.container = new Phaser.GameObjects.Container(this.scene);
    this.timeline = this.scene.tweens.createTimeline();

    this.events.on(GameEvents.LOGIC_INVALID_SELECTION, this.onInvalidSelection, this);
    this.events.on(GameEvents.LOGIC_VALID_SELECTION, this.onValidSelection, this);
    this.events.on(GameEvents.LOGIC_UNSELECTION, this.onUnselection, this);
    this.events.on(GameEvents.LOGIC_BOARD_UPDATED, this.onBoardUpdated, this);
    this.events.on(GameEvents.LOGIC_CLEAR_SELECTION, this.onClearSelection, this);

    this.events.on(GameEvents.BOARD_UPDATE_ANIMATIONS, this.checkAnimations, this);

    this.events.on(GameEvents.TILE_CLICKED, this.onTileClicked, this)
    this.events.on(GameEvents.TILE_POINTER_OVER, this.onTilePointerOver, this)
    this.events.on(GameEvents.TILE_POINTER_OUT, this.onTilePointerOut, this)


    let spaceKey = this.scene.input.keyboard.addKey("Space")
    spaceKey.on('down', this.onSpaceKeyDown, this)

    this.objectPoolSize = 
      this.config.gameBoard.boardSize + Math.floor(this.config.gameBoard.boardSize / 2)

    this.createTiles();
    this.createOpsButtons()

    this.assembleBoard();
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

  private createOpsButtons() {
    for ( let i = 0; i < this.objectPoolSize; i++) {
      this.panelGroup.add(new OpsPanel(this.scene))
    }

    // let button: OpsButton = this.opsGroup.getFirstDead()
    // button.setEnabled(true)
    // button.container.setPosition(0, 0)
    // this.container.add(button.container)

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
    }else {
      this.events.checkDeferred()
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
    this.checkAnimations()
    if(this.state != IDLE) return
    this.events.emit(GameEvents.LOGIC_UPDATE_SELECTION, boardIdx)
  }

  onTilePointerOver(boardIdx: integer) {
    console.log("mouse over " + boardIdx)
  }

  onTilePointerOut(boardIdx: integer) {
    console.log("mouse out " + boardIdx)
  }


  onBoardUpdated(dropData: integer[][], newData: integer[][]) {

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

      let oldBoardIndex = dropData[i][0];
      let newBoardIndex = dropData[i][1];
      let dropCount = dropData[i][2];

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

      let idx = newData[i][0]
      let num = newData[i][1]
      let col = newData[i][2]
      let row = newData[i][3]

      // get a tile and place drop it into the board
      let tile: Tile = this.tileGroup.get()

      let x = (col * this.config.tileWidth) + (this.config.tilePadding * col)
      let y = 0 
      let newY = ((row + 1) * this.config.tileHeight) + (this.config.tilePadding * (row + 1))

      tile.reset(x, y, idx, num)
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

    this.selectedTiles.length = 0

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
    this.enqueueAnim(slot);
  }

  onUnselection(dataIdxs: integer[]) {
    let slot: AnimationSlot = {
      blocking: true,
      tweens: []
    }

    dataIdxs.forEach((dataIdx, idx) => {

      // Remove the tiles from selected
      let selectedIdx = this.selectedTiles.findIndex((tile) => tile.config.boardIndex == dataIdx)
      this.selectedTiles.splice(0, selectedIdx + 1)

      // Animate the tile
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
 
  addOpsPannel(boardIdx: number, side: Position) {

      let tile = this.activeTiles[boardIdx]
      let panel: OpsPanel = this.panelGroup.getFirstDead()

      let x:integer, y:integer
      
      switch(side) 
      {
        case Position.Top:
          panel.reset(0,0, Layout.Horizontal)
          x = tile.container.x - (Graphics.tileWidth / 2) + ((Graphics.tileWidth - panel.width) / 2) + MAGIC_SPACING_BULLSHIT 
          y = tile.container.y - (Graphics.tileHeight / 2)
        break;

        case Position.Right:
          panel.reset(0,0, Layout.Vertical)
          x = tile.container.x - (Graphics.tileWidth / 2)  + Graphics.tileWidth
          y = tile.container.y - (Graphics.tileHeight / 2) + ((Graphics.tileHeight- panel.height) / 2) + MAGIC_SPACING_BULLSHIT
        break;

        case Position.Bottom:
          panel.reset(0,0, Layout.Horizontal)
          x = tile.container.x - (Graphics.tileWidth / 2) + ((Graphics.tileWidth - panel.width) / 2) + MAGIC_SPACING_BULLSHIT
          y = tile.container.y - (Graphics.tileHeight / 2) + Graphics.tileHeight
        break;

        case Position.Left:
          panel.reset(0,0, Layout.Vertical)

          x = tile.container.x - (Graphics.tileWidth / 2) 
          y = tile.container.y - (Graphics.tileHeight / 2) + ((Graphics.tileHeight- panel.height) / 2) + MAGIC_SPACING_BULLSHIT
        break;

      }

      panel.setPosition(x, y)
      this.container.add(panel)
  }

  getSides(boardIdx:integer) : Position[] {
    let prevIdx = this.selectedTiles[0].config.boardIndex;
    let prevRow = Math.floor(prevIdx / this.config.gameBoard.config.width);
    let row = this.config.gameBoard.getRow(boardIdx);

    let width = this.config.gameBoard.config.width
    let height = this.config.gameBoard.config.height

    let selectedIdxs = this.selectedTiles.map((tile) => tile.config.boardIndex )


    const top = boardIdx - width > 0 && selectedIdxs.includes(boardIdx - width) == false
    const right = this.config.gameBoard.getRow(boardIdx + 1) == row && selectedIdxs.includes(boardIdx + 1) == false
    const bottom = boardIdx + width < this.config.gameBoard.boardSize && selectedIdxs.includes(boardIdx + width) == false
    const left = this.config.gameBoard.getRow(boardIdx - 1) == row && selectedIdxs.includes(boardIdx - 1) == false

    let pos: Position[] = []
    if(top) pos.push(Position.Top)
    if(right) pos.push(Position.Right)
    if(bottom) pos.push(Position.Bottom)
    if(left) pos.push(Position.Left)
    return pos
  }

  onValidSelection(boardIdx: integer) {

    let tile = this.activeTiles[boardIdx]
    this.selectedTiles.push(tile)
    tile.setFrame(Frames.TileSelected);

    let selIdx = this.selectedTiles.findIndex((tile) => tile.config.boardIndex == boardIdx)  
   
    // Add a ops panel if needed
    if(selIdx > 0) {
      let pos = this.getSides(boardIdx)

      pos.forEach((pos) => {
        this.addOpsPannel(boardIdx, pos)
      }) 
    }


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
