/**
 * 游戏场景 - NIM积木游戏
 * 
 * 游戏规则：
 * 1. 场上排列6个积木，玩家（小狐狸）和NPC（男孩）轮流取积木
 * 2. 每次最多取2个，且只能从左到右连续取
 * 3. 取走最后一个积木的一方获胜
 * 4. 男孩NPC使用NIM必胜策略（剩余数 % 3）
 * 
 * 选择规则（栈原理）：
 * - 从左到右依次选择积木（入栈）
 * - 只能从右到左依次取消选择（出栈），先取消左边的会播放错误音效
 * 
 * 音频规则：
 * - 播放音频不阻塞点击事件
 * - 新音频播放时自动停止旧音频
 * 
 * 图层深度(depth)说明：
 * 5   - 男孩角色(nanhai2)，在背景之上、桌子之下
 * 10  - 桌子(zhuozi)
 * 11  - 方框(juxing)，在桌子之上、积木之下
 * 15  - 积木(daoju2)、狐狸(huli2)、确认按钮(zhuazi)
 * 16  - 对勾图标(duihao)，在积木之上
 * 20  - 选择界面(zisekuang/huli1/nanhai1)、喇叭(laba)
 * 100 - 转场动画(zhuanchang)
 * 190 - 胜利遮罩层
 * 200 - 结束动画(jieshu)
 */

// ==================== 布局常量 ====================
const BLOCK_COUNT = 6;              // 积木总数
const BLOCK_SPACING = 190;          // 积木之间的水平间距(像素)
const BLOCK_CENTERX = 960;          // 积木排列的中心X坐标
const BLOCK_POSY = 540;             // 积木排列的Y坐标

const BOY_POSX = 960;               // 男孩角色X坐标
const BOY_POSY = 300;               // 男孩角色Y坐标(上方)
const FOX_POSX = 960;               // 狐狸角色X坐标
const FOX_POSY = 800;               // 狐狸角色Y坐标(下方)

// ==================== 方框常量 ====================
const FOX_BOX_X = 480;              // 狐狸方框X坐标(左侧)
const FOX_BOX_Y = 800;              // 狐狸方框Y坐标(下方)
const BOY_BOX_X = 1440;             // 男孩方框X坐标(右侧)
const BOY_BOX_Y = 280;              // 男孩方框Y坐标(上方)

// ==================== 游戏规则常量 ====================
const MAX_SELECT = 2;               // 每次最多可选积木数
const BLOCK_IN_BOX_SCALE = 0.5;     // 积木放入方框后的缩放比例
const BLOCK_IN_BOX_SPACING = 100;   // 方框内积木之间的间距(像素)
const BLOCK_IN_BOX_OFFSET_X = 60;   // 方框内积木整体向右偏移量(像素)

export default class gameScene extends Phaser.Scene {
    
    constructor() {
        super('gameScene');
    }

    preload() {
    }

    /**
     * 创建阶段 - 初始化场景所有元素
     * @param {Object} data - 场景传入数据，startAt为转场动画起始时间
     */
    create(data) {   
        const startAt = data.startAt || 0;

        // 转场动画：从指定时间点开始播放开幕效果
        const zhuanchang = this.add.spine(0, 0, 'zhuanchang_data', 'zhuanchang_atlas');
        zhuanchang.setDepth(100); 
        const track = zhuanchang.animationState.setAnimation(0, 'animation', false);
        track.trackTime = startAt;

        // 背景层
        this.add.image(960, 540, 'bg');
        
        // 桌子
        this.zhuozi = this.add.image(960, 640, 'zhuozi');
        this.zhuozi.setDepth(10);
        
        // 男孩角色 - 始终显示，不随选择界面隐藏
        this.nanhai2 = this.add.image(BOY_POSX, BOY_POSY, 'nanhai2');
        this.nanhai2.setDepth(5);
        
        // 选择先后手界面：紫色框 + 狐狸(先手) + 男孩(后手)
        this.zisekuang = this.add.image(960, 960, 'zisekuang');
        this.zisekuang.setDepth(20);
        
        this.huli1 = this.add.image(760, 960, 'huli1');
        this.huli1.setDepth(20);
        this.huli1.setInteractive();
        this.huli1.on('pointerdown', () => this.handleChoose(true));
        
        this.nanhai1 = this.add.image(1160, 960, 'nanhai1');
        this.nanhai1.setDepth(20);
        this.nanhai1.setInteractive();
        this.nanhai1.on('pointerdown', () => this.handleChoose(false));
        
        // 喇叭：用于播放语音提示
        this.laba = this.add.spine(160, 960, 'laba_data', 'laba_atlas');
        this.laba.setDepth(20);
        
        this.currentLabaAudio = 'audio1';
        this.currentAudio = null;       // 当前正在播放的音频实例，新音频会停止旧音频
        
        // 转场动画播放完成后再播放喇叭音频
        zhuanchang.animationState.addListener({
            complete: (entry) => {
                if (entry.animation.name === 'animation') {
                    this.playLabaAnimation('audio1');
                }
            }
        });
        
        // 创建积木
        this.createBlocks();
    }
    
    /**
     * 创建积木 - 从左到右依次排列，带从小变大的出场动画
     */
    createBlocks() {
        this.blocks = [];           // 积木游戏对象数组
        this.blockStates = [];      // 积木状态数组：true=在场，false=已被取走
        const startX = BLOCK_CENTERX - (BLOCK_COUNT - 1) * BLOCK_SPACING / 2;
        
        for (let i = 0; i < BLOCK_COUNT; i++) {
            const x = startX + i * BLOCK_SPACING;
            const block = this.add.image(x, BLOCK_POSY, 'daoju2');
            block.setDepth(15);
            block.setScale(0);
            block.blockIndex = i;
            this.blocks.push(block);
            this.blockStates.push(true);
            
            // 从左到右依次出现的放大动画
            this.tweens.add({
                targets: block,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Back.easeOut',
                delay: i * 100
            });
        }
    }
    
    /**
     * 处理先后手选择
     * @param {boolean} isFirst - true=玩家先手，false=玩家后手
     * 流程：隐藏选择界面 → 狐狸与方框一起出现 → 初始化游戏状态 → 开始回合
     */
    handleChoose(isFirst) {
        // 隐藏选择界面
        this.zisekuang.setVisible(false);
        this.huli1.setVisible(false);
        this.huli1.removeInteractive();
        this.nanhai1.setVisible(false);
        this.nanhai1.removeInteractive();
        
        // 狐狸角色与方框一起出现（首次创建带升起动画，之后直接显示）
        if (!this.huli2) {
            this.huli2 = this.add.image(FOX_POSX, FOX_POSY + 200, 'huli2');
            this.huli2.setDepth(15);
            this.huli2.setAlpha(0);
            this.tweens.add({
                targets: this.huli2,
                y: FOX_POSY,
                alpha: 1,
                duration: 500,
                ease: 'Cubic.easeOut'
            });
        } else {
            this.huli2.setVisible(true);
            this.huli2.setAlpha(1);
            this.huli2.y = FOX_POSY;
        }
        
        // 狐狸方框与狐狸一起出现
        if (!this.foxBox) {
            this.foxBox = this.add.image(FOX_BOX_X, FOX_BOX_Y + 200, 'juxing');
            this.foxBox.setOrigin(0.5, 0.5);
            this.foxBox.setDepth(11);
            this.foxBox.setAlpha(0);
            this.tweens.add({
                targets: this.foxBox,
                y: FOX_BOX_Y,
                alpha: 1,
                duration: 500,
                ease: 'Cubic.easeOut'
            });
        } else {
            this.foxBox.setVisible(true);
            this.foxBox.setAlpha(1);
            this.foxBox.y = FOX_BOX_Y;
        }
        
        // 男孩方框
        if (!this.boyBox) {
            this.boyBox = this.add.image(BOY_BOX_X, BOY_BOX_Y - 200, 'juxing');
            this.boyBox.setOrigin(0.5, 0.5);
            this.boyBox.setDepth(11);
            this.boyBox.setAlpha(0);
            this.tweens.add({
                targets: this.boyBox,
                y: BOY_BOX_Y,
                alpha: 1,
                duration: 500,
                ease: 'Cubic.easeOut'
            });
        } else {
            this.boyBox.setVisible(true);
            this.boyBox.setAlpha(1);
            this.boyBox.y = BOY_BOX_Y;
        }
        
        // 确认按钮
        if (!this.zhuazi) {
            const zhuoziRight = this.zhuozi.x + this.zhuozi.width / 2;
            this.zhuazi = this.add.image(zhuoziRight - 60, this.zhuozi.y, 'zhuazi');
            this.zhuazi.setDepth(15);
            this.zhuazi.setInteractive();
            this.zhuazi.on('pointerdown', () => this.confirmSelection());
        } else {
            this.zhuazi.setVisible(true);
        }
        
        // 初始化游戏状态
        this.selectedBlocks = [];       // 当前已选中的积木索引（栈结构）
        this.duihaoIcons = [];          // 对勾图标引用数组
        this.foxTakenBlocks = [];       // 狐狸已取走的积木索引
        this.boyTakenBlocks = [];       // 男孩已取走的积木索引
        this.isPlayerTurn = isFirst;    // 是否轮到玩家
        this.gameOver = false;          // 游戏是否结束
        this.isAnimating = false;       // 是否正在播放动画
        
        // 根据先后手开始对应回合
        if (this.isPlayerTurn) {
            this.startPlayerTurn();
        } else {
            this.startBoyTurn();
        }
    }
    
    /**
     * 启用积木交互 - 仅对仍在场上的积木启用点击
     */
    enableBlockInteraction() {
        this.blocks.forEach((block, i) => {
            if (this.blockStates[i]) {
                block.setInteractive();
                block.off('pointerdown');
                block.on('pointerdown', () => this.onBlockClick(i));
            }
        });
    }
    
    /**
     * 禁用所有积木交互
     */
    disableBlockInteraction() {
        this.blocks.forEach((block) => {
            block.removeInteractive();
        });
    }
    
    /**
     * 处理积木点击事件（栈原理）
     * @param {number} index - 被点击积木的索引
     * 
     * 选择规则（栈原理）：
     * - 选择：从左到右依次入栈
     * - 取消：只能从右到左依次出栈（取消栈顶），先取消左边的播放错误音效
     * - 最多选择MAX_SELECT(2)个积木
     * - 违规操作播放错误提示音
     */
    onBlockClick(index) {
        if (!this.isPlayerTurn || this.isAnimating || this.gameOver) return;
        
        // 点击已选中的积木 → 栈原理：只能取消栈顶（最后选的），否则播放错误音
        const selectedIndex = this.selectedBlocks.indexOf(index);
        if (selectedIndex !== -1) {
            if (index !== this.selectedBlocks[this.selectedBlocks.length - 1]) {
                this.playAudio('error');
                return;
            }
            this.selectedBlocks.pop();
            if (this.duihaoIcons[index]) {
                this.duihaoIcons[index].destroy();
                this.duihaoIcons[index] = null;
            }
            return;
        }
        
        // 已选数量达到上限 → 播放错误音
        if (this.selectedBlocks.length >= MAX_SELECT) {
            this.playAudio('error');
            return;
        }
        
        // 已有选中积木时，新选的必须是上一个的右边相邻积木
        if (this.selectedBlocks.length > 0) {
            const lastSelected = this.selectedBlocks[this.selectedBlocks.length - 1];
            if (index !== lastSelected + 1) {
                this.playAudio('error');
                return;
            }
        } else {
            // 首次选择时，不能跳过左边仍在场上的积木
            let hasLeftBlock = false;
            for (let i = 0; i < index; i++) {
                if (this.blockStates[i]) {
                    hasLeftBlock = true;
                    break;
                }
            }
            if (hasLeftBlock) {
                this.playAudio('error');
                return;
            }
        }
        
        // 选中积木，播放点击音效，显示对勾标记
        this.selectedBlocks.push(index);
        this.playAudio('btnclick');
        
        const block = this.blocks[index];
        const duihao = this.add.image(block.x + block.width * 0.3, block.y + block.height * 0.3, 'duihao');
        duihao.setDepth(16);
        duihao.setScale(0.5);
        this.duihaoIcons[index] = duihao;
    }
    
    /**
     * 确认选择 - 将选中的积木移动到狐狸方框内
     * 未选择任何积木时点击确认 → 播放错误音
     */
    confirmSelection() {
        if (!this.isPlayerTurn || this.isAnimating || this.gameOver) return;
        
        if (this.selectedBlocks.length === 0) {
            this.playAudio('error');
            return;
        }
        
        this.playAudio('btnclick');
        this.disableBlockInteraction();
        this.isAnimating = true;
        
        const blocksToMove = [...this.selectedBlocks];
        this.selectedBlocks = [];
        
        // 移动积木到狐狸方框，完成后切换到男孩回合
        this.moveBlocksToBox(blocksToMove, 'fox', () => {
            this.isAnimating = false;
            
            if (this.checkGameEnd('fox')) return;
            
            this.isPlayerTurn = false;
            this.startBoyTurn();
        });
    }
    
    /**
     * 将积木移动到方框内
     * @param {number[]} indices - 要移动的积木索引数组
     * @param {string} owner - 'fox'或'boy'，归属方
     * @param {Function} callback - 全部移动完成后的回调
     */
    moveBlocksToBox(indices, owner, callback) {
        const isFox = owner === 'fox';
        const takenList = isFox ? this.foxTakenBlocks : this.boyTakenBlocks;
        const boxX = isFox ? FOX_BOX_X : BOY_BOX_X;
        const boxY = isFox ? FOX_BOX_Y : BOY_BOX_Y;
        
        let completed = 0;
        const total = indices.length;
        const existingCount = takenList.length;
        
        indices.forEach((blockIndex, seq) => {
            const block = this.blocks[blockIndex];
            this.blockStates[blockIndex] = false;
            
            if (this.duihaoIcons[blockIndex]) {
                this.duihaoIcons[blockIndex].destroy();
                this.duihaoIcons[blockIndex] = null;
            }
            
            const posIndex = existingCount + seq;
            const targetX = boxX + BLOCK_IN_BOX_OFFSET_X + (posIndex - (BLOCK_COUNT - 1) / 2) * BLOCK_IN_BOX_SPACING;
            const targetY = boxY;
            
            this.tweens.add({
                targets: block,
                x: targetX,
                y: targetY,
                scaleX: BLOCK_IN_BOX_SCALE,
                scaleY: BLOCK_IN_BOX_SCALE,
                duration: 500,
                delay: seq * 200,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    takenList.push(blockIndex);
                    completed++;
                    if (completed === total) {
                        if (callback) callback();
                    }
                }
            });
        });
    }
    
    /**
     * 开始玩家回合
     * 播放提示音(audio2:轮到小狐拿咯)，启用积木交互
     */
    startPlayerTurn() {
        this.currentLabaAudio = 'audio2';
        this.playLabaAnimation('audio2');
        this.enableBlockInteraction();
    }
    
    /**
     * 开始男孩回合（NPC自动操作）
     * 延迟800ms后，计算最优取法并自动移动积木
     */
    startBoyTurn() {
        this.isPlayerTurn = false;
        this.disableBlockInteraction();
        
        this.time.delayedCall(800, () => {
            const remaining = this.getRemainingBlocks();
            const takeCount = this.getBoyOptimalTake(remaining);
            const indices = this.getLeftmostAvailable(takeCount);
            
            this.moveBlocksToBox(indices, 'boy', () => {
                this.isAnimating = false;
                
                if (this.checkGameEnd('boy')) return;
                
                this.isPlayerTurn = true;
                this.startPlayerTurn();
            });
        });
    }
    
    /**
     * 获取场上剩余积木数量
     */
    getRemainingBlocks() {
        return this.blockStates.filter(s => s).length;
    }
    
    /**
     * 获取场上剩余积木的索引数组
     */
    getRemainingIndices() {
        const indices = [];
        for (let i = 0; i < this.blockStates.length; i++) {
            if (this.blockStates[i]) indices.push(i);
        }
        return indices;
    }
    
    /**
     * NIM必胜策略：计算男孩最优取积木数
     * 核心公式：remaining % (MAX_SELECT + 1)
     * - 余数为0时取1（不利局面，尽量拖延）
     * - 余数不为0时取余数（必胜取法，使剩余数为3的倍数）
     * @param {number} remaining - 剩余积木数
     * @returns {number} 应取的积木数
     */
    getBoyOptimalTake(remaining) {
        const mod = remaining % (MAX_SELECT + 1);
        if (mod === 0) {
            return 1;
        }
        return mod;
    }
    
    /**
     * 从左到右获取指定数量的可用积木索引
     * @param {number} count - 需要获取的积木数量
     * @returns {number[]} 积木索引数组
     */
    getLeftmostAvailable(count) {
        const indices = [];
        for (let i = 0; i < this.blockStates.length && indices.length < count; i++) {
            if (this.blockStates[i]) {
                indices.push(i);
            }
        }
        return indices;
    }
    
    /**
     * 检查游戏是否结束
     * @param {string} lastTaker - 最后取积木的一方('fox'或'boy')
     * @returns {boolean} 游戏是否已结束
     */
    checkGameEnd(lastTaker) {
        const remaining = this.getRemainingBlocks();
        if (remaining > 0) return false;
        
        this.gameOver = true;
        this.disableBlockInteraction();
        
        if (lastTaker === 'boy') {
            this.handleBoyWin();
        } else {
            this.handlePlayerWin();
        }
        
        return true;
    }
    
    /**
     * 处理男孩获胜（玩家失败）
     * 流程：播放audio3(再试试) → 积木归位 → 延迟1秒 → 播放audio4(谁先拿) → 重新选择先后手
     */
    handleBoyWin() {
        this.playAudioWithCallback('audio3', () => {
            this.returnBlocksToOriginal(() => {
                this.time.delayedCall(1000, () => {
                    this.currentLabaAudio = 'audio1';
                    this.playLabaAnimation('audio4');
                    
                    this.foxTakenBlocks = [];
                    this.boyTakenBlocks = [];
                    this.gameOver = false;
                    this.isPlayerTurn = true;
                    this.startChoosePhase();
                });
            });
        });
    }
    
    /**
     * 将所有积木动画移回原始位置
     * @param {Function} callback - 全部归位后的回调
     */
    returnBlocksToOriginal(callback) {
        const startX = BLOCK_CENTERX - (BLOCK_COUNT - 1) * BLOCK_SPACING / 2;
        let completed = 0;
        const total = BLOCK_COUNT;
        
        for (let i = 0; i < BLOCK_COUNT; i++) {
            const block = this.blocks[i];
            const targetX = startX + i * BLOCK_SPACING;
            const targetY = BLOCK_POSY;
            
            this.blockStates[i] = true;
            
            this.tweens.add({
                targets: block,
                x: targetX,
                y: targetY,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                delay: i * 100,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    completed++;
                    if (completed === total) {
                        if (callback) callback();
                    }
                }
            });
        }
    }
    
    /**
     * 重新显示选择先后手界面
     * nanhai2保持显示，只隐藏狐狸和方框
     */
    startChoosePhase() {
        this.zisekuang.setVisible(true);
        
        this.huli1.setVisible(true);
        this.huli1.setInteractive();
        this.huli1.off('pointerdown');
        this.huli1.on('pointerdown', () => this.handleChoose(true));
        
        this.nanhai1.setVisible(true);
        this.nanhai1.setInteractive();
        this.nanhai1.off('pointerdown');
        this.nanhai1.on('pointerdown', () => this.handleChoose(false));
        
        // nanhai2保持显示，只隐藏狐狸和方框
        this.huli2.setVisible(false);
        this.foxBox.setVisible(false);
        this.boyBox.setVisible(false);
        this.zhuazi.setVisible(false);
    }
    
    /**
     * 处理玩家获胜
     * 流程：播放audio5(表扬) → 降低场景亮度 → 播放jieshu动画(idle1+jizhang) → 点击播放touch+givemefive → idle2
     */
    handlePlayerWin() {
        this.playAudioWithCallback('audio5', () => {
            // 半透明黑色遮罩，降低场景亮度50%
            const overlay = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.5);
            overlay.setDepth(190);
            
            // 结束动画
            const jieshu = this.add.spine(0, 0, 'jieshu_data', 'jieshu_atlas');
            jieshu.setDepth(200);
            jieshu.animationState.setAnimation(0, 'idle1', true);
            this.playAudio('jizhang');
            
            // 点击结束动画：播放touch动画和givemefive音效，完成后播放idle2
            jieshu.setInteractive();
            jieshu.on('pointerdown', () => {
                jieshu.removeInteractive();
                jieshu.animationState.setAnimation(0, 'touch', false);
                this.playAudio('givemefive');
                
                jieshu.animationState.addListener({
                    complete: (entry) => {
                        if (entry.animation.name === 'touch') {
                            jieshu.animationState.setAnimation(0, 'idle2', true);
                        }
                    }
                });
            });
        });
    }
    
    /**
     * 播放音频 - 新音频会停止旧音频，不阻塞点击事件
     * @param {string} key - 音频资源键名
     */
    playAudio(key) {
        // 停止当前正在播放的音频
        if (this.currentAudio) {
            this.currentAudio.stop();
            this.currentAudio = null;
        }
        const audio = this.sound.add(key);
        this.currentAudio = audio;
        audio.on('complete', () => {
            if (this.currentAudio === audio) {
                this.currentAudio = null;
            }
        });
        audio.play();
    }
    
    /**
     * 播放音频并带回调 - 音频完成或被停止时都会触发回调
     * 用于需要等待音频结束后继续游戏流程的场景
     * @param {string} key - 音频资源键名
     * @param {Function} callback - 音频结束后的回调
     */
    playAudioWithCallback(key, callback) {
        // 停止当前正在播放的音频
        if (this.currentAudio) {
            this.currentAudio.stop();
            this.currentAudio = null;
        }
        const audio = this.sound.add(key);
        this.currentAudio = audio;
        let callbackCalled = false;
        const callOnce = () => {
            if (callbackCalled) return;
            callbackCalled = true;
            if (this.currentAudio === audio) {
                this.currentAudio = null;
            }
            callback();
        };
        audio.on('complete', callOnce);
        audio.on('stop', callOnce);
        audio.play();
    }
    
    /**
     * 播放喇叭动画+音频
     * 喇叭播放talk动画，音频完成或被停止后切换为idle动画
     * @param {string} audioKey - 音频资源键名
     */
    playLabaAnimation(audioKey) {
        // 停止当前正在播放的音频
        if (this.currentAudio) {
            this.currentAudio.stop();
            this.currentAudio = null;
        }
        const laba = this.laba;
        const audio = this.sound.add(audioKey);
        this.currentAudio = audio;
        
        laba.animationState.setAnimation(0, 'talk', true);
        
        const onAudioEnd = () => {
            laba.animationState.setAnimation(0, 'idle', true);
            if (this.currentAudio === audio) {
                this.currentAudio = null;
            }
        };
        audio.on('complete', onAudioEnd);
        audio.on('stop', onAudioEnd);
        audio.play();
    }
    
}
