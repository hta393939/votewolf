
export class Util {

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

export class GameInfo {
  constructor() {
    this.agent = 1;
    /** @type {Vote[]} */
    this.attackVoteList = [];
    this.attackedAgent = 1;
    this.cursedFox = 1;
    this.day = 1;
    /** @type {Judge} */
    this.divineResult = new Judge();
    this.executedAgent = 1;
    /** @type {string[]} */
    this.existingRoleList = [];
    this.guardedAgent = 1;
    /** @type {number[]} */
    this.lastDeadAgentList = [];
    this.latestExecutedAgent = 1;
    /** @type {Vote[]} */
    this.latestVoteList = [];
    this.mediumResult = new Judge();
    /** @type {Object<string,number>} */
    this.remainTalkMap = {};
    /** @type {Object<string,number} */
    this.remainWhisperMap = {};
    /** @type {Object<string,string} */
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

    this.maxAttackRevote = 1;
    this.maxRevote = 1;
    this.maxSkip = 1;
    this.maxTalk = 1;
    this.maxTalkTurn = 1;
    this.maxWhisper = 1;
    this.maxWhisperTurn = 1;
    this.playerNum = 15;
    this.randomSeed = 1;
    /** @type {Object<string,number>} */
    this.roleNumMap = {};
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

