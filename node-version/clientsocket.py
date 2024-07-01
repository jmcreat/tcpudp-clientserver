import socket
import cv2
import numpy as np
import base64
import sys
from datetime import datetime
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, HTMLResponse
import uvicorn
from threading import Lock

import time

app = FastAPI()

# capture_flag = {'capture': False}
lock = Lock()
# width = 640
# height = 480

camera = cv2.VideoCapture(0)
# camera.set(cv2.CAP_PROP_FRAME_WIDTH, width)
# camera.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

class ClientSocket:
    def __init__(self, ip, port):
        self.TCP_SERVER_IP = ip
        self.TCP_SERVER_PORT = port
        self.connectCount = 0
        self.sock = None
        self.connectServer()

    def connectServer(self):
        try:
            self.sock = socket.socket()
            self.sock.connect((self.TCP_SERVER_IP, self.TCP_SERVER_PORT))
            print(f'Client socket is connected with Server socket [ TCP_SERVER_IP: {self.TCP_SERVER_IP}, TCP_SERVER_PORT: {self.TCP_SERVER_PORT} ]')
            self.connectCount = 0
        except Exception as e:
            print(e)
            self.connectCount += 1
            if self.connectCount == 10:
                print(f'Connect fail {self.connectCount} times. Exiting program.')
                sys.exit()
            print(f'{self.connectCount} times try to connect with server')
            self.connectServer()

    # def sendImages(self, frame):
    #     try:
    #         resize_frame = cv2.resize(frame, dsize=(640, 420), interpolation=cv2.INTER_AREA)
    #         stime = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')
    #
    #         encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    #         result, imgencode = cv2.imencode('.jpg', resize_frame, encode_param)
    #         data = np.array(imgencode)
    #         stringData = base64.b64encode(data)
    #         length = str(len(stringData))
    #         self.sock.sendall(length.encode('utf-8').ljust(64))
    #         self.sock.send(stringData)
    #         self.sock.send(stime.encode('utf-8').ljust(64))
    #         print('Image sent')
    #     except Exception as e:
    #         print(e)
    #         self.sock.close()
    #         self.connectServer()

    def sendImagesBig(self, frame):
        def split_string(string, chunk_size):
            return [string[i:i + chunk_size] for i in range(0, len(string), chunk_size)]
        try:
            resize_frame = cv2.resize(frame, dsize=(460, 300), interpolation=cv2.INTER_AREA)
            stime = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')

            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
            result, imgencode = cv2.imencode('.jpg', resize_frame, encode_param)
            data = np.array(imgencode)
            stringData = base64.b64encode(data)

            chunk_size = 10000
            chunks = split_string(stringData, chunk_size)
            length = str(len(stringData))
            print(length)


            for i, chunk in enumerate(chunks):
                print(f"Chunk {i + 1}: Length {len(chunk)}")
            # self.sock.send(len(chunks).encode('utf-8').ljust(64))
            # self.sock.send(str(len(stringData)).ljust(64).encode('utf-8'))
            self.sock.send(length.ljust(64).encode('utf-8'))
            time.sleep(1)
            for chunk in chunks:
                self.sock.send(chunk)
                print(chunk)
                time.sleep(1)

                # 각 청크를 처리 (여기서는 단순히 출력)

            # self.sock.send(stime.ljust(64).encode('utf-8'))
            # self.sock.send(stime.encode('utf-8').ljust(64))
            # self.sock.sendall(length.encode('utf-8').ljust(64))
            # self.sock.sendAll(stringData)
            # self.sock.send(stime.encode('utf-8').ljust(64))
            print('Image sent')
        except Exception as e:
            print(e)
            self.sock.close()
            self.connectServer()

    def stop(self):
        if self.sock:
            self.sock.close()

def gen_frames():
    while True:
        frame = get_frame()
        if frame is None:
            break
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    # camera.release()

def get_frame():
    # global capture_flag
    with lock:
        success, frame = camera.read()
        if not success:
            return None
        ret, buffer = cv2.imencode('.jpg', frame)
        # if capture_flag['capture']:
        #     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        #     cv2.imwrite(f"capture/capture_{timestamp}.jpg", frame)
        #
        #     capture_flag['capture'] = False
        return buffer.tobytes()

@app.get('/')
def index():
    content = """
    <html>
        <head>
            <title>Video Stream</title>
        </head>
        <body>
            <h1>Go to <a href='/video_feed'>/video_feed</a> to see the video stream.</h1>
            <h1>Go to <a href='/capture'>/capture</a> to capture an image.</h1>
        </body>
    </html>
    """
    return HTMLResponse(content=content)

@app.get('/video_feed')
def video_feed():
    return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

@app.get('/capture')
def capture():
    # global capture_flag
    # capture_flag['capture'] = True
    # client = ClientSocket('localhost', 8080)
    with lock:
        try:
            success, frame = camera.read()
            if success:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                cv2.imwrite(f"capture/capture_{timestamp}.jpg", frame)

                client.sendImagesBig(frame)


                # client.sendImagesBig(frame)
                # client.stop()
        except OSError as e:
            if e.errno != errno.EEXIST:
                print("Failed to create " + folder_name + " directory")
                raise
        return {"message": "Capture requested. Image will be saved and sent shortly."}

if __name__ == "__main__":
    client = ClientSocket('localhost', 8080)
    uvicorn.run(app, host='0.0.0.0', port=8000)
# uvicorn.run(app, host='0.0.0.0', port=8000, reload=True, workers=1)
