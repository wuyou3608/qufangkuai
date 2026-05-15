export default class loadingScene extends Phaser.Scene {
    constructor() {
        super('loadingScene');
    }

    preload() {
        // 进度点的资源  loading 资源
        this.load.image('load_bg', 'assets/png/load_bg.png');
        this.load.image('load_jd', 'assets/png/load_jd.png');


        this.load.once('complete' , this.complete1.bind(this));     
    }
    
    complete1()
    {
        this.showloading();
        this.loadGameAssets(); // 加载游戏资源
        this.load.start();
    }


    showloading(){
        this.add.image(960,540,'load_bg');  
        this.progressBar = this.add.image(651,505,"load_jd");
        this.progressBar.setOrigin(0, 0.5); // 设置锚点为左边
        // // 记录原始宽高
        this.barFullWidth = this.progressBar.width;
        this.barHeight = this.progressBar.height;
        // // 初始裁剪为 0
        this.progressBar.setCrop(0, 0, 0, this.barHeight);
    }

    loadGameAssets()
    {
        this.load.image('bg', 'assets/png/bg.png');
        this.load.image('juxing', 'assets/png/juxing.png');
        this.load.image('huli1', 'assets/png/huli1.png');
        this.load.image('huli2', 'assets/png/huli2.png');
        this.load.image('daoju1', 'assets/png/daoju1.png');
        this.load.image('daoju2', 'assets/png/daoju2.png');
        this.load.image('zisekuang', 'assets/png/zisekuang.png');
        this.load.image('nanhai1', 'assets/png/nanhai1.png');
        this.load.image('nanhai2', 'assets/png/nanhai2.png');
        this.load.image('zhuozi', 'assets/png/zhuozi.png');
        this.load.image('duihao', 'assets/png/duihao.png');
        this.load.image('zhuazi', 'assets/png/zhuazi.png');

        this.load.audio('btnclick', 'assets/audio/btnclick.mp3');
        this.load.audio('jizhang', 'assets/audio/jizhang.mp3');
        this.load.audio('givemefive', 'assets/audio/givemefive.mp3');
        this.load.audio('error', 'assets/audio/error.mp3');
        this.load.audio('audio1', 'assets/audio/audio1.mp3');
        this.load.audio('audio2', 'assets/audio/audio2.mp3');
        this.load.audio('audio3', 'assets/audio/audio3.mp3');
        this.load.audio('audio4', 'assets/audio/audio4.mp3');
        this.load.audio('audio5', 'assets/audio/audio5.mp3');

        this.load.spineBinary("zhuanchang_data", "assets/spine/zhuanchang.skel");
        this.load.spineAtlas("zhuanchang_atlas", "assets/spine/zhuanchang.atlas");

        this.load.spineBinary("jieshu_data", "assets/spine/jieshu.skel");
        this.load.spineAtlas("jieshu_atlas", "assets/spine/jieshu.atlas");

        this.load.spineBinary("button_data", "assets/spine/button.skel");
        this.load.spineAtlas("button_atlas", "assets/spine/button.atlas");

        this.load.spineBinary("begin_data", "assets/spine/begin.skel");
        this.load.spineAtlas("begin_atlas", "assets/spine/begin.atlas");

        this.load.spineBinary("laba_data", "assets/spine/laba.skel");
        this.load.spineAtlas("laba_atlas", "assets/spine/laba.atlas");

        this.load.on('progress', this.onprogress.bind(this))
        this.load.on('complete' , this.complete2.bind(this))
    }

    onprogress(value)
    {
        const cropWidth = this.barFullWidth * value;
        this.progressBar.setCrop(0, 0, cropWidth, this.barHeight);
    }


    complete2()
    {
        this.scene.start('startScene');  
    }
}
