## 前期工作
之前的系统采用的是**优先级策略**：如果大模型 API **成功返回有效结果**，则**不会调用 WASM 解析器**；只有在大模型 API **失败或不可用**时，才会降级到 WASM 解析器。这是为了平衡**准确性**（大模型）和**性能/可靠性**（WASM）。

### 源码中的优先级实现
在您的 JavaScript 代码中，优先级逻辑通常是这样实现的（简化版）：

```javascript
async function parseCommand(text) {
    // 1. 优先使用大模型API
    if (apiConfig.isConnected) {
        try {
            const command = await parseCommandWithLLM(text);
            if (isValidCommand(command)) { // 大模型成功解析
                executeCommand(command);
                return;
            }
        } catch (error) {
            console.error('大模型解析失败:', error);
        }
    }
    
    // 2. 大模型失败或不可用时，使用WASM
    if (isWasmReady) {
        const command = parseCommandWithWasm(text);
        if (isValidCommand(command)) { // WASM成功解析
            executeCommand(command);
            return;
        }
    }
    
    // 3. 兜底方案
    fallbackToSimpleParser(text);
}
```

### 适用场景示例
| 用户指令               | 解析方式       | 原因                                                                 |
|------------------------|----------------|----------------------------------------------------------------------|
| "打开客厅的灯"         | 大模型 API     | 包含位置信息，WASM 可能无法处理复杂修饰词。                          |
| "开灯"                 | WASM           | 简单固定模式，WASM 可快速响应，无需等待大模型。                      |
| "Turn on the light"    | 大模型 API     | 英文指令超出 WASM 预设规则范围。                                      |
| 大模型 API 网络超时    | WASM           | 大模型不可用时，自动降级到 WASM。                                     |

## 改进
我们希望测试**AI+WASM 和 AI+JavaScript 的性能对比**，因此对测试文件device-simulation.js进行了改进。
```
    // AI+JavaScript模式测试（仅测试JavaScript处理标准指令部分）
    async function testAIJavaScriptProcessing(standardCommand) {
        console.log(`📝 AI+JavaScript模式: 处理标准指令 "${standardCommand}"`);
        
        const totalStart = process.hrtime.bigint();
        
        // 使用JavaScript处理标准化指令
        console.log('   📝 JavaScript解释执行标准指令...');
        const jsResult = jsFallbackProcessor(standardCommand);
        console.log(`   ✅ JavaScript处理完成: ${jsResult.time.toFixed(4)}ms`);
        console.log(`   🔌 生成GPIO命令: ${jsResult.result.gpioCommand}`);
        
        const totalTime = Number(process.hrtime.bigint() - totalStart) / 1000000;
        
        return {
            mode: 'AI+JavaScript',
            total: totalTime,
            processing: {
                jsTime: jsResult.time,
                type: 'JavaScript解释执行处理'
            },
            command: jsResult.result
        };
    }
```
