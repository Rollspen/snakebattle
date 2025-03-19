import { config } from './config.js';

export class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    draw(gameState) {
        this.clearCanvas();
        this.drawGrid();
        this.drawFood(gameState.food);
        this.drawSnake(gameState.snake);
        this.drawBullets(gameState.bullets);
        this.drawEnemies(gameState.enemies);
        this.drawFloatingTexts(gameState.floatingTexts);
        if (gameState.particleSystem) {
            gameState.particleSystem.draw(this.ctx);
        }
    }

    clearCanvas() {
        // 绘制分层背景
        this.drawLayeredBackground();
    }
    
    drawLayeredBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 根据背景类型选择绘制方法
        if (config.backgroundType === 'dark') {
            this.drawDarkBackground();
        } else if (config.backgroundType === 'mars') {
            this.drawMarsBackground();
        } else if (config.backgroundType === 'ocean') {
            this.drawOceanBackground();
        } else {
            this.drawLightBackground();
        }
    }
    
    drawLightBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 沙地铺满整个画布
        const sandHeight = height; // 沙地占据画布100%的高度
        
        // 绘制沙地背景
        const sandGradient = ctx.createLinearGradient(0, 0, 0, height);
        sandGradient.addColorStop(0, '#d2b48c'); // 浅沙色
        sandGradient.addColorStop(1, '#c19a6b'); // 深沙色
        ctx.fillStyle = sandGradient;
        ctx.fillRect(0, 0, width, sandHeight);
        
        // 添加沙地纹理
        this.drawSandTexture(0);
    }
    
    drawDarkBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制深色背景
        const darkGradient = ctx.createLinearGradient(0, 0, 0, height);
        darkGradient.addColorStop(0, '#1a1a2e'); // 深蓝黑色
        darkGradient.addColorStop(1, '#16213e'); // 深蓝色
        ctx.fillStyle = darkGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加星星
        this.drawStars();
    }
    
    drawStars() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制星星
        const starCount = 200;
        
        // 使用纯随机函数生成星星，使分布更加随机
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            // 随机星星大小
            const starSize = 0.5 + Math.random() * 1.5;
            
            // 随机星星亮度
            const brightness = 0.5 + Math.random() * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            
            ctx.beginPath();
            ctx.arc(x, y, starSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawMarsBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制火星背景
        const marsGradient = ctx.createLinearGradient(0, 0, 0, height);
        marsGradient.addColorStop(0, '#c0392b'); // 深红色
        marsGradient.addColorStop(1, '#e74c3c'); // 浅红色
        ctx.fillStyle = marsGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加火星表面纹理
        this.drawMarsSurfaceTexture();
        
        // 添加火星陨石坑
        this.drawMarsCraters();
    }
    
    drawMarsSurfaceTexture() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制火星表面纹理点
        ctx.fillStyle = 'rgba(150, 40, 27, 0.4)';
        
        // 使用伪随机函数生成火星表面纹理
        const dotCount = 600;
        for (let i = 0; i < dotCount; i++) {
            const x = Math.sin(i * 0.2) * width + Math.sin(i * 0.5) * width * 0.5;
            const y = Math.cos(i * 0.3) * height + Math.cos(i * 0.6) * height * 0.5;
            
            const dotSize = 1 + Math.random() * 3;
            ctx.beginPath();
            ctx.arc((x + width) % width, (y + height) % height, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawMarsCraters() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制火星陨石坑
        const craterCount = 15;
        
        for (let i = 0; i < craterCount; i++) {
            // 使用伪随机函数生成陨石坑位置，使分布更加随机
            const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * width;
            const y = (Math.cos(i * 678.9) * 0.5 + 0.5) * height;
            
            // 随机陨石坑大小
            const craterSize = 10 + Math.random() * 30;
            
            // 绘制陨石坑外环
            ctx.fillStyle = 'rgba(160, 50, 30, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, craterSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制陨石坑内环
            ctx.fillStyle = 'rgba(120, 30, 20, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, craterSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawSandTexture(startY) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制沙地纹理点
        ctx.fillStyle = 'rgba(210, 180, 140, 0.4)';
        
        // 使用伪随机函数生成沙粒
        const sandDotCount = 500;
        for (let i = 0; i < sandDotCount; i++) {
            const x = Math.sin(i * 0.1) * width + Math.sin(i * 0.3) * width * 0.5;
            const y = startY + Math.cos(i * 0.2) * (height - startY) + Math.cos(i * 0.4) * (height - startY) * 0.5;
            
            const dotSize = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.arc((x + width) % width, (y + height - startY) % (height - startY) + startY, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawOceanBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制海洋背景（深色调）
        const oceanGradient = ctx.createLinearGradient(0, 0, 0, height);
        oceanGradient.addColorStop(0, '#0c2461'); // 深海蓝色
        oceanGradient.addColorStop(0.7, '#1e3799'); // 深蓝色
        oceanGradient.addColorStop(1, '#0a3d62'); // 深青蓝色
        ctx.fillStyle = oceanGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加海洋波浪
        this.drawOceanWaves();
        
        // 添加海洋气泡
        this.drawOceanBubbles();
    }
    
    drawOceanWaves() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const time = Date.now() / 1000;
        
        // 绘制海洋波浪（深色调适配）
        ctx.strokeStyle = 'rgba(173, 216, 230, 0.15)';
        ctx.lineWidth = 1.5;
        
        // 绘制多层波浪
        for (let layer = 0; layer < 3; layer++) {
            const waveHeight = 5 + layer * 3;
            const waveFrequency = 0.02 - layer * 0.005;
            const waveSpeed = time * (0.5 + layer * 0.2);
            const yOffset = 100 + layer * 150;
            
            ctx.beginPath();
            ctx.moveTo(0, yOffset);
            
            for (let x = 0; x < width; x += 5) {
                const y = yOffset + Math.sin(x * waveFrequency + waveSpeed) * waveHeight;
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
    }
    
    drawOceanBubbles() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 绘制海洋气泡
        const bubbleCount = 50;
        
        for (let i = 0; i < bubbleCount; i++) {
            // 使用伪随机函数生成气泡位置
            const x = (Math.sin(i * 789.12) * 0.5 + 0.5) * width;
            const y = (Math.cos(i * 456.78) * 0.5 + 0.5) * height;
            
            // 随机气泡大小
            const bubbleSize = 2 + Math.random() * 6;
            
            // 绘制气泡（深色调适配）
            ctx.fillStyle = 'rgba(173, 216, 230, 0.2)';
            ctx.beginPath();
            ctx.arc(x, y, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制气泡高光（深色调适配）
            ctx.fillStyle = 'rgba(173, 216, 230, 0.4)';
            ctx.beginPath();
            ctx.arc(x - bubbleSize * 0.3, y - bubbleSize * 0.3, bubbleSize * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawGrassPatches(sandBorderY) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        
        // 创建几块连成一片的草地
        const patchCount = 5; // 草地块数
        
        // 使用噪声函数模拟的草地边界
        const borderPoints = [];
        for (let i = 0; i <= width; i += width / 20) {
            // 使用正弦函数创建自然的边界线
            const noise = Math.sin(i * 0.05) * 15 + Math.sin(i * 0.02) * 10;
            borderPoints.push({x: i, y: sandBorderY + noise});
        }
        
        // 绘制草地区域
        for (let p = 0; p < patchCount; p++) {
            const patchWidth = width / patchCount;
            const startX = p * patchWidth;
            const endX = (p + 1) * patchWidth;
            
            // 创建草地渐变
            const grassGradient = ctx.createLinearGradient(0, 0, 0, sandBorderY);
            // 随机化草地色调，使每块草地略有不同
            const hue = 100 + Math.sin(p * 8.3) * 10;
            grassGradient.addColorStop(0, `hsl(${hue}, 70%, 20%)`);
            grassGradient.addColorStop(1, `hsl(${hue}, 60%, 30%)`);
            
            ctx.fillStyle = grassGradient;
            
            // 绘制草地区域
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(endX, 0);
            
            // 找到当前草地块对应的边界点
            const relevantPoints = borderPoints.filter(point => point.x >= startX && point.x <= endX);
            
            // 如果没有足够的点，添加起点和终点
            if (relevantPoints.length < 2) {
                relevantPoints.unshift({x: startX, y: sandBorderY});
                relevantPoints.push({x: endX, y: sandBorderY});
            }
            
            // 绘制底部边界
            for (let i = relevantPoints.length - 1; i >= 0; i--) {
                ctx.lineTo(relevantPoints[i].x, relevantPoints[i].y);
            }
            
            ctx.closePath();
            ctx.fill();
            
            // 添加草地纹理
            this.drawGrassTexture(startX, endX, 0, sandBorderY);
        }
    }
    
    drawGrassTexture(startX, endX, startY, endY) {
        const ctx = this.ctx;
        
        // 绘制草地纹理线
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.2)';
        ctx.lineWidth = 1;
        
        const lineCount = 30;
        for (let i = 0; i < lineCount; i++) {
            const x = startX + (endX - startX) * (i / lineCount) + Math.sin(i * 5.67) * 10;
            const length = 5 + Math.random() * 10;
            
            ctx.beginPath();
            ctx.moveTo(x, startY + Math.random() * (endY - startY));
            ctx.lineTo(x, startY + Math.random() * (endY - startY) - length);
            ctx.stroke();
        }
    }

    drawGrid() {
        // 根据背景类型选择网格线颜色
        if (config.backgroundType === 'dark') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        } else if (config.backgroundType === 'mars') {
            this.ctx.strokeStyle = 'rgba(150, 40, 27, 0.3)';
        } else if (config.backgroundType === 'ocean') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        } else {
            this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        }
        
        for (let i = 0; i < this.canvas.width; i += config.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += config.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }

    drawGrass() {
        const time = Date.now() / 1000;
        const grassCount = 50;
        
        for (let i = 0; i < grassCount; i++) {
            const x = (Math.sin(i * 567.89) * 0.5 + 0.5) * this.canvas.width;
            const y = (Math.cos(i * 123.45) * 0.5 + 0.5) * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            
            // 草的高度
            const height = 15;
            // 使用正弦函数创建摆动效果
            const sway = Math.sin(time + i * 0.5) * 5;
            
            // 绘制草茎
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 1;
            
            // 控制点，用于创建弯曲的草茎
            const cp1x = x + sway * 0.5;
            const cp1y = y - height * 0.5;
            const cp2x = x + sway;
            const cp2y = y - height;
            
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x + sway, y - height);
            this.ctx.stroke();
            
            // 绘制草叶
            this.ctx.beginPath();
            this.ctx.moveTo(x + sway, y - height);
            this.ctx.lineTo(x + sway + 4, y - height + 4);
            this.ctx.lineTo(x + sway, y - height + 2);
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fill();
        }
    }

    drawFood(food) {
        food.forEach(f => {
            const timeSinceCreation = Date.now() - f.createdTime;
            if (timeSinceCreation >= f.blinkStartTime) {
                // 在最后2秒内闪烁显示
                const blinkPhase = Math.floor(timeSinceCreation / 200) % 2;
                if (blinkPhase === 0) {
                    if (f.type === 'carrot') {
                        this.drawCarrot(f.x, f.y);
                    } else if (f.type === 'cucumber') {
                        this.drawCucumber(f.x, f.y);
                    } else if (f.type === 'watermelon') {
                        this.drawWatermelon(f.x, f.y);
                    } else if (f.type === 'syringe') {
                        this.drawSyringe(f.x, f.y, f.hasRedCircle);
                    } else {
                        this.drawBanana(f.x, f.y);
                    }
                }
            } else {
                // 前6秒正常显示
                if (f.type === 'carrot') {
                    this.drawCarrot(f.x, f.y);
                } else if (f.type === 'cucumber') {
                    this.drawCucumber(f.x, f.y);
                } else if (f.type === 'watermelon') {
                    this.drawWatermelon(f.x, f.y);
                } else if (f.type === 'syringe') {
                    this.drawSyringe(f.x, f.y, f.hasRedCircle);
                } else {
                    this.drawBanana(f.x, f.y);
                }
            }
        });
    }

    drawCarrot(x, y) {
        const size = config.gridSize - 2;
        
        // 绘制胡萝卜主体（橙色）
        this.ctx.fillStyle = '#e67e22';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2, y + 2);
        this.ctx.lineTo(x + size - 2, y + size - 2);
        this.ctx.lineTo(x + 2, y + size - 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 添加阴影效果（深橙色）
        this.ctx.fillStyle = '#d35400';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2, y + 4);
        this.ctx.lineTo(x + size - 4, y + size - 2);
        this.ctx.lineTo(x + size/2, y + size - 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 绘制胡萝卜叶子（绿色）
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/2, y);
        this.ctx.lineTo(x + size/2 - 4, y - 4);
        this.ctx.lineTo(x + size/2, y - 2);
        this.ctx.lineTo(x + size/2 + 4, y - 4);
        this.ctx.lineTo(x + size/2, y);
        this.ctx.fill();
    }

    drawBanana(x, y) {
        const size = config.gridSize - 2;
        
        // 绘制香蕉主体（黄色）
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + size/2, size/2 - 1, size/4, Math.PI/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加阴影效果（深黄色）
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2 + 2, y + size/2 + 2, size/3, size/6, Math.PI/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制香蕉顶部（棕色）
        this.ctx.fillStyle = '#795548';
        this.ctx.beginPath();
        this.ctx.arc(x + size/4, y + size/4, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawApple(x, y) {
        const size = config.gridSize - 2;
        
        // 绘制苹果主体（红色）
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2 - 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加阴影效果（深红色）
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.arc(x + size/2 + 2, y + size/2 + 2, size/3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制叶子（绿色）
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + 2, 4, 2, Math.PI/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制茎（棕色）
        this.ctx.fillStyle = '#795548';
        this.ctx.fillRect(x + size/2 - 1, y + 1, 2, 3);
    }
    
    drawSyringe(x, y, hasRedCircle = true) {
        const size = config.gridSize - 2;
        const ctx = this.ctx;
        
        // 如果有红圈标识，先绘制红色圆圈背景
        if (hasRedCircle) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2 + 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制红色圆圈边框
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2 + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 绘制针管主体（透明浅蓝色）
        ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 6, size - 8, size - 12, 2);
        ctx.fill();
        
        // 绘制针管边框
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 6, size - 8, size - 12, 2);
        ctx.stroke();
        
        // 绘制针头（银色）
        ctx.fillStyle = '#bdc3c7';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + size/2);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x + 4, y + size/2 + 2);
        ctx.closePath();
        ctx.fill();
        
        // 绘制推杆（白色）
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(x + size - 4, y + 7, 2, size - 14);
        
        // 绘制药液（亮蓝色）
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(x + 6, y + 8, (size - 12) * 0.7, size - 16);
        
        // 添加闪光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 9, 2, 1, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSnake(snake) {
        snake.forEach((segment, index) => {
            if (index === 0) {
                // 绘制蛇头
                const direction = this.getSnakeDirection(segment, snake[1]);
                this.drawSnakeHead(segment.x, segment.y, direction);
            } else if (index === snake.length - 1) {
                // 绘制蛇尾
                const prevSegment = snake[index - 1];
                this.drawSnakeTail(segment.x, segment.y, prevSegment.x, prevSegment.y);
            } else {
                // 绘制蛇身
                const prevSegment = snake[index - 1];
                const nextSegment = snake[index + 1];
                this.drawSnakeBody(segment.x, segment.y, prevSegment, nextSegment);
            }
        });
    }

    getSnakeDirection(head, neck) {
        if (!neck) return 'right';
        if (head.x > neck.x) return 'right';
        if (head.x < neck.x) return 'left';
        if (head.y > neck.y) return 'down';
        return 'up';
    }

    drawSnakeHead(x, y, direction) {
        const size = config.gridSize - 2;
        const ctx = this.ctx;
        
        // 保存当前上下文
        ctx.save();
        
        // 移动到蛇头中心并根据方向旋转
        ctx.translate(x + size/2, y + size/2);
        const rotation = {
            'right': 0,
            'down': Math.PI/2,
            'left': Math.PI,
            'up': -Math.PI/2
        }[direction];
        ctx.rotate(rotation);
        
        // 绘制蛇头主体（三角形）
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(-size/2, -size/2);
        ctx.lineTo(-size/2, size/2);
        ctx.closePath();
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-size/6, -size/4, size/8, 0, Math.PI * 2);
        ctx.arc(-size/6, size/4, size/8, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼珠
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-size/6, -size/4, size/16, 0, Math.PI * 2);
        ctx.arc(-size/6, size/4, size/16, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制蛇信
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(size/2 + 8, -4);
        ctx.moveTo(size/2, 0);
        ctx.lineTo(size/2 + 8, 4);
        ctx.stroke();
        
        // 恢复上下文
        ctx.restore();
    }

    drawSnakeBody(x, y, prevSegment, nextSegment) {
        const size = config.gridSize - 2;
        const ctx = this.ctx;
        
        // 绘制投影
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 计算身体段的方向
        const angle = Math.atan2(nextSegment.y - prevSegment.y, nextSegment.x - prevSegment.x);
        
        // 绘制圆角矩形
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate(angle);
        
        // 创建渐变色
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(0.5, '#27ae60');
        gradient.addColorStop(1, '#2ecc71');
        
        ctx.fillStyle = gradient;
        
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(-size/2 + radius, -size/2);
        ctx.lineTo(size/2 - radius, -size/2);
        ctx.quadraticCurveTo(size/2, -size/2, size/2, -size/2 + radius);
        ctx.lineTo(size/2, size/2 - radius);
        ctx.quadraticCurveTo(size/2, size/2, size/2 - radius, size/2);
        ctx.lineTo(-size/2 + radius, size/2);
        ctx.quadraticCurveTo(-size/2, size/2, -size/2, size/2 - radius);
        ctx.lineTo(-size/2, -size/2 + radius);
        ctx.quadraticCurveTo(-size/2, -size/2, -size/2 + radius, -size/2);
        ctx.closePath();
        ctx.fill();
        
        // 添加鳞片纹理
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
        ctx.lineWidth = 1;
        
        // 绘制横向鳞片纹理
        for (let i = -size/2 + radius; i < size/2 - radius; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, -size/3);
            ctx.lineTo(i + 4, -size/3);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 4, 0);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(i, size/3);
            ctx.lineTo(i + 4, size/3);
            ctx.stroke();
        }
        
        ctx.restore();
        ctx.restore();
    }

    drawSnakeTail(x, y, prevX, prevY) {
        const size = config.gridSize - 2;
        const ctx = this.ctx;
        
        // 计算尾部方向
        const angle = Math.atan2(y - prevY, x - prevX);
        
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate(angle);
        
        // 创建渐变色
        const gradient = ctx.createLinearGradient(-size/2, 0, size/2, 0);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');
        ctx.fillStyle = gradient;
        
        // 绘制尾部（三角形）
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/3);
        ctx.lineTo(size/2, 0);
        ctx.lineTo(-size/2, size/3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    getSnakeDirection(head, neck) {
        if (!neck) return 'right';
        if (head.x > neck.x) return 'right';
        if (head.x < neck.x) return 'left';
        if (head.y > neck.y) return 'down';
        return 'up';
    }

    drawSnakeHead(x, y, direction) {
        const size = config.gridSize - 2;
        const ctx = this.ctx;
        
        // 保存当前上下文
        ctx.save();
        
        // 移动到蛇头中心并根据方向旋转
        ctx.translate(x + size/2, y + size/2);
        const rotation = {
            'right': 0,
            'down': Math.PI/2,
            'left': Math.PI,
            'up': -Math.PI/2
        }[direction];
        ctx.rotate(rotation);
        
        // 绘制蛇头主体（三角形）
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(-size/2, -size/2);
        ctx.lineTo(-size/2, size/2);
        ctx.closePath();
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-size/6, -size/4, size/8, 0, Math.PI * 2);
        ctx.arc(-size/6, size/4, size/8, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼珠
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-size/6, -size/4, size/16, 0, Math.PI * 2);
        ctx.arc(-size/6, size/4, size/16, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制蛇信
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(size/2 + 8, -4);
        ctx.moveTo(size/2, 0);
        ctx.lineTo(size/2 + 8, 4);
        ctx.stroke();
        
        // 恢复上下文
        ctx.restore();
    }

    drawSnakeBody(x, y, prevSegment, nextSegment) {
        const size = config.gridSize - 2;
        const ctx = this.ctx;
        
        // 绘制投影
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 计算身体段的方向
        const angle = Math.atan2(nextSegment.y - prevSegment.y, nextSegment.x - prevSegment.x);
        
        // 绘制圆角矩形
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate(angle);
        
        // 创建渐变色
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(0.5, '#27ae60');
        gradient.addColorStop(1, '#2ecc71');
        
        ctx.fillStyle = gradient;
        
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(-size/2 + radius, -size/2);
        ctx.lineTo(size/2 - radius, -size/2);
        ctx.quadraticCurveTo(size/2, -size/2, size/2, -size/2 + radius);
        ctx.lineTo(size/2, size/2 - radius);
        ctx.quadraticCurveTo(size/2, size/2, size/2 - radius, size/2);
        ctx.lineTo(-size/2 + radius, size/2);
        ctx.quadraticCurveTo(-size/2, size/2, -size/2, size/2 - radius);
        ctx.lineTo(-size/2, -size/2 + radius);
        ctx.quadraticCurveTo(-size/2, -size/2, -size/2 + radius, -size/2);
        ctx.closePath();
        ctx.fill();
        
        // 添加鳞片纹理
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
        ctx.lineWidth = 1;
        
        // 绘制横向鳞片纹理
        for (let i = -size/2 + radius; i < size/2 - radius; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, -size/3);
            ctx.lineTo(i + 4, -size/3);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 4, 0);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(i, size/3);
            ctx.lineTo(i + 4, size/3);
            ctx.stroke();
        }
        
        ctx.restore();
        ctx.restore();
    }

    drawSnakeTail(x, y, prevX, prevY) {
        const size = config.gridSize - 2;
        const ctx = this.ctx;
        
        // 计算尾部方向
        const angle = Math.atan2(y - prevY, x - prevX);
        
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate(angle);
        
        // 创建渐变色
        const gradient = ctx.createLinearGradient(-size/2, 0, size/2, 0);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');
        ctx.fillStyle = gradient;
        
        // 绘制尾部（三角形）
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/3);
        ctx.lineTo(size/2, 0);
        ctx.lineTo(-size/2, size/3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    drawBullets(bullets) {
        bullets.forEach(bullet => {
            // 检查是否是SonicBullet（通过检查rings属性）
            if (bullet.rings) {
                // 绘制声波圆环
                bullet.rings.forEach(ring => {
                    // 创建金色渐变
                    const ringGradient = this.ctx.createRadialGradient(
                        ring.x, ring.y, 0,
                        ring.x, ring.y, ring.radius
                    );
                    ringGradient.addColorStop(0, `rgba(255, 215, 0, 0)`); // 中心透明
                    ringGradient.addColorStop(0.7, `rgba(255, 215, 0, ${ring.alpha * 0.7})`);
                    ringGradient.addColorStop(1, `rgba(255, 215, 0, 0)`); // 边缘透明
                    
                    this.ctx.save();
                    this.ctx.strokeStyle = ringGradient;
                    this.ctx.lineWidth = 2;
                    
                    // 绘制波浪圆环
                    this.ctx.beginPath();
                    
                    // 使用正弦函数创建波浪效果
                    const waveFrequency = bullet.waveFrequency || 8;
                    const waveAmplitude = ring.waveAmplitude || 2;
                    const wavePhase = ring.wavePhase || 0;
                    
                    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
                        // 计算波浪半径
                        const waveRadius = ring.radius + Math.sin(angle * waveFrequency + wavePhase) * waveAmplitude;
                        
                        const x = ring.x + Math.cos(angle) * waveRadius;
                        const y = ring.y + Math.sin(angle) * waveRadius;
                        
                        if (angle === 0) {
                            this.ctx.moveTo(x, y);
                        } else {
                            this.ctx.lineTo(x, y);
                        }
                    }
                    
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.ctx.restore();
                });
                
                // 绘制子弹中心的金色点
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, config.bulletSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            // 检查是否是FireBullet（通过检查canPenetrate属性和color属性）
            else if (bullet.canPenetrate && bullet.color === '#FF69B4') {
                // 绘制烟雾粒子
                if (bullet.smokeParticles) {
                    bullet.smokeParticles.forEach(particle => {
                        const smokeGradient = this.ctx.createRadialGradient(
                            particle.x, particle.y, 0,
                            particle.x, particle.y, particle.size
                        );
                        smokeGradient.addColorStop(0, `rgba(255, 182, 193, ${particle.alpha})`);
                        smokeGradient.addColorStop(0.6, `rgba(255, 105, 180, ${particle.alpha * 0.7})`);
                        smokeGradient.addColorStop(1, `rgba(255, 105, 180, 0)`);
                        
                        this.ctx.fillStyle = smokeGradient;
                        this.ctx.beginPath();
                        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                        this.ctx.fill();
                    });
                }
                
                // 创建粉色渐变
                const gradient = this.ctx.createRadialGradient(
                    bullet.x, bullet.y, 0,
                    bullet.x, bullet.y, config.bulletSize
                );
                gradient.addColorStop(0, 'rgba(255, 182, 193, 0.8)');
                gradient.addColorStop(0.6, 'rgba(255, 105, 180, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 105, 180, 0)');

                // 绘制粉色烟雾主体
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, config.bulletSize, 0, Math.PI * 2);
                this.ctx.fill();

                // 添加粉色粒子效果
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i + (Date.now() / 200);
                    const distance = config.bulletSize * 0.7;
                    const particleX = bullet.x + Math.cos(angle) * distance;
                    const particleY = bullet.y + Math.sin(angle) * distance;

                    const particleGradient = this.ctx.createRadialGradient(
                        particleX, particleY, 0,
                        particleX, particleY, config.bulletSize / 3
                    );
                    particleGradient.addColorStop(0, 'rgba(255, 182, 193, 0.7)');
                    particleGradient.addColorStop(1, 'rgba(255, 105, 180, 0)');

                    this.ctx.fillStyle = particleGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(particleX, particleY, config.bulletSize / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // 绘制子弹中心的亮粉色点
                this.ctx.fillStyle = 'rgba(255, 20, 147, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, config.bulletSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // 创建火焰渐变
                const gradient = this.ctx.createRadialGradient(
                    bullet.x, bullet.y, 0,
                    bullet.x, bullet.y, config.bulletSize
                );
                gradient.addColorStop(0, '#ff4500');
                gradient.addColorStop(0.6, '#ff8c00');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

                // 绘制火焰主体
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, config.bulletSize, 0, Math.PI * 2);
                this.ctx.fill();

                // 添加火焰粒子效果
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i + (Date.now() / 200);
                    const distance = config.bulletSize * 0.7;
                    const particleX = bullet.x + Math.cos(angle) * distance;
                    const particleY = bullet.y + Math.sin(angle) * distance;

                    const particleGradient = this.ctx.createRadialGradient(
                        particleX, particleY, 0,
                        particleX, particleY, config.bulletSize / 3
                    );
                    particleGradient.addColorStop(0, '#ff6347');
                    particleGradient.addColorStop(1, 'rgba(255, 99, 71, 0)');

                    this.ctx.fillStyle = particleGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(particleX, particleY, config.bulletSize / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // 绘制子弹中心的黄点
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, config.bulletSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawEnemies(enemies) {
        enemies.forEach(enemy => {
            this.drawEnemy(enemy);
            
            // 绘制史莱姆底部的小波浪
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.moveTo(enemy.x - config.enemySize / 2, enemy.y + config.enemySize / 4);
            this.ctx.quadraticCurveTo(
                enemy.x,
                enemy.y + config.enemySize / 2 * enemy.scaleY,
                enemy.x + config.enemySize / 2,
                enemy.y + config.enemySize / 4
            );
            this.ctx.fill();

            // 眼睛位置
            // 判断是否为BOSS
            const isBoss = enemy.sizeMultiplier && enemy.sizeMultiplier > 1;
            // 获取眼睛间距，BOSS有自定义间距
            const eyeSpacing = isBoss && enemy.eyeSpacing ? enemy.eyeSpacing : 1;
            const leftEyeX = enemy.x - (config.enemySize / 6) * eyeSpacing;
            const rightEyeX = enemy.x + (config.enemySize / 6) * eyeSpacing;
            const eyeY = enemy.y - config.enemySize / 8;
            const baseEyeRadius = config.enemySize / 8;
            
            // 应用眼睛缩放因子
            const eyeScaleFactor = enemy.eyeScaleFactor || 1; // 防止未定义
            const eyeRadius = baseEyeRadius * eyeScaleFactor;
            
            // 绘制眼睛
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(leftEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
            this.ctx.arc(rightEyeX, eyeY, eyeRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // 计算眼珠偏移量
            const baseEyeballRadius = config.enemySize / 16;
            const eyeballRadius = baseEyeballRadius * (eyeScaleFactor > 1 ? 0.8 : 1); // 惊恐时眼珠相对变小
            
            // 当惊恐时，眼珠会向中心聚集
            let lookDirectionX = enemy.lookDirectionX || 0;
            let lookDirectionY = enemy.lookDirectionY || 0;
            
            // 处理BOSS的表情状态
            if (isBoss && enemy.expressionState) {
                // 根据BOSS的表情状态调整眼珠方向
                if (enemy.expressionState === 'furious' || enemy.expressionState === 'angry') {
                    // 愤怒状态下眼珠更加集中
                    lookDirectionX *= 0.5;
                    lookDirectionY *= 0.5;
                }
            }
            
            // 绘制生命值条
            
            // 根据敌人类型设置生命值条尺寸
            const healthBarWidth = isBoss ? config.enemySize * enemy.sizeMultiplier * 1.2 : config.enemySize;
            const healthBarHeight = isBoss ? 8 : 4;
            const healthPercentage = enemy.health / enemy.getMaxHealth();
            
            // 设置生命值条位置（BOSS的生命值条更高）
            const healthBarY = enemy.y - config.enemySize / 2 * (isBoss ? enemy.sizeMultiplier : 1) - healthBarHeight - (isBoss ? 10 : 2);
            
            // 绘制生命值条背景（仅对BOSS显示）
            if (isBoss) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(
                    enemy.x - healthBarWidth / 2,
                    healthBarY,
                    healthBarWidth,
                    healthBarHeight
                );
            }
            
            // 绘制生命值条
            this.ctx.fillStyle = isBoss ? '#ff3333' : '#2ecc71';
            this.ctx.fillRect(
                enemy.x - healthBarWidth / 2,
                healthBarY,
                healthBarWidth * healthPercentage,
                healthBarHeight
            );
            
            // 为BOSS添加生命值边框
            if (isBoss) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    enemy.x - healthBarWidth / 2,
                    healthBarY,
                    healthBarWidth,
                    healthBarHeight
                );
            }
            
            // 绘制眼珠
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            
            // 计算眼珠位置，考虑视线方向
            const leftEyeballX = leftEyeX + lookDirectionX * (eyeRadius * 0.5);
            const rightEyeballX = rightEyeX + lookDirectionX * (eyeRadius * 0.5);
            const eyeballY = eyeY + lookDirectionY * (eyeRadius * 0.5);
            
            // 绘制左右眼珠
            this.ctx.arc(leftEyeballX, eyeballY, eyeballRadius, 0, Math.PI * 2);
            this.ctx.arc(rightEyeballX, eyeballY, eyeballRadius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawEnemy(enemy) {
        const ctx = this.ctx;
        
        // 获取敌人尺寸（考虑BOSS的尺寸倍率）
        const sizeMultiplier = enemy.sizeMultiplier || 1;
        const enemySize = config.enemySize * sizeMultiplier;
        
        // 绘制阴影
        const shadowScale = 1 - (enemy.y - enemy.groundY) / enemy.bounceHeight * 0.3; // 阴影大小随高度变化
        const shadowAlpha = 0.3 - (enemy.y - enemy.groundY) / enemy.bounceHeight * 0.2; // 阴影透明度随高度变化
        
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(
            enemy.x,
            enemy.groundY + enemySize / 4,
            (enemySize / 2) * shadowScale,
            (enemySize / 6) * shadowScale,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
        
        // 绘制敌人本体
        ctx.save();
        ctx.translate(enemy.x, enemy.y + (enemySize / 2) * (1 - enemy.scaleY));
        ctx.scale(1, enemy.scaleY);
        ctx.beginPath();
        ctx.arc(0, 0, enemySize / 2, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.restore();
    }

    drawCucumber(x, y) {
        const size = config.gridSize - 2;
        
        // 绘制黄瓜主体（深绿色）
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.ellipse(x + size/2, y + size/2, size/2 - 1, size/4, Math.PI/6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加纹理（浅绿色条纹）
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + size/4 + i * size/4, y + 2);
            this.ctx.lineTo(x + size/4 + i * size/4, y + size - 2);
            this.ctx.stroke();
        }
    }

    drawWatermelon(x, y) {
        const size = config.gridSize - 2;
        
        // 绘制西瓜主体（深绿色）
        this.ctx.fillStyle = '#27ae60';
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2 - 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制西瓜瓤（红色）
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2 - 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制西瓜籽（黑色）
        this.ctx.fillStyle = '#2c3e50';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const seedX = x + size/2 + Math.cos(angle) * size/4;
            const seedY = y + size/2 + Math.sin(angle) * size/4;
            this.ctx.beginPath();
            this.ctx.ellipse(seedX, seedY, 2, 1, angle, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawFloatingTexts(floatingTexts) {
        floatingTexts.forEach(text => text.draw(this.ctx));
    }
}