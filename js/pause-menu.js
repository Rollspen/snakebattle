export class PauseMenu {
    constructor() {
        this.gameCore = null;
        this.createPauseMenu();
    }

    createPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pauseMenu';
        pauseMenu.className = 'game-over';
        pauseMenu.style.display = 'none';

        const content = `
            <h2>游戏暂停</h2>
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
            <div id="weapon-info" class="weapon-info">
                <h3>当前武器信息</h3>
                <div id="weapon-list">暂无武器信息</div>
            </div>
            <button id="resumeButton">继续游戏</button>
        `;

        pauseMenu.innerHTML = content;
        document.querySelector('.game-container').appendChild(pauseMenu);

        // 添加继续游戏按钮事件监听
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.hide();
            // 发布暂停状态改变事件
            document.dispatchEvent(new CustomEvent('pauseStateChange', { detail: { isPaused: false } }));
        });
    }

    // 更新武器信息显示
    updateWeaponInfo(gameCore) {
        if (!gameCore || !gameCore.weaponManager) return;
        
        this.gameCore = gameCore;
        const weaponListElement = document.getElementById('weapon-list');
        if (!weaponListElement) return;
        
        // 获取当前激活的武器列表
        const activeWeapons = gameCore.weaponManager.activeWeapons;
        if (!activeWeapons || activeWeapons.length === 0) {
            weaponListElement.innerHTML = '<div class="weapon-item">暂无武器</div>';
            return;
        }
        
        // 构建武器信息HTML
        let weaponInfoHTML = '';
        activeWeapons.forEach(weaponType => {
            const weapon = gameCore.weaponManager.weapons[weaponType];
            if (!weapon) return;
            
            // 根据武器类型获取武器名称
            let weaponName = '未知武器';
            let weaponColor = '#ffffff';
            
            switch(weaponType) {
                case 'default':
                    weaponName = '默认武器';
                    weaponColor = '#ffffff';
                    break;
                case 'electric':
                    weaponName = '电击武器';
                    weaponColor = '#00FFFF';
                    break;
                case 'fire':
                    weaponName = '火焰武器';
                    weaponColor = '#FF69B4';
                    break;
                case 'acid':
                    weaponName = '酸液武器';
                    weaponColor = '#32CD32';
                    break;
                case 'sonic':
                    weaponName = '声波武器';
                    weaponColor = '#FFD700';
                    break;
            }
            
            // 计算实际攻击力
            const actualAttackPower = weapon.getActualAttackPower ? 
                weapon.getActualAttackPower().toFixed(1) : 
                weapon.attackPower.toFixed(1);
            
            // 计算每次攻击的子弹数量
            let bulletCount = '未知';
            const snakeLength = this.gameCore.snake.length;
            
            switch(weaponType) {
                case 'default':
                    bulletCount = 1 + Math.floor(snakeLength / 5);
                    break;
                case 'electric':
                    bulletCount = Math.floor(snakeLength / 4);
                    break;
                case 'fire':
                    bulletCount = Math.floor(snakeLength / 2);
                    break;
                case 'acid':
                    bulletCount = Math.floor(snakeLength * 0.2);
                    break;
                case 'sonic':
                    bulletCount = 12; // 固定12个子弹
                    break;
            }
            
            // 准备tooltip提示文本
            let attackPowerTooltip = '';
            if (weapon.getActualAttackPower) {
                attackPowerTooltip = `基础攻击力: ${weapon.attackPower}\n根据武器类型和拾取食物计算得出`;
            } else {
                attackPowerTooltip = `固定攻击力: ${weapon.attackPower}`;
            }
            
            let attackRateTooltip = `每秒攻击次数: ${weapon.attackRate}`;
            
            let bulletCountTooltip = '';
            switch(weaponType) {
                case 'default':
                    bulletCountTooltip = `计算公式: 1 + Math.floor(蛇长度 / 5)\n当前蛇长度: ${snakeLength}`;
                    break;
                case 'electric':
                    bulletCountTooltip = `计算公式: Math.floor(蛇长度 / 4)\n当前蛇长度: ${snakeLength}`;
                    break;
                case 'fire':
                    bulletCountTooltip = `计算公式: Math.floor(蛇长度 / 2)\n当前蛇长度: ${snakeLength}`;
                    break;
                case 'acid':
                    bulletCountTooltip = `计算公式: Math.floor(蛇长度 * 0.2)\n当前蛇长度: ${snakeLength}`;
                    break;
                case 'sonic':
                    bulletCountTooltip = `固定值: 12个子弹`;
                    break;
            }
            
            // 构建武器信息HTML
            weaponInfoHTML += `
                <div class="weapon-item">
                    <div class="weapon-name" style="color: ${weaponColor}">${weaponName}</div>
                    <div class="weapon-stats">
                        <div class="stat-item">
                            <span class="stat-label">攻击力:</span>
                            <span class="stat-value tooltip" data-tooltip="${attackPowerTooltip}">${actualAttackPower}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">攻击频率:</span>
                            <span class="stat-value tooltip" data-tooltip="${attackRateTooltip}">${weapon.attackRate.toFixed(1)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">攻击数量:</span>
                            <span class="stat-value tooltip" data-tooltip="${bulletCountTooltip}">${bulletCount}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        weaponListElement.innerHTML = weaponInfoHTML;
    }
    
    show() {
        document.getElementById('pauseMenu').style.display = 'block';
        // 如果有gameCore引用，则更新武器信息
        if (this.gameCore) {
            this.updateWeaponInfo(this.gameCore);
        }
    }

    hide() {
        document.getElementById('pauseMenu').style.display = 'none';
    }
}