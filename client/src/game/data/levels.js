const BIOMES = [
  { id: 'forest', name: 'Neon Canopy', tileset: 'forest', palette: '#0d1c17', backgrounds: ['canopy-near', 'canopy-far'] },
  { id: 'industrial', name: 'Steelworks', tileset: 'industrial', palette: '#11121f', backgrounds: ['factory-near', 'factory-far'] },
  { id: 'urban', name: 'Arcade Ward', tileset: 'urban', palette: '#0f0f1d', backgrounds: ['city-neon', 'city-far'] },
  { id: 'skyline', name: 'Chromatic City', tileset: 'city', palette: '#090c1f', backgrounds: ['skyline-near', 'skyline-far'] },
  { id: 'desert', name: 'Gilded Expanse', tileset: 'desert', palette: '#1b1108', backgrounds: ['dune-near', 'dune-far'] },
];

const BASE_PATTERNS = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

export const LEVEL_LAYOUTS = BIOMES.flatMap((biome, biomeIndex) => {
  return Array.from({ length: 10 }).map((_, index) => {
    const levelNumber = biomeIndex * 10 + index + 1;
    const basePattern = BASE_PATTERNS[index % BASE_PATTERNS.length];
    const heightOffset = (index % 3) * 20;
    const horizontalOffset = (index % 2 === 0 ? 1 : -1) * 20;
    const scaledPlatforms = basePattern.platforms.map((platform, idx) => ({
      ...platform,
      x: platform.x + horizontalOffset * (idx % 2 === 0 ? 1 : -1),
      y: platform.y - heightOffset,
    }));
    const scaledSpawns = basePattern.spawns.map((spawn) => ({
      x: spawn.x + horizontalOffset,
      y: spawn.y - heightOffset,
    }));
    return {
      key: `${biome.id}-${levelNumber}`,
      number: levelNumber,
      biome: biome.id,
      biomeName: biome.name,
      tileset: biome.tileset,
      palette: biome.palette,
      backgrounds: biome.backgrounds,
      playerSpawn: { x: 100, y: 420 - heightOffset },
      portal: { x: 900, y: 360 - heightOffset },
      platforms: scaledPlatforms,
      spawns: scaledSpawns,
      bossSpawn: { x: 720, y: 360 - heightOffset },
      structures: index % 2 === 0 ? ['tower', 'bridge'] : ['archive', 'monolith'],
    };
  });
});

export function getLevelLayout(level) {
  const index = (level - 1) % LEVEL_LAYOUTS.length;
  return LEVEL_LAYOUTS[index];
}
