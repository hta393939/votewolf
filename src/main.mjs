
//import ws from 'ws';
import express from 'express';
import net from 'node:net';
import { styleText } from 'node:util';

import { GameInfo, GameSetting, Role, Status, Species, Judge } from '../public/lib/info.mjs';
import { RoleSet } from '../public/lib/char.js';

const _info = (...args) => {
  console.log(styleText(['white', 'bold'], `${[...args]}`));
};

const _log = (...args) => {
  console.log(styleText('magenta', `${[...args]}`));
};

const _warn = (...args) => {
  console.log(styleText('yellow', `${[...args]}`));
};

/**
 * 新しいオブジェクトを返す
 * @param {*} obj 
 * @returns 
 */
const _clone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
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
    this.rejectFunc = () => {};

    /** 表示名 */
    this.descname = '';
    /** IDではなくインデックス */
    this.index = 0;

    /** gameInfo はこちらかも */
    this.idnumber = 1;
    this.idstr = '1';

    this.skipCount = 0;
    this.isOver = false;
    this.agentStatus = Status.ALIVE;
    this.voteCount = 0;
    this.attackCount = 0;

    this.species = Species.HUMAN;
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
          try {
            /** @type {string} */
            let text = data.toString();
            if (text.includes('\n')) {
              text += 'lf';
            } else {
              text += 'no';
            }
            _log('on data text', text);
          } catch (ec) {
            _warn('on data catch', ec.message);
          }

          if (typeof a.resolveFunc === 'function') {
            a.resolveFunc(data);
            _log('resolving');
            a.resolveFunc = null;
            a.rejectFunc = null;
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
      agent.rejectFunc = reject;

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
   * 人間種は自分自身しかわからない
   * @param {GameInfo} obj 破壊
   * @param {string} idstr 
   * @returns 
   */
  ownOnly(obj, idstr) {
    const role = obj.roleMap[idstr];
    obj.roleMap = {[idstr]: role};
    return obj;
  }

  /**
   * 人狼以外のロールを削除する
   * @param {GameInfo} obj 破壊
   */
  wolfOnly(obj) {
    const ks = Object.keys(obj.roleMap);
    for (const k of ks) {
      if (obj.roleMap[k] !== Role.WEREWOLF) {
        delete obj.roleMap[k];
      }
    }
    return obj;
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
      if (a.agentStatus !== Status.ALIVE) {
        return false;
      }
      return true;
    });
  }

  /**
   * 
   * @param {Object} res 
   * @param {number} res.agentIdx indexと言っているが実際には1-15
   */
  getAgentByRes(res) {
    const agentIdx = res.agentIdx;
    return this.agents.find(a => a.idnumber === agentIdx);
  }

  /**
   * 各個人用の info 加工
   * @param {GameInfo} ininfo 
   * @param {Agent} agent 
   * @param {number} day
   */
  eachInfo(ininfo, agent, day) {
    const obj = _clone(ininfo);
    obj.agent = agent.idnumber;
    obj.day = day;
    switch (obj.role) {
    case Role.WEREWOLF:
      this.wolfOnly(obj);
      break;

    case Role.SEER:
      this.ownOnly(obj, agent.idstr);
      break;
    case Role.MEDIUM:
      this.ownOnly(obj, agent.idstr);
      break;
    case Role.BODYGUARD:
      this.ownOnly(obj, agent.idstr);
      break;

    case Role.VILLAGER:
    case Role.POSSESSED:
    default:
      this.ownOnly(obj, agent.idstr);
      break;
    }

    // 結果伏せは未実装

    return obj;
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

        const n = this.agents.length;
        let cards = [];
        for (let i = 0; i < n; ++i) {
          cards.push(i);
        }
        for (let i = 0; i < n - 1; ++i) {
          let index = Math.floor(Math.random() * (n - 1));
          if (index >= i) {
            index += 1;
          }
          let tmp = cards[index];
          cards[index] = cards[i];
          cards[i] = tmp;
        }

        const roleset = new RoleSet();
        let index = 0;
        for (const role of roleset.roles) {
          let rolename = role.role;
          if (rolename === Role.WEREWOLF) {
            rolename = Role.VILLAGER;
          }

          for (let j = 0; j < role.num; ++j) {
            const a = this.agents[cards[index]];
            this.gameInfo.roleMap[a.idstr] = rolename;
            a.role = rolename;

            this.gameInfo.statusMap[a.idstr] = Status.ALIVE;

            index += 1;
          }
        }

      }

      for (const a of this.agents) {
        const obj = {
          request: Agent.REQ_NAME,
        };
        const res = await this.reqres(a, obj);
        _log('suc NAME', res);
        a.descname = res;
      }

      _log('before initialize', JSON.stringify(this.gameInfo));

      for (const a of this.agents) {
        // py 3.12.3 でパースするとき talkHistory は Optional 宣言だが
        // KeyError が出る。
        const obj = {
          request: Agent.REQ_INITIALIZE,
          gameInfo: this.eachInfo(this.gameInfo, a, 0),
          talkHistory: this.talkHistory,
          whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
          gameSetting: this.gameSetting, // 必要
        };
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
            gameInfo: this.eachInfo(this.gameInfo, a, i),
            talkHistory: this.talkHistory,
            whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
            //gameSetting: this.gameSetting,
            gameSetting: null,
          };
          await this.req(a, obj);
          _log('daily_initialize, day', i);
        }

        for (let j = 0; j < this.gameSetting.maxTalkTurn; ++j) {
          for (const a of this.agents) {
            if (a.isOver) {
              continue;
            }

            const obj = {
              request: Agent.REQ_TALK,
              gameInfo: this.eachInfo(this.gameInfo, a, i),
              talkHistory: this.talkHistory,
              whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
              //gameSetting: this.gameSetting,
              gameSetting: null,
            };
            //obj.gameInfo.turn = j;
            /** @type {string} */
            const res = `${await this.reqres(a, obj)}`;
            _log('talk ', j, res);

            if (res.startsWith('Over')) {
              a.isOver = true;
            } else if (res.startsWith('Skip')) {
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
              gameInfo: this.eachInfo(this.gameInfo, a, i),
              talkHistory: this.talkHistory,
              whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
              gameSetting: null,
              //gameSetting: this.gameSetting,
            };
            const res = await this.reqres(a, obj);
            _log('vote', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('vote obj', resobj);

              const agent = this.getAgentByRes(resobj);
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
            for (const a of this.agents) {
              if (a.agentStatus !== Status.ALIVE) {
                continue;
              }
              if (a.voteCount > maxCount) {
                maxCount = a.voteCount;
                maxIndex = [a.idnumber];
              } else if (a.voteCount === maxCount) {
                maxIndex.push(a.idnumber);
              }
            }

            if (maxIndex.length === 1) {
              const exeIndex = maxIndex[0];
              this.gameInfo.executedAgent = exeIndex;
              this.gameInfo.statusMap[`${exeIndex}`] = Status.DEAD;
              const agent = this.getAgentByRes({agentIdx: exeIndex});
              if (agent) {
                agent.agentStatus = Status.DEAD;

                _info('処刑', exeIndex, agent.descname);
              } else {
                _warn('execute', exeIndex);
              }
              break;
            }

            { // 同票有り
              _log('同数票', maxIndex);
            }
          }

        } while (false);

        // 夜
        { // seer
          const chars = this.getAgentsByRole(Role.SEER);
          for (const a of chars) {
            const obj = {
              request: Agent.REQ_DIVINE,
              gameInfo: this.eachInfo(this.gameInfo, a, i),
              talkHistory: this.talkHistory,
              whisperHistory: [],
              //whisperHistory: this.whisperHistory,
              //gameSetting: this.gameSetting,
              gameSetting: null,
            };
            const res = await this.reqres(a, obj);
            _log('divine', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('divine obj', resobj);
              const target = this.getAgentByRes(resobj);
              if (target) {
                const result = new Judge();
                this.gameInfo.divineResult = result;
                result.day = i;
                result.target = target.idnumber;
                result.agent = a.idnumber;
                if (target.status === Status.ALIVE) {
                  result.result = target.species;
                } else {
                  result.result = Status.UNC;
                }
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
              gameInfo: this.eachInfo(this.gameInfo, a, i),
              talkHistory: this.talkHistory,
              whisperHistory: [],
              //whisperHistory: this.whisperHistory,
              //gameSetting: this.gameSetting,
              gameSetting: null,
            };
            const res = await this.reqres(a, obj);
            _log('guard', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('guard obj', resobj);
              const target = this.getAgentByRes(resobj);
              if (target) {
                this.gameInfo.guardedAgent = target.idnumber;
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

          // [ ] whisper

          for (const a of chars) {
            const obj = {
              request: Agent.REQ_ATTACK,
              gameInfo: this.eachInfo(this.gameInfo, a, i),
              talkHistory: this.talkHistory,
              whisperHistory: this.whisperHistory,
              //gameSetting: this.gameSetting,
              gameSetting: null,
            };
            const res = await this.reqres(a, obj);
            _log('attack', a.index, res);
            try {
              const resobj = JSON.parse(res);
              _log('attack obj', resobj);
              const agent = this.getAgentByRes(resobj);
              if (agent) {
                agent.attackCount += 1;
              } else {
                _warn('wolf');
              }
            } catch (ec) {

            }
          }

          /** @type {number[]} */
          let maxIndex = [];
          let maxCount = -1;
          for (const a of chars) {
            if (a.attackCount > maxCount) {
              maxCount = a.attackCount;
              maxIndex = [a.idnumber];
            } else if (a.attackCount === maxCount) {
              maxIndex.push(a.idnumber);
            }
          }
          if (maxIndex.length === 1) {
            // 1つ決定
            // [ ] 未実装
          } else {
            // 複数
            // [ ] 未実装
          }

        }

        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_DAYFIN,
            gameInfo: this.eachInfo(this.gameInfo, a, i),
            talkHistory: this.talkHistory,
            whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
            //gameSetting: this.gameSetting,
            gameSetting: null,
          };
          await this.req(a, obj);
          _log('daily_finish', i);
        }

      }

      {
        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_FINISH,
            gameInfo: this.gameInfo, // 最終結果は全員に通知してよいはず
            talkHistory: this.talkHistory,
            whisperHistory: this.whisperHistory,
            gameSetting: this.gameSetting,
            //gameSetting: null,
          };
          obj.gameInfo.agent = a.idnumber;
          await this.req(a, obj);
          _log('round finish');
        }     
      }

      _log('end', JSON.stringify(this.gameInfo));
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

