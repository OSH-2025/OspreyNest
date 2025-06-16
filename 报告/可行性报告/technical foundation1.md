### 实现流程

#### 概述

通过浏览器使用语音命令远程控制树莓派，利用 WebAssembly (WASM) 确保语音识别在不同浏览器中的兼容性。以下是实现流程的简要步骤：

- 在树莓派上设置一个服务器来接收和执行命令。
- 在浏览器中开发网页，使用 WASM 进行语音识别，将语音转为文本命令。
- 通过网络将命令发送到树莓派，执行相应的动作。

#### 准备工作

- 确保树莓派运行 64 位系统（如 Raspberry Pi OS），并安装必要的软件。
- 在浏览器端准备一个支持 WASM 的环境，大多数现代浏览器（如 Chrome、Firefox）都支持。

#### 开发步骤

1. **设置树莓派服务器**
   - 使用 Flask 创建一个简单的 HTTP 服务器，监听命令请求。例如，设置 /command 端点接收 POST 请求，处理如“打开灯”或“关闭灯”的命令。
   - 使用 RPi.GPIO 库控制硬件，如 GPIO 引脚，执行动作。
2. **浏览器端语音控制**
   - 开发一个 HTML 页面，使用 Web Audio API 访问麦克风捕获音频。
   - 集成 WASM 语音识别库，如 Vosk-browser，将语音转为文本。例如，识别“打开灯”后发送到树莓派。
   - 使用 Fetch API 或 WebSocket 将命令发送到树莓派的服务器。
3. **确保兼容性**
   - WASM 确保语音识别模块在不同浏览器中一致运行，减少兼容性问题。
   - 测试跨浏览器（如 Chrome、Edge）以确保功能正常。
4. **安全性和测试**
   - 添加身份验证（如 API 密钥）保护服务器，防止未经授权访问。
   - 测试整个流程，确保语音命令被正确识别并执行，检查网络延迟。

### 树莓派环境配置

1.**安装操作系统**[1]

- **下载和烧录操作系统**：
  - 从[Raspberry Pi Downloads](https://www.raspberrypi.com/software/)下载Raspberry Pi Imager，安装后插入MicroSD卡。
  - ![](C:\Users\86157\AppData\Roaming\marktext\images\2025-04-04-19-45-50-image.png)
  - 选择设备型号和操作系统（如Raspberry Pi OS），点击EDIT SETTINGS自定义：
    - 设置用户名、密码、Wi-Fi（SSID和密码）、主机名。
    - 启用SSH以便远程访问（可选择密码或公钥登录）。
  - 保存设置，确认写入，等待完成（可能需几分钟）。
- **首次启动**：
  - 将MicroSD卡插入树莓派，连接显示器、键盘鼠标（若需本地操作），然后接通电源。
  - 若已通过Imager设置，直接进入系统；否则，系统会启动配置向导：
    - 设置国家为中国，语言为简体中文，键盘布局为中文，连接Wi-Fi。
    - 选择浏览器（如Firefox或Chromium），启用Raspberry Pi Connect远程访问。
    - 更新软件（可能需几分钟），重启生效。

2.**开启SSH和配置WIFI**

SSH（安全外壳）是一种网络协议，允许通过网络远程访问和控制 Raspberry Pi，适合无头设置（无显示器、键盘、鼠标）。Wi-Fi 配置则确保 Raspberry Pi 能够无线连接互联网，方便家庭网络或远程项目。Raspberry Pi OS 默认禁用 SSH，为安全起见，需手动启用。Wi-Fi 配置则因模型和接口不同而有所变化。

**设置启用 SSH**

适合完全无显示器的场景，需在首次启动前配置：

- **创建 SSH 文件：** 插入 SD 卡到电脑，找到启动分区（通常为 FAT32 格式），创建空文件“ssh”（无扩展名，内容可为空）。
- **开机：** 插入 SD 卡到 Raspberry Pi，连接电源，开机后 SSH 自动启用。
- **登录**：打开本机putty，在其中输入树莓派IP地址，输入用户名密码，即可登录。

**设置配置 Wi-Fi**

需在首次启动前设置：

- **准备文件：** SD卡创建文件“wpa_supplicant.conf”，内容如下：
  
  ```
  country=CN
  ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
  update_config=1
  network={
     ssid="我们的Wi-Fi名称"
     psk="我们的Wi-Fi密码"
     priority=10 
  }
  ```

- **查找 IP 地址**:   使树莓派连接电脑热点，查找电脑已连接设备，即可找到其IP地址。

**VScode远程链接**[2]

打开VScode，安装remote - SSH。按F1按键，选择Remote-SSH:Connect to Host。输入好user@ip地址后，按回车键，即可连接。

3.**配置与更换国内源**[3]

因为树莓派的官方源在国外，在国内访问速度慢或者无法访问，因此要进行换源设置。

```tex
sudo sed \
  -e 's|http://archive.raspberrypi.org|http://mirrors.ustc.edu.cn/raspberrypi|g' \
  -e 's|http://archive.raspberrypi.com|http://mirrors.ustc.edu.cn/raspberrypi|g' \
  -i.bak \
  /etc/apt/sources.list.d/raspi.list
```

换源完毕后，输入：

```text
sudo apt update && apt upgrade
```

参考文献：

[1][Raspberry Pi Getting Started](https://pidoc.cn/docs/computers/getting-started/)

[2][树莓派VS Code远程连接](https://zhuanlan.zhihu.com/p/709278284)

[3][Raspberrypi - USTC Mirror Help](https://mirrors.ustc.edu.cn/help/raspberrypi.html)
