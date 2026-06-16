import { getLevelLayout } from '../data/levelLayouts.js';
import { getEnemyCount, getEnemyPool, scaleEnemyConfig, ENEMY_CONFIGS } from '../data/enemyConfig.js';
import BasicChaser from '../entities/enemies/BasicChaser.js';
import Attacker from '../entities/enemies/Attacker.js';
import FastEnemy from '../entities/enemies/FastEnemy.js';
import HeavyEnemy from '../entities/enemies/HeavyEnemy.js';
import TeleporterEnemy from '../entities/enemies/TeleporterEnemy.js';
import { PLATFORM_DEPTH, PICKUP_DEPTH } from '../constants.js';

const ENEMY_CLASSES = { basicChaser: BasicChaser, attacker: Attacker, fastEnemy: FastEnemy, heavyEnemy: HeavyEnemy, teleporter: TeleporterEnemy };

export default class LevelSystem {
  constructor(scene) {
    this.scene = scene;
    this.layout = null;
    this.portal = null;
    this.portalUnlocked = false;
    this.totalEnemies = 0;
    this.deadEnemies = 0;
    this.pickups = [];
    this.hazards = [];
  }

  loadLevel(levelNumber) {
    this.layout = getLevelLayout(levelNumber);
    this.portalUnlocked = false;
    this.deadEnemies = 0;
    this.pickups = [];
    this.hazards = [];

    // Background
    this.scene.cameras.main.setBackgroundColor(this.layout.bgColor || 0x05030a);

    // Background grid decoration
    this._drawBackgroundGrid();

    // Platforms
    this._buildPlatforms();

    // Hazards
    if (this.layout.hazards) {
      this._buildHazards();
    }

    // Portal (locked)
    this._createPortal();

    // Enemies
    if (!this.layout.isBossLevel) {
      this._spawnEnemies(levelNumber);
    }

    // Player spawn
    const spawn = this.layout.playerSpawn;
    this.scene.player.setPosition(spawn.x, spawn.y);
    this.scene.player.body.reset(spawn.x, spawn.y);

    // Camera bounds
    this.scene.cameras.main.setBounds(0, 0, 2560, 720);
    this.scene.physics.world.setBounds(0, 0, 2560, 720);

    // Tutorial text for level 1
    if (levelNumber === 1) this._showLevel1Tutorial();

    this.scene.events.emit('level:loaded', { levelNumber, layout: this.layout });
  }

  _drawBackgroundGrid() {
    const g = this.scene.add.graphics().setScrollFactor(0.2).setDepth(1).setAlpha(0.12);
    g.lineStyle(1, 0x00ffee, 1);
    for (let x = 0; x < 2560; x += 80) g.lineBetween(x, 0, x, 720);
    for (let y = 0; y < 720; y += 80) g.lineBetween(0, y, 2560, y);
  }

  _buildPlatforms() {
    // Clear existing platforms
    this.scene.platforms.clear(true, true);

    const color = this.layout.platformColor || 0x334466;

    this.layout.platforms.forEach(p => {
      // Create a visual rectangle
      const visual = this.scene.add.rectangle(
        p.x + p.width / 2, p.y + p.height / 2,
        p.width, p.height, color
      ).setDepth(PLATFORM_DEPTH);

      // Add subtle border
      const border = this.scene.add.rectangle(
        p.x + p.width / 2, p.y + 2,
        p.width, 3, 0x00ffee
      ).setDepth(PLATFORM_DEPTH + 1).setAlpha(0.3);

      // Physics static body
      const body = this.scene.physics.add.staticImage(
        p.x + p.width / 2, p.y + p.height / 2, '__DEFAULT'
      ).setAlpha(0).setDisplaySize(p.width, p.height);
      body.refreshBody();
      this.scene.platforms.add(body);

      // Store for cleanup
      body._visual = visual;
      body._border = border;
    });
  }

  _buildHazards() {
    this.layout.hazards.forEach(h => {
      if (h.type === 'spike') {
        const vis = this.scene.add.triangle(
          h.x + h.width / 2, h.y,
          0, h.height, h.width / 2, 0, h.width, h.height,
          0xff2200
        ).setDepth(PLATFORM_DEPTH + 1);

        const body = this.scene.physics.add.staticImage(h.x + h.width / 2, h.y + h.height / 2, '__DEFAULT')
          .setAlpha(0).setDisplaySize(h.width, h.height);
        body.refreshBody();
        body._hazardDamage = h.damage;
        body._visual = vis;
        this.hazards.push(body);

        // Hazard overlap with player
        this.scene.physics.add.overlap(this.scene.player, body, () => {
          this.scene.player.takeDamage(h.damage);
        });
      }
    });
  }

  _createPortal() {
    if (this.portal) this.portal.destroy();
    const pos = this.layout.portalPos;
    this.portal = this.scene.add.container(pos.x, pos.y).setDepth(30);

    // Portal visual
    const outerRing = this.scene.add.circle(0, 0, 22, 0x334466, 1);
    const innerGlow = this.scene.add.circle(0, 0, 14, 0x001122, 1);
    const crossH = this.scene.add.rectangle(0, 0, 20, 3, 0x555566);
    const crossV = this.scene.add.rectangle(0, 0, 3, 20, 0x555566);
    this.portal.add([outerRing, innerGlow, crossH, crossV]);

    this.portal._outerRing = outerRing;
    this.portal._innerGlow = innerGlow;
    this.portal._crossH = crossH;
    this.portal._crossV = crossV;
    this.portal._unlocked = false;

    // Overlap detection (use a static body at portal location)
    this.portalBody = this.scene.physics.add.staticImage(pos.x, pos.y, '__DEFAULT')
      .setAlpha(0).setDisplaySize(44, 60);
    this.portalBody.refreshBody();

    this.scene.physics.add.overlap(this.scene.player, this.portalBody, () => {
      if (this.portal._unlocked) this._onPortalEnter();
    });
  }

  _spawnEnemies(levelNumber) {
    this.scene.enemies.clear(true, true);
    const count = getEnemyCount(levelNumber);
    const pool = getEnemyPool(levelNumber);
    const spawns = this.layout.enemySpawns;
    this.totalEnemies = Math.min(count, spawns.length);
    this.deadEnemies = 0;

    for (let i = 0; i < this.totalEnemies; i++) {
      const spawnPos = spawns[i % spawns.length];
      const enemyKey = pool[i % pool.length];
      const EnemyClass = ENEMY_CLASSES[enemyKey];
      if (!EnemyClass) continue;

      const scaledConfig = scaleEnemyConfig(ENEMY_CONFIGS[enemyKey], levelNumber);
      const enemy = new EnemyClass(this.scene, spawnPos.x, spawnPos.y, scaledConfig);
      this.scene.enemies.add(enemy);
    }

    // Track death count
    this.scene.events.on('enemy:died', this._onEnemyDied, this);
    this.scene.events.on('enemy:loot', this._onLoot, this);
  }

  _onEnemyDied() {
    this.deadEnemies++;
    this.checkPortalUnlock();
  }

  _onLoot({ x, y, gems, xp }) {
    // Spawn pickup visuals
    const gemPick = this.scene.add.circle(x + Phaser.Math.Between(-20, 20), y - 10, 6, 0x00ffee, 1).setDepth(PICKUP_DEPTH);
    const xpPick = this.scene.add.circle(x + Phaser.Math.Between(-20, 20), y - 15, 5, 0xaa00ff, 1).setDepth(PICKUP_DEPTH);

    // Float up
    this.scene.tweens.add({ targets: [gemPick, xpPick], y: '-=30', alpha: { from: 1, to: 0 }, duration: 800, delay: 400,
      onComplete: () => { gemPick.destroy(); xpPick.destroy(); }
    });

    // Apply to player
    this.scene.player.collectGem(gems);
    this.scene.player.gainXP(xp);
  }

  checkPortalUnlock() {
    if (this.portal?._unlocked) return;
    const allDead = this.totalEnemies > 0 && this.deadEnemies >= this.totalEnemies;
    if (allDead || this.totalEnemies === 0) {
      this._unlockPortal();
    }
  }

  _unlockPortal() {
    if (!this.portal || this.portal._unlocked) return;
    this.portal._unlocked = true;

    // Visual transformation
    this.portal._outerRing.setFillStyle(0x00ffee);
    this.portal._innerGlow.setFillStyle(0x003344);
    this.portal._crossH.destroy();
    this.portal._crossV.destroy();

    // Pulsing glow
    this.scene.tweens.add({
      targets: this.portal._outerRing,
      scaleX: 1.15, scaleY: 1.15, alpha: { from: 1, to: 0.7 },
      duration: 700, yoyo: true, repeat: -1,
    });

    // Text hint
    const hint = this.scene.add.text(this.portal.x, this.portal.y - 50, 'PORTAL OPEN\n[WALK IN]', {
      fontSize: '11px', fill: '#00ffee', align: 'center',
    }).setOrigin(0.5).setDepth(35).setScrollFactor(1);
    this.scene.tweens.add({ targets: hint, alpha: { from: 0, to: 1 }, duration: 400 });

    this.scene.cameras.main.flash(200, 0, 255, 238, false);
    this.scene.events.emit('portal:unlocked');
  }

  _onPortalEnter() {
    if (this._portalUsed) return;
    this._portalUsed = true;
    this.scene.cameras.main.flash(400, 0, 255, 238, false);
    this.scene.time.delayedCall(400, () => {
      this.scene.events.emit('portal:enter', { level: this.scene.currentLevel });
    });
  }

  _showLevel1Tutorial() {
    const texts = [
      { text: 'A/D or ←/→ to MOVE', x: 120, y: 500, delay: 500 },
      { text: 'SPACE to JUMP (double jump!)', x: 400, y: 380, delay: 1200 },
      { text: 'SHIFT to ATTACK', x: 700, y: 300, delay: 2000 },
      { text: 'Z/C/V to use GLITCHES', x: 980, y: 320, delay: 2800 },
      { text: 'Kill all enemies → open portal', x: 1300, y: 400, delay: 3600 },
    ];
    texts.forEach(t => {
      this.scene.time.delayedCall(t.delay, () => {
        const txt = this.scene.add.text(t.x, t.y, t.text, {
          fontSize: '13px', fill: '#ffffff', backgroundColor: '#00000088', padding: { x: 6, y: 3 },
        }).setDepth(90).setScrollFactor(1);
        this.scene.tweens.add({ targets: txt, alpha: { from: 0, to: 1 }, duration: 300 });
        this.scene.time.delayedCall(4000, () => {
          this.scene.tweens.add({ targets: txt, alpha: 0, duration: 600, onComplete: () => txt.destroy() });
        });
      });
    });
  }

  cleanup() {
    this.scene.events.off('enemy:died', this._onEnemyDied, this);
    this.scene.events.off('enemy:loot', this._onLoot, this);
    this._portalUsed = false;
  }
}
