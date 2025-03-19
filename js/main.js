import { GameCore } from './game-core.js';

// 游戏初始化函数
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const gameCore = new GameCore(canvas);
    
    // 将游戏实例存储在全局变量中，以便其他模块可以访问
    window.gameInstance = gameCore;
    
    // 重启按钮事件监听
    const restartButton = document.getElementById('restartButton');
    restartButton.addEventListener('click', () => {
        gameCore.start();
    });
    
    // 启动游戏
    gameCore.start();
}

// 当DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);