import GameBoard from "./lib/GameBoard"
import GameBoardDisplay from "./lib/GameBoardDisplay"
import GameUI from "./lib/GameUI"
import { Graphics } from "./lib/Graphics"

export default class NumbersGame extends Phaser.Scene {

    private board: GameBoard;
    private boardDisplay: GameBoardDisplay
    private gameUI: GameUI

    constructor ()
    {
        super('NumbersGame');
    }

    preload ()
    {
        // @ts-ignore
        this.load.webfont("NunitoExtraBold","/assets/fonts/Nunito-ExtraBold.ttf");
        Graphics.generateGraphics(this)
    }

    create ()
    {            

        //Graphics.debugTextures(this)

        let { width, height } = this.sys.game.canvas;

        this.board = new GameBoard({
             scene: this, 
             width: 8, 
             height: 6, 
             maxTileTypes: 3
        })

        this.boardDisplay = new GameBoardDisplay({
          scene: this,
          spriteKey: Graphics.tileSheetKey,
          spriteFrameCount: 5,
          tileWidth: Graphics.tileWidth,
          tileHeight: Graphics.tileHeight,
          tilePadding: Graphics.tilePadding,
          gameBoard: this.board,
         })

        this.gameUI = new GameUI({
            scene: this,
            width: this.boardDisplay.container.width,
            height: 350
        })

        const boardOffsetX = (width - (Graphics.tileWidth * this.board.config.width) +(Graphics.tilePadding * (this.board.config.width -1))) / 2
        this.boardDisplay.setPosition(boardOffsetX, 300);

        this.gameUI.setPosition(
            (this.cameras.main.width / 2) - (this.gameUI.config.width / 2),
            (this.cameras.main.height / 2) - 200)

        this.add.existing(this.boardDisplay.container)
        this.add.existing(this.gameUI)

        this.board.popluate()
        this.boardDisplay.assembleBoard()

    //     this.add.shader('RGB Shift Field', 0, 0, 800, 600).setOrigin(0);
    //     this.add.image(400, 300, 'libs');

    //     const logo = this.add.image(400, 70, 'logo');

    //     this.tweens.add({
    //         targets: logo,
    //         y: 350,
    //         duration: 1500,
    //         ease: 'Sine.inOut',
    //         yoyo: true,
    //         repeat: -1
    //     })
    }


    update() {
      this.boardDisplay.update()
    }
}

