export const ENEMY_CONFIGS = {
  basicChaser: {
    key: 'basicChaser', texture: 'enemy_chaser', name: 'Glitch Chaser',
    width: 20, height: 28,
    maxHealth: 50, speed: 110, attackDamage: 10,
    attackRange: 40, attackCooldown: 1200,
    sightRadius: 220, patrolRange: 150,
    loot: { gems: [1, 3], xp: [8, 15] },
    color: 0xff66aa,
    knockbackResist: 0,
  },
  attacker: {
    key: 'attacker', texture: 'enemy_attacker', name: 'Rift Attacker',
    width: 22, height: 30,
    maxHealth: 65, speed: 130, attackDamage: 15,
    attackRange: 45, attackCooldown: 1500,
    sightRadius: 250, patrolRange: 160,
    loot: { gems: [2, 4], xp: [12, 20] },
    color: 0xb565f0,
    knockbackResist: 0,
    hasTelegraph: true, telegraphDuration: 600,
  },
  fastEnemy: {
    key: 'fastEnemy', texture: 'enemy_fast', name: 'Phase Dasher',
    width: 18, height: 24,
    maxHealth: 40, speed: 210, attackDamage: 8,
    attackRange: 35, attackCooldown: 900,
    sightRadius: 280, patrolRange: 200,
    loot: { gems: [1, 3], xp: [10, 18] },
    color: 0xee44ff,
    knockbackResist: 0,
    canDash: true, dashSpeed: 450, dashCooldown: 3000,
  },
  heavyEnemy: {
    key: 'heavyEnemy', texture: 'enemy_heavy', name: 'Glimmer Hulk',
    width: 32, height: 38,
    maxHealth: 130, speed: 80, attackDamage: 24,
    attackRange: 55, attackCooldown: 2000,
    sightRadius: 180, patrolRange: 120,
    loot: { gems: [4, 8], xp: [20, 35] },
    color: 0xcc2266,
    knockbackResist: 0.65,
    hasTelegraph: true, telegraphDuration: 900,
  },
  teleporter: {
    key: 'teleporter', texture: 'enemy_teleporter', name: 'Void Walker',
    width: 20, height: 28,
    maxHealth: 70, speed: 140, attackDamage: 14,
    attackRange: 50, attackCooldown: 1400,
    sightRadius: 300, patrolRange: 180,
    loot: { gems: [3, 6], xp: [15, 25] },
    color: 0xff88ee,
    knockbackResist: 0,
    canTeleportArena: true, arenaChaseTime: 5000,
  },
};

// Scale enemy stats based on current level
export function scaleEnemyConfig(config, level) {
  const hpScale = 1 + Math.floor(level / 3) * 0.05;
  const spdScale = 1 + Math.floor(level / 2) * 0.03;
  const dmgScale = 1 + Math.floor(level / 5) * 0.05;
  return {
    ...config,
    maxHealth: Math.round(config.maxHealth * hpScale),
    speed: Math.round(config.speed * spdScale),
    attackDamage: Math.round(config.attackDamage * dmgScale),
  };
}

// Get enemy count for a level
export function getEnemyCount(level) {
  return Math.min(2 + level * 2, 20);
}

// Get valid enemy pool for a level (phase-based)
export function getEnemyPool(level) {
  const phase = Math.ceil(level / 10);
  const pools = [
    ['basicChaser', 'attacker'],
    ['basicChaser', 'attacker', 'fastEnemy'],
    ['attacker', 'fastEnemy', 'heavyEnemy'],
    ['fastEnemy', 'heavyEnemy', 'teleporter'],
    ['attacker', 'fastEnemy', 'heavyEnemy', 'teleporter'],
  ];
  return pools[Math.min(phase - 1, 4)];
}
