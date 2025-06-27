#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能语音控制系统 - 本地HTTPS服务器启动器
解决浏览器语音识别API的安全限制问题
"""

import http.server
import ssl
import socketserver
import os
import sys
import subprocess
import webbrowser
from pathlib import Path

def generate_self_signed_cert():
    """生成自签名证书"""
    cert_file = "server.crt"
    key_file = "server.key"
    
    # 检查证书是否已存在
    if os.path.exists(cert_file) and os.path.exists(key_file):
        print("📜 发现现有证书文件")
        return cert_file, key_file
    
    print("🔐 生成自签名证书...")
    
    try:
        # 使用openssl生成证书
        cmd = [
            "openssl", "req", "-x509", "-newkey", "rsa:4096", 
            "-keyout", key_file, "-out", cert_file, "-days", "365", 
            "-nodes", "-subj", "/C=CN/ST=Local/L=Local/O=Voice Control/CN=localhost"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        print("✅ 证书生成成功")
        return cert_file, key_file
    except subprocess.CalledProcessError:
        print("❌ openssl命令失败，尝试Python方式生成证书...")
        return generate_cert_with_python()
    except FileNotFoundError:
        print("❌ 未找到openssl，尝试Python方式生成证书...")
        return generate_cert_with_python()

def generate_cert_with_python():
    """使用Python的cryptography库生成证书"""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        import ipaddress
        
        # 生成私钥
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # 生成证书
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "CN"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Local"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Local"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Voice Control"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.now(datetime.UTC)
        ).not_valid_after(
            datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.DNSName("*.localhost"),
                x509.DNSName("127.0.0.1"),
                x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                x509.IPAddress(ipaddress.IPv6Address("::1")),
            ]),
            critical=False,
        ).add_extension(
            x509.KeyUsage(
                key_encipherment=True,
                digital_signature=True,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.ExtendedKeyUsage([
                x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
            ]),
            critical=True,
        ).sign(private_key, hashes.SHA256())
        
        # 保存证书
        with open("server.crt", "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        # 保存私钥
        with open("server.key", "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        print("✅ Python证书生成成功")
        return "server.crt", "server.key"
        
    except ImportError:
        print("❌ 需要安装cryptography库：pip install cryptography")
        print("⚠️  将使用HTTP服务器（功能受限）")
        return None, None

def start_https_server(port=8443):
    """启动HTTPS服务器"""
    cert_file, key_file = generate_self_signed_cert()
    
    if not cert_file or not key_file:
        print("⚠️  无法生成证书，启动HTTP服务器...")
        start_http_server(8000)
        return
    
    class HTTPSHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # 添加CORS头部
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
        
        def log_message(self, format, *args):
            # 自定义日志格式
            print(f"🌐 {self.address_string()} - {format % args}")
    
    try:
        with socketserver.TCPServer(("", port), HTTPSHandler) as httpd:
            # 配置SSL
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(cert_file, key_file)
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            
            print(f"🚀 智能语音控制系统 HTTPS服务器启动")
            print(f"📍 服务器地址: https://localhost:{port}")
            print(f"📁 服务目录: {os.getcwd()}")
            print(f"🔐 使用自签名证书: {cert_file}")
            print(f"💡 首次访问时，请在浏览器中接受安全警告")
            print(f"⚠️  如果浏览器提示不安全，请点击'高级'→'继续访问'")
            print(f"🎙️ 语音识别功能将在HTTPS下正常工作")
            print(f"⏹️  按 Ctrl+C 停止服务器")
            print("-" * 60)
            
            # 自动打开浏览器
            url = f"https://localhost:{port}"
            print(f"🌐 正在打开浏览器...")
            try:
                webbrowser.open(url)
                print(f"✅ 浏览器已打开: {url}")
            except Exception as e:
                print(f"❌ 无法自动打开浏览器: {e}")
                print(f"📝 请手动访问: {url}")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    except Exception as e:
        print(f"❌ HTTPS服务器启动失败: {e}")
        print("⚠️  尝试启动HTTP服务器...")
        start_http_server(8000)

def start_http_server(port=8000):
    """启动HTTP服务器（备用方案）"""
    class HTTPHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
        
        def log_message(self, format, *args):
            print(f"🌐 {self.address_string()} - {format % args}")
    
    try:
        with socketserver.TCPServer(("", port), HTTPHandler) as httpd:
            print(f"🚀 智能语音控制系统 HTTP服务器启动")
            print(f"📍 服务器地址: http://localhost:{port}")
            print(f"📁 服务目录: {os.getcwd()}")
            print(f"⚠️  注意：HTTP模式下语音识别可能受限")
            print(f"💡 建议使用Chrome浏览器的localhost例外")
            print(f"⏹️  按 Ctrl+C 停止服务器")
            print("-" * 60)
            
            # 自动打开浏览器
            url = f"http://localhost:{port}"
            try:
                webbrowser.open(url)
                print(f"✅ 浏览器已打开: {url}")
            except Exception as e:
                print(f"❌ 无法自动打开浏览器: {e}")
                print(f"📝 请手动访问: {url}")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    except Exception as e:
        print(f"❌ HTTP服务器启动失败: {e}")

def main():
    print("🎙️ 智能语音控制系统 - 本地服务器启动器")
    print("=" * 60)
    
    # 检查是否在正确目录
    if not os.path.exists("index.html"):
        print("❌ 未找到index.html文件")
        print("📁 请确保在语音控制系统目录中运行此脚本")
        sys.exit(1)
    
    # 检查命令行参数
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
        if mode in ['https', '1']:
            start_https_server()
            return
        elif mode in ['http', '2']:
            start_http_server()
            return
        elif mode in ['auto', '3']:
            start_https_server()
            return
        elif mode in ['quick', 'fast']:
            # 快速启动模式，直接启动HTTPS
            start_https_server()
            return
    
    # 提供选择
    print("🔧 选择服务器模式:")
    print("1. HTTPS服务器 (推荐，解决语音识别限制)")
    print("2. HTTP服务器 (简单，但可能有功能限制)")
    print("3. 自动选择 (优先HTTPS)")
    
    choice = input("\n请选择 (1/2/3，默认3): ").strip()
    
    if choice == "1":
        start_https_server()
    elif choice == "2":
        start_http_server()
    else:
        # 自动选择，优先HTTPS
        print("🤖 自动选择模式，优先尝试HTTPS...")
        start_https_server()

if __name__ == "__main__":
    main() 
