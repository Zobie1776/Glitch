import { BIOMES } from '../constants.js';
/* global Phaser */

// World is 2560×720 per level. Camera follows player.
// Platform format: { x, y, width, height }
// Player/portal positions are world coords.

// Base platform templates per phase complexity (5 templates × 5 phases = 25 combos)
const PHASE_TEMPLATES = [
  // Phase 1 (levels 1-10): Simple, flat, intro
  [
    { // L1
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60  }, // ground
        { x: 300,  y: 500, w: 200,  h: 20  },
        { x: 640,  y: 420, w: 200,  h: 20  },
        { x: 980,  y: 360, w: 180,  h: 20  },
        { x: 1320, y: 420, w: 200,  h: 20  },
        { x: 1680, y: 360, w: 200,  h: 20  },
        { x: 2020, y: 480, w: 180,  h: 20  },
      ],
      enemySpawns: [{ x: 400, y: 620 }, { x: 700, y: 380 }, { x: 1050, y: 620 }, { x: 1400, y: 380 }],
      playerSpawn: { x: 120, y: 580 }, portalPos: { x: 2380, y: 600 },
    },
    { // L2
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60 },
        { x: 200,  y: 520, w: 180,  h: 20 },
        { x: 480,  y: 440, w: 200,  h: 20 },
        { x: 760,  y: 380, w: 160,  h: 20 },
        { x: 1040, y: 440, w: 200,  h: 20 },
        { x: 1360, y: 360, w: 200,  h: 20 },
        { x: 1640, y: 440, w: 180,  h: 20 },
        { x: 1960, y: 380, w: 200,  h: 20 },
        { x: 2240, y: 480, w: 180,  h: 20 },
      ],
      enemySpawns: [{ x: 280, y: 480 }, { x: 560, y: 400 }, { x: 840, y: 620 }, { x: 1120, y: 400 }, { x: 1500, y: 320 }],
      playerSpawn: { x: 120, y: 580 }, portalPos: { x: 2400, y: 580 },
    },
    { // L3
      platforms: [
        { x: 0,    y: 660, w: 800,  h: 60 },
        { x: 900,  y: 660, w: 600,  h: 60 },
        { x: 1600, y: 660, w: 960,  h: 60 },
        { x: 300,  y: 520, w: 200,  h: 20 },
        { x: 600,  y: 440, w: 200,  h: 20 },
        { x: 900,  y: 380, w: 160,  h: 20 },
        { x: 1200, y: 440, w: 200,  h: 20 },
        { x: 1500, y: 360, w: 200,  h: 20 },
        { x: 1800, y: 440, w: 200,  h: 20 },
        { x: 2100, y: 380, w: 200,  h: 20 },
      ],
      enemySpawns: [{ x: 380, y: 480 }, { x: 680, y: 400 }, { x: 980, y: 340 }, { x: 1280, y: 400 }, { x: 1600, y: 320 }, { x: 1900, y: 400 }],
      playerSpawn: { x: 120, y: 580 }, portalPos: { x: 2420, y: 600 },
    },
    { // L4
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60 },
        { x: 240,  y: 540, w: 160,  h: 20 },
        { x: 480,  y: 460, w: 180,  h: 20 },
        { x: 720,  y: 380, w: 200,  h: 20 },
        { x: 960,  y: 460, w: 180,  h: 20 },
        { x: 1200, y: 380, w: 200,  h: 20 },
        { x: 1440, y: 300, w: 180,  h: 20 },
        { x: 1680, y: 380, w: 200,  h: 20 },
        { x: 1920, y: 460, w: 180,  h: 20 },
        { x: 2160, y: 380, w: 200,  h: 20 },
      ],
      enemySpawns: [{ x: 320, y: 500 }, { x: 560, y: 420 }, { x: 800, y: 340 }, { x: 1040, y: 420 }, { x: 1280, y: 340 }, { x: 1520, y: 260 }, { x: 1760, y: 340 }],
      playerSpawn: { x: 120, y: 580 }, portalPos: { x: 2380, y: 580 },
    },
    { // L5
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60 },
        { x: 200,  y: 560, w: 160,  h: 20 },
        { x: 440,  y: 480, w: 180,  h: 20 },
        { x: 680,  y: 400, w: 160,  h: 20 },
        { x: 920,  y: 480, w: 180,  h: 20 },
        { x: 1160, y: 360, w: 200,  h: 20 },
        { x: 1400, y: 440, w: 180,  h: 20 },
        { x: 1640, y: 360, w: 200,  h: 20 },
        { x: 1880, y: 280, w: 200,  h: 20 },
        { x: 2120, y: 360, w: 200,  h: 20 },
        { x: 2340, y: 440, w: 180,  h: 20 },
      ],
      enemySpawns: [{ x: 280, y: 520 }, { x: 520, y: 440 }, { x: 760, y: 360 }, { x: 1000, y: 440 }, { x: 1240, y: 320 }, { x: 1480, y: 400 }, { x: 1720, y: 320 }, { x: 1960, y: 240 }],
      playerSpawn: { x: 120, y: 580 }, portalPos: { x: 2440, y: 560 },
    },
    { // L6 — introduces vertical climb
      platforms: [
        { x: 0,    y: 660, w: 600,  h: 60 },
        { x: 700,  y: 660, w: 400,  h: 60 },
        { x: 1200, y: 660, w: 1360, h: 60 },
        { x: 200,  y: 520, w: 200,  h: 20 },
        { x: 480,  y: 420, w: 180,  h: 20 },
        { x: 720,  y: 340, w: 160,  h: 20 },
        { x: 960,  y: 260, w: 200,  h: 20 },
        { x: 1200, y: 340, w: 180,  h: 20 },
        { x: 1480, y: 420, w: 200,  h: 20 },
        { x: 1760, y: 340, w: 200,  h: 20 },
        { x: 2040, y: 260, w: 200,  h: 20 },
        { x: 2280, y: 340, w: 180,  h: 20 },
      ],
      enemySpawns: [{ x: 280, y: 480 }, { x: 560, y: 380 }, { x: 800, y: 300 }, { x: 1040, y: 220 }, { x: 1280, y: 300 }, { x: 1560, y: 380 }, { x: 1840, y: 300 }, { x: 2120, y: 220 }],
      playerSpawn: { x: 100, y: 600 }, portalPos: { x: 2420, y: 560 },
    },
    { // L7
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60 },
        { x: 160,  y: 540, w: 160,  h: 20 },
        { x: 400,  y: 460, w: 200,  h: 20 },
        { x: 680,  y: 380, w: 160,  h: 20 },
        { x: 920,  y: 300, w: 200,  h: 20 },
        { x: 1160, y: 380, w: 200,  h: 20 },
        { x: 1440, y: 300, w: 200,  h: 20 },
        { x: 1720, y: 380, w: 180,  h: 20 },
        { x: 1960, y: 300, w: 200,  h: 20 },
        { x: 2200, y: 220, w: 200,  h: 20 },
      ],
      enemySpawns: [{ x: 240, y: 500 }, { x: 480, y: 420 }, { x: 760, y: 340 }, { x: 1000, y: 260 }, { x: 1240, y: 340 }, { x: 1520, y: 260 }, { x: 1800, y: 340 }, { x: 2040, y: 260 }, { x: 2280, y: 180 }],
      playerSpawn: { x: 100, y: 580 }, portalPos: { x: 2420, y: 560 },
    },
    { // L8
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60 },
        { x: 200,  y: 520, w: 160,  h: 20 },
        { x: 440,  y: 440, w: 160,  h: 20 },
        { x: 680,  y: 360, w: 200,  h: 20 },
        { x: 960,  y: 440, w: 160,  h: 20 },
        { x: 1200, y: 360, w: 200,  h: 20 },
        { x: 1440, y: 280, w: 200,  h: 20 },
        { x: 1680, y: 200, w: 200,  h: 20 },
        { x: 1920, y: 280, w: 200,  h: 20 },
        { x: 2160, y: 200, w: 200,  h: 20 },
        { x: 2360, y: 280, w: 180,  h: 20 },
      ],
      enemySpawns: [{ x: 280, y: 480 }, { x: 520, y: 400 }, { x: 760, y: 320 }, { x: 1040, y: 400 }, { x: 1280, y: 320 }, { x: 1520, y: 240 }, { x: 1760, y: 160 }, { x: 2000, y: 240 }, { x: 2240, y: 160 }],
      playerSpawn: { x: 100, y: 600 }, portalPos: { x: 2440, y: 560 },
    },
    { // L9
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60 },
        { x: 160,  y: 540, w: 160,  h: 20 },
        { x: 380,  y: 460, w: 180,  h: 20 },
        { x: 620,  y: 380, w: 160,  h: 20 },
        { x: 860,  y: 460, w: 200,  h: 20 },
        { x: 1120, y: 380, w: 180,  h: 20 },
        { x: 1380, y: 300, w: 200,  h: 20 },
        { x: 1640, y: 380, w: 200,  h: 20 },
        { x: 1900, y: 300, w: 200,  h: 20 },
        { x: 2160, y: 220, w: 200,  h: 20 },
        { x: 2360, y: 300, w: 180,  h: 20 },
      ],
      enemySpawns: [{ x: 240, y: 500 }, { x: 460, y: 420 }, { x: 700, y: 340 }, { x: 940, y: 420 }, { x: 1200, y: 340 }, { x: 1460, y: 260 }, { x: 1720, y: 340 }, { x: 1980, y: 260 }, { x: 2240, y: 180 }, { x: 2420, y: 560 }],
      playerSpawn: { x: 100, y: 600 }, portalPos: { x: 2460, y: 540 },
    },
    { // L10 — BOSS LEVEL
      platforms: [
        { x: 0,    y: 660, w: 2560, h: 60 },
        { x: 200,  y: 500, w: 200,  h: 20 },
        { x: 520,  y: 420, w: 200,  h: 20 },
        { x: 840,  y: 340, w: 200,  h: 20 },
        { x: 1160, y: 420, w: 280,  h: 20 },
        { x: 1520, y: 340, w: 200,  h: 20 },
        { x: 1840, y: 420, w: 200,  h: 20 },
        { x: 2140, y: 500, w: 200,  h: 20 },
      ],
      enemySpawns: [],
      bossSpawn: { x: 1280, y: 380 },
      playerSpawn: { x: 120, y: 600 }, portalPos: { x: 2440, y: 600 },
    },
  ],
];

// Generate all 50 levels
export const LEVEL_LAYOUTS = [];

for (let biomeIdx = 0; biomeIdx < 5; biomeIdx++) {
  const biome = BIOMES[biomeIdx];
  for (let levelInBiome = 0; levelInBiome < 10; levelInBiome++) {
    const levelNumber = biomeIdx * 10 + levelInBiome + 1;
    const template = PHASE_TEMPLATES[0][levelInBiome]; // use phase 1 templates, adapt

    // Scale vertical complexity by biome (later biomes = more vertical)
    const vertOffset = biomeIdx * 30;
    const scaledPlatforms = template.platforms.map(p => ({
      x: p.x, y: Math.max(100, p.y - vertOffset), width: p.w, height: p.h,
    }));

    LEVEL_LAYOUTS.push({
      levelNumber,
      biome: biome.id,
      biomeName: biome.name,
      bgColor: biome.bgColor,
      platformColor: biome.platformColor,
      playerSpawn: { ...template.playerSpawn },
      portalPos: { ...template.portalPos },
      bossSpawn: template.bossSpawn ? { ...template.bossSpawn } : null,
      isBossLevel: levelNumber % 10 === 0,
      platforms: scaledPlatforms,
      enemySpawns: template.enemySpawns.map(s => ({ ...s })),
      hazards: biomeIdx >= 2 ? generateHazards(levelNumber) : [],
    });
  }
}

function generateHazards(level) {
  const hazards = [];
  const count = Math.min(Math.floor((level - 20) / 5), 4);
  for (let i = 0; i < count; i++) {
    hazards.push({
      type: 'spike',
      x: 400 + i * 450,
      y: 640,
      width: 60,
      height: 20,
      damage: 15,
    });
  }
  return hazards;
}

export function getLevelLayout(level) {
  const idx = ((level - 1) % LEVEL_LAYOUTS.length);
  return LEVEL_LAYOUTS[idx];
}
