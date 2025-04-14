// 颜色识别游戏

// 游戏状态
const colorRecognizer = {
    isRunning: false,
    
    // 游戏参数
    roundsPerGame: 10,  // 每局游戏的回合数
    
    // 游戏元素
    colorDisplay: null,
    colorInput: null,
    submitButton: null,
    feedbackElement: null,
    scoreElement: null,
    restartButton: null,
    
    // 游戏数据
    currentColor: [0, 0, 0],  // 当前显示的RGB颜色
    score: 0,              // 当前得分
    currentRound: 0,       // 当前回合
    gameOver: false
};

// 初始化游戏
function initColorRecognizer() {
    // 获取DOM元素
    colorRecognizer.colorDisplay = document.getElementById('color-display');
    colorRecognizer.colorInput = document.getElementById('color-input');
    colorRecognizer.submitButton = document.getElementById('color-submit');
    colorRecognizer.feedbackElement = document.getElementById('color-feedback');
    colorRecognizer.scoreElement = document.getElementById('color-score');
    colorRecognizer.restartButton = document.getElementById('color-restart');
    
    // 添加事件监听器
    colorRecognizer.submitButton.addEventListener('click', submitColorGuess);
    colorRecognizer.colorInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitColorGuess();
        }
    });
    colorRecognizer.restartButton.addEventListener('click', startColorRecognizer);
    
    // 确保颜色显示区域是正方形
    ensureSquareDisplay();
    window.addEventListener('resize', ensureSquareDisplay);
    
    // 开始游戏
    startColorRecognizer();
}

// 确保颜色显示区域是正方形
function ensureSquareDisplay() {
    const display = colorRecognizer.colorDisplay;
    const parent = display.parentElement;
    const availableWidth = display.clientWidth;
    
    // 设置高度等于宽度以创建正方形
    display.style.height = `${availableWidth}px`;
}

// 开始/重新开始游戏
function startColorRecognizer() {
    colorRecognizer.score = 0;
    colorRecognizer.currentRound = 0;
    colorRecognizer.gameOver = false;
    colorRecognizer.isRunning = true;
    
    // 更新UI
    updateColorRecognizerUI();
    
    // 生成第一个颜色
    generateRandomColor();
}

// 生成随机颜色
function generateRandomColor() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    
    colorRecognizer.currentColor = [r, g, b];
    const hexColor = rgbToHex(colorRecognizer.currentColor);
    
    // 设置颜色显示区域
    colorRecognizer.colorDisplay.style.backgroundColor = hexColor;
    
    // 清空输入框和反馈
    colorRecognizer.colorInput.value = '';
    colorRecognizer.feedbackElement.textContent = '';
    
    // 聚焦输入框
    colorRecognizer.colorInput.focus();
}

// 生成像素网格效果
function generatePixelGrid(color) {
    const display = colorRecognizer.colorDisplay;
    const displayRect = display.getBoundingClientRect();
    const width = displayRect.width;
    const height = displayRect.height;
    
    // 清除旧的像素网格
    while (display.firstChild) {
        display.removeChild(display.firstChild);
    }
    
    // 设置背景色
    display.style.backgroundColor = rgbToHex(color);
    
    // 计算网格大小
    const pixelSize = colorRecognizer.pixelSize;
    const cols = Math.floor(width / pixelSize);
    const rows = Math.floor(height / pixelSize);
    
    // 创建像素网格容器
    const gridContainer = document.createElement('div');
    gridContainer.style.width = '100%';
    gridContainer.style.height = '100%';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    // 主颜色
    const mainColor = rgbToHex(color);
    
    // 轻微变化的颜色
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const pixel = document.createElement('div');
            
            // 添加轻微颜色变化以创建像素效果
            let pixelColor;
            if ((i + j) % 3 === 0) {
                // 轻微变亮
                const brighter = [
                    Math.min(255, color[0] + getRandomInt(0, 10)),
                    Math.min(255, color[1] + getRandomInt(0, 10)),
                    Math.min(255, color[2] + getRandomInt(0, 10))
                ];
                pixelColor = rgbToHex(brighter);
            } else if ((i + j) % 5 === 0) {
                // 轻微变暗
                const darker = [
                    Math.max(0, color[0] - getRandomInt(0, 10)),
                    Math.max(0, color[1] - getRandomInt(0, 10)),
                    Math.max(0, color[2] - getRandomInt(0, 10))
                ];
                pixelColor = rgbToHex(darker);
            } else {
                // 使用主颜色
                pixelColor = mainColor;
            }
            
            pixel.style.backgroundColor = pixelColor;
            pixel.style.width = '100%';
            pixel.style.height = '100%';
            gridContainer.appendChild(pixel);
        }
    }
    
    display.appendChild(gridContainer);
}

// 提交颜色猜测
function submitColorGuess() {
    if (colorRecognizer.gameOver) return;
    
    const userInput = colorRecognizer.colorInput.value.trim();
    if (!userInput) return;
    
    // 解析输入的颜色
    const userColor = parseColorToRGB(userInput);
    
    if (!userColor) {
        colorRecognizer.feedbackElement.textContent = '无效的颜色格式，请使用 #RRGGBB、RRGGBB、R G B 或 R,G,B 格式';
        colorRecognizer.feedbackElement.style.color = '#cc5555';
        return;
    }
    
    // 计算得分
    const roundScore = calculateColorScore(userColor, colorRecognizer.currentColor);
    colorRecognizer.score += roundScore;
    
    // 更新回合
    colorRecognizer.currentRound++;
    
    // 显示反馈
    if (roundScore > 0) {
        colorRecognizer.feedbackElement.textContent = `+${roundScore} 分！不错！`;
        colorRecognizer.feedbackElement.style.color = '#55cc55';
    } else {
        colorRecognizer.feedbackElement.textContent = `${roundScore} 分。差距太大了。`;
        colorRecognizer.feedbackElement.style.color = '#cc5555';
    }
    
    // 显示正确颜色比较
    const correctColor = rgbToHex(colorRecognizer.currentColor);
    const userColorHex = rgbToHex(userColor);
    
    // 更新反馈显示
    const colorCompare = document.createElement('div');
    colorCompare.style.display = 'flex';
    colorCompare.style.justifyContent = 'center';
    colorCompare.style.marginTop = '10px';
    
    // 正确颜色显示
    const correctBox = document.createElement('div');
    correctBox.style.width = '20px';
    correctBox.style.height = '20px';
    correctBox.style.backgroundColor = correctColor;
    correctBox.style.marginRight = '5px';
    correctBox.style.border = '1px solid #5c5655';
    
    // 用户输入的颜色显示
    const userBox = document.createElement('div');
    userBox.style.width = '20px';
    userBox.style.height = '20px';
    userBox.style.backgroundColor = userColorHex;
    userBox.style.marginLeft = '5px';
    userBox.style.border = '1px solid #5c5655';
    
    // 添加标签
    const compareText = document.createElement('div');
    compareText.textContent = '正确 ⟷ 你的';
    compareText.style.fontSize = '10px';
    compareText.style.margin = '0 5px';
    
    colorCompare.appendChild(correctBox);
    colorCompare.appendChild(compareText);
    colorCompare.appendChild(userBox);
    
    // 清除旧的比较框
    const oldCompare = colorRecognizer.feedbackElement.querySelector('div');
    if (oldCompare) {
        colorRecognizer.feedbackElement.removeChild(oldCompare);
    }
    
    // 添加新的比较框
    colorRecognizer.feedbackElement.appendChild(colorCompare);
    
    // 更新分数显示
    colorRecognizer.scoreElement.textContent = colorRecognizer.score;
    
    // 检查游戏是否结束
    if (colorRecognizer.currentRound >= colorRecognizer.roundsPerGame) {
        endColorRecognizer();
    } else {
        // 延迟生成下一个颜色
        setTimeout(generateRandomColor, 1500);
    }
}

// 更新游戏UI
function updateColorRecognizerUI() {
    colorRecognizer.scoreElement.textContent = colorRecognizer.score;
}

// 结束游戏
function endColorRecognizer() {
    colorRecognizer.gameOver = true;
    colorRecognizer.isRunning = false;
    
    // 显示最终得分
    colorRecognizer.feedbackElement.textContent = `游戏结束！最终得分: ${colorRecognizer.score}`;
    colorRecognizer.feedbackElement.style.color = '#FFFFFF';
    
    // 显示正确答案
    const correctColor = rgbToHex(colorRecognizer.currentColor);
    colorRecognizer.colorInput.value = correctColor;
}