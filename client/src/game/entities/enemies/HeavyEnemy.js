import BaseEnemy from './BaseEnemy.js';
import { ENEMY_CONFIGS } from '../../data/enemyConfig.js';
import { AI_STATES } from './BaseEnemy.js';

export default class HeavyEnemy extends BaseEnemy {
  constructor(scene, x, y, overrides = {}) {
    super(scene, x, y, { ...ENEMY_CONFIGS.heavyEnemy, ...overrides });
    this.shockwaveTimer = 0;
  }

  updateAI(time, delta, player, platforms) {
    super.updateAI(time, delta, player, platforms);
  }

  _performAttack(player) {
    if (!player) return;
    this.isAttacking = true;

    // Ground slam shockwave
    this.scene.cameras.main.shake(200, 0.025);

    // Shockwave visual
    const wave = this.scene.add.circle(this.x, this.y + this.height / 2, 10, 0xcc2266, 0.7)
      .setDepth(48);
    this.scene.tweens.add({
      targets: wave,
      radius: 90, alpha: 0, duration: 400,
      onUpdate: () => {
        if (player.active && Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) < wave.radius) {
          if (!wave._hit) { wave._hit = true; player.takeDamage(this.attackDamage, { x: this.x, y: this.y }); }
        }
      },
      onComplete: () => wave.destroy(),
    });
  }
}
