
/**
 * Visual C++ の数列
 * シード指定する数列クラス
 */
export class Dice {
  constructor() {
    this.A = 214013;
    this.C = 2531011;
    this.F = 0;
    this.S = 1;

    this.x = this.S;
  }

  /**
   * @param {number} seed  
   */
  init(seed) {
    this.x = seed;
    if (this.F) {
      this.next();
    }
  }

  /** 0-32767 */
  next() {
    let x = (this.x * this.A + this.C) % 4294967296;
    this.x = x;
    const result = Math.floor(x / 65536) & 32767;
    return result;
  }

  /**
   * 0が出やすいのを多少抑制する
   * @param {number} sel 2-32768の整数
   * @returns {number} 0-(sel-1)の整数
   */
  dice(sel) {
    const limit = Math.floor(32768 / sel) * sel;
    while (true) {
      const val = this.next();
      if (val >= limit) {
        continue;
      }
      return val % sel;
    }
  }

}

