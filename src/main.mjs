
import express from 'express';
import expressWs from 'express-ws';

import { GameInfo, GameSetting, Role, Status, Species, Judge,
  Vote,
  Utterance,
 } from '../public/lib/info.mjs';
import { RoleSet } from '../public/lib/char.js';
import { Dice } from '../public/lib/dice.js';

import net from 'node:net';
import { styleText } from 'node:util';
import path from 'node:path';

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

    this.dice = new Dice();

    this.roundAgentNum = 15;
    /** @type {Agent[]} */
    this.agents = [];

    this.gameSetting = new GameSetting();
    this.gameInfo = new GameInfo();
    this.talkHistory = [];
    this.whisperHistory = [];

    this.wscs = [];
  }

  initialize() {
    _log('initilize');

    this.readySocket();
    this.readyServer();
  }

  sendWC(inobj) {
    const text = JSON.stringify(inobj);
    for (const ws of this.wscs) {
      ws.send(text);
    }
  }

  readyServer() {
    _log('readyServer');

    const dirname = import.meta.dirname;
    {
      const app = express();
      expressWs(app);


      const router = express.Router();
      _log('Router');

      {
        expressWs(router);

        router.ws('/test', (ws, req) => {
          ws.on('message', msg => {
            _log('ws', msg, ws);
          });
          ws.on('close', () => {
            _log('ws close');
          });
          ws.on('disconnect', () => {
            _log('ws disconnect');
          });

          this.wscs.push(ws);
        });

      }

      app.use('/websocket', router);

      app.use('/', express.static(path.resolve(dirname, '../public')));

      app.listen(this.port, '0.0.0.0', err => {
        _log('listen', this.port, err);
      });
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
          c.end();
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

  finish() {
    for (const a of this.agents) {
      if (a.socket.end) {
        _log('end()');
        a.socket.end();
      }
      a.socket.close?.();
      a.socket = null;
    }
    this.agents = [];
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

      if (true) {
        this.sendWC(sendobj);
      }

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

    if (true) {
      this.sendWC(sendobj);
    }

    return null;
  }



  /**
   * 人間種は自分自身しかわからない
   * @param {GameInfo} obj 破壊
   * @param {Agent} agent 
   * @returns 
   */
  ownOnly(obj, agent) {
    const role = obj.roleMap[agent.idstr];
    obj.roleMap = {[agent.idstr]: role};
    return obj;
  }

  /**
   * 指定以外のロールを削除する
   * @param {GameInfo} obj 破壊
   * @param {string} role Role.WEREWOLF など
   */
  roleOnly(obj, role) {
    const ks = Object.keys(obj.roleMap);
    for (const k of ks) {
      if (obj.roleMap[k] !== role) {
        delete obj.roleMap[k];
      }
    }
    return obj;
  }

  /**
   * 生存のみ
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
   */
  eachInfo(ininfo, agent) {
    const obj = _clone(ininfo);
    obj.agent = agent.idnumber;
    switch (agent.role) {
    case Role.FOX:
    case Role.FREEMASON:
    case Role.WEREWOLF:
      this.roleOnly(obj, agent.role);
      break;

    case Role.SEER:
      this.ownOnly(obj, agent);
      // 未実装 結果残し
      break;
    case Role.MEDIUM:
      this.ownOnly(obj, agent);
      // 未実装 結果残し
      break;
    case Role.BODYGUARD:
      this.ownOnly(obj, agent);
      // 未実装 結果残し
      break;

    case Role.VILLAGER:
    case Role.POSSESSED:
    default:
      this.ownOnly(obj, agent);
      break;
    }

    return obj;
  }

  /** 勝敗チェック */
  checkWin() {
    const alive = {[Species.HUMAN]: 0, [Species.WEREWOLF]: 0, [Species.FOX]: 0};
    for (const a of this.agents) {
      if (a.agentStatus !== Status.ALIVE) {
        continue;
      }
      if (a.species === Species.HUMAN) {
        alive[Species.HUMAN] += 1;
      } else if (a.species === Species.WEREWOLF) {
        alive[Species.WEREWOLF] += 1;
      } else if (a.species === Species.FOX) {
        alive[Species.FOX] += 1;
      }
    }

    if (alive[Species.WEREWOLF] === 0) {
      if (alive[Species.FOX] >= 1) {
        return RoleSet.TEAM_FOX;
      }
      return RoleSet.TEAM_VIL;
    }
    if (alive[Species.WEREWOLF] >= alive[Species.HUMAN]) {
      if (alive[Species.FOX] >= 1) {
        return RoleSet.TEAM_FOX;
      }
      return RoleSet.TEAM_WOLF;
    }
    return null;
  }

  async readyRound() {
    _log('readyRound');

    this.dice.init(this.gameSetting.randomSeed);

    this.talkHistory = [];
    this.whisperHistory = [];
    this.gameInfo.day = 0;

    let roundResult = null;
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
          const num = role.num;
          if (num === 0) {
            continue;
          }
          this.gameInfo.existingRoleList.push(rolename);

          for (let j = 0; j < num; ++j) {
            const a = this.agents[cards[index]];
            this.gameInfo.roleMap[a.idstr] = rolename;
            a.role = rolename;
            a.species = role.species;
            a.agentStatus = Status.ALIVE;

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
          gameInfo: this.eachInfo(this.gameInfo, a),
          talkHistory: this.talkHistory,
          whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
          gameSetting: this.gameSetting, // 必要
        };
        await this.req(a, obj);

        //const res = await this.reqres(a, obj);
        //_log('success init', res);
      }

      for (let dayth = 0; dayth <= 99; ++dayth) {
        /** 第n日め。0から始まる。0日目は特殊。 */
        this.gameInfo.day = dayth;
        this.gameInfo.talkList = [];
        this.gameInfo.whisperList = [];

        { // 未実装 昨晩の結果の反映
          // 投票
          // 襲撃
          // 占い
          // 霊媒
          // ガード
        }

        for (const a of this.agents) {
          a.isOver = false;
          a.skipCount = 0;

          const obj = {
            request: Agent.REQ_DAYINIT,
            gameInfo: this.eachInfo(this.gameInfo, a),
            talkHistory: this.talkHistory,
            whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
            //gameSetting: this.gameSetting,
            gameSetting: null,
          };
          await this.req(a, obj);
          _log('daily_initialize, dayth', dayth);
        }

        if (this.gameSetting.talkOnFirstDay || dayth > 0) {
          // 議論

          for (let j = 0; j < this.gameSetting.maxTalk; ++j) {
            let curTurnTalk = [];
            for (const a of this.agents) {
              if (a.isOver) {
                continue;
              }

              const obj = {
                request: Agent.REQ_TALK,
                gameInfo: this.eachInfo(this.gameInfo, a),
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
              } else {
                const talk = new Utterance();
                talk.agent = a.idnumber;
                talk.day = dayth;
                talk.turn = j;
                talk.text = res;
                talk.idx = a.idnumber; // TODO: なんだっけ...
                curTurnTalk.push(talk);
              }
            }

            this.talkHistory = curTurnTalk;
          } // talk loop

        }

        // aiwolf では投票も夜扱いで説明されている

        let todayVotes = [];
        let exeIndex = -1;
        if (dayth >= 1) { // 投票
          for (let voteRepeat = 0; voteRepeat < this.gameSetting.maxRevote + 1; ++voteRepeat) {

            if (false) { // NOTE: 決選投票ではなく再投票なのだが再前の投票情報は残すのが吉か? turnは?
              todayVotes = [];
            }

            for (const a of this.agents) {
              a.voteCount = 0;
            }

            for (const a of this.agents) {
              const obj = {
                request: Agent.REQ_VOTE,
                gameInfo: this.eachInfo(this.gameInfo, a),
                talkHistory: this.talkHistory,
                whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
                gameSetting: null,
                //gameSetting: this.gameSetting,
              };
              const res = await this.reqres(a, obj);
              _log('vote', a.idnumber, res);
              try {
                const resobj = JSON.parse(res);

                const target = this.getAgentByRes(resobj);
                if (target) {
                  target.voteCount += 1;

                  const vote = new Vote();
                  vote.agent = a.idnumber;
                  vote.target = target.idnumber;
                  vote.day = dayth;
                  todayVotes.push(vote);
                } else {
                  _warn('vote', resobj);
                }
              } catch (ec) {

              }
            }

            { // 投票結果判定
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
                exeIndex = maxIndex[0]; // 確定
                break;
              }

              { // 同票有り
                _log('同数票', maxIndex);

                if (voteRepeat === this.gameSetting.maxRevote) {
                  // 最終投票
                  if (this.gameSetting.enableNoExecution) {
                    _log('同数票で処刑無し');
                    break;
                  } else {
                    exeIndex = maxIndex[this.dice.dice(maxIndex.length)];
                    _log('ランダム', exeIndex);
                    break;
                  }
                }
              }
            }

          } // 再投票ループ

          if (exeIndex >= 0) {
            this.gameInfo.executedAgent = exeIndex;
            this.gameInfo.statusMap[`${exeIndex}`] = Status.DEAD;
            const target = this.getAgentByRes({agentIdx: exeIndex});
            if (target) {
              target.agentStatus = Status.DEAD;

              _info('処刑', exeIndex, target.descname);
            } else {
              _warn('execute', exeIndex);
            }

            roundResult = this.checkWin();
            if (roundResult) {
              this.gameInfo.voteList = todayVotes;
              break; // 日をbreak
            }
          }

        }

        if (roundResult) {
          break; // 日をbreak
        }

        // 夜
        {
          this.gameInfo.voteList = todayVotes;
        }

        { // medium はどこに入れるのがよいのか?? 翌日の朝??
          this.gameInfo.mediumResult = null;
          const target = this.getAgentByRes({ agentIdx: exeIndex });
          if (target) {
            const chars = this.getAgentsByRole(Role.MEDIUM);
            for (const a of chars) {
              const result = new Judge();
              result.day = dayth; // 処刑日かその翌朝か??
              result.target = exeIndex;
              result.agent = a.idnumber; // さすがに複数人はいないはず
              result.result = target.species;
              this.gameInfo.mediumResult = result;
            }
          }
        }

        { // seer
          const chars = this.getAgentsByRole(Role.SEER);
          for (const a of chars) {
            const obj = {
              request: Agent.REQ_DIVINE,
              gameInfo: this.eachInfo(this.gameInfo, a),
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
                if (target.agentStatus === Status.ALIVE) {
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

        let guardCandidate = -1;
        { // guard
          const chars = this.getAgentsByRole(Role.BODYGUARD);
          for (const a of chars) {
            const obj = {
              request: Agent.REQ_GUARD,
              gameInfo: this.eachInfo(this.gameInfo, a),
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
                guardCandidate = resobj.agentIdx;
              }
            } catch (ec) {

            }
          }
        }

        { // 襲撃
          let targetNumber = -1;
          const chars = this.getAgentsByRole(Role.WEREWOLF);

          for (let attackRepeat = 0; attackRepeat < this.gameSetting.maxAttackRevote + 1; ++attackRepeat) {
            if (true) {
              // whisper 未実装
              for (const a of chars) {
                //const res = await this.reqres(a, obj);
              }
            }

            // 襲撃投票
            for (const a of this.agents) {
              a.attackCount = 0;
            }
            for (const a of chars) {
              const obj = {
                request: Agent.REQ_ATTACK,
                gameInfo: this.eachInfo(this.gameInfo, a),
                talkHistory: this.talkHistory,
                whisperHistory: this.whisperHistory,
                //gameSetting: this.gameSetting,
                gameSetting: null,
              };
              const res = await this.reqres(a, obj);
              _log('attack', a.idnumber, res);
              try {
                const resobj = JSON.parse(res);
                const agent = this.getAgentByRes(resobj);
                if (agent) {
                  agent.attackCount += 1;
                } else {
                  _warn('wolf');
                }
              } catch (ec) {

              }
            }
            // 襲撃判定
            /** @type {number[]} */
            let maxIndex = [];
            let maxCount = -1;
            for (const a of this.agents) {
              if (a.attackCount > maxCount) {
                maxCount = a.attackCount;
                maxIndex = [a.idnumber];
              } else if (a.attackCount === maxCount) {
                maxIndex.push(a.idnumber);
              }
            }
            if (maxIndex.length === 1) {
              // 1つ決定
              targetNumber = maxIndex[0];
              break;
            } else {
              _log('複数襲撃先', maxIndex);
              if (attackRepeat === this.gameSetting.maxAttackRevote) {
                targetNumber = maxIndex[this.dice.dice(maxIndex.length)];
                _log('ランダム襲撃', targetNumber);
                break;
              }
            }
          }

          if (targetNumber >= 0) {
            if (guardCandidate === targetNumber) {
              targetNumber = -1;
              this.gameInfo.guardedAgent = guardCandidate;
              _info('ガード成功', guardCandidate);
            }
          }

          if (targetNumber >= 0) {
            this.gameInfo.attackedAgent = targetNumber;
            this.gameInfo.statusMap[`${targetNumber}`] = Status.DEAD;
            const target = this.getAgentByRes({agentIdx: targetNumber});
            if (target) {
              target.agentStatus = Status.DEAD;
            } else {
              _warn('unknown attacked', targetNumber);
            }
            _info('襲撃成功', targetNumber);

            roundResult = this.checkWin();
            if (roundResult) {
              break;
            }           
          }

        }

        // [ ] 夜セットするのか? 朝セットするのか?
        // ゲーム配信進行上は被害者は朝公開されることが多い

        for (const a of this.agents) {
          const obj = {
            request: Agent.REQ_DAYFIN,
            gameInfo: this.eachInfo(this.gameInfo, a),
            talkHistory: this.talkHistory,
            whisperHistory: (a.role === Role.WEREWOLF) ? this.whisperHistory : [],
            //gameSetting: this.gameSetting,
            gameSetting: null,
          };
          await this.req(a, obj);
          _log('daily_finish', dayth);
        }

      } // 日のループ最後

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

      _log('end', roundResult, JSON.stringify(this.gameInfo));
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

