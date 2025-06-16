## 技术支持part2

要通过浏览器远程控制树莓派并结合语音识别，首先需要将树莓派的服务暴露到网络上，以下为从官方搜索到的推荐方案，并结合我们现有的实际情况进行调整。

#### 准备

我们已经从老师处获得了树莓派第三代的实物，首先需要了解一下概念。什么是暴露在互联网上？简单来说，就是让树莓派从局域网变成可以通过互联网从任何地方访问到：比如在家里的树莓派上跑了个远程控制程序，暴露到网络上后，我可以在学校用手机或电脑就能连接上它，就像访问百度一样。

需要完成这个操作的话，可以使用Rasberry Pi Connect通过官方服务器帮助我们“打通”家里和外面的网络$^{[1]}$。

此外，确保树莓派已连接互联网，并运行最新的 Raspberry Pi OS，然后创建一个 Raspberry Pi ID 并启用双因素认证，访问 [connect.raspberrypi.com](https://connect.raspberrypi.com) 注册以增强安全。

##### 联网

我们获得的树莓派有内置WIFI(Raspberry Pi 3B+),可以连上学校的无线网络，连接后，可以在终端输入

```
ping www.baidu.com
```

来测试，如果能收到回复，则说明联网成功。

##### 安装Raspberry Pi OS

###### **获取最新系统**：

- 去官网 [raspberrypi.com/software/](https://www.raspberrypi.com/software/) 下载 Raspberry Pi Imager。
- 在电脑上装好 Imager，插上一个 microSD 卡。

###### **安装步骤**：

1. 打开 Raspberry Pi Imager，点“Choose OS”，选最新的 Raspberry Pi OS（通常是“Raspberry Pi OS with desktop”）。
2. 点“Choose Storage”，选你的 SD 卡。
3. 点“Write”开始写入，完成后会提示你。
4. 把 SD 卡插进树莓派，开机就自动启动新系统。

##### 创建Raspberry Pi ID

​    访问 [connect.raspberrypi.com](https://connect.raspberrypi.com)，点击“Sign up”，填入邮箱，密码，等待一段时间后会收到一封验证邮件。点击邮件里面的连接，验证成功即可拥有ID。

​    同时建议开启双因素认证(2FA)，提高安全性$^{[2]}$。

##### 关于终端

本次大作业倾向于拥有显示屏，当树莓派刚装好系统，接上显示器(HDMI线)，开机后桌面就会显示出来，点击屏幕的“终端”小标，就可以打开终端了。

树莓派是自配HDMI接口的，可以直接连接，如果条件宽裕的话或许还可以拥有鼠标和键盘！

#### 配置

打开终端，更新系统：

```
sudo apt update 
sudo apt full-upgrade
```

安装 Connect 软件（完整版支持屏幕共享，Lite 版仅支持远程 shell）：

```
sudo apt install rpi-connect
```

或

```
sudo apt install rpi-connect-lite
```

启用服务：

```
rpi-connect on
```

#### 连接到账户

1.在桌面菜单栏点击Connect图标，进行登录连接。

2.登录先前注册的Raspberry Pi ID，命名设备后点击“Create Device and Sign In”完成绑定。

#### 远程访问

访问 [connect.raspberrypi.com](https://connect.raspberrypi.com)，登录后选择我们自己的树莓派设备，点击“Connect via” > “Screen Sharing”，就会弹出一个窗口，显示树莓派的桌面，以通过浏览器控制桌面，或选择“Remote Shell”进行命令行访问$^{[3]}$。

这里具体解释一下：通过浏览器控制桌面指的是我们可以用一个网页浏览器远程看到并操作树莓派的桌面，我们可以点击图标，打开程序，输入文字，全都通过浏览器完成，不需要触碰树莓派；而浏览器说的是我们用来访问 [connect.raspberrypi.com](https://connect.raspberrypi.com) 的设备上的浏览器，通常是电脑（PC）、手机或平板上的浏览器，而不是树莓派内置的浏览器。

总结：远程访问是电脑PC上的浏览器通过网络和树莓派连接，控制方式为通过Connect网站，把树莓派桌面传到浏览器，我们操作后指令传回到树莓派$^{[4]}$。

#### 语音识别整合

Raspberry Pi Connect并不直接支持语音识别，因此需要额外配置：我们可以通过Web服务器整合Google Speech-to-Text 或 Mozilla DeepSpeech 与 Raspberry Pi Connect，实现语音识别功能$^{[5]}$。

##### 总体思路

Raspberry Pi Connect 本身只提供远程桌面或 shell 访问，不直接支持语音识别。要实现语音识别，我们需要大致根据如下思路进行整合：

1. 在树莓派上运行一个 Web 服务器（比如用 Flask 或 Node.js，这里由于现在组员都拥有python环境，而且与下文的 Google Speech-to-Text适配性好，所以我们选择Flask），用来接收音频输入并处理语音识别。
2. 安装并配置 Google Speech-to-Text 或 Mozilla DeepSpeech，作为语音识别的“引擎”，通过调查搜索，我们决定使用前者（支持多语言，只需要更改`language_code`）。
3. 通过 Raspberry Pi Connect 远程访问树莓派，调用 Web 服务器（是指在PC上控制树莓派上运行的Flask服务器）的接口，实现语音转文字。

##### 整合 Google Speech-to-Text

##### 步骤 1：设置 Google Cloud

1. 去 [Google Cloud Console](https://console.cloud.google.com/) 创建账户。

2. 创建一个项目，启用 “Speech-to-Text API”。

3. 生成 API 密钥（JSON 文件），下载到树莓派，比如放在 `/home/pi/google-credentials.json`。

4. 在树莓派终端设置环境变量：

   ```
   export GOOGLE_APPLICATION_CREDENTIALS="/home/pi/google-credentials.json"
   ```

##### 步骤 2：安装依赖

Flask获取与安装：

Flask是一个轻量级的Python Web 框架，用来创建 Web 服务器。

打开终端（可以用 Connect 的 Remote Shell 或接显示器），输入：

```
pip3 install flask
```

1. 更新系统：

   ```
   sudo apt update && sudo apt full-upgrade
   ```

2. 安装 Python 包：

   ```
   pip3 install google-cloud-speech pyaudio flask
   ```

   - `google-cloud-speech`：Google 的语音识别库。
   - `pyaudio`：录制麦克风音频。
   - `flask`：搭建 Web 服务器。

##### 步骤 3：编写 Web 服务器代码

创建一个 Python 文件，比如 app.py：

```python
from flask import Flask, request, jsonify
import speech_recognition as sr
from google.cloud import speech

app = Flask(__name__)

@app.route('/recognize', methods=['POST'])
def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("正在录音...")
        audio = recognizer.listen(source, timeout=5)
    
    try:
        # 使用 Google Speech-to-Text
        audio_data = audio.get_wav_data()
        client = speech.SpeechClient()
        content = audio_data
        audio_config = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="zh-CN"  # 可改为 "en-US" 等
        )
        response = client.recognize(config=config, audio=audio_config)
        text = response.results[0].alternatives[0].transcript
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

- 说明
  - 这个代码用 Flask 搭建一个 Web 服务器，监听 `/recognize` 接口。
  - 用麦克风录 5 秒音频，发送给 Google Speech-to-Text，返回文字。

##### 步骤 4：运行和测试

1. 启动服务器：

   ```
   python3 app.py
   ```

2. 通过 Raspberry Pi Connect 打开浏览器，访问

   `http://树莓派IP:5000/recognize`，或者用 `curl` 测试：

   ```
   curl -X POST http://树莓派IP:5000/recognize
   ```

   - 树莓派 IP 可以在终端用 `hostname -I` 查看。

3. 成功的话，会返回 JSON 格式的识别结果。

##### 网络设置

- 确保树莓派防火墙允许 5000 端口：

  ```
  sudo ufw allow 5000
  ```

- 如果在局域网外访问，需在路由器设置端口转发，或者用 Raspberry Pi Connect 的远程访问功能。

- 检查防火墙状态：

  ```
  sudo ufw status
  ```

##### 麦克风设置

我们还需要准备麦克风，推荐使用USB麦克风.

测试麦克风是否工作：

```
arecord -d 5 test.wav && aplay test.wav
```

#### 参考文档

[1]https://pidoc.cn/docs/services/connect/

[2]https://raspberrytips.com/security-tips-raspberry-pi/

[3]https://www.raspberrypi.com/documentation/computers/remote-access.html

[4]https://umatechnology.org/how-to-get-started-with-raspberry-pi-3-guide/

[5]https://picovoice.ai/blog/speech-recognition-on-raspberrypi/





