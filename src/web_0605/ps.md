使用web-API仅支持少数浏览器，且手机端edge和chrome均无法通过http网址开启麦克风，被网址不安全限制。

尝试在树莓派端部署vosk语音识别，
```
source /home/OsperyNest/Desktop/web4/venv/bin/activate
pip install flask flask-cors numpy pydub speechrecognition
sudo apt install ffmpeg python3-rpi.gpio
```
因为树莓派不支持pip指令，故在虚拟机上执行
```
sudo apt install python3-venv python3-full ffmpeg
source /home/OsperyNest/Desktop/web4/venv/bin/activate
pip install flask flask-cors numpy pydub srt vosk RPi.GPIO -i https://pypi.tuna.tsinghua.edu.cn/simple
```

下载vosk模型
```
cd /home/OsperyNest/Desktop/web4
rm -rf vosk-model-small-cn
wget https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip
unzip vosk-model-small-cn-0.22.zip -d vosk-model-small-cn
```
更新app.py
```
MODEL_PATH = "/home/OsperyNest/Desktop/web4/vosk-model-small-cn-0.22"
```

运行服务器
```
cd /home/OsperyNest/Desktop/web4
source venv/bin/activate
python app.py
```

截至目前，树莓派只要运行这个就会崩溃，暂搁置

app.py
```
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import wave
import numpy as np
import json
from vosk import Model, KaldiRecognizer
import os
import RPi.GPIO as GPIO

app = Flask(__name__)
CORS(app)  # 允许跨域请求，处理网页和 API 端口不同的问题

# 初始化 Vosk 模型
MODEL_PATH = "/home/OsperyNest/Desktop/web4/vosk-model-small-cn/vosk-model-small-cn-0.22"  # 替换为你的 Vosk 模型路径
model = Model(MODEL_PATH)
recognizer = KaldiRecognizer(model, 16000)

# 初始化 GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO_PINS = {
    "灯": 17,
    "空调": 18,
    "电视": 19
}
for pin in GPIO_PINS.values():
    GPIO.setup(pin, GPIO.OUT, initial=GPIO.LOW)

# 提供静态文件
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# 语音识别端点
@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        # 获取上传的音频文件
        audio_file = request.files['audio']
        audio_data = audio_file.read()

        # 处理音频数据
        recognizer.AcceptWaveform(audio_data)
        result = recognizer.Result()
        text = json.loads(result).get("text", "")

        # 检查唤醒词
        clean_text = text.replace(' ', '').lower()
        if clean_text in ['小欧小欧', '小欧', 'xiaoou', 'xiao']:
            return jsonify({"status": "wake_detected", "text": text})
        else:
            return jsonify({"status": "success", "text": text})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# 设备控制端点
@app.route('/control', methods=['POST'])
def control_device():
    try:
        data = request.get_json()
        target = data.get('target')
        action = data.get('action')
        gpio_command = data.get('gpioCommand')

        if not target or not action or not gpio_command:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400

        pin = GPIO_PINS.get(target)
        if not pin:
            return jsonify({"status": "error", "message": "无效的设备"}), 400

        # 执行 GPIO 控制
        if action == '打开':
            GPIO.output(pin, GPIO.HIGH)
            status = 'on'
            message = f"{target}已打开"
        elif action == '关闭':
            GPIO.output(pin, GPIO.LOW)
            status = 'off'
            message = f"{target}已关闭"
        else:
            return jsonify({"status": "error", "message": "无效的动作"}), 400

        return jsonify({"status": "success", "device": target, "status": status, "message": message})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```
