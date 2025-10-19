
import ws from 'ws';
import express from 'express';
import net from 'node:net';
import { styleText } from 'node:util';

const _log = (...args) => {
  console.log(styleText('bold', `${[...args]}`));
};

class Server {
  constructor() {
    this.port = 3000;
    /** 元ポート */
    this.orgport = 10000;
  }

  initialize() {
    _log('initilize');

    this.readySocket();
    this.readyServer();
  }

  readyServer() {
    _log('readyServer');
    {
      const app = express();

      const router = express.Router();
      _log('Router');

      app.on('/', router);
      app.listen(this.port);
    }
  }

  readyWS() {

  }

  /** TCP待ち受け */
  readySocket() {
    _log('readySocket');
    {
      const server = net.createServer((c) => {
        _log('socket create server');

        c.on('end', () => {
          _log('client disconnect');
        });

        _log('socket', c);
        //c.write('hello\r\n');
        //c.pipe(c);
      });
      server.on('error', (err) => {
        throw err;
      });
      server.listen(this.orgport, () => {
        _log('listen');
      });
      this.socket = server;
    }
  }

  /**
   * 
   * @param {string} line 
   */
  parseLine(line) {
    const re = /(?<front>[^\)\()]+)\((?<in>.+)\)(?<rear>[^\)\()]*)/;
    const m = re.exec(line);
    if (m) { // ()有り

    } else {
      // ()無し
    }

  }

}

const _main = async () => {
  const server = new Server();
  await server.initialize();
};

_main();

