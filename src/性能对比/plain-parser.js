// plain-parser.js
// 纯 JavaScript 版本的指令解析器，与 WASM 版本保持相同的接口与返回数据结构
// 在浏览器中会挂载到 window.parseCommand；在 Node 环境中通过 module.exports 导出。

(function(global) {
  'use strict';

  /**
   * 将自然语言指令解析为 { action, target, gpioCommand } 对象。
   * @param {string} text 中文指令句子
   * @returns {{action:string,target:string,gpioCommand:string}|null}
   */
  function parseCommand(text) {
    if (!text || typeof text !== 'string') return null;

    // 预处理：去除标点符号、空白并转小写，便于匹配
    const cleanText = text.replace(/[。！？，、；：""''（）【】\s]/g, '').toLowerCase();

    // 创建一个帮助函数，减少重复代码
    const build = (action, target, gpio) => ({ action, target, gpioCommand: gpio });

    // 控制逻辑，与 command_parse.c 中保持一致
    if (cleanText.includes('开灯') || (cleanText.includes('打开') && cleanText.includes('灯'))) {
      return build('打开', '灯', 'gpio 17 high');
    }
    if (cleanText.includes('关灯') || (cleanText.includes('关闭') && cleanText.includes('灯'))) {
      return build('关闭', '灯', 'gpio 17 low');
    }
    if (cleanText.includes('开空调') || (cleanText.includes('打开') && cleanText.includes('空调'))) {
      return build('打开', '空调', 'gpio 18 high');
    }
    if (cleanText.includes('关空调') || (cleanText.includes('关闭') && cleanText.includes('空调'))) {
      return build('关闭', '空调', 'gpio 18 low');
    }
    if (cleanText.includes('开电视') || (cleanText.includes('打开') && cleanText.includes('电视'))) {
      return build('打开', '电视', 'gpio 19 high');
    }
    if (cleanText.includes('关电视') || (cleanText.includes('关闭') && cleanText.includes('电视'))) {
      return build('关闭', '电视', 'gpio 19 low');
    }

    // 未能识别指令时返回 null
    return null;
  }

  // Node.js 导出
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseCommand };
  }

  // 浏览器全局挂载
  if (typeof global === 'object') {
    global.parseCommand = parseCommand;
  }
})(typeof window !== 'undefined' ? window : global); 
