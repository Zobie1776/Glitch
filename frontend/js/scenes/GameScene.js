import { LEVEL_DATA } from '../world/levels.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.registry.set('level', 1);
    this.registry.set('gems', 0);
    this.registry.set('player', { score: 0 });
  }

  create() {
    this.physics.world.setBounds(0, 0, 1920, 1080);
    this.add.image(0, 0, 'bg').setOrigin(0).setScrollFactor(0.3);

    this.platforms = this.physics.add.staticGroup();
    this.gems = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.createLevel(this.registry.get('level'));

    this.cameras.main.setBounds(0, 0, this.levelWidth, 1080);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.addPointer(1);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    this.createMobileControls();
  }

  createLevel(levelNumber) {
    const data = LEVEL_DATA[levelNumber - 1];
    if (!data) {
      this.scene.start('CreditsScene');
      return;
    }

    this.levelWidth = data.width;
    data.platforms.forEach((platform) => {
      const sprite = this.platforms
        .create(platform.x, platform.y, 'platform')
        .setScale(platform.scaleX, 1)
        .refreshBody();
      sprite.body.updateFromGameObject();
    });

    this.player = this.physics.add
      .sprite(data.playerSpawn.x, data.playerSpawn.y, 'player')
      .setBounce(0.2)
      .setCollideWorldBounds(true);

    this.player.body.setSize(24, 28);
    this.player.score = this.registry.get('player').score;

    data.gems.forEach((gem) => {
      const sprite = this.gems.create(gem.x, gem.y, 'player');
      sprite.setScale(0.5);
      sprite.setTint(0xffd400);
      sprite.body.setAllowGravity(false);
    });

    data.enemies.forEach((enemy) => {
      const sprite = this.enemies.create(enemy.x, enemy.y, 'player');
      sprite.setTint(0xff00aa);
      sprite.setBounce(0.4);
      sprite.setCollideWorldBounds(true);
      sprite.setVelocityX(enemy.patrolSpeed);
      sprite.patrol = enemy;
    });

    const portal = this.physics.add.staticImage(data.portal.x, data.portal.y, 'player');
    portal.setTint(0x33f5ff);
    portal.setScale(0.8, 1.6);
    this.physics.add.overlap(this.player, portal, () => this.advanceLevel(), null, this);
  }

  collectGem(player, gem) {
    gem.disableBody(true, true);
    const gemsCollected = this.registry.get('gems') + 1;
    this.registry.set('gems', gemsCollected);
    player.score += 100;
    this.registry.set('player', { score: player.score });
    this.sound.play('jump', { rate: 0.5, volume: 0.5 });
  }

  hitEnemy(player) {
    player.setVelocityY(-220);
    player.health = (player.health || 3) - 1;
    if (player.health <= 0) {
      this.restartLevel();
    }
  }

  advanceLevel() {
    const currentLevel = this.registry.get('level');
    if (currentLevel >= LEVEL_DATA.length) {
      this.scene.start('CreditsScene');
      return;
    }

    this.registry.set('level', currentLevel + 1);
    this.registry.set('playerState', 'levelComplete');
    this.resetScene();
  }

  restartLevel() {
    this.registry.set('playerState', 'respawn');
    this.resetScene();
  }

  resetScene() {
    this.scene.restart();
  }

  createMobileControls() {
    if (!this.game.device.input.touch) return;

    this.leftButton = this.add
      .zone(60, this.scale.height - 60, 120, 120)
      .setOrigin(0.5)
      .setInteractive();
    this.rightButton = this.add
      .zone(200, this.scale.height - 60, 120, 120)
      .setOrigin(0.5)
      .setInteractive();
    this.jumpButton = this.add
      .zone(this.scale.width - 80, this.scale.height - 80, 140, 140)
      .setOrigin(0.5)
      .setInteractive();

    const graphics = this.add.graphics({ fillStyle: { color: 0xffffff, alpha: 0.15 } });
    graphics.fillCircleShape(new Phaser.Geom.Circle(60, this.scale.height - 60, 60));
    graphics.fillCircleShape(new Phaser.Geom.Circle(200, this.scale.height - 60, 60));
    graphics.fillCircleShape(new Phaser.Geom.Circle(this.scale.width - 80, this.scale.height - 80, 70));

    this.leftButton.on('pointerdown', () => (this.isHoldingLeft = true));
    this.leftButton.on('pointerup', () => (this.isHoldingLeft = false));
    this.leftButton.on('pointerout', () => (this.isHoldingLeft = false));

    this.rightButton.on('pointerdown', () => (this.isHoldingRight = true));
    this.rightButton.on('pointerup', () => (this.isHoldingRight = false));
    this.rightButton.on('pointerout', () => (this.isHoldingRight = false));

    this.jumpButton.on('pointerdown', () => this.handleJump());
  }

  handleJump() {
    if (this.player.body.blocked.down) {
      this.player.setVelocityY(-380);
      this.player.canDoubleJump = true;
      this.sound.play('jump', { volume: 0.5 });
    } else if (this.player.canDoubleJump) {
      this.player.setVelocityY(-330);
      this.player.canDoubleJump = false;
      this.sound.play('jump', { rate: 1.4, volume: 0.5 });
    }
  }

  update() {
    if (!this.player) return;

    const speed = 240;

    if (this.cursors.left.isDown || this.isHoldingLeft) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.isHoldingRight) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.handleJump();
    }

    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.patrol) return;
      const { minX, maxX, patrolSpeed } = enemy.patrol;
      if (enemy.x <= minX || enemy.x >= maxX) {
        enemy.setVelocityX(-enemy.body.velocity.x || patrolSpeed);
      }
    });
  }
}
