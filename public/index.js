
import {Char} from './lib/char.js';
import {Log} from './lib/log.js';

class Misc {
  static RUNNING = 'running';
  static PAUSE = 'pause';
  constructor() {
    this.status = Misc.RUNNING;

    this.log = new Log();
  }

  initialize() {


    this.update();
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

  startProject() {
    this.initProject();
    this.initRound();
  }

  actTick(deltaTick) {
    for (let i = 0; i < deltaTick; ++i) {
      this.actOneTick();
    }
  }

  actOneTick() {
    this.log.log('actOneTick');

    
  }

  pause() {
    this.status = Misc.PAUSE;
  }

  restart() {
    this.status = Misc.RUNNING;
  }

  initProject() {
    this.log.log('initProject do nothing');
  }

  /**
   * 3ラウンドぐらい
   */
  initRound() {
    this.log.log('initRound');
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

  }

  /**  */
  act1() {

  }

  /**  */
  act2() {

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
