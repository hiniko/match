export enum Frames {
    TileColor0,
    TileColor1,
    TileColor2,
    TileColor3,
    TileColor4,
    TileSelected,
    TileInvalid,
    Button,
    ButtonSelected,
    ButtonInvalid,
    __Length
}

export class Graphics {


// Colors

static White : number = 0xFFFFFF;
static Grey  : number = 0xD3D3D3; 
static Black : number = 0x000000;
static MediumSpringGreen : number = 0x40F99B;
static Jet: number = 0x302B27;
static Mango: number = 0xFFBE0B; 
static OrangePantone: number = 0xFB5607;
static Mauve: number = 0xFFB7FF;
static BlueViolet: number = 0x8338EC;
static Azure: number = 0x3A86FF;
static RedCrayola : number = 0xEF2D56;
static LavenderWeb : number = 0xE9E6FF;

static tileSheetKey = "tiles"


static tileColors : number[] = [
    Graphics.Mango,
    Graphics.OrangePantone,
    Graphics.Mauve,
    Graphics.BlueViolet,
    Graphics.Azure,
];

static tileHeight : integer = 64
static tileWidth  : integer = 64
static tileBorder : integer = 2
static tilePadding : integer = 6

static buttonBorder = 6

static generateGraphics(scene: Phaser.Scene) {
        let graphics = scene.add.graphics()
        // Generate tile sprite sheet
        let x = 0
        let y = 0
        graphics.clear()

        // Create basic tiles
        for(let i = 0; i<Graphics.tileColors.length; i++) {
            Graphics.createTile(graphics, x, y, Graphics.tileColors[i])
            x += Graphics.tileWidth;
        }

        // Create Special tiles
        Graphics.createTile(graphics, x, y, Graphics.MediumSpringGreen)
        x += Graphics.tileWidth
        Graphics.createTile(graphics, x, y, Graphics.Jet)
        x += Graphics.tileWidth

        // Generate Ops Button circles 
        Graphics.createOpsButton(graphics, x, y, Graphics.LavenderWeb, Graphics.Black)
        x += Graphics.tileWidth
        Graphics.createOpsButton(graphics, x, y, Graphics.RedCrayola, Graphics.White)
        x += Graphics.tileWidth
        Graphics.createOpsButton(graphics, x, y, Graphics.Jet, Graphics.White)
        x += Graphics.tileWidth
        
        // Unselected
        graphics.generateTexture(Graphics.tileSheetKey, Graphics.tileWidth * Frames.__Length, Graphics.tileHeight)
        graphics.clear()

        // Add frames to the sprite sheet
        let texture = scene.textures.get(Graphics.tileSheetKey)

        x = 0
        for(let i=0; i<Frames.__Length; i++) {                
            texture.add(i, 0, x, 0, Graphics.tileWidth,Graphics.tileHeight)
            x += Graphics.tileWidth;
        }

      }

    static debugTextures(scene: Phaser.Scene) {
        let x = 0
        let y = 0 
        for(let i = 0; i < scene.textures.get(Graphics.tileSheetKey).frameTotal; i++){
            scene.add.sprite(50 + x, 50 + y, Graphics.tileSheetKey, i)
            x += Graphics.tileWidth
            if(x % 512 == 0) {
                x = 0
                y += Graphics.tileHeight
            }
        }
    }

    static createOpsButton(graphics: Phaser.GameObjects.Graphics, x: integer, y: integer, color: number, borderColor: number) {
        graphics.fillStyle(color, 1.0)
        graphics.lineStyle(Graphics.buttonBorder, borderColor, 1.0)
        graphics.fillCircle(x+32, y+32, 27)
        graphics.strokeCircle(x+32, y+32, 27)
    }

    static createTile(graphics: Phaser.GameObjects.Graphics, x: integer, y: integer, tileColor: number) {
        // Create background 
        graphics.fillStyle(tileColor, 1.0)
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
    }

}