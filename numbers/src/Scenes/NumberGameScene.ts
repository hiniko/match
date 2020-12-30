import GameBoard from "../lib/GameBoard"
import NumberTile from "../lib/NumberTile"

import game from "../game"

// const tileColorA : number = 0x90F1EF;
// const tileColorB : number = 0xFFD6E0;
// const tileColorC : number = 0x67597A;
// const tileColorD : number = 0xCB904D;
// const tileColorE : number = 0x1F7A8C;

const tileColorA : number = 0x265473;
const tileColorB : number = 0xEF476F;
const tileColorC : number = 0x39A9DB;
const tileColorD : number = 0x06D6A0;
const tileColorE : number = 0x06BEE1;
const tileColorHilight : number = 0xFFD166;

const White : number = 0xFFFFFF;
const Black : number = 0x000000;

const tileColors : number[] = [
    tileColorA,
    tileColorB,
    tileColorC,
    tileColorD,
    tileColorE,
];

const tileHeight : integer = 64
const tileWidth  : integer = 64
const tileBorder : integer = 2
const tilePadding : integer = 4

export default class NumbersGame extends Phaser.Scene {

    private board: GameBoard;

    constructor ()
    {
        super('NumbersGame');
    }

    preload ()
    {
        // Create tile backgrounds 

        // @ts-ignore
        this.load.webfont("NunitoExtraBold","/assets/fonts/Nunito-ExtraBold.ttf");

        var graphics = this.add.graphics();

        for(let i = 0; i<tileColors.length; i++) {
            console.log("Generating tile " + i)
            graphics.clear()
            // Create background 
            graphics.fillStyle(tileColors[i], 1.0)
            graphics.fillRect(0, 0, tileWidth, tileHeight)
            // Create border line
            graphics.lineStyle(tileBorder, White, 1.0)
            graphics.strokeRect(
                1,
                1,
                tileWidth - tileBorder, 
                tileHeight - tileBorder,
            )
            // Create inner border line
            graphics.lineStyle(2, White, 1.0)
            graphics.strokeRect(
                tileBorder * 2,
                tileBorder * 2,
                tileWidth - tileBorder * 4, 
                tileHeight - tileBorder * 4,
            )

            graphics.generateTexture("tile" + i, tileWidth, tileHeight)
        }

        graphics.clear()

    }

    create ()
    {
        this.board = new GameBoard({
             scene: this, 
             width: 6, 
             height: 6, 
             startingMaxValue: 10
        });

        this.board.popluate()

        let tiles : NumberTile[] = []

        let x = 100
        let y = 100
        // create all of the number tiles for the board
        for(var i=0; i<this.board.boardSize; i++){

            let newRow = (i % (this.board.boardSize / this.board.config.height)) == 0

            if(newRow) {
                x = 100;
                y += tileHeight + tilePadding
            }

            let tile = new NumberTile({
                scene: this, 
                value:  this.board.boardData[i],
                spriteKey: "tile" + Math.floor(Math.random() * tileColors.length),
            });

            tile.setPosition(x,y)

            x += tileWidth + tilePadding

            tiles.push(tile)
            this.add.existing(tile.container)

        }


        // Create Tile parts
        // tiles[i] = this.add.sprite( 100 + 100 * i, 100 + 100 * i, "tile" + Math.floor(Math.random() * tileColors.length) );
        // tiles[i] = this.add.sprite( 100 + 100 * i, 100 + 100 * i, "tile" + i );
        // text[i] = this.add.text((100 + 100 * i) -8, (100 + 100 * i) -12 , i.toString(), 

        // this.add.shader('RGB Shift Field', 0, 0, 800, 600).setOrigin(0);
        // this.add.image(400, 300, 'libs');

        // const logo = this.add.image(400, 70, 'logo');

        // this.tweens.add({
        //     targets: logo,
        //     y: 350,
        //     duration: 1500,
        //     ease: 'Sine.inOut',
        //     yoyo: true,
        //     repeat: -1
        // })
    }

    update() {

    }
}

