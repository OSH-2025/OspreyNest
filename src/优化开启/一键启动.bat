@echo off
chcp 65001 >nul
title 🎙️ 语音控制系统

:: 自动清理端口
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8443 2^>nul') do taskkill /PID %%a /F >nul 2>&1

:: 启动提示
echo 🎙️ 正在启动智能语音控制系统...
echo 🌐 浏览器将自动打开，请接受安全警告后使用

:: 直接启动
python start-https-server.py quick 