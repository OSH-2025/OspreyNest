### 将JavaScript指令解析逻辑转换为C语言

首先需要将JavaScript中的指令解析逻辑转换为C语言实现。以下是C语言版本的命令解析器：

```c
// command_parser.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

// 定义命令结构
typedef struct {
    char action[20];
    char target[20];
    char gpioCommand[50];
} Command;

// 解析自然语言命令并生成GPIO控制命令
Command parseCommand(const char* text) {
    Command cmd = {0};
    
    // 简单的模式匹配（实际应用中可扩展为复杂NLP逻辑）
    if (strstr(text, "开灯") != NULL) {
        strcpy(cmd.action, "打开");
        strcpy(cmd.target, "灯");
        strcpy(cmd.gpioCommand, "gpio 17 high");
    } else if (strstr(text, "关灯") != NULL) {
        strcpy(cmd.action, "关闭");
        strcpy(cmd.target, "灯");
        strcpy(cmd.gpioCommand, "gpio 17 low");
    } else if (strstr(text, "开空调") != NULL) {
        strcpy(cmd.action, "打开");
        strcpy(cmd.target, "空调");
        strcpy(cmd.gpioCommand, "gpio 18 high");
    } else if (strstr(text, "关空调") != NULL) {
        strcpy(cmd.action, "关闭");
        strcpy(cmd.target, "空调");
        strcpy(cmd.gpioCommand, "gpio 18 low");
    } else if (strstr(text, "开电视") != NULL) {
        strcpy(cmd.action, "打开");
        strcpy(cmd.target, "电视");
        strcpy(cmd.gpioCommand, "gpio 19 high");
    } else if (strstr(text, "关电视") != NULL) {
        strcpy(cmd.action, "关闭");
        strcpy(cmd.target, "电视");
        strcpy(cmd.gpioCommand, "gpio 19 low");
    }
    
    return cmd;
}

// 导出函数供JavaScript调用
EMSCRIPTEN_KEEPALIVE
char* parseCommandAndReturnJSON(const char* text) {
    Command cmd = parseCommand(text);
    
    // 分配内存存储JSON结果
    char* jsonResult = (char*)malloc(200);
    if (!jsonResult) return NULL;
    
    // 构建JSON字符串
    sprintf(jsonResult, 
        "{\"action\":\"%s\",\"target\":\"%s\",\"gpioCommand\":\"%s\"}",
        cmd.action, cmd.target, cmd.gpioCommand);
    
    return jsonResult;
}

// 释放内存函数
EMSCRIPTEN_KEEPALIVE
void freeJSONResult(char* ptr) {
    free(ptr);
}
```

### 编译C代码为WASM的详细步骤

#### 1. 安装Emscripten工具链

如果尚未安装Emscripten，请按照以下步骤安装（在VS Code终端或系统终端中执行）：
- Linux
```bash
# 克隆Emscripten仓库
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# 安装最新版本
./emsdk install latest

# 激活最新版本
./emsdk activate latest

# 应用环境变量
source ./emsdk_env.sh
```
- Windows
```bash
# 应用环境变量
.\emsdk_env.bat
```
#### 2. 编译C代码为WASM模块

在包含`command_parser.c`的目录中执行以下命令：

```bash
emcc command_parse.c -o nlp-parser.js -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME="createNlpParserModule" -s EXPORTED_FUNCTIONS='["_parseCommandAndReturnJSON", "_freeJSONResult"]' -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "allocate", "UTF8ToString", "stringToUTF8"]' --no-entry -O3
```

#### 3. 编译成功后会生成两个文件：
- `nlp-parser.wasm`：WebAssembly模块
- `nlp-parser.js`：JavaScript包装器和加载代码

### 更新JavaScript代码以集成WASM模块

#### 修改后的`parseCommand`函数：

```javascript
// 全局变量存储WASM模块实例
let nlpParserModule;

// 初始化WASM模块
async function initWasmModule() {
    if (!nlpParserModule) {
        // 加载WASM模块
        const module = await import('./nlp-parser.js');
        nlpParserModule = await module.createNlpParserModule({
            // 可以在这里传递配置参数
        });
    }
    return nlpParserModule;
}

// 与WASM模块交互的函数
async function parseCommand(text) {
    try {
        await initWasmModule();
        
        // 获取WASM导出的函数
        const parseCommandC = nlpParserModule.cwrap(
            'parseCommandAndReturnJSON',  // C函数名
            'string',                     // 返回类型
            ['string']                    // 参数类型
        );
        
        // 调用C函数解析命令
        const jsonResult = parseCommandC(text);
        if (!jsonResult) {
            throw new Error('WASM解析返回空结果');
        }
        
        // 解析JSON结果
        const command = JSON.parse(jsonResult);
        
        // 释放WASM分配的内存
        nlpParserModule._freeJSONResult(jsonResult);
        
        return command;
    } catch (error) {
        console.error('命令解析失败:', error);
        throw new Error(`解析错误: ${error.message}`);
    }
}
```

### 完整集成流程总结

1. **项目结构**：
   ```
   your-project/
   ├── index.html
   ├── app.js
   ├── command_parser.c
   ├── nlp-parser.js       # 编译生成的JS包装器
   └── nlp-parser.wasm     # 编译生成的WASM模块
   ```

2. **HTML文件中加载WASM模块**：
   ```html
   <script type="module">
       import init from './nlp-parser.js';
       // 可以在页面加载时初始化，或在需要时调用initWasmModule()
   </script>
   ```

3. **树莓派API适配**：
   ```javascript
   async function sendCommandToRaspberryPi(command) {
       try {
           // 使用WASM生成的gpioCommand
           const gpioCommand = command.gpioCommand;
           
           const response = await fetch('http://your-raspberry-pi-ip:5000/api/control', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                   command: gpioCommand
               })
           });
           
           return await response.json();
       } catch (error) {
           throw new Error(`发送指令失败: ${error.message}`);
       }
   }
   ```
### 实验结果
- 已正确通过 command_parse.c 生成 nlp-parse.js 和 nlp-parse.wasm
- 未解决：测试时显示createNlpParserModule不存在，即未能成功将nlp-parse.js中的函数导入。
  ```
   const createNlpParserModule = await import('./nlp-parser.js');
  ```
- 为检查程序其余部分是否出错，暂时将nlp-parse.js中的函数直接黏贴至app.js中。经检验，程序已可正确解析指令，并传输指令
