import {
  PLAYER_SPEED, PLAYER_JUMP, PLAYER_DOUBLE_JUMP,
  PLAYER_MELEE_RANGE, PLAYER_MELEE_DAMAGE, PLAYER_MELEE_COOLDOWN,
  PLAYER_IFRAME_DURATION, PLAYER_KNOCKBACK_X, PLAYER_KNOCKBACK_Y,
  HITSTOP_MS, PLAYER_DEPTH, XP_BASE, XP_SCALE,
} from '../constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, glitchSystem) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.glitchSystem = glitchSystem;

    // Physics
    this.body.setSize(24, 36);
    this.body.setMaxVelocityY(1200);
    this.setDepth(PLAYER_DEPTH);

    // Stats
    this.maxHealth = 100;
    this.health = 100;
    this.level = 1;
    this.xp = 0;
    this.gems = 0;

    // Movement
    this.availableJumps = 2;
    this.speedMultiplier = 1;
    this.facing = 1;

    // Melee
    this.meleeCooldown = 0;
    this.meleeActive = false;
    this.slashGraphic = null;
    this.critStacks = 0;
    this.critMultiplier = 1;

    // Combat state
    this.iframes = 0;
    this.invincible = false;
    this.shield = 0;
    this.phasing = false;
    this.projectileImmune = false;
    this.hitstopActive = false;

    // Glitch state
    this.speedScale = 1;

    // Position history for Time Loop glitch (5s at 60fps = 300 entries)
    this.positionHistory = [];
    this.historyTimer = 0;

    // State
    this.state = 'idle'; // idle | run | jump | fall | attack | hurt | dead | glitch-active

    // Visual
    this.setTint(0x00ffee);
  }

  update(delta, input) {
    if (this.isDead() || this.hitstopActive) return;

    const dt = delta / 1000;

    this.iframes = Math.max(0, this.iframes - dt);
    this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);

    this._handleMovement(input, dt);
    this._handleJump(input);
    this._handleAttack(input);
    this._updateAnimation();
    this._recordHistory(dt);
  }

  _handleMovement(input, dt) {
    const speed = PLAYER_SPEED * this.speedMultiplier;
    if (input.left) {
      this.body.setVelocityX(-speed);
      this.facing = -1;
      this.setFlipX(true);
    } else if (input.right) {
      this.body.setVelocityX(speed);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      // Apply friction
      this.body.setVelocityX(this.body.velocity.x * (this.body.blocked.down ? 0.75 : 0.92));
    }
  }

  _handleJump(input) {
    if (this.body.blocked.down) {
      this.availableJumps = 2;
    }

    if (input.jumpJustPressed && this.availableJumps > 0) {
      const force = this.availableJumps === 2 ? PLAYER_JUMP : PLAYER_DOUBLE_JUMP;
      this.body.setVelocityY(force);
      this.availableJumps--;
      this.state = 'jump';
    }
  }

  _handleAttack(input) {
    if (input.attackJustPressed && this.meleeCooldown <= 0 && !this.meleeActive) {
      this.meleeCooldown = PLAYER_MELEE_COOLDOWN;
      this.meleeActive = true;
      this.state = 'attack';
      this._doMeleeSlash();
      this.scene.time.delayedCall(250, () => { this.meleeActive = false; });
    }
  }

  _doMeleeSlash() {
    const damage = this._getMeleeDamage();
    const offsetX = this.facing * (this.width / 2 + PLAYER_MELEE_RANGE / 2);
    const hitX = this.x + offsetX;
    const hitY = this.y;

    // Visual slash
    this._drawSlash(hitX, hitY);

    // Hit enemies in range
    if (this.scene.enemies) {
      this.scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const dx = Math.abs(enemy.x - hitX);
        const dy = Math.abs(enemy.y - hitY);
        if (dx < PLAYER_MELEE_RANGE + enemy.width / 2 && dy < 50) {
          enemy.takeDamage(damage, { x: this.x, y: this.y });
          this._applyHitstop();
        }
      });
    }

    // Consume crit stack
    if (this.critStacks > 0) {
      this.critStacks--;
      if (this.critStacks <= 0) this.critMultiplier = 1;
    }
  }

  _getMeleeDamage() {
    const base = PLAYER_MELEE_DAMAGE;
    if (this.critStacks > 0) return Math.round(base * this.critMultiplier);
    return base;
  }

  _drawSlash(x, y) {
    if (this.slashGraphic) this.slashGraphic.destroy();
    const g = this.scene.add.graphics().setDepth(50);
    g.lineStyle(3, 0x00ffee, 1);
    g.strokeCircle(x, y, 30);
    g.lineBetween(x - this.facing * 10, y - 20, x + this.facing * 30, y + 20);
    this.slashGraphic = g;
    this.scene.tweens.add({
      targets: g, alpha: 0, scaleX: 1.4, scaleY: 1.4,
      duration: 200,
      onComplete: () => { g.destroy(); this.slashGraphic = null; },
    });
  }

  _applyHitstop() {
    if (this.hitstopActive) return;
    this.hitstopActive = true;
    this.scene.time.delayedCall(HITSTOP_MS, () => { this.hitstopActive = false; });
  }

  _updateAnimation() {
    if (this.isDead()) { this.state = 'dead'; return; }
    if (this.meleeActive) { this.state = 'attack'; return; }
    if (!this.body.blocked.down) {
      this.state = this.body.velocity.y < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.body.velocity.x) > 10) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }
  }

  _recordHistory(dt) {
    this.historyTimer += dt;
    if (this.historyTimer >= 0.1) {
      this.historyTimer = 0;
      this.positionHistory.push({ x: this.x, y: this.y });
      if (this.positionHistory.length > 50) this.positionHistory.shift();
    }
  }

  takeDamage(amount, sourcePos = null) {
    if (this.iframes > 0 || this.invincible) return false;
    if (this.shield > 0) {
      this.shield--;
      this.scene.cameras.main.flash(120, 0, 255, 255, false);
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    this.iframes = PLAYER_IFRAME_DURATION;
    this.state = 'hurt';

    // Knockback
    if (sourcePos) {
      const dir = this.x > sourcePos.x ? 1 : -1;
      this.body.setVelocityX(dir * PLAYER_KNOCKBACK_X);
      this.body.setVelocityY(PLAYER_KNOCKBACK_Y);
    }

    // Visual feedback
    this.setTint(0xff4444);
    this.scene.time.delayedCall(200, () => {
      if (!this.isDead()) this.setTint(0x00ffee);
    });
    this.scene.cameras.main.shake(120, 0.015);

    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  gainXP(amount) {
    this.xp += amount;
    const needed = XP_BASE + (this.level - 1) * XP_SCALE;
    if (this.xp >= needed) {
      this.xp -= needed;
      this.level++;
      this.maxHealth += 10;
      this.health = this.maxHealth;
      this.scene.events.emit('player:levelUp', { level: this.level });
    }
    this.scene.events.emit('player:xpChanged', { xp: this.xp, level: this.level });
  }

  collectGem(amount) {
    this.gems += amount;
    this.scene.events.emit('player:gemChanged', { gems: this.gems });
  }

  isDead() {
    return this.health <= 0;
  }

  getState() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      level: this.level,
      xp: this.xp,
      gems: this.gems,
    };
  }

  destroy(fromScene) {
    if (this.slashGraphic) this.slashGraphic.destroy();
    super.destroy(fromScene);
  }
}
