
export class CharSet {
  constructor() {
    this.chars = [
      {read: `ねこた`, icon: `🐱`},
      {read: `ねずた`, icon: `🐭`},
      {read: `うした`, icon: `🐮`},
      {read: `とらた`, icon: `🐯`},
      {read: `うさた`, icon: `🐰`},
      {read: `たつた`, icon: `🐲️`},
      {read: `へびた`, icon: `🐍`},
      {read: `うまた`, icon: `🐴`},
      {read: `ひつた`, icon: `🐏`},
      {read: `さるた`, icon: `🐵`},
      {read: `とりた`, icon: `🐔`},
      {read: `いぬた`, icon: `🐶`},
      {read: `いのた`, icon: `🐗`},
    ];
    for (let i = 0; i < this.chars.length; ++i) {
      const v = this.chars[i];
      v.index = i;
      v.descname = `${v.icon}${v.read}`;
    }
  }
}

export class RoleSet {
  /** species */
  static HUMAN = 'HUMAN';
  static WOLF = 'WEREWOLF';
  /** チーム */
  static TEAM_VIL = 'vilteam';
  static TEAM_WOLF = 'wolfteam';
  /** 役職 */
  static ROLE_WEREWOLF = 'WEREWOLF';
  static ROLE_VILLAGER = 'VILLAGER';
  static ROLE_SEER = 'SEER';
  static ROLE_MEDIUM = 'MEDIUM';
  static ROLE_BODYGUARD = 'BODYGUARD';
  static ROLE_POSSESSED = 'POSSESSED';

  static VERB_DIVINATION = 'DIVINATION';
  /** ガードを試みる */
  static VERB_GUARD = 'GUARD';
  static VERB_VOTE = 'VOTE';
  static VERB_ATTACK = 'ATTACK';

  /** これは真占いへの通知だけか??? */
  static RESULT_DIVINED = 'DIVINED';
  static RESULT_IDENTIFIED = 'IDENTIFIED';
  /** 成功も込みか?? */
  static RESULT_GUARDED = 'GUARDED';
  static RESULT_VOTED = 'VOTED';
  /** 成功も込みか?? */
  static RESULT_ATTACKED = 'ATTACKED';

  static ACT_REQUEST = 'REQUEST';

  static TALK_OVER = 'OVER';
  static TALK_SKIP = 'SKIP';

  static ANY = 'ANY';
  static UNSPEC = 'UNSPEC';
  static COMINGOUT = 'COMINGOUT';

  static OP_NOT = 'NOT';
  static OP_AND = 'AND';
  static OP_OR = 'OR';
  static OP_XOR = 'XOR';

  constructor() {
    this.roles = [
      {role: RoleSet.ROLE_VILLAGER, descname: '村人', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {role: RoleSet.ROLE_SEER, descname: '占い師', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {role: RoleSet.ROLE_MEDIUM, descname: '霊媒師', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {role: RoleSet.ROLE_BODYGUARD, descname: '狩人', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {role: RoleSet.ROLE_POSSESSED, descname: '狂人', species: RoleSet.HUMAN, team: RoleSet.TEAM_WOLF},
      {role: RoleSet.ROLE_WEREWOLF, descname: '人狼', species: RoleSet.WOLF, team: RoleSet.TEAM_WOLF},
    ];
  }
}

export class Char {
  constructor() {
    this.charset = new CharSet();

    this.descname = 'ねこた';
  }

  init() {

  }


  
}


