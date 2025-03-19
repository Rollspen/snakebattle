import { config } from './config.js';
import { Bullet, RedEnemy, PurpleEnemy, PinkEnemy, OrangeEnemy, FloatingText } from './entities.js';
import { GameRenderer } from './renderer.js';
import { PauseMenu } from './pause-menu.js';
import { ParticleSystem } from './particle-system.js';
import { StartMenu } from './start-menu.js';
import { WeaponManager, DefaultWeapon } from './weapons.js';

export class GameCore {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new GameRenderer(canvas);
        this.initializeGameState();
        this.setupEventListeners();
        this.totalAttackBonus = 0;  // 初始化总攻击力加成
        this.pauseMenu = new PauseMenu();  // 初始化暂停菜单
        this.startMenu = new StartMenu();  // 初始化开始菜单
        this.particleSystem = new ParticleSystem(canvas);  // 初始化粒子系统
        this.weaponManager = new WeaponManager(this);  // 初始化武器管理器
        this.isGameStarted = false;  // 游戏是否已开始的标志
    }

    initializeGameState() {
        this.snake = [];
        this.food = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameLoop = null;
        this.currentSpeed = config.initialSpeed;
        this.isPaused = false;
        this.bullets = [];
        this.enemies = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.enemySpawnTimer = null;
        this.bossSpawnTimer = null; // BOSS生成定时器
        this.gameStartTime = 0;
        this.pauseStartTime = null; // 初始化暂停开始时间
        this.currentEnemySpeed = config.enemySpeed;
        this.gameTimer = null;
        this.foodCount = 0;
        this.floatingTexts = [];
        this.redEnemyKillCount = 0;
        this.purpleEnemyKillCount = 0;
        this.pinkEnemyKillCount = 0;
        this.totalAttackBonus = 0;  // 重置总攻击力加成
        this.isAutoAttacking = true;  // 默认开启自动攻击
        this.lastAutoAttackTime = 0;  // 初始化最后一次自动攻击时间
        
        // 重置武器管理器
        if (this.weaponManager) {
            this.weaponManager = new WeaponManager(this);
        }

        // 获取DOM元素
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverElement = document.getElementById('gameOver');
        this.timerElement = document.getElementById('timer');
    }

    setupEventListeners() {
        // 监听游戏开始事件
        document.addEventListener('gameStart', () => {
            this.isGameStarted = true;
            this.start();
        });
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.isPaused = !this.isPaused;
                if (this.isPaused) {
                    // 显示暂停菜单并传递gameCore引用
                    this.pauseMenu.updateWeaponInfo(this);
                    this.pauseMenu.show();
                    if (this.gameLoop) clearInterval(this.gameLoop);
                    if (this.enemySpawnTimer) clearInterval(this.enemySpawnTimer);
                    if (this.bossSpawnTimer) clearInterval(this.bossSpawnTimer);
                    if (this.gameTimer) clearInterval(this.gameTimer);
                    
                    // 记录暂停时间
                    this.pauseStartTime = Date.now();
                } else {
                    this.pauseMenu.hide();
                    
                    // 计算暂停的时间并调整游戏开始时间
                    if (this.pauseStartTime) {
                        const pauseDuration = Date.now() - this.pauseStartTime;
                        this.gameStartTime += pauseDuration; // 调整游戏开始时间，补偿暂停的时间
                        console.log(`游戏暂停了${Math.floor(pauseDuration/1000)}秒，已调整游戏开始时间`);
                    }
                    
                    this.gameLoop = setInterval(() => this.gameStep(), this.currentSpeed);
                    this.enemySpawnTimer = setInterval(() => {
                        if (this.enemies.length < config.maxEnemies) {
                            this.enemies.push(new RedEnemy());
                        }
                    }, config.enemySpawnInterval);
                    
                    // 恢复BOSS生成定时器
                    const timeElapsedSinceStart = Date.now() - this.gameStartTime;
                    console.log(`暂停后恢复：游戏已运行${Math.floor(timeElapsedSinceStart/1000)}秒`);
                    
                    // 重新设置BOSS生成定时器
                    this.bossSpawnTimer = setInterval(() => {
                        const gameTimeSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
                        console.log(`暂停后恢复：尝试生成BOSS，当前游戏时间: ${gameTimeSeconds}秒`);
                        
                        // 导入BossEnemy类
                        import('./boss-enemy.js').then(module => {
                            const BossEnemy = module.BossEnemy;
                            // 创建BOSS并传入当前游戏时间
                            this.enemies.push(new BossEnemy(gameTimeSeconds));
                            // 显示BOSS出现的提示
                            this.floatingTexts.push(new FloatingText(
                                config.canvasWidth / 2,
                                config.canvasHeight / 2,
                                "BOSS出现了！",
                                "#ff0000"
                            ));
                            console.log(`暂停后恢复：BOSS已生成，当前游戏时间: ${gameTimeSeconds}秒`);
                        });
                    }, config.bossSpawnInterval);
                    
                    this.gameTimer = setInterval(() => this.updateTimer(), 1000);
                }
                return;
            }

            if (this.isPaused) return;

            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
                case ' ':
                    this.isAutoAttacking = !this.isAutoAttacking;
                    if (this.isAutoAttacking) {
                        this.lastAutoAttackTime = Date.now() - 200; // 确保立即开始发射
                    }
                    break;
            }
        });

        // 鼠标移动事件（保留但不再用于发射子弹）
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    start() {
        // 如果游戏尚未开始，则显示开始菜单并返回
        if (!this.isGameStarted) {
            this.startMenu.show();
            return;
        }
        
        this.canvas.width = config.canvasWidth;
        this.canvas.height = config.canvasHeight;
        
        this.gameStartTime = Date.now();
        console.log(`游戏开始时间: ${new Date(this.gameStartTime).toISOString()}, BOSS生成间隔: ${config.bossSpawnInterval}毫秒`);
        if (this.gameTimer) clearInterval(this.gameTimer);
        this.gameTimer = setInterval(() => this.updateTimer(), 1000);
        this.timerElement.textContent = '00:00';

        const startX = Math.floor(config.canvasWidth / (2 * config.gridSize)) * config.gridSize;
        const startY = Math.floor(config.canvasHeight / (2 * config.gridSize)) * config.gridSize;
        this.snake = [
            { x: startX, y: startY },
            { x: startX - config.gridSize, y: startY },
            { x: startX - config.gridSize * 2, y: startY }
        ];

        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.currentSpeed = config.initialSpeed;
        this.scoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'none';
        this.bullets = [];
        this.enemies = [];
        this.food = [];
        this.foodCount = 0;
        this.generateFood();

        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.gameStep(), this.currentSpeed);

        if (this.enemySpawnTimer) clearInterval(this.enemySpawnTimer);
        this.enemySpawnTimer = setInterval(() => {
            if (this.enemies.length < config.maxEnemies) {
                this.enemies.push(new RedEnemy());
            }
        }, config.enemySpawnInterval);
        
        // 初始化BOSS生成定时器
        if (this.bossSpawnTimer) clearInterval(this.bossSpawnTimer);
        
        // 设置BOSS生成定时器，每30秒生成一个BOSS
        console.log(`初始化BOSS生成定时器，间隔: ${config.bossSpawnInterval}毫秒`);
        this.bossSpawnTimer = setInterval(() => {
            // 计算当前游戏时间（秒）
            const gameTimeSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
            console.log(`尝试生成BOSS，当前游戏时间: ${gameTimeSeconds}秒，定时器ID: ${this.bossSpawnTimer}`);
            
            // 导入BossEnemy类
            import('./boss-enemy.js').then(module => {
                const BossEnemy = module.BossEnemy;
                // 创建BOSS并传入当前游戏时间
                this.enemies.push(new BossEnemy(gameTimeSeconds));
                // 显示BOSS出现的提示
                this.floatingTexts.push(new FloatingText(
                    config.canvasWidth / 2,
                    config.canvasHeight / 2,
                    "BOSS出现了！",
                    "#ff0000"
                ));
                console.log(`BOSS已生成，当前游戏时间: ${gameTimeSeconds}秒，敌人总数: ${this.enemies.length}`);
            }).catch(error => {
                console.error(`BOSS生成失败: ${error.message}`);
            });
        }, config.bossSpawnInterval); // 每30秒生成一次BOSS
    }

    updateTimer() {
        if (this.gameStartTime === 0) return;
        const currentTime = Date.now();
        const elapsedTime = Math.floor((currentTime - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        this.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // 更新难度等级
        const level = Math.floor(elapsedTime / 30) + 1;
        document.getElementById('level').textContent = `Level ${level}`;

        // 同步更新玩家状态面板
        const speedUpTimes = Math.floor(elapsedTime / config.timeSpeedUpInterval);
        const speedMultiplier = 1 + (speedUpTimes * config.speedUpAmount);
        
        // 更新状态面板
        this.updateStatusPanel(speedMultiplier);
    }

    generateFood(x = null, y = null) {
        if (this.foodCount >= config.maxFoodCount) return;
        
        if (x === null || y === null) {
            const gridWidth = config.canvasWidth / config.gridSize;
            const gridHeight = config.canvasHeight / config.gridSize;

            while (true) {
                x = Math.floor(Math.random() * gridWidth) * config.gridSize;
                y = Math.floor(Math.random() * gridHeight) * config.gridSize;
                
                if (!this.snake.some(segment => segment.x === x && segment.y === y) &&
                    !this.food.some(f => f.x === x && f.y === y)) {
                    break;
                }
            }
        }

        this.food.push({ 
            x, 
            y, 
            isBlinking: false,
            createdTime: Date.now(),
            duration: 8000,  // 持续时间8秒
            blinkStartTime: 6000  // 开始闪烁的时间点（最后2秒）
        });
        this.foodCount++;
    }

    updateBullets() {
        this.bullets = this.bullets.filter(bullet => !bullet.isOutOfBounds());
        this.bullets.forEach(bullet => bullet.update());
    }

    checkCollision(head) {
        if (head.x < 0 || head.x >= config.canvasWidth ||
            head.y < 0 || head.y >= config.canvasHeight) {
            return true;
        }
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    gameOver() {
        // 清除所有定时器
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.enemySpawnTimer) {
            clearInterval(this.enemySpawnTimer);
            this.enemySpawnTimer = null;
        }
        if (this.bossSpawnTimer) {
            clearInterval(this.bossSpawnTimer);
            this.bossSpawnTimer = null;
        }
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
    }

    gameStep() {
        if (this.gameStartTime === 0) {
            this.gameStartTime = Date.now();
        }
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.gameStartTime;
        const speedUpTimes = Math.floor(elapsedTime / config.timeSpeedUpInterval);
        
        // 处理自动攻击
        if (this.isAutoAttacking && this.snake.length > 0) {
            const currentTime = Date.now();
            if (currentTime - this.lastAutoAttackTime >= 200) { // 每200ms发射一次
                // 使用武器管理器处理所有武器的攻击
                this.weaponManager.attackWithAllWeapons();
                this.lastAutoAttackTime = currentTime;
            }
        }
        
        const speedMultiplier = 1 + (speedUpTimes * config.speedUpAmount);
        this.currentEnemySpeed = config.enemySpeed * speedMultiplier;
        const newSpeed = config.initialSpeed / speedMultiplier;
        
        // 更新状态面板
        this.updateStatusPanel(speedMultiplier);
        
        if (this.gameLoop && this.currentSpeed !== newSpeed) {
            this.currentSpeed = newSpeed;
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.gameStep(), this.currentSpeed);
        }

        this.direction = this.nextDirection;

        const head = { ...this.snake[0] };
        switch (this.direction) {
            case 'up': head.y -= config.gridSize; break;
            case 'down': head.y += config.gridSize; break;
            case 'left': head.x -= config.gridSize; break;
            case 'right': head.x += config.gridSize; break;
        }

        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        const foodIndex = this.food.findIndex(f => f.x === head.x && f.y === head.y);
        if (foodIndex !== -1) {
            const food = this.food[foodIndex];
            let scoreIncrease = 10; // 默认香蕉分值
            if (food.type === 'carrot') {
                scoreIncrease = 25;
            } else if (food.type === 'cucumber') {
                scoreIncrease = 55;
            } else if (food.type === 'watermelon') {
                scoreIncrease = 120;
            } else if (food.type === 'syringe') {
                scoreIncrease = 200; // 针剂给予更高分数
                
                // 如果是针剂升级道具，随机升级一个武器
                if (food.isPowerUp) {
                    if (food.powerUpType === 'electric') {
                        // 兼容旧版本，直接添加电击武器
                        if (this.weaponManager.addWeapon('electric')) {
                            this.floatingTexts.push(new FloatingText(
                                head.x + config.gridSize / 2,
                                head.y - 40,
                                "获得电击武器！",
                                '#00FFFF'
                            ));
                        }
                    } else {
                        // 随机升级一个武器
                        const result = this.weaponManager.upgradeRandomWeapon();
                        if (result) {
                            // 根据最新添加的武器类型显示不同的提示
                            const latestWeapon = this.weaponManager.activeWeapons[this.weaponManager.activeWeapons.length - 1];
                            let weaponName = "新武器";
                            let textColor = '#FFFFFF';
                            
                            if (latestWeapon === 'electric') {
                                weaponName = "电击武器";
                                textColor = '#00FFFF';
                            } else if (latestWeapon === 'fire') {
                                weaponName = "火焰武器";
                                textColor = '#FF4500';
                            } else if (latestWeapon === 'acid') {
                                weaponName = "毒液武器";
                                textColor = '#32CD32';
                            } else if (latestWeapon === 'sonic') {
                                weaponName = "声波武器";
                                textColor = '#FFD700';
                            }
                            
                            this.floatingTexts.push(new FloatingText(
                                head.x + config.gridSize / 2,
                                head.y - 40,
                                `获得${weaponName}！`,
                                textColor
                            ));
                        }
                    }
                }
            }
            this.score += scoreIncrease;
            this.scoreElement.textContent = this.score;
            this.floatingTexts.push(new FloatingText(head.x + config.gridSize / 2, head.y, `+${scoreIncrease}`, '#2ecc71'));
            
            // 如果食物有攻击力加成，更新总攻击力加成并显示提示文本
            if (food.attackBonus) {
                this.totalAttackBonus += food.attackBonus;
                this.floatingTexts.push(new FloatingText(
                    head.x + config.gridSize / 2,
                    head.y - 20,
                    `攻击力+${food.attackBonus}`,
                    '#e67e22'
                ));
            }
            
            this.foodCount--;
            this.food.splice(foodIndex, 1);
        } else {
            this.snake.pop();
        }

        this.floatingTexts = this.floatingTexts.filter(text => text.update());

        this.updateBullets();

        this.enemies.forEach(enemy => enemy.update(head, this.currentEnemySpeed));

        const collidedEnemyIndex = this.enemies.findIndex(enemy => enemy.checkCollision(head));
        if (collidedEnemyIndex !== -1) {
            const enemy = this.enemies[collidedEnemyIndex];
            this.enemies.splice(collidedEnemyIndex, 1);
            
            let scoreDecrease = 20;
            let segmentsToRemove = 2;
            
            if (enemy instanceof OrangeEnemy) {
                scoreDecrease = 300;
                segmentsToRemove = 5;
            } else if (enemy instanceof PinkEnemy) {
                scoreDecrease = 150;
                segmentsToRemove = 4;
            } else if (enemy instanceof PurpleEnemy) {
                scoreDecrease = 50;
                segmentsToRemove = 3;
            }
            
            this.score = Math.max(0, this.score - scoreDecrease);
            this.scoreElement.textContent = this.score;
            this.floatingTexts.push(new FloatingText(head.x + config.gridSize / 2, head.y, `-${scoreDecrease}`, '#e74c3c'));
            
            if (this.snake.length > segmentsToRemove) {
                for (let i = 0; i < segmentsToRemove; i++) {
                    this.snake.pop();
                }
            } else if (this.snake.length > 1) {
                while (this.snake.length > 1) {
                    this.snake.pop();
                }
            } else {
                this.gameOver();
                return;
            }
        }

        this.bullets = this.bullets.filter(bullet => {
            const hitEnemyIndex = this.enemies.findIndex(enemy => enemy.checkBulletCollision(bullet));
            if (hitEnemyIndex !== -1) {
                const enemy = this.enemies[hitEnemyIndex];
                // 创建子弹碰撞粒子效果
                this.particleSystem.createBulletHitParticles(bullet.x, bullet.y, enemy.color);
                if (enemy.takeDamage()) {
                    if (enemy instanceof RedEnemy) {
                        this.redEnemyKillCount++;
                        if (this.redEnemyKillCount >= config.killCountForPurple) {
                            this.redEnemyKillCount = 0;
                            this.enemies.push(new PurpleEnemy());
                        }
                    } else if (enemy instanceof PurpleEnemy) {
                        this.purpleEnemyKillCount++;
                        if (this.purpleEnemyKillCount >= config.killCountForPink) {
                            this.purpleEnemyKillCount = 0;
                            this.enemies.push(new PinkEnemy());
                        }
                        this.redEnemyKillCount += 2;
                        if (this.redEnemyKillCount >= config.killCountForPurple) {
                            this.redEnemyKillCount = 0;
                            this.enemies.push(new PurpleEnemy());
                        }
                    } else if (enemy instanceof PinkEnemy) {
                        this.pinkEnemyKillCount++;
                        if (this.pinkEnemyKillCount >= config.killCountForOrange) {
                            this.pinkEnemyKillCount = 0;
                            this.enemies.push(new OrangeEnemy());
                        }
                        this.purpleEnemyKillCount += 2;
                        if (this.purpleEnemyKillCount >= config.killCountForPink) {
                            this.purpleEnemyKillCount = 0;
                            this.enemies.push(new PinkEnemy());
                        }
                    }
                    if (this.foodCount < config.maxFoodCount) {
                        const convertedFoods = enemy.convertToFood();
                        // 处理返回的食物数组，将每个食物项添加到this.food中
                        if (Array.isArray(convertedFoods)) {
                            convertedFoods.forEach(food => {
                                this.food.push(food);
                                this.foodCount++;
                            });
                        } else {
                            this.food.push(convertedFoods);
                            this.foodCount++;
                        }
                    }
                    let scoreIncrease = 15; // 默认红色敌人分值
                    if (enemy instanceof OrangeEnemy) {
                        scoreIncrease = 280;
                    } else if (enemy instanceof PinkEnemy) {
                        scoreIncrease = 150;
                    } else if (enemy instanceof PurpleEnemy) {
                        scoreIncrease = 40;
                    }
                    this.score += scoreIncrease;
                    this.scoreElement.textContent = this.score;
                    this.floatingTexts.push(new FloatingText(enemy.x, enemy.y, `+${scoreIncrease}`, '#f1c40f'));
                    this.enemies.splice(hitEnemyIndex, 1);
                }
                
                // 检查子弹是否可以穿透
                if (!bullet.canPenetrate) {
                    return false;
                }
            }
            return true;
        });

        // 更新和绘制粒子系统
        this.particleSystem.update();
        this.renderer.draw({
            snake: this.snake,
            food: this.food,
            bullets: this.bullets,
            enemies: this.enemies,
            floatingTexts: this.floatingTexts,
            particleSystem: this.particleSystem
        });

        // 检查并移除过期的食物
        const currentTimeForFood = Date.now();
        const expiredFoodIndexes = [];
        this.food.forEach((f, index) => {
            if (currentTimeForFood - f.createdTime >= f.duration) {
                // 在食物位置生成一个红色敌人
                const enemy = new RedEnemy();
                enemy.x = f.x + config.gridSize / 2; // 调整到格子中心
                enemy.y = f.y + config.gridSize / 2;
                this.enemies.push(enemy);
                expiredFoodIndexes.push(index);
            }
        });
        
        // 从后向前移除过期食物，以避免索引错误
        for (let i = expiredFoodIndexes.length - 1; i >= 0; i--) {
            this.food.splice(expiredFoodIndexes[i], 1);
            this.foodCount--;
        }
    }

    updateStatusPanel(speedMultiplier) {
        // 统一更新所有状态面板的值
        document.getElementById('healthBar').textContent = this.snake.length;
        document.getElementById('moveSpeed').textContent = speedMultiplier.toFixed(1) + 'x';
        document.getElementById('bulletSpeed').textContent = speedMultiplier.toFixed(1) + 'x';
        document.getElementById('attackPower').textContent = (Math.ceil(speedMultiplier) + this.totalAttackBonus).toFixed(1);
    }
}
