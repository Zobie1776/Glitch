import Phaser from 'phaser';
import { emitLevelComplete, emitPlayerDeath } from '../events.js';
import { loadProgress } from '../../state/saveManager.js';
import { ENEMY_VARIANTS, resolveEnemyVariant } from '../data/enemyVariants.js';
import { createBossProjectilePattern, getBossForLevel } from '../data/bosses.js';

const EnemyState = Object.freeze({
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack',
  STUNNED: 'stunned',
});

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
    this.gems = 0;
    this.uiText = null;
    this.playerStats = null;
    this.glitchSkill = null;
    this.pendingLevelTransition = false;
  }

  async init() {
    const progress = await loadProgress();
    if (progress) {
      this.level = Math.max(1, progress.level ?? 1);
      this.gems = progress.gems ?? 0;
    }
  }

  preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('enemy', 'https://labs.phaser.io/assets/sprites/red_ball.png');
    this.load.image('gem', 'https://labs.phaser.io/assets/sprites/gem.png');
  }

  create() {
    this.player = this.physics.add.sprite(480, 270, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(400, 400);
    this.playerFacing = new Phaser.Math.Vector2(1, 0);

    this.playerStats = {
      maxHealth: 130,
      health: 130,
      meleeDamage: 26,
      rangedDamage: 18,
      meleeCooldown: 0.6,
      rangedCooldown: 0.8,
    };
    this.playerMeleeCooldown = 0;
    this.playerRangedCooldown = 0;
    this.playerGlitchCooldown = 0;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      melee: Phaser.Input.Keyboard.KeyCodes.SPACE,
      ranged: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      glitch: Phaser.Input.Keyboard.KeyCodes.Q,
    });

    this.enemiesGroup = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
    this.playerProjectiles = this.physics.add.group({ allowGravity: false });
    this.gemsGroup = this.physics.add.group({ allowGravity: false, bounceX: 1, bounceY: 1 });
    this.glitchSkillGroup = this.physics.add.group({ allowGravity: false });

    this.enemyInstances = [];
    this.pendingLevelTransition = false;

    this.physics.add.overlap(this.player, this.enemyProjectiles, this.handlePlayerHitByProjectile, null, this);
    this.physics.add.overlap(this.playerProjectiles, this.enemiesGroup, this.handleEnemyHitByProjectile, null, this);
    this.physics.add.overlap(this.player, this.enemiesGroup, this.handlePlayerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.gemsGroup, this.collectGem, null, this);
    this.physics.add.overlap(this.player, this.glitchSkillGroup, this.collectGlitchSkill, null, this);

    this.spawnEncounter();

    this.uiText = this.add
      .text(16, 16, '', { fontFamily: 'monospace', fontSize: 16, color: '#ffffff', lineSpacing: 6 })
      .setDepth(10);

    this.events.once('shutdown', () => this.cleanUp());
  }

  cleanUp() {
    this.enemyInstances = [];
    this.enemiesGroup?.clear(true, true);
    this.enemyProjectiles?.clear(true, true);
    this.playerProjectiles?.clear(true, true);
    this.gemsGroup?.clear(true, true);
    this.glitchSkillGroup?.clear(true, true);
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
    for (let i = 0; i < count; i += 1) {
      const baseVariant = Phaser.Utils.Array.GetRandom(ENEMY_VARIANTS);
      const variant = resolveEnemyVariant(baseVariant);
      const spawnX = Phaser.Math.Between(80, 880);
      const spawnY = Phaser.Math.Between(80, 480);
      this.createEnemyInstance({ variant, x: spawnX, y: spawnY });
    }
  }

  spawnBoss() {
    const bossConfig = getBossForLevel(this.level);
    const spawnX = 480;
    const spawnY = 200;
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
        loot: { min: 35, max: 60 },
      },
      x: spawnX,
      y: spawnY,
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
    this.add.tween({ targets: boss.sprite, scale: boss.sprite.scale + 0.1, yoyo: true, repeat: -1, duration: 1200 });
  }

  createEnemyInstance({ variant, x, y, scale = 1, isBoss = false }) {
    const sprite = this.physics.add.sprite(x, y, 'enemy');
    sprite.setCollideWorldBounds(true);
    sprite.setDamping(true);
    sprite.setDrag(160, 160);
    sprite.setBounce(1);
    sprite.setScale(scale);
    sprite.setTint(variant.tint ?? 0xffffff);

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
    gem.destroy();
  }

  collectGlitchSkill(_player, drop) {
    const skill = drop.getData('skill');
    if (!skill) return;
    this.glitchSkill = {
      ...skill,
      cooldown: skill.cooldown,
      remaining: 0,
      description: skill.description,
    };
    this.playerGlitchCooldown = 0;
    drop.destroy();
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

  damagePlayer(amount) {
    if (!this.playerStats) return;
    this.playerStats.health = Math.max(0, this.playerStats.health - amount);
    this.player.setTintFill(0xff4444);
    this.time.delayedCall(120, () => this.player.clearTint());
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
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    enemy.health = 0;
    enemy.state = EnemyState.STUNNED;
    enemy.sprite.disableBody(true, true);
    const loot = enemy.variant.loot ?? { min: 4, max: 7 };
    const gems = Phaser.Math.Between(loot.min, loot.max);
    const gem = this.gemsGroup.create(enemy.sprite.x, enemy.sprite.y, 'gem');
    gem.setData('value', gems);
    gem.setScale(enemy.isBoss ? 1.2 : 0.8);
    gem.setTint(enemy.isBoss ? 0xfff18f : 0x9af0ff);
    gem.setVelocity(Phaser.Math.Between(-60, 60), Phaser.Math.Between(-60, 60));

    if (enemy.isBoss && enemy.glitchSkill) {
      const drop = this.glitchSkillGroup.create(enemy.sprite.x, enemy.sprite.y - 20, 'enemy');
      drop.setTint(0x9af0ff);
      drop.setScale(0.8);
      drop.setData('skill', enemy.glitchSkill);
      this.add.tween({ targets: drop, y: drop.y - 10, yoyo: true, repeat: -1, duration: 900 });
    }

    this.checkEncounterCleared();
  }

  checkEncounterCleared() {
    if (this.pendingLevelTransition) return;
    const activeEnemies = this.enemyInstances.filter((enemy) => enemy.health > 0);
    if (activeEnemies.length === 0) {
      this.pendingLevelTransition = true;
      this.time.delayedCall(1500, () => this.completeLevel());
    }
  }

  completeLevel() {
    this.pendingLevelTransition = false;
    this.level += 1;
    this.gems += 50;
    emitLevelComplete({ level: this.level, gems: this.gems });
    this.spawnEncounter();
  }

  update(time, delta) {
    if (!this.player) return;
    const deltaSeconds = delta / 1000;
    this.updatePlayer(deltaSeconds);
    this.updateGlitchSkill(deltaSeconds);
    this.updateProjectiles(deltaSeconds);
    this.updateEnemies(deltaSeconds);
    this.updateUI();
  }

  updatePlayer(deltaSeconds) {
    const speed = 220;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown) vx -= speed;
    if (this.cursors.right.isDown) vx += speed;
    if (this.cursors.up.isDown) vy -= speed;
    if (this.cursors.down.isDown) vy += speed;

    this.player.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.playerFacing.set(vx, vy).normalize();
    }

    this.playerMeleeCooldown = Math.max(0, this.playerMeleeCooldown - deltaSeconds);
    this.playerRangedCooldown = Math.max(0, this.playerRangedCooldown - deltaSeconds);
    this.playerGlitchCooldown = Math.max(0, this.playerGlitchCooldown - deltaSeconds);

    if (Phaser.Input.Keyboard.JustDown(this.keys.melee) && this.playerMeleeCooldown === 0) {
      this.playerMeleeCooldown = this.playerStats.meleeCooldown;
      this.performMeleeAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ranged) && this.playerRangedCooldown === 0) {
      this.playerRangedCooldown = this.playerStats.rangedCooldown;
      this.performRangedAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.glitch)) {
      this.useGlitchSkill();
    }
  }

  performMeleeAttack() {
    const range = 64;
    this.add.tween({ targets: this.player, scaleX: 1.1, scaleY: 0.9, yoyo: true, duration: 120 });
    for (const enemy of this.enemyInstances) {
      if (enemy.health <= 0) continue;
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.sprite.x,
        enemy.sprite.y
      );
      if (distance <= range) {
        this.damageEnemy(enemy, this.playerStats.meleeDamage);
      }
    }
  }

  performRangedAttack() {
    const speed = 360;
    const direction = this.playerFacing.clone().normalize();
    if (direction.length() === 0) {
      direction.set(1, 0);
    }
    const projectile = this.playerProjectiles.create(this.player.x, this.player.y, 'enemy');
    projectile.setScale(0.4);
    projectile.setTint(0x66ccff);
    projectile.body.setAllowGravity(false);
    projectile.setVelocity(direction.x * speed, direction.y * speed);
    projectile.setData('ttl', 1.6);
  }

  useGlitchSkill() {
    if (!this.glitchSkill || this.playerGlitchCooldown > 0) return;
    this.playerGlitchCooldown = this.glitchSkill.cooldown;
    this.time.delayedCall(200, () => this.cameras.main.shake(120, 0.01));
    const freezeDuration = 2.2;
    for (const enemy of this.enemyInstances) {
      if (enemy.health <= 0) continue;
      enemy.state = EnemyState.STUNNED;
      enemy.stunnedTimer = freezeDuration;
      enemy.sprite.setTint(0x7cf2ff);
      enemy.sprite.setVelocity(0, 0);
    }
  }

  updateGlitchSkill(deltaSeconds) {
    if (!this.glitchSkill) return;
    this.playerGlitchCooldown = Math.max(0, this.playerGlitchCooldown - deltaSeconds);
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

  updateEnemies(deltaSeconds) {
    const playerPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);
    for (const enemy of this.enemyInstances) {
      if (enemy.health <= 0) continue;

      if (enemy.stunnedTimer > 0) {
        enemy.stunnedTimer -= deltaSeconds;
        enemy.sprite.setVelocity(0, 0);
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

      const distance = Phaser.Math.Distance.BetweenPoints(playerPosition, enemy.sprite);
      const canSee = this.canEnemySeePlayer(enemy, playerPosition, distance);

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
          if (distance <= (enemy.variant.attack?.range ?? 48)) {
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
          this.performEnemyAttack(enemy, playerPosition, distance);
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

  canEnemySeePlayer(enemy, playerPosition, distance) {
    const radius = enemy.variant.sightRadius ?? 280;
    if (distance > radius) return false;
    const enemyPos = new Phaser.Math.Vector2(enemy.sprite.x, enemy.sprite.y);
    const toPlayer = playerPosition.clone().subtract(enemyPos).normalize();
    const facing = new Phaser.Math.Vector2(enemy.sprite.body.velocity.x, enemy.sprite.body.velocity.y);
    if (facing.length() === 0) facing.set(enemy.patrolDirection, 0);
    facing.normalize();
    const dot = Phaser.Math.Clamp(facing.dot(toPlayer), -1, 1);
    const angle = Phaser.Math.RadToDeg(Math.acos(dot));
    const cone = (enemy.variant.visionAngle ?? 120) / 2;
    return angle <= cone;
  }

  updateEnemyPatrol(enemy) {
    const speed = enemy.variant.speed ?? 100;
    const range = enemy.variant.patrolRange ?? 180;
    enemy.sprite.setVelocity(enemy.patrolDirection * speed, 0);
    const offset = enemy.sprite.x - enemy.patrolAnchor.x;
    if (Math.abs(offset) >= range / 2) {
      enemy.patrolDirection *= -1;
    }
  }

  updateEnemyChase(enemy, playerPosition) {
    const speed = enemy.variant.speed ?? 100;
    const direction = playerPosition.clone().subtract({ x: enemy.sprite.x, y: enemy.sprite.y }).normalize();
    enemy.sprite.setVelocity(direction.x * speed, direction.y * speed);
  }

  performEnemyAttack(enemy, playerPosition, distance) {
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
        const projectile = this.enemyProjectiles.create(enemy.sprite.x, enemy.sprite.y, 'enemy');
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
    } else if (distance <= (attack.range ?? 48)) {
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
    this.uiText.setText([
      `Level: ${this.level}${this.level % 10 === 0 ? ' - Boss' : ''}`,
      `HP: ${Math.round(this.playerStats.health)}/${this.playerStats.maxHealth}`,
      `Gems: ${this.gems}`,
      `Enemies Remaining: ${enemyCount}`,
      bossLine,
      glitchLine,
    ].filter(Boolean));
  }
}
