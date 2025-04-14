// 点击苹果游戏

// 游戏状态
const clickApple = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    isRunning: false,
    animationFrame: null,
    lastFrameTime: 0,
    
    // 游戏参数
    itemSize: 50,         // 统一物品大小
    spawnInterval: 2000,  // 生成物品间隔（毫秒）- 设为2秒
    lastSpawnTime: 0,     // 上次生成物品的时间
    
    // 游戏资源
    images: {
        apple: null,
        goldenApple: null,
        tnt: null,
        heart: null
    },
    
    // 物品类型和权重
    itemTypes: ['apple', 'goldenApple', 'tnt'],
    itemWeights: [0.6, 0.1, 0.3],
    itemPoints: {
        apple: 1,
        goldenApple: 6,
        tnt: 0  // TNT不加分，只减生命
    },
    
    // 游戏对象
    currentItem: null,     // 当前显示的物品
    popEffect: null,       // 点击特效
    
    // 游戏数据
    score: 0,
    lives: 3,
    gameOver: false,
    
    // 调试功能
    debugMode: false       // 是否显示点击区域
};

// 初始化游戏
function initClickApple() {
    clickApple.canvas = document.getElementById('apple-canvas');
    clickApple.ctx = clickApple.canvas.getContext('2d');
    
    // 调整Canvas大小以匹配容器
    resizeClickAppleCanvas();
    window.addEventListener('resize', resizeClickAppleCanvas);
    
    // 加载图像
    loadClickAppleImages();
    
    // 添加点击监听器
    clickApple.canvas.addEventListener('click', handleClickAppleClick);
    
    // 添加开始/重启按钮监听器
    document.getElementById('apple-start').addEventListener('click', startClickApple);
    document.getElementById('apple-restart').addEventListener('click', restartClickApple);
    
    // 重置游戏状态
    resetClickApple();
    
    // 初始渲染
    renderClickApple();
}

// 调整Canvas大小
function resizeClickAppleCanvas() {
    const container = clickApple.canvas.parentElement;
    clickApple.width = container.clientWidth;
    clickApple.height = container.clientHeight;
    clickApple.canvas.width = clickApple.width;
    clickApple.canvas.height = clickApple.height;
}

// 加载游戏图像
function loadClickAppleImages() {
    // 使用pictures.js中的base64图像
    clickApple.images.apple = new Image();
    clickApple.images.apple.src = appleBase64;
    
    clickApple.images.goldenApple = new Image();
    clickApple.images.goldenApple.src = goldenAppleBase64;
    
    clickApple.images.tnt = new Image();
    clickApple.images.tnt.src = tntBase64;
    
    clickApple.images.heart = new Image();
    clickApple.images.heart.src = heartIconBase64;
}

// 重置游戏状态
function resetClickApple() {
    clickApple.currentItem = null;
    clickApple.popEffect = null;
    clickApple.score = 0;
    clickApple.lives = 3;
    clickApple.gameOver = false;
    clickApple.lastSpawnTime = 0;
    
    // 更新分数和生命值显示
    updateClickAppleUI();
}

// 更新UI显示
function updateClickAppleUI() {
    document.getElementById('apple-score').textContent = clickApple.score;
    
    // 更新生命值显示
    const livesContainer = document.getElementById('apple-lives');
    livesContainer.innerHTML = '';
    
    for (let i = 0; i < clickApple.lives; i++) {
        const heartImg = document.createElement('img');
        heartImg.src = heartIconBase64;
        heartImg.width = 18;
        heartImg.height = 18;
        heartImg.className = 'pixel-heart';
        livesContainer.appendChild(heartImg);
    }
}

// 开始游戏
function startClickApple() {
    if (clickApple.isRunning) return;
    
    // 隐藏按钮但保持占位
    document.getElementById('apple-start').style.visibility = 'hidden';
    document.getElementById('apple-start').style.display = 'inline-block';
    document.getElementById('apple-restart').style.visibility = 'hidden';
    document.getElementById('apple-restart').style.display = 'inline-block';
    
    resetClickApple();
    clickApple.isRunning = true;
    clickApple.lastFrameTime = performance.now();
    clickApple.lastSpawnTime = performance.now();
    
    // 立即生成第一个物品
    spawnClickAppleItem();
    
    gameLoopClickApple(performance.now());
}

// 重新开始游戏
function restartClickApple() {
    // 隐藏按钮但保持占位
    document.getElementById('apple-restart').style.visibility = 'hidden';
    document.getElementById('apple-restart').style.display = 'inline-block';
    
    resetClickApple();
    clickApple.isRunning = true;
    clickApple.lastFrameTime = performance.now();
    clickApple.lastSpawnTime = performance.now();
    
    // 立即生成第一个物品
    spawnClickAppleItem();
    
    gameLoopClickApple(performance.now());
}

// 处理画布点击
function handleClickAppleClick(event) {
    if (!clickApple.isRunning || clickApple.gameOver || !clickApple.currentItem) return;
    
    // 获取点击坐标（相对于Canvas）
    const rect = clickApple.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const item = clickApple.currentItem;
    
    // 获取实际渲染的物品尺寸（考虑Canvas的实际大小）
    const canvasToDisplayRatioX = clickApple.canvas.width / rect.width;
    const canvasToDisplayRatioY = clickApple.canvas.height / rect.height;
    
    // 计算点击位置在Canvas坐标系中的位置
    const canvasX = x * canvasToDisplayRatioX;
    const canvasY = y * canvasToDisplayRatioY;
    
    // 检查点击是否命中物品
    if (canvasX >= item.x && canvasX <= item.x + item.width &&
        canvasY >= item.y && canvasY <= item.y + item.height) {
        
        // 创建点击特效
        createPopEffect(item);
        
        // 处理物品点击
        if (item.type === 'apple') {
            clickApple.score += clickApple.itemPoints.apple;
        } else if (item.type === 'goldenApple') {
            clickApple.score += clickApple.itemPoints.goldenApple;
        } else if (item.type === 'tnt') {
            clickApple.lives--;
            if (clickApple.lives <= 0) {
                clickApple.gameOver = true;
            }
        }
        
        // 更新UI
        updateClickAppleUI();
        
        // 移除当前物品
        clickApple.currentItem = null;
    }
}

// 创建点击特效
function createPopEffect(item) {
    clickApple.popEffect = {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        type: item.type,
        scale: 1,
        alpha: 1,
        duration: 300,  // 特效持续时间（毫秒）
        startTime: performance.now()
    };
}

// 游戏主循环
function gameLoopClickApple(timestamp) {
    if (!clickApple.isRunning) return;
    
    const deltaTime = timestamp - clickApple.lastFrameTime;
    clickApple.lastFrameTime = timestamp;
    
    updateClickApple(deltaTime, timestamp);
    renderClickApple();
    
    if (!clickApple.gameOver) {
        clickApple.animationFrame = requestAnimationFrame(gameLoopClickApple);
    } else {
        endClickApple();
    }
}

// 更新游戏状态
function updateClickApple(deltaTime, timestamp) {
    // 检查是否应该生成新物品 - 无论是否已有物品，只要到达间隔时间就生成
    if (timestamp - clickApple.lastSpawnTime >= clickApple.spawnInterval) {
        // 生成新物品，替换当前物品（如果有）
        spawnClickAppleItem();
        clickApple.lastSpawnTime = timestamp;
    }
    
    // 更新点击特效
    if (clickApple.popEffect) {
        const effect = clickApple.popEffect;
        const elapsed = timestamp - effect.startTime;
        
        if (elapsed >= effect.duration) {
            // 特效结束，移除
            clickApple.popEffect = null;
        } else {
            // 更新特效参数
            const progress = elapsed / effect.duration;
            effect.scale = 1 + 0.2 * Math.sin(progress * Math.PI);  // 轻微放大效果
            effect.alpha = 1 - progress;  // 逐渐消失
        }
    }
}

// 生成新物品
function spawnClickAppleItem() {
    // 移除检查，允许替换现有物品
    
    // 随机选择物品类型
    const itemType = weightedRandom(clickApple.itemTypes, clickApple.itemWeights);
    
    // 计算可用游戏区域（考虑物品大小）
    const maxX = clickApple.width - clickApple.itemSize;
    const maxY = clickApple.height - clickApple.itemSize;
    
    // 确保物品完全在游戏区域内
    const x = Math.max(0, Math.min(maxX, getRandomInt(0, maxX)));
    const y = Math.max(0, Math.min(maxY, getRandomInt(0, maxY)));
    
    clickApple.currentItem = {
        type: itemType,
        x: x,
        y: y,
        width: clickApple.itemSize,
        height: clickApple.itemSize
    };
    
    console.log("生成物品:", itemType, "位置:", x, y);
}

// 渲染游戏
function renderClickApple() {
    const ctx = clickApple.ctx;
    const width = clickApple.width;
    const height = clickApple.height;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    drawPixelRect(ctx, 0, 0, width, height, '#fff2e6');
    
    // 绘制像素网格
    ctx.fillStyle = '#ffe6cc';
    for (let x = 0; x < width; x += 10) {
        for (let y = 0; y < height; y += 10) {
            if ((x + y) % 20 === 0) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    // 绘制当前物品
    if (clickApple.currentItem) {
        const item = clickApple.currentItem;
        const image = clickApple.images[item.type];
        if (image && image.complete) {  // 确保图像已加载
            // 保持图像比例
            ctx.drawImage(
                image, 
                item.x, 
                item.y, 
                item.width, 
                item.height
            );
            
            // 调试模式下显示点击区域
            if (clickApple.debugMode) {
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(item.x, item.y, item.width, item.height);
            }
        }
    }
    
    // 绘制点击特效
    if (clickApple.popEffect) {
        const effect = clickApple.popEffect;
        
        // 保存当前状态
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = effect.alpha;
        
        // 移动到特效中心
        ctx.translate(effect.x + effect.width / 2, effect.y + effect.height / 2);
        
        // 应用缩放
        ctx.scale(effect.scale, effect.scale);
        
        // 绘制特效图像
        const image = clickApple.images[effect.type];
        if (image && image.complete) {  // 确保图像已加载
            ctx.drawImage(
                image, 
                -effect.width / 2, 
                -effect.height / 2, 
                effect.width, 
                effect.height
            );
        }
        
        // 恢复画布状态
        ctx.restore();
    }
    
    // 如果游戏结束，显示结束消息
    if (clickApple.gameOver && clickApple.isRunning) {
        ctx.fillStyle = 'rgba(255, 242, 230, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        drawPixelText(ctx, '游戏结束', width / 2 - 80, height / 2 - 20, '#5c5655', 24);
        drawPixelText(ctx, `最终分数: ${clickApple.score}`, width / 2 - 100, height / 2 + 20, '#5c5655', 16);
    }
}

// 结束游戏
function endClickApple() {
    clickApple.isRunning = false;
    document.getElementById('apple-restart').style.visibility = 'visible';
    cancelAnimationFrame(clickApple.animationFrame);
}