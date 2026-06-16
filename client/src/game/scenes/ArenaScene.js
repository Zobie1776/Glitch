import Player from '../entities/Player.js';
import GlitchSystem from '../systems/GlitchSystem.js';
import BasicChaser from '../entities/enemies/BasicChaser.js';
import Attacker from '../entities/enemies/Attacker.js';
import FastEnemy from '../entities/enemies/FastEnemy.js';
import HeavyEnemy from '../entities/enemies/HeavyEnemy.js';
import HUD from '../ui/HUD.js';
import GlitchCooldownUI from '../ui/GlitchCooldownUI.js';
import MobileControls from '../ui/MobileControls.js';
import { GAME_WIDTH, GAME_HEIGHT, ARENA_DURATION } from '../constants.js';
import { scaleEnemyConfig, ENEMY_CONFIGS } from '../data/enemyConfig.js';

export default class ArenaScene extends Phaser.Scene {
  constructor() { super({ key: 'ArenaScene' }); }

  init(data) {
    this.returnLevel = data.returnLevel || 1;
    this.returnPos = data.returnPos || { x: 120, y: 400 };
    this.levelScale = data.levelScale || 1;
    this.savedGlitches = data.glitches;
    this.savedPlayer = data.playerData;
  }

  create() {
    this.timeLeft = ARENA_DURATION;
    this.waveTimer = 0;
    this.waveCount = 0;
    this._done = false;

    // Background
    this.cameras.main.setBackgroundColor(0x0a0005);
    this._drawArenaBackground();

    // Platforms — simple arena
    this.platforms = this.physics.add.staticGroup();
    this._buildArena();

    // Systems
    this.glitchSystem = new GlitchSystem(this);
    if (this.savedGlitches) this.glitchSystem.deserialize(this.savedGlitches);

    // Player
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT - 100, this.glitchSystem);
    if (this.savedPlayer) {
      this.player.health = this.savedPlayer.health;
      this.player.maxHealth = this.savedPlayer.maxHealth;
      this.player.level = this.savedPlayer.level;
      this.player.xp = this.savedPlayer.xp;
      this.player.gems = this.savedPlayer.gems;
    }

    // Enemies group
    this.enemies = this.physics.add.group({ runChildUpdate: false });

    // Physics
    this.platformCollider = this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (enemy.isAttacking) player.takeDamage(enemy.attackDamage || 10, { x: enemy.x, y: enemy.y });
    });

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.glitchKeys = {
      0: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      1: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V),
    };

    // UI
    this.hud = new HUD(this, this.player);
    this.glitchUI = new GlitchCooldownUI(this, this.glitchSystem);
    this.mobileControls = new MobileControls(this);

    // Arena timer
    this._buildTimerUI();

    // Intro text
    this._showIntro();

    // Enemy death tracking
    this.events.on('enemy:died', () => {}, this);
    this.events.on('enemy:loot', ({ gems, xp }) => {
      this.player.collectGem(gems);
      this.player.gainXP(xp);
    }, this);

    // Camera — fixed for arena
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setScroll(0, 0);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  update(time, delta) {
    if (this._done) return;
    const dt = delta / 1000;

    // Check death
    if (this.player.isDead()) {
      this._done = true;
      this.time.delayedCall(800, () => {
        this.scene.start('GameOverScene', { level: this.returnLevel, gems: this.player.gems });
      });
      return;
    }

    // Countdown
    this.timeLeft -= dt;
    this._updateTimerUI();

    if (this.timeLeft <= 0) {
      this._victory();
      return;
    }

    // Spawn waves every 5s
    this.waveTimer += delta;
    if (this.waveTimer >= 5000) {
      this.waveTimer = 0;
      this._spawnWave();
    }

    // Input (keyboard + mobile)
    const mob = this.mobileControls.getInput();
    const left = this.cursors.left.isDown || this.wasd.A.isDown || mob.left;
    const right = this.cursors.right.isDown || this.wasd.D.isDown || mob.right;
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.W)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || mob.jumpJustPressed;
    const attackJustPressed = Phaser.Input.Keyboard.JustDown(this.attackKey)
      || mob.attackJustPressed;

    this.player.update(delta, { left, right, jumpJustPressed, attackJustPressed });

    Object.entries(this.glitchKeys).forEach(([slot, key]) => {
      if (Phaser.Input.Keyboard.JustDown(key)) this.glitchSystem.activateSlot(parseInt(slot));
    });

    this.glitchSystem.update(dt);
    this.mobileControls.updateGlitchState(this.glitchSystem);
    this.enemies.getChildren().forEach(e => {
      if (e.active && !e.isDying) e.updateAI(time, delta, this.player, this.platforms);
    });

    this.hud.update();
    this.glitchUI.update();
  }

  _buildArena() {
    const addPlatform = (x, y, w, h) => {
      const vis = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x1a0a2a).setDepth(10);
      const body = this.physics.add.staticImage(x + w / 2, y + h / 2, '__DEFAULT')
        .setAlpha(0).setDisplaySize(w, h);
      body.refreshBody();
      this.platforms.add(body);
      // Glow top
      this.add.rectangle(x + w / 2, y + 1, w, 2, 0xff00ff, 0.4).setDepth(11);
    };

    addPlatform(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);      // floor
    addPlatform(0, 0, 20, GAME_HEIGHT);                    // left wall
    addPlatform(GAME_WIDTH - 20, 0, 20, GAME_HEIGHT);      // right wall
    addPlatform(200, GAME_HEIGHT - 160, 160, 16);           // mid platforms
    addPlatform(600, GAME_HEIGHT - 250, 200, 16);
    addPlatform(GAME_WIDTH - 360, GAME_HEIGHT - 160, 160, 16);
    addPlatform(380, GAME_HEIGHT - 340, 200, 16);
  }

  _drawArenaBackground() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x0a0005, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Grid
    g.lineStyle(1, 0xff00ff, 0.08);
    for (let x = 0; x < GAME_WIDTH; x += 50) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 50) g.lineBetween(0, y, GAME_WIDTH, y);
    // Arena border
    g.lineStyle(2, 0xff00ff, 0.5);
    g.strokeRect(2, 2, GAME_WIDTH - 4, GAME_HEIGHT - 4);
  }

  _buildTimerUI() {
    this.timerBg = this.add.rectangle(GAME_WIDTH / 2, 50, 200, 36, 0x220022, 0.9)
      .setScrollFactor(0).setDepth(100);
    this.timerLabel = this.add.text(GAME_WIDTH / 2, 38, 'SURVIVE', {
      fontSize: '10px', fill: '#ff88ee88', letterSpacing: 4, align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
    this.timerText = this.add.text(GAME_WIDTH / 2, 52, `${ARENA_DURATION}`, {
      fontSize: '22px', fill: '#ff00ff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    this.waveText = this.add.text(GAME_WIDTH / 2, 84, 'WAVE 1', {
      fontSize: '11px', fill: '#ff88ee', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
  }

  _updateTimerUI() {
    const t = Math.ceil(Math.max(0, this.timeLeft));
    this.timerText.setText(`${t}`);
    const color = t > 15 ? '#ff00ff' : t > 8 ? '#ff8800' : '#ff0000';
    this.timerText.setStyle({ fill: color });
    if (t <= 5) {
      this.timerText.setScale(1 + Math.sin(Date.now() / 150) * 0.08);
    }
  }

  _spawnWave() {
    this.waveCount++;
    this.waveText.setText(`WAVE ${this.waveCount}`);
    this.cameras.main.shake(150, 0.02);

    const spawnCount = 2 + this.waveCount;
    const classes = [BasicChaser, Attacker, FastEnemy];
    if (this.levelScale >= 20) classes.push(HeavyEnemy);

    const spawnPositions = [
      { x: 60, y: GAME_HEIGHT - 80 },
      { x: GAME_WIDTH - 60, y: GAME_HEIGHT - 80 },
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80 },
      { x: 260, y: GAME_HEIGHT - 200 },
      { x: GAME_WIDTH - 260, y: GAME_HEIGHT - 200 },
    ];

    for (let i = 0; i < Math.min(spawnCount, 5); i++) {
      const pos = spawnPositions[i % spawnPositions.length];
      const EClass = classes[i % classes.length];
      const key = EClass === BasicChaser ? 'basicChaser'
        : EClass === Attacker ? 'attacker'
        : EClass === FastEnemy ? 'fastEnemy'
        : 'heavyEnemy';
      const scaled = scaleEnemyConfig(ENEMY_CONFIGS[key], this.levelScale);
      const enemy = new EClass(this, pos.x, pos.y, scaled);
      this.enemies.add(enemy);

      // Spawn flash
      this.cameras.main.flash(80, 255, 0, 255, false);
    }
  }

  _showIntro() {
    const intro = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30,
      '⚡ VOID ARENA ⚡\nSURVIVE 30 SECONDS', {
        fontSize: '22px', fill: '#ff00ff', fontStyle: 'bold', align: 'center',
      }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
    this.tweens.add({
      targets: intro, alpha: { from: 1, to: 0 }, duration: 800, delay: 2000,
      onComplete: () => intro.destroy(),
    });
    // First wave on start
    this.time.delayedCall(500, () => this._spawnWave());
  }

  shutdown() {
    this.events.off('enemy:died', null, this);
    this.events.off('enemy:loot', null, this);
    if (this.hud) this.hud.destroy();
    if (this.glitchUI) this.glitchUI.destroy();
    if (this.mobileControls) this.mobileControls.destroy();
  }

  _victory() {
    if (this._done) return;
    this._done = true;
    this.cameras.main.flash(400, 0, 255, 200, false);
    this.enemies.clear(true, true);

    const victoryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
      '✓ SURVIVED!\nRETURNING...', {
        fontSize: '28px', fill: '#00ffee', fontStyle: 'bold', align: 'center',
      }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    this.time.delayedCall(2000, () => {
      this.scene.start('GameScene', {
        level: this.returnLevel,
        fromSave: false,
        glitches: this.glitchSystem.serialize(),
        playerData: this.player.getState(),
      });
    });
  }
}
