const net = require('net');

// TCP 클라이언트 생성 및 서버에 연결
const client = net.createConnection({ port: 8111 }, () => {
    console.log('server conneted.');

    // 서버로 데이터 전송
    client.write('hello server!');
});

// 서버로부터 데이터 수신
client.on('data', (data) => {
    console.log(`data received from server : ${data}`);
    
    // 데이터 수신 후 연결 종료
    // client.end();
});

// 연결 종료
client.on('end', () => {
    console.log('connection closed server.');
});

// 에러 처리
client.on('error', (err) => {
    console.error(`error occured: ${err}`);
});