# raspberry_server.py
import json
from flask import Flask, request, jsonify
import RPi.GPIO as GPIO
import logging
from flask_cors import CORS
# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 初始化 GPIO
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)  # 使用 Broadcom SOC 的引脚编号

# GPIO 引脚配置（根据你的实际连接修改）
DEVICE_PINS = {
    "灯": 17,
    "空调": 18,
    "电视": 19
}

# 设置 GPIO 引脚为输出模式
for pin in DEVICE_PINS.values():
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)  # 初始状态为关闭

app = Flask(__name__)
CORS(app)
@app.route('/control', methods=['POST'])
def control_gpio():
    try:
        # 获取 JSON 数据
        data = request.get_json()
        logging.info(f"收到控制请求: {data}")
        
        # 检查必要字段
        if 'target' not in data or 'action' not in data or 'gpioCommand' not in data:
            return jsonify({"status": "error", "message": "缺少必要参数"}), 400
        
        target = data['target']
        action = data['action']
        gpio_command = data['gpioCommand']
        
        # 验证目标设备
        if target not in DEVICE_PINS:
            return jsonify({"status": "error", "message": f"不支持的设备: {target}"}), 400
        
        pin = DEVICE_PINS[target]
        
        # 执行 GPIO 控制
        if action == "打开":
            GPIO.output(pin, GPIO.HIGH)
            status = "on"
            response = f"{target} 已打开"
        elif action == "关闭":
            GPIO.output(pin, GPIO.LOW)
            status = "off"
            response = f"{target} 已关闭"
        else:
            return jsonify({"status": "error", "message": f"不支持的操作: {action}"}), 400
        
        # 日志记录
        logging.info(f"GPIO 控制成功: {target} -> {action}")
        
        # 返回成功响应
        return jsonify({
            "status": "success",
            "message": response,
            "device": target,
            "status": status,
            "gpioCommand": gpio_command
        })
    
    except Exception as e:
        logging.error(f"控制 GPIO 时出错: {str(e)}")
        return jsonify({"status": "error", "message": f"服务器错误: {str(e)}"}), 500

if __name__ == '__main__':
    try:
        logging.info("树莓派 GPIO 控制服务器已启动")
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        logging.info("服务器正在关闭...")
        GPIO.cleanup()  # 清理 GPIO 配置
        logging.info("GPIO 已清理，服务器已停止")
