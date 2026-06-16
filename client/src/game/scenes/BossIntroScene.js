import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { getBossConfig } from '../data/bossConfig.js';

export default class BossIntroScene extends Phaser.Scene {
  constructor() { super({ key: 'BossIntroScene' }); }

  init(data) {
    this.bossLevel = data.bossLevel;
    this.passThrough = data;
  }

  create() {
    const config = getBossConfig(this.bossLevel);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const bossColor = config.color;
    const hexColor = '#' + bossColor.toString(16).padStart(6, '0');

    // Full black bg
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

    // Boss silhouette (large rectangle pulse)
    const silhouette = this.add.rectangle(cx, cy + 40, config.width * 2.5, config.height * 2.5, bossColor, 0)
      .setStrokeStyle(2, bossColor, 0);

    // Scanlines
    const g = this.add.graphics().setAlpha(0.06).setDepth(5);
    g.fillStyle(0x000000, 1);
    for (let y = 0; y < GAME_HEIGHT; y += 4) g.fillRect(0, y, GAME_WIDTH, 2);

    // Warning text
    const warnText = this.add.text(cx, cy - 130, '⚠ WARNING ⚠', {
      fontSize: '14px', fill: '#ff2200', letterSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    // Boss name reveal (letter by letter)
    const nameText = this.add.text(cx, cy - 80, '', {
      fontSize: '42px', fill: hexColor, fontStyle: 'bold', letterSpacing: 6,
    }).setOrigin(0.5);

    const introText = this.add.text(cx, cy - 20, config.introText || 'BOSS INCOMING', {
      fontSize: '13px', fill: '#ffffff88', letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    // Phase count
    const phaseText = this.add.text(cx, cy + 20, `${config.phases.length} PHASES`, {
      fontSize: '11px', fill: '#ff880088', letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0);

    const continueText = this.add.text(cx, GAME_HEIGHT - 40, 'PRESS ANY KEY TO CONTINUE', {
      fontSize: '11px', fill: '#ffffff33', letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0);

    // Animation sequence
    this.tweens.add({ targets: warnText, alpha: 1, duration: 400, delay: 200 });
    this.cameras.main.flash(300, 255, 0, 0, false);

    // Type out name
    const nameStr = config.name;
    let charIdx = 0;
    this.time.addEvent({
      delay: 80, repeat: nameStr.length - 1,
      callback: () => {
        nameText.setText(nameStr.substring(0, charIdx + 1));
        charIdx++;
        // Glitch flicker
        if (Math.random() < 0.3) {
          nameText.setTint(0xffffff);
          this.time.delayedCall(40, () => nameText.setTint(bossColor));
        }
        this.cameras.main.shake(30, 0.005);
      },
    });

    this.time.delayedCall(nameStr.length * 80 + 300, () => {
      this.tweens.add({ targets: [introText, phaseText], alpha: 1, duration: 500 });
      this.tweens.add({ targets: silhouette, alpha: 0.15, fillAlpha: 0.1, strokeAlpha: 0.8, duration: 800 });
      // Pulse silhouette
      this.tweens.add({
        targets: silhouette, scaleX: 1.05, scaleY: 1.05, duration: 500, yoyo: true, repeat: -1,
      });
    });

    this.time.delayedCall(nameStr.length * 80 + 1200, () => {
      this.tweens.add({ targets: continueText, alpha: 1, duration: 500 });
      this._ready = true;
    });

    // Input to skip/continue
    this.input.keyboard.once('keydown', () => {
      if (this._ready) this._launchGame();
    });
    this.input.once('pointerdown', () => {
      if (this._ready) this._launchGame();
    });

    // Auto-continue after 6s
    this.time.delayedCall(7000, () => this._launchGame());
  }

  _launchGame() {
    if (this._launched) return;
    this._launched = true;
    this.cameras.main.flash(500, 255, 50, 0, false);
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene', {
        level: this.bossLevel,
        bossMode: true,
        glitches: this.passThrough.glitches,
        playerData: this.passThrough.playerData,
        fromSave: false,
      });
    });
  }
}
