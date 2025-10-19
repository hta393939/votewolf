
//import ws from 'ws';
import express from 'express';
import net from 'node:net';
import { styleText } from 'node:util';

import { GameInfo, GameSetting } from '../public/lib/info.mjs';
import { RoleSet } from '../public/lib/char.js';

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
    this.resolveFunc = () => {};

    /** 表示名 */
    this.name = '';
    /** IDではなくインデックス */
    this.index = 0;

    this.idstr = '1';
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
    this.talkHistory = [];
    this.whisperHistory = [];
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
        let len = this.agents.length;
        _log('socket create server', c.remotePort, len, this.roundAgentNum);

        if (len >= this.roundAgentNum) {
          // close する
          c.close();
          return;
        }

        const a = new Agent();
        a.index = len;
        a.idstr = `${len + 1}`;

        c.on('data', data => {
          _log('on data', data);

          if (typeof a.resolveFunc === 'function') {
            a.resolveFunc(data);
            _log('resolving');
            a.resolveFunc = null;
            return;
          }
        });
        c.on('end', () => {
          _log('client disconnect');
        });

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

  /**
   * 
   * @param {Agent} agent 
   * @returns {Promise<any>}
   */
  reqres(agent, sendobj) {
    return new Promise((resolve, reject) => {
      agent.resolveFunc = resolve;

      const str = `${JSON.stringify(sendobj)}\r\n`;
      agent.socket.write(str);
    });
  }

  async req(agent, sendobj) {
    const str = `${JSON.stringify(sendobj)}\r\n`;
    agent.socket.write(str);
    return null;
  }

  async readyRound() {
    _log('readyRound');

    this.talkHistory = [];
    this.whisperHistory = [];

    {
      if (this.gameSetting.enableRoleRequest) {
        // エージェントに対して役職を問い合わせる
        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_ROLE,
          };
          const res = await this.reqres(a, obj);
          _log('suc', res);
        }
      } else {
        // 役職の設定
        for (let i = 0; i < this.agents.length; ++i) {
          const v = this.agents[i];

          this.gameInfo.roleMap[v.idstr] = 'VILLAGER';
        }
/*
        const roleset = new RoleSet();
        for (const role of roleset.roles) {
          for (let i = 0; i < role.num; ++i) {

          }
        } */

      }

      for (const a of this.agents) {
        const obj = {
          request: Agent.REQ_NAME,
        };
        const res = await this.reqres(a, obj);
        _log('suc NAME', res);
      }

      for (const a of this.agents) {
        // py 3.12.3 でパースするとき talkHistory は Optional 宣言だが
        // KeyError が出る。
        const obj = {
          request: Agent.REQ_INITIALIZE,
          gameInfo: this.gameInfo,
          talkHistory: this.talkHistory,
          whisperHistory: this.whisperHistory,
          gameSetting: this.gameSetting,
        };
        obj.gameInfo.agent = a.index;
        await this.req(a, obj);

        //const res = await this.reqres(a, obj);
        //_log('success init', res);
      }

      for (let i = 0; i <= 10; ++i) {

        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_DAYI,
            gameInfo: this.gameInfo,
            talkHistory: this.talkHistory,
            whisperHistory: this.whisperHistory,
            gameSetting: this.gameSetting,
          };
          obj.gameInfo.day = i;
          obj.gameInfo.agent = a.index;
          await this.req(a, obj);
          _log('daily_initialize');
        }

        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_VOTE,
            gameInfo: this.gameInfo,
            talkHistory: this.talkHistory,
            whisperHistory: this.whisperHistory,
            gameSetting: this.gameSetting,
          };
          obj.gameInfo.day = i;
          obj.gameInfo.agent = a.index;
          const res = await this.reqres(a, obj);
          _log('vote', a.index, res);       
        }

        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_DAYF,
            gameInfo: this.gameInfo,
            talkHistory: this.talkHistory,
            whisperHistory: this.whisperHistory,
            gameSetting: this.gameSetting,
          };
          obj.gameInfo.agent = a.index;
          await this.req(a, obj);
          _log('daily_finish');
        }
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

