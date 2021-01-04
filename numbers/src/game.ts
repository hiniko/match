import 'phaser';
import NumberGameScene from "./scenes/NumberGameScene"
import { WebFontLoaderPlugin } from "./lib/WebFont"

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    width: 720,
    height: 1280,
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
