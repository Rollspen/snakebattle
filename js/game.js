// 游戏配置
const config = {
    canvasWidth: 800,
    canvasHeight: 800,
    gridSize: 20,
    initialSpeed: 200,     // 初始移动间隔（毫秒）
    speedIncrease: 5,      // 每吃一个食物增加的速度
    bulletSpeed: 30,       // 子弹移动速度
    bulletSize: 8,         // 子弹大小
    enemySize: 15,         // 敌人大小
    enemySpeed: 4.5,       // 敌人移动速度
    enemySpawnInterval: 1000, // 敌人生成间隔（毫秒）
    enemyTrackDistance: 200,   // 敌人开始追踪的距离
    maxEnemies: 15,        // 最大敌人数量
    enemyMaxHealth: 3,     // 普通敌人最大生命值
    purpleEnemyHealth: 5,  // 紫色敌人最大生命值
    killCountForPurple: 5, // 生成紫色敌人所需的红色敌人击杀数
    timeSpeedUpInterval: 30000, // 每30秒加速一次
    speedUpAmount: 0.2,     // 每次加速增加20%的速度
    enemySafeDistance: 100,  // 敌人生成时与蛇头的最小距离
    maxFoodCount: 20       // 最大食物数量
};

// 游戏状态
let snake = [];
let food = [];
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameLoop = null;
let currentSpeed = config.initialSpeed;
let isPaused = false;
let bullets = [];
let enemies = [];
let mouseX = 0;
let mouseY = 0;
let enemySpawnTimer = null;
let bossSpawnTimer = null; // BOSS生成定时器
let gameStartTime = 0;
let currentEnemySpeed = config.enemySpeed;
let timerElement = document.getElementById('timer');
let gameTimer = null;
let foodCount = 0;  // 当前食物数量
let floatingTexts = [];
let redEnemyKillCount = 0;  // 红色敌人击杀计数

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverElement = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');

// 子弹类
class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        const angle = Math.atan2(targetY - y, targetX - x);
        this.dx = Math.cos(angle) * config.bulletSpeed;
        this.dy = Math.sin(angle) * config.bulletSpeed;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    isOutOfBounds() {
        return this.x < 0 || this.x > config.canvasWidth ||
               this.y < 0 || this.y > config.canvasHeight;
    }
}

// 敌人类
// 敌人类已移至BaseEnemy及其子类中

// 基础敌人类
class BaseEnemy {
    constructor() {
        this.spawn();
        this.health = this.getMaxHealth();
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.patrolTimer = 0;
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.color = this.getColor();
    }

    getMaxHealth() {
        return config.enemyMaxHealth;
    }

    getColor() {
        return '#e74c3c';
    }

    spawn() {
        let validPosition = false;
        while (!validPosition) {
            this.x = Math.random() * (config.canvasWidth - config.enemySize * 2) + config.enemySize;
            this.y = Math.random() * (config.canvasHeight - config.enemySize * 2) + config.enemySize;
            
            if (snake && snake[0]) {
                const dx = snake[0].x + config.gridSize / 2 - this.x;
                const dy = snake[0].y + config.gridSize / 2 - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance >= config.enemySafeDistance) {
                    validPosition = true;
                }
            } else {
                validPosition = true;
            }
        }
    }

    update(snakeHead) {
        const dx = snakeHead.x + config.gridSize / 2 - this.x;
        const dy = snakeHead.y + config.gridSize / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        let newX = this.x;
        let newY = this.y;

        if (distance < config.enemyTrackDistance) {
            const angle = Math.atan2(dy, dx);
            newX += Math.cos(angle) * currentEnemySpeed;
            newY += Math.sin(angle) * currentEnemySpeed;
        } else {
            this.patrolTimer++;
            if (this.patrolTimer >= 60) {
                this.patrolAngle = Math.random() * Math.PI * 2;
                this.patrolTimer = 0;
            }

            const distanceToSpawn = Math.sqrt(
                (this.x - this.spawnX) * (this.x - this.spawnX) +
                (this.y - this.spawnY) * (this.y - this.spawnY)
            );

            if (distanceToSpawn > 100) {
                const returnAngle = Math.atan2(this.spawnY - this.y, this.spawnX - this.x);
                newX += Math.cos(returnAngle) * currentEnemySpeed;
                newY += Math.sin(returnAngle) * currentEnemySpeed;
            } else {
                newX += Math.cos(this.patrolAngle) * (currentEnemySpeed * 0.5);
                newY += Math.sin(this.patrolAngle) * (currentEnemySpeed * 0.5);
            }
        }

        const halfSize = config.enemySize / 2;
        if (newX - halfSize < 0) {
            newX = halfSize;
            this.patrolAngle = Math.PI - this.patrolAngle;
        } else if (newX + halfSize > config.canvasWidth) {
            newX = config.canvasWidth - halfSize;
            this.patrolAngle = Math.PI - this.patrolAngle;
        }

        if (newY - halfSize < 0) {
            newY = halfSize;
            this.patrolAngle = -this.patrolAngle;
        } else if (newY + halfSize > config.canvasHeight) {
            newY = config.canvasHeight - halfSize;
            this.patrolAngle = -this.patrolAngle;
        }

        this.x = newX;
        this.y = newY;
    }

    checkCollision(snakeHead) {
        const dx = snakeHead.x + config.gridSize / 2 - this.x;
        const dy = snakeHead.y + config.gridSize / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (config.enemySize + config.gridSize) / 2;
    }

    checkBulletCollision(bullet) {
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (config.enemySize + config.bulletSize) / 2;
    }

    takeDamage() {
        this.health--;
        return this.health <= 0;
    }

    convertToFood() {
        const gridX = Math.floor(this.x / config.gridSize) * config.gridSize;
        const gridY = Math.floor(this.y / config.gridSize) * config.gridSize;
        return { x: gridX, y: gridY, isConverted: true };
    }
}

// 红色敌人类
class RedEnemy extends BaseEnemy {
    getMaxHealth() {
        return config.enemyMaxHealth;
    }

    getColor() {
        return '#e74c3c';
    }
}

// 紫色敌人类
class PurpleEnemy extends BaseEnemy {
    getMaxHealth() {
        return config.purpleEnemyHealth;
    }

    getColor() {
        return '#9b59b6';
    }
}

// 初始化游戏
function updateTimer() {
    if (gameStartTime === 0) return;
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - gameStartTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function initGame() {
    // 设置画布大小
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // 重置计时器
    gameStartTime = Date.now();
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(updateTimer, 1000);
    timerElement.textContent = '00:00';

    // 初始化蛇的位置
    const startX = Math.floor(config.canvasWidth / (2 * config.gridSize)) * config.gridSize;
    const startY = Math.floor(config.canvasHeight / (2 * config.gridSize)) * config.gridSize;
    snake = [
        { x: startX, y: startY },
        { x: startX - config.gridSize, y: startY },
        { x: startX - config.gridSize * 2, y: startY }
    ];

    // 重置游戏状态
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    currentSpeed = config.initialSpeed;
    scoreElement.textContent = score;
    gameOverElement.style.display = 'none';
    bullets = [];
    enemies = [];
    food = [];
    foodCount = 0;
    generateFood(); // 初始化时生成一个食物

    // 开始游戏循环
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, currentSpeed);

    // 开始敌人生成循环
    if (enemySpawnTimer) clearInterval(enemySpawnTimer);
    enemySpawnTimer = setInterval(() => {
        if (enemies.length < config.maxEnemies) {
            enemies.push(new RedEnemy());
        }
    }, config.enemySpawnInterval);
    
    // 注意：BOSS生成逻辑已移至game-core.js中统一管理
    // 这里不再设置BOSS生成定时器，避免重复生成
}

// 生成食物
function generateFood(x = null, y = null) {
    if (foodCount >= config.maxFoodCount) return;
    
    if (x === null || y === null) {
        const gridWidth = config.canvasWidth / config.gridSize;
        const gridHeight = config.canvasHeight / config.gridSize;

        while (true) {
            x = Math.floor(Math.random() * gridWidth) * config.gridSize;
            y = Math.floor(Math.random() * gridHeight) * config.gridSize;
            
            // 确保食物不会生成在蛇身上或其他食物上
            if (!snake.some(segment => segment.x === x && segment.y === y) &&
                !food.some(f => f.x === x && f.y === y)) {
                break;
            }
        }
    }

    food.push({ x, y });
    foodCount++;
}

// 游戏步进
// 更新子弹位置
function updateBullets() {
    bullets = bullets.filter(bullet => !bullet.isOutOfBounds());
    bullets.forEach(bullet => bullet.update());
}

// 游戏步进
function gameStep() {
    // 更新游戏时间和速度
    if (gameStartTime === 0) {
        gameStartTime = Date.now();
    }
    const currentTime = Date.now();
    const elapsedTime = currentTime - gameStartTime;
    const speedUpTimes = Math.floor(elapsedTime / config.timeSpeedUpInterval);
    
    // 根据时间更新速度
    const speedMultiplier = 1 + (speedUpTimes * config.speedUpAmount);
    currentEnemySpeed = config.enemySpeed * speedMultiplier;
    const newSpeed = config.initialSpeed / speedMultiplier;
    
    // 更新玩家状态
    document.getElementById('healthBar').textContent = snake.length;
    document.getElementById('moveSpeed').textContent = speedMultiplier.toFixed(1) + 'x';
    document.getElementById('bulletSpeed').textContent = speedMultiplier.toFixed(1) + 'x';
    document.getElementById('attackPower').textContent = Math.ceil(speedMultiplier);
    
    if (gameLoop && currentSpeed !== newSpeed) {
        currentSpeed = newSpeed;
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, currentSpeed);
    }

    // 更新蛇的方向
    direction = nextDirection;

    // 计算新的头部位置
    const head = { ...snake[0] };
    switch (direction) {
        case 'up': head.y -= config.gridSize; break;
        case 'down': head.y += config.gridSize; break;
        case 'left': head.x -= config.gridSize; break;
        case 'right': head.x += config.gridSize; break;
    }

    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // 移动蛇
    snake.unshift(head);

    // 检查是否吃到食物
    const foodIndex = food.findIndex(f => f.x === head.x && f.y === head.y);
    if (foodIndex !== -1) {
        score += 10;
        scoreElement.textContent = score;
        floatingTexts.push(new FloatingText(head.x + config.gridSize / 2, head.y, '+10', '#2ecc71'));
        foodCount--;
        food.splice(foodIndex, 1);
    } else {
        snake.pop();
    }

    // 更新浮动文本
    floatingTexts = floatingTexts.filter(text => text.update());
    floatingTexts.forEach(text => text.draw(ctx));

    // 更新子弹
    updateBullets();

    // 更新敌人
    enemies.forEach(enemy => enemy.update(head));

    // 检查敌人碰撞
    const collidedEnemyIndex = enemies.findIndex(enemy => enemy.checkCollision(head));
    if (collidedEnemyIndex !== -1) {
        // 移除碰撞的敌人
        enemies.splice(collidedEnemyIndex, 1);
        
        // 扣除分数并显示浮动文字
        score = Math.max(0, score - 20);
        scoreElement.textContent = score;
        floatingTexts.push(new FloatingText(head.x + config.gridSize / 2, head.y, '-20', '#e74c3c'));
        
        // 减少蛇身长度两个单位
        if (snake.length > 3) {
            snake.pop();
            snake.pop();
        } else if (snake.length > 1) {
            // 如果蛇身长度不足两个，但仍大于1，则减少到只剩蛇头
            while (snake.length > 1) {
                snake.pop();
            }
        } else {
            // 如果只剩蛇头，游戏结束
            gameOver();
            return;
        }
    }

    // 检查子弹击中敌人
    bullets = bullets.filter(bullet => {
        const hitEnemyIndex = enemies.findIndex(enemy => enemy.checkBulletCollision(bullet));
        if (hitEnemyIndex !== -1) {
            const enemy = enemies[hitEnemyIndex];
            if (enemy.takeDamage()) {
                if (enemy instanceof RedEnemy) {
                    redEnemyKillCount++;
                    if (redEnemyKillCount >= config.killCountForPurple) {
                        redEnemyKillCount = 0;
                        enemies.push(new PurpleEnemy());
                    }
                }
                if (foodCount < config.maxFoodCount) {
                    const convertedFood = enemy.convertToFood();
                    food.push(convertedFood);
                    foodCount++;
                }
                score += 15;
                scoreElement.textContent = score;
                floatingTexts.push(new FloatingText(enemy.x, enemy.y, '+15', '#f1c40f'));
                enemies.splice(hitEnemyIndex, 1);
            }
            return false;
        }
        return true;
    });
    
    // 绘制游戏画面
    draw();
}

// 碰撞检测
function checkCollision(head) {
    // 检查是否撞墙
    if (head.x < 0 || head.x >= config.canvasWidth ||
        head.y < 0 || head.y >= config.canvasHeight) {
        return true;
    }

    // 检查是否撞到自己
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = '#34495e';
    for (let i = 0; i < canvas.width; i += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // 绘制食物
    food.forEach(f => {
        if (f.isBlinking) {
            const timeSinceCreation = Date.now() - f.createdTime;
            const blinkPhase = Math.floor(timeSinceCreation / 200) % 2; // 每200ms切换一次
            if (blinkPhase === 0) {
                ctx.fillStyle = '#3498db';
                ctx.fillRect(f.x, f.y, config.gridSize - 2, config.gridSize - 2);
            }
        } else {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(f.x, f.y, config.gridSize - 2, config.gridSize - 2);
        }
    });

    // 绘制蛇
    snake.forEach((segment, index) => {
        // 蛇头使用不同的颜色
        ctx.fillStyle = index === 0 ? '#f1c40f' : '#2ecc71';
        ctx.fillRect(segment.x, segment.y, config.gridSize - 2, config.gridSize - 2);
    });

    // 绘制子弹
    ctx.fillStyle = '#ffffff';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, config.bulletSize / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // 绘制敌人
    enemies.forEach(enemy => {
        // 绘制史莱姆主体（圆形）
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, config.enemySize / 2, 0, Math.PI * 2);
        ctx.fill();

        // 绘制史莱姆底部的小波浪
        ctx.beginPath();
        ctx.moveTo(enemy.x - config.enemySize / 2, enemy.y + config.enemySize / 4);
        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y + config.enemySize / 2,
            enemy.x + config.enemySize / 2,
            enemy.y + config.enemySize / 4
        );
        ctx.fill();

        // 绘制眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(enemy.x - config.enemySize / 6, enemy.y - config.enemySize / 8, config.enemySize / 8, 0, Math.PI * 2);
        ctx.arc(enemy.x + config.enemySize / 6, enemy.y - config.enemySize / 8, config.enemySize / 8, 0, Math.PI * 2);
        ctx.fill();

        // 绘制眼珠
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(enemy.x - config.enemySize / 6, enemy.y - config.enemySize / 8, config.enemySize / 16, 0, Math.PI * 2);
        ctx.arc(enemy.x + config.enemySize / 6, enemy.y - config.enemySize / 8, config.enemySize / 16, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制生命值条
        const healthBarWidth = config.enemySize;
        const healthBarHeight = 4;
        const healthPercentage = enemy.health / enemy.getMaxHealth();
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(
            enemy.x - healthBarWidth / 2,
            enemy.y - config.enemySize / 2 - healthBarHeight - 2,
            healthBarWidth * healthPercentage,
            healthBarHeight
        );
    });

    // 绘制浮动文本
    floatingTexts.forEach(text => text.draw(ctx));
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    clearInterval(enemySpawnTimer);
    // 确保BOSS生成定时器被正确清理
    if (bossSpawnTimer) {
        clearInterval(bossSpawnTimer);
        bossSpawnTimer = null;
    }
    clearInterval(gameTimer);
    gameLoop = null;
    enemySpawnTimer = null;
    gameTimer = null;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// 浮动文本类
class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.alpha = 1.0;
        this.speed = 1.5;
    }

    update() {
        this.y -= this.speed;
        this.alpha -= 0.02;
        return this.alpha > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// 键盘控制
document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'arrowdown':
        case 's':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'arrowleft':
        case 'a':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'arrowright':
        case 'd':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case ' ':
            if (!gameLoop) return;
            const head = snake[0];
            let targetX = head.x + config.gridSize / 2;
            let targetY = head.y + config.gridSize / 2;
            
            // 寻找250像素范围内最近的敌人
            let nearestEnemy = null;
            let minDistance = 250;
            
            enemies.forEach(enemy => {
                const dx = enemy.x - head.x - config.gridSize / 2;
                const dy = enemy.y - head.y - config.gridSize / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            
            // 如果找到敌人，瞄准敌人；否则，朝行进方向发射
            if (nearestEnemy) {
                targetX = nearestEnemy.x;
                targetY = nearestEnemy.y;
            } else {
                switch (direction) {
                    case 'up': targetY = head.y - 250; break;
                    case 'down': targetY = head.y + 250; break;
                    case 'left': targetX = head.x - 250; break;
                    case 'right': targetX = head.x + 250; break;
                }
            }
            
            const bullet = new Bullet(
                head.x + config.gridSize / 2,
                head.y + config.gridSize / 2,
                targetX,
                targetY
            );
            bullets.push(bullet);
            break;
    }
});

// 重新开始按钮事件
restartButton.addEventListener('click', initGame);

// 鼠标移动事件
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});



// 初始化游戏
initGame();