export class WebFontFile extends Phaser.Loader.File {

    constructor(loader, fileConfig) {
        super(loader, fileConfig);
    }

    load() {

        if (this.state == Phaser.Loader.FILE_POPULATED) {
            this.loader.nextFile(this,true);
            return;
        }

        let font = new FontFace(this.key,"url(" + this.url +")");
        document.fonts.add(font);

        font.load().then(() => {
            console.log("Loaded font: " + this.key);
            this.loader.nextFile(this,true);
        },
        () => {
            console.error("Failed to load font: " + this.key);
            this.loader.nextFile(this,false);
        });
     
    }
}

let loaderCallback = function(key, config) {
    console.log("loaderCallback is called",key,config);
    config = {
        key : key,
        type : "webfont",
        url : config,
        config : config
    };
    this.addFile(new WebFontFile(this,config));
    return this;
}

export class WebFontLoaderPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
        pluginManager.registerFileType("webfont",loaderCallback);
    }
    addToScene(scene) {
        scene.sys.load["webfont"] = loaderCallback;
    }
}