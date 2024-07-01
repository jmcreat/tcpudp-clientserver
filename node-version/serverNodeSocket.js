const net = require('net');
const fs = require('fs');
const path = require('path');

// 현재 날짜를 YYYYMMDD 형식으로 반환하는 함수
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 로그 파일에 메시지를 기록하는 함수
function logMessage(message) {
    const logFileName = `log_${getCurrentDate()}.txt`;
    const logFilePath = path.join(__dirname, logFileName);
    fs.appendFile(logFilePath, message + '\n', (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}

// 데이터를 완전히 읽어들이는 함수
function recvall(socket, count, callback) {
    let buf = Buffer.alloc(0);

    function onData(data) {
        buf = Buffer.concat([buf, data]);
        count -= data.length;

        if (count <= 0) {
            socket.removeListener('data', onData);
            callback(null, buf);
        }
    }

    socket.on('data', onData);
}

// TCP 서버 설정
const server = net.createServer((socket) => {
    console.log('Client connected');
    logMessage('Client connected');

    let expectedLength = null;
    let receivedLength = 0;
    let imageChunks = '';

    // 길이를 먼저 받는다.
    recvall(socket, 64, (err, lengthBuffer) => {
        if (err) {
            console.error('Error receiving length:', err);
            logMessage(`Error receiving length: ${err.message}`);
            return;
        }

        expectedLength = parseInt(lengthBuffer.toString('utf-8').trim());
        console.log(`Expected data length: ${expectedLength}`);
        logMessage(`Expected data length: ${expectedLength}`);

        // 나머지 데이터 받기
        recvall(socket, expectedLength, (err, dataBuffer) => {
            if (err) {
                console.error('Error receiving image data:', err);
                logMessage(`Error receiving image data: ${err.message}`);
                return;
            }

            imageChunks += dataBuffer.toString('utf-8'); // base64로 인코딩된 문자열을 그대로 추가
            receivedLength += dataBuffer.length;

            console.log(`Received chunk: ${dataBuffer.length} bytes`);
            logMessage(`Received chunk: ${dataBuffer.length} bytes`);

            if (receivedLength >= expectedLength) {
                const buffer = Buffer.from(imageChunks, 'base64'); // base64로 디코딩
                const imageFileName = `output_image_${getCurrentDate()}.jpg`;

                fs.writeFile(imageFileName, buffer, (err) => {
                    if (err) {
                        console.error('Error saving image:', err);
                        logMessage(`Error saving image: ${err.message}`);
                    } else {
                        console.log(`Image saved to ${imageFileName}`);
                        logMessage(`Image saved to ${imageFileName}`);
                    }
                });

                // 초기화
                expectedLength = null;
                receivedLength = 0;
                imageChunks = '';
            }
        });
    });

    socket.on('end', () => {
        console.log('Client disconnected');
        logMessage('Client disconnected');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err);
        logMessage(`Socket error: ${err.message}`);
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    logMessage(`Server listening on port ${PORT}`);
});