import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x05030a);

    // Title
    this.add.text(cx, cy - 80, 'GLITCH//RIFT', {
      fontSize: '32px', fill: '#00ffee', fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5);

    // Loading bar background
    const barBg = this.add.rectangle(cx, cy, 300, 12, 0x112233);
    const barFill = this.add.rectangle(cx - 150, cy, 0, 12, 0x00ffee).setOrigin(0, 0.5);
    const loadText = this.add.text(cx, cy + 24, 'INITIALIZING...', {
      fontSize: '11px', fill: '#00ffee88',
    }).setOrigin(0.5);

    // Scan line effect
    const scanLine = this.add.rectangle(cx, cy - 80, GAME_WIDTH, 2, 0x00ffee, 0.15).setScrollFactor(0);
    this.tweens.add({
      targets: scanLine, y: cy + 80, duration: 800, yoyo: true, repeat: -1, ease: 'Linear',
    });

    // Animate bar then go to MainMenu
    this.tweens.add({
      targets: barFill,
      displayWidth: 300,
      duration: 1200,
      ease: 'Sine.easeInOut',
      onUpdate: (t) => {
        const p = Math.floor(t.progress * 100);
        loadText.setText(`LOADING... ${p}%`);
        barFill.displayWidth = t.progress * 300;
      },
      onComplete: () => {
        loadText.setText('READY');
        this.time.delayedCall(300, () => this.scene.start('MainMenuScene'));
      },
    });
  }
}
