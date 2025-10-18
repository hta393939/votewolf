
import {Char, CharSet, RoleSet} from './char.js';

export class Round {
  constructor() {
    /** @type {Char[]} */
    this.agents = [];

    this.dice = null;
  }

  init(dice) {
    this.dice = dice;

    const roleset = new RoleSet();
    const charset = new CharSet();
    {
      let count = 0;
      for (const role of roleset.roles) {
        for (let j = 0; j < role.num; ++j) {
          const charInfo = charset.chars[count];

          const char = new Char();
          char.descname = charInfo.descname;

          char.role = role.role;
          char.species = role.species;
          char.team = role.team;

          char.alive = true;

          this.agents.push(char);

          count += 1;
        }
      }
    }
  }

  /**
   * 
   * @param {string} role 
   * @param {boolean} aliveOnly 
   * @returns {Char[]}
   */
  enumByRole(role, aliveOnly) {
    return this.agents.filter(a => {
      if (a.role !== role) {
        return false;
      }
      if (!aliveOnly) {
        return true;
      }

      if (a.alive === false) {
        return false;
      }
      return true;
    });
  }

  /**
   * 勝敗決定などに使用する
   * @param {string} species 
   * @param {boolean} aliveOnly 
   * @returns {Char[]}
   */
  enumBySpecies(species, aliveOnly) {
    return this.agents.filter(a => {
      if (a.species !== species) {
        return false;
      }
      if (!aliveOnly) {
        return true;
      }

      if (a.alive === false) {
        return false;
      }
      return true;
    });
  }

  enumAlive() {
    return this.agents.filter(a => a.alive);
  }

  /**
   * 勝敗チェック。
   * @returns {string | null} nullは未決着
   */
  checkWin() {
    const vil = this.enumBySpecies(RoleSet.HUMAN, true);
    const wolf = this.enumBySpecies(RoleSet.WOLF, true);
    if (wolf.length === 0) { // タイミング的に相討ちは無い
      return RoleSet.TEAM_VIL;
    }
    if (wolf.length >= vil.length) {
      return RoleSet.TEAM_WOLF;
    }
    return null;
  }

}

