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
