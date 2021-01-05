import GameEvents from "./Events";

export interface GameBoardConfig {
  scene: Phaser.Scene;
  width: integer;
  height: integer;
  startingMaxValue: integer;
}

export default class GameBoard extends Phaser.GameObjects.GameObject {
  config: GameBoardConfig;
  events: GameEvents = GameEvents.get();
  selected: integer[] = [];

  // Perhaps Data manager is the way to go here?
  scene: Phaser.Scene;
  boardSize: integer;
  boardData: integer[] = [];
  currentMaxValue: integer;

  constructor(config: GameBoardConfig) {
    super(config.scene, "Gameboard Logic");
    this.config = config;
    this.currentMaxValue = config.startingMaxValue;
    this.boardSize = config.width * config.height;

    this.popluate();

    this.events.on(
      GameEvents.LOGIC_UPDATE_SELECTION,
      this.onUpdateSelection,
      this
    );

    this.events.on(
      GameEvents.LOGIC_ACCEPT_SELECTION,
      this.onAcceptSelection,
      this
    );
  }

  popluate() {
    if (this.config.width == 0 || this.config.height == 0)
      throw new Error("Cannot populate a board with 0 dimensions");

    for (var j = 0; j < this.boardSize; j++) {
      this.boardData[j] = this.getRandomValue();
    }
  }

  /*
   * Helpers
   */

  getRandomValue(): integer {
    return Math.floor(Math.random() * this.currentMaxValue) + 1;
  }

  getRow(dataIdx: integer): integer {
    return Math.floor(dataIdx / this.config.width);
  }

  getCol(dataIdx: integer): integer {
    return dataIdx % Math.floor(this.boardSize / this.config.height);
  }

  /*
   * Event Handlers
   */ 

  onAcceptSelection() {
    let dropData = [];

    // Find which columns need to move
    this.selected.forEach((dataIdx: integer) => {
      this.boardData[dataIdx] = null;
      dropData.push([dataIdx, null, null]);
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
          nextBelowIdx + this.config.width>= this.boardSize ||
          this.boardData[nextBelowIdx + this.config.width] != null
        )
        break;

        // increment the nextBelow index
        nextBelowIdx = nextBelowIdx + this.config.width;
      }

      this.boardData[nextBelowIdx] = this.boardData[i];
      this.boardData[i] = null;
      dropData.push([i, nextBelowIdx, dropCount]);
    }

    let newData: integer[][] = []

    for(let i=0; i<this.boardSize; i++) {
       if(this.boardData[i] != null) continue
       let num = this.getRandomValue()
       let col = this.getCol(i)
       let row = this.getRow(i)
       this.boardData[i] = num
       newData.push([i, num, col, row])
    }

    this.events.emit(GameEvents.LOGIC_CLEAR_SELECTION, this.selected);
    this.events.emit(GameEvents.LOGIC_BOARD_UPDATED, dropData, newData);

    this.selected.length = 0;
  }

  onUpdateSelection(dataIdx) {
    // If this is a unselection
    let foundIdx = this.selected.findIndex((selIdx: integer) => selIdx == dataIdx)
    if(foundIdx > -1) {
      // Remove the elements from the array and emit and event with the removed selections
      GameEvents.get().emit(
        GameEvents.LOGIC_UNSELECTION,
        this.selected.splice(0, foundIdx + 1)
      );
      return
    }

    // If there were no previous selections 
    if (this.selected.length == 0) {
      this.selected.unshift(dataIdx);
      GameEvents.get().emit(GameEvents.LOGIC_VALID_SELECTION, dataIdx);
      return
    }

    // Is this a valid selection based on cardinal directions
    let prevIdx = this.selected[0];
    let prevRow = Math.floor(prevIdx / this.config.width);

    let row = this.getRow(dataIdx);

    const left = dataIdx - 1 == prevIdx && prevRow == row;
    const right = dataIdx + 1 == prevIdx && prevRow == row;
    const up = dataIdx - this.config.width == prevIdx;
    const down = dataIdx + this.config.width == prevIdx;

    if (left || right || up || down) {
      this.selected.unshift(dataIdx);
      GameEvents.get().emit(GameEvents.LOGIC_VALID_SELECTION, dataIdx);
    } else {
      GameEvents.get().emit(GameEvents.LOGIC_INVALID_SELECTION, dataIdx);
    }
  }

}
