import cv2
import numpy as np
import base64

resize_frame = cv2.imread('input.jpg')
resize_frame = cv2.resize(resize_frame, (380, 260))

encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
result, imgencode = cv2.imencode('.jpg', resize_frame, encode_param)
data = np.array(imgencode)
stringData = base64.b64encode(data).decode('utf-8')

print(stringData)

