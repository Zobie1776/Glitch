import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.level = data.level || 1;
    this.gems = data.gems || 0;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x080005);

    // Static noise overlay
    const noise = this.add.graphics().setDepth(5).setAlpha(0.12);
    for (let i = 0; i < 1200; i++) {
      noise.fillStyle(0xffffff, Math.random());
      noise.fillRect(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 3),
        Phaser.Math.Between(1, 3),
      );
    }

    // Scanlines
    const scan = this.add.graphics().setDepth(6).setAlpha(0.07);
    scan.fillStyle(0x000000, 1);
    for (let y = 0; y < GAME_HEIGHT; y += 4) scan.fillRect(0, y, GAME_WIDTH, 2);

    // Glitch text effect — "SYSTEM FAILURE"
    this._failText = this.add.text(cx, cy - 100, 'SYSTEM FAILURE', {
      fontSize: '44px', fill: '#ff0000', fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 50, 'CORRUPTION SPREAD. YOU WERE CONSUMED.', {
      fontSize: '11px', fill: '#ff444488', letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.rectangle(cx, cy - 30, 360, 1, 0xff0000, 0.3);

    // Stats
    this.add.text(cx, cy, `REACHED:  LEVEL ${this.level}`, {
      fontSize: '16px', fill: '#ff4444',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 30, `GEMS COLLECTED:  ${this.gems}`, {
      fontSize: '14px', fill: '#ff444488',
    }).setOrigin(0.5);

    // Buttons
    const retryBtn = this._makeButton(cx, cy + 100, '[ RETRY LEVEL ]', 0xff4444);
    const menuBtn = this._makeButton(cx, cy + 145, '[ MAIN MENU ]', 0x884444);

    retryBtn.on('pointerdown', () => {
      this.cameras.main.flash(200, 255, 0, 0, false);
      this.time.delayedCall(150, () => this.scene.start('GameScene', { level: this.level }));
    });
    menuBtn.on('pointerdown', () => {
      this.time.delayedCall(150, () => this.scene.start('MainMenuScene'));
    });

    // Glitch effect on fail text
    this._startGlitch();
  }

  _makeButton(x, y, label, color) {
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    const btn = this.add.text(x, y, label, {
      fontSize: '18px', fill: hexColor, padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ fill: '#ffffff', backgroundColor: '#ff000022' }));
    btn.on('pointerout', () => btn.setStyle({ fill: hexColor, backgroundColor: undefined }));
    return btn;
  }

  _startGlitch() {
    const glitchBars = [];
    for (let i = 0; i < 3; i++) {
      const bar = this.add.rectangle(
        Phaser.Math.Between(0, GAME_WIDTH / 2),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(100, 400), 8,
        0xff0000, 0.4
      ).setDepth(10);
      glitchBars.push(bar);
    }

    this.time.addEvent({
      delay: 300, repeat: -1,
      callback: () => {
        glitchBars.forEach(b => {
          b.setY(Phaser.Math.Between(30, GAME_HEIGHT - 30));
          b.setX(Phaser.Math.Between(-200, GAME_WIDTH));
          b.setAlpha(Math.random() * 0.4);
          b.setDisplaySize(Phaser.Math.Between(80, 400), Phaser.Math.Between(2, 10));
        });
        // Text shift
        this._failText.setX(GAME_WIDTH / 2 + Phaser.Math.Between(-4, 4));
      },
    });
  }
}
