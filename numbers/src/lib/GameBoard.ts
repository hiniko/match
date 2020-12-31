import GameEvents from "./Events"
import NumberTile from "./NumberTile"

export interface GameBoardConfig {
    scene: Phaser.Scene
    width: integer
    height: integer
    startingMaxValue: integer
}

export default class GameBoard extends Phaser.GameObjects.GameObject {

    config: GameBoardConfig
    events: GameEvents = GameEvents.get()
    selectedTiles: integer[] = []

    // Perhaps Data manager is the way to go here?
    scene: Phaser.Scene
    boardSize: integer
    boardData: integer[]  = []
    currentMaxValue: integer

    constructor(config: GameBoardConfig) {
        super(config.scene, "Gameboard Logic")
        this.config = config
        this.currentMaxValue = config.startingMaxValue
        this.boardSize = config.width * config.height

        this.popluate()

        this.events.on(GameEvents.TILE_CLICKED, this.onTileSelected, this)
    }

    private popluate() {
        if(this.config.width == 0 || this.config.height == 0)
            throw new Error("Cannot populate a board with 0 dimensions")

        for(var j=0; j<(this.boardSize); j++){
            this.boardData[j] = this.getRandomValue();
        }
    }

    onTileAcceptSelection() {

      console.log("Checking selection")

      //TODO Some logic here to ensure that it went write


      this.selectedTiles.forEach((dataIdx: integer, selIdx: integer)  => {
        console.log("removing " + dataIdx)
        this.boardData[dataIdx] = this.getRandomValue();
        this.events.emit(GameEvents.TILE_ACCEPT_SELECTION, dataIdx, selIdx)
      });

      this.selectedTiles.length = 0
    }

    onTileSelected(dataIdx) {
          // Get the row and column of the tile in the array 
          let row = Math.floor(dataIdx / this.config.width)
          let col = dataIdx % (this.boardSize / this.config.height)

          // check if this is a valid selection
          if(this.selectedTiles.length == 0) {
            this.selectedTiles.unshift(dataIdx)
            GameEvents.get().emit(GameEvents.TILE_VALID_SELECTION, dataIdx)
          }else{

            // Check if we clicked a tile in the selection and deselect to that point and return 
            let foundIdx = this.selectedTiles.findIndex((selIdx: integer) => selIdx == dataIdx) 
            if(foundIdx > -1) {
              // Add one to the found index to include the tile that was clicked on 
              this.selectedTiles.splice(0, foundIdx + 1).forEach((curIdx: integer, selIdx: integer) => {
                GameEvents.get().emit(GameEvents.TILE_DESELECTION, curIdx, selIdx)
              })
              return 
            }

            // Chceck if the location of the new selection is a neighbour of the previous tile and on the same row to prevent wrapping
            let prevIdx = this.selectedTiles[0]
            let prevRow = Math.floor(prevIdx / this.config.width)

            const left = (dataIdx - 1 == prevIdx && prevRow == row)
            const right = (dataIdx + 1 == prevIdx && prevRow == row)
            const up = (dataIdx - this.config.width == prevIdx)
            const down = (dataIdx + this.config.width == prevIdx)

            if(left || right || up || down) {
              this.selectedTiles.unshift(dataIdx)
              GameEvents.get().emit(GameEvents.TILE_VALID_SELECTION, dataIdx)
            }else{
              GameEvents.get().emit(GameEvents.TILE_INVALID_SELECTION, dataIdx)
            }

          }
          console.log(row, col)
    }

    private getRandomValue() : integer {
        return Math.floor(Math.random() * this.currentMaxValue) + 1;
    }

}