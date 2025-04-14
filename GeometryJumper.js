// 几何跳跃游戏

// 游戏状态
const geometryJumper = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    isRunning: false,
    animationFrame: null,
    lastFrameTime: 0,
    
    // 游戏参数
    gravity: 0.4,                // 降低重力使滞空时间更长
    jumpForce: -12,              // 调整跳跃力度
    gameSpeed: 3,              // 降低游戏速度
    obstacleFrequency: 0.01,     // 降低障碍物生成概率
    maxObstacles: 5,
    groundHeight: 50,
    lastObstacleDistance: 0,     // 上一个障碍物的距离
    minObstacleDistance: 300,    // 最小障碍物距离
    
    // 游戏对象
    player: {
        x: 50,
        y: 0,
        width: 30,
        height: 30,
        velocityY: 0,
        isJumping: false,
        color: '#5d73b0'         // 更改为浅色系
    },
    obstacles: [],
    
    // 游戏数据
    score: 0,
    distance: 0,
    gameOver: false,
    
    // 障碍物间距范围
    obstacleGaps: [
        { min: 1, max: 10 },     // 紧密的障碍物
        { min: 300, max: 900 }  // 有间距的障碍物
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
    geometryJumper.gameSpeed = 5;
    geometryJumper.lastObstacleDistance = 0;  // 添加这行修复 - 重置最后障碍物距离
    
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
    gameLoopGeometryJumper();
}

// 重新开始游戏
function restartGeometryJumper() {
    // 隐藏按钮但保持占位
    document.getElementById('geometry-restart').style.visibility = 'hidden';
    document.getElementById('geometry-restart').style.display = 'inline-block';
    
    resetGeometryJumper();
    geometryJumper.isRunning = true;
    geometryJumper.lastFrameTime = performance.now();
    gameLoopGeometryJumper();
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
        jumpGeometryPlayer();
        event.preventDefault();
    } else if (event.code === 'Space' && !geometryJumper.isRunning) {
        startGeometryJumper();
        event.preventDefault();
    } else if (event.code === 'Space' && geometryJumper.gameOver) {
        restartGeometryJumper();
        event.preventDefault();
    }
}

// 处理画布点击
function handleGeometryJump() {
    if (geometryJumper.isRunning && !geometryJumper.gameOver) {
        jumpGeometryPlayer();
    }
}

// 玩家跳跃
function jumpGeometryPlayer() {
    if (!geometryJumper.player.isJumping) {
        geometryJumper.player.velocityY = geometryJumper.jumpForce;
        geometryJumper.player.isJumping = true;
    }
}

// 游戏主循环
function gameLoopGeometryJumper(timestamp) {
    if (!geometryJumper.isRunning) return;
    
    const deltaTime = timestamp - geometryJumper.lastFrameTime;
    geometryJumper.lastFrameTime = timestamp;
    
    updateGeometryJumper(deltaTime);
    renderGeometryJumper();
    
    if (!geometryJumper.gameOver) {
        geometryJumper.animationFrame = requestAnimationFrame(gameLoopGeometryJumper);
    } else {
        endGeometryJumper();
    }
}

// 更新游戏状态
function updateGeometryJumper(deltaTime) {
    // 增加距离和分数
    geometryJumper.distance += geometryJumper.gameSpeed;
    const newScore = Math.floor(geometryJumper.distance / 10);
    if (newScore > geometryJumper.score) {
        geometryJumper.score = newScore;
        document.getElementById('geometry-score').textContent = geometryJumper.score;
        
        // 移除游戏加速代码
    }
    
    // 更新玩家位置
    geometryJumper.player.velocityY += geometryJumper.gravity;
    geometryJumper.player.y += geometryJumper.player.velocityY;
    
    // 检查地面碰撞
    const groundY = geometryJumper.height - geometryJumper.groundHeight - geometryJumper.player.height;
    if (geometryJumper.player.y >= groundY) {
        geometryJumper.player.y = groundY;
        geometryJumper.player.velocityY = 0;
        geometryJumper.player.isJumping = false;
    }
    
    // 随机生成障碍物
    if (Math.random() < geometryJumper.obstacleFrequency && geometryJumper.obstacles.length < geometryJumper.maxObstacles) {
        // 计算当前前进的距离
        const currentDistance = geometryJumper.distance;
        
        // 检查是否已经走过足够的距离生成新障碍物
        // 如果是游戏开始或者距离上一个障碍物已经足够远
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
                        color: '#5d9db0'
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
                    color: '#5d9db0'
                };
                geometryJumper.obstacles.push(obstacle);
            }
            
            // 更新最后障碍物距离
            geometryJumper.lastObstacleDistance = currentDistance;
            
            // 调试消息
            console.log("生成障碍物，当前距离：" + currentDistance + ", 下一间距：" + nextGap);
        }
    }
    
    // 更新障碍物位置
    for (let i = 0; i < geometryJumper.obstacles.length; i++) {
        geometryJumper.obstacles[i].x -= geometryJumper.gameSpeed;
        
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
    drawPixelRect(ctx, 0, 0, width, height, '#e6f7ff');
    
    // 绘制地面
    drawPixelRect(ctx, 0, height - geometryJumper.groundHeight, width, geometryJumper.groundHeight, '#b3d9ff');
    
    // 绘制像素网格效果
    ctx.fillStyle = '#d6eeff';
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
                  '#FFFFFF');
    
    // 绘制障碍物
    for (const obstacle of geometryJumper.obstacles) {
        drawPixelRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.color, '#FFFFFF');
    }
    
    // 如果游戏结束，显示结束消息
    if (geometryJumper.gameOver && geometryJumper.isRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        drawPixelText(ctx, '游戏结束', width / 2 - 80, height / 2 - 20, '#FFFFFF', 24);
        drawPixelText(ctx, `最终分数: ${geometryJumper.score}`, width / 2 - 100, height / 2 + 20, '#FFFFFF', 16);
    }
}

// 结束游戏
function endGeometryJumper() {
    geometryJumper.isRunning = false;
    document.getElementById('geometry-restart').style.visibility = 'visible';
    cancelAnimationFrame(geometryJumper.animationFrame);
}