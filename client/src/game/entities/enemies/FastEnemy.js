import BaseEnemy from './BaseEnemy.js';
import { ENEMY_CONFIGS } from '../../data/enemyConfig.js';
import { AI_STATES } from './BaseEnemy.js';

export default class FastEnemy extends BaseEnemy {
  constructor(scene, x, y, overrides = {}) {
    super(scene, x, y, { ...ENEMY_CONFIGS.fastEnemy, ...overrides });
    this.dashCooldown = 0;
    this.dashing = false;
  }

  updateAI(time, delta, player, platforms) {
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    super.updateAI(time, delta, player, platforms);
  }

  _chasePlayer(player, speed, platforms) {
    if (!player) return;
    // Attempt dash when close enough and not on cooldown
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist < 200 && dist > 60 && this.dashCooldown <= 0 && !this.dashing) {
      this._dash(player);
    } else {
      super._chasePlayer(player, speed, platforms);
    }
  }

  _dash(player) {
    this.dashing = true;
    this.dashCooldown = this.config.dashCooldown || 3000;
    const dir = Math.sign(player.x - this.x);
    this.body.setVelocityX(dir * (this.config.dashSpeed || 450));
    this.setTint(0xffffff);
    this.scene.time.delayedCall(200, () => {
      if (this.active) {
        this.dashing = false;
        this.setTint(this.config.color || 0xee44ff);
      }
    });
  }
}
