import GameEvents from "./Events";
import GameBoard from "./GameBoard";
import Tile from "./Tile"

export interface GameBoardDisplayConfig {
  scene: Phaser.Scene;
  gameBoard: GameBoard;
  spriteKey: string;
  spriteFrameCount: integer;
  tileHeight: integer;
  tileWidth: integer;
  tilePadding: integer;
}

export default class GameBoardDisplay extends Phaser.GameObjects.GameObject {
  config: GameBoardDisplayConfig;
  scene: Phaser.Scene;
  group: Phaser.GameObjects.Group;
  board: GameBoard;
  container: Phaser.GameObjects.Container;

  constructor(config: GameBoardDisplayConfig) {
    super(config.scene, "GameBoardDisplay for " + config.gameBoard.name);

    this.config = config;
    this.group = new Phaser.GameObjects.Group(this.scene);
    this.container = new Phaser.GameObjects.Container(this.scene);

    this.createTiles();
  }

  private createTiles() {
    console.log("Generating Tiles...");
    for (
      let i = 0;
      //  i < this.config.gameBoard.boardSize + Math.floor(this.config.gameBoard.boardSize / 2);
      i < this.config.gameBoard.boardSize;
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
        value: 0
      });

      this.group.add(tile);
      this.container.add(tile.container);
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
      let value = this.config.gameBoard.boardData[i]
     
      tile.reset(x, y, i, value)

      // Set position and start tween to new position

      x += this.config.tileWidth + this.config.tilePadding;

      this.container.add(tile.container);
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
}
