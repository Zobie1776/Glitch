import Phaser from 'phaser';
import { emitHudUpdate, emitLevelComplete, emitPlayerDeath } from '../events.js';
import { loadProgress } from '../../state/saveManager.js';
import { ENEMY_VARIANTS, resolveEnemyVariant } from '../data/enemyVariants.js';
import { createBossProjectilePattern, getBossForLevel } from '../data/bosses.js';
import { getLevelLayout } from '../data/levels.js';
import { PLAYER_CONFIG } from '../data/playerConfig.js';
import GlitchManager from '../systems/GlitchManager.js';
import { GLITCH_CONFIG } from '../data/glitchConfig.js';

const EnemyState = Object.freeze({
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack',
  STUNNED: 'stunned',
});

const DEFAULT_SETTINGS = { music: true, sfx: true, showDamage: true };

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.enemyInstances = [];
    this.enemyProjectiles = null;
    this.playerProjectiles = null;
    this.glitchSkillGroup = null;
    this.gemsGroup = null;
    this.level = 1;
    this.maxLevels = 50;
    this.gems = 0;
    this.uiText = null;
    this.playerStats = null;
    this.glitchSkill = null;
    this.pendingLevelTransition = false;
    this.portal = null;
    this.portalActive = false;
    this.platforms = null;
    this.currentLayout = null;
    this.music = null;
    this.sfx = {};
    this.settings = { ...DEFAULT_SETTINGS };
    this.mobileControls = [];
    this.mobileInput = {
      left: false,
      right: false,
      jumpTap: false,
      meleeTap: false,
      rangedTap: false,
    };
    this.moveConfig = PLAYER_CONFIG.movement;
    this.combatConfig = PLAYER_CONFIG.combat;
    this.pickupConfig = PLAYER_CONFIG.pickups;
    this.glitchManager = null;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.playerInvulnerability = 0;
    this.comboIndex = 0;
    this.comboTimer = 0;
    this.elapsedTime = 0;
    this.score = 0;
    this.controlsInverted = false;
    this.isDashing = false;
    this.phaseBreakActive = false;
    this.phaseBreakFactor = 1;
  }

  async init() {
    const progress = await loadProgress();
    if (progress) {
      this.level = Phaser.Math.Clamp(progress.level ?? 1, 1, this.maxLevels);
      this.gems = progress.gems ?? 0;
    }
    this.settings = { ...DEFAULT_SETTINGS, ...(this.game.registry.get('settings') ?? {}) };
  }

  preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/red_ball.png');
    this.load.image('gem', 'https://labs.phaser.io/assets/sprites/gem.png');
    this.load.image('platform', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('portal', 'https://labs.phaser.io/assets/sprites/exit.png');
    this.load.audio('bgm_neon', 'https://labs.phaser.io/assets/audio/tech/loop.ogg');
    this.load.audio('sfx_melee', 'https://labs.phaser.io/assets/audio/SoundEffects/punch.wav');
    this.load.audio('sfx_pickup', 'https://labs.phaser.io/assets/audio/SoundEffects/p-ping.mp3');
    this.load.audio('sfx_glitch', 'https://labs.phaser.io/assets/audio/SoundEffects/powerup8.mp3');
  }

  create() {
    this.physics.world.setBounds(0, 0, 960, 540);
    this.cameras.main.setBounds(0, 0, 960, 540);
    this.cameras.main.setBackgroundColor('#05030a');
    this.originalGravity = this.physics.world.gravity.y;

    this.player = this.physics.add.sprite(120, 420, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDragX(this.moveConfig.friction);
    this.player.setBounce(0);
    this.player.setDepth(2);
    this.playerFacing = new Phaser.Math.Vector2(1, 0);
    this.playerJumpsRemaining = 1;

    this.playerStats = {
      maxHealth: 150,
      health: 150,
      meleeDamage: 28,
      rangedDamage: 20,
      meleeCooldown: this.combatConfig.meleeCombo[0].cooldown,
      rangedCooldown: this.combatConfig.rangedCooldown,
      weaponName: 'Mono Blade'
    };
    this.playerMeleeCooldown = 0;
    this.playerRangedCooldown = 0;
    this.playerGlitchCooldown = 0;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      melee: Phaser.Input.Keyboard.KeyCodes.SPACE,
      ranged: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      glitch: Phaser.Input.Keyboard.KeyCodes.Q,
      jump: Phaser.Input.Keyboard.KeyCodes.Z,
      dash: Phaser.Input.Keyboard.KeyCodes.X,
    });

    this.platforms = this.physics.add.staticGroup();
    this.enemiesGroup = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
    this.playerProjectiles = this.physics.add.group({ allowGravity: false });
    this.gemsGroup = this.physics.add.group({ allowGravity: true, bounceX: 0.6, bounceY: 0.6 });
    this.healthOrbsGroup = this.physics.add.group({ allowGravity: true, bounceX: 0.4, bounceY: 0.4 });
    this.glitchSkillGroup = this.physics.add.group({ allowGravity: true });

    this.portal = this.physics.add.sprite(-200, -200, 'portal');
    this.portal.body.setAllowGravity(false);
    this.portal.setVisible(false);
    this.portal.setAlpha(0);
    this.portal.body.enable = false;
    this.portal.setDepth(2);

    this.physics.add.collider(this.player, this.platforms, () => {
      this.playerJumpsRemaining = 1;
    });
    this.physics.add.collider(this.enemiesGroup, this.platforms);
    this.physics.add.collider(this.gemsGroup, this.platforms);
    this.physics.add.collider(this.glitchSkillGroup, this.platforms);
    this.physics.add.collider(this.healthOrbsGroup, this.platforms);

    this.physics.add.overlap(this.player, this.enemyProjectiles, this.handlePlayerHitByProjectile, null, this);
    this.physics.add.overlap(this.playerProjectiles, this.enemiesGroup, this.handleEnemyHitByProjectile, null, this);
    this.physics.add.overlap(this.player, this.enemiesGroup, this.handlePlayerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.gemsGroup, this.collectGem, null, this);
    this.physics.add.overlap(this.player, this.glitchSkillGroup, this.collectGlitchSkill, null, this);
    this.physics.add.overlap(this.player, this.healthOrbsGroup, this.collectHealthOrb, null, this);
    this.physics.add.overlap(this.player, this.portal, this.enterPortal, null, this);

    this.enemyInstances = [];
    this.pendingLevelTransition = false;
    this.glitchManager = new GlitchManager(this, GLITCH_CONFIG);
    this.elapsedTime = 0;
    this.score = 0;
    this.dashCooldown = 0;
    this.playerInvulnerability = 0;

    this.music = this.sound.add('bgm_neon', { loop: true, volume: 0.55 });
    this.sfx = {
      melee: this.sound.add('sfx_melee', { volume: 0.6 }),
      pickup: this.sound.add('sfx_pickup', { volume: 0.5 }),
      glitch: this.sound.add('sfx_glitch', { volume: 0.5 }),
    };
    this.applySettings(this.settings);

    this.setupMobileControls();
    this.prepareLevelEnvironment();
    this.spawnEncounter();

    this.uiText = this.add
      .text(16, 16, '', { fontFamily: 'monospace', fontSize: 16, color: '#ffffff', lineSpacing: 6 })
      .setDepth(10)
      .setScrollFactor(0);

    emitHudUpdate({
      health: this.playerStats.health,
      maxHealth: this.playerStats.maxHealth,
      gems: this.gems,
      meleeRemaining: 0,
      rangedRemaining: 0,
      dashRemaining: 0,
      glitchSkill: { name: 'None', cooldown: 0, remaining: 0 },
      weapon: this.playerStats.weaponName,
      score: this.score,
      timer: this.elapsedTime
    });

    this.game.events.on('settings:changed', this.handleSettingsChanged, this);
    this.events.once('shutdown', () => this.cleanUp());
  }

  cleanUp() {
    this.enemyInstances = [];
    this.enemiesGroup?.clear(true, true);
    this.enemyProjectiles?.clear(true, true);
    this.playerProjectiles?.clear(true, true);
    this.gemsGroup?.clear(true, true);
    this.glitchSkillGroup?.clear(true, true);
    this.platforms?.clear(true, true);
    this.portal?.destroy();
    this.music?.stop();
    this.music?.destroy();
    Object.values(this.sfx ?? {}).forEach((sound) => sound.destroy());
    this.mobileControls.forEach((button) => button.destroy());
    this.mobileControls = [];
    this.game.events.off('settings:changed', this.handleSettingsChanged, this);
  }

  handleSettingsChanged = (settings) => {
    this.applySettings(settings);
  };

  applySettings(settings) {
    this.settings = { ...this.settings, ...(settings ?? {}) };
    if (this.music) {
      if (this.settings.music) {
        if (!this.music.isPlaying) {
          this.music.play();
        }
        this.music.setMute(false);
      } else {
        this.music.stop();
      }
    }
  }

  playSfx(key) {
    if (!this.settings.sfx) return;
    const sound = this.sfx[key];
    if (sound) {
      sound.play();
    }
  }

  setupMobileControls() {
    if (this.sys.game.device.os.desktop) return;
    this.input.addPointer(3);
    const createButton = ({ x, y, width = 96, height = 96, label, onPress, onRelease }) => {
      const button = this.add.rectangle(x, y, width, height, 0x07040f, 0.45)
        .setStrokeStyle(2, 0x2ffaff, 0.6)
        .setScrollFactor(0)
        .setDepth(12)
        .setInteractive({ useHandCursor: false });
      const text = this.add
        .text(x, y, label, { fontFamily: 'monospace', fontSize: 20, color: '#2ffaff' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(13);
      button.on('pointerdown', (pointer) => {
        onPress(pointer);
        button.setFillStyle(0x1a0e2b, 0.7);
      });
      const release = () => {
        onRelease();
        button.setFillStyle(0x07040f, 0.45);
      };
      button.on('pointerup', release);
      button.on('pointerout', release);
      button.on('pointerupoutside', release);
      this.mobileControls.push(button, text);
    };

    const { width, height } = this.scale.canvas;
    createButton({
      x: 80,
      y: height - 80,
      label: '◄',
      onPress: () => {
        this.mobileInput.left = true;
      },
      onRelease: () => {
        this.mobileInput.left = false;
      },
    });
    createButton({
      x: 190,
      y: height - 80,
      label: '►',
      onPress: () => {
        this.mobileInput.right = true;
      },
      onRelease: () => {
        this.mobileInput.right = false;
      },
    });
    createButton({
      x: width - 100,
      y: height - 100,
      label: 'A',
      onPress: () => {
        this.mobileInput.meleeTap = true;
      },
      onRelease: () => {
        this.mobileInput.meleeTap = false;
      },
    });
    createButton({
      x: width - 200,
      y: height - 170,
      label: 'B',
      onPress: () => {
        this.mobileInput.rangedTap = true;
      },
      onRelease: () => {
        this.mobileInput.rangedTap = false;
      },
    });
    createButton({
      x: width - 80,
      y: height - 200,
      label: '⤒',
      onPress: () => {
        this.mobileInput.jumpTap = true;
      },
      onRelease: () => {
        this.mobileInput.jumpTap = false;
      },
    });
  }

  consumeMobileFlag(flag) {
    if (!this.mobileInput[flag]) return false;
    this.mobileInput[flag] = false;
    return true;
  }

  prepareLevelEnvironment() {
    const layout = getLevelLayout(this.level);
    this.currentLayout = layout;
    if (layout?.palette) {
      this.cameras.main.setBackgroundColor(layout.palette);
    }

    this.platforms.clear(true, true);
    layout.platforms.forEach((platform) => {
      const sprite = this.platforms.create(platform.x, platform.y, 'platform');
      sprite.setScale(platform.scaleX ?? 1, platform.scaleY ?? 1);
      sprite.refreshBody();
      sprite.setTint(0x1f0b2e + Phaser.Math.Between(0, 0x003333));
    });

    if (layout.portal) {
      this.tweens.killTweensOf(this.portal);
      this.portal.setPosition(layout.portal.x, layout.portal.y - 24);
      this.portal.setVisible(false);
      this.portal.setAlpha(0);
      this.portal.body.enable = false;
    }

    if (this.player) {
      this.player.setPosition(layout.playerSpawn.x, layout.playerSpawn.y);
      this.player.setVelocity(0, 0);
      this.playerStats.health = this.playerStats.maxHealth;
      this.player.clearTint();
      this.playerJumpsRemaining = 1;
    }

    this.portalActive = false;
  }

  spawnEncounter() {
    this.clearEncounter();
    if (this.level % 10 === 0) {
      this.spawnBoss();
    } else {
      this.spawnEnemyWave();
    }
  }

  clearEncounter() {
    this.enemyInstances.forEach((enemy) => enemy.sprite.destroy());
    this.enemyInstances = [];
    this.enemiesGroup.clear(true, true);
    this.enemyProjectiles.clear(true, true);
    this.playerProjectiles.clear(true, true);
  }

  spawnEnemyWave() {
    const count = Math.min(12, 4 + Math.floor(this.level * 1.2));
    const spawnLocations = Phaser.Utils.Array.Shuffle([...this.currentLayout.spawns]);
    for (let i = 0; i < count; i += 1) {
      const baseVariant = Phaser.Utils.Array.GetRandom(ENEMY_VARIANTS);
      const variant = resolveEnemyVariant(baseVariant);
      const spawn = spawnLocations[i % spawnLocations.length];
      const spawnX = spawn?.x ?? Phaser.Math.Between(100, 860);
      const spawnY = spawn?.y ?? 420;
      this.createEnemyInstance({ variant, x: spawnX, y: spawnY });
    }
  }

  spawnBoss() {
    const bossConfig = getBossForLevel(this.level);
    const spawnPoint = this.currentLayout.bossSpawn ?? { x: 640, y: 360 };
    const boss = this.createEnemyInstance({
      variant: {
        ...bossConfig,
        name: bossConfig.name,
        patrolRange: bossConfig.patrolRange,
        sightRadius: bossConfig.sightRadius,
        attack: {
          ...bossConfig.attack,
          type: bossConfig.attack.type,
          projectile: bossConfig.projectile,
        },
        loot: { min: 45, max: 70 },
      },
      x: spawnPoint.x,
      y: spawnPoint.y,
      scale: 1.45,
      isBoss: true,
    });
    boss.config = bossConfig;
    boss.projectile = { ...bossConfig.projectile };
    boss.glitchSkill = bossConfig.glitchSkill;
    boss.sprite.setTint(bossConfig.tint);
    boss.sprite.setDepth(3);
    boss.enraged = false;
    boss.patternTimer = 0;
    boss.sprite.anims?.stop();
  }

  createEnemyInstance({ variant, x, y, scale = 1, isBoss = false }) {
    const sprite = this.physics.add.sprite(x, y, 'enemy');
    sprite.setCollideWorldBounds(true);
    sprite.setDragX(300);
    sprite.setBounce(0);
    sprite.setScale(scale);
    sprite.setTint(variant.tint ?? 0xffffff);
    sprite.body.setAllowGravity(true);
    sprite.setDepth(isBoss ? 3 : 2);

    const enemy = {
      sprite,
      variant,
      state: EnemyState.PATROL,
      health: variant.maxHealth ?? 60,
      maxHealth: variant.maxHealth ?? 60,
      patrolAnchor: { x, y },
      patrolDirection: Phaser.Math.RND.pick([-1, 1]),
      cooldown: 0,
      stunnedTimer: 0,
      isBoss,
    };

    sprite.setData('entity', enemy);
    this.enemiesGroup.add(sprite);
    this.enemyInstances.push(enemy);
    return enemy;
  }

  collectGem(_player, gem) {
    const value = gem.getData('value') ?? Phaser.Math.Between(4, 7);
    this.gems += value;
    this.score += value * 5;
    this.playSfx('pickup');
    gem.destroy();
  }

  collectGlitchSkill(_player, drop) {
    const skillKey = drop.getData('skill');
    if (!skillKey || !this.glitchManager) return;
    const unlocked = this.glitchManager.unlockSkill(skillKey);
    if (!unlocked) return;
    this.glitchSkill = unlocked;
    this.playerGlitchCooldown = 0;
    this.playSfx('glitch');
    drop.destroy();
  }

  collectHealthOrb(_player, orb) {
    const value = this.pickupConfig.healthOrbValue ?? 25;
    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + value);
    this.playSfx('pickup');
    emitHudUpdate({ health: this.playerStats.health, maxHealth: this.playerStats.maxHealth });
    orb.destroy();
  }

  handlePlayerHitByProjectile(player, projectile) {
    const damage = projectile.getData('damage') ?? 6;
    this.damagePlayer(damage, projectile);
    projectile.destroy();
  }

  handleEnemyHitByProjectile(projectile, enemySprite) {
    projectile.destroy();
    const enemy = enemySprite.getData('entity');
    if (!enemy) return;
    this.damageEnemy(enemy, this.playerStats.rangedDamage);
  }

  handlePlayerTouchEnemy(_player, enemySprite) {
    const enemy = enemySprite.getData('entity');
    if (!enemy || enemy.state === EnemyState.STUNNED) return;
    const touchDamage = Math.round((enemy.variant.attack?.damage ?? 8) * 0.5);
    this.damagePlayer(touchDamage, enemySprite);
  }

  damagePlayer(amount, source) {
    if (!this.playerStats) return;
    if (this.playerInvulnerability > 0) return;
    this.playerInvulnerability = 0.6;
    this.playerStats.health = Math.max(0, this.playerStats.health - amount);
    this.player.setTintFill(0xff4444);
    this.time.delayedCall(120, () => this.player.clearTint());
    if (source?.x !== undefined) {
      const direction = Math.sign(this.player.x - source.x) || 1;
      this.player.setVelocity(direction * 200, -220);
    }
    emitHudUpdate({ health: this.playerStats.health, maxHealth: this.playerStats.maxHealth });
    if (this.playerStats.health <= 0) {
      this.handlePlayerDeath();
    }
  }

  handlePlayerDeath() {
    emitPlayerDeath({ level: this.level, gems: this.gems });
    this.scene.restart();
  }

  damageEnemy(enemy, amount) {
    if (!enemy || enemy.health <= 0) return;
    enemy.health = Math.max(0, enemy.health - amount);
    enemy.sprite.setTintFill(0xffffff);
    this.time.delayedCall(100, () => {
      if (enemy.health <= 0) return;
      const tint = enemy.isBoss && enemy.enraged
        ? enemy.config.enragedTint ?? enemy.variant.tint ?? 0xffffff
        : enemy.variant.tint ?? 0xffffff;
      enemy.sprite.setTint(tint);
    });
    this.applyHitstop();
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    enemy.health = 0;
    enemy.state = EnemyState.STUNNED;
    enemy.sprite.disableBody(true, true);
    this.score += enemy.isBoss ? 1500 : 250;
    const loot = enemy.variant.loot ?? { min: 4, max: 7 };
    const gems = Phaser.Math.Between(loot.min, loot.max);
    const gem = this.gemsGroup.create(enemy.sprite.x, enemy.sprite.y, 'gem');
    gem.setData('value', gems);
    gem.setScale(enemy.isBoss ? 1.2 : 0.8);
    gem.setTint(enemy.isBoss ? 0xfff18f : 0x9af0ff);
    gem.setVelocity(Phaser.Math.Between(-80, 80), Phaser.Math.Between(-200, -120));

    if (!enemy.isBoss && Math.random() < this.pickupConfig.healthDropChance) {
      const orb = this.healthOrbsGroup.create(enemy.sprite.x, enemy.sprite.y - 10, 'enemy');
      orb.setTint(0xff7cf6);
      orb.setScale(0.5);
      orb.setData('value', this.pickupConfig.healthOrbValue);
      orb.setVelocity(Phaser.Math.Between(-60, 60), Phaser.Math.Between(-160, -100));
    }

    if (enemy.isBoss && enemy.glitchSkill) {
      const drop = this.glitchSkillGroup.create(enemy.sprite.x, enemy.sprite.y - 20, 'enemy');
      drop.setTint(0x9af0ff);
      drop.setScale(0.8);
      drop.setData('skill', enemy.glitchSkill.key);
      this.add.tween({ targets: drop, y: drop.y - 10, yoyo: true, repeat: -1, duration: 900 });
    }

    this.checkEncounterCleared();
  }

  checkEncounterCleared() {
    if (this.portalActive) return;
    const activeEnemies = this.enemyInstances.filter((enemy) => enemy.health > 0);
    if (activeEnemies.length === 0) {
      this.revealPortal();
    }
  }

  revealPortal() {
    if (!this.portal) return;
    this.portalActive = true;
    this.tweens.killTweensOf(this.portal);
    this.portal.setVisible(true);
    this.portal.body.enable = true;
    this.portal.setAlpha(1);
    this.add.tween({ targets: this.portal, angle: { from: -4, to: 4 }, duration: 800, repeat: -1, yoyo: true });
    this.add.tween({ targets: this.portal, scale: { from: 0.9, to: 1.05 }, duration: 700, repeat: -1, yoyo: true });
  }

  enterPortal() {
    if (!this.portalActive || this.pendingLevelTransition) return;
    this.portalActive = false;
    this.portal.body.enable = false;
    this.portal.setVisible(false);
    this.portal.setAlpha(0);
    this.advanceLevel();
  }

  advanceLevel() {
    if (this.pendingLevelTransition) return;
    this.pendingLevelTransition = true;
    const completedLevel = this.level;
    const reward = 40 + Math.round(completedLevel * 3) + (completedLevel % 10 === 0 ? 70 : 0);
    this.gems += reward;

    if (completedLevel >= this.maxLevels) {
      emitLevelComplete({ level: this.maxLevels, gems: this.gems, ascended: true, score: this.score });
      this.triggerAscension();
      return;
    }

    this.level = Math.min(this.maxLevels, this.level + 1);
    emitLevelComplete({ level: this.level, gems: this.gems, ascended: false, score: this.score });
    this.time.delayedCall(400, () => {
      this.prepareLevelEnvironment();
      this.spawnEncounter();
      this.pendingLevelTransition = false;
    });
  }

  triggerAscension() {
    this.add
      .rectangle(480, 270, 960, 540, 0x12041f, 0.8)
      .setDepth(20);
    this.add
      .text(480, 220, 'NEON ASCENSION COMPLETE', {
        fontFamily: 'monospace',
        fontSize: 36,
        color: '#2ffaff',
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.add
      .text(480, 280, 'You have severed the final Rift. Return to the menu to bask in glory.', {
        fontFamily: 'monospace',
        fontSize: 18,
        color: '#d6f5ff',
        wordWrap: { width: 600 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.music?.stop();
    this.time.delayedCall(1200, () => {
      this.pendingLevelTransition = false;
    });
  }

  update(time, delta) {
    if (!this.player) return;
    const deltaSeconds = delta / 1000;
    this.elapsedTime += deltaSeconds;
    this.playerInvulnerability = Math.max(0, this.playerInvulnerability - deltaSeconds);
    if (this.isDashing) {
      this.dashTimer -= deltaSeconds;
      if (this.dashTimer <= 0) {
        this.finishDash();
      }
    }
    if (this.dashCooldown > 0 && !this.isDashing) {
      this.dashCooldown = Math.max(0, this.dashCooldown - deltaSeconds);
    }
    if (this.glitchManager) {
      this.glitchManager.update(deltaSeconds);
    }
    this.updatePlayer(deltaSeconds);
    this.updateGlitchSkill(deltaSeconds);
    this.updateProjectiles(deltaSeconds);
    this.updatePickups(deltaSeconds);
    this.updateEnemies(deltaSeconds);
    this.updateUI();
  }

  updatePlayer(deltaSeconds) {
    const body = this.player.body;
    let horizontal = 0;
    if (this.cursors.left.isDown || this.mobileInput.left) horizontal -= 1;
    if (this.cursors.right.isDown || this.mobileInput.right) horizontal += 1;
    if (this.controlsInverted) horizontal *= -1;

    const speedBoost = this.phaseBreakActive ? 1 / this.phaseBreakFactor : 1;
    const maxSpeed = this.moveConfig.maxSpeed * speedBoost;

    if (this.isDashing) {
      body.setAccelerationX(0);
    } else if (horizontal !== 0) {
      const accel = body.blocked.down ? this.moveConfig.acceleration : this.moveConfig.airAcceleration;
      body.setAccelerationX(horizontal * accel * speedBoost);
      if (Math.abs(body.velocity.x) > maxSpeed) {
        body.setVelocityX(Math.sign(body.velocity.x) * maxSpeed);
      }
      this.playerFacing.set(horizontal, 0).normalize();
      this.player.setFlipX(horizontal < 0);
    } else {
      const decel = body.blocked.down ? this.moveConfig.deceleration : this.moveConfig.airDeceleration;
      const nextVelocity = Phaser.Math.Linear(body.velocity.x, 0, Phaser.Math.Clamp(decel * deltaSeconds / Math.max(1, maxSpeed), 0, 1));
      body.setVelocityX(nextVelocity);
      body.setAccelerationX(0);
    }

    if (body.blocked.down) {
      this.coyoteTimer = this.moveConfig.coyoteTime;
      this.playerJumpsRemaining = 1;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - deltaSeconds);
    }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.jump)
      || this.consumeMobileFlag('jumpTap');

    if (jumpPressed) {
      this.jumpBufferTimer = this.moveConfig.jumpBuffer;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - deltaSeconds);
    }

    if (!this.isDashing && this.jumpBufferTimer > 0) {
      if (body.blocked.down || this.coyoteTimer > 0) {
        this.executeJump(this.moveConfig.jumpVelocity);
      } else if (this.playerJumpsRemaining > 0) {
        this.executeJump(this.moveConfig.doubleJumpVelocity);
        this.playerJumpsRemaining -= 1;
      }
    }

    const jumpReleased = Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.keys.jump);
    if (jumpReleased && body.velocity.y < 0) {
      body.setVelocityY(Math.max(body.velocity.y, this.moveConfig.jumpVelocity * this.moveConfig.variableJumpCutoff));
    }

    if (!this.isDashing && Phaser.Input.Keyboard.JustDown(this.keys.dash)) {
      this.startDash();
    }

    this.playerMeleeCooldown = Math.max(0, this.playerMeleeCooldown - deltaSeconds);
    this.playerRangedCooldown = Math.max(0, this.playerRangedCooldown - deltaSeconds);
    this.playerGlitchCooldown = Math.max(0, this.playerGlitchCooldown - deltaSeconds);
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - deltaSeconds);
      if (this.comboTimer === 0) {
        this.comboIndex = 0;
      }
    }

    const meleePressed = Phaser.Input.Keyboard.JustDown(this.keys.melee) || this.consumeMobileFlag('meleeTap');
    if (meleePressed && this.playerMeleeCooldown === 0) {
      this.performMeleeAttack();
    }

    const rangedPressed = Phaser.Input.Keyboard.JustDown(this.keys.ranged) || this.consumeMobileFlag('rangedTap');
    if (rangedPressed && this.playerRangedCooldown === 0) {
      this.playerRangedCooldown = this.playerStats.rangedCooldown;
      this.performRangedAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.glitch)) {
      this.useGlitchSkill();
    }
  }

  executeJump(power) {
    this.player.setVelocityY(power);
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
  }

  startDash() {
    if (this.dashCooldown > 0 || this.isDashing) return;
    this.isDashing = true;
    this.dashTimer = this.moveConfig.dashDuration;
    this.dashCooldown = this.moveConfig.dashCooldown;
    const direction = this.playerFacing.clone().normalize();
    if (direction.length() === 0) {
      direction.set(1, 0);
    }
    this.playerInvulnerability = Math.max(this.playerInvulnerability, this.moveConfig.dashIFrames);
    this.player.body.checkCollision.none = true;
    this.player.setVelocity(direction.x * this.moveConfig.dashSpeed, direction.y * 40 - 40);
  }

  finishDash() {
    if (!this.isDashing) return;
    this.isDashing = false;
    this.player.body.checkCollision.none = false;
  }

  handleGlitchSkill(skill) {
    switch (skill.key) {
      case 'echoWarp':
        this.activateEchoWarp(skill);
        break;
      case 'phaseBreak':
        this.activatePhaseBreak(skill);
        break;
      case 'fractalDash':
        this.activateFractalDash(skill);
        break;
      case 'staticStorm':
        this.activateStaticStorm(skill);
        break;
      case 'realityShift':
        this.activateRealityShift(skill);
        break;
      default:
        break;
    }
  }

  activateEchoWarp(skill) {
    const repeats = Math.max(1, Math.floor(skill.duration / skill.trailInterval));
    this.time.addEvent({
      delay: skill.trailInterval * 1000,
      repeat: repeats,
      callback: () => {
        const afterimage = this.add.sprite(this.player.x, this.player.y, 'player');
        afterimage.setAlpha(0.65);
        afterimage.setTint(0x9af0ff);
        afterimage.setDepth(1);
        this.tweens.add({ targets: afterimage, alpha: 0, duration: 420, ease: 'Sine.easeOut', onComplete: () => afterimage.destroy() });
        this.enemyInstances.forEach((enemy) => {
          if (enemy.health <= 0) return;
          if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y) <= 100) {
            this.damageEnemy(enemy, skill.damage);
          }
        });
      }
    });
  }

  activatePhaseBreak(skill) {
    if (this.phaseBreakActive) return;
    this.phaseBreakActive = true;
    this.phaseBreakFactor = skill.worldSlow;
    this.physics.world.timeScale = skill.worldSlow;
    this.time.timeScale = skill.worldSlow;
    this.time.delayedCall(skill.duration * 1000, () => {
      this.phaseBreakActive = false;
      this.phaseBreakFactor = 1;
      this.physics.world.timeScale = 1;
      this.time.timeScale = 1;
    });
  }

  activateFractalDash(skill) {
    const direction = this.playerFacing.clone().normalize();
    if (direction.length() === 0) {
      direction.set(1, 0);
    }
    const destinationX = Phaser.Math.Clamp(this.player.x + direction.x * skill.distance, 32, 928);
    const destinationY = Phaser.Math.Clamp(this.player.y + direction.y * 16, 32, 520);
    this.player.setPosition(destinationX, destinationY);
    this.playerInvulnerability = Math.max(this.playerInvulnerability, 0.35);
    this.player.body.checkCollision.none = true;
    this.time.delayedCall(200, () => { this.player.body.checkCollision.none = false; });
    this.createAoeDamage(destinationX, destinationY, skill.aoeRadius, skill.aoeDamage);
  }

  createAoeDamage(x, y, radius, damage) {
    const circle = this.add.circle(x, y, radius, 0x9af0ff, 0.15).setDepth(1);
    this.tweens.add({ targets: circle, alpha: 0, scale: 1.2, duration: 360, onComplete: () => circle.destroy() });
    this.enemyInstances.forEach((enemy) => {
      if (enemy.health <= 0) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y) <= radius) {
        this.damageEnemy(enemy, damage);
      }
    });
  }

  activateStaticStorm(skill) {
    let pulses = 0;
    this.time.addEvent({
      delay: skill.pulseInterval * 1000,
      repeat: skill.pulses - 1,
      callback: () => {
        pulses += 1;
        const radius = skill.radius + pulses * 20;
        this.createAoeDamage(this.player.x, this.player.y, radius, skill.damage);
        this.enemyInstances.forEach((enemy) => {
          if (enemy.health <= 0) return;
          const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
          if (distance <= radius) {
            enemy.state = EnemyState.STUNNED;
            enemy.stunnedTimer = Math.max(enemy.stunnedTimer, skill.stunDuration);
          }
        });
      }
    });
  }

  activateRealityShift(skill) {
    this.physics.world.gravity.y = Math.abs(this.originalGravity) * skill.gravityScale;
    this.player.setGravityY(this.physics.world.gravity.y);
    this.player.setFlipY(true);
    this.time.delayedCall(skill.duration * 1000, () => {
      this.physics.world.gravity.y = this.originalGravity;
      this.player.setGravityY(this.originalGravity);
      this.player.setFlipY(false);
    });
  }

  applyHitstop() {
    const restoreWorld = this.phaseBreakActive ? this.phaseBreakFactor : 1;
    const previousWorldScale = this.physics.world.timeScale;
    const previousTimeScale = this.time.timeScale;
    this.physics.world.timeScale = Math.min(previousWorldScale, 0.25);
    this.time.timeScale = Math.min(previousTimeScale, 0.25);
    this.time.delayedCall(this.combatConfig.hitstop * 1000, () => {
      this.physics.world.timeScale = restoreWorld;
      this.time.timeScale = restoreWorld;
    });
  }

  performMeleeAttack() {
    const combo = this.combatConfig.meleeCombo[this.comboIndex] ?? this.combatConfig.meleeCombo[0];
    this.playerMeleeCooldown = combo.cooldown;
    this.comboIndex = (this.comboIndex + 1) % this.combatConfig.meleeCombo.length;
    this.comboTimer = this.combatConfig.meleeResetTime;
    const range = combo.range ?? 64;
    const verticalTolerance = 48;
    this.add.tween({ targets: this.player, scaleX: 1.1, scaleY: 0.9, yoyo: true, duration: 140 });
    this.playSfx('melee');
    for (const enemy of this.enemyInstances) {
      if (enemy.health <= 0) continue;
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.sprite.x,
        enemy.sprite.y
      );
      const verticalDiff = Math.abs(this.player.y - enemy.sprite.y);
      if (distance <= range && verticalDiff <= verticalTolerance) {
        this.damageEnemy(enemy, combo.damage ?? this.playerStats.meleeDamage);
      }
    }
  }

  performRangedAttack() {
    const speed = 420;
    const direction = this.playerFacing.clone().normalize();
    if (direction.length() === 0) {
      direction.set(1, 0);
    }
    const offsetX = this.player.width * 0.4 * (direction.x >= 0 ? 1 : -1);
    const projectile = this.playerProjectiles.create(this.player.x + offsetX, this.player.y - 6, 'enemy');
    projectile.setScale(0.35);
    projectile.setTint(0x66ccff);
    projectile.body.setAllowGravity(false);
    projectile.setVelocity(direction.x * speed, direction.y * speed);
    projectile.setData('ttl', 1.6);
    projectile.setDepth(2);
  }

  useGlitchSkill() {
    if (!this.glitchManager) return;
    const skill = this.glitchManager.getActiveSkill();
    if (!skill) return;
    if (this.playerGlitchCooldown > 0) return;
    if (this.glitchManager.useActiveSkill()) {
      this.playerGlitchCooldown = skill.cooldown;
      this.playSfx('glitch');
    }
  }

  updateGlitchSkill(deltaSeconds) {
    if (!this.glitchManager) return;
    const skill = this.glitchManager.getActiveSkill();
    if (skill) {
      this.playerGlitchCooldown = Math.max(0, skill.remaining ?? 0);
    } else {
      this.playerGlitchCooldown = 0;
    }
  }

  updateProjectiles(deltaSeconds) {
    this.enemyProjectiles.children.iterate((projectile) => {
      if (!projectile) return;
      const ttl = (projectile.getData('ttl') ?? 2) - deltaSeconds;
      if (ttl <= 0) {
        projectile.destroy();
      } else {
        projectile.setData('ttl', ttl);
      }
    });

    this.playerProjectiles.children.iterate((projectile) => {
      if (!projectile) return;
      const ttl = (projectile.getData('ttl') ?? 1.6) - deltaSeconds;
      if (ttl <= 0) {
        projectile.destroy();
      } else {
        projectile.setData('ttl', ttl);
      }
    });
  }

  updatePickups(_deltaSeconds) {
    const magnetRadius = this.pickupConfig.gemMagnetRadius;
    this.gemsGroup.children.iterate((gem) => {
      if (!gem) return;
      const distance = Phaser.Math.Distance.Between(gem.x, gem.y, this.player.x, this.player.y);
      if (distance <= magnetRadius) {
        this.physics.moveToObject(gem, this.player, 220);
      }
    });
    this.healthOrbsGroup.children.iterate((orb) => {
      if (!orb) return;
      const distance = Phaser.Math.Distance.Between(orb.x, orb.y, this.player.x, this.player.y);
      if (distance <= magnetRadius * 0.8) {
        this.physics.moveToObject(orb, this.player, 200);
      }
    });
  }

  updateEnemies(deltaSeconds) {
    const playerPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);
    for (const enemy of this.enemyInstances) {
      if (enemy.health <= 0) continue;

      if (enemy.stunnedTimer > 0) {
        enemy.stunnedTimer -= deltaSeconds;
        enemy.sprite.setVelocityX(0);
        if (enemy.stunnedTimer <= 0) {
          enemy.state = EnemyState.PATROL;
          enemy.sprite.setTint(enemy.variant.tint ?? 0xffffff);
        }
        continue;
      }

      enemy.cooldown = Math.max(0, enemy.cooldown - deltaSeconds);

      if (enemy.isBoss && !enemy.enraged) {
        const threshold = enemy.maxHealth * 0.5;
        if (enemy.health <= threshold) {
          enemy.enraged = true;
          enemy.variant.speed = Math.round(enemy.variant.speed * 1.25);
          enemy.variant.attack.damage = Math.round(enemy.variant.attack.damage * 1.3);
          enemy.variant.attack.cooldown = Math.max(0.6, enemy.variant.attack.cooldown * 0.75);
          enemy.sprite.setTint(enemy.config.enragedTint ?? 0xff4444);
          this.add.tween({ targets: enemy.sprite, angle: { from: -6, to: 6 }, duration: 250, yoyo: true, repeat: 6 });
        }
      }

      const horizontalDistance = Math.abs(playerPosition.x - enemy.sprite.x);
      const verticalDistance = Math.abs(playerPosition.y - enemy.sprite.y);
      const canSee = this.canEnemySeePlayer(enemy, horizontalDistance, verticalDistance);

      switch (enemy.state) {
        case EnemyState.PATROL:
          this.updateEnemyPatrol(enemy);
          if (canSee) enemy.state = EnemyState.CHASE;
          break;
        case EnemyState.CHASE:
          if (!canSee) {
            enemy.state = EnemyState.PATROL;
            break;
          }
          if (horizontalDistance <= (enemy.variant.attack?.range ?? 48) && verticalDistance <= 64) {
            enemy.state = EnemyState.ATTACK;
          } else {
            this.updateEnemyChase(enemy, playerPosition);
          }
          break;
        case EnemyState.ATTACK:
          if (!canSee) {
            enemy.state = EnemyState.PATROL;
            break;
          }
          this.performEnemyAttack(enemy, playerPosition, horizontalDistance, verticalDistance);
          enemy.state = EnemyState.CHASE;
          break;
        default:
          break;
      }

      if (enemy.isBoss) {
        const patternConfig = enemy.enraged
          ? enemy.config.patterns.enraged
          : enemy.config.patterns.base;
        const projectiles = createBossProjectilePattern(this, enemy, patternConfig, playerPosition);
        projectiles.forEach((data) => {
          const projectile = this.enemyProjectiles.create(data.x, data.y, 'enemy');
          projectile.setScale(0.6);
          projectile.setTint(enemy.enraged ? 0xff8f3f : 0xff3fd8);
          projectile.body.setAllowGravity(false);
          projectile.setVelocity(data.velocity.x, data.velocity.y);
          projectile.setData('ttl', data.ttl ?? 2.2);
          projectile.setData('damage', data.damage ?? enemy.variant.attack.damage);
        });
      }
    }
  }

  canEnemySeePlayer(enemy, horizontalDistance, verticalDistance) {
    const radius = enemy.variant.sightRadius ?? 280;
    if (horizontalDistance > radius) return false;
    if (verticalDistance > 180) return false;
    return true;
  }

  updateEnemyPatrol(enemy) {
    const speed = enemy.variant.speed ?? 100;
    const range = enemy.variant.patrolRange ?? 180;
    const direction = enemy.patrolDirection;
    enemy.sprite.setVelocityX(direction * speed);
    if (enemy.sprite.body.blocked.left || enemy.sprite.body.blocked.right) {
      enemy.patrolDirection *= -1;
    }
    const offset = enemy.sprite.x - enemy.patrolAnchor.x;
    if (Math.abs(offset) >= range / 2) {
      enemy.patrolDirection *= -1;
    }
  }

  updateEnemyChase(enemy, playerPosition) {
    const speed = enemy.variant.speed ?? 100;
    const direction = Math.sign(playerPosition.x - enemy.sprite.x) || 0;
    enemy.sprite.setVelocityX(direction * speed);
    if (playerPosition.y + 32 < enemy.sprite.y && enemy.sprite.body.blocked.down) {
      enemy.sprite.setVelocityY(-380);
    }
  }

  performEnemyAttack(enemy, playerPosition, horizontalDistance, verticalDistance) {
    if (enemy.cooldown > 0) return;
    const attack = enemy.variant.attack ?? { type: 'melee', damage: 8, range: 48, cooldown: 1.2 };
    enemy.cooldown = attack.cooldown ?? 1.2;
    if (attack.type === 'projectile' && attack.projectile) {
      const burst = attack.burstCount ?? 1;
      const spread = attack.projectile.spread ?? 10;
      for (let i = 0; i < burst; i += 1) {
        const angleOffset = Phaser.Math.DegToRad(spread * (i - (burst - 1) / 2));
        const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, playerPosition.x, playerPosition.y) + angleOffset;
        const velocity = this.physics.velocityFromRotation(angle, attack.projectile.speed ?? 320);
        const projectile = this.enemyProjectiles.create(enemy.sprite.x, enemy.sprite.y - 10, 'enemy');
        projectile.setScale(0.5);
        projectile.setTint(0xffb347);
        projectile.body.setAllowGravity(false);
        projectile.setVelocity(velocity.x, velocity.y);
        projectile.setData('ttl', attack.projectile.ttl ?? 2);
        projectile.setData('damage', attack.damage ?? 10);
        if (attack.projectile.zigzag) {
          this.tweens.add({
            targets: projectile,
            angle: { from: -15, to: 15 },
            duration: 260,
            yoyo: true,
            repeat: -1,
          });
        }
      }
    } else if (horizontalDistance <= (attack.range ?? 48) && verticalDistance <= 48) {
      this.damagePlayer(attack.damage ?? 10);
      this.add.tween({ targets: enemy.sprite, scaleX: 1.1, scaleY: 0.9, yoyo: true, duration: 140 });
    }
  }

  updateUI() {
    const enemyCount = this.enemyInstances.filter((enemy) => enemy.health > 0).length;
    const boss = this.enemyInstances.find((enemy) => enemy.isBoss && enemy.health > 0);
    const bossLine = boss
      ? `Boss HP: ${boss.health}/${boss.maxHealth}${boss.enraged ? ' (ENRAGED)' : ''}`
      : '';
    const glitchLine = this.glitchSkill
      ? `Glitch Skill: ${this.glitchSkill.name} (${this.playerGlitchCooldown.toFixed(1)}s)`
      : 'Glitch Skill: None';
    const portalLine = this.portalActive ? 'Portal: ACTIVE' : 'Portal: Locked';
    this.uiText.setText([
      `Level: ${this.level}${this.level % 10 === 0 ? ' - Boss' : ''}`,
      `HP: ${Math.round(this.playerStats.health)}/${this.playerStats.maxHealth}`,
      `Gems: ${this.gems}`,
      `Enemies Remaining: ${enemyCount}`,
      portalLine,
      bossLine,
      glitchLine,
    ].filter(Boolean));
    emitHudUpdate({
      health: this.playerStats.health,
      maxHealth: this.playerStats.maxHealth,
      gems: this.gems,
      meleeRemaining: this.playerMeleeCooldown,
      rangedRemaining: this.playerRangedCooldown,
      dashRemaining: this.dashCooldown,
      weapon: this.playerStats.weaponName,
      score: this.score,
      timer: this.elapsedTime,
    });
  }
}
