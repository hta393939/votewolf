
export class Log {
  constructor() {
    this.cols = [
      `color:deepskyblue;`,
      `color:salmon;`,
    ];
  }

  init() {

  }



  log(...args) {

    console.log(`%clog`, this.cols[0], ...args);
  }

}

