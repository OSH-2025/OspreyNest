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
