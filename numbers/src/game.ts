import 'phaser';
import WebFontLoaderPlugin from 'phaser3-rex-plugins/plugins/webfontloader-plugin.js';
import NumberGameScene from './Scenes/NumberGameScene'


const config = {
    type: Phaser.AUTO,
    backgroundColor: '#D3D3D3',
    width: 720,
    height: 1280,
    scene: NumberGameScene,
    plugins: {
        global: [{
            key: 'rexWebFontLoader',
            plugin: WebFontLoaderPlugin,
            start: true
        }]
    }
};

const game = new Phaser.Game(config);
