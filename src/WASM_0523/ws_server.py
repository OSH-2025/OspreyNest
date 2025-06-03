# 文件保存为 ws_server.py
import asyncio
import websockets
import RPi.GPIO as GPIO
import json

# GPIO设置
GPIO.setmode(GPIO.BCM)
LED_PIN = 17  # 示例GPIO引脚
GPIO.setup(LED_PIN, GPIO.OUT)

async def handle_client(websocket, path):
    try:
        async for message in websocket:
            print(f"收到消息: {message}")
            
            try:
                data = json.loads(message)
                if data['target'] == '灯':
                    if data['action'] == '打开':
                        GPIO.output(LED_PIN, GPIO.HIGH)
                        response = {'status': 'success', 'message': '灯已打开'}
                    elif data['action'] == '关闭':
                        GPIO.output(LED_PIN, GPIO.LOW)
                        response = {'status': 'success', 'message': '灯已关闭'}
                    else:
                        response = {'status': 'error', 'message': '未知动作'}
                else:
                    response = {'status': 'error', 'message': '未知设备'}
                
                await websocket.send(json.dumps(response))
            except json.JSONDecodeError:
                await websocket.send(json.dumps({'status': 'error', 'message': '无效的JSON格式'}))
            except KeyError:
                await websocket.send(json.dumps({'status': 'error', 'message': '缺少必要字段'}))
                
    except websockets.exceptions.ConnectionClosed:
        print("客户端断开连接")

start_server = websockets.serve(handle_client, "0.0.0.0", 8765)

print("WebSocket服务器启动，等待连接...")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()