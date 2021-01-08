export default class Graphics {

static tileColorA : number = 0xFFBE0B; 
static tileColorB : number = 0xFB5607;
static tileColorC : number = 0xFFB7FF;
static tileColorD : number = 0x8338EC;
static tileColorE : number = 0x3A86FF;

static tileColorHilight : number = 0x40F99B;
static tileColorError : number = 0x302B27;

static tileSheet = "tiles"

static White : number = 0xFFFFFF;
static Grey  : number = 0xD3D3D3; 
static Black : number = 0x000000;

static tileColors : number[] = [
    Graphics.tileColorA,
    Graphics.tileColorB,
    Graphics.tileColorC,
    Graphics.tileColorD,
    Graphics.tileColorE,
    Graphics.tileColorHilight,
    Graphics.tileColorError
];

static tileHighlight = 5 
static tileError = 6
static opsTile = 7

static randomTileColorSize : number =  Graphics.tileColors.length - 2
// Addtional sprite sheet elements until I 
static additionalSlots= 1

static tileHeight : integer = 64
static tileWidth  : integer = 64
static tileBorder : integer = 2
static tilePadding : integer = 6

static opsBorder = 6

static generateGraphics(scene: Phaser.Scene) {
        let graphics = scene.add.graphics()
        // Generate tile sprite sheet
        let x = 0
        let y = 0
        graphics.clear()
        for(let i = 0; i<Graphics.tileColors.length; i++) {

            // Create background 
            graphics.fillStyle(Graphics.tileColors[i], 1.0)
            graphics.fillRect(x, y, Graphics.tileWidth, Graphics.tileHeight)
            // Create border line
            graphics.lineStyle(Graphics.tileBorder, Graphics.White, 1.0)
            graphics.strokeRect(
                x+1,
                y+1,
                Graphics.tileWidth - Graphics.tileBorder, 
                Graphics.tileHeight - Graphics.tileBorder,
            )
            // Create inner border line
            graphics.lineStyle(2, Graphics.White, 1.0)
            graphics.strokeRect(
                x + Graphics.tileBorder * 4,
                y + Graphics.tileBorder * 4,
                Graphics.tileWidth - Graphics.tileBorder * 8, 
                Graphics.tileHeight - Graphics.tileBorder * 8,
            )

            x += Graphics.tileWidth;
        }

        // Generate circle for operations
        graphics.fillStyle(Graphics.tileColorHilight, 1.0)
        graphics.lineStyle(Graphics.opsBorder, Graphics.White, 1.0)
        graphics.fillCircle(x+32, y+32, 28)
        graphics.strokeCircle(x+32, y+32, 28)

        let totalFrames = Graphics.tileColors.length + Graphics.additionalSlots
        graphics.generateTexture(Graphics.tileSheet, Graphics.tileWidth * totalFrames, Graphics.tileHeight)
        graphics.clear()

        // Add frames to the sprite sheet
        let texture = scene.textures.get(Graphics.tileSheet)

        x=0
        let i=0
        for(; i<Graphics.tileColors.length; i++) {                
            console.log(x)
            x += Graphics.tileWidth;
            texture.add(i, 0, x, 0, Graphics.tileWidth,Graphics.tileHeight)
        }

        console.log(x,"final")

        // Add opsCircile
        texture.add(i, 0, x, 0, Graphics.tileWidth, Graphics.tileHeight)

    }

    static debugTextures(scene: Phaser.Scene) {
        for(let i = 0; i < scene.textures.get(Graphics.tileSheet).frameTotal; i++){
            scene.add.sprite(100 + i * 64, 100 + i* 64, Graphics.tileSheet, i)
        }

    }

}
