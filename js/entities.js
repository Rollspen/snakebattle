import { config } from './config.js';

// 子弹类
export class Bullet {
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

// 基础敌人类
export class BaseEnemy {
    constructor() {
        this.spawn();
        this.health = this.getMaxHealth();
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.patrolTimer = 0;
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.color = this.getColor();
        
        // 弹跳相关属性
        this.verticalVelocity = 0;
        this.gravity = 0.8;  // 增加重力加速度
        this.bounceStrength = -12;  // 增强弹跳力度
        this.groundY = this.y;
        this.bounceHeight = 40;  // 控制弹跳高度
        this.scaleY = 1;  // 添加垂直缩放系数
        
        // 眼睛朝向相关属性
        this.lastX = this.x;
        this.lastY = this.y;
        this.lookDirectionX = 0;
        this.lookDirectionY = -1; // 默认向上看
        
        // 眼睛缩放相关属性
        this.eyeScaleFactor = 1; // 正常大小
        this.eyeScaleRecoveryRate = 0.05; // 每帧恢复速率
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
            
            // 获取游戏实例中的蛇头位置
            const gameCore = window.gameInstance;
            if (gameCore && gameCore.snake && gameCore.snake[0]) {
                const dx = gameCore.snake[0].x + config.gridSize / 2 - this.x;
                const dy = gameCore.snake[0].y + config.gridSize / 2 - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance >= config.enemySafeDistance) {
                    validPosition = true;
                }
            } else {
                validPosition = true;
            }
        }
    }

    update(snakeHead, currentEnemySpeed) {
        // 恢复眼睛大小
        if (this.eyeScaleFactor > 1) {
            this.eyeScaleFactor = Math.max(1, this.eyeScaleFactor - this.eyeScaleRecoveryRate);
        }
        
        const dx = snakeHead.x + config.gridSize / 2 - this.x;
        const dy = snakeHead.y + config.gridSize / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        let newX = this.x;
        let newY = this.y;

        // 检查是否应该逃跑：生命值低于25%且15%概率触发
        const shouldFlee = this.health < this.getMaxHealth() * 0.25 && Math.random() < 0.15;
        
        if (distance < config.enemyTrackDistance) {
            const angle = Math.atan2(dy, dx);
            // 如果应该逃跑，则向相反方向移动
            if (shouldFlee) {
                newX -= Math.cos(angle) * currentEnemySpeed * 1.2; // 逃跑速度略快
                newY -= Math.sin(angle) * currentEnemySpeed * 1.2;
            } else {
                newX += Math.cos(angle) * currentEnemySpeed;
                newY += Math.sin(angle) * currentEnemySpeed;
            }
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

        // 实现水平和垂直方向的环绕效果
        if (newX < 0) {
            newX = config.canvasWidth;
        } else if (newX > config.canvasWidth) {
            newX = 0;
        }

        if (newY < 0) {
            newY = config.canvasHeight;
        } else if (newY > config.canvasHeight) {
            newY = 0;
        }

        // 计算移动方向，用于眼睛朝向
        if (this.x !== newX || this.y !== newY) {
            const dx = newX - this.x;
            const dy = newY - this.y;
            // 只有当移动距离足够大时才更新方向，避免抖动
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length > 0) {
                    this.lookDirectionX = dx / length;
                    this.lookDirectionY = dy / length;
                }
            }
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
        this.x = newX;
        this.y = newY;
        
        // 更新groundY以跟随敌人的移动
        this.groundY = newY;
        
        // 应用重力和弹跳效果
        this.verticalVelocity += this.gravity;
        this.y += this.verticalVelocity;
        
        // 检查是否触地并反弹
        if (this.y > this.groundY) {
            this.y = this.groundY;
            this.verticalVelocity = this.bounceStrength;
            this.scaleY = 0.6;  // 落地时压缩到60%高度
        } else {
            // 在上升过程中逐渐恢复原始大小
            this.scaleY = Math.min(1, this.scaleY + 0.1);
        }
        
        // 限制最大弹跳高度
        if (this.y < this.groundY - this.bounceHeight) {
            this.y = this.groundY - this.bounceHeight;
            this.verticalVelocity = 0;
        }
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
        return distance < (config.enemySize + config.bulletSize * 1.5) / 2;
    }

    takeDamage() {
        this.health--;
        // 受到伤害时眼睛放大，表现惊恐
        this.eyeScaleFactor = 1.8; // 眼睛放大到1.8倍
        return this.health <= 0;
    }

    convertToFood() {
        const gridX = Math.floor(this.x / config.gridSize) * config.gridSize;
        const gridY = Math.floor(this.y / config.gridSize) * config.gridSize;
        return { 
            x: gridX, 
            y: gridY, 
            type: this instanceof PurpleEnemy ? 'carrot' : 
                  this instanceof PinkEnemy ? 'cucumber' : 
                  this instanceof OrangeEnemy ? 'watermelon' : 'banana',
            isBlinking: false,
            createdTime: Date.now(),
            duration: 8000,  // 持续时间8秒
            blinkStartTime: 6000,  // 开始闪烁的时间点（最后2秒）
            isConverted: true,
            attackBonus: this instanceof PurpleEnemy ? 0.2 : 
                        this instanceof PinkEnemy ? 0.4 : 
                        this instanceof OrangeEnemy ? 0.7 : 0  // 不同食物提供不同的攻击力加成
        };
    }
}

// 红色敌人类
export class RedEnemy extends BaseEnemy {
    getMaxHealth() {
        return config.enemyMaxHealth;
    }

    getColor() {
        return '#e74c3c';
    }
}

// 紫色敌人类
export class PurpleEnemy extends BaseEnemy {
    getMaxHealth() {
        return config.purpleEnemyHealth;
    }

    getColor() {
        return '#9b59b6';
    }
}

// 橙色敌人类
export class OrangeEnemy extends BaseEnemy {
    getMaxHealth() {
        return config.orangeEnemyHealth;
    }

    getColor() {
        return '#ff8c00';
    }

    update(snakeHead, currentEnemySpeed) {
        // 使用更快的移动速度
        const originalSpeed = currentEnemySpeed;
        currentEnemySpeed *= config.orangeEnemySpeedMultiplier;
        super.update(snakeHead, currentEnemySpeed);
        currentEnemySpeed = originalSpeed;
    }
}

export class PinkEnemy extends BaseEnemy {
    constructor() {
        super();
        this.targetOrangeEnemy = null;
    }

    getMaxHealth() {
        return config.pinkEnemyHealth;
    }

    getColor() {
        return '#ff69b4';
    }

    update(snakeHead, currentEnemySpeed) {
        // 寻找最近的橙色敌人
        if (window.enemies) {
            let nearestOrange = null;
            let minDistance = config.enemyTrackDistance;

            window.enemies.forEach(enemy => {
                if (enemy instanceof OrangeEnemy) {
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestOrange = enemy;
                    }
                }
            });

            this.targetOrangeEnemy = nearestOrange;
        }

        // 如果找到橙色敌人，就追随它
        if (this.targetOrangeEnemy) {
            const originalSpeed = currentEnemySpeed;
            currentEnemySpeed *= config.pinkEnemySpeedMultiplier;
            
            const dx = this.targetOrangeEnemy.x - this.x;
            const dy = this.targetOrangeEnemy.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            this.x += Math.cos(angle) * currentEnemySpeed;
            this.y += Math.sin(angle) * currentEnemySpeed;
            
            currentEnemySpeed = originalSpeed;
        } else {
            // 如果没有找到橙色敌人，就使用原来的行为
            const originalSpeed = currentEnemySpeed;
            currentEnemySpeed *= config.pinkEnemySpeedMultiplier;
            super.update(snakeHead, currentEnemySpeed);
            currentEnemySpeed = originalSpeed;
        }
    }
}

// 浮动文本类
export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.alpha = 1;
        this.dy = -2;
    }

    update() {
        this.y += this.dy;
        this.alpha -= 0.02;
        return this.alpha > 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color + Math.floor(this.alpha * 255).toString(16).padStart(2, '0');
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
    }
}