
import loadingScene from './scene/loadingScene.js';
import startScene from './scene/startScene.js';
import gameScene from './scene/gameScene.js';

const config = 
{
    type:Phaser.AUTO,
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    scale: {
        mode: Phaser.Scale.FIT,     // 让游戏自动缩放
        autoCenter: Phaser.Scale.CENTER_BOTH, // 水平垂直居中
    },
    plugins: {
        scene: [
            { 
                key: "spine.SpinePlugin", 
                plugin:  spine.SpinePlugin, 
                mapping: "spine" 
            },
        ]
    }, 
    scene:[ loadingScene,startScene ,gameScene ]
}
new Phaser.Game(config);
