function roll (nSides, nRolls = 1) {
  let n = 0;
  for (let i = 0; i < nRolls; ++i) {
    n += Math.floor(Math.random() * nSides + 1);
  }
  return n;
}

class Attack {
  constructor () {
    this.attacker = null;
    this.defender = null;
    this.attack = 0;
    this.armorClass = 0;
    this.hit = false;
    this.critical = false;
    this.damage = 0;
  }

  getArmorClass () {
    const a = this.defender.armor;
    return a.base + a.natural + a.armor + a.shield + a.evade;
  }

  resolve () {
    const nRoll = roll(20);
    switch (nRoll) {
      case 1:
        break;

      case 20:
        this.critical = true;
        this.hit = true;
        break;

      default:
        this.attackRoll = this.attacker.getAttackBonus() + nRoll;
        this.armorClass = this.defender.getArmorClass();
        this.hit = this.attackRoll >= this.armorClass;
        break;
    }
    if (this.hit) {
      this.damage = this.attacker.weapon.rollDamage(this.critical);
    }
  }
}

class Weapon {
  constructor () {
    this.name = 'Short sword';
    this.damage = {
      sides: 6,
      rolls: 1,
      modifier: 0
    };
    this.critical = {
      range: 20,
      multiplier: 2
    }
  }

  rollDamage (bCrit) {
    if (bCrit) {
      const nMult = this.critical.multiplier;
      let nDamage = 0;
      for (let iCrit = 0; iCrit < nMult; ++iCrit) {
        nDamage += this.rollDamage(false);
      }
      return nDamage;
    } else {
      const {sides, rolls, modifier} = this.damage;
      return roll(sides, rolls) + modifier;
    }
  }
}

class Creature {
  constructor () {
    this.weapon = null;
    this.armor = {
      base: 10,
      natural: 0,
      armor: 0,
      shield: 0,
      evade: 0
    };
    this.hp = 10;
    this.name = 'creature';
  }

  getAttackBonus () {
    return 2;
  }

  getArmorClass () {
    const a = this.armor;
    return a.base + a.natural + a.armor + a.shield + a.evade;
  }
}

class Combat {
  constructor (c1, c2) {
    this.c1 = c1;
    this.c2 = c2;
  }

  playRound () {
    const oAttack = new Attack();
    oAttack.attacker = this.c1;
    oAttack.defender = this.c2;
    oAttack.resolve();
  }
}
