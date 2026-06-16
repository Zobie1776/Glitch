import { getBossConfig } from '../data/bossConfig.js';
import { ENEMY_DEPTH } from '../constants.js';

export default class BossSystem {
  constructor(scene) {
    this.scene = scene;
    this.boss = null;
    this.bossConfig = null;
    this.currentPhaseIdx = 0;
    this.active = false;
    this.patternTimer = 0;
    this.projectiles = null;
    this.defeated = false;
    this.healthBar = null;
  }

  spawnBoss(level) {
    this.bossConfig = getBossConfig(level);
    this.currentPhaseIdx = 0;
    this.active = true;
    this.defeated = false;
    this.patternTimer = 0;

    const layout = this.scene.levelSystem.layout;
    const spawnPos = layout.bossSpawn || { x: 1280, y: 300 };

    // Create boss sprite
    this.boss = this.scene.physics.add.sprite(spawnPos.x, spawnPos.y, 'boss')
      .setTint(this.bossConfig.color)
      .setDepth(ENEMY_DEPTH + 5)
      .setScale(1.5);

    this.boss.maxHealth = this.bossConfig.maxHealth;
    this.boss.health = this.bossConfig.maxHealth;
    this.boss.speed = this.bossConfig.speed;
    this.boss.isDying = false;

    this.boss.body.setSize(this.bossConfig.width, this.bossConfig.height);

    // Collide with platforms
    this.scene.physics.add.collider(this.boss, this.scene.platforms);

    // Player overlap → damage
    this.scene.physics.add.overlap(this.scene.player, this.boss, () => {
      const phase = this._currentPhase();
      this.scene.player.takeDamage(phase.attackDamage / 4, { x: this.boss.x, y: this.boss.y });
    });

    // Projectiles group
    this.projectiles = this.scene.physics.add.group();
    this.scene.physics.add.overlap(this.scene.player, this.projectiles, (player, proj) => {
      player.takeDamage(proj.damage, { x: proj.x, y: proj.y });
      proj.destroy();
    });

    // Entrance effect
    this.scene.cameras.main.flash(500, 255, 50, 0, false);
    this.scene.cameras.main.shake(400, 0.03);

    // Boss health bar
    this.scene.events.emit('boss:spawned', { name: this.bossConfig.name, maxHealth: this.bossConfig.maxHealth });
  }

  update(time, delta) {
    if (!this.active || !this.boss || this.boss.isDying) return;
    const dt = delta / 1000;
    const player = this.scene.player;
    if (!player || player.isDead()) return;

    // Phase check
    this._checkPhaseTransition();

    // Move toward player (simple AI)
    const phase = this._currentPhase();
    const dx = player.x - this.boss.x;
    const dist = Math.abs(dx);

    if (dist > phase.attackRange) {
      const dir = Math.sign(dx);
      this.boss.body.setVelocityX(dir * this.boss.speed);
      this.boss.setFlipX(dir < 0);
    } else {
      this.boss.body.setVelocityX(0);
    }

    // Pattern execution
    this.patternTimer += delta;
    const interval = phase.patternInterval || 2000;
    if (this.patternTimer >= interval) {
      this.patternTimer = 0;
      this._executePattern(phase, player);
    }

    // Emit health update
    this.scene.events.emit('boss:healthUpdate', {
      health: this.boss.health,
      maxHealth: this.boss.maxHealth,
      phase: this.currentPhaseIdx + 1,
      totalPhases: this.bossConfig.phases.length,
    });
  }

  takeDamage(amount) {
    if (!this.boss || this.boss.isDying) return;
    this.boss.health = Math.max(0, this.boss.health - amount);

    // Hit flash
    this.boss.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => {
      if (this.boss && !this.boss.isDying) {
        this.boss.setTint(this._currentPhase().threshold < 0.5
          ? this.bossConfig.enragedColor
          : this.bossConfig.color);
      }
    });

    if (this.boss.health <= 0) {
      this._defeat();
    }
  }

  handlePlayerMeleeHit(player) {
    const phase = this._currentPhase();
    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.boss.x, this.boss.y);
    if (dist <= 120) {
      this.takeDamage(player._getMeleeDamage ? player._getMeleeDamage() : 20);
    }
  }

  _checkPhaseTransition() {
    const ratio = this.boss.health / this.boss.maxHealth;
    const phases = this.bossConfig.phases;

    for (let i = phases.length - 1; i > this.currentPhaseIdx; i--) {
      if (ratio <= phases[i].threshold) {
        this._enterPhase(i);
        break;
      }
    }
  }

  _enterPhase(idx) {
    this.currentPhaseIdx = idx;
    this.patternTimer = 0;
    const phase = this.bossConfig.phases[idx];

    this.scene.cameras.main.flash(400, 255, 80, 0, false);
    this.scene.cameras.main.shake(350, 0.035);

    if (this.boss) {
      this.boss.setTint(idx >= this.bossConfig.phases.length - 1
        ? this.bossConfig.enragedColor
        : this.bossConfig.color);
      // Scale up slightly per phase
      this.boss.setScale(1.5 + idx * 0.1);
    }

    this.scene.events.emit('boss:phaseChange', { phase: idx + 1, name: phase.name });
  }

  _currentPhase() {
    return this.bossConfig.phases[this.currentPhaseIdx];
  }

  _executePattern(phase, player) {
    const pattern = phase.pattern || 'meleeCharge';
    if (!phase.projectile) return;

    const { damage, speed, count, spread } = phase.projectile;
    const baseAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, player.x, player.y);
    const halfSpread = Phaser.Math.DegToRad(spread / 2);
    const step = count > 1 ? (Phaser.Math.DegToRad(spread) / (count - 1)) : 0;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle - halfSpread + step * i;
      const proj = this.scene.physics.add.sprite(this.boss.x, this.boss.y, 'projectile_enemy')
        .setDepth(18).setTint(this.bossConfig.color);
      this.scene.physics.velocityFromRotation(angle, speed, proj.body.velocity);
      proj.damage = damage;
      proj.body.setAllowGravity(false);
      this.projectiles.add(proj);

      // Auto-destroy after TTL
      this.scene.time.delayedCall(2800, () => { if (proj.active) proj.destroy(); });
    }

    // Visual
    this.boss.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.boss && !this.boss.isDying) this.boss.setTint(this.bossConfig.color);
    });
  }

  _defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.active = false;
    this.boss.isDying = true;

    // Death sequence
    this.boss.body.setVelocityX(0);
    this.scene.cameras.main.shake(600, 0.05);
    this.scene.cameras.main.flash(600, 255, 50, 0, false);

    this.scene.tweens.add({
      targets: this.boss,
      scaleX: 3, scaleY: 3, alpha: 0,
      duration: 800,
      ease: 'Power3',
      onComplete: () => {
        this.boss.destroy();
        this.boss = null;
        if (this.projectiles) { this.projectiles.clear(true, true); }
        this._dropReward();
        this.scene.events.emit('boss:defeated', {
          reward: this.bossConfig.reward,
          bossName: this.bossConfig.name,
        });
      },
    });
  }

  _dropReward() {
    const reward = this.bossConfig.reward;
    if (!reward) return;
    // Show reward text
    const layout = this.scene.levelSystem.layout;
    const pos = layout.bossSpawn || { x: 1280, y: 300 };
    const txt = this.scene.add.text(pos.x, pos.y - 60,
      `GLITCH UNLOCKED:\n${reward.toUpperCase()}`, {
        fontSize: '16px', fill: '#00ffee', align: 'center',
        backgroundColor: '#00000099', padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setDepth(90);
    this.scene.tweens.add({ targets: txt, y: '-=40', alpha: { from: 1, to: 0 }, duration: 3000 });

    // Unlock in glitch system
    if (this.scene.glitchSystem) {
      this.scene.glitchSystem.unlockGlitch(reward);
    }
  }
}
