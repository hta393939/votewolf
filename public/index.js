
import { RoleSet } from './lib/char.js';
import { Log } from './lib/log.js';
import { Round } from './lib/round.js';

class Misc {
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

  constructor() {
    this.status = Misc.RUNNING;
    this.loopStatus = Misc.LOOP_TALK;
    this.dice = null;

    this.ws = null;

    this.log = new Log();
  }

  initialize() {


    this.update();
    this.intervalFunc();
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
    });
    ws.addEventListener('error', ev => {
      console.log('error', ev);
    });
    ws.addEventListener('close', ev => {
      console.log('close', ev);
      this.ws = null;
    });
    ws.addEventListener('message', ev => {
      try {
        const obj = JSON.parse(ev.data);
        this.log.log(obj);
      } catch (ec) {
        console.warn('message catch', ec.message);
      }
    });
    console.log('addListener');
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
