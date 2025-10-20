
//import ws from 'ws';
import express from 'express';
import net from 'node:net';
import { styleText } from 'node:util';

import { GameInfo, GameSetting, Role } from '../public/lib/info.mjs';
import { RoleSet } from '../public/lib/char.js';

const _log = (...args) => {
  console.log(styleText('magenta', `${[...args]}`));
};

const _warn = (...args) => {
  console.log(styleText('yellow', `${[...args]}`));
};


class Agent {
  static REQ_NAME = 'NAME';
  static REQ_ROLE = 'ROLE';

  static REQ_INITIALIZE = 'INITIALIZE';
  /** エージェントへ渡す req */
  static REQ_DAYINIT = 'DAILY_INITIALIZE';
  static REQ_DAYFIN = 'DAILY_FINISH';
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
    this.descname = '';
    /** IDではなくインデックス */
    this.index = 0;

    /** gameInfo はこちらかも */
    this.idnumber = 1;
    this.idstr = '1';

    this.skipCount = 0;
    this.isOver = false;
    this.agentStatus = RoleSet.AST_ALIVE;
    this.voteCount = 0;
    this.attackCount = 0;

    this.species = RoleSet.SPECIES_HUMAN;
  }
}

class Server {
  constructor() {
    this.port = 3000;
    /** 元ポート */
    this.orgport = 10000;

    this.roundAgentNum = 15;
    /** @type {Agent[]} */
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
        a.idnumber = len + 1;
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

  /**
   * 返事が無い送信
   * @param {Agent} agent 
   * @param {*} sendobj 
   * @returns {Promise<null>}
   */
  async req(agent, sendobj) {
    const str = `${JSON.stringify(sendobj)}\r\n`;
    agent.socket.write(str);
    return null;
  }

  /**
   * 
   * @param {string} role 
   * @returns 
   */
  getAgentsByRole(role) {
    return this.agents.filter(a => {
      if (a.role !== role) {
        return false;
      }
      if (a.agentStatus !== RoleSet.AST_ALIVE) {
        return false;
      }
      return true;
    });
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

          let role = Role.VILLAGER;
          if (i === 1) {
            //role = Role.WEREWOLF;
          }
          if (i === 2) {
            role = Role.BODYGUARD;
          }
          if (i === 3) {
            role = Role.SEER;
          }
          this.gameInfo.roleMap[v.idstr] = role;
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
        a.descname = res;
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
        obj.gameInfo.agent = a.idnumber;
        await this.req(a, obj);

        //const res = await this.reqres(a, obj);
        //_log('success init', res);
      }

      for (let i = 0; i <= 2; ++i) { // 日数

        for (const a of this.agents) {
          a.isOver = false;
          a.skipCount = 0;

          const obj = {
            request: Agent.REQ_DAYINIT,
            gameInfo: this.gameInfo,
            talkHistory: this.talkHistory,
            whisperHistory: this.whisperHistory,
            gameSetting: this.gameSetting,
          };
          obj.gameInfo.day = i;
          obj.gameInfo.agent = a.idnumber;
          await this.req(a, obj);
          _log('daily_initialize');
        }

        for (let j = 0; j < this.gameSetting.maxTalkTurn; ++j) {
          for (const a of this.agents) {
            if (a.isOver) {
              continue;
            }

            const obj = {
              request: Agent.REQ_TALK,
              gameInfo: this.gameInfo,
              talkHistory: this.talkHistory,
              whisperHistory: this.whisperHistory,
              gameSetting: this.gameSetting,
            };
            //obj.gameInfo.turn = j;
            obj.gameInfo.day = i;
            obj.gameInfo.agent = a.idnumber;
            const res = await this.reqres(a, obj);
            _log('talk ', j, res);

            if (res === 'Over') {
              a.isOver = true;
            } else if (res === 'Skip') {
              a.skipCount += 1;
              if (a.skipCount >= 3) {
                a.isOver = true;
              }
            }
          }
        }

        do {
          for (const a of this.agents) {
            a.voteCount = 0;
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
            obj.gameInfo.agent = a.idnumber;
            const res = await this.reqres(a, obj);
            _log('vote', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('vote obj', resobj);

              const agentIdx = resobj.agentIdx;
              const agent = this.agents[agentIdx];
              if (agent) {
                agent.voteCount += 1;
              } else {
                _warn('vote', resobj);
              }
            } catch (ec) {

            }
          }

          {
            /** @type {number[]} */
            let maxIndex = [];
            let maxCount = -1;
            for (let idx = 0; idx < this.agents.length; ++idx) {
              const a = this.agents[idx];
              if (a.agentStatus !== RoleSet.AST_ALIVE) {
                continue;
              }
              if (a.voteCount > maxCount) {
                maxCount = a.voteCount;
                maxIndex = [idx];
              } else if (a.voteCount === maxCount) {
                maxIndex.push(idx);
              }
            }

            if (maxIndex.length === 1) {
              const exeIndex = maxIndex[0];
              this.gameInfo.executedAgent = exeIndex;
              const agent = this.agents[exeIndex];
              if (agent) {
                agent.agentStatus = RoleSet.AST_DEAD;
              } else {
                _warn('execute', exeIndex);
              }
              break;
            }

            { // 同票有り
            }
          }

        } while (false);

        { // seer
          const chars = this.getAgentsByRole(Role.SEER);
          for (const a of chars) {
            const obj = {
              request: Agent.REQ_DIVINE,
              gameInfo: this.gameInfo,
              talkHistory: this.talkHistory,
              whisperHistory: this.whisperHistory,
              gameSetting: this.gameSetting,
            };
            obj.gameInfo.day = i;
            obj.gameInfo.agent = a.idnumber;
            const res = await this.reqres(a, obj);
            _log('divine', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('divine obj', resobj);
              const divineIndex = resobj.agentIdx;
              const agent = this.agents[divineIndex];
              if (agent) {
                const result = this.gameInfo.divineResult;
                result.day = i;
                result.target = divineIndex;
                result.agent = 0;
                result.result = agent.species;
              } else {
                _warn('divine', divineIndex);
              }
            } catch (ec) {

            }
          }
        }

        { // guard
          const chars = this.getAgentsByRole(Role.BODYGUARD);
          for (const a of chars) {
            const obj = {
              request: Agent.REQ_GUARD,
              gameInfo: this.gameInfo,
              talkHistory: this.talkHistory,
              whisperHistory: this.whisperHistory,
              gameSetting: this.gameSetting,
            };
            obj.gameInfo.day = i;
            obj.gameInfo.agent = a.idnumber;
            const res = await this.reqres(a, obj);
            _log('guard', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('guard obj', resobj);
              const agent = this.agents[resobj.agentIdx];
              if (agent) {
                this.gameInfo.guardedAgent = agent.idnumber;
              }
            } catch (ec) {

            }
          }
        }

        { // wolf
          for (const a of this.agents) {
            a.attackCount = 0;
          }

          const chars = this.getAgentsByRole(Role.WEREWOLF);
          for (const a of chars) {
            const obj = {
              request: Agent.REQ_ATTACK,
              gameInfo: this.gameInfo,
              talkHistory: this.talkHistory,
              whisperHistory: this.whisperHistory,
              gameSetting: this.gameSetting,
            };
            obj.gameInfo.day = i;
            obj.gameInfo.agent = a.idnumber;
            const res = await this.reqres(a, obj);
            _log('attack', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('attack obj', resobj);
            } catch (ec) {

            }
          }
        }

        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_DAYFIN,
            gameInfo: this.gameInfo,
            talkHistory: this.talkHistory,
            whisperHistory: this.whisperHistory,
            gameSetting: this.gameSetting,
          };
          obj.gameInfo.day = i;
          obj.gameInfo.agent = a.idnumber;
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

