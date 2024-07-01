import os
import socket
import cv2
import numpy as np
import base64
import threading
from datetime import datetime

class ServerSocket:
    def __init__(self, ip, port):
        self.TCP_IP = ip
        self.TCP_PORT = port
        self.createImageDir()
        self.socketOpen()
        self.receiveThread = threading.Thread(target=self.receiveImages)
        self.receiveThread.start()

    def socketClose(self):
        self.conn.close()
        self.sock.close()
        print(f'Server socket [ TCP_IP: {self.TCP_IP}, TCP_PORT: {self.TCP_PORT} ] is closed')

    def socketOpen(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.bind((self.TCP_IP, self.TCP_PORT))
        self.sock.listen(1)
        print(f'Server socket [ TCP_IP: {self.TCP_IP}, TCP_PORT: {self.TCP_PORT} ] is open')
        self.conn, self.addr = self.sock.accept()
        print(f'Server socket is connected with client [ TCP_IP: {self.TCP_IP}, TCP_PORT: {self.TCP_PORT} ]')

    def receiveImages(self):
        client_id = datetime.now().strftime('%Y%m%d_%H%M%S')
        try:
            while True:
                length = self.recvall(self.conn, 64)
                if not length:
                    break

                length = int(length.decode('utf-8').strip())
                print(f"Total length to receive from {client_id}: {length}")

                data = bytearray()
                while len(data) < length:
                    packet = self.recvall(self.conn, min(4096, length - len(data)))
                    if not packet:
                        break
                    data.extend(packet)

                if len(data) != length:
                    print(f"Received data length from {client_id} does not match expected length.")
                    continue

                string_data = base64.b64decode(data)
                img_data = np.frombuffer(string_data, dtype=np.uint8)
                img = cv2.imdecode(img_data, cv2.IMREAD_COLOR)

                # 이미지 저장
                filename = f'./serverlog/received_image_{client_id}.jpg'
                cv2.imwrite(filename, img)

                # 로그 기록
                log_path = f'./serverlog/{client_id}_log.txt'
                with open(log_path, 'a') as log_file:
                    log_file.write(f'length: {length}\n')
                    log_file.write(f'stringData: {string_data}\n')

        except Exception as e:
            print(e)
            self.socketClose()
            self.socketOpen()
            self.receiveThread = threading.Thread(target=self.receiveImages)
            self.receiveThread.start()

    def createImageDir(self):
        folder_name = "serverlog"
        os.makedirs(folder_name, exist_ok=True)

    def recvall(self, sock, count):
        buf = b''
        while count:
            newbuf = sock.recv(count)
            if not newbuf:
                return None
            buf += newbuf
            count -= len(newbuf)
        return buf

def main():
    server = ServerSocket('localhost', 8080)

if __name__ == "__main__":
    main()