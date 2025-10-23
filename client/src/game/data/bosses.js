import Phaser from 'phaser';

export const BOSS_ENCOUNTERS = [
  {
    key: 'quantumOverlord',
    name: 'Quantum Overlord',
    tint: 0xff3fd8,
    enragedTint: 0xffc83f,
    maxHealth: 620,
    speed: 120,
    patrolRange: 240,
    sightRadius: 420,
    attack: {
      type: 'melee',
      damage: 28,
      range: 72,
      cooldown: 1.6,
    },
    projectile: {
      damage: 18,
      speed: 340,
      ttl: 2.6,
    },
    patterns: {
      base: { interval: 2500, burst: 6, spread: 360 },
      enraged: { interval: 1400, burst: 5, spread: 160 },
    },
    glitchSkill: { key: 'echoWarp', name: 'Echo Warp' },
  },
  {
    key: 'chronosMender',
    name: 'Chronos Mender',
    tint: 0x3ff2ff,
    enragedTint: 0xfff03f,
    maxHealth: 680,
    speed: 110,
    patrolRange: 220,
    sightRadius: 400,
    attack: {
      type: 'projectile',
      damage: 22,
      range: 120,
      cooldown: 1.4,
      projectile: { speed: 360, ttl: 2.2, spread: 40 },
    },
    projectile: {
      damage: 20,
      speed: 360,
      ttl: 2.4,
    },
    patterns: {
      base: { interval: 2100, burst: 8, spread: 280 },
      enraged: { interval: 1300, burst: 10, spread: 360 },
    },
    glitchSkill: { key: 'phaseBreak', name: 'Phase Break' },
  },
  {
    key: 'fractalArchon',
    name: 'Fractal Archon',
    tint: 0xff8f3f,
    enragedTint: 0xff2bef,
    maxHealth: 760,
    speed: 150,
    patrolRange: 260,
    sightRadius: 460,
    attack: {
      type: 'melee',
      damage: 32,
      range: 84,
      cooldown: 1.2,
    },
    projectile: {
      damage: 24,
      speed: 380,
      ttl: 2.8,
    },
    patterns: {
      base: { interval: 2000, burst: 7, spread: 200 },
      enraged: { interval: 1100, burst: 9, spread: 260 },
    },
    glitchSkill: { key: 'fractalDash', name: 'Fractal Dash' },
  },
  {
    key: 'stormChanter',
    name: 'Storm Chanter',
    tint: 0x7cffe3,
    enragedTint: 0xff7cf6,
    maxHealth: 840,
    speed: 130,
    patrolRange: 280,
    sightRadius: 480,
    attack: {
      type: 'projectile',
      damage: 30,
      range: 160,
      cooldown: 1.4,
      projectile: { speed: 420, ttl: 2.6, spread: 30 },
    },
    projectile: {
      damage: 26,
      speed: 420,
      ttl: 2.4,
    },
    patterns: {
      base: { interval: 1900, burst: 10, spread: 320 },
      enraged: { interval: 1100, burst: 12, spread: 360 },
    },
    glitchSkill: { key: 'staticStorm', name: 'Static Storm' },
  },
  {
    key: 'gravitySovereign',
    name: 'Gravity Sovereign',
    tint: 0xb5a6ff,
    enragedTint: 0xff9af0,
    maxHealth: 920,
    speed: 140,
    patrolRange: 320,
    sightRadius: 520,
    attack: {
      type: 'melee',
      damage: 36,
      range: 90,
      cooldown: 1.3,
    },
    projectile: {
      damage: 28,
      speed: 400,
      ttl: 3,
    },
    patterns: {
      base: { interval: 1700, burst: 8, spread: 260 },
      enraged: { interval: 1000, burst: 10, spread: 320 },
    },
    glitchSkill: { key: 'realityShift', name: 'Reality Shift' },
  },
];

export function getBossForLevel(level) {
  const index = Math.floor((level - 1) / 10) % BOSS_ENCOUNTERS.length;
  const base = BOSS_ENCOUNTERS[index];
  const healthScaling = 1 + level * 0.12;
  const damageScaling = 1 + level * 0.08;
  return {
    ...base,
    maxHealth: Math.round(base.maxHealth * healthScaling),
    speed: Math.round(base.speed * (1 + level * 0.01)),
    attack: {
      ...base.attack,
      damage: Math.round(base.attack.damage * damageScaling),
      cooldown: Math.max(0.7, base.attack.cooldown * (1 - level * 0.01)),
    },
    projectile: base.projectile
      ? {
          ...base.projectile,
          damage: Math.round(base.projectile.damage * damageScaling),
        }
      : null,
  };
}

export function createBossProjectilePattern(scene, boss, config, target) {
  const { burst, spread, interval } = config;
  boss.patternTimer = (boss.patternTimer ?? 0) + scene.game.loop.delta;
  if (boss.patternTimer < interval) return [];
  boss.patternTimer = 0;

  const projectiles = [];
  const baseAngle = Phaser.Math.Angle.Between(boss.sprite.x, boss.sprite.y, target.x, target.y);
  const step = Phaser.Math.DegToRad(spread / Math.max(1, burst - 1));

  for (let i = 0; i < burst; i += 1) {
    const angle = baseAngle - Phaser.Math.DegToRad(spread) / 2 + step * i;
    const velocity = scene.physics.velocityFromRotation(angle, boss.projectile.speed);
    projectiles.push({
      x: boss.sprite.x,
      y: boss.sprite.y,
      velocity,
      damage: boss.projectile.damage,
      ttl: boss.projectile.ttl,
    });
  }

  return projectiles;
}
