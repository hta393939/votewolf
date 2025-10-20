
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
    this.result = 'HUMAN';
  }
}

/**
 * ゲームの進行に従って更新される
 */
export class GameInfo {
  constructor() {
    /** 多分これ */
    this.agent = 1;
    /** @type {Vote[]} */
    this.attackVoteList = [];
    this.attackedAgent = 1;
    this.cursedFox = 0;
    this.day = 1;
    /** @type {Judge} */
    this.divineResult = new Judge();
    this.executedAgent = 1;
    /** @type {string[]} */
    this.existingRoleList = [];
    this.guardedAgent = 1;
    /** @type {number[]} */
    this.lastDeadAgentList = [];
    /** @type {Vote[]} */
    this.latestAttackVoteList = [];
    this.latestExecutedAgent = 1;
    /** @type {Vote[]} */
    this.latestVoteList = [];
    this.mediumResult = new Judge();
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

