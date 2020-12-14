import 'phaser';

export default class NumbersGame extends Phaser.Scene
{
    constructor ()
    {
        super('demo');
    }

    preload ()
    {
        // this.load.image('logo', 'assets/phaser3-logo.png');
    }

    create ()
    {
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
}

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#125555',
    width: 720,
    height: 1280,
    scene: NumbersGame,
    canvas: document.querySelector('canvas');
};

const game = new Phaser.Game(config);
