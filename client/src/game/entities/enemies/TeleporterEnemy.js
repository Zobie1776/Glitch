import BaseEnemy from './BaseEnemy.js';
import { ENEMY_CONFIGS } from '../../data/enemyConfig.js';
import { AI_STATES } from './BaseEnemy.js';

export default class TeleporterEnemy extends BaseEnemy {
  constructor(scene, x, y, overrides = {}) {
    super(scene, x, y, { ...ENEMY_CONFIGS.teleporter, ...overrides });
    this.chaseTimer = 0;
    this.arenaTriggerFired = false;
    this.teleportCooldown = 0;
  }

  updateAI(time, delta, player, platforms) {
    if (this.aiState === AI_STATES.CHASE && this.config.canTeleportArena && !this.arenaTriggerFired) {
      this.chaseTimer += delta;
      if (this.chaseTimer >= this.config.arenaChaseTime) {
        this._triggerArena(player);
      }
    }

    // Self-teleport periodically while chasing
    if (this.aiState === AI_STATES.CHASE && !this.arenaTriggerFired) {
      this.teleportCooldown = Math.max(0, this.teleportCooldown - delta);
      if (this.teleportCooldown <= 0 && player) {
        this._teleportNearPlayer(player);
        this.teleportCooldown = 3500;
      }
    }

    super.updateAI(time, delta, player, platforms);
  }

  _teleportNearPlayer(player) {
    const offsetX = Phaser.Math.Between(-120, 120);
    const newX = Phaser.Math.Clamp(player.x + offsetX, 50, this.scene.physics.world.bounds.width - 50);
    this.setAlpha(0.2);
    this.scene.time.delayedCall(300, () => {
      if (!this.active) return;
      this.setPosition(newX, player.y - 20);
      this.setAlpha(1);
      this.scene.cameras.main.flash(100, 255, 136, 238, false);
    });
  }

  _triggerArena(player) {
    this.arenaTriggerFired = true;
    this.scene.cameras.main.flash(300, 255, 0, 255, false);
    this.scene.cameras.main.shake(300, 0.03);
    this.scene.time.delayedCall(400, () => {
      this.scene.events.emit('arena:trigger', {
        returnLevel: this.scene.currentLevel,
        returnPos: { x: player.x, y: player.y },
      });
    });
  }
}
