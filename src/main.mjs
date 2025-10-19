
//import ws from 'ws';
import express from 'express';
import net from 'node:net';
import { styleText } from 'node:util';

import { GameInfo, GameSetting } from '../public/lib/info.mjs';

const _log = (...args) => {
  console.log(styleText('magenta', `${[...args]}`));
};


class Agent {
  static REQ_NAME = 'NAME';
  static REQ_ROLE = 'ROLE';

  static REQ_INITIALIZE = 'INITIALIZE';
  /** エージェントへ渡す req */
  static REQ_DAYI = 'DAILY_INITIALIZE';
  static REQ_DAYF = 'DAILY_FINISH';
  static REQ_FINISH = 'FINISH';
  static REQ_VOTE = 'VOTE';
  static REQ_ATTACK = 'ATTACK';
  static REQ_GUARD = 'GUARD';
  static REQ_DIVINE = 'DIVINE';
  static REQ_TALK = 'TALK';
  static REQ_WHISPER = 'WHISPER';

  constructor() {
    this.socket = null;
  }



}

class Server {
  constructor() {
    this.port = 3000;
    /** 元ポート */
    this.orgport = 10000;

    this.roundAgentNum = 15;
    this.agents = [];

    this.gameSetting = new GameSetting();
    this.gameInfo = new GameInfo();
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

      app.on('/', express.static('../public'));

      {
        const ws = null;
      }

      app.listen(this.port);
    }
  }

  /** TCP待ち受け */
  readySocket() {
    _log('readySocket');
    {
      const server = net.createServer((c) => {
        _log('socket create server', c.remotePort);
        let len = this.agents.length;
        if (len >= this.roundAgentNum) {
          // close する
          c.close();
          return;
        }

        c.on('data', data => {
          _log('on data', data);
        });
        c.on('end', () => {
          _log('client disconnect');
        });

        const a = new Agent();
        a.socket = c;
        this.agents.push(a);
        if (this.agents.length === this.roundAgentNum) {
          this.readyRound();
        }
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

  readyRound() {
    _log('readyRound');

    {
      for (const a of this.agents) {
        const obj = {
          request: Agent.REQ_NAME,
        };
        a.socket.write(`${JSON.stringify(obj)}\r\n`);
      }

      if (this.gameSetting.enableRoleRequest) {
        // エージェントに対して役職を問い合わせる
        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_ROLE,
          };
          a.socket.write(`${JSON.stringify(obj)}\r\n`);
        }
      } else {
        // 
        for (let i = 0; i < this.agents.length; ++i) {
          const v = this.agents[i];

        }
      }

      for (const a of this.agents) {
        const obj = {
          request: Agent.REQ_INITIALIZE,
          gameInfo: this.gameInfo,
          talkHistory: [],
          whisperHistory: [],
          gameSetting: this.gameSetting,
        };
        let str = `${JSON.stringify(obj)}\r\n`;
        a.socket.write(str);
        _log('initialize', str);
      }
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

