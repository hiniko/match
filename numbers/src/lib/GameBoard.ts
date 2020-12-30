import NumberTile from "./NumberTile"

export interface GameBoardConfig {
    scene: Phaser.Scene
    width: integer
    height: integer
    startingMaxValue: integer
}

export default class GameBoard extends Phaser.GameObjects.GameObject {

    config: GameBoardConfig
    selectedTiles: NumberTile[]

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

    }

    onTileSelected(tile: NumberTile) {
        console.log("GameBoard: Tile was clicked " + tile)

        if(this.selectedTiles.length == 0) {
            this.selectedTiles.push(tile)    
        }else{
            // Check this is a valid selection
            let row = Math.floor(tile.config.dataIndex / this.boardSize)
            let col = tile.config.dataIndex % (this.boardSize / this.config.height)

            console.log(row, col)
        }

    }

    private getRandomValue() : integer {
        return Math.floor(Math.random() * this.currentMaxValue) + 1;
    }

    public popluate() {
        if(this.config.width == 0 || this.config.height == 0)
            throw new Error("Cannot populate a board with 0 dimensions")

        for(var j=0; j<(this.boardSize); j++){
            this.boardData[j] = this.getRandomValue();
        }
    }



}