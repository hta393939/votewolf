
export class ConsoleItem {
  constructor() {
    this.text = '';
    /** 0は初日の前の日の夜用。day number にも使うか */
    this.day = 1;
    /** 朝、結果確認。昼、議論と投票。夜。 */
    this.hours = 10;

    this.talk_id = 1;
  }
}

export class InfoConsole {
  constructor() {
    /** @type {ConsoleItem[]} */
    this.infos = [];
  }

  init() {

  }


  /**
   * 
   * @param {string} text 
   */
  addText(text) {
    const item = new ConsoleItem();
    item.text = text;

    this.infos.push(item);
  }

  makeElements() {
    const parent = document.createElement('div');
    for (const item of this.infos) {
      const el = document.createElement('div');
      el.textContent = item.text;
      parent.appendChild(el);
    }
    return parent;
  }

}

