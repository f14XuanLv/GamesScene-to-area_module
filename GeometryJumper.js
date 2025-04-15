// 几何跳跃游戏

// 颜色定义
const COLORS = {
    PLAYER: '#5d73b0',         // 玩家颜色
    OBSTACLE: '#5d9db0',       // 障碍物颜色
    BACKGROUND: '#e6f7ff',     // 背景颜色
    GROUND: '#b3d9ff',         // 地面颜色
    GRID: '#d6eeff',           // 网格效果颜色
    TEXT: '#FFFFFF',           // 文字颜色
    BORDER: '#FFFFFF',         // 边框颜色
    GAME_OVER: 'rgba(0, 0, 0, 0.7)' // 游戏结束蒙层
};

// 游戏状态
const geometryJumper = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    isRunning: false,
    isPaused: false,     // 新增暂停状态标志
    animationFrame: null,
    lastFrameTime: 0,
    
    // 调试参数
    debugJumpTime: false,       // 控制跳跃计时器的开关
    jumpStartTime: 0,          // 起跳时间点
    lastJumpDuration: 0,       // 上次跳跃持续时间
    isRecordingJump: false,    // 是否正在记录跳跃
    
    // 游戏参数
    gravity: 0.5,                // 降低重力使滞空时间更长
    jumpForce: -12,              // 调整跳跃力度
    gameSpeed: 5,                // 默认游戏速度
    obstacleFrequency: 0.01,     // 降低障碍物生成概率
    maxObstacles: 5,
    groundHeight: 50,
    lastObstacleDistance: 0,     // 上一个障碍物的距离
    minObstacleDistance: 300,    // 最小障碍物距离
    
    // 物理系统基准
    targetFPS: 60,               // 目标帧率
    physicsTimeStep: 1000 / 60,  // 物理更新时间步长（毫秒）
    
    // 游戏对象
    player: {
        x: 50,
        y: 0,
        width: 30,
        height: 30,
        velocityY: 0,
        isJumping: false,
        color: COLORS.PLAYER
    },
    obstacles: [],
    
    // 游戏数据
    score: 0,
    distance: 0,
    gameOver: false,
    
    // 障碍物间距范围
    obstacleGaps: [
        { min: 1, max: 10 },     // 紧密的障碍物
        { min: 300, max: 900 }   // 有间距的障碍物
    ]
};

// 初始化游戏
function initGeometryJumper() {
    geometryJumper.canvas = document.getElementById('geometry-canvas');
    geometryJumper.ctx = geometryJumper.canvas.getContext('2d');
    
    // 调整Canvas大小以匹配容器
    resizeGeometryCanvas();
    window.addEventListener('resize', resizeGeometryCanvas);
    
    // 设置玩家初始位置
    resetGeometryJumper();
    
    // 添加点击/按键监听器
    document.getElementById('geometry-start').addEventListener('click', startGeometryJumper);
    document.getElementById('geometry-restart').addEventListener('click', restartGeometryJumper);
    window.addEventListener('keydown', handleGeometryKeydown);
    geometryJumper.canvas.addEventListener('click', handleGeometryJump);
    
    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', handleGeometryVisibilityChange);
    
    // 初始渲染
    renderGeometryJumper();
}

// 调整Canvas大小
function resizeGeometryCanvas() {
    const container = geometryJumper.canvas.parentElement;
    geometryJumper.width = container.clientWidth;
    geometryJumper.height = container.clientHeight;
    geometryJumper.canvas.width = geometryJumper.width;
    geometryJumper.canvas.height = geometryJumper.height;
    
    // 重新设置玩家位置
    if (!geometryJumper.isRunning) {
        geometryJumper.player.y = geometryJumper.height - geometryJumper.groundHeight - geometryJumper.player.height;
    }
}

// 重置游戏状态
function resetGeometryJumper() {
    geometryJumper.player.y = geometryJumper.height - geometryJumper.groundHeight - geometryJumper.player.height;
    geometryJumper.player.velocityY = 0;
    geometryJumper.player.isJumping = false;
    geometryJumper.obstacles = [];
    geometryJumper.score = 0;
    geometryJumper.distance = 0;
    geometryJumper.gameOver = false;
    // 不重置 gameSpeed，保留当前设置的值
    geometryJumper.lastObstacleDistance = 0;  // 重置最后障碍物距离
    
    // 重置跳跃计时相关变量
    geometryJumper.jumpStartTime = 0;
    geometryJumper.lastJumpDuration = 0;
    geometryJumper.isRecordingJump = false;
    
    // 更新分数显示
    document.getElementById('geometry-score').textContent = geometryJumper.score;
}

// 开始游戏
function startGeometryJumper() {
    if (geometryJumper.isRunning) return;
    
    // 隐藏按钮但保持占位
    document.getElementById('geometry-start').style.visibility = 'hidden';
    document.getElementById('geometry-start').style.display = 'inline-block';
    document.getElementById('geometry-restart').style.visibility = 'hidden';
    document.getElementById('geometry-restart').style.display = 'inline-block';
    
    resetGeometryJumper();
    geometryJumper.isRunning = true;
    geometryJumper.lastFrameTime = performance.now();
    gameLoopGeometryJumper(geometryJumper.lastFrameTime);
}

// 重新开始游戏
function restartGeometryJumper() {
    // 隐藏按钮但保持占位
    document.getElementById('geometry-restart').style.visibility = 'hidden';
    document.getElementById('geometry-restart').style.display = 'inline-block';
    
    resetGeometryJumper();
    geometryJumper.isRunning = true;
    geometryJumper.lastFrameTime = performance.now();
    gameLoopGeometryJumper(geometryJumper.lastFrameTime);
}

// 处理键盘输入
function handleGeometryKeydown(event) {
    // 检查焦点是否在输入框上，如果是则不拦截空格键
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.isContentEditable
    );
    
    if (isInputFocused) {
        return; // 输入框有焦点时不处理游戏键盘事件
    }
    
    if ((event.code === 'Space' || event.code === 'ArrowUp') && geometryJumper.isRunning && !geometryJumper.gameOver) {
        // 如果游戏暂停状态，则恢复游戏
        if (geometryJumper.isPaused) {
            resumeGeometryJumper();
        } else {
            jumpGeometryPlayer();
        }
        event.preventDefault();
    } else if (event.code === 'Space' && !geometryJumper.isRunning) {
        startGeometryJumper();
        event.preventDefault();
    } else if (event.code === 'Space' && geometryJumper.gameOver) {
        restartGeometryJumper();
        event.preventDefault();
    } else if (event.code === 'Escape' && geometryJumper.isRunning && !geometryJumper.gameOver) {
        // 添加ESC键暂停/恢复功能
        if (geometryJumper.isPaused) {
            resumeGeometryJumper();
        } else {
            pauseGeometryJumper();
        }
        event.preventDefault();
    }
}

// 处理画布点击
function handleGeometryJump() {
    if (geometryJumper.isRunning && !geometryJumper.gameOver) {
        if (geometryJumper.isPaused) {
            resumeGeometryJumper();
        } else {
            jumpGeometryPlayer();
        }
    }
}

// 玩家跳跃
function jumpGeometryPlayer() {
    if (!geometryJumper.player.isJumping) {
        geometryJumper.player.velocityY = geometryJumper.jumpForce;
        geometryJumper.player.isJumping = true;
        
        // 如果开启了调试计时器，记录起跳时间
        if (geometryJumper.debugJumpTime) {
            geometryJumper.jumpStartTime = performance.now();
            geometryJumper.isRecordingJump = true;
        }
    }
}

// 游戏主循环
function gameLoopGeometryJumper(timestamp) {
    if (!geometryJumper.isRunning || geometryJumper.isPaused) return;
    
    // 计算当前帧与上一帧的时间差（毫秒）
    const deltaTime = timestamp - geometryJumper.lastFrameTime;
    geometryJumper.lastFrameTime = timestamp;
    
    // 计算时间因子，用于调整物理更新
    const timeScale = deltaTime / geometryJumper.physicsTimeStep;
    
    updateGeometryJumper(deltaTime, timeScale);
    renderGeometryJumper();
    
    if (!geometryJumper.gameOver) {
        geometryJumper.animationFrame = requestAnimationFrame(gameLoopGeometryJumper);
    } else {
        endGeometryJumper();
    }
}

// 更新游戏状态
function updateGeometryJumper(deltaTime, timeScale) {
    // 使用时间因子调整游戏速度和障碍物移动
    const scaledGameSpeed = geometryJumper.gameSpeed * timeScale;
    
    // 增加距离和分数
    geometryJumper.distance += scaledGameSpeed;
    const newScore = Math.floor(geometryJumper.distance / 10);
    if (newScore > geometryJumper.score) {
        geometryJumper.score = newScore;
        document.getElementById('geometry-score').textContent = geometryJumper.score;
    }
    
    // 更新玩家位置 - 应用时间因子调整重力和速度
    geometryJumper.player.velocityY += geometryJumper.gravity * timeScale;
    geometryJumper.player.y += geometryJumper.player.velocityY * timeScale;
    
    // 检查地面碰撞
    const groundY = geometryJumper.height - geometryJumper.groundHeight - geometryJumper.player.height;
    if (geometryJumper.player.y >= groundY) {
        geometryJumper.player.y = groundY;
        geometryJumper.player.velocityY = 0;
        
        // 如果玩家正在跳跃并且开启了调试计时器，记录落地时间并计算跳跃时长
        if (geometryJumper.player.isJumping && geometryJumper.debugJumpTime && geometryJumper.isRecordingJump) {
            const jumpEndTime = performance.now();
            geometryJumper.lastJumpDuration = (jumpEndTime - geometryJumper.jumpStartTime) / 1000; // 转换为秒
            geometryJumper.isRecordingJump = false;
        }
        
        geometryJumper.player.isJumping = false;
    }
    
    // 随机生成障碍物 - 考虑时间因子调整生成频率
    const adjustedObstacleFrequency = geometryJumper.obstacleFrequency * timeScale;
    if (Math.random() < adjustedObstacleFrequency && geometryJumper.obstacles.length < geometryJumper.maxObstacles) {
        // 计算当前前进的距离
        const currentDistance = geometryJumper.distance;
        
        // 检查是否已经走过足够的距离生成新障碍物
        if (geometryJumper.lastObstacleDistance === 0 || 
            (currentDistance - geometryJumper.lastObstacleDistance) >= geometryJumper.minObstacleDistance) {
            
            // 选择使用哪个间距范围
            const gapRangeIndex = Math.random() < 0.3 ? 0 : 1; // 30%几率使用紧密范围，70%几率使用宽松范围
            const gapRange = geometryJumper.obstacleGaps[gapRangeIndex];
            
            // 随机选择这个间距范围内的距离
            const nextGap = getRandomInt(gapRange.min, gapRange.max);
            
            // 如果是紧密型障碍物，则生成2-3个连续的小障碍物
            if (gapRangeIndex === 0) {
                const obstacleCount = getRandomInt(2, 3);
                const baseHeight = getRandomInt(20, 40);
                
                for (let i = 0; i < obstacleCount; i++) {
                    const height = baseHeight + getRandomInt(-10, 10);
                    const obstacle = {
                        x: geometryJumper.width + (i * getRandomInt(30, 50)),
                        y: geometryJumper.height - geometryJumper.groundHeight - height,
                        width: getRandomInt(15, 30),
                        height: height,
                        color: COLORS.OBSTACLE
                    };
                    geometryJumper.obstacles.push(obstacle);
                }
            } else {
                // 单个障碍物
                const height = getRandomInt(20, 50);
                const obstacle = {
                    x: geometryJumper.width,
                    y: geometryJumper.height - geometryJumper.groundHeight - height,
                    width: getRandomInt(20, 40),
                    height: height,
                    color: COLORS.OBSTACLE
                };
                geometryJumper.obstacles.push(obstacle);
            }
            
            // 更新最后障碍物距离
            geometryJumper.lastObstacleDistance = currentDistance;
        }
    }
    
    // 更新障碍物位置 - 使用时间因子调整移动速度
    for (let i = 0; i < geometryJumper.obstacles.length; i++) {
        geometryJumper.obstacles[i].x -= scaledGameSpeed;
        
        // 检查碰撞
        if (isColliding(geometryJumper.player, geometryJumper.obstacles[i])) {
            geometryJumper.gameOver = true;
        }
        
        // 移除超出屏幕的障碍物
        if (geometryJumper.obstacles[i].x + geometryJumper.obstacles[i].width < 0) {
            geometryJumper.obstacles.splice(i, 1);
            i--;
        }
    }
}

// 渲染游戏
function renderGeometryJumper() {
    const ctx = geometryJumper.ctx;
    const width = geometryJumper.width;
    const height = geometryJumper.height;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    drawPixelRect(ctx, 0, 0, width, height, COLORS.BACKGROUND);
    
    // 绘制地面
    drawPixelRect(ctx, 0, height - geometryJumper.groundHeight, width, geometryJumper.groundHeight, COLORS.GROUND);
    
    // 绘制像素网格效果
    ctx.fillStyle = COLORS.GRID;
    for (let x = 0; x < width; x += 10) {
        for (let y = 0; y < height - geometryJumper.groundHeight; y += 10) {
            if ((x + y) % 20 === 0) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    // 绘制玩家
    drawPixelRect(ctx, 
                  geometryJumper.player.x, 
                  geometryJumper.player.y, 
                  geometryJumper.player.width, 
                  geometryJumper.player.height, 
                  geometryJumper.player.color, 
                  COLORS.BORDER);
    
    // 绘制障碍物
    for (const obstacle of geometryJumper.obstacles) {
        drawPixelRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.color, COLORS.BORDER);
    }
    
    // 如果开启了调试计时器，显示上次跳跃时长
    if (geometryJumper.debugJumpTime && geometryJumper.lastJumpDuration > 0) {
        ctx.font = '12px monospace';
        ctx.fillStyle = '#FF0000';
        ctx.fillText(`跳跃时间: ${geometryJumper.lastJumpDuration.toFixed(3)}秒`, 10, 20);
        
        // 绘制当前是否在跳跃状态
        if (geometryJumper.isRecordingJump) {
            const currentJumpTime = (performance.now() - geometryJumper.jumpStartTime) / 1000;
            ctx.fillText(`正在跳跃: ${currentJumpTime.toFixed(3)}秒`, 10, 40);
        }
    }
    
    // 如果游戏结束，显示结束消息
    if (geometryJumper.gameOver && geometryJumper.isRunning) {
        ctx.fillStyle = COLORS.GAME_OVER;
        ctx.fillRect(0, 0, width, height);
        
        drawPixelText(ctx, '游戏结束', width / 2 - 80, height / 2 - 20, COLORS.TEXT, 24);
        drawPixelText(ctx, `最终分数: ${geometryJumper.score}`, width / 2 - 100, height / 2 + 20, COLORS.TEXT, 16);
    }
    
    // 如果游戏暂停，显示暂停消息
    if (geometryJumper.isPaused && geometryJumper.isRunning && !geometryJumper.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
        
        drawPixelText(ctx, '游戏暂停', width / 2 - 80, height / 2 - 20, COLORS.TEXT, 24);
        drawPixelText(ctx, '回到页面继续游戏', width / 2 - 140, height / 2 + 20, COLORS.TEXT, 16);
    }
}

// 处理页面可见性变化
function handleGeometryVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        // 页面不可见，暂停游戏
        if (geometryJumper.isRunning && !geometryJumper.gameOver) {
            pauseGeometryJumper();
        }
    } else if (document.visibilityState === 'visible') {
        // 页面可见，但不自动恢复游戏，需要用户手动操作
        // 这里只重新渲染游戏，显示暂停状态
        if (geometryJumper.isPaused) {
            renderGeometryJumper();
        }
    }
}

// 暂停游戏
function pauseGeometryJumper() {
    if (!geometryJumper.isRunning || geometryJumper.gameOver) return;
    
    geometryJumper.isPaused = true;
    cancelAnimationFrame(geometryJumper.animationFrame);
    renderGeometryJumper(); // 重新渲染以显示暂停状态
}

// 恢复游戏
function resumeGeometryJumper() {
    if (!geometryJumper.isRunning || geometryJumper.gameOver || !geometryJumper.isPaused) return;
    
    geometryJumper.isPaused = false;
    geometryJumper.lastFrameTime = performance.now();
    geometryJumper.animationFrame = requestAnimationFrame(gameLoopGeometryJumper);
}

// 结束游戏
function endGeometryJumper() {
    geometryJumper.isRunning = false;
    geometryJumper.isPaused = false;
    document.getElementById('geometry-restart').style.visibility = 'visible';
    cancelAnimationFrame(geometryJumper.animationFrame);
}