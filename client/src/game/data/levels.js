export const LEVEL_LAYOUTS = [
  {
    key: 'synth-ramparts',
    playerSpawn: { x: 100, y: 420 },
    portal: { x: 900, y: 420 },
    platforms: [
      { x: 480, y: 520, scaleX: 2.5, scaleY: 1 },
      { x: 260, y: 380, scaleX: 0.9, scaleY: 1 },
      { x: 540, y: 320, scaleX: 0.8, scaleY: 1 },
      { x: 760, y: 380, scaleX: 1, scaleY: 1 },
    ],
    spawns: [
      { x: 220, y: 340 },
      { x: 520, y: 280 },
      { x: 780, y: 340 },
      { x: 420, y: 480 },
    ],
    bossSpawn: { x: 700, y: 420 },
  },
  {
    key: 'fractured-overpass',
    playerSpawn: { x: 120, y: 420 },
    portal: { x: 880, y: 360 },
    platforms: [
      { x: 480, y: 520, scaleX: 2.4, scaleY: 1 },
      { x: 160, y: 440, scaleX: 0.6, scaleY: 1 },
      { x: 360, y: 360, scaleX: 0.8, scaleY: 1 },
      { x: 620, y: 300, scaleX: 0.9, scaleY: 1 },
      { x: 820, y: 260, scaleX: 0.6, scaleY: 1 },
    ],
    spawns: [
      { x: 140, y: 400 },
      { x: 340, y: 320 },
      { x: 620, y: 260 },
      { x: 820, y: 220 },
      { x: 520, y: 480 },
    ],
    bossSpawn: { x: 700, y: 420 },
  },
  {
    key: 'neon-foundry',
    playerSpawn: { x: 140, y: 380 },
    portal: { x: 880, y: 300 },
    platforms: [
      { x: 480, y: 520, scaleX: 2.6, scaleY: 1 },
      { x: 240, y: 420, scaleX: 0.7, scaleY: 1 },
      { x: 480, y: 360, scaleX: 0.9, scaleY: 1 },
      { x: 720, y: 300, scaleX: 1, scaleY: 1 },
      { x: 500, y: 220, scaleX: 0.7, scaleY: 1 },
    ],
    spawns: [
      { x: 240, y: 380 },
      { x: 480, y: 320 },
      { x: 720, y: 260 },
      { x: 520, y: 180 },
      { x: 380, y: 480 },
    ],
    bossSpawn: { x: 640, y: 420 },
  },
  {
    key: 'quantum-skyway',
    playerSpawn: { x: 120, y: 360 },
    portal: { x: 900, y: 240 },
    platforms: [
      { x: 460, y: 520, scaleX: 2.3, scaleY: 1 },
      { x: 180, y: 420, scaleX: 0.7, scaleY: 1 },
      { x: 360, y: 300, scaleX: 0.7, scaleY: 1 },
      { x: 580, y: 380, scaleX: 0.8, scaleY: 1 },
      { x: 780, y: 320, scaleX: 0.7, scaleY: 1 },
      { x: 860, y: 220, scaleX: 0.6, scaleY: 1 },
    ],
    spawns: [
      { x: 160, y: 380 },
      { x: 360, y: 260 },
      { x: 580, y: 340 },
      { x: 780, y: 280 },
      { x: 860, y: 180 },
    ],
    bossSpawn: { x: 720, y: 360 },
  },
  {
    key: 'rift-spires',
    playerSpawn: { x: 140, y: 300 },
    portal: { x: 880, y: 180 },
    platforms: [
      { x: 460, y: 520, scaleX: 2.2, scaleY: 1 },
      { x: 220, y: 420, scaleX: 0.7, scaleY: 1 },
      { x: 420, y: 340, scaleX: 0.8, scaleY: 1 },
      { x: 640, y: 280, scaleX: 0.9, scaleY: 1 },
      { x: 820, y: 220, scaleX: 0.7, scaleY: 1 },
      { x: 620, y: 160, scaleX: 0.6, scaleY: 1 },
    ],
    spawns: [
      { x: 220, y: 380 },
      { x: 420, y: 300 },
      { x: 640, y: 240 },
      { x: 820, y: 180 },
      { x: 500, y: 480 },
    ],
    bossSpawn: { x: 700, y: 300 },
  },
];

export function getLevelLayout(level) {
  const index = (level - 1) % LEVEL_LAYOUTS.length;
  return LEVEL_LAYOUTS[index];
}
