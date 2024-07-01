const cv = require('opencv4nodejs');
const net = require('net');
const base64 = require('base64-arraybuffer');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const os = require('os');

class ServerSocket {
  constructor(ip, port) {
    this.TCP_IP = ip;
    this.TCP_PORT = port;
    this.createImageDir();
    this.folder_num = 0;
    this.socketOpen();
    this.receiveImages();
  }

  socketClose() {
    if (this.conn) this.conn.end();
    console.log(`Server socket [ TCP_IP: ${this.TCP_IP}, TCP_PORT: ${this.TCP_PORT} ] is close`);
  }

  socketOpen() {
    this.sock = net.createServer((conn) => {
      this.conn = conn;
      console.log(`Server socket [ TCP_IP: ${this.TCP_IP}, TCP_PORT: ${this.TCP_PORT} ] is connected with client`);
      this.receiveImages();
    }).listen(this.TCP_PORT, this.TCP_IP, () => {
      console.log(`Server socket [ TCP_IP: ${this.TCP_IP}, TCP_PORT: ${this.TCP_PORT} ] is open`);
    });
  }

  async receiveImages() {
    let cnt_str = '';
    let cnt = 0;
    let startTime;

    try {
      while (true) {
        cnt_str = cnt.toString().padStart(4, '0');
        if (cnt === 0) startTime = new Date();

        cnt += 1;

        let length = await this.recvall(this.conn, 64);
        let length1 = parseInt(length.toString('utf-8').trim(), 10);

        let stringData = await this.recvall(this.conn, length1);
        let stime = await this.recvall(this.conn, 64);

        console.log('send time: ' + stime.toString('utf-8'));
        console.log('receive time: ' + new Date().toISOString());

        let data = Buffer.from(base64.decode(stringData.toString('utf-8')));
        let decimg = cv.imdecode(data);

        cv.imshow('image', decimg);
        cv.imwrite(path.join(__dirname, `${this.TCP_PORT}_images${this.folder_num}`, `img${cnt_str}.jpg`), decimg);
        cv.waitKey(1);

        if (cnt === 60 * 10) {
          cnt = 0;
          this.convertImage(this.folder_num.toString(), 600, startTime);
          this.folder_num = (this.folder_num + 1) % 2;
        }
      }
    } catch (e) {
      console.error(e);
      this.convertImage(this.folder_num.toString(), cnt, startTime);
      this.socketClose();
      cv.destroyAllWindows();
      this.socketOpen();
    }
  }

  recvall(socket, length) {
    return new Promise((resolve, reject) => {
      let buffer = Buffer.alloc(0);
      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        if (buffer.length >= length) {
          socket.removeAllListeners('data');
          resolve(buffer.slice(0, length));
        }
      });
      socket.on('error', reject);
    });
  }

  convertImage(fnum, count, now) {
    let img_array = [];
    let cnt = 0;
    glob(`./${this.TCP_PORT}_images${fnum}/*.jpg`, (err, files) => {
      if (err) throw err;
      for (let filename of files) {
        if (cnt === count) break;
        cnt += 1;
        let img = cv.imread(filename);
        img_array.push(img);
      }

      let file_date = this.getDate(now);
      let file_time = this.getTime(now);
      let name = `video(${file_date} ${file_time}).mp4`;
      let file_path = path.join(__dirname, 'videos', name);
      let size = new cv.Size(img_array[0].cols, img_array[0].rows);
      let out = new cv.VideoWriter(file_path, cv.VideoWriter.fourcc('M', 'P', '4', 'V'), 20, size);

      img_array.forEach(img => out.write(img));
      out.release();
      console.log('complete');
    });
  }

  createImageDir() {
    for (let i = 0; i < 2; i++) {
      let folder_name = `${this.TCP_PORT}_images${i}`;
      if (!fs.existsSync(folder_name)) {
        fs.mkdirSync(folder_name);
      }
    }

    let folder_name = 'videos';
    if (!fs.existsSync(folder_name)) {
      fs.mkdirSync(folder_name);
    }
  }

  getDate(now) {
    let year = now.getFullYear();
    let month = (now.getMonth() + 1).toString().padStart(2, '0');
    let day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTime(now) {
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}_${minutes}_${seconds}`;
  }
}

function main() {
  new ServerSocket('localhost', 8080);
}

main();
