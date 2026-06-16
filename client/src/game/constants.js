export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const WORLD_WIDTH = 2560;
export const WORLD_HEIGHT = 720;
export const GRAVITY = 1200;

export const PLAYER_SPEED = 280;
export const PLAYER_JUMP = -680;
export const PLAYER_DOUBLE_JUMP = -560;
export const PLAYER_MELEE_RANGE = 65;
export const PLAYER_MELEE_DAMAGE = 20;
export const PLAYER_MELEE_COOLDOWN = 0.5;
export const PLAYER_IFRAME_DURATION = 0.4;
export const PLAYER_KNOCKBACK_X = 220;
export const PLAYER_KNOCKBACK_Y = -180;
export const HITSTOP_MS = 80;

export const PLATFORM_DEPTH = 10;
export const PLAYER_DEPTH = 20;
export const ENEMY_DEPTH = 15;
export const PROJECTILE_DEPTH = 18;
export const PICKUP_DEPTH = 12;
export const UI_DEPTH = 100;
export const EFFECT_DEPTH = 50;

export const TOTAL_LEVELS = 50;
export const BOSS_EVERY_N = 10;
export const ARENA_DURATION = 30;
export const BASE_GLITCH_SLOTS = 10;
export const SPECIAL_GLITCH_SLOTS = 5;

export const XP_BASE = 100;
export const XP_SCALE = 60;

export const BIOMES = [
  { id: 'neon_canopy',    name: 'Neon Canopy',    bgColor: 0x0d1c17, platformColor: 0x1a4a2a },
  { id: 'steelworks',     name: 'Steelworks',     bgColor: 0x11121f, platformColor: 0x2a2a4a },
  { id: 'arcade_ward',    name: 'Arcade Ward',    bgColor: 0x0f0f1d, platformColor: 0x3a1a3a },
  { id: 'chromatic_city', name: 'Chromatic City', bgColor: 0x090c1f, platformColor: 0x1a2a4a },
  { id: 'gilded_expanse', name: 'Gilded Expanse', bgColor: 0x1b1108, platformColor: 0x4a3a1a },
];

export const PHASE_ENEMY_POOLS = [
  ['basicChaser', 'attacker'],
  ['basicChaser', 'attacker', 'fastEnemy'],
  ['attacker', 'fastEnemy', 'heavyEnemy'],
  ['fastEnemy', 'heavyEnemy', 'teleporter'],
  ['attacker', 'fastEnemy', 'heavyEnemy', 'teleporter'],
];

export const STORY_BEATS = {
  1:  'You awaken inside the Rift. Reality fragments around you.',
  2:  'The corruption spreads. But you can feel it — responding.',
  3:  'Every glitch you trigger is a crack in their control.',
  4:  'The deeper you go, the more unstable things become.',
  5:  'You can weaponize this. The glitches obey you now.',
  6:  'Entities hunt you. They were once like you.',
  7:  'A signal pulses from deep within the Rift. A warning? An invitation?',
  8:  'The architecture here is wrong. Corrupted. Beautiful.',
  9:  'Something massive is waiting at the end of this layer.',
  10: 'The NULLIFIER appears. First guardian of the deeper Rift.',
  11: 'You descend into the Steelworks. The code here is dense — industrial.',
  12: 'Machines that once served now guard the corruption.',
  14: 'You exploit a timing anomaly. Time here flows differently.',
  15: 'Halfway through the Steelworks. The pressure increases.',
  18: 'You find a fragment of your original memory. It hurts.',
  20: 'VECTOR PRIME falls. The Rift groans under your power.',
  21: 'The Arcade Ward pulses with chaotic neon. Beautiful and lethal.',
  25: 'You master the Reality Tear. Nothing is stable here.',
  30: 'FRACTAL ARCHON crumbles. Three phases. Three victories.',
  31: 'The Chromatic City. A ghost of what the digital world once was.',
  35: 'Time begins to loop. You use it against them.',
  40: 'SYSTEM WRAITH defeated. One layer remains.',
  41: 'The Gilded Expanse. The final corruption. Maximum instability.',
  45: 'You chain glitches together like a symphony of chaos.',
  49: 'The Core awaits. This is what the Rift was built to protect.',
  50: 'CORE//COLLAPSE. The final battle. The Rift itself fights back.',
};
