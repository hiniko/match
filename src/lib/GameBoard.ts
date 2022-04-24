import GameEvents from "./Events";

export interface GameBoardConfig {
  scene: Phaser.Scene;
  width: integer;
  height: integer;
  maxTileTypes: integer;
}

export interface TileData {
  type: integer;
}

export interface DropData {
  idx: integer;
  newIdx: integer;
  dropCount: integer;
}

export interface NewData {
  idx: integer; 
  row: integer;
  col: integer;
  data: TileData
}

export default class GameBoard extends Phaser.GameObjects.GameObject {
  config: GameBoardConfig;
  events: GameEvents = GameEvents.get();
  selected: integer[] = [];

  // Perhaps Data manager is the way to go here?
  scene: Phaser.Scene;
  boardSize: integer;
  boardData: TileData[] = []
  maxTileTypes: integer 

  constructor(config: GameBoardConfig) {
    super(config.scene, "Gameboard Logic")
    this.config = config;
    this.maxTileTypes = config.maxTileTypes;
    this.boardSize = config.width * config.height;

    this.events.on(
      GameEvents.BOARD_TILE_SELECTED,
      this.onTileSelected,
      this
    );
  }

  popluate() {
    if (this.config.width == 0 || this.config.height == 0)
      throw new Error("Cannot populate a board with 0 dimensions");

    for (var j = 0; j < this.boardSize; j++) {
      this.boardData[j] = this.getRandomTile();
    }
  }

  /*
   * Helpers
   */

  getRandomTile(): TileData {
   return {
    type: Math.floor(Math.random() * this.maxTileTypes) + 1,
   }
  }

  getRow(dataIdx: integer): integer {
    return Math.floor(dataIdx / this.config.width);
  }

  getCol(dataIdx: integer): integer {
    return dataIdx % Math.floor(this.boardSize / this.config.height);
  }

  getNorth(idx: integer): integer{
    let i = idx - this.config.width
    return (i>0) ? i : null;
  }

  getEast(idx: integer): integer {
    let i = idx+1
    return (this.getRow(i) == this.getRow(idx)) ? i : null
  }

  getSouth(idx: integer){
    let i = idx + this.config.width
    return (i<(this.config.width * this.config.height)) ? i : null;
  }

  getWest(idx: integer) {
    let i = idx-1
    return (this.getRow(i) == this.getRow(idx)) ? i : null
  }

  updateBoard() {
    let dropData: DropData[] = [];

    // Find which columns need to move
    this.selected.forEach((idx: integer) => {
      this.boardData[idx] = null;
      dropData.push({
        idx: idx,
        newIdx: null,
        dropCount: 0
      })
    });

    // Iterate backbwards through board moving tiles with gaps under them down
    for (let i = this.boardSize - 1; i > -1; i--) {
      // Skip empty cells
      if (this.boardData[i] == null) continue

      let row = this.getRow(i);
      // Skip if this is the bottom row
      if (row == this.config.height - 1) continue

      let belowIdx = i + this.config.width;

      // skip if the row below has a tile
      if (this.boardData[belowIdx] != null) continue

      // the row below does not have a tile, work how may spaces it needs to move down
      let dropCount = 0;
      let nextBelowIdx = belowIdx;
      while (true) {
        // if there is a gap, mark it
        if (this.boardData[nextBelowIdx] == null) dropCount++;
        else break;

        // if the new next below index is greater than the board or the next space isn't null
        if (
          nextBelowIdx + this.config.width >= this.boardSize ||
          this.boardData[nextBelowIdx + this.config.width] != null
        )
        break;

        // increment the nextBelow index
        nextBelowIdx = nextBelowIdx + this.config.width;
      }

      this.boardData[nextBelowIdx] = this.boardData[i];
      this.boardData[i] = null;
      dropData.push({
        idx: i, 
        newIdx: nextBelowIdx, 
        dropCount: dropCount
      });
    }

    let newData: NewData[] = []

    for(let i=0; i<this.boardSize; i++) {
       if(this.boardData[i] != null) continue
       let tile = this.getRandomTile()
       this.boardData[i] = tile
       newData.push({
          idx: i,
          col: this.getCol(i),
          row: this.getRow(i),
          data: tile,
       })
    }
    console.log(dropData, newData)
    this.events.emit(GameEvents.LOGIC_BOARD_UPDATED, dropData, newData);

    this.selected.length = 0;
  }

 findNeighbours(idx: integer, type: integer, neighbours: integer[] = []): integer[] {

   let dir: integer[] = [
     this.getNorth(idx),
     this.getEast(idx),
     this.getSouth(idx),
     this.getWest(idx),
   ]

   neighbours.push(idx);

   for(var d of dir) {
     if (d == null) continue;
     if(this.boardData[d].type == type && !neighbours.includes(d)) {
       this.findNeighbours(d, type, neighbours)
     }
   }

   return neighbours
 }

  /*
   * Event Handlers
   */ 
  onTileSelected(idx: integer) {
    let block = this.findNeighbours(idx, this.boardData[idx].type)
    this.selected = block
    this.updateBoard()
  }
}
