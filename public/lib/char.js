
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
      {read: `うまめ`, icon: `🐴`},
      {read: `ひつた`, icon: `🐏`},
      {read: `さるた`, icon: `🐵`},
      {read: `とりた`, icon: `🐔`},
      {read: `いぬた`, icon: `🐶`},
      {read: `いのき`, icon: `🐗`},
      {read: `かにた`, icon: `🦀`},
      {read: `うおた`, icon: `🐠`},
    ];
    for (let i = 0; i < this.chars.length; ++i) {
      const v = this.chars[i];
      v.index = i;
      v.descname = `${v.icon}${v.read}`;
    }
  }
}

export class RoleSet {
  /** 種族としての人間 */
  static SPECIES_HUMAN = 'HUMAN';
  /** 種族としての人狼 */
  static SPECIES_WOLF = 'WEREWOLF';
  /** 村チーム */
  static TEAM_VIL = 'vilteam';
  /** 狼チーム */
  static TEAM_WOLF = 'wolfteam';
  /** 役職としての人狼 */
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
      {num: 6, role: RoleSet.ROLE_VILLAGER, descname: '村人', icon: '🙂', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL, thinker: VilThink},
      {num: 1, role: RoleSet.ROLE_SEERER, descname: '占い師', icon: '🔮', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL, thinker: SeerThink},
      {num: 1, role: RoleSet.ROLE_MEDIUM, descname: '霊媒師', icon: '⚰️', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL, thinker: MediumThink},
      {num: 1, role: RoleSet.ROLE_BODYGUARD, descname: '狩人', icon: '🛡️', species: RoleSet.HUMAN, team: RoleSet.TEAM_VIL, thinker: GuardThink},
      {num: 1, role: RoleSet.ROLE_POSSESSED, descname: '狂人', icon: '🤡', species: RoleSet.HUMAN, team: RoleSet.TEAM_WOLF, thinker: PossessedThink},
      {num: 3, role: RoleSet.ROLE_WEREWOLF, descname: '人狼', icon: '🐺', species: RoleSet.WOLF, team: RoleSet.TEAM_WOLF, thinker: WolfThink},
    ];
  }
}

/**
 * 狩人の結果も兼ねるか
 */
export class SpeciesCheck {
  constructor() {
    /** 試行した日 */
    this.day = 1;
    /** round内で固定のインデックス。詰めない。*/
    this.agentIndex = 0;
    this.resultSpecies = RoleSet.SPECIES_HUMAN;
    /** 狩人だった場合にGJが出たらtrueにする。人間種族ということにもなる(狂人の可能性もある) */
    this.guardSuccess = false;
  }
}

export class Char {
  constructor() {
    /** 表示名 */
    this.descname = '🐱ねこた';

    this.role = RoleSet.ROLE_VILLAGER;
    this.team = RoleSet.TEAM_VIL;
    this.species = RoleSet.SPECIES_HUMAN;
    this.alive = true;

    /** 占いや霊媒で得る非公開情報。狼もここ */
    this.closeInfo = {};
  }

  init(rolename) {
    const roleset = new RoleSet();
    const role = roleset.roles(r => r.role === rolename);

    this.role = role.role;
    this.team = role.team;
    this.species = role.species;
    this.think = new (found.thinker)();
  }
  
}


