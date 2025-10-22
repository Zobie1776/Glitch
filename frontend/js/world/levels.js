const BASE_LEVEL = {
  width: 1920,
  playerSpawn: { x: 160, y: 400 },
  portal: { x: 1820, y: 320 },
  platforms: [
    { x: 100, y: 480, scaleX: 1.4 },
    { x: 340, y: 420, scaleX: 1.2 },
    { x: 620, y: 360, scaleX: 1.3 },
    { x: 860, y: 300, scaleX: 1.1 },
    { x: 1120, y: 280, scaleX: 1.4 },
    { x: 1380, y: 320, scaleX: 1.2 },
    { x: 1640, y: 360, scaleX: 1.2 }
  ],
  gems: [
    { x: 340, y: 360 },
    { x: 620, y: 300 },
    { x: 1120, y: 220 },
    { x: 1380, y: 260 }
  ],
  enemies: [
    { x: 560, y: 320, minX: 520, maxX: 700, patrolSpeed: 80 },
    { x: 1280, y: 280, minX: 1240, maxX: 1440, patrolSpeed: -100 }
  ]
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export const LEVEL_DATA = Array.from({ length: 50 }).map((_, index) => {
  const levelNumber = index + 1;
  const level = clone(BASE_LEVEL);
  const difficultyMultiplier = 1 + Math.floor(levelNumber / 5) * 0.15;

  level.platforms = level.platforms.map((platform, i) => ({
    ...platform,
    x: platform.x + index * 12 + i * 6,
    y: platform.y - Math.sin((index + i) * 0.6) * 30
  }));

  level.gems = level.gems.map((gem) => ({
    ...gem,
    x: gem.x + index * 10,
    y: gem.y - Math.cos((index + gem.x) * 0.03) * 20
  }));

  level.enemies = level.enemies.map((enemy, enemyIndex) => ({
    ...enemy,
    x: enemy.x + index * 14 + enemyIndex * 40,
    patrolSpeed: enemy.patrolSpeed * difficultyMultiplier
  }));

  if (levelNumber % 10 === 0) {
    level.enemies.push({
      x: 1500,
      y: 220,
      minX: 1320,
      maxX: 1800,
      patrolSpeed: 140 * difficultyMultiplier,
      boss: true
    });
    level.gems.push({ x: 1520, y: 180 });
    level.portal.x += 40;
  }

  level.portal.y = 240 - Math.sin(levelNumber * 0.3) * 40;

  return level;
});
