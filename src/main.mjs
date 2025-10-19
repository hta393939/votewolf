
import * from 'ws';
import * from 'express';
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
      const router = express.router();

      const server = express.app();
      server.listen(this.port);
    }
  }

  readyWS() {

  }

  /** TCP待ち受け */
  readySocket() {
    _log('readySocket');
    {
      const socket = socket('0.0.0.0', this.orgport);

      this.socket = socket;
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

