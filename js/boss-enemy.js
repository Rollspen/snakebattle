import { config } from './config.js';
import { BaseEnemy } from './entities.js';

// BOSS敌人类
export class BossEnemy extends BaseEnemy {
    constructor(gameTime) {
        super();
        // 设置BOSS尺寸为普通敌人的4倍
        this.sizeMultiplier = 4;
        // 基础生命值加上当前游戏时间（秒）
        this.baseHealth = 30; // BOSS基础生命值
        this.maxHealth = this.baseHealth + gameTime / 2; // 保存最大生命值，游戏时间除以2使难度更平衡
        this.health = this.maxHealth; // 设置当前生命值为最大生命值
        // 设置BOSS移动速度较低
        this.speedMultiplier = 0.5;
        // 随机生成BOSS颜色
        this.color = this.generateRandomColor();
        // 设置BOSS特有的弹跳属性
        this.bounceHeight = 60; // 更高的弹跳高度
        this.bounceStrength = -15; // 更强的弹跳力度
        // 眼睛属性
        this.eyeScaleFactor = 6.0; // 更大的眼睛，增强威慑力
        this.eyeSpacing = 4.0; // 更宽的眼睛间距
        
        // BOSS表情相关属性
        this.expressionState = 'normal'; // 表情状态：normal, angry, hurt, furious
        this.expressionTimer = 0; // 表情持续时间计时器
        this.expressionDuration = 30; // 表情持续帧数
        this.eyebrowAngle = 0; // 眉毛角度
        this.mouthState = 'normal'; // 嘴巴状态
    }

    // 生成随机颜色
    generateRandomColor() {
        // 生成鲜艳的随机颜色
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 80%, 50%)`;
    }

    // 重写获取最大生命值方法
    getMaxHealth() {
        return this.maxHealth; // 返回保存的最大生命值
    }

    // 重写更新方法，使用较低的移动速度并处理表情状态
    update(snakeHead, currentEnemySpeed) {
        // 处理表情计时器
        if (this.expressionTimer > 0) {
            this.expressionTimer--;
            
            // 表情计时结束，恢复正常状态
            if (this.expressionTimer === 0) {
                // 根据剩余生命值保持一定程度的表情变化
                const healthPercentage = this.health / this.maxHealth;
                
                if (healthPercentage <= 0.25) {
                    // 生命值低时保持一定程度的愤怒状态
                    this.expressionState = 'angry';
                    this.eyeScaleFactor = 2.2;
                    this.eyebrowAngle = -15;
                    this.mouthState = 'angry';
                } else {
                    // 恢复正常状态，但眼睛仍然较大
                    this.expressionState = 'normal';
                    this.eyeScaleFactor = 2.0;
                    this.eyebrowAngle = 0;
                    this.mouthState = 'normal';
                }
            }
        }
        
        // 使用较低的移动速度
        const originalSpeed = currentEnemySpeed;
        currentEnemySpeed *= this.speedMultiplier;
        super.update(snakeHead, currentEnemySpeed);
        currentEnemySpeed = originalSpeed;
    }

    // 重写碰撞检测方法，考虑BOSS的大尺寸
    checkCollision(snakeHead) {
        const dx = snakeHead.x + config.gridSize / 2 - this.x;
        const dy = snakeHead.y + config.gridSize / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (config.enemySize * this.sizeMultiplier + config.gridSize) / 2;
    }

    // 重写子弹碰撞检测方法，考虑BOSS的大尺寸
    checkBulletCollision(bullet) {
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (config.enemySize * this.sizeMultiplier + config.bulletSize * 1.5) / 2;
    }

    // 重写takeDamage方法，添加表情变化逻辑
    takeDamage() {
        this.health--;
        
        // 根据剩余生命值比例设置不同的表情状态
        const healthPercentage = this.health / this.maxHealth;
        
        if (healthPercentage <= 0.25) {
            // 生命值低于25%，显示暴怒表情
            this.expressionState = 'furious';
            this.eyeScaleFactor = 2.5; // 眼睛更大
            this.eyebrowAngle = -30; // 眉毛角度更陡
            this.mouthState = 'roar'; // 咆哮状态
        } else if (healthPercentage <= 0.5) {
            // 生命值低于50%，显示愤怒表情
            this.expressionState = 'angry';
            this.eyeScaleFactor = 2.3;
            this.eyebrowAngle = -20;
            this.mouthState = 'angry';
        } else {
            // 生命值较高，显示受伤表情
            this.expressionState = 'hurt';
            this.eyeScaleFactor = 2.2;
            this.eyebrowAngle = -10;
            this.mouthState = 'hurt';
        }
        
        // 重置表情计时器
        this.expressionTimer = this.expressionDuration;
        
        return this.health <= 0;
    }
    

    
    // 重写转换为食物的方法，BOSS死亡后只产生一个针剂升级道具
    convertToFood() {
        const foods = [];
        
        // 只生成一个针剂升级道具（在BOSS位置）
        foods.push({
            x: Math.floor(this.x / config.gridSize) * config.gridSize,
            y: Math.floor(this.y / config.gridSize) * config.gridSize,
            type: 'syringe', // 针剂类型
            isBlinking: true, // 始终闪烁
            createdTime: Date.now(),
            duration: 20000, // 持续时间20秒
            blinkStartTime: 10000, // 最后10秒开始闪烁
            isConverted: true,
            hasRedCircle: true, // 红圈标识
            isPowerUp: true, // 标记为升级道具
            powerUpType: 'random' // 随机升级一个未拥有的武器
        });
        
        return foods;
    }
}