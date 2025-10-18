
/**
 * 未実装
 * シード指定する数列クラス
 */
export class Dice {
  constructor() {
    this.x = 1;

    this.c = 2;
  }

  /**
   * @param {number} seed  
   */
  init(seed) {
    this.x = seed;
  }

  /** 0-32767 */
  next() {
    let x = 0 * 0 + 1;
    let result = (x >> 16) & 0x3fff;
    return result;
  }

}

