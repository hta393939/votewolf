
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
  static SPECIES_HUMAN = 'HUMAN';
  /** 種族としての人狼 */
  static SPECIES_WOLF = 'WEREWOLF';
  /** チーム */
  static TEAM_VIL = 'vilteam';
  static TEAM_WOLF = 'wolfteam';
  /** 役職 */
  static ROLE_WEREWOLF = 'WEREWOLF';
  static ROLE_VILLAGER = 'VILLAGER';
  static ROLE_SEERER = 'SEERER';
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

  static OP_INQUIRE = 'INQUIRE';
  static OP_BECAUSE = 'BECAUSE';
  static OP_DAY = 'DAY';
  static OP_NOT = 'NOT';
  static OP_AND = 'AND';
  static OP_OR = 'OR';
  static OP_XOR = 'XOR';

  constructor() {
    /** 13人村の場合 */
    this.roles = [
      {num: 6, role: RoleSet.ROLE_VILLAGER, descname: '村人', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {num: 1, role: RoleSet.ROLE_SEERER, descname: '占い師', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {num: 1, role: RoleSet.ROLE_MEDIUM, descname: '霊媒師', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {num: 1, role: RoleSet.ROLE_BODYGUARD, descname: '狩人', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL},
      {num: 1, role: RoleSet.ROLE_POSSESSED, descname: '狂人', species: RoleSet.HUMAN, team: RoleSet.TEAM_WOLF},
      {num: 3, role: RoleSet.ROLE_WEREWOLF, descname: '人狼', species: RoleSet.WOLF, team: RoleSet.TEAM_WOLF},
    ];
  }
}

export class Char {
  constructor() {
    this.descname = '🐱ねこた';

    this.role = RoleSet.ROLE_VILLAGER;
    this.team = RoleSet.TEAM_VIL;
    this.species = RoleSet.SPECIES_HUMAN;
    this.alive = true;

    /** 占いや霊媒で得る非公開情報。狼もここ */
    this.closeInfo = {};
  }

  init() {

  }
  
}


