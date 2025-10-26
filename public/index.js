
import { TabulatorFull as Tabulator, FilterModule, EditModule } from './third_party/tabulator/tabulator_esm.min.mjs';

import { RoleSet } from './lib/char.js';
import { Log } from './lib/log.js';
import { Round } from './lib/round.js';
import { ConsoleItem } from './lib/infoconsole.js';
import { GameInfo, Status } from './lib/info.mjs';

/**
 * TabulaterFull が必要だった。
 * @param {*} cell 
 * @param {*} formatterParams 
 * @param {*} onRendered 
 * @returns {string}
 */
function _agent(cell, formatterParams, onRendered) {
  //console.log('formatter called');
  const val = cell.getValue();
  if (val === 256) {
    return 'system';
  }
  return `Agent[${new String(val).padStart(2, '0')}]`;
}

class Misc extends EventTarget {
  static RUNNING = 'running';
  static PAUSE = 'pause';

  static LOOP_TALK = 'select_talk';
  static LOOP_VOTE = 'select_vote';
  /** 狩人のみ */
  static LOOP_SEL_GUARD = 'select_guard';
  /** 占いのみ */
  static LOOP_SEL_SEER = 'select_seer';
  /** 人狼のみ */
  static LOOP_SEL_ATTACK = 'select_attack';
  /**  */
  static LOOP_NONE = 'none';

  static EV_MESSAGE = 'message';

  constructor() {
    super();

    this.status = Misc.RUNNING;
    this.loopStatus = Misc.LOOP_TALK;
    this.dice = null;

    this.ws = null;
    this.tabu = null;
    this.tabuTable = [];

    this.log = new Log();
  }

  initialize() {
    this.addEventListener(Misc.EV_MESSAGE, ev => {
      this.onMessage(ev.detail);
    });

    this.readyTabu();
    this.readyAgent();
    this.update();
    this.intervalFunc();
  }

  onMessage(detail) {
    switch (detail.data.request) {
    case 'DAILY_INITIALIZE':
      this.onDailyInitialize(detail.data);
      break;

    case 'DAILY_FINISH':
      this.onDailyFinish(detail.data);
      break;
    case 'FINISH':
      this.onFinish(detail.data);
      break;
    }
  }

  async onInitialize(data) {
    console.log('onInitialize', data);
    if (this.latestInitialize === data.gameInfo.day) {
      //return;
    }
    this.latestInitialize = data.gameInfo.day;

    this.latestDailyInitialize = -1;
    this.latestDailyFinish = -1;
    this.latestFinish = -1;

    this.tabu.clearData();
    this.agentTabu.clearData();
  }

  async onDailyInitialize(data) {
    console.log('daily initialize', data);
    if (this.latestDailyInitialize === data.gameInfo.day) {
      return;
    }
    this.latestDailyInitialize = data.gameInfo.day;

  }

  async onDailyFinish(data) {
    console.log('daily finish', data);
    if (this.latestDailyFinish === data.gameInfo.day) {
      return;
    }
    this.latestDailyFinish = data.gameInfo.day;
    // true だとトップ、false だと一番下
    //this.tabu.addData(data, false);
    await this.makeAgentTable(data.gameInfo);

    await this.divideVote(data.gameInfo);
    await this.divideNotification(data.gameInfo);
  }

  async onFinish(data) {
    console.log('finish', data);
    if (this.latestFinish === data.gameInfo.day) {
      return;
    }
    this.latestFinish = data.gameInfo.day;

    await this.makeAgentTable(data.gameInfo);
  }


  update() {
    requestAnimationFrame(() => {
      this.update();
    });

    if (this.status === Misc.PAUSE) {
      return;
    }

    // カウントする
    // tick を進める場合

    let deltaTick = 1;
    if (deltaTick <= 0) {
      return;
    }

    this.actTick(deltaTick);

  }

  /**
   * ゲームスタート
   */
  startProject() {
    this.log.log('startProject');

    this.initProject(1);
    this.initRound();
  }

  actTick(deltaTick) {
    for (let i = 0; i < deltaTick; ++i) {
      this.actOneTick();
    }
  }

  actOneTick() {
    //this.log.log('actOneTick');

    switch (this.loopStatus) {
    case Misc.LOOP_TALK:
      break;
    case Misc.LOOP_VOTE:
      break;
    case Misc.LOOP_SEL_GUARD:
      break;
    case Misc.LOOP_SEL_SEER:
      break;
    case Misc.LOOP_SEL_ATTACK:
      break;
    case Misc.LOOP_NONE:
      break;
    }

  }

  pause() {
    this.status = Misc.PAUSE;
  }

  restart() {
    this.status = Misc.RUNNING;
  }

  initProject(seed) {
    this.log.log('initProject, seed', seed);

    const dice = new Dice();
    dice.init(seed);
    this.dice = dice;
  }

  /**
   * 3ラウンドぐらい
   */
  initRound() {
    this.log.log('initRound');

    const round = new Round();
    round.init(this.dice);

    this.round = round;
  }

  /**
   * 1日
   */
  initDay() {

  }

  /**
   * 投票
   */
  initVote() {

    this.loopStatus = Misc.LOOP_VOTE;
  }

  morningLoop() {
    { // 被害の公開
    }
  }

  talkLoop() {

    this.loopStatus = Misc.LOOP_NONE;
  }

  /**  */
  voteLoop() {

    {
      
    }


    const result = this.round.checkWin();
    if (!result) {
      return;
    }

    // 決着

    //this.loopStatus = Misc.LOOP_NONE;
  }

  /**  */
  nightLoop() {
    { // 霊媒の結果の通知
      const medium = this.round.enumByRole(RoleSet.ROLE_MEDIUM, true);
      for (const a of medium) {
      }
    }

    { // ガードの選択
      const guard = this.round.enumByRole(RoleSet.ROLE_BODYGUARD, true);
      for (const a of guard) {
        const result = a.think.thinkGuard();
      }
    }
    { // 占いの選択と結果
      const seerer = this.round.enumByRole(RoleSet.ROLE_SEERER, true);
      for (const a of seerer) {

      }
    }
    { // 襲撃の選択と結果
      const wolf = this.round.enumByRole(RoleSet.ROLE_WEREWOLF, true);
      for (const a of wolf) {
        
      }
    }

    const result = this.round.checkWin();
    if (!result) {
      return;
    }

    // 決着

    //this.loopStatus = Misc.LOOP_NONE;
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  drawRest(/*canvas*/) {
    const canvas = document.getElementById('canvas1');
    const w = 512;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    //const w = canvas.width;
    //const h = canvas.height;
    const c = canvas.getContext('2d');
    let px = 50;
    let fam = `Noto Sans JP Black`;
    c.font = `bold ${px}px ${fam}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < 13; ++i) {
      const a = this.round.agents[i];
      let ang = i * Math.PI * 2 / 13;
      let x = w * 0.5 - rr * Math.sin(ang);
      let y = h * 0.5 + rr * Math.cos(ang);
      c.fillText(a.descname, x, y);
    }

  }

  initSocket() {
    console.log('initSocket');
    const ws = new WebSocket('/websocket/test');
    this.ws = ws;
    this.addListener(ws);
  }

  intervalFunc() {
    setTimeout(() => {
      this.intervalFunc();
    }, 2000);

    if (!this.ws) {
      this.initSocket();
    }
  }

  /**
   * 
   * @param {WebSocket} ws 
   */
  addListener(ws) {
    console.log('addListener');
    ws.addEventListener('open', ev => {
      console.log('open', ev);

      const el = document.getElementById('network');
      if (el) {
        el.textContent = '📶接続中';
      }
    });
    ws.addEventListener('error', ev => {
      console.log('error', ev);
    });
    ws.addEventListener('close', ev => {
      console.log('close', ev);
      this.ws = null;

      const el = document.getElementById('network');
      if (el) {
        el.textContent = '🚫切断中';
      }
    });
    ws.addEventListener('message', ev => {
      try {
        const obj = JSON.parse(ev.data);
        this.log.log(obj);

        const cev = new CustomEvent(Misc.EV_MESSAGE, {
          detail: {
            data: obj,
            ws,
          }
        });
        this.dispatchEvent(cev);
      } catch (ec) {
        console.warn('message catch', ec.message);
      }
    });
    console.log('addListener');
  }

  getAgentName(agentIdx) {
    if (agentIdx < 0) {
      return '-';
    }
    if (agentIdx === 256) {
      return 'system';
    }
    return `Agent[${new String(agentIdx).padStart(2, '0')}]`;
  }

  readyTabu() {
    console.log('readyTabu');

    Tabulator.registerModule([FilterModule, EditModule]);

    this.tabuTable = [
      {
        id: 0,
        day: 0, turn: 2, agent: 256, text: '朝です',
      }
    ];

    const div = document.getElementById('infoconsole');
    const opt = {
      movableColumns: true,
      data: this.tabuTable,
      columns: [
        {title: '#', field: 'id', headerHozAlign: 'right', hozAlign: 'right'},
        {title: '日', field: 'day', headerHozAlign: 'right', hozAlign: 'right'},
        {title: 't', field: 'turn', headerHozAlign: 'right', hozAlign: 'right'},
        {title: 'エージェント', field: 'agent', formatter: _agent},
        {title: '', field: 'text'},
      ]
    };
    const tabu = new Tabulator(div, opt);
    this.tabu = tabu;
    console.log('tabu', tabu);
  }

  /**
   * 投票リストを分解する。
   * NOTE: 今の実装では voteList 内の day を採用するものとする。
   * @param {GameInfo} gameInfo 
   */
  async divideVote(gameInfo) {
    const vs = gameInfo.voteList;
    if (vs.length === 0) {
      return;
    }
    const voteDay = vs[0].day;

    const voteCounts = {};
    //const ks = Object.keys(gameInfo.statusMap).filter(k => gameInfo.statusMap[k] === Status.ALIVE);
    // NOTE: 投票を終わった後の daily finish だと、処刑されたり襲撃されたエージェントにも票は入る。

    //const ks = Object.keys(gameInfo.statusMap);
    //for (const k of ks) {
    //  voteCounts[`${k}`] = {[`day${voteDay}_v`]: 0};
    //}

    const items = [];
    for (const v of vs) {
      const ci = new ConsoleItem();
      ci.day = v.day;
      ci.agent = v.agent;
      ci.target = v.target;
      ci.text = `${this.getAgentName(v.target)}に投票しました`;
      items.push(ci);

      const ref = `day${v.day}_vc`;
      const targetKey = `${v.target}`;
      let obj = voteCounts[targetKey];
      if (!obj) {
        obj = {id: v.target, [ref]: 0};
        voteCounts[targetKey] = obj;
      }
      obj[ref] += 1;

      const votingKey = `${v.agent}`;
      let voting = voteCounts[votingKey];
      if (!voting) {
        voting = {id: v.agent, [ref]: 0};
        voteCounts[votingKey] = voting;
      }
    }
    if (items.length >= 1) {
      await this.tabu.addData(items, false);
    }

    const vc = Object.keys(voteCounts).map(k => voteCounts[k]);
    if (vc.length >= 1) {
      await this.agentTabu.updateOrAddData(vc);
    }
  }

  /**
   * トークリストを分解してアイテム追加する
   * @param {GameInfo} gameInfo 
   */
  async divideNotification(gameInfo) {
    const ts = gameInfo.talkList;
    const items = [];
    for (const t of ts) {
      const ci = new ConsoleItem();
      ci.day = t.day;
      ci.turn = t.turn;
      ci.agent = t.agent;
      ci.target = t.target;
      ci.text = t.text;
      items.push(ci);
    }
    await this.tabu.addData(items, false);
  }

  /**
   * エージェントテーブルを用意する
   */
  readyAgent() {
    const div = document.getElementById('agenttable');
    const opt = {
      //movableColumns: true,
      data: [],
      columns: [
        {title: '状態', field: 'alive', frozen: true, formatter: function(cell) {
          const val = cell.getValue();
          let icon = (val === 'ALIVE') ? '💖' : '💀';
          return `${icon}${val}`;
        }},
        {title: 'エージェント', field: 'id', frozen: true, formatter: _agent},
        {title: '役職', field: 'role', frozen: true, formatter: function(cell) {
          const val = cell.getValue();
          const to = {
            'VILLAGER': '村人', 'WEREWOLF': '人狼',
            'POSSESSED': '狂人', 'SEER': '占い師',
            'MEDIUM': '霊媒師', 'BODYGUARD': '狩人',
          };
          return to[val] || '-';
        }},
        //{title: 'テキスト', field: 'text'},
      ]
    };
    for (let i = 1; i < 11; ++i) {
      for (let j = 0; j < 1; ++j) {
        const col = {
          title: `${i}_${j}`,
          field: `day${i}_${j}`,
        };
        opt.columns.push(col);
      }
      {
        const col = {
          title: `${i}被投`,
          field: `day${i}_vc`,
        };
        opt.columns.push(col);
      }
      if (false) {
        const col = {
          title: `${i}狼投`,
          field: `day${i}_wc`,
        };
        opt.columns.push(col);
      }
    }

    const tabu = new Tabulator(div, opt);
    this.agentTabu = tabu;
    tabu.on('tableBuilt', ev => {


      this.makeAgentTable(
        {roleMap: {},statusMap: {'1': 'ALIVE', '2': 'DEAD'}}
      );
    });

    console.log('agent', opt);
  }

  /**
   * 
   * @param {GameInfo} gameInfo 
   */
  async makeAgentTable(gameInfo) {
    const ks = Object.keys(gameInfo.statusMap);

    const ags = {};
    for (const k of ks) {
      const obj = {
        id: Number.parseInt(k),
        day0_0: 'd00',
        day1_0: 'd10',
        day2_0: 'd11',
        alive: gameInfo.statusMap[k],
        role: gameInfo.roleMap[k],
      };
      ags[k] = obj;
    }

    await this.agentTabu.updateOrAddData(ks.map(k => ags[k]), false);
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
