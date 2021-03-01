function roll (nSides, nRolls = 1) {
  let n = 0;
  for (let i = 0; i < nRolls; ++i) {
    n += Math.floor(Math.random() * nSides + 1);
  }
  return n;
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

class Attack {
  constructor (a, d) {
    this.attacker = a;
    this.defender = d;
    this.attackRoll = 0;
    this.armorClass = 0;
    this.hit = false;
    this.critical = false;
    this.damage = 0;
  }

  resolve () {
    const nRoll = roll(20);
    if (nRoll >= this.attacker.weapon.critical.range) {
      this.critical = true;
      this.hit = true;
    }
    if (nRoll > 1) {
      this.attackRoll = this.attacker.attack + nRoll;
      this.armorClass = this.defender.armor;
      this.hit = this.attackRoll >= this.armorClass;
    }
    if (this.hit) {
      this.damage = this.attacker.weapon.rollDamage(this.critical);
    }
  }
}

class Combat {
  constructor (c1, c2) {
    this.c1 = c1;
    this.c2 = c2;
  }

  playRound (a, d) {
    const oAttack = new Attack(a, d);
    oAttack.resolve();
    if (oAttack.hit) {
      d.hp -= oAttack.damage;
    }
    console.log(a.name, 'attacks', d.name, 'and', oAttack.hit ? '*hits*' : '*miss*', oAttack.critical ? '*CRITICAL*' : '');
    if (oAttack.hit) {
      console.log(d.name, 'is damaged', oAttack.damage, 'and has', d.hp, 'hp left');
    }
  }

  play () {
    const c1 = this.c1;
    const c2 = this.c2;
    let iRound = 0;
    while (iRound < 20) {
      console.log('------------------------');
      console.log('round', iRound + 1);
      this.playRound(c1, c2);
      if (c2.isDead) {
        break;
      }
      this.playRound(c2, c1);
      if (c1.isDead) {
        break;
      }
      ++iRound;
    }
  }
}

class Creature {
  constructor () {
    this.hp = 20;
    this.armor = 0;
    this.attack = 0;
    this.weapon = null;
  }

  get isDead () {
    return this.hp <= 0;
  }
}

const scores = {
  hero: 0,
  goblin: 0,
  total: 0
};

class WeaponLongSword extends Weapon {
  constructor() {
    super();
    this.damage.sides = 8;
    this.damage.rolls = 1;
    this.damage.modifier = 0;
    this.critical.multiplier = 2;
    this.critical.range = 19;
  }
}

class WeaponScythe extends Weapon {
  constructor() {
    super();
    this.damage.sides = 4;
    this.damage.rolls = 2;
    this.damage.modifier = 0;
    this.critical.multiplier = 4;
    this.critical.range = 18;
  }
}

function buildHero () {
  const c = new Creature();
  const w = new WeaponLongSword();
  w.damage.sides = 8;
  w.damage.critical = 2;
  c.weapon = w;
  c.hp = 20;
  c.name = 'Hero #1';
  c.armor = 10 + 6;
  c.attack = 4;
  return c;
}

function buildGoblin () {
  const c = new Creature();
  const w = new WeaponScythe();
  c.weapon = w;
  c.hp = 20;
  c.name = 'Hero #2';
  c.armor = 10 + 6;
  c.attack = 4;
  return c;
}

function tryCombat () {
  const c1 = buildHero();
  const c2 = buildGoblin();
  const oCombat = new Combat(c1, c2);
  oCombat.play();
  if (c1.isDead) {
    ++scores.goblin;
  }
  if (c2.isDead) {
    ++scores.hero;
  }
  ++scores.total;
}

for (let i = 0; i < 1000; ++i) {
  tryCombat();
}

console.log(scores);
