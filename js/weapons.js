// 武器系统管理类
import { config } from './config.js';
import { Bullet } from './entities.js';

// 武器基类
class Weapon {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.attackPower = 1.0; // 基础攻击力
        this.attackRate = 1.0; // 基础攻击频率
        this.lastAttackTime = 0; // 上次攻击时间
    }

    // 计算实际攻击力（考虑游戏核心中的攻击力加成）
    getActualAttackPower() {
        return this.attackPower * (1 + this.gameCore.totalAttackBonus);
    }

    // 检查是否可以攻击（基于攻击频率）
    canAttack() {
        const currentTime = Date.now();
        const attackInterval = 200 / this.attackRate; // 基础间隔200ms
        return currentTime - this.lastAttackTime >= attackInterval;
    }

    // 执行攻击（由子类实现）
    attack() {
        throw new Error('子类必须实现attack方法');
    }
}

// 默认武器（普通子弹）
export class DefaultWeapon extends Weapon {
    constructor(gameCore) {
        super(gameCore);
        this.attackPower = 1.0;
        this.attackRate = 1.0;
    }

    attack() {
        if (!this.canAttack()) return;

        const head = this.gameCore.snake[0];
        let targetX = head.x;
        let targetY = head.y;
        
        // 寻找250像素范围内最近的敌人
        let nearestEnemy = null;
        let minDistance = 250;
        
        this.gameCore.enemies.forEach(enemy => {
            const dx = enemy.x - head.x;
            const dy = enemy.y - head.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        // 计算基准射击角度
        let baseAngle;
        if (nearestEnemy) {
            // 瞄准最近的敌人
            targetX = nearestEnemy.x;
            targetY = nearestEnemy.y;
            baseAngle = Math.atan2(targetY - (head.y + config.gridSize / 2), targetX - (head.x + config.gridSize / 2));
        } else {
            // 如果没有敌人在范围内，朝当前移动方向发射
            switch (this.gameCore.direction) {
                case 'up': targetY = head.y - 250; baseAngle = -Math.PI / 2; break;
                case 'down': targetY = head.y + 250; baseAngle = Math.PI / 2; break;
                case 'left': targetX = head.x - 250; baseAngle = Math.PI; break;
                case 'right': targetX = head.x + 250; baseAngle = 0; break;
            }
        }
        
        // 根据蛇身长度计算子弹数量
        const bulletCount = 1 + Math.floor(this.gameCore.snake.length / 5);
        const spreadAngle = Math.PI / 6; // 30度的扩散角度
        
        // 发射多颗子弹
        for (let i = 0; i < bulletCount; i++) {
            let bulletAngle = baseAngle;
            
            // 为额外的子弹添加随机角度偏移
            if (i > 0) {
                // 在[-spreadAngle/2, spreadAngle/2]范围内生成随机偏移
                const randomOffset = (Math.random() - 0.5) * spreadAngle;
                bulletAngle += randomOffset;
            }
            
            // 计算子弹目标位置
            const bulletTargetX = head.x + config.gridSize / 2 + Math.cos(bulletAngle) * 250;
            const bulletTargetY = head.y + config.gridSize / 2 + Math.sin(bulletAngle) * 250;
            
            this.gameCore.bullets.push(new Bullet(
                head.x + config.gridSize / 2,
                head.y + config.gridSize / 2,
                bulletTargetX,
                bulletTargetY
            ));
        }
        
        this.lastAttackTime = Date.now();
    }
}

// 电击武器（从针剂升级道具获得）
export class ElectricWeapon extends Weapon {
    constructor(gameCore) {
        super(gameCore);
        this.attackPower = 0.2; // 攻击力是玩家当前攻击力的0.2倍
        this.attackRate = 2.0; // 攻击频率是玩家当前攻击频率的2倍
        this.range = 250; // 攻击范围
        this.targetEnemy = null; // 当前锁定的敌人
        this.electricParticles = []; // 电击粒子效果
    }

    attack() {
        if (!this.canAttack()) return;
        if (this.gameCore.snake.length === 0) return;

        const head = this.gameCore.snake[0];
        const bulletCount = Math.floor(this.gameCore.snake.length / 4); // 发射数量是玩家当前生命值除以4
        
        if (bulletCount <= 0) return;

        // 在范围内随机选择敌人进行攻击
        const enemiesInRange = this.gameCore.enemies.filter(enemy => {
            const dx = enemy.x - head.x;
            const dy = enemy.y - head.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= this.range;
        });

        if (enemiesInRange.length === 0) return;

        // 随机选择一个敌人作为目标
        this.targetEnemy = enemiesInRange[Math.floor(Math.random() * enemiesInRange.length)];
        
        // 创建电击效果的子弹
        for (let i = 0; i < bulletCount; i++) {
            // 添加一些随机偏移，使电击看起来更自然
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            
            const bullet = new ElectricBullet(
                head.x + config.gridSize / 2,
                head.y + config.gridSize / 2,
                this.targetEnemy.x + offsetX,
                this.targetEnemy.y + offsetY
            );
            
            this.gameCore.bullets.push(bullet);
            
            // 创建电击粒子效果
            this.createElectricParticles(head.x + config.gridSize / 2, head.y + config.gridSize / 2, 
                                        this.targetEnemy.x, this.targetEnemy.y);
        }
        
        this.lastAttackTime = Date.now();
    }

    // 创建电击粒子效果
    createElectricParticles(startX, startY, endX, endY) {
        // 如果游戏核心有粒子系统，则使用它创建电击效果
        if (this.gameCore.particleSystem) {
            // 限制段数，防止创建过多粒子
            const segmentCount = 3; // 减少段数，从5减到3
            let lastX = startX;
            let lastY = startY;
            
            // 检查粒子系统中的粒子总数，如果太多则不再创建新粒子
            const particleSystem = this.gameCore.particleSystem;
            if (particleSystem.particles && particleSystem.particles.length > 200) {
                return; // 如果粒子数量过多，直接返回不创建新粒子
            }
            
            for (let i = 1; i <= segmentCount; i++) {
                // 计算当前段的终点，添加一些随机偏移使电击看起来不是直线
                const ratio = i / segmentCount;
                const segEndX = startX + (endX - startX) * ratio + (Math.random() - 0.5) * 20;
                const segEndY = startY + (endY - startY) * ratio + (Math.random() - 0.5) * 20;
                
                // 在每个段的起点和终点创建电击粒子
                this.gameCore.particleSystem.createElectricParticles(lastX, lastY, segEndX, segEndY);
                
                lastX = segEndX;
                lastY = segEndY;
            }
        }
    }
}

// 电击子弹类
class ElectricBullet extends Bullet {
    constructor(x, y, targetX, targetY) {
        super(x, y, targetX, targetY);
        this.color = '#00FFFF'; // 青色
        this.size = config.bulletSize * 0.8; // 稍小的子弹
        this.lifespan = 10; // 生命周期短
        this.smokeParticles = []; // 初始化粒子数组
        this.smokeLifespan = 20; // 初始化烟雾粒子生命周期
    }

    update() {
        super.update();
        this.lifespan--;
        
        // 限制粒子数量，防止内存泄漏
        const maxParticles = 50;
        
        // 添加烟雾粒子效果，但要确保不超过最大数量
        if (Math.random() < 0.3 && this.smokeParticles.length < maxParticles) { // 30%的几率生成烟雾粒子
            this.smokeParticles.push({
                x: this.x,
                y: this.y,
                size: this.size * (0.3 + Math.random() * 0.4), // 随机大小
                alpha: 0.6 + Math.random() * 0.3, // 随机透明度
                lifespan: this.smokeLifespan,
                dx: (Math.random() - 0.5) * 1.5, // 随机水平飘散
                dy: (Math.random() - 0.5) * 1.5  // 随机垂直飘散
            });
        }
        
        // 更新烟雾粒子
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const particle = this.smokeParticles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.lifespan--;
            particle.alpha *= 0.95; // 逐渐变透明
            
            if (particle.lifespan <= 0) {
                this.smokeParticles.splice(i, 1);
            }
        }
    }

    isOutOfBounds() {
        return super.isOutOfBounds() || this.lifespan <= 0;
    }
}

// 火焰子弹类
class FireBullet extends Bullet {
    constructor(x, y, targetX, targetY) {
        super(x, y, targetX, targetY);
        this.color = '#FF69B4'; // 粉色
        this.size = config.bulletSize * 2.0; // 稍大的子弹
        this.lifespan = 15; // 生命周期较长
        this.canPenetrate = true; // 可以穿透敌人
        
        // 减慢弹道速度（是玩家弹道速度的0.5倍）
        this.dx *= 0.5;
        this.dy *= 0.5;
        
        // 添加烟雾效果的属性
        this.smokeParticles = [];
        this.smokeLifespan = 30;
    }

    update() {
        super.update();
        this.lifespan--;
        
        // 限制粒子数量，防止内存泄漏
        const maxParticles = 50;
        
        // 添加烟雾粒子效果，但要确保不超过最大数量
        if (Math.random() < 0.3 && this.smokeParticles.length < maxParticles) { // 30%的几率生成烟雾粒子
            this.smokeParticles.push({
                x: this.x,
                y: this.y,
                size: this.size * (0.3 + Math.random() * 0.4), // 随机大小
                alpha: 0.6 + Math.random() * 0.3, // 随机透明度
                lifespan: this.smokeLifespan,
                dx: (Math.random() - 0.5) * 1.5, // 随机水平飘散
                dy: (Math.random() - 0.5) * 1.5  // 随机垂直飘散
            });
        }
        
        // 更新烟雾粒子
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const particle = this.smokeParticles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.lifespan--;
            particle.alpha *= 0.95; // 逐渐变透明
            
            if (particle.lifespan <= 0) {
                this.smokeParticles.splice(i, 1);
            }
        }
    }

    isOutOfBounds() {
        return super.isOutOfBounds() || this.lifespan <= 0;
    }
}

// 火焰武器（从针剂升级道具获得）
export class FireWeapon extends Weapon {
    constructor(gameCore) {
        super(gameCore);
        this.attackPower = 0.3; // 攻击力是玩家当前攻击力的0.3倍
        this.attackRate = 2.0; // 攻击频率是玩家当前攻击频率的2倍
        this.range = 200; // 攻击范围
    }

    attack() {
        if (!this.canAttack()) return;
        if (this.gameCore.snake.length === 0) return;

        const head = this.gameCore.snake[0];
        const bulletCount = Math.floor(this.gameCore.snake.length / 2); // 发射数量是玩家当前生命值除以2
        
        if (bulletCount <= 0) return;

        // 在范围内寻找敌人
        const enemiesInRange = this.gameCore.enemies.filter(enemy => {
            const dx = enemy.x - head.x;
            const dy = enemy.y - head.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= this.range;
        });

        if (enemiesInRange.length === 0) return;

        // 计算基准射击角度（朝向最近的敌人）
        let nearestEnemy = null;
        let minDistance = this.range;
        
        enemiesInRange.forEach(enemy => {
            const dx = enemy.x - head.x;
            const dy = enemy.y - head.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        if (!nearestEnemy) return;
        
        const baseAngle = Math.atan2(nearestEnemy.y - (head.y + config.gridSize / 2), 
                                    nearestEnemy.x - (head.x + config.gridSize / 2));
        const spreadAngle = Math.PI / 4; // 45度的扩散角度
        
        // 发射多颗火焰子弹
        for (let i = 0; i < bulletCount; i++) {
            // 为每颗子弹添加随机角度偏移
            const randomOffset = (Math.random() - 0.5) * spreadAngle;
            const bulletAngle = baseAngle + randomOffset;
            
            // 计算子弹目标位置
            const bulletTargetX = head.x + config.gridSize / 2 + Math.cos(bulletAngle) * this.range;
            const bulletTargetY = head.y + config.gridSize / 2 + Math.sin(bulletAngle) * this.range;
            
            const bullet = new FireBullet(
                head.x + config.gridSize / 2,
                head.y + config.gridSize / 2,
                bulletTargetX,
                bulletTargetY
            );
            
            this.gameCore.bullets.push(bullet);
        }
        
        this.lastAttackTime = Date.now();
    }
}

// 酸液子弹类
class AcidBullet extends Bullet {
    constructor(x, y, targetX, targetY) {
        super(x, y, targetX, targetY);
        this.color = '#32CD32'; // 绿色
        this.size = config.bulletSize * 1.5; // 较大的子弹
        this.lifespan = 20; // 生命周期
        this.hasExploded = false; // 是否已爆炸
        this.explosionRadius = 120; // 爆炸范围
        this.explosionDuration = 3000; // 爆炸持续时间(毫秒)
        this.explosionStartTime = 0; // 爆炸开始时间
        this.corrosionParticles = []; // 腐蚀粒子效果
    }

    update() {
        if (!this.hasExploded) {
            super.update();
            this.lifespan--;
            
            // 限制粒子数量，防止内存泄漏
            const maxParticles = 40; // 从30提高到40
            
            // 添加尾迹粒子效果
            if (Math.random() < 0.9 && this.corrosionParticles.length < maxParticles) { // 从0.4提高到0.9
                this.corrosionParticles.push({
                    x: this.x,
                    y: this.y,
                    size: this.size * (0.4 + Math.random() * 0.4), // 从0.2-0.5改为0.4-0.8
                    alpha: 0.7 + Math.random() * 0.3, // 从0.5-0.8改为0.7-1.0
                    lifespan: 20, // 从15增加到20
                    dx: (Math.random() - 0.5) * 1.5, // 从1.2增加到1.5，增加扩散范围
                    dy: (Math.random() - 0.5) * 1.5  // 从1.2增加到1.5，增加扩散范围
                });
            }
        }
        
        // 更新粒子
        for (let i = this.corrosionParticles.length - 1; i >= 0; i--) {
            const particle = this.corrosionParticles[i];
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.lifespan--;
            particle.alpha *= 0.92;
            
            if (particle.lifespan <= 0) {
                this.corrosionParticles.splice(i, 1);
            }
        }
    }

    explode() {
        if (this.hasExploded) return;
        
        this.hasExploded = true;
        this.explosionStartTime = Date.now();
        
        // 创建爆炸粒子效果
        if (this.gameCore && this.gameCore.particleSystem) {
            // 在爆炸范围内创建腐蚀粒子
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.explosionRadius;
                const particleX = this.x + Math.cos(angle) * distance;
                const particleY = this.y + Math.sin(angle) * distance;
                
                // 使用不同的绿色色调
                const colors = ['#32CD32', '#00FF00', '#7CFC00', '#ADFF2F'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                this.gameCore.particleSystem.createAcidParticles(particleX, particleY, color);
            }
        }
        
        // 添加绿色虚线描边范围标记，表示毒液腐蚀区域
        this.drawCorrosionArea = true;
    }

    isOutOfBounds() {
        if (this.hasExploded) {
            // 检查爆炸是否结束
            return Date.now() - this.explosionStartTime > this.explosionDuration;
        }
        return super.isOutOfBounds() || this.lifespan <= 0;
    }
}

// 酸液武器类
export class AcidWeapon extends Weapon {
    constructor(gameCore) {
        super(gameCore);
        this.attackPower = 0.1; // 攻击力是玩家当前攻击力的0.1倍
        this.attackRate = 0.3; // 射击频率是玩家当前攻击频率的0.3倍
        this.damageRate = 4.0; // 伤害频率是玩家当前攻击频率的4倍
        this.range = 300; // 攻击范围
        this.lastDamageTime = 0; // 上次造成伤害的时间
        this.activeAcidBullets = []; // 活跃的酸液子弹列表
    }

    attack() {
        if (!this.canAttack()) return;
        if (this.gameCore.snake.length === 0) return;

        const head = this.gameCore.snake[0];
        const bulletCount = Math.floor(this.gameCore.snake.length * 0.2); // 发射数量是玩家当前生命值的0.2倍
        
        if (bulletCount <= 0) return;

        // 寻找范围内最近的敌人
        let nearestEnemy = null;
        let minDistance = this.range;
        
        this.gameCore.enemies.forEach(enemy => {
            const dx = enemy.x - head.x;
            const dy = enemy.y - head.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });

        if (!nearestEnemy) return;
        
        // 创建酸液子弹
        for (let i = 0; i < bulletCount; i++) {
            // 添加一些随机偏移
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            
            const bullet = new AcidBullet(
                head.x + config.gridSize / 2,
                head.y + config.gridSize / 2,
                nearestEnemy.x + offsetX,
                nearestEnemy.y + offsetY
            );
            
            // 保存游戏核心引用，用于爆炸效果
            bullet.gameCore = this.gameCore;
            
            this.gameCore.bullets.push(bullet);
            this.activeAcidBullets.push(bullet);
        }
        
        this.lastAttackTime = Date.now();
    }

    // 处理酸液伤害
    processAcidDamage() {
        const currentTime = Date.now();
        const damageInterval = 200 / this.damageRate; // 基础伤害间隔
        
        // 检查是否可以造成伤害
        if (currentTime - this.lastDamageTime < damageInterval) return;
        
        // 遍历所有活跃的酸液子弹
        for (let i = this.activeAcidBullets.length - 1; i >= 0; i--) {
            const bullet = this.activeAcidBullets[i];
            
            // 如果子弹已爆炸，检查范围内的敌人
            if (bullet.hasExploded) {
                this.gameCore.enemies.forEach(enemy => {
                    const dx = enemy.x - bullet.x;
                    const dy = enemy.y - bullet.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 如果敌人在腐蚀范围内，造成伤害
                    if (distance <= bullet.explosionRadius) {
                        // 使用takeDamage方法处理伤害，确保生命值不会低于0
                        const damage = Math.floor(this.getActualAttackPower());
                        for (let j = 0; j < damage; j++) {
                            if (enemy.health <= 0) break;
                            enemy.takeDamage();
                        }
                        
                        // 创建腐蚀效果
                        if (this.gameCore.particleSystem && Math.random() < 0.3) {
                            this.gameCore.particleSystem.createBulletHitParticles(
                                enemy.x, enemy.y, '#32CD32'
                            );
                        }
                    }
                });
                
                // 检查爆炸是否结束
                if (Date.now() - bullet.explosionStartTime > bullet.explosionDuration) {
                    this.activeAcidBullets.splice(i, 1);
                }
            }
            // 如果子弹碰到敌人，触发爆炸
            else {
                for (const enemy of this.gameCore.enemies) {
                    if (enemy.checkBulletCollision(bullet)) {
                        bullet.explode();
                        // 直接命中造成双倍伤害，使用takeDamage方法确保生命值不会低于0
                        const damage = Math.floor(this.getActualAttackPower() * 2);
                        for (let j = 0; j < damage; j++) {
                            if (enemy.health <= 0) break;
                            enemy.takeDamage();
                        }
                        break;
                    }
                }
            }
        }
        
        this.lastDamageTime = currentTime;
    }
}

// 声波子弹类
class SonicBullet extends Bullet {
    constructor(x, y, targetX, targetY) {
        super(x, y, targetX, targetY);
        this.color = '#FFD700'; // 金色
        this.size = config.bulletSize * 1.5; // 较大的子弹
        this.lifespan = 12; // 生命周期
        this.canPenetrate = true; // 可以穿透敌人
        this.knockbackPower = 15; // 击退力度
        
        // 增加弹道速度（是玩家弹道速度的3倍）
        this.dx *= 3.0;
        this.dy *= 3.0;
        
        // 圆环效果的属性
        this.ringRadius = 10; // 初始圆环半径
        this.maxRingRadius = 80; // 最大圆环半径
        this.ringExpansionRate = 3; // 圆环扩大速率
        this.ringAlpha = 0.8; // 初始透明度
        this.ringFadeRate = 0.05; // 淡出速率
        this.rings = []; // 存储多个圆环
        
        // 波浪效果的属性
        this.waveFrequency = 8; // 波浪频率（每圈的波峰数量）
        this.waveAmplitudeMax = 4; // 最大波浪振幅
        
        // 创建初始圆环
        this.rings.push({
            radius: this.ringRadius,
            alpha: this.ringAlpha,
            x: this.x,
            y: this.y,
            wavePhase: 0, // 初始波浪相位
            waveAmplitude: 2 + Math.random() * 2 // 随机波浪振幅
        });
    }

    update() {
        super.update();
        this.lifespan--;
        
        // 更新现有圆环
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const ring = this.rings[i];
            
            // 扩大圆环半径
            ring.radius += this.ringExpansionRate;
            
            // 随着半径增大，降低透明度
            ring.alpha -= this.ringFadeRate;
            
            // 更新波浪效果的相位
            if (!ring.wavePhase) {
                ring.wavePhase = 0;
            }
            ring.wavePhase += 0.1; // 波浪相位变化速度
            
            // 如果圆环透明度太低或半径太大，则移除
            if (ring.alpha <= 0 || ring.radius >= this.maxRingRadius) {
                this.rings.splice(i, 1);
            }
        }
        
        // 每隔一定时间创建新的圆环
        if (this.lifespan % 3 === 0 && this.lifespan > 0) {
            this.rings.push({
                radius: this.ringRadius,
                alpha: this.ringAlpha,
                x: this.x,
                y: this.y,
                wavePhase: 0, // 初始波浪相位
                waveAmplitude: 2 + Math.random() * 2 // 随机波浪振幅
            });
        }
    }

    isOutOfBounds() {
        return super.isOutOfBounds() || this.lifespan <= 0;
    }
    
    // 应用击退效果
    applyKnockback(enemy) {
        // 计算从子弹到敌人的方向向量
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // 防止除以零
        
        // 计算单位向量
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        // 应用击退力度
        enemy.x += unitX * this.knockbackPower;
        enemy.y += unitY * this.knockbackPower;
        
        // 确保敌人不会被击退出边界
        if (enemy.x < 0) enemy.x = 0;
        if (enemy.x > config.canvasWidth) enemy.x = config.canvasWidth;
        if (enemy.y < 0) enemy.y = 0;
        if (enemy.y > config.canvasHeight) enemy.y = config.canvasHeight;
    }
}

// 声波击退武器类
export class SonicWeapon extends Weapon {
    constructor(gameCore) {
        super(gameCore);
        this.attackPower = 0.1; // 攻击力是玩家当前攻击力的0.1倍
        this.attackRate = 1.0 / 3.0; // 攻击频率是玩家当前攻击频率除以3.0（降低频率）
        this.baseRange = 90; // 基础攻击范围
        this.maxRange = 180; // 最大攻击范围
    }

    // 计算当前攻击范围（基于玩家生命值）
    getRange() {
        // 每6点生命值增加30范围，最大180
        const rangeBonus = Math.floor(this.gameCore.snake.length / 6) * 30;
        return Math.min(this.baseRange + rangeBonus, this.maxRange);
    }

    attack() {
        if (!this.canAttack()) return;
        if (this.gameCore.snake.length === 0) return;

        const head = this.gameCore.snake[0];
        const centerX = head.x + config.gridSize / 2;
        const centerY = head.y + config.gridSize / 2;
        const range = this.getRange();
        
        // 创建360度环形声波
        const bulletCount = 12; // 发射12个子弹形成一个圆
        const angleStep = (Math.PI * 2) / bulletCount;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep;
            
            // 计算子弹目标位置
            const targetX = centerX + Math.cos(angle) * range;
            const targetY = centerY + Math.sin(angle) * range;
            
            const bullet = new SonicBullet(
                centerX,
                centerY,
                targetX,
                targetY
            );
            
            this.gameCore.bullets.push(bullet);
            
            // 创建声波粒子效果
            if (this.gameCore.particleSystem) {
                for (let j = 0; j < 3; j++) { // 每个方向创建3个粒子
                    const particleAngle = angle + (Math.random() - 0.5) * 0.2; // 添加小的随机偏移
                    const particleDistance = range * (0.3 + Math.random() * 0.7); // 随机距离
                    const particleX = centerX + Math.cos(particleAngle) * particleDistance;
                    const particleY = centerY + Math.sin(particleAngle) * particleDistance;
                    
                    // 使用不同的金色色调
                    const colors = ['#FFD700', '#FFC125', '#FFCC00', '#FFD800'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    this.gameCore.particleSystem.createBulletHitParticles(particleX, particleY, color);
                }
            }
        }
        
        // 检查范围内的敌人并应用击退效果
        this.gameCore.enemies.forEach(enemy => {
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= range) {
                // 创建一个临时子弹对象来应用击退效果
                const knockbackBullet = new SonicBullet(centerX, centerY, enemy.x, enemy.y);
                knockbackBullet.applyKnockback(enemy);
                
                // 造成伤害
                const damage = Math.floor(this.getActualAttackPower());
                for (let i = 0; i < damage; i++) {
                    if (enemy.health <= 0) break;
                    enemy.takeDamage();
                }
            }
        });
        
        this.lastAttackTime = Date.now();
    }
}

// 武器管理器
export class WeaponManager {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.weapons = {
            default: new DefaultWeapon(gameCore)
        };
        this.activeWeapons = ['default']; // 当前激活的武器列表
    }

    // 添加新武器
    addWeapon(type) {
        if (type === 'electric' && !this.weapons.electric) {
            this.weapons.electric = new ElectricWeapon(this.gameCore);
            this.activeWeapons.push('electric');
            return true;
        } else if (type === 'fire' && !this.weapons.fire) {
            this.weapons.fire = new FireWeapon(this.gameCore);
            this.activeWeapons.push('fire');
            return true;
        } else if (type === 'acid' && !this.weapons.acid) {
            this.weapons.acid = new AcidWeapon(this.gameCore);
            this.activeWeapons.push('acid');
            return true;
        } else if (type === 'sonic' && !this.weapons.sonic) {
            this.weapons.sonic = new SonicWeapon(this.gameCore);
            this.activeWeapons.push('sonic');
            return true;
        } else if (type === 'random') {
            // 随机升级一个武器
            return this.upgradeRandomWeapon();
        }
        return false;
    }
    
    // 随机升级一个武器
    upgradeRandomWeapon() {
        const availableWeapons = [];
        
        // 检查哪些武器可以被添加
        if (!this.weapons.electric) availableWeapons.push('electric');
        if (!this.weapons.fire) availableWeapons.push('fire');
        if (!this.weapons.acid) availableWeapons.push('acid');
        if (!this.weapons.sonic) availableWeapons.push('sonic');
        
        if (availableWeapons.length === 0) return false; // 没有可升级的武器
        
        // 随机选择一个武器升级
        const randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
        return this.addWeapon(randomWeapon);
    }

    // 移除武器
    removeWeapon(type) {
        const index = this.activeWeapons.indexOf(type);
        if (index !== -1) {
            this.activeWeapons.splice(index, 1);
            return true;
        }
        return false;
    }

    // 执行所有激活武器的攻击
    attackWithAllWeapons() {
        // 创建一个副本以避免在迭代过程中修改原数组
        const activeWeaponsCopy = [...this.activeWeapons];
        
        activeWeaponsCopy.forEach(weaponType => {
            if (this.weapons[weaponType]) {
                try {
                    // 尝试执行武器攻击
                    this.weapons[weaponType].attack();
                    
                    // 处理酸液武器的持续伤害
                    if (weaponType === 'acid') {
                        this.weapons[weaponType].processAcidDamage();
                    }
                } catch (error) {
                    console.error(`武器 ${weaponType} 攻击时出错:`, error);
                }
            }
        });
    }
}