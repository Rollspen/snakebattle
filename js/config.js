// 游戏配置
export const config = {
    // 背景设置
    backgroundType: 'light', // 默认为浅色背景
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
    pinkEnemyHealth: 12,   // 粉色敌人最大生命值
    orangeEnemyHealth: 20, // 橙色敌人最大生命值
    pinkEnemySpeedMultiplier: 1.5, // 粉色敌人速度倍率
    orangeEnemySpeedMultiplier: 2.0, // 橙色敌人速度倍率
    killCountForPurple: 5, // 生成紫色敌人所需的红色敌人击杀数
    killCountForPink: 2,   // 生成粉色敌人所需的紫色敌人击杀数
    killCountForOrange: 3, // 生成橙色敌人所需的粉色敌人击杀数
    timeSpeedUpInterval: 30000, // 每30秒加速一次
    speedUpAmount: 0.2,     // 每次加速增加20%的速度
    enemySafeDistance: 100,  // 敌人生成时与蛇头的最小距离
    maxFoodCount: 20,      // 最大食物数量
    bossSpawnInterval: 30000, // BOSS生成间隔（毫秒）
    bossBaseHealth: 30,    // BOSS基础生命值
    bossSpeedMultiplier: 0.5, // BOSS速度倍率
    bossSizeMultiplier: 4  // BOSS尺寸倍率
};