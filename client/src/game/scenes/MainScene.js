import Phaser from 'phaser';
import { emitLevelComplete, emitPlayerDeath } from '../events.js';
import { loadProgress } from '../../state/saveManager.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.player = null;
    this.enemies = null;
    this.level = 1;
    this.gems = 0;
  }

  async init() {
    const progress = await loadProgress();
    if (progress) {
      this.level = progress.level;
      this.gems = progress.gems;
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

    this.cursors = this.input.keyboard.createCursorKeys();

    this.enemies = this.physics.add.group();
    this.spawnWave();

    this.gemsGroup = this.physics.add.group();

    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, null, this);
    this.physics.add.overlap(this.player, this.gemsGroup, this.collectGem, null, this);

    this.levelTimer = this.time.addEvent({
      delay: 60_000,
      callback: this.completeLevel,
      callbackScope: this
    });
  }

  spawnWave() {
    for (let i = 0; i < 5 + this.level; i += 1) {
      const enemy = this.enemies.create(Phaser.Math.Between(50, 910), Phaser.Math.Between(50, 490), 'enemy');
      enemy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
      enemy.setBounce(1).setCollideWorldBounds(true);
    }
  }

  handlePlayerHit() {
    emitPlayerDeath({ level: this.level, gems: this.gems });
    this.scene.restart();
  }

  collectGem(_player, gem) {
    gem.destroy();
    this.gems += 10;
  }

  completeLevel() {
    this.level += 1;
    this.gems += 100;
    emitLevelComplete({ level: this.level, gems: this.gems });
    this.spawnWave();
    this.time.removeEvent(this.levelTimer);
    this.levelTimer = this.time.addEvent({ delay: 60_000, callback: this.completeLevel, callbackScope: this });
  }

  update() {
    if (!this.player) return;

    const speed = 200;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }

    if (Phaser.Math.Between(0, 100) > 98 && this.gemsGroup.countActive(true) < 3) {
      const gem = this.gemsGroup.create(Phaser.Math.Between(50, 910), Phaser.Math.Between(50, 490), 'gem');
      gem.setBounce(1).setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
    }
  }
}
