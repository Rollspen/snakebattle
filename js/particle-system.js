export class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    // 创建酸液粒子效果
    createAcidParticles(x, y, color = '#32CD32') {
        const particleCount = Math.floor(Math.random() * 6) + 3;  // 随机生成3-8个粒子
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;  // 较慢的速度
            this.particles.push(new AcidParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                0.7 + Math.random() * 0.2,  // 初始透明度
                3 + Math.random() * 2  // 粒子初始大小
            ));
        }
    }

    createBulletHitParticles(x, y, color = '#f1c40f') {
        const particleCount = Math.floor(Math.random() * 8) + 3;  // 随机生成3-10个粒子
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 8 + Math.random() * 6;  // 增加初始速度范围
            this.particles.push(new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                0.66 + Math.random() * 0.22,  // 初始透明度在0.66~0.88之间随机
                4 + Math.random() * 3  // 粒子初始大小
            ));
        }
    }
    
    // 创建电击效果粒子
    createElectricParticles(startX, startY, endX, endY) {
        const segmentCount = 8; // 电击线段数量
        const particlesPerSegment = 5; // 增加每段线上的粒子数量
        
        // 计算电击路径的主方向向量
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离太短，不创建粒子
        if (distance < 5) return;
        
        // 沿着路径创建粒子
        for (let i = 0; i <= segmentCount; i++) {
            const ratio = i / segmentCount;
            
            // 添加随机偏移，使电击看起来不是直线
            const offsetMagnitude = Math.min(30, distance * 0.2);
            const offsetX = (Math.random() - 0.5) * offsetMagnitude;
            const offsetY = (Math.random() - 0.5) * offsetMagnitude;
            
            // 计算当前点位置
            const x = startX + dx * ratio + offsetX;
            const y = startY + dy * ratio + offsetY;
            
            // 在每个点创建多个粒子
            for (let j = 0; j < particlesPerSegment; j++) {
                // 随机选择电击粒子颜色
                const colors = ['#00FFFF', '#FFFFFF', '#0088FF'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // 创建电击粒子
                this.particles.push(new ElectricParticle(
                    x + (Math.random() - 0.5) * 4,
                    y + (Math.random() - 0.5) * 4,
                    color
                ));
            }
        }
    }

    update() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.alpha > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
}

class Particle {
    constructor(x, y, dx, dy, color, alpha = 1, size = 2) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.alpha = alpha;
        this.size = size;
        this.gravity = 0.15;  // 增加重力效果
        this.friction = 0.96;  // 减小摩擦力，使粒子移动更快
    }

    update() {
        this.dx *= this.friction;
        this.dy *= this.friction;
        this.dy += this.gravity;
        
        this.x += this.dx;
        this.y += this.dy;
        
        this.alpha -= 0.1;  // 透明度衰减
        this.size *= 0.92;  // 大小衰减
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 酸液粒子类
class AcidParticle extends Particle {
    constructor(x, y, dx, dy, color, alpha = 1, size = 2) {
        super(x, y, dx, dy, color, alpha, size);
        this.pulseRate = 0.05 + Math.random() * 0.05; // 脉动速率
        this.pulsePhase = Math.random() * Math.PI * 2; // 脉动相位
        this.originalSize = size; // 原始大小
        this.gravity = 0.05; // 较小的重力
        this.friction = 0.98; // 较小的摩擦力
        this.lifespan = 60 + Math.floor(Math.random() * 40); // 较长的生命周期
    }
    
    update() {
        super.update();
        
        // 脉动效果
        this.pulsePhase += this.pulseRate;
        const pulseFactor = 0.2 * Math.sin(this.pulsePhase) + 1.0;
        this.size = this.originalSize * pulseFactor * (this.alpha + 0.2);
        
        // 缓慢减少透明度
        this.alpha -= 0.01;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // 使用径向渐变创建发光效果
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 1.5
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制中心亮点
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = this.alpha * 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// 电击粒子类
class ElectricParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 0.9 + Math.random() * 0.1; // 更高的初始透明度
        this.size = 2 + Math.random() * 3; // 增大粒子大小
        this.lifespan = 10 + Math.floor(Math.random() * 10); // 增加生命周期
        
        // 随机抖动效果
        this.jitterX = 0;
        this.jitterY = 0;
        this.jitterSpeed = 0.5 + Math.random() * 1.5;
        this.jitterAngle = Math.random() * Math.PI * 2;
    }
    
    update() {
        // 更新抖动效果
        this.jitterAngle += this.jitterSpeed;
        this.jitterX = Math.sin(this.jitterAngle) * 2;
        this.jitterY = Math.cos(this.jitterAngle) * 2;
        
        // 减缓透明度衰减速度
        this.alpha -= 0.08;
        
        // 缓慢缩小粒子大小
        this.size *= 0.95;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // 使用径向渐变创建发光效果
        const gradient = ctx.createRadialGradient(
            this.x + this.jitterX, this.y + this.jitterY, 0,
            this.x + this.jitterX, this.y + this.jitterY, this.size * 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.jitterX, this.y + this.jitterY, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制中心亮点
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x + this.jitterX, this.y + this.jitterY, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}