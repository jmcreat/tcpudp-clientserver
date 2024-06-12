const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.error(`server error: ${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server data accepted: ${msg} from ${rinfo.address}:${rinfo.port}`);
  // 클라이언트에게 응답
  server.send('data receive success.', rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.error(`resonse error: ${err.message}`);
    }
  });
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server ${address.address}:${address.port} wait .`);
});

// 서버가 8080 포트에서 대기하도록 설정
server.bind(8112);