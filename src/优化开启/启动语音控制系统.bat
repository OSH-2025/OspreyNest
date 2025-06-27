@echo off
chcp 65001 >nul
title 🎙️ 智能语音控制系统启动器

echo.
echo ====================================================================
echo                    🎙️ 智能语音控制系统启动器
echo ====================================================================
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Python，请先安装Python 3.7+
    echo 📥 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查必要文件
if not exist "index.html" (
    echo ❌ 错误：未找到index.html文件
    echo 📁 请确保在正确的目录中运行此脚本
    pause
    exit /b 1
)

if not exist "nlp-parser.js" (
    echo ❌ 错误：未找到nlp-parser.js文件
    echo 📁 请确保WASM模块文件存在
    pause
    exit /b 1
)

echo ✅ 检查完成，所有必要文件已找到
echo.

:: 显示选项菜单
echo 🔧 请选择启动模式：
echo.
echo   1. 🚀 启动HTTPS服务器 (推荐，解决语音识别限制)
echo   2. 🌐 启动HTTP服务器  (简单，但功能可能受限)
echo   3. 📱 启动桌面应用程序 (GUI界面)
echo   4. ⚙️  安装依赖库 (首次使用请选择此项)
echo   5. ❓ 帮助信息
echo   6. 🔧 清理端口占用 (解决端口冲突)
echo   7. 🔒 安装本地证书 (减少浏览器安全警告)
echo   0. 🚪 退出
echo.

echo 💡 提示：如需快速启动，请使用 "快速启动.bat"
echo.
set /p choice="请输入选项 (1-7，默认1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" goto start_https
if "%choice%"=="2" goto start_http
if "%choice%"=="3" goto start_gui
if "%choice%"=="4" goto install_deps
if "%choice%"=="5" goto show_help
if "%choice%"=="6" goto clean_ports
if "%choice%"=="7" goto install_cert
if "%choice%"=="0" goto exit_script

echo ❌ 无效选项，请重新运行
pause
exit /b 1

:start_https
echo.
echo 🚀 启动HTTPS服务器...
echo 🔐 将自动生成SSL证书以解决浏览器安全限制
echo ⚠️  首次访问时请在浏览器中接受安全警告
echo.

:: 检查并清理端口占用
echo 🔍 检查端口占用情况...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8443') do (
    echo 📍 发现8443端口被进程 %%a 占用，正在清理...
    taskkill /PID %%a /F >nul 2>&1
)

python start-https-server.py https
goto end

:start_http
echo.
echo 🌐 启动HTTP服务器...
echo ⚠️  注意：HTTP模式下语音识别功能可能受限
echo 💡 建议使用Chrome浏览器访问localhost
echo.

:: 检查并清理端口占用
echo 🔍 检查端口占用情况...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo 📍 发现8000端口被进程 %%a 占用，正在清理...
    taskkill /PID %%a /F >nul 2>&1
)

python -m http.server 8000
goto end

:start_gui
echo.
echo 📱 启动桌面应用程序...
echo 🖥️  将打开图形界面控制面板
echo.
python voice-control-app.py
goto end

:install_deps
echo.
echo ⚙️  安装依赖库...
echo.
echo 正在安装cryptography (用于HTTPS证书生成)...
pip install cryptography
echo.
echo 正在安装pywebview (用于桌面应用内嵌浏览器，可选)...
pip install pywebview
echo.
echo ✅ 依赖库安装完成！
echo 💡 现在可以选择其他启动模式
echo.
pause
goto start

:show_help
echo.
echo ====================================================================
echo                         📖 使用帮助
echo ====================================================================
echo.
echo 🎙️ 智能语音控制系统使用指南：
echo.
echo 📋 系统要求：
echo    • Python 3.7+ (必需)
echo    • Chrome 或 Edge 浏览器 (推荐)
echo    • 麦克风设备
echo.
echo 🔧 启动模式说明：
echo.
echo   1️⃣ HTTPS服务器模式 (推荐)
echo      • 自动生成SSL证书
echo      • 完全支持语音识别API
echo      • 浏览器地址：https://localhost:8443
echo      • 首次访问时需要接受安全警告
echo.
echo   2️⃣ HTTP服务器模式
echo      • 无需证书，启动快速
echo      • 语音识别功能可能受限
echo      • 浏览器地址：http://localhost:8000
echo      • 仅建议测试使用
echo.
echo   3️⃣ 桌面应用程序模式
echo      • 图形界面控制面板
echo      • 可选内嵌浏览器
echo      • 服务器管理更方便
echo.
echo 🎤 语音控制使用方法：
echo    1. 打开系统后，点击"开始语音唤醒"
echo    2. 说"小欧小欧"唤醒系统
echo    3. 听到提示音后，说出控制指令：
echo       • "开灯" / "关灯"
echo       • "开空调" / "关空调"  
echo       • "开电视" / "关电视"
echo.
echo 🔧 故障排除：
echo    • 如果语音识别不工作，请确保使用HTTPS模式
echo    • 如果浏览器提示不安全，请点击"高级"→"继续访问"
echo    • 如果端口被占用，请关闭其他服务器程序
echo.
echo ====================================================================
echo.
pause
goto start

:clean_ports
echo.
echo 🔧 清理端口占用...
echo 🔍 正在检查并清理语音控制系统相关端口...
echo.

:: 清理8443端口
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8443 2^>nul') do (
    echo 📍 清理8443端口进程 %%a
    taskkill /PID %%a /F >nul 2>&1
)

:: 清理8000端口
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 2^>nul') do (
    echo 📍 清理8000端口进程 %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo ✅ 端口清理完成！
echo 💡 现在可以正常启动服务器了
echo.
pause
goto start

:install_cert
echo.
echo 🔒 安装本地证书...
echo 💡 这将减少浏览器安全警告（需要管理员权限）
echo.

:: 检查证书文件
if not exist "server.crt" (
    echo ❌ 未找到证书文件，请先启动服务器生成证书
    pause
    goto start
)

:: 检查管理员权限
net session >nul 2>&1
if errorlevel 1 (
    echo ❌ 需要管理员权限
    echo 📝 请右键点击 "install-local-cert.bat" 选择"以管理员身份运行"
    pause
    goto start
)

echo 🔐 正在安装证书...
certutil -addstore -f "Root" "server.crt" >nul 2>&1
if errorlevel 0 (
    echo ✅ 证书安装成功！
    echo 💡 重启浏览器后安全警告会减少
) else (
    echo ❌ 证书安装失败，但不影响使用
)

echo.
pause
goto start

:exit_script
echo.
echo 👋 感谢使用智能语音控制系统！
exit /b 0

:end
echo.
echo 🛑 服务器已停止
pause

:start
cls
goto :eof 