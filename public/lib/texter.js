
import {Vote} from './info.mjs';

export class Texter {
  constructor() {
    this.descnames = {};
  }

  /**
   * 
   * @param {number} agentIdx 
   * @returns 
   */
  a(agentIdx) {
    let descname = this.descnames[`${agentIdx}`] || '';
    descname = descname ? `(${descname})` : '';
    return `Agent[${new String(agentIdx).padStart(2, '0')}]${descname}`;
  }

  /**
   * 加工した方が読みやすそう
   * @param {Vote} v 
   * @returns 
   */
  vote(v) {
    return `${this.a(v.agent)}が${this.a(v.target)}に投票した(${v.day}日目)`;
  }

}

