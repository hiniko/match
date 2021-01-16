import 'phaser';
import NumberGameScene from "./NumberGameScene"
import { WebFontLoaderPlugin } from "./lib/WebFont"

const width = 1280
const height = 720

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    expandParent: true,
    width: 720,
    height: 900,
    resolution: window.devicePixelRatio, 
    scene: NumberGameScene,
    plugins: { 
        global: [{
            key: 'webfontloader',
            plugin: WebFontLoaderPlugin,
            start: true
        }]
    }

};

const game = new Phaser.Game(config);

export default game;
