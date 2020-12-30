export interface GameBoardConfig {
    scene: Phaser.Scene
    width: integer
    height: integer
    startingMaxValue: integer
}

export default class GameBoard {

    config: GameBoardConfig

    // Perhaps Data manager is the way to go here?
    boardSize: integer
    boardData: integer[]  = []
    currentMaxValue: integer

    constructor(config: GameBoardConfig) {
        this.config = config
        this.currentMaxValue = config.startingMaxValue
        this.boardSize = config.width * config.height
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