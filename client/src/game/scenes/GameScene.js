import Player from '../entities/Player.js';
import GlitchSystem from '../systems/GlitchSystem.js';
import LevelSystem from '../systems/LevelSystem.js';
import BossSystem from '../systems/BossSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import AudioSystem from '../systems/AudioSystem.js';
import HUD from '../ui/HUD.js';
import GlitchCooldownUI from '../ui/GlitchCooldownUI.js';
import BossHealthBar from '../ui/BossHealthBar.js';
import MobileControls from '../ui/MobileControls.js';
import { GAME_WIDTH, GAME_HEIGHT, BOSS_EVERY_N } from '../constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.currentLevel = data?.level ?? 1;
    this.fromSave = data?.fromSave ?? false;
    this.bossMode = data?.bossMode ?? false;
    this._playerDied = false;
    this._levelTransitioning = false;
  }

  create() {
    // Physics groups
    this.platforms = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group();

    // Systems
    this.glitchSystem = new GlitchSystem(this);
    this.saveSystem = new SaveSystem();
    this.audio = new AudioSystem(this);

    // Player (temp position — level system will reposition)
    this.player = new Player(this, 120, 500, this.glitchSystem);

    // Level + boss systems
    this.levelSystem = new LevelSystem(this);
    this.bossSystem = new BossSystem(this);

    // Physics colliders
    this.platformCollider = this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    // Player overlaps enemies
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (enemy.isAttacking) {
        player.takeDamage(enemy.attackDamage || 10, { x: enemy.x, y: enemy.y });
      }
    });

    // Projectiles hit player
    this.physics.add.overlap(this.player, this.projectiles, (player, proj) => {
      if (player.projectileImmune) return;
      player.takeDamage(proj.damage || 8, { x: proj.x, y: proj.y });
      proj.destroy();
    });

    // Camera
    this.cameras.main.setBackgroundColor(0x05030a);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(120, 80);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.glitchKeys = {
      0: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      1: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V),
      3: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
    };
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pauseKey.on('down', () => this._pauseGame());

    // UI
    this.hud = new HUD(this, this.player);
    this.glitchUI = new GlitchCooldownUI(this, this.glitchSystem);
    this.bossHealthBar = new BossHealthBar(this);
    this.mobileControls = new MobileControls(this);

    // Events
    this.events.on('portal:enter', this._onPortalEnter, this);
    this.events.on('arena:trigger', this._onArenaTrigger, this);
    this.events.on('boss:defeated', this._onBossDefeated, this);

    // Load level
    if (this.currentLevel % BOSS_EVERY_N === 0) {
      this.levelSystem.loadLevel(this.currentLevel);
      this.time.delayedCall(500, () => this.bossSystem.spawnBoss(this.currentLevel));
    } else {
      this.levelSystem.loadLevel(this.currentLevel);
    }

    // Restore save
    if (this.fromSave) {
      this.saveSystem.loadIntoScene(this);
    }

    // Boss melee hit check
    this.input.keyboard.on('keydown-SHIFT', () => {
      if (this.bossSystem.active && this.bossSystem.boss) {
        this.bossSystem.handlePlayerMeleeHit(this.player);
      }
    });
  }

  update(time, delta) {
    if (this._levelTransitioning) return;

    const dt = delta / 1000;

    // Check player death
    if (this.player.isDead() && !this._playerDied) {
      this._playerDied = true;
      this._onPlayerDied();
      return;
    }

    // Build input (keyboard + mobile)
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

    // Glitch key presses
    Object.entries(this.glitchKeys).forEach(([slot, key]) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        this.glitchSystem.activateSlot(parseInt(slot));
      }
    });

    // Update glitch system
    this.glitchSystem.update(dt);
    this.mobileControls.updateGlitchState(this.glitchSystem);

    // Update enemies
    const children = this.enemies.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const enemy = children[i];
      if (enemy && enemy.active && !enemy.isDying) {
        enemy.updateAI(time, delta, this.player, this.platforms);
      }
    }

    // Update boss
    if (this.bossSystem.active) {
      this.bossSystem.update(time, delta);
    }

    // UI
    this.hud.update();
    this.glitchUI.update();

    // Auto-save every 30s
    if (!this._saveTimer) this._saveTimer = 0;
    this._saveTimer += dt;
    if (this._saveTimer >= 30) {
      this._saveTimer = 0;
      this.saveSystem.saveGame(this);
    }
  }

  _pauseGame() {
    if (this._levelTransitioning) return;
    this.scene.launch('PauseScene', { level: this.currentLevel });
    this.scene.pause();
  }

  _onPlayerDied() {
    this._levelTransitioning = true;
    this.cameras.main.shake(400, 0.04);
    this.cameras.main.flash(300, 255, 0, 0, false);

    // Red death overlay
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0)
      .setScrollFactor(0).setDepth(200);
    this.tweens.add({
      targets: overlay, alpha: 0.4, duration: 600,
      onComplete: () => {
        this.time.delayedCall(400, () => {
          this.saveSystem.saveGame(this);
          this.scene.start('GameOverScene', {
            level: this.currentLevel,
            gems: this.player.gems,
          });
        });
      },
    });
  }

  _onPortalEnter({ level }) {
    if (this._levelTransitioning) return;
    this._levelTransitioning = true;

    this.saveSystem.saveGame(this);

    const nextLevel = level + 1;
    if (nextLevel % BOSS_EVERY_N === 0) {
      this.scene.start('BossIntroScene', {
        bossLevel: nextLevel,
        glitches: this.glitchSystem.serialize(),
        playerData: this.player.getState(),
      });
    } else {
      this.scene.start('LevelCompleteScene', {
        level,
        nextLevel,
        xpGained: this.player.xp,
        gems: this.player.gems,
        glitches: this.glitchSystem.serialize(),
        playerData: this.player.getState(),
      });
    }
  }

  _onArenaTrigger({ returnLevel, returnPos }) {
    if (this._levelTransitioning) return;
    this._levelTransitioning = true;
    this.saveSystem.saveGame(this);
    this.scene.start('ArenaScene', {
      returnLevel,
      returnPos,
      levelScale: this.currentLevel,
      glitches: this.glitchSystem.serialize(),
      playerData: this.player.getState(),
    });
  }

  _onBossDefeated({ reward, bossName }) {
    this.time.delayedCall(2000, () => {
      this.levelSystem.checkPortalUnlock();
      this.levelSystem._unlockPortal && this.levelSystem._unlockPortal();
    });
  }

  shutdown() {
    this.events.off('portal:enter', this._onPortalEnter, this);
    this.events.off('arena:trigger', this._onArenaTrigger, this);
    this.events.off('boss:defeated', this._onBossDefeated, this);
    this.levelSystem.cleanup();
    if (this.hud) this.hud.destroy();
    if (this.glitchUI) this.glitchUI.destroy();
    if (this.bossHealthBar) this.bossHealthBar.destroy();
    if (this.mobileControls) this.mobileControls.destroy();
  }
}
