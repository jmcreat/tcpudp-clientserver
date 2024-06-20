const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const message = Buffer.from('hi server!');

// 서버로 메시지 전송
client.send(message, 8112, 'localhost', (err) => {
  if (err) {
    console.error(`client error: ${err.message}`);
    client.close();
  } else {
    console.log('message send server.');
  }
});

client.on('message', (msg, rinfo) => {
  console.log(`server received message: ${msg}`);
  client.close();
});

client.on('error', (err) => {
  console.error(`client error: ${err.stack}`);
  client.close();
});