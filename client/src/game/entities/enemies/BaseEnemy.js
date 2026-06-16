import { ENEMY_DEPTH } from '../../constants.js';

export const AI_STATES = {
  IDLE: 'idle',
  PATROL: 'patrol',
  DETECT: 'detect',
  CHASE: 'chase',
  TELEGRAPH: 'telegraph',
  ATTACK: 'attack',
  RECOVER: 'recover',
  DEAD: 'dead',
};

export default class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, config.texture || 'enemy_chaser');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.config = config;
    this.enemyName = config.name || 'Enemy';
    this.maxHealth = config.maxHealth || 50;
    this.health = this.maxHealth;
    this.speed = config.speed || 110;
    this.attackDamage = config.attackDamage || 10;
    this.attackRange = config.attackRange || 40;
    this.attackCooldown = config.attackCooldown || 1200;
    this.sightRadius = config.sightRadius || 220;
    this.patrolRange = config.patrolRange || 150;
    this.knockbackResist = config.knockbackResist || 0;
    this.loot = config.loot || { gems: [1, 2], xp: [5, 10] };

    this.body.setSize(config.width || 20, config.height || 28);
    this.setDepth(ENEMY_DEPTH);
    this.setTint(config.color || 0xff66aa);

    this.aiState = AI_STATES.PATROL;
    this.patrolAnchor = x;
    this.patrolDir = 1;
    this.attackTimer = 0;
    this.recoverTimer = 0;
    this.detectTimer = 0;
    this.telegraphTimer = 0;

    this.facing = 1;
    this.glitchSlowed = false;
    this.speedScale = 1;
    this.aiCrashed = false;
    this.isAttacking = false;
    this.isDying = false;

    this.telegraphGraphic = null;
  }

  updateAI(time, delta, player, platforms) {
    if (!this.active || this.isDying) return;
    if (this.aiCrashed) return;

    const dt = delta / 1000;
    const effectiveSpeed = this.speed * (this.glitchSlowed ? (this.speedScale ?? 0.3) : 1);

    // Update attack cooldown
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.recoverTimer = Math.max(0, this.recoverTimer - delta);

    switch (this.aiState) {
      case AI_STATES.PATROL:
        this._patrol(effectiveSpeed, platforms);
        if (this._canSeePlayer(player)) {
          this.aiState = AI_STATES.DETECT;
          this.detectTimer = 300;
        }
        break;

      case AI_STATES.DETECT:
        this.detectTimer -= delta;
        if (this.detectTimer <= 0) {
          this.aiState = AI_STATES.CHASE;
        }
        break;

      case AI_STATES.CHASE:
        this._chasePlayer(player, effectiveSpeed, platforms);
        if (!this._canSeePlayer(player)) {
          this.aiState = AI_STATES.PATROL;
        } else if (this._inAttackRange(player) && this.attackTimer <= 0) {
          this.aiState = this.config.hasTelegraph ? AI_STATES.TELEGRAPH : AI_STATES.ATTACK;
          this.telegraphTimer = this.config.telegraphDuration || 0;
        }
        break;

      case AI_STATES.TELEGRAPH:
        this.body.setVelocityX(0);
        this.telegraphTimer -= delta;
        this._showTelegraph();
        if (this.telegraphTimer <= 0) {
          this._hideTelegraph();
          this.aiState = AI_STATES.ATTACK;
        }
        break;

      case AI_STATES.ATTACK:
        this._performAttack(player);
        this.attackTimer = this.attackCooldown;
        this.recoverTimer = 800;
        this.aiState = AI_STATES.RECOVER;
        break;

      case AI_STATES.RECOVER:
        this.body.setVelocityX(0);
        if (this.recoverTimer <= 0) {
          this.isAttacking = false;
          this.aiState = AI_STATES.CHASE;
        }
        break;

      case AI_STATES.DEAD:
        break;
    }
  }

  _patrol(speed, platforms) {
    // Ledge detection
    if (this._isAtLedge(platforms)) {
      this.patrolDir *= -1;
    }

    // Patrol range boundary
    const offset = this.x - this.patrolAnchor;
    if (Math.abs(offset) > this.patrolRange / 2) {
      this.patrolDir *= -1;
    }

    this.body.setVelocityX(this.patrolDir * speed);
    this.setFlipX(this.patrolDir < 0);
    this.facing = this.patrolDir;
  }

  _isAtLedge(platforms) {
    if (!platforms || !platforms.getChildren) return false;
    const checkX = this.x + this.patrolDir * (this.width / 2 + 6);
    const checkY = this.y + this.height / 2 + 8;

    for (const p of platforms.getChildren()) {
      if (!p.active) continue;
      const b = p.getBounds ? p.getBounds() : { left: p.x, right: p.x + p.width, top: p.y, bottom: p.y + p.height };
      if (checkX >= b.left && checkX <= b.right && checkY >= b.top && checkY <= b.bottom) {
        return false; // ground ahead
      }
    }
    return true; // no ground ahead — ledge!
  }

  _canSeePlayer(player) {
    if (!player || !player.active) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    return dist <= this.sightRadius;
  }

  _inAttackRange(player) {
    if (!player) return false;
    return Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= this.attackRange + player.width / 2;
  }

  _chasePlayer(player, speed, platforms) {
    if (!player) return;
    const dx = player.x - this.x;
    const dir = Math.sign(dx);

    // Only chase on same Y level — don't run off ledges
    if (this._isAtLedge(platforms) && dir === this.patrolDir) {
      this.body.setVelocityX(0);
    } else {
      this.body.setVelocityX(dir * speed);
      this.setFlipX(dir < 0);
      this.facing = dir;
    }
  }

  _performAttack(player) {
    if (!player) return;
    this.isAttacking = true;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => {
      if (!this.active) return;
      this.setTint(this.config.color || 0xff66aa);
      if (player.active && Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= this.attackRange + player.width) {
        player.takeDamage(this.attackDamage, { x: this.x, y: this.y });
      }
    });
  }

  _showTelegraph() {
    if (!this.telegraphGraphic) {
      this.telegraphGraphic = this.scene.add.circle(this.x, this.y - this.height / 2 - 12, 8, 0xff2200, 0.9)
        .setDepth(60);
    }
    this.telegraphGraphic.setPosition(this.x, this.y - this.height / 2 - 12);
    // Pulse
    const t = Date.now() % 400 / 400;
    this.telegraphGraphic.setAlpha(0.5 + t * 0.5);
  }

  _hideTelegraph() {
    if (this.telegraphGraphic) { this.telegraphGraphic.destroy(); this.telegraphGraphic = null; }
  }

  takeDamage(amount, sourcePos = null) {
    if (this.isDying || !this.active) return;

    this.health = Math.max(0, this.health - amount);

    // Hit flash
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active && !this.isDying) this.setTint(this.config.color || 0xff66aa);
    });

    // Knockback (reduced by resistance)
    if (sourcePos && this.knockbackResist < 1) {
      const dir = this.x > sourcePos.x ? 1 : -1;
      const kb = 180 * (1 - this.knockbackResist);
      this.body.setVelocityX(dir * kb);
      this.body.setVelocityY(-100);
    }

    // Interrupt patrol/idle with chase
    if (this.aiState === AI_STATES.PATROL || this.aiState === AI_STATES.IDLE) {
      this.aiState = AI_STATES.CHASE;
    }

    if (this.health <= 0) {
      this._die();
    }
  }

  _die() {
    if (this.isDying) return;
    this.isDying = true;
    this.aiState = AI_STATES.DEAD;
    this.body.setVelocityX(0);
    this.body.enable = false;
    this._hideTelegraph();

    // Death animation: red fade + shrink
    this.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this,
      alpha: 0, scaleX: 0.1, scaleY: 0.1,
      duration: 350,
      ease: 'Back.easeIn',
      onComplete: () => {
        this._dropLoot();
        this.scene.events.emit('enemy:died', { enemy: this });
        this.destroy();
      },
    });
  }

  _dropLoot() {
    const gems = Phaser.Math.Between(this.loot.gems[0], this.loot.gems[1]);
    const xp = Phaser.Math.Between(this.loot.xp[0], this.loot.xp[1]);
    this.scene.events.emit('enemy:loot', { x: this.x, y: this.y, gems, xp });
  }

  destroy(fromScene) {
    this._hideTelegraph();
    super.destroy(fromScene);
  }
}
