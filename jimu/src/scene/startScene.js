const FROM = 0.93;
const TO = 1;
const DURATION = 1500;
const START_DELAY= 1000;

export default class startScene extends Phaser.Scene {
    constructor() {
        super('startScene');
    }

    preload() { 
    }

    create() {   
        this.begin=this.add.spine(0,0,'begin_data','begin_atlas');
        // 先播放入场动画（只播1次）
        this.begin.animationState.setAnimation(0, 'in', false);

        // 监听动画结束
        this.begin.animationState.addListener({
        complete: (trackEntry) => {
            // 确认是 in 播完了
            if (trackEntry.animation.name === 'in') {
            // 切换 idle 循环播放
            this.begin.animationState.setAnimation(0, 'idle', true);
            }
        }
        });

        this.button=this.add.spine(960,840,'button_data','button_atlas');

        this.button.animationState.setAnimation(0, "idle", true);
        this.button.setInteractive();
        this.button.on('pointerdown', () => {
            this.zhuanchang=this.add.spine(0,0,'zhuanchang_data','zhuanchang_atlas');
            const track = this.zhuanchang.animationState.setAnimation(0, 'animation', false);

            // 动画总时长，闭幕占前一半
            const total = track.animation.duration;
            const closeEndTime = total / 2;

            // 闭幕结束瞬间，切场景，并把时间传给新场景
            this.time.delayedCall(closeEndTime * 1000, () => {
                this.scene.start("gameScene", { startAt: closeEndTime });
            });

        });
    }
 
}
