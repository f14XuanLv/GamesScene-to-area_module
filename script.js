// 主脚本文件 - 基本初始化和公共函数

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('像素风格小游戏合集已加载');
    
    // 确保在图像加载完成后再初始化游戏
    loadGameAssets(function() {
        // 初始化所有游戏
        initGeometryJumper();
        initClickApple();
        initColorRecognizer();
    });
});

// 加载游戏资源
function loadGameAssets(callback) {
    // 预加载图像
    const heartImg = new Image();
    heartImg.src = heartIconBase64;
    
    const appleImg = new Image();
    appleImg.src = appleBase64;
    
    const goldenAppleImg = new Image();
    goldenAppleImg.src = goldenAppleBase64;
    
    const tntImg = new Image();
    tntImg.src = tntBase64;
    
    // 等待所有图像加载完成
    let loadedCount = 0;
    const totalImages = 4;
    
    function checkAllLoaded() {
        loadedCount++;
        if (loadedCount >= totalImages) {
            callback();
        }
    }
    
    heartImg.onload = checkAllLoaded;
    appleImg.onload = checkAllLoaded;
    goldenAppleImg.onload = checkAllLoaded;
    tntImg.onload = checkAllLoaded;
    
    // 如果图像加载失败或超时，也要继续
    heartImg.onerror = checkAllLoaded;
    appleImg.onerror = checkAllLoaded;
    goldenAppleImg.onerror = checkAllLoaded;
    tntImg.onerror = checkAllLoaded;
    
    // 设置超时，避免长时间阻塞
    setTimeout(function() {
        if (loadedCount < totalImages) {
            console.warn('图像加载超时，继续初始化游戏');
            callback();
        }
    }, 3000);
}

// 工具函数

/**
 * 随机整数生成器
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} - 随机整数
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 带权重的随机选择
 * @param {Array} items - 物品数组
 * @param {Array} weights - 权重数组
 * @returns {*} - 选中的物品
 */
function weightedRandom(items, weights) {
    const cumulativeWeights = [];
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        cumulativeWeights.push(sum);
    }
    
    const randomValue = Math.random() * sum;
    
    for (let i = 0; i < cumulativeWeights.length; i++) {
        if (randomValue < cumulativeWeights[i]) {
            return items[i];
        }
    }
    
    return items[0]; // 默认返回第一个物品
}

/**
 * 碰撞检测函数
 * @param {Object} rect1 - 第一个矩形 {x, y, width, height}
 * @param {Object} rect2 - 第二个矩形 {x, y, width, height}
 * @returns {boolean} - 是否碰撞
 */
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * 绘制像素文本
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 要绘制的文本
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {string} color - 文本颜色
 * @param {number} size - 文本大小
 */
function drawPixelText(ctx, text, x, y, color = '#ffffff', size = 16) {
    ctx.font = `${size}px 'Press Start 2P', monospace`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

/**
 * 绘制像素矩形
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {string} color - 填充颜色
 * @param {string} borderColor - 边框颜色
 */
function drawPixelRect(ctx, x, y, width, height, color, borderColor = null) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
}

/**
 * 创建像素图像
 * @param {string} src - 图像源（URL或Base64）
 * @returns {HTMLImageElement} - 图像元素
 */
function createPixelImage(src) {
    const img = new Image();
    img.src = src;
    // 设置图像渲染为像素化
    img.style.imageRendering = 'pixelated';
    return img;
}

/**
 * 解析颜色字符串为RGB值
 * @param {string} colorStr - 颜色字符串 (#RGB, #RRGGBB, R G B, 或 R,G,B)
 * @returns {Array|null} - RGB值数组 [r, g, b] 或解析失败时返回null
 */
function parseColorToRGB(colorStr) {
    // 去除多余空格
    colorStr = colorStr.trim();
    
    // 尝试匹配空格分隔的RGB值 (例如 "255 128 0")
    const rgbSpaceMatch = colorStr.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
    if (rgbSpaceMatch) {
        const r = parseInt(rgbSpaceMatch[1], 10);
        const g = parseInt(rgbSpaceMatch[2], 10);
        const b = parseInt(rgbSpaceMatch[3], 10);
        if (r <= 255 && g <= 255 && b <= 255) {
            return [r, g, b];
        }
        return null;
    }
    
    // 尝试匹配逗号分隔的RGB值 (例如 "255,128,0" 或 "56,69,112")
    const rgbCommaMatch = colorStr.match(/^(\d+),(\d+),(\d+)$/);
    if (rgbCommaMatch) {
        const r = parseInt(rgbCommaMatch[1], 10);
        const g = parseInt(rgbCommaMatch[2], 10);
        const b = parseInt(rgbCommaMatch[3], 10);
        if (r <= 255 && g <= 255 && b <= 255) {
            return [r, g, b];
        }
        return null;
    }
    
    // 去除#前缀（如果有）
    colorStr = colorStr.replace(/^#/, '');
    
    // 3位十六进制颜色 (例如 "F80")
    if (colorStr.length === 3) {
        return [
            parseInt(colorStr[0] + colorStr[0], 16),
            parseInt(colorStr[1] + colorStr[1], 16),
            parseInt(colorStr[2] + colorStr[2], 16)
        ];
    }
    
    // 6位十六进制颜色 (例如 "FF8800")
    if (colorStr.length === 6) {
        return [
            parseInt(colorStr.substring(0, 2), 16),
            parseInt(colorStr.substring(2, 4), 16),
            parseInt(colorStr.substring(4, 6), 16)
        ];
    }
    
    return null;
}

/**
 * 计算两个颜色之间的差异分数
 * @param {Array} color1 - 第一个颜色的RGB值数组 [r, g, b]
 * @param {Array} color2 - 第二个颜色的RGB值数组 [r, g, b]
 * @returns {number} - 差异分数
 */
function calculateColorScore(color1, color2) {
    const diffR = color1[0] - color2[0];
    const diffG = color1[1] - color2[1];
    const diffB = color1[2] - color2[2];
    
    // 计算欧几里得距离
    const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);
    
    // 最大可能距离是 sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
    const maxDistance = Math.sqrt(3 * 255 * 255);
    
    // 根据公式计算得分: int(100 * (0.5 - distance / maxDistance))
    return Math.floor(100 * (0.5 - distance / maxDistance));
}

/**
 * RGB数组转换为HEX颜色字符串
 * @param {Array} rgb - RGB值数组 [r, g, b]
 * @returns {string} - HEX颜色字符串 (#RRGGBB)
 */
function rgbToHex(rgb) {
    return '#' + rgb.map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}