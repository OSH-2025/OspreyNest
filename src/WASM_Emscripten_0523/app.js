// app.js
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const startRecognitionButton = document.getElementById('start-recognition');
    const listeningStatus = document.getElementById('listening-status');
    const transcription = document.getElementById('transcription');
    const commandResult = document.getElementById('command-result');
    const lightStatus = document.getElementById('light-status');
    const logContent = document.getElementById('log-content');
    const logContainer = document.getElementById('log-container');
    const toggleLog = document.getElementById('toggle-log');
    
    // 检查Web Speech API是否可用
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        
        startRecognitionButton.addEventListener('click', function() {
            if (recognition.start) {
                startRecognitionButton.disabled = true;
                startRecognitionButton.textContent = '正在监听...';
                listeningStatus.textContent = '请说出您的指令...';
                logMessage('开始监听语音指令', 'listening');
                
                recognition.start();
            }
        });
        
        recognition.onstart = function() {
            startRecognitionButton.classList.add('listening');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            transcription.textContent = `识别结果: "${transcript}"`;
            logMessage(`语音识别结果: ${transcript}`, 'processing');
            
            // 使用WASM解析指令
            parseCommand(transcript).then(command => {
                if (command) {
                    commandResult.textContent = `解析结果: ${command.action} ${command.target}`;
                    
                    // 发送指令到树莓派
                    sendCommandToRaspberryPi(command).then(response => {
                        logMessage(`指令发送成功: ${JSON.stringify(command)}`, 'sending');
                        updateDeviceStatus(command, response);
                    }).catch(error => {
                        logMessage(`指令发送失败: ${error}`, 'error');
                    });
                } else {
                    commandResult.textContent = '无法解析指令，请重试';
                    logMessage('无法解析指令', 'error');
                }
            }).catch(error => {
                commandResult.textContent = `解析错误: ${error}`;
                logMessage(`解析错误: ${error}`, 'error');
            });
        };
        
        recognition.onerror = function(event) {
            logMessage(`语音识别错误: ${event.error}`, 'error');
            listeningStatus.textContent = `语音识别错误: ${event.error}`;
        };
        
        recognition.onend = function() {
            startRecognitionButton.classList.remove('listening');
            startRecognitionButton.disabled = false;
            startRecognitionButton.textContent = '开始语音';
            listeningStatus.textContent = '等待指令...';
        };
    } else {
        listeningStatus.textContent = '您的浏览器不支持语音识别';
        startRecognitionButton.disabled = true;
        logMessage('您的浏览器不支持Web Speech API', 'error');
    }
    
    // 切换日志显示
    toggleLog.addEventListener('click', function(e) {
        e.preventDefault();
        if (logContainer.style.display === 'block') {
            logContainer.style.display = 'none';
            toggleLog.textContent = '显示日志';
        } else {
            logContainer.style.display = 'block';
            toggleLog.textContent = '隐藏日志';
        }
    });
    
    // 辅助函数：记录日志
    function logMessage(message, type = 'info') {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const logEntry = `[${timeString}] ${message}`;
        
        // 添加到日志容器
        logContent.textContent = logEntry + '\n' + logContent.textContent;
        
        // 滚动到底部
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    // 辅助函数：更新设备状态
    function updateDeviceStatus(command, response) {
        if (command.target === '灯' && response.success) {
            const status = command.action === '打开' ? '开启' : '关闭';
            lightStatus.textContent = status;
        }
    }
});

// 与WASM模块交互的函数
async function parseCommand(text) {
    // 加载WASM模块
    const nlpParser = await import('./nlp-parser.js');
    
    // 调用WASM函数解析指令
    const command = nlpParser.parseCommand(text);
    
    return command;
}

// 发送指令到树莓派的函数
async function sendCommandToRaspberryPi(command) {
    try {
        const response = await fetch('http://your-raspberry-pi-ip:5000/api/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: command.action,
                target: command.target
            })
        });
        
        return await response.json();
    } catch (error) {
        throw new Error(`发送指令失败: ${error.message}`);
    }
}