import Phaser from 'phaser';

export const ENEMY_VARIANTS = [
  {
    key: 'glitchling',
    name: 'Glitchling',
    tint: 0xff6666,
    maxHealth: 45,
    speed: 120,
    patrolRange: 160,
    sightRadius: 260,
    attack: { type: 'melee', damage: 8, range: 42, cooldown: 1.4 },
    loot: { min: 3, max: 6 },
    visionAngle: 110,
    variations: [
      { label: 'Feral', speedMultiplier: 1.2, damageMultiplier: 1.1 },
      { label: 'Bulwark', healthMultiplier: 1.3, speedMultiplier: 0.9 },
    ],
  },
  {
    key: 'riftStalker',
    name: 'Rift Stalker',
    tint: 0xb565f0,
    maxHealth: 60,
    speed: 110,
    patrolRange: 200,
    sightRadius: 300,
    attack: { type: 'melee', damage: 12, range: 50, cooldown: 1.6 },
    loot: { min: 4, max: 8 },
    visionAngle: 120,
    variations: [
      { label: 'Swift', speedMultiplier: 1.35 },
      { label: 'Savage', damageMultiplier: 1.35 },
      { label: 'Stalwart', healthMultiplier: 1.45, speedMultiplier: 0.85 },
    ],
  },
  {
    key: 'anomalyDrone',
    name: 'Anomaly Drone',
    tint: 0x66d9ff,
    maxHealth: 40,
    speed: 150,
    patrolRange: 220,
    sightRadius: 280,
    attack: {
      type: 'projectile',
      damage: 7,
      range: 240,
      cooldown: 1.8,
      projectile: { speed: 320, ttl: 1.8 },
    },
    loot: { min: 3, max: 7 },
    visionAngle: 140,
    variations: [
      { label: 'Piercing', damageMultiplier: 1.35 },
      { label: 'Hasty', speedMultiplier: 1.25 },
    ],
  },
  {
    key: 'fractalKnight',
    name: 'Fractal Knight',
    tint: 0xffb347,
    maxHealth: 90,
    speed: 100,
    patrolRange: 140,
    sightRadius: 260,
    attack: { type: 'melee', damage: 16, range: 48, cooldown: 1.2 },
    loot: { min: 6, max: 10 },
    visionAngle: 105,
    variations: [
      { label: 'Vanguard', damageMultiplier: 1.2, healthMultiplier: 1.15 },
      { label: 'Juggernaut', healthMultiplier: 1.35, speedMultiplier: 0.8 },
    ],
  },
  {
    key: 'echoCaster',
    name: 'Echo Caster',
    tint: 0x9af09a,
    maxHealth: 55,
    speed: 90,
    patrolRange: 180,
    sightRadius: 320,
    attack: {
      type: 'projectile',
      damage: 10,
      range: 300,
      cooldown: 2.2,
      projectile: { speed: 260, ttl: 2.4, spread: 15 },
    },
    loot: { min: 5, max: 9 },
    visionAngle: 160,
    variations: [
      { label: 'Volley', damageMultiplier: 0.9, burstCount: 3 },
      { label: 'Focus', damageMultiplier: 1.2, cooldownMultiplier: 0.85 },
    ],
  },
  {
    key: 'phaseWarden',
    name: 'Phase Warden',
    tint: 0xff66cc,
    maxHealth: 110,
    speed: 95,
    patrolRange: 200,
    sightRadius: 300,
    attack: { type: 'melee', damage: 20, range: 56, cooldown: 1.7 },
    loot: { min: 8, max: 12 },
    visionAngle: 100,
    variations: [
      { label: 'Aegis', healthMultiplier: 1.4 },
      { label: 'Reaver', damageMultiplier: 1.4, cooldownMultiplier: 1.15 },
    ],
  },
  {
    key: 'warpStriker',
    name: 'Warp Striker',
    tint: 0x66ffaa,
    maxHealth: 65,
    speed: 170,
    patrolRange: 260,
    sightRadius: 340,
    attack: { type: 'melee', damage: 14, range: 44, cooldown: 1 },
    loot: { min: 5, max: 9 },
    visionAngle: 130,
    variations: [
      { label: 'Blink', speedMultiplier: 1.4 },
      { label: 'Vicious', damageMultiplier: 1.25 },
      { label: 'Resilient', healthMultiplier: 1.2 },
    ],
  },
  {
    key: 'nullArcher',
    name: 'Null Archer',
    tint: 0xcba6f7,
    maxHealth: 50,
    speed: 120,
    patrolRange: 210,
    sightRadius: 360,
    attack: {
      type: 'projectile',
      damage: 12,
      range: 320,
      cooldown: 1.6,
      projectile: { speed: 360, ttl: 2.1 },
    },
    loot: { min: 4, max: 7 },
    visionAngle: 150,
    variations: [
      { label: 'Burst', burstCount: 2, cooldownMultiplier: 1.2 },
      { label: 'Sharpshot', damageMultiplier: 1.4, cooldownMultiplier: 1.3 },
    ],
  },
  {
    key: 'glimmerHulk',
    name: 'Glimmer Hulk',
    tint: 0xffde59,
    maxHealth: 160,
    speed: 80,
    patrolRange: 120,
    sightRadius: 260,
    attack: { type: 'melee', damage: 24, range: 60, cooldown: 2 },
    loot: { min: 10, max: 16 },
    visionAngle: 95,
    variations: [
      { label: 'Siege', damageMultiplier: 1.25 },
      { label: 'Titan', healthMultiplier: 1.5, speedMultiplier: 0.75 },
    ],
  },
  {
    key: 'voidSavant',
    name: 'Void Savant',
    tint: 0x4f6cff,
    maxHealth: 70,
    speed: 100,
    patrolRange: 180,
    sightRadius: 360,
    attack: {
      type: 'projectile',
      damage: 14,
      range: 340,
      cooldown: 2,
      projectile: { speed: 300, ttl: 2.6, zigzag: true },
    },
    loot: { min: 6, max: 11 },
    visionAngle: 170,
    variations: [
      { label: 'Storm', burstCount: 3, cooldownMultiplier: 1.3 },
      { label: 'Focus', damageMultiplier: 1.35, cooldownMultiplier: 0.9 },
    ],
  },
];

export function resolveEnemyVariant(baseVariant) {
  const variant = { ...baseVariant };
  const mutation = Phaser.Utils.Array.GetRandom(variant.variations ?? []);
  const resolved = {
    ...variant,
    label: mutation?.label ?? variant.name,
    maxHealth: Math.round((variant.maxHealth ?? 50) * (mutation?.healthMultiplier ?? 1)),
    speed: Math.round((variant.speed ?? 100) * (mutation?.speedMultiplier ?? 1)),
    sightRadius: Math.round((variant.sightRadius ?? 260) * (mutation?.visionMultiplier ?? 1)),
    attack: {
      ...variant.attack,
      damage: Math.round((variant.attack?.damage ?? 10) * (mutation?.damageMultiplier ?? 1)),
      cooldown: Math.max(0.4, (variant.attack?.cooldown ?? 1.2) * (mutation?.cooldownMultiplier ?? 1)),
      burstCount: mutation?.burstCount ?? variant.attack?.burstCount ?? 1,
    },
  };

  if (variant.attack?.projectile) {
    resolved.attack.projectile = { ...variant.attack.projectile };
  }

  resolved.visionAngle = mutation?.visionAngle ?? variant.visionAngle ?? 120;
  resolved.patrolRange = Math.round(variant.patrolRange ?? 180);
  resolved.tint = mutation?.tint ?? variant.tint;
  resolved.loot = variant.loot;

  return resolved;
}
