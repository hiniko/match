import GameEvents from "./Events"

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
        this.events.on(GameEvents.TILE_DESELECTION, this.onTileDeselection, this)
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
      //TODO Some logic here to ensure that it went right
      // Find out which tiles need to move and by how many 
      console.log(this.boardData)

      // Emit the tiles have been selected
      this.events.emit(GameEvents.TILE_ACCEPT_SELECTION, this.selectedTiles)


      let dropData = []

      // Find which columns need to move
      this.selectedTiles.forEach((dataIdx: integer) => {
        this.boardData[dataIdx] = null
        dropData.push([dataIdx, null, null])
      })

      console.log(this.boardData)

      // Iterate backbwards through board moving tiles with gaps under them down
      for(let i=this.boardSize -1; i>-1; i--) {

        let dataIdx = i

        if(this.boardData[i] == null) {
          console.log("idx " + i + " is null, skipping")
          continue
        }

        let row = this.getRow(i)
        let col = this.getCol(i)
        let belowIdx = i + this.config.height

        console.log("Checking " + row + ":" + col + " at idx " + i)

        // Skip if this is the bottom row
        if(row == this.config.height -1){
          console.log("idx " + i + " is on the bottom row, skipping")
          continue
        }

        // skip if the row below has a tile
        if(this.boardData[belowIdx] != null) {
          console.log("idx " + i + " has a tile below it, skipping")
          continue
        }

        // the row below does not have a tile, work how may spaces it needs to mvoe down 
        let dropCount = 0
        let nextBelowIdx = belowIdx
        console.log("belowidx : " + belowIdx)
        while(true) {

          // if there is a gap, mark it 
          if(this.boardData[nextBelowIdx] == null) dropCount++
          else break

          // if the new next below index is greater than the board or the next space isn't null
          if(nextBelowIdx + this.config.height >= this.boardSize || this.boardData[nextBelowIdx + this.config.height] != null) 
            break

          // increment the nextBelow index
          nextBelowIdx = nextBelowIdx + this.config.height 
        }

        console.log("final next below idx: " + nextBelowIdx)
        console.log("Dropped: " + dropCount + " times")


        this.boardData[nextBelowIdx] = this.boardData[i]
        this.boardData[i] = null
        dropData.push([i, nextBelowIdx, dropCount])
        console.log("tile at " + row + ":" + col + " needs to move down " + dropCount  + " Spaces")
      }

      console.log(this.boardData)
      this.events.emit(GameEvents.TILE_DROPPED, dropData)
      this.selectedTiles.length = 0
    }

    getRow(dataIdx: integer): integer {
      return Math.floor(dataIdx / this.config.width)

    }

    getCol(dataIdx: integer): integer {
      return dataIdx % Math.floor(this.boardSize / this.config.height)
    }

    onTileDeselection(dataIdx) {
      let idx = this.selectedTiles.findIndex(dataIdx)
      this.selectedTiles = this.selectedTiles.filter((v) => v != dataIdx)
    }

    onTileSelected(dataIdx) {
          console.log("tileSelected called")

          let row = this.getRow(dataIdx)
          let col = this.getCol(dataIdx)

          // check if this is a valid selection
          if(this.selectedTiles.length == 0) {
            this.selectedTiles.unshift(dataIdx)
            GameEvents.get().emit(GameEvents.TILE_VALID_SELECTION, dataIdx)
          }else{

            // Check if we clicked a tile in the selection and deselect to that point and return 
            let foundIdx = this.selectedTiles.findIndex((selIdx: integer) => selIdx == dataIdx) 
            if(foundIdx > -1) {
              // Add one to the found index to include the tile that was clicked on 
              GameEvents.get().emit(GameEvents.TILE_DESELECTION, this.selectedTiles.splice(0, foundIdx + 1))
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
    }

    private getRandomValue() : integer {
        return Math.floor(Math.random() * this.currentMaxValue) + 1;
    }

}