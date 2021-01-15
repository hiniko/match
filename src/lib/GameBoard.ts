import GameEvents from "./Events";
import { OpType } from "./OpsButton"

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
  boardData: integer[] = []
  currentOps: OpType[] = []
  currentMaxValue: integer
  currentTargetValue: integer
  currentAccepted: integer = 0

  constructor(config: GameBoardConfig) {
    super(config.scene, "Gameboard Logic")
    this.config = config;
    this.currentMaxValue = config.startingMaxValue;
    this.boardSize = config.width * config.height;

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

    this.newTargetValue()
  }

  /*
   * Helpers
   */

  newTargetValue() {
    this.currentAccepted++
    this.currentMaxValue += Math.round(Math.log(this.currentAccepted) + this.currentAccepted)
    this.currentTargetValue = Math.round(Math.random() * this.currentMaxValue + 1)
    console.log("BOARD", this.currentMaxValue, this.currentTargetValue)
    this.events.emit(GameEvents.LOGIC_NEW_TARGET, this.currentTargetValue)
  }

  getRandomValue(): integer {
    return Math.floor(Math.random() * this.currentMaxValue) + 1;
  }

  getRow(dataIdx: integer): integer {
    return Math.floor(dataIdx / this.config.width);
  }

  getCol(dataIdx: integer): integer {
    return dataIdx % Math.floor(this.boardSize / this.config.height);
  }

  updateBoard() {
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
    this.currentOps.length = 0
  }

  /*
   * Event Handlers
   */ 

  onAcceptSelection() {
    // Check answer 

    let selected = this.selected.reverse()
    let ops = this.currentOps.reverse()

    let result = this.boardData[selected[0]]

    console.log(selected)
    console.log(ops)

    // Start from idx 1 as we have already added the first item 
    for(let i =1; i < selected.length; i++){

      let cell = selected[i]
      let op = ops[i-1]
      let num = this.boardData[cell]

      switch(op)  {
        case OpType.Add:
          console.log(result + " + " + num + " = " + (result + num))
          result = result + num
          break
        case OpType.Subtract:
          console.log(result + " - " + num + " = " + (result - num))
          result = result - num
          break
      }
      
    }

    console.log("Final result = " + result)

    if(result != this.currentTargetValue) {
      this.events.emit(GameEvents.LOGIC_REJECT_SOLUTION)
      return 
    }

    this.events.emit(GameEvents.LOGIC_ACCEPT_SOLUTION)

    // Update current max value
    this.newTargetValue()

    // Update board and notify 
    this.updateBoard()
  }

  onUpdateSelection(dataIdx: integer, opType: OpType) {
    console.log("Got " + opType)
    // If this is a unselection
    let foundIdx = this.selected.findIndex((selIdx: integer) => selIdx == dataIdx)
    if(foundIdx > -1) {
      // Remove the elements from the array and emit and event with the removed selections
      this.currentOps.splice(0, foundIdx)
      let unselected = this.selected.splice(0, foundIdx + 1)
      GameEvents.get().emit( GameEvents.LOGIC_UNSELECTION, unselected); 
      console.log("deselect", this.currentOps)
      return
    }

    // If there were no previous selections 
    if (opType == null) {
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
      this.currentOps.unshift(opType)
      this.selected.unshift(dataIdx);
      GameEvents.get().emit(GameEvents.LOGIC_VALID_SELECTION, dataIdx);
      console.log("selection updated", this.currentOps)
    } else {
      GameEvents.get().emit(GameEvents.LOGIC_INVALID_SELECTION, dataIdx);
    }
  }

}
