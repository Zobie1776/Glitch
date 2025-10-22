import Phaser from 'phaser';

export const BOSS_ENCOUNTERS = [
  {
    key: 'quantumOverlord',
    name: 'Quantum Overlord',
    tint: 0xff3fd8,
    enragedTint: 0xffc83f,
    maxHealth: 600,
    speed: 110,
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
      base: {
        interval: 2500,
        burst: 6,
        spread: 360,
      },
      enraged: {
        interval: 1400,
        burst: 5,
        spread: 160,
      },
    },
    glitchSkill: {
      name: 'Time Fracture',
      cooldown: 18,
      description: 'Detonates a temporal shockwave that freezes enemies briefly.',
    },
  },
];

export function getBossForLevel(level) {
  const index = Math.floor(level / 10) % BOSS_ENCOUNTERS.length;
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
      cooldown: Math.max(0.8, base.attack.cooldown * (1 - level * 0.01)),
    },
    projectile: {
      ...base.projectile,
      damage: Math.round(base.projectile.damage * damageScaling),
    },
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
