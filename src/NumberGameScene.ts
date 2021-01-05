import GameBoard from "./lib/GameBoard"
import GameBoardDisplay from "./lib/GameBoardDisplay"

// const tileColorA : number = 0x265473;
// const tileColorB : number = 0xEF476F;
// const tileColorC : number = 0x39A9DB;
// const tileColorD : number = 0x06D6A0;
// const tileColorE : number = 0x06BEE1;
// const tileColorHilight : number = 0xFFD166;
// const tileColorError : number = 0xE63946;

const tileColorA : number = 0xFFBE0B;
const tileColorB : number = 0xFB5607;
const tileColorC : number = 0xFFB7FF;
const tileColorD : number = 0x8338EC;
const tileColorE : number = 0x3A86FF;

const tileColorHilight : number = 0x40F99B;
const tileColorError : number = 0x302B27;

const White : number = 0xFFFFFF;
const Black : number = 0x000000;

const tileColors : number[] = [
    tileColorA,
    tileColorB,
    tileColorC,
    tileColorD,
    tileColorE,
    tileColorHilight,
    tileColorError
];

const randomTileColorSize : number =  tileColors.length - 2

const tileHeight : integer = 64
const tileWidth  : integer = 64
const tileBorder : integer = 2
const tilePadding : integer = 4

export default class NumbersGame extends Phaser.Scene {

    private board: GameBoard;
    private boardDisplay: GameBoardDisplay

    constructor ()
    {
        super('NumbersGame');
    }

    preload ()
    {
        // @ts-ignore
        this.load.webfont("NunitoExtraBold","/assets/fonts/Nunito-ExtraBold.ttf");

        var graphics = this.add.graphics();


        // Generate tile sprite sheet
        let x = 0
        let y = 0
        graphics.clear()
        for(let i = 0; i<tileColors.length; i++) {

            // Create background 
            graphics.fillStyle(tileColors[i], 1.0)
            graphics.fillRect(x, y, tileWidth, tileHeight)
            // Create border line
            graphics.lineStyle(tileBorder, White, 1.0)
            graphics.strokeRect(
                x+1,
                y+1,
                tileWidth - tileBorder, 
                tileHeight - tileBorder,
            )
            // Create inner border line
            graphics.lineStyle(2, White, 1.0)
            graphics.strokeRect(
                x + tileBorder * 4,
                y + tileBorder * 4,
                tileWidth - tileBorder * 8, 
                tileHeight - tileBorder * 8,
            )

            x += tileWidth;

        }

        graphics.generateTexture("tilesSpritesheet", tileWidth * tileColors.length, tileHeight)
        graphics.clear()

        // Add frames to the sprite sheet
        let texture = this.textures.get("tilesSpritesheet")

        x=0
        let name = ""
        for(let i = 0; i<tileColors.length; i++) {                
            switch(i) {                    
                case tileColors.length - 2:
                    name = "tileHilight"
                break;
                case tileColors.length - 1:
                    name = "tileError"
                break;
                default: 
                    name = "tile" + i
                break;
            }
            texture.add(name, 0, x, 0, tileWidth, tileHeight)
            x += tileWidth;
        }

    }

    create ()
    {            

        let { width, height } = this.sys.game.canvas;

        this.board = new GameBoard({
             scene: this, 
             width: 8, 
             height: 6, 
             startingMaxValue: 10
        })

        this.boardDisplay = new GameBoardDisplay({
          scene: this,
          spriteKey: "tilesSpritesheet",
          spriteFrameCount: 5,
          tileWidth: tileWidth,
          tileHeight: tileHeight,
          tilePadding: tilePadding,
          gameBoard: this.board,
         })

        this.boardDisplay.createBoard()

        const boardOffsetX = (width - (tileWidth * this.board.config.width) +(tilePadding * (this.board.config.width -1))) / 2
        this.boardDisplay.setPosition(boardOffsetX, 300);

        this.add.existing(this.boardDisplay.container)


        

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

