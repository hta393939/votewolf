
export class Util {

}


export class Role {
  /** 役職としての人狼 */
  static WEREWOLF = 'WEREWOLF';
  /** 役職としての村人 */
  static VILLAGER = 'VILLAGER';
  static SEER = 'SEER';
  static MEDIUM = 'MEDIUM';
  static BODYGUARD = 'BODYGUARD';
  static POSSESSED = 'POSSESSED';
  static FOX = 'FOX';
  static FREEMASON = 'FREEMASON';
  /** Uncertain */
  static UNC = 'UNC';
  /** Wildcard */
  static ANY = 'ANY';
}

export class Species {
  /** 種族としての人間 */
  static HUMAN = 'HUMAN';
  /** 種族としての人狼 */
  static WEREWOLF = 'WEREWOLF';
  /** 占い結果で使用されない */
  static FOX = 'FOX';

  static UNC = 'UNC';
}

export class Status {
  static UNC = 'UNC';
  /** 生存 */
  static ALIVE = 'ALIVE';
  /** 死亡 */
  static DEAD = 'DEAD';
}

export class Vote {
  constructor() {
    this.agent = 1;
    this.day = 1;
    this.target = 1;
  }
}

export class Utterance {
  constructor() {
    this.day = 1;
    this.agent = 1;
    this.idx = 1;
    this.text = '';
    this.turn = 1;
  }
}

export class Judge {
  constructor() {
    this.agent = 1;
    this.day = 1;
    this.target = 1;
    /** species */
    this.result = Species.HUMAN;
  }
}

/**
 * ゲームの進行に従って更新される
 */
export class GameInfo {
  constructor() {
    /** あなたが誰か @type {number} */
    this.agent = 1;
    /** @type {Vote[]} */
    this.attackVoteList = [];
    /** @type {number} */
    this.attackedAgent = -1;
    /** @type {number} */
    this.cursedFox = -1;
    /** 何日めか @type {number} */
    this.day = 1;
    /** @type {Judge|null} */
    this.divineResult = null;
    /** @type {number} */
    this.executedAgent = -1;
    /** @type {string[]} */
    this.existingRoleList = [];
    /** @type {number} */
    this.guardedAgent = -1;
    /** @type {number[]} */
    this.lastDeadAgentList = [];
    /** @type {Vote[]} */
    this.latestAttackVoteList = [];
    /** @type {number} */
    this.latestExecutedAgent = -1;
    /** @type {Vote[]} */
    this.latestVoteList = [];
    /** @type {Judge|null} */
    this.mediumResult = null;
    /** @type {Object<string,number>} */
    this.remainTalkMap = {};
    /** @type {Object<string,number} */
    this.remainWhisperMap = {};
    /** キーは整数パースできる文字列。 @type {Object<string,string} */
    this.roleMap = {};
    /** @type {Object<string,string>} */
    this.statusMap = {};
    /** @type {Utterance[]} */
    this.talkList = [];
    /** @type {Vote[]} */
    this.voteList = [];
    /** @type {Utterance[]} */
    this.whisperList = [];
  }
}

export class GameSetting {
  constructor() {
    /** 誰も襲撃しないを許可するか */
    this.enableNoAttack = false;
    /** 誰も処刑しないを許可するか */
    this.enableNoExecution = false;
    /** ロール要求を有効化する */
    this.enableRoleRequest = false;
    /** 最大襲撃再投票数 */
    this.maxAttackRevote = 1;
    this.maxRevote = 1;
    this.maxSkip = 8;
    this.maxTalk = 8;
    this.maxTalkTurn = 8;
    this.maxWhisper = 8;
    this.maxWhisperTurn = 8;
    this.playerNum = 15;
    this.randomSeed = 1;
    /** @type {Object<string,number>} */
    this.roleNumMap = {
      'WEREWOLF': 3,
      'POSSESSED': 1,
      'SEER': 1,
      'MEDIUM': 1,
      'BODYGUARD': 1,
      'VILLAGER': 6 + 2,
      'FREEMASON': 0,
      'FOX': 0,
    };
    this.talkOnFirstDay = false;
    /** リクエストに対する応答の最大制限 */
    this.timeLimit = 1000;
    this.validateUtterance = false;
    /** ファーストデイに投票があるか */
    this.votableInFirstDay = false;
    this.voteVisible = true;
    /** 再投票前に狼がささやきできるか */
    this.whisperBeforeRevote = true;
  }
}

