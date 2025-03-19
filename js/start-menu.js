export class StartMenu {
    constructor() {
        this.createStartMenu();
        this.selectedBackground = 'light'; // 默认选择沙漠地图
    }

    createStartMenu() {
        const startMenu = document.createElement('div');
        startMenu.id = 'startMenu';
        startMenu.className = 'game-over';
        startMenu.style.display = 'block';

        const content = `
            <h2>蛇霸天冲冲冲</h2>
            <div class="game-instructions">
                <h3>游戏操作说明</h3>
                <div class="instruction-item">
                    <span class="key-label">移动控制：</span>
                    <span class="key-desc">WASD 或 方向键</span>
                </div>
                <div class="instruction-item">
                    <span class="key-label">自动攻击：</span>
                    <span class="key-desc">空格键 开启/关闭</span>
                </div>
                <div class="instruction-item">
                    <span class="key-label">暂停游戏：</span>
                    <span class="key-desc">P 键</span>
                </div>
                <h3>游戏玩法说明</h3>
                <ul class="gameplay-tips">
                    <li>击杀敌人获得分数和食物</li>
                    <li>吃掉食物增加长度和分数</li>
                    <li>击杀特殊敌人获得更高分数</li>
                    <li>注意避免碰撞敌人和自身</li>
                </ul>
            </div>
            <div class="background-selection">
                <h3>选择地图</h3>
                <div class="background-options">
                    <div class="background-option" id="lightBackground">
                        <div class="bg-preview light-bg"></div>
                        <span>沙漠</span>
                    </div>
                    <div class="background-option" id="darkBackground">
                        <div class="bg-preview dark-bg"></div>
                        <span>星空</span>
                    </div>
                    <div class="background-option" id="marsBackground">
                        <div class="bg-preview mars-bg"></div>
                        <span>火星</span>
                    </div>
                    <div class="background-option" id="oceanBackground">
                        <div class="bg-preview ocean-bg"></div>
                        <span>海洋</span>
                    </div>
                </div>
            </div>
            <button id="startButton">开始游戏</button>
        `;

        startMenu.innerHTML = content;
        document.querySelector('.game-container').appendChild(startMenu);

        // 添加地图选择事件监听
        document.getElementById('lightBackground').addEventListener('click', () => {
            this.selectedBackground = 'light';
            this.removeAllSelectedClass();
            document.getElementById('lightBackground').classList.add('selected');
        });
        
        document.getElementById('darkBackground').addEventListener('click', () => {
            this.selectedBackground = 'dark';
            this.removeAllSelectedClass();
            document.getElementById('darkBackground').classList.add('selected');
        });
        
        document.getElementById('marsBackground').addEventListener('click', () => {
            this.selectedBackground = 'mars';
            this.removeAllSelectedClass();
            document.getElementById('marsBackground').classList.add('selected');
        });
        
        document.getElementById('oceanBackground').addEventListener('click', () => {
            this.selectedBackground = 'ocean';
            this.removeAllSelectedClass();
            document.getElementById('oceanBackground').classList.add('selected');
        });
        
        // 默认选中沙漠地图
        document.getElementById('lightBackground').classList.add('selected');
        
        // 添加开始游戏按钮事件监听
        document.getElementById('startButton').addEventListener('click', () => {
            // 设置选中的背景类型
            import('./config.js').then(module => {
                module.config.backgroundType = this.selectedBackground;
                this.hide();
                // 发布游戏开始事件
                document.dispatchEvent(new CustomEvent('gameStart'));
            });
        });
    }

    show() {
        document.getElementById('startMenu').style.display = 'block';
    }

    hide() {
        document.getElementById('startMenu').style.display = 'none';
    }
    
    removeAllSelectedClass() {
        document.getElementById('lightBackground').classList.remove('selected');
        document.getElementById('darkBackground').classList.remove('selected');
        document.getElementById('marsBackground').classList.remove('selected');
        document.getElementById('oceanBackground').classList.remove('selected');
    }
}