const net = require('net');

// TCP 서버 생성
const server = net.createServer((socket) => {
    console.log('client connected.');
    // 데이터 수신
    socket.on('data', (data) => {
        console.log(`data accep to client: ${data}`);
        
        // 클라이언트에게 응답
        socket.write('data response success.');
    });

    // 연결 종료
    socket.on('end', () => {
        console.log('connection closed.');
    });

    // 에러 처리
    socket.on('error', (err) => {
        console.error(`error occured: ${err}`);
    });
});

// 서버가 8080 포트에서 대기하도록 설정
server.listen(8080, () => {
    console.log('TCP terver wait 8080 port.');
});